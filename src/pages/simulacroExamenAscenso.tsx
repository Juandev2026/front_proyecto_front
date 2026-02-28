import React, { useEffect, useState, useMemo } from 'react';

import { AcademicCapIcon, FilterIcon } from '@heroicons/react/outline';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuth } from '../hooks/useAuth';
import PremiumLayout from '../layouts/PremiumLayout';
import { ExamenLogin, authService } from '../services/authService';
import { estructuraAcademicaService } from '../services/estructuraAcademicaService';
import { examenService } from '../services/examenService';
import { ClipboardListIcon, CheckCircleIcon } from '@heroicons/react/outline';

// ----- Types derived from login examenes -----
interface FilterOption {
  id: number;
  nombre: string;
}

const SimulacroExamenAscensoPage = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  // Examenes from user-filters API
  const [loginExamenes, setLoginExamenes] = useState<ExamenLogin[]>([]);

  // Current Selection State
  const [selectedTipoExamenId] = useState<string>('1'); // Ascenso
  const [selectedModalidadId, setSelectedModalidadId] = useState<string>('');
  const [selectedNivelId, setSelectedNivelId] = useState<string>('');
  const [selectedEspecialidadId, setSelectedEspecialidadId] =
    useState<string>('');
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  // State for per-year classification selections
  const [yearSelections, setYearSelections] = useState<
    Record<string, Record<string, boolean>>
  >({});

  const [seccionesPropias, setSeccionesPropias] = useState<any[]>([]);
  const [selectedPropiosIds, setSelectedPropiosIds] = useState<number[]>([]);

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

  // Fetch Examenes Propios (AscensoId: 1)
  useEffect(() => {
    const fetchPropios = async () => {
      if (isAuthenticated) {
        try {
          const data = await examenService.getPropios();
          // Filter by context (Ascenso = 1)
          const filtered = data.filter((s: any) => String(s.tipoExamenId) === '1' && s.visible);
          setSeccionesPropias(filtered);
        } catch (error) {
          console.error('Error fetching propio exams:', error);
        }
      }
    };
    fetchPropios();
  }, [isAuthenticated]);

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
    return Array.from(map.values());
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
    return Array.from(map.values());
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
    return Array.from(map.values());
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
      .sort((a, b) => {
        if (a === 'Único') return 1;
        if (b === 'Único') return -1;
        return Number(b) - Number(a);
      });
  }, [filteredExams, selectedModalidadId, selectedNivelId, selectedEspecialidadId]);

  // ---------- Metadata helper per Year ----------

  const getMetadataForYear = (year: string) => {
    if (!selectedModalidadId) return [];

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

    return Object.entries(aggCountMap).map(([name, data]) => ({
      name,
      ...data,
    }));
  };

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
      const meta = getMetadataForYear(year);
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
    setSelectedPropiosIds([]);
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
        const yearMeta = getMetadataForYear(year);
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
        nivelId: sampleExam.nivelId || (nivelesData.length === 1 ? (nivelesData[0]?.id ?? 0) : 0),
        especialidadId: sampleExam.especialidadId || 0,
        yearFilters,
      };

      // 4. LLAMADA AL SERVICIO BLOQUE I
      let bloque1Questions =
        await estructuraAcademicaService.getPreguntasByFilterMultiYear(payload);

      // --- 5. LLAMADA PARA BLOQUE II (PROPIOS) ---
      let bloque2Questions: any[] = [];
      const selectedPropios = seccionesPropias.filter(s => selectedPropiosIds.includes(s.fuenteId || s.id));
      
      for (const sect of selectedPropios) {
        if (sect.examenesPropios) {
          for (const examData of sect.examenesPropios) {
             const p = {
                tipoExamenId: sect.tipoExamenId,
                fuenteId: sect.fuenteId || sect.id,
                modalidadId: examData.modalidadId,
                nivelId: examData.nivelId,
                especialidadId: examData.especialidadId || 0,
                year: '0',
                clasificaciones: [],
             };
             const qs = await estructuraAcademicaService.getPreguntasByFilter(p);
             bloque2Questions = [...bloque2Questions, ...qs];
          }
        }
      }

      // Merge and remove duplicates
      let questions = Array.from(new Map([...bloque1Questions, ...bloque2Questions].map(q => [q.id, q])).values());

      if (questions.length > 0) {
        // 1. Filtrar primero por lo que el usuario seleccionó realmente (localmente)
        const filteredBySelection = questions.filter((q) => {
          const qYear = String(q.year || q.anio || '0');
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
          const key = `${String(q.year || q.anio || '0')}-${q.clasificacionId}`;
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
        router.push('/examen');
      }
    } catch (error) {
      console.error('Error confirming selection:', error);
      alert('Hubo un error al cargar el simulacro.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalQuestions = useMemo(() => {
     const b1 = selectedYears.reduce((acc, year) => {
        const meta = getMetadataForYear(year);
        return (
          acc +
          meta.reduce((accM, m) => {
            return yearSelections[year]?.[m.name] ? accM + m.cantidad : accM;
          }, 0)
        );
      }, 0);

      const b2 = seccionesPropias
        .filter(s => selectedPropiosIds.includes(s.fuenteId || s.id))
        .reduce((acc, s) => {
           let sectCount = 0;
           if (s.examenesPropios) {
              s.examenesPropios.forEach((ex: any) => {
                 if (ex.clasificaciones) {
                    ex.clasificaciones.forEach((c: any) => {
                       sectCount += c.cantidadPreguntas || 0;
                    });
                 }
              });
           }
           return acc + (s.totalPreguntas || sectCount);
        }, 0);

      return b1 + b2;
  }, [selectedYears, yearSelections, seccionesPropias, selectedPropiosIds]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4790FD]"></div>
      </div>
    );
  }

  return (
    <PremiumLayout
      title="Simulacro de Examen Ascenso"
      breadcrumb="Pages / Ascenso / Simulacro"
    >
      <Head>
        <title>Simulacro de Examen Ascenso - AVENDOCENTE</title>
      </Head>

      <div className="w-full px-4 md:px-8 space-y-6 pb-20">
        <div className="text-center py-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-[#4790FD]">
            Selecciona tus preferencias
          </h3>
          <p className="text-[#A3AED0] text-base mt-1 font-medium">
            Personaliza tu simulacro de ascenso para practicar hoy
          </p>
        </div>

        <div className="border border-[#4790FD]/30 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="bg-[#4790FD]/5 border-b border-[#4790FD]/20 px-6 py-3 flex items-center gap-2">
            <AcademicCapIcon className="h-5 w-5 text-[#4790FD]" />
            <span className="font-bold text-[#4790FD] text-lg">
              Bloque I - Exámenes MINEDU
            </span>
          </div>

          <div className="p-6 space-y-8">
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
                className="w-full border border-blue-200 rounded-md p-3 text-blue-900 focus:outline-none focus:ring-2 focus:ring-[#4790FD] bg-white transition-all shadow-sm"
              >
                <option value="">Selecciona Modalidad</option>
                {modalidadesData.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nivelesData.length > 0 && !(nivelesData.length === 1 && nivelesData[0]?.nombre?.toUpperCase() === 'NINGUNO') && (
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
                    className="w-full border border-blue-200 rounded-md p-3 text-blue-900 focus:outline-none focus:ring-2 focus:ring-[#4790FD] bg-white transition-all shadow-sm"
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
                    className="w-full border border-blue-200 rounded-md p-3 text-blue-900 focus:outline-none focus:ring-2 focus:ring-[#4790FD] bg-white transition-all shadow-sm"
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {aniosData.map((year) => {
                  const isChecked = selectedYears.includes(year);
                  const yearMeta = getMetadataForYear(year);

                  return (
                    <div key={year} className="flex flex-col gap-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleYearToggle(year)}
                          className="h-5 w-5 rounded border-[#4790FD] text-[#4790FD] focus:ring-[#4790FD]/20 transition-all"
                        />
                        <span className={`text-base font-bold transition-all ${isChecked ? 'text-[#4790FD]' : 'text-blue-900'}`}>
                          {year}
                        </span>
                      </label>

                      {isChecked && yearMeta.length > 0 && (
                        <div className="ml-2 border border-[#4790FD]/20 rounded-xl p-4 bg-blue-50/30 space-y-3">
                          <p className="text-[10px] font-bold text-[#4790FD] uppercase tracking-tighter">Tipos</p>
                          <div className="space-y-2">
                             {yearMeta.map((m) => (
                              <label key={m.name} className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                                m.cantidad > 0 ? `cursor-pointer ${yearSelections[year]?.[m.name] ? 'bg-white border-[#4790FD] shadow-sm' : 'bg-white/50 border-gray-100'}` : 'opacity-40 bg-gray-50'
                              }`}>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="checkbox" 
                                    checked={yearSelections[year]?.[m.name] || false}
                                    disabled={m.cantidad === 0}
                                    onChange={() => handleTypeToggle(year, m.name)}
                                    className="h-4 w-4 text-[#4790FD] rounded border-gray-300"
                                  />
                                  <span className="text-xs font-bold text-blue-800">{m.name}</span>
                                </div>
                                <span className="text-[10px] font-black bg-blue-100 text-[#4790FD] px-2 py-0.5 rounded-full">{m.cantidad}p</span>
                              </label>
                             ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
               <AcademicCapIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
               <div className="space-y-1">
                 <p className="text-xs font-bold text-yellow-800">Preguntas disponibles</p>
                 <p className="text-[10px] text-yellow-700/80">Total seleccionado: <span className="font-bold">{totalQuestions}</span> preguntas reales.</p>
               </div>
            </div>
          </div>
        </div>

        {/* Bloque II - Exámenes Propios ED */}
        <div className="border border-[#4790FD]/30 rounded-lg overflow-hidden bg-white shadow-sm">
           <div className="bg-[#4790FD]/5 border-b border-[#4790FD]/20 px-6 py-3 flex items-center gap-2">
            <ClipboardListIcon className="h-5 w-5 text-[#4790FD]" />
            <span className="font-bold text-[#4790FD] text-lg">
              Bloque II - Exámenes Propios ED
            </span>
          </div>

          <div className="p-6">
             <p className="text-xs text-blue-800 font-medium mb-4">
              Selecciona las secciones ED adicionales que deseas incluir en tu simulacro.
             </p>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {seccionesPropias.map((s) => {
                   const isSelected = selectedPropiosIds.includes(s.fuenteId || s.id);
                   
                   // Aggregate counts
                   const counts: Record<string, number> = { CCP: 0, CL: 0, RL: 0, CG: 0 };
                   if (s.examenesPropios) {
                      s.examenesPropios.forEach((ex: any) => {
                         if (ex.clasificaciones) {
                            ex.clasificaciones.forEach((c: any) => {
                               const name = c.clasificacionNombre?.toUpperCase();
                               if (counts.hasOwnProperty(name)) {
                                  counts[name] += c.cantidadPreguntas || 0;
                               }
                            });
                         }
                      });
                   }

                   return (
                      <label 
                        key={s.id} 
                        className={`border rounded-2xl p-5 cursor-pointer transition-all flex flex-col gap-4 relative overflow-hidden ${
                          isSelected ? 'border-[#4790FD] bg-blue-50 ring-2 ring-[#4790FD]' : 'border-gray-100 bg-white hover:border-blue-200 shadow-sm'
                        }`}
                      >
                         <div className="flex items-start gap-3 relative z-10">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => {
                                 if (isSelected) {
                                    setSelectedPropiosIds(prev => prev.filter(id => id !== (s.fuenteId || s.id)));
                                 } else {
                                    setSelectedPropiosIds(prev => [...prev, (s.fuenteId || s.id)]);
                                 }
                              }}
                              className="mt-1 h-5 w-5 text-[#4790FD] rounded border-gray-300 focus:ring-[#4790FD]"
                            />
                            <div className="flex flex-col">
                               <span className="text-blue-900 font-extrabold text-sm">{s.fuenteNombre || s.nombre}</span>
                            </div>
                         </div>

                         <div className="bg-white/80 rounded-xl border border-blue-50 p-3 relative z-10">
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 text-center">Preguntas disponibles:</p>
                            <div className="grid grid-cols-2 gap-2">
                               {Object.entries(counts).map(([label, count]) => (
                                  <div key={label} className={`flex items-center justify-between px-2 py-1 rounded border text-[10px] ${count > 0 ? 'bg-green-50 border-green-100 text-green-600' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                     <span className="font-bold">{label}:</span>
                                     <span className="font-black">{count}</span>
                                  </div>
                               ))}
                            </div>
                         </div>

                         {isSelected && (
                            <div className="absolute top-0 right-0 p-2">
                               <CheckCircleIcon className="h-5 w-5 text-[#4790FD]" />
                            </div>
                         )}
                      </label>
                   );
                })}
             </div>
             
             {seccionesPropias.length === 0 && !isLoading && (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                   <p className="text-gray-400 text-sm italic">No hay secciones propias disponibles para añadir.</p>
                </div>
             )}
          </div>
        </div>

        <div className="border border-[#4790FD]/30 rounded-lg p-6 bg-white shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-[#4790FD] font-extrabold pb-3 border-b border-gray-100">
            <AcademicCapIcon className="h-6 w-6" />
            <h3 className="text-xl">Resumen de selección</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Modalidad</p>
              <div className="inline-block px-4 py-1.5 bg-blue-50 border border-blue-200 text-[#4790FD] font-bold text-xs rounded-md shadow-sm">
                {modalidadesData.find(m => String(m.id) === selectedModalidadId)?.nombre || 'None'}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Años seleccionados</p>
              <div className="flex flex-wrap gap-2">
                {selectedYears.length > 0 ? selectedYears.map(y => (
                  <span key={y} className="px-3 py-1 bg-blue-50 border border-blue-100 text-[#4790FD] font-bold text-xs rounded-md">{y}</span>
                )) : <span className="text-xs text-gray-400 italic">Ninguno</span>}
              </div>
            </div>

            <div className="space-y-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Bloque II - Exámenes Propios
                </p>
                <div className="flex flex-wrap gap-2">
                   {selectedPropiosIds.length > 0 ? (
                      seccionesPropias.filter(s => selectedPropiosIds.includes(s.fuenteId || s.id)).map(s => (
                         <span key={s.id} className="px-3 py-1 bg-green-50 border border-green-200 text-green-600 font-bold text-xs rounded-md shadow-sm">
                            {s.fuenteNombre || s.nombre}
                         </span>
                      ))
                   ) : (
                      <span className="text-xs text-gray-400 italic">Ninguno seleccionado</span>
                   )}
                </div>
            </div>
          </div>

          <div className="bg-green-100/50 border border-green-200 rounded-lg p-5">
            <p className="text-xl font-bold text-green-700">Total para el simulacro: <span className="text-2xl font-black">{totalQuestions > 60 ? 60 : totalQuestions}</span> preguntas</p>
            {totalQuestions > 60 && (
              <p className="text-xs text-green-600 font-medium mt-1 italic">
                * Se han seleccionado {totalQuestions} preguntas en total, pero el simulacro se limitará a 60 distribuidas proporcionalmente.
              </p>
            )}
            <p className="text-xs font-semibold text-green-600 mt-0.5">
               Incluye: Bloque I (MINEDU) {selectedPropiosIds.length > 0 && `+ Bloque II (ED)`}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 py-6">
          <button onClick={handleClear} className="px-10 py-2.5 border border-[#4790FD] rounded-md text-[#4790FD] font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
            ✕ Limpiar
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={
              isLoading || 
              (!selectedYears.length && !selectedPropiosIds.length) || 
              (selectedYears.length > 0 && selectedYears.length < 2) || 
              totalQuestions === 0
            }
            className="px-12 py-2.5 bg-[#4790FD] text-white rounded-md font-bold shadow-lg hover:bg-blue-600 hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/50 active:scale-125 transition-all duration-300 disabled:opacity-50 shadow-blue-200"
          >
            {isLoading ? "Cargando..." : "Confirmar selección"}
          </button>
        </div>
      </div>
    </PremiumLayout>
  );
};

export default SimulacroExamenAscensoPage;
