import React, { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import {
  AcademicCapIcon,
  FilterIcon,
  ClipboardListIcon,
  CheckCircleIcon,
  CalendarIcon,
} from '@heroicons/react/outline';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuth } from '../hooks/useAuth';
import PremiumLayout from '../layouts/PremiumLayout';
import { preguntaService } from '../services/preguntaService';
import { examenService } from '../services/examenService';

// ----- Types derived from login examenes -----
interface FilterOption {
  id: number;
  nombre: string;
}

const SimulacroExamenPage = () => {
  const { isAuthenticated, loading, user, loginExamenes } = useAuth();
  const router = useRouter();

  // Current Selection State
  const [selectedTipoExamenId] = useState<string>('2'); // Nombramiento
  const [selectedModalidadId, setSelectedModalidadId] = useState<string>('');
  const [selectedNivelId, setSelectedNivelId] = useState<string>('');
  const [selectedEspecialidadId, setSelectedEspecialidadId] =
    useState<string>('');
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  // State for per-year classification selections: Record<Year, Record<ClassificationName, boolean>>
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

  // Fetch Examenes Propios
  useEffect(() => {
    const fetchPropios = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const data = await examenService.getPropiosByUser(2, user.id);
          const visibleData = data.filter((s: any) => s.visible === true);
          setSeccionesPropias(visibleData);
        } catch (error) {
          console.error('Error fetching propio exams:', error);
        }
      }
    };
    fetchPropios();
  }, [isAuthenticated, user?.id]);

  // ---------- Memoized Derived Options ----------

  const filteredExams = useMemo(() => {
    return loginExamenes.filter(
      (e) => String(e.tipoExamenId) === selectedTipoExamenId
    );
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

  // Auto-select modality if only one exists
  useEffect(() => {
    if (
      modalidadesData.length === 1 &&
      !selectedModalidadId &&
      modalidadesData[0]
    ) {
      setSelectedModalidadId(String(modalidadesData[0].id));
    }
  }, [modalidadesData, selectedModalidadId]);

  const nivelesData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    filteredExams
      .filter(
        (e) =>
          !selectedModalidadId || String(e.modalidadId) === selectedModalidadId
      )
      .forEach((e) => {
        if (!map.has(e.nivelId)) {
          map.set(e.nivelId, { id: e.nivelId, nombre: e.nivelNombre });
        }
      });
    return Array.from(map.values()).filter(
      (n) => n.nombre && n.nombre.toUpperCase() !== 'NINGUNO' && n.nombre !== 'string'
    );
  }, [filteredExams, selectedModalidadId]);

  // Auto-select level if only one exists
  useEffect(() => {
    if (nivelesData.length === 1 && !selectedNivelId && nivelesData[0]) {
      setSelectedNivelId(String(nivelesData[0].id));
    }
  }, [nivelesData, selectedNivelId]);

  const especialidadesData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    filteredExams
      .filter(
        (e) =>
          (!selectedModalidadId ||
            String(e.modalidadId) === selectedModalidadId) &&
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

  // Auto-select specialty if only one exists
  useEffect(() => {
    if (
      especialidadesData.length === 1 &&
      !selectedEspecialidadId &&
      especialidadesData[0]
    ) {
      setSelectedEspecialidadId(String(especialidadesData[0].id));
    }
  }, [especialidadesData, selectedEspecialidadId]);

  const aniosData = useMemo(() => {
    const set = new Set<string>();
    filteredExams
      .filter(
        (e) =>
          (!selectedModalidadId ||
            String(e.modalidadId) === selectedModalidadId) &&
          (!selectedNivelId || String(e.nivelId) === selectedNivelId) &&
          (!selectedEspecialidadId ||
            String(e.especialidadId) === selectedEspecialidadId)
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
  }, [
    filteredExams,
    selectedModalidadId,
    selectedNivelId,
    selectedEspecialidadId,
  ]);

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
          (!selectedEspecialidadId ||
            String(e.especialidadId) === selectedEspecialidadId) &&
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
    setSelectedPropiosIds([]);
  };

  const handleConfirm = async () => {
    const minMineduSelected = selectedYears.length >= 2;
    const somethingPropiosSelected = selectedPropiosIds.length > 0;

    if (
      !selectedModalidadId ||
      (!minMineduSelected && !somethingPropiosSelected)
    )
      return;

    try {
      setIsLoading(true);

      const firstNivel = nivelesData[0];
      const resolvedNivelId =
        selectedNivelId ||
        (nivelesData.length === 1 &&
        firstNivel?.nombre?.toUpperCase() === 'NINGUNO'
          ? String(firstNivel.id)
          : '0');

      // 1. Buscamos un examen de referencia en la metadata
      const sampleExam = filteredExams.find(
        (e) =>
          String(e.modalidadId) === selectedModalidadId &&
          String(e.nivelId) === resolvedNivelId &&
          (selectedEspecialidadId
            ? String(e.especialidadId) === selectedEspecialidadId
            : true)
      );

      if (!sampleExam) {
        alert('Error: No se encontró la metadata del examen.');
        setIsLoading(false);
        return;
      }

      // 2. Construimos el array de filtros por año
      const yearFilters = selectedYears.map((year) => {
        const yearMeta = allYearsMetadata[year] || [];
        // Obtenemos solo los IDs de las clasificaciones que el usuario marcó para ESTE año
        const activeIds = yearMeta
          .filter((m) => yearSelections[year]?.[m.name] === true)
          .map((m) => m.id);

        return {
          year: year === 'Único' ? '0' : year,
          clasificacionIds: activeIds,
        };
      });

      // 3. ARMAMOS EL PAYLOAD PARA MULTI-AÑO
      const payload = {
        tipoExamenId: sampleExam.tipoExamenId,
        fuenteId: sampleExam.fuenteId || 0,
        modalidadId: sampleExam.modalidadId,
        nivelId: sampleExam.nivelId,
        especialidadId: sampleExam.especialidadId || 0,
        yearFilters,
      };

      console.log('Enviando filtro multi-año a la API:', payload);

      // 4. LLAMADA AL SERVICIO BLOQUE I
      const bloque1Questions =
        await preguntaService.getPreguntasByFilterMultiYear(payload);

      // --- 5. LLAMADA PARA BLOQUE II (PROPIOS) ---
      let bloque2Questions: any[] = [];
      const selectedPropios = seccionesPropias.filter((s) =>
        selectedPropiosIds.includes(s.fuenteId || s.id)
      );

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
            const qs = await preguntaService.getPreguntasByFilter(p);
            bloque2Questions = [...bloque2Questions, ...qs];
          }
        } else {
          // New structure: Fetch by fuenteId directly
          const p = {
            tipoExamenId: sect.tipoExamenId,
            fuenteId: sect.fuenteId || sect.id,
            modalidadId: 0, // Not applicable or use a default
            nivelId: 0,
            especialidadId: 0,
            year: '0',
            clasificaciones: [],
          };
          const qs = await preguntaService.getPreguntasByFilter(p);
          bloque2Questions = [...bloque2Questions, ...qs];
        }
      }

      // Merge and remove duplicates
      let questions = Array.from(
        new Map(
          [...bloque1Questions, ...bloque2Questions].map((q) => [q.id, q])
        ).values()
      );

      // --- PARCHE DE FRONTEND: Filtrar localmente por si la API devuelve más de lo pedido ---
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

        // 3. Calcular cuotas proporcionales (Objetivo: 100 preguntas CONTANDO subpreguntas)
        const activeGroupKeys = Object.keys(groups).filter(
          (k) => (groups[k] || []).length > 0
        );
        const totalTarget = 100;

        // Función para contar preguntas reales (incluyendo subpreguntas)
        const getWeight = (q: any) =>
          q.subPreguntas && q.subPreguntas.length > 0
            ? q.subPreguntas.length
            : 1;

        const currentEffectiveCount = (list: any[]) =>
          list.reduce((acc, q) => acc + getWeight(q), 0);

        if (
          activeGroupKeys.length > 0 &&
          currentEffectiveCount(filteredBySelection) > totalTarget
        ) {
          const baseLimitPerGroup = Math.floor(
            totalTarget / activeGroupKeys.length
          );
          const finalSelection: any[] = [];
          let totalAccumulated = 0;

          const leftovers: any[] = [];

          // Primera pasada: repartir equitativamente
          for (const key of activeGroupKeys) {
            const group = [...(groups[key] || [])].sort(
              () => 0.5 - Math.random()
            );
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

      console.log(`Preguntas obtenidas tras filtro local: ${questions.length}`);

      // 5. Guardar metadata y redirigir
      const metadata = {
        tipoExamen: sampleExam.tipoExamenNombre || (sampleExam.tipoExamenId === 2 ? 'Nombramiento' : 'Ascenso'),
        tipoExamenId: sampleExam.tipoExamenId,
        modalidad: sampleExam.modalidadNombre,
        nivel: sampleExam.nivelNombre || 'NINGUNO',
        especialidad: sampleExam.especialidadNombre || null,
        year: selectedYears.join(', '),
        isSimulacro: true, // Flag para indicar que es un simulacro multi-año
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

  // Grand Total calculation
  const totalQuestions = useMemo(() => {
    const b1 = selectedYears.reduce((acc, year) => {
      const meta = allYearsMetadata[year] || [];
      return (
        acc +
        meta.reduce((accM, m: any) => {
          return yearSelections[year]?.[m.name] ? accM + m.cantidad : accM;
        }, 0)
      );
    }, 0);

    const b2 = seccionesPropias
      .filter((s) => selectedPropiosIds.includes(s.fuenteId || s.id))
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
        return acc + (s.cantidadPreguntas || s.totalPreguntas || sectCount);
      }, 0);

    return b1 + b2;
  }, [selectedYears, yearSelections, allYearsMetadata, seccionesPropias, selectedPropiosIds]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PremiumLayout
      title="Banco de preguntas"
      breadcrumb="Pages / Banco de preguntas"
    >
      <Head>
        <title>Simulacro de Examen - AVENDOCENTE</title>
      </Head>

      <div className="w-full px-4 md:px-8 space-y-6 pb-20">
        <div className="text-center py-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-[#2B3674]">
            Selecciona tus preferencias
          </h3>
          <p className="text-[#2B3674] text-base mt-1 font-medium">
            Filtra paso a paso para encontrar el examen deseado
          </p>
          <p className="text-xl md:text-2xl font-extrabold text-[#2B3674] mt-2">
            {selectedTipoExamenId === '1' ? 'Ascenso' : 'Nombramiento'}
          </p>
        </div>

        <div className="space-y-4">
          {/* Modalidad Selector */}
          {modalidadesData.length > 0 && (
            <div className="border border-[#4790FD] rounded-lg p-4 bg-white transition-all shadow-md">
              <div className="flex items-center gap-2 mb-3 text-[#4790FD] font-bold">
                <AcademicCapIcon className="h-5 w-5" />
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
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4790FD] bg-white transition-all"
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

          {/* Nivel Selector */}
          {nivelesData.length > 0 &&
            !(
              nivelesData.length === 1 &&
              nivelesData[0]?.nombre?.toUpperCase() === 'NINGUNO'
            ) && (
              <div className="border border-[#4790FD] rounded-lg p-4 bg-white transition-all shadow-md">
                <div className="flex items-center gap-2 mb-3 text-[#4790FD] font-bold">
                  <FilterIcon className="h-5 w-5" />
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
                  className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4790FD] bg-white transition-all"
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

          {/* Especialidad Selector */}
          {especialidadesData.length > 0 && (
            <div className="border border-[#4790FD] rounded-lg p-4 bg-white transition-all shadow-md">
              <div className="flex items-center gap-2 mb-3 text-[#4790FD] font-bold">
                <AcademicCapIcon className="h-5 w-5" />
                <span>Especialidad</span>
              </div>
              <select
                value={selectedEspecialidadId}
                onChange={(e) => {
                  setSelectedEspecialidadId(e.target.value);
                  setSelectedYears([]);
                  setYearSelections({});
                }}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4790FD] bg-white transition-all"
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

          {/* Year Selector */}
          {aniosData.length > 0 && (
            <div className="border border-[#4790FD] rounded-lg p-4 bg-white transition-all shadow-md">
              <div className="flex items-center gap-2 mb-3 text-[#4790FD] font-bold">
                <CalendarIcon className="h-5 w-5" />
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
                      {/* Year Header */}
                      <label className="flex items-center gap-3 p-4 cursor-pointer hover:bg-blue-50/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleYearToggle(year)}
                          className="h-5 w-5 rounded border-gray-300 text-[#4790FD] focus:ring-[#4790FD]"
                        />
                        <span
                          className={`text-lg font-black ${
                            isChecked ? 'text-[#4790FD]' : 'text-blue-900'
                          }`}
                        >
                          {year}
                        </span>
                      </label>

                      {/* Question Types (Visible when year is checked) */}
                      <AnimatePresence>
                        {isChecked && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-white/50 border-t border-[#4790FD]/10 px-8 py-4"
                          >
                            <div className="border-l-2 border-[#4790FD] pl-4 space-y-3">
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
          )}



          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 shadow-md">
            <div className="mt-0.5">
              <AcademicCapIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-yellow-800">
                Cantidades de preguntas reales
              </p>
              <p className="text-[10px] text-yellow-700/90 leading-relaxed">
                Las cantidades de preguntas mostradas corresponden a los datos
                reales de cada examen. Total actual:{' '}
                <span className="font-bold">{totalQuestions}</span> preguntas.
              </p>
            </div>
          </div>
        </div>

        {/* Bloque II - Exámenes Propios Avend Escala */}
        <div className="border border-[#4790FD] rounded-lg overflow-hidden bg-white shadow-md mt-8">
          <div className="bg-[#4790FD]/5 border-b border-[#4790FD]/20 px-6 py-3 flex items-center gap-2">
            <ClipboardListIcon className="h-5 w-5 text-[#4790FD]" />
            <span className="font-bold text-[#4790FD] text-lg">
              Banco de preguntas - Propios
            </span>
          </div>

          <div className="p-6">
            <p className="text-xs text-blue-800 font-medium mb-4">
              Selecciona las secciones Avend Escala adicionales que deseas incluir en tu
              simulacro.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seccionesPropias.map((s) => {
                const isSelected = selectedPropiosIds.includes(
                  s.fuenteId || s.id
                );

                // Aggregate counts from new API structure
                const counts: Record<string, number> = {
                  CCP: 0,
                  CL: 0,
                  RLi: 0,
                  CGi: 0,
                };

                if (s.clasificaciones) {
                  s.clasificaciones.forEach((c: any) => {
                    const name = c.clasificacionNombre?.toUpperCase();
                    if (name === 'CCP') counts.CCP += c.cantidadPreguntas || 0;
                    if (name === 'CL') counts.CL += c.cantidadPreguntas || 0;
                    if (name === 'RLI') counts.RLi += c.cantidadPreguntas || 0;
                    if (name === 'CGI') counts.CGi += c.cantidadPreguntas || 0;
                    
                    // Support for old names if they come through
                    if (name === 'RL') counts.RLi += c.cantidadPreguntas || 0;
                    if (name === 'CG') counts.CGi += c.cantidadPreguntas || 0;
                  });
                }

                return (
                  <label
                    key={s.id}
                    className={`border rounded-2xl p-5 cursor-pointer transition-all flex flex-col gap-4 relative overflow-hidden ${
                      isSelected
                        ? 'border-primary bg-blue-50 ring-2 ring-primary'
                        : 'border-gray-100 bg-white hover:border-blue-200 shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3 relative z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedPropiosIds((prev) =>
                              prev.filter((id) => id !== (s.fuenteId || s.id))
                            );
                          } else {
                            setSelectedPropiosIds((prev) => [
                              ...prev,
                              s.fuenteId || s.id,
                            ]);
                          }
                        }}
                        className="mt-1 h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary"
                      />
                      <div className="flex flex-col">
                        <span className="text-blue-900 font-extrabold text-sm">
                          {s.fuenteNombre || s.nombre}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white/80 rounded-xl border border-blue-50 p-3 relative z-10">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 text-center">
                        Preguntas disponibles:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(counts).map(([label, count]) => (
                          <div
                            key={label}
                            className={`flex items-center justify-between px-2 py-1 rounded border text-[10px] ${
                              count > 0
                                ? 'bg-green-50 border-green-100 text-green-600'
                                : 'bg-gray-50 border-gray-100 text-gray-300'
                            }`}
                          >
                            <span className="font-bold">{label}:</span>
                            <span className="font-black">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="absolute top-0 right-0 p-2">
                        <CheckCircleIcon className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </label>
                );
              })}
            </div>

            {seccionesPropias.length === 0 && !isLoading && (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                <p className="text-gray-400 text-sm italic">
                  No hay secciones propias disponibles para añadir.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Resumen Section */}
        <div className="border border-blue-400 rounded-lg p-6 bg-white shadow-md space-y-6">
          <div className="flex items-center gap-2 text-blue-900 font-extrabold pb-3 border-b border-gray-100">
            <AcademicCapIcon className="h-6 w-6" />
            <h3 className="text-xl">Resumen de selección</h3>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Modalidad
                </p>
                <div className="inline-block px-4 py-1.5 bg-blue-50 border border-blue-200 text-blue-500 font-bold text-xs rounded-md shadow-md">
                  {modalidadesData.find(
                    (m) => String(m.id) === selectedModalidadId
                  )?.nombre || 'None'}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Bloque I - Años
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedYears.length > 0 ? (
                    selectedYears.map((y) => (
                      <span
                        key={y}
                        className="px-3 py-1 bg-yellow-100/50 border border-yellow-300 text-yellow-700 font-bold text-xs rounded-md shadow-md"
                      >
                        {y}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      Ninguno seleccionado
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Bloque II - Exámenes Propios
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedPropiosIds.length > 0 ? (
                    seccionesPropias
                      .filter((s) =>
                        selectedPropiosIds.includes(s.fuenteId || s.id)
                      )
                      .map((s) => (
                        <span
                          key={s.id}
                          className="px-3 py-1 bg-green-50 border border-green-200 text-green-600 font-bold text-xs rounded-md shadow-md"
                        >
                          {s.fuenteNombre || s.nombre}
                        </span>
                      ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      Ninguno seleccionado
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Selection per year detail */}
            {selectedYears.length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Tipos de pregunta por año (Bloque I)
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {selectedYears.map((year) => {
                    const selectionsForYear = Object.entries(
                      yearSelections[year] || {}
                    ).filter(([_, isSelected]) => isSelected);

                    return (
                      <div
                        key={year}
                        className="bg-gray-50/50 border border-gray-300 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between"
                      >
                        <p className="text-xs font-black text-blue-900 min-w-[80px]">
                          Año {year}:
                        </p>
                        <div className="flex flex-wrap gap-2 flex-1">
                          {selectionsForYear.length > 0 ? (
                            selectionsForYear.map(([name]) => {
                              const meta = (allYearsMetadata[year] || []).find(
                                (m: any) => m.name === name
                              );
                              return (
                                <span
                                  key={name}
                                  className="px-2.5 py-1 bg-white border border-blue-100 text-blue-500 font-bold text-[10px] rounded-md shadow-md flex items-center gap-1"
                                >
                                  {name} ({meta?.cantidad} preguntas)
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[10px] text-red-400 italic font-medium">
                              Sin tipos de pregunta seleccionados
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-[#E6F9EE] border-l-4 md:border-l-[6px] border-[#05CD99] rounded-2xl p-6 shadow-md transition-all hover:shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-[#065F46] font-black text-xl md:text-2xl leading-tight">
                    Total de preguntas <br className="hidden md:block" /> seleccionadas:
                  </h4>
                  <p className="text-[#065F46]/80 text-xs md:text-sm font-medium leading-relaxed mt-2 max-w-md">
                    Incluye preguntas de Bloque I (exámenes MINEDU) y Bloque II (exámenes AE)
                  </p>
                </div>
                
                <div className="flex items-center gap-3 bg-white/40 px-6 py-3 rounded-2xl border border-[#05CD99]/20">
                  <span className="text-4xl md:text-5xl font-black text-[#05CD99]">
                    {totalQuestions > 100 ? 100 : totalQuestions}
                  </span>
                  <span className="text-lg md:text-xl font-bold text-[#065F46]">
                    preguntas
                  </span>
                </div>
              </div>
              
              {totalQuestions > 100 && (
                <div className="mt-4 pt-3 border-t border-[#05CD99]/10">
                  <p className="text-[10px] md:text-xs font-bold text-[#05CD99] italic uppercase tracking-wider">
                    * Se han seleccionado {totalQuestions} preguntas en total, pero el simulacro se limitará a 100 distribuidas proporcionalmente.
                  </p>
                </div>
              )}
            </div>

            <p className="text-[10px] text-gray-400 italic">
              * Si desea solo de un año determinado un específico puede ir al
              módulo de Banco de preguntas
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 py-6">
          <button
            onClick={handleClear}
            className="px-10 py-2.5 border border-blue-400 rounded-md text-blue-500 font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-sm shadow-md"
          >
            <span className="text-lg">✕</span> Limpiar
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              isLoading ||
              (!selectedYears.length && !selectedPropiosIds.length) ||
              (selectedYears.length > 0 && selectedYears.length < 2) ||
              totalQuestions === 0 ||
              (selectedYears.length > 0 &&
                selectedYears.some(
                  (y) =>
                    !Object.values(yearSelections[y] || {}).some(
                      (v) => v === true
                    )
                ))
            }
            className="px-12 py-2.5 bg-[#4790FD] text-white rounded-md font-bold shadow-lg hover:bg-blue-600 hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/50 active:scale-125 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-blue-200"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Confirmar selección'
            )}
          </button>
        </div>
      </div>
    </PremiumLayout>
  );
};

export default SimulacroExamenPage;
