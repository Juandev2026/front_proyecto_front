import React, { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { AcademicCapIcon, FilterIcon } from '@heroicons/react/outline';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuth } from '../hooks/useAuth';
import PremiumLayout from '../layouts/PremiumLayout';
import { ExamenLogin, authService } from '../services/authService';
import { preguntaService } from '../services/preguntaService';

// ----- Types derived from login examenes -----
interface FilterOption {
  id: number;
  nombre: string;
}

const SimulacrosDirectivosPage = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  // Examenes from user-filters API
  const [loginExamenes, setLoginExamenes] = useState<ExamenLogin[]>([]);

  // Current Selection State
  const [selectedTipoExamenId] = useState<string>('3'); // Directivos
  const [selectedModalidadId, setSelectedModalidadId] = useState<string>('');
  const [selectedNivelId, setSelectedNivelId] = useState<string>('');
  const [selectedEspecialidadId, setSelectedEspecialidadId] =
    useState<string>('');
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  // State for per-year classification selections
  const [yearSelections, setYearSelections] = useState<
    Record<string, Record<string, boolean>>
  >({});

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Fetch filters from API
  useEffect(() => {
    const fetchFilters = async () => {
      if (isAuthenticated && user?.id) {
        try {
          setIsLoading(true);
          const response = await authService.getUserFilters(user.id);
          setLoginExamenes(response.examenes);
        } catch (error) {
          console.error('Error fetching user filters:', error);
          const stored = localStorage.getItem('loginExamenes');
          if (stored) {
            setLoginExamenes(JSON.parse(stored));
          }
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchFilters();
  }, [isAuthenticated, user?.id]);

  // ---------- Memoized Derived Options ----------

  const filteredExams = useMemo(() => {
    return loginExamenes.filter((e) => String(e.tipoExamenId) === selectedTipoExamenId);
  }, [loginExamenes, selectedTipoExamenId]);

  const modalidadesData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    filteredExams.forEach((e) => {
      if (!map.has(e.modalidadId)) {
        map.set(e.modalidadId, {
          id: e.modalidadId,
          nombre: e.modalidadNombre,
        });
      }
    });
    return Array.from(map.values())
      .filter(
        (m) =>
          m.nombre &&
          m.nombre !== 'string' &&
          m.nombre.toUpperCase() !== 'NINGUNO'
      )
      .sort((a, b) => {
        const orderValues = [
          'EDUCACIÓN BÁSICA REGULAR',
          'EDUCACIÓN BÁSICA ALTERNATIVA',
          'EDUCACIÓN BÁSICA ESPECIAL',
          'CETPRO',
        ];
        const nameA = (a.nombre || '').toUpperCase();
        const nameB = (b.nombre || '').toUpperCase();
        const idxA = orderValues.findIndex((o) => nameA.includes(o));
        const idxB = orderValues.findIndex((o) => nameB.includes(o));
        const valA = idxA === -1 ? 99 : idxA;
        const valB = idxB === -1 ? 99 : idxB;
        if (valA !== valB) return valA - valB;
        return nameA.localeCompare(nameB);
      });
  }, [filteredExams]);

  // Auto-select modality
  useEffect(() => {
    if (modalidadesData.length === 1 && !selectedModalidadId && modalidadesData[0]) {
      setSelectedModalidadId(String(modalidadesData[0].id));
    }
  }, [modalidadesData, selectedModalidadId]);

  const nivelesData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    filteredExams
      .filter((e) => !selectedModalidadId || String(e.modalidadId) === selectedModalidadId)
      .forEach((e) => {
        if (!map.has(e.nivelId)) {
          map.set(e.nivelId, { id: e.nivelId, nombre: e.nivelNombre });
        }
      });
    return Array.from(map.values()).filter(
      (n) => n.nombre && n.nombre.toUpperCase() !== 'NINGUNO' && n.nombre !== 'string'
    );
  }, [filteredExams, selectedModalidadId]);

  // Auto-select level
  useEffect(() => {
    if (nivelesData.length === 1 && !selectedNivelId && selectedModalidadId && nivelesData[0]) {
      setSelectedNivelId(String(nivelesData[0].id));
    }
  }, [nivelesData, selectedNivelId, selectedModalidadId]);

  const especialidadesData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    filteredExams
      .filter(
        (e) =>
          (!selectedModalidadId || String(e.modalidadId) === selectedModalidadId) &&
          (!selectedNivelId || String(e.nivelId) === selectedNivelId)
      )
      .filter((e) => e.especialidadId !== null && e.especialidadNombre !== null)
      .forEach((e) => {
        if (!map.has(e.especialidadId!)) {
          map.set(e.especialidadId!, {
            id: e.especialidadId!,
            nombre: e.especialidadNombre!,
          });
        }
      });
    return Array.from(map.values()).filter(
      (e) => e.nombre && e.nombre !== 'string' && e.nombre.toLowerCase() !== 'null'
    );
  }, [filteredExams, selectedModalidadId, selectedNivelId]);

  // Auto-select specialty
  useEffect(() => {
    if (especialidadesData.length === 1 && !selectedEspecialidadId && selectedNivelId && especialidadesData[0]) {
      setSelectedEspecialidadId(String(especialidadesData[0].id));
    }
  }, [especialidadesData, selectedEspecialidadId, selectedNivelId]);

  const aniosData = useMemo(() => {
    const set = new Set<string>();
    filteredExams
      .filter(
        (e) =>
          (!selectedModalidadId || String(e.modalidadId) === selectedModalidadId) &&
          (!selectedNivelId || String(e.nivelId) === selectedNivelId) &&
          (!selectedEspecialidadId || String(e.especialidadId) === selectedEspecialidadId)
      )
      .forEach((e) => {
        if (e.years && e.years.length > 0) {
          e.years.forEach((y) => set.add(String(y.year)));
        } else if (e.year !== undefined && e.year !== null) {
          set.add(String(e.year));
        }
      });
    return Array.from(set)
      .filter((y) => y !== 'null' && y !== 'undefined')
      .map((y) => (y === '0' ? 'Único' : y))
      .filter((y) => y !== '2027' && y !== '2026' && y !== 'Único')
      .sort((a, b) => {
        if (a === 'Único') return 1;
        if (b === 'Único') return -1;
        return Number(b) - Number(a);
      });
  }, [filteredExams, selectedModalidadId, selectedNivelId, selectedEspecialidadId]);

  // ---------- Pre-calculated Metadata per Year (Performance) ----------
  const allYearsMetadata = useMemo(() => {
    if (!selectedModalidadId || !aniosData.length) return {};

    const metaMap: Record<string, any[]> = {};

    aniosData.forEach((year) => {
      const aggCountMap: Record<
        string,
        {
          cantidad: number;
          id: number;
          puntos: number;
          tiempo: number;
          minimo: number;
        }
      > = {};

      const exams = filteredExams.filter(
        (e) =>
          String(e.modalidadId) === selectedModalidadId &&
          (!selectedNivelId || String(e.nivelId) === selectedNivelId) &&
          (selectedEspecialidadId
            ? String(e.especialidadId) === selectedEspecialidadId
            : true) &&
          ((year === 'Único' && (e.year === '0' || Number(e.year) === 0)) ||
            String(e.year) === year ||
            e.years?.some((y) => String(y.year) === year))
      );

      exams.forEach((exam) => {
        if (exam.clasificaciones) {
          exam.clasificaciones.forEach((item) => {
            const name = item.clasificacionNombre;
            if (name) {
              let cantidadExacta = 0;
              const isUnico = year === 'Único';
              if (isUnico || !item.years || item.years.length === 0) {
                cantidadExacta = item.cantidadPreguntas;
              } else {
                const yrData = item.years.find(
                  (y: any) => String(y.year) === year
                );
                cantidadExacta = yrData ? yrData.cantidadPreguntas : 0;
              }

              if (!aggCountMap[name]) {
                aggCountMap[name] = {
                  cantidad: cantidadExacta,
                  id: item.clasificacionId,
                  puntos: item.puntos || 0,
                  tiempo: item.tiempoPregunta || 0,
                  minimo: item.minimo || 0,
                };
              } else {
                aggCountMap[name].cantidad += cantidadExacta;
              }
            }
          });
        }
      });

      metaMap[year] = Object.entries(aggCountMap).map(([name, data]) => ({
        name,
        ...data,
      }));
    });

    return metaMap;
  }, [
    aniosData,
    filteredExams,
    selectedModalidadId,
    selectedNivelId,
    selectedEspecialidadId,
  ]);

  // ---------- Handlers ----------

  const handleYearToggle = (year: string) => {
    setSelectedYears((prev) => {
      const isSelected = prev.includes(year);
      if (isSelected) {
        const next = prev.filter((y) => y !== year);
        setYearSelections((prevSel) => {
          const nextSel = { ...prevSel };
          delete nextSel[year];
          return nextSel;
        });
        return next;
      }
      const next = [...prev, year];
      // Initialize classifications for this year
      const meta = allYearsMetadata[year] || [];
      const initialTypeSelections: Record<string, boolean> = {};
      meta.forEach((m) => {
        if (m.cantidad > 0) initialTypeSelections[m.name] = true;
      });
      setYearSelections((prevSel) => ({
        ...prevSel,
        [year]: initialTypeSelections,
      }));
      return next;
    });
  };

  const handleTypeToggle = (year: string, typeName: string) => {
    setYearSelections((prev) => ({
      ...prev,
      [year]: {
        ...prev[year],
        [typeName]: !prev[year]?.[typeName],
      },
    }));
  };



  const handleClear = () => {
    setSelectedModalidadId('');
    setSelectedNivelId('');
    setSelectedEspecialidadId('');
    setSelectedYears([]);
    setYearSelections({});
  };

  const handleConfirm = async () => {
    if (!selectedModalidadId || selectedYears.length < 2) return;

    try {
      setIsLoading(true);

      const sampleExam = filteredExams.find(
        (e) =>
          String(e.modalidadId) === selectedModalidadId &&
          (!selectedNivelId || String(e.nivelId) === selectedNivelId) &&
          (selectedEspecialidadId
            ? String(e.especialidadId) === selectedEspecialidadId
            : true)
      );

      if (!sampleExam) {
        alert('Error: No se encontró la metadata del examen.');
        setIsLoading(false);
        return;
      }

      const yearFilters = selectedYears.map((year) => {
        const yearMeta = allYearsMetadata[year] || [];
        const activeIds = yearMeta
          .filter((m) => yearSelections[year]?.[m.name] === true)
          .map((m) => m.id);

        return {
          year: year === 'Único' ? '0' : year,
          clasificacionIds: activeIds,
        };
      });

      const payload = {
        tipoExamenId: sampleExam.tipoExamenId,
        fuenteId: sampleExam.fuenteId || 0,
        modalidadId: sampleExam.modalidadId,
        nivelId: sampleExam.nivelId || (nivelesData.length === 1 ? (nivelesData[0]?.id || 0) : 0),
        especialidadId: sampleExam.especialidadId || 0,
        yearFilters,
      };

      let questions =
        await preguntaService.getPreguntasByFilterMultiYear(payload);

      if (questions.length > 0) {
        // 1. Filtrar primero por lo que el usuario seleccionó realmente (localmente)
        const filteredBySelection = questions.filter((q) => {
          const qYear = String(q.year || '0');
          const filterForThisYear = yearFilters.find((f) => f.year === qYear);
          if (!filterForThisYear) return false;
          return (
            q.clasificacionId !== undefined &&
            filterForThisYear.clasificacionIds.includes(q.clasificacionId)
          );
        });

        // 2. Agrupar por (año, clasificacionId)
        const groups: Record<string, any[]> = {};
        yearFilters.forEach((f) => {
          f.clasificacionIds.forEach((cid) => {
            const key = `${f.year}-${cid}`;
            groups[key] = [];
          });
        });

        filteredBySelection.forEach((q) => {
          const key = `${String(q.year || '0')}-${q.clasificacionId}`;
          if (groups[key]) {
            groups[key].push(q);
          }
        });

        // 3. Calcular cuotas proporcionales (Objetivo: 60 preguntas CONTANDO subpreguntas)
        const activeGroupKeys = Object.keys(groups).filter(
          (k) => (groups[k] || []).length > 0
        );
        const totalTarget = 60;

        // Función para contar preguntas reales (incluyendo subpreguntas)
        const getWeight = (q: any) => (q.subPreguntas && q.subPreguntas.length > 0 ? q.subPreguntas.length : 1);

        const currentEffectiveCount = (list: any[]) => list.reduce((acc, q) => acc + getWeight(q), 0);

        if (activeGroupKeys.length > 0 && currentEffectiveCount(filteredBySelection) > totalTarget) {
          const baseLimitPerGroup = Math.floor(totalTarget / activeGroupKeys.length);
          let finalSelection: any[] = [];
          let totalAccumulated = 0;

          const leftovers: any[] = [];

          // Primera pasada: repartir equitativamente
          for (const key of activeGroupKeys) {
            const group = [...(groups[key] || [])].sort(() => 0.5 - Math.random());
            let groupAccumulated = 0;
            
            for (const q of group) {
              const weight = getWeight(q);
              if (groupAccumulated + weight <= baseLimitPerGroup) {
                finalSelection.push(q);
                groupAccumulated += weight;
                totalAccumulated += weight;
              } else {
                leftovers.push(q);
              }
            }
          }

          // Segunda pasada: rellenar lo que falta hasta llegar a 60
          if (totalAccumulated < totalTarget) {
            leftovers.sort(() => 0.5 - Math.random());
            for (const q of leftovers) {
              const weight = getWeight(q);
              if (totalAccumulated + weight <= totalTarget) {
                finalSelection.push(q);
                totalAccumulated += weight;
              }
              if (totalAccumulated >= totalTarget) break;
            }
          }
          questions = finalSelection;
        } else {
          // Si hay menos de 60, solo las barajamos
          questions = filteredBySelection.sort(() => 0.5 - Math.random());
        }
      }

      const metadata = {
        tipoExamen: sampleExam.tipoExamenNombre || 'Directivos',
        tipoExamenId: sampleExam.tipoExamenId,
        modalidad: sampleExam.modalidadNombre,
        nivel: sampleExam.nivelNombre || 'TODOS',
        especialidad: sampleExam.especialidadNombre || null,
        year: selectedYears.join(', '),
        isSimulacro: true,
      };

      localStorage.setItem('currentQuestions', JSON.stringify(questions));
      localStorage.setItem('currentExamMetadata', JSON.stringify(metadata));

      if (questions.length === 0) {
        alert('No se encontraron preguntas para los filtros seleccionados.');
      } else {
        router.push(`/examen?from=${router.asPath}`);
      }
    } catch (error) {
      console.error('Error confirming selection:', error);
      alert('Hubo un error al cargar el simulacro.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalQuestions = useMemo(() => {
    return selectedYears.reduce((acc, year) => {
      const meta = allYearsMetadata[year] || [];
      return (
        acc +
        meta.reduce((accM, m: any) => {
          return yearSelections[year]?.[m.name] ? accM + m.cantidad : accM;
        }, 0)
      );
    }, 0);
  }, [selectedYears, allYearsMetadata, yearSelections]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4790FD]"></div>
      </div>
    );
  }

  return (
    <PremiumLayout
      title="Simulacros Directivos"
      breadcrumb="Pages / Directivos / Simulacro"
    >
      <Head>
        <title>Simulacro de Examen Directivos - AVENDOCENTE</title>
      </Head>

      <div className="w-full space-y-6 px-4 md:px-6">
        <div className="text-center py-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-[#2B3674]">
            Selecciona tus preferencias
          </h3>
          <p className="text-[#A3AED0] text-base mt-1 font-medium">
            Entrena para el examen de directivos con simulacros personalizados
          </p>
        </div>

        <div className="border border-[#4790FD]/30 rounded-lg overflow-hidden bg-white shadow-md">
          <div className="bg-[#4790FD]/5 border-b border-[#4790FD]/20 px-6 py-3 flex items-center gap-2">
            <AcademicCapIcon className="h-5 w-5 text-[#4790FD]" />
            <span className="font-bold text-[#4790FD] text-lg">
              Bloque I - Exámenes MINEDU
            </span>
          </div>

          <div className="p-6 space-y-8">
            {modalidadesData.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#4790FD] font-bold">
                  <AcademicCapIcon className="h-4 w-4" />
                  <span>Modalidad habilitada</span>
                </div>
                <select
                  value={selectedModalidadId}
                  onChange={(e) => {
                    setSelectedModalidadId(e.target.value);
                    setSelectedNivelId('');
                    setSelectedEspecialidadId('');
                    setSelectedYears([]);
                    setYearSelections({});
                  }}
                  className="w-full border border-blue-200 rounded-md p-3 text-blue-900 focus:outline-none focus:ring-2 focus:ring-[#4790FD] bg-white transition-all shadow-md"
                >
                  <option value="">Selecciona Modalidad</option>
                  {modalidadesData.map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nivelesData.length > 0 && !(nivelesData.length === 1 && nivelesData[0]?.nombre === 'NINGUNO') && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#4790FD] font-bold">
                    <FilterIcon className="h-4 w-4" />
                    <span>Nivel</span>
                  </div>
                  <select
                    value={selectedNivelId}
                    onChange={(e) => {
                      setSelectedNivelId(e.target.value);
                      setSelectedEspecialidadId('');
                      setSelectedYears([]);
                      setYearSelections({});
                    }}
                    className="w-full border border-blue-200 rounded-md p-3 text-blue-900 focus:outline-none focus:ring-2 focus:ring-[#4790FD] bg-white transition-all shadow-md"
                    disabled={!selectedModalidadId}
                  >
                    <option value="">Selecciona Nivel</option>
                    {nivelesData.map((n) => (
                      <option key={n.id} value={String(n.id)}>
                        {n.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {especialidadesData.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#4790FD] font-bold">
                    <AcademicCapIcon className="h-4 w-4" />
                    <span>Especialidad</span>
                  </div>
                  <select
                    value={selectedEspecialidadId}
                    onChange={(e) => {
                      setSelectedEspecialidadId(e.target.value);
                      setSelectedYears([]);
                      setYearSelections({});
                    }}
                    className="w-full border border-blue-200 rounded-md p-3 text-blue-900 focus:outline-none focus:ring-2 focus:ring-[#4790FD] bg-white transition-all shadow-md"
                    disabled={!selectedModalidadId}
                  >
                    <option value="">Selecciona Especialidad</option>
                    {especialidadesData.map((e) => (
                      <option key={e.id} value={String(e.id)}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 text-[#4790FD] font-bold">
                <AcademicCapIcon className="h-4 w-4" />
                <span>Selecciona mínimo dos años*</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {aniosData.map((year) => {
                  const isChecked = selectedYears.includes(year);
                  const meta = allYearsMetadata[year] || [];

                  return (
                    <div
                      key={year}
                      className={`min-w-[280px] flex-1 rounded-2xl border transition-all overflow-hidden ${
                        isChecked
                          ? 'border-[#4790FD] bg-blue-50/20 ring-1 ring-[#4790FD] shadow-lg'
                          : 'border-gray-200 bg-white hover:border-blue-200 shadow-sm'
                      }`}
                    >
                      <label className="flex items-center gap-3 p-4 cursor-pointer hover:bg-blue-50/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleYearToggle(year)}
                          className="h-5 w-5 rounded border-gray-300 text-[#4790FD] focus:ring-[#4790FD]"
                        />
                        <span
                          className={`text-lg font-black transition-all ${
                            isChecked ? 'text-[#4790FD]' : 'text-blue-900'
                          }`}
                        >
                          {year}
                        </span>
                      </label>

                      <AnimatePresence>
                        {isChecked && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-white/50 border-t border-[#4790FD]/10 px-8 py-4"
                          >
                            <div className="border-l-2 border-[#4790FD] pl-4 space-y-4">
                              <p className="text-[10px] font-black text-[#4790FD] uppercase tracking-widest pl-1">
                                TIPOS DE PREGUNTA
                              </p>
                              
                              <div className="flex flex-col gap-2">
                                {meta.map((m) => {
                                  const isTypeSelected =
                                    yearSelections[year]?.[m.name] || false;
                                  return (
                                    <label
                                      key={m.name}
                                      className={`flex items-center justify-between gap-3 p-2 rounded-lg border cursor-pointer transition-all ${
                                        isTypeSelected
                                          ? 'border-blue-200 bg-white shadow-sm'
                                          : 'border-transparent bg-gray-50/30'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={isTypeSelected}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            handleTypeToggle(year, m.name);
                                          }}
                                          className="h-4 w-4 rounded border-gray-300 text-[#4790FD] focus:ring-[#4790FD]"
                                        />
                                        <span
                                          className={`text-[11px] font-bold ${
                                            isTypeSelected
                                              ? 'text-blue-900'
                                              : 'text-gray-500'
                                          }`}
                                        >
                                          {m.name}
                                        </span>
                                      </div>

                                      <div
                                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                                          isTypeSelected
                                            ? 'bg-blue-100 text-blue-600'
                                            : 'bg-gray-100 text-gray-400'
                                        }`}
                                      >
                                        {m.cantidad}p
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
               <AcademicCapIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
               <div className="space-y-1">
                 <p className="text-xs font-bold text-yellow-800">Resumen de contenido</p>
                 <p className="text-[10px] text-yellow-700/80">Total seleccionado: <span className="font-bold">{totalQuestions}</span> preguntas reales.</p>
               </div>
              </div>
          </div>
        </div>

        <div className="border border-[#4790FD]/30 rounded-lg p-6 bg-white shadow-md space-y-6">
          <div className="flex items-center gap-2 text-[#4790FD] font-extrabold pb-3 border-b border-gray-100">
            <AcademicCapIcon className="h-6 w-6" />
            <h3 className="text-xl">Resumen de selección</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Modalidad</p>
              <div className="inline-block px-4 py-1.5 bg-blue-50 border border-blue-200 text-[#4790FD] font-bold text-xs rounded-md shadow-md">
                {modalidadesData.find(m => String(m.id) === selectedModalidadId)?.nombre || 'None'}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Años</p>
              <div className="flex flex-wrap gap-2">
                {selectedYears.length > 0 ? selectedYears.map(y => (
                  <span key={y} className="px-3 py-1 bg-blue-50 border border-blue-100 text-[#4790FD] font-bold text-xs rounded-md">{y}</span>
                )) : <span className="text-xs text-gray-400 italic">Ninguno</span>}
              </div>
            </div>
          </div>

          <div className="bg-[#E6F9EE] border-l-4 md:border-l-[6px] border-[#05CD99] rounded-2xl p-6 shadow-md transition-all hover:shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-[#065F46] font-black text-xl md:text-2xl leading-tight">
                  Total de preguntas <br className="hidden md:block" /> seleccionadas:
                </h4>
                <p className="text-[#065F46]/80 text-xs md:text-sm font-medium leading-relaxed mt-2 max-w-md">
                  Incluye preguntas de Bloque I (exámenes MINEDU) y Bloque II (exámenes ED)
                </p>
              </div>
              
              <div className="flex items-center gap-3 bg-white/40 px-6 py-3 rounded-2xl border border-[#05CD99]/20">
                <span className="text-4xl md:text-5xl font-black text-[#05CD99]">
                  {totalQuestions > 60 ? 60 : totalQuestions}
                </span>
                <span className="text-lg md:text-xl font-bold text-[#065F46]">
                  preguntas
                </span>
              </div>
            </div>
            
            {totalQuestions > 60 && (
              <div className="mt-4 pt-3 border-t border-[#05CD99]/10">
                <p className="text-[10px] md:text-xs font-bold text-[#05CD99] italic uppercase tracking-wider">
                  * Se han seleccionado {totalQuestions} preguntas en total, pero el simulacro se limitará a 60 distribuidas proporcionalmente.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 py-6">
          <button onClick={handleClear} className="px-10 py-2.5 border border-[#4790FD] rounded-md text-[#4790FD] font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
            ✕ Limpiar
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={isLoading || selectedYears.length < 2 || totalQuestions === 0}
            className="px-12 py-2.5 bg-[#4790FD] text-white rounded-md font-bold shadow-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Cargando..." : "Confirmar selección"}
          </button>
        </div>
      </div>
    </PremiumLayout>
  );
};

export default SimulacrosDirectivosPage;
