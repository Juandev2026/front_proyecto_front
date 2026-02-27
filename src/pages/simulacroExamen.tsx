import React, { useEffect, useState, useMemo } from 'react';

import { AcademicCapIcon, FilterIcon } from '@heroicons/react/outline';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuth } from '../hooks/useAuth';
import PremiumLayout from '../layouts/PremiumLayout';
import { ExamenLogin } from '../services/authService';
import { estructuraAcademicaService } from '../services/estructuraAcademicaService';

// ----- Types derived from login examenes -----
interface FilterOption {
  id: number;
  nombre: string;
}

const SimulacroExamenPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Examenes from login response
  const [loginExamenes, setLoginExamenes] = useState<ExamenLogin[]>([]);

  // Current Selection State
  const [selectedTipoExamenId] = useState<string>('2');
  const [selectedModalidadId, setSelectedModalidadId] = useState<string>('');
  const [selectedNivelId, setSelectedNivelId] = useState<string>('');
  const [selectedEspecialidadId, setSelectedEspecialidadId] =
    useState<string>('');
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  // State for per-year classification selections: Record<Year, Record<ClassificationName, boolean>>
  const [yearSelections, setYearSelections] = useState<
    Record<string, Record<string, boolean>>
  >({});

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Load examenes from localStorage
  useEffect(() => {
    if (isAuthenticated) {
      const stored = localStorage.getItem('loginExamenes');
      if (stored) {
        try {
          const parsed: ExamenLogin[] = JSON.parse(stored);
          setLoginExamenes(parsed);
        } catch (e) {
          console.error('Error parsing loginExamenes:', e);
        }
      }
    }
  }, [isAuthenticated]);

  // ---------- Memoized Derived Options ----------

  const modalidadesData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    loginExamenes
      .filter(
        (e) =>
          !selectedTipoExamenId ||
          String(e.tipoExamenId) === selectedTipoExamenId
      )
      .forEach((e) => {
        if (!map.has(e.modalidadId)) {
          map.set(e.modalidadId, {
            id: e.modalidadId,
            nombre: e.modalidadNombre,
          });
        }
      });
    return Array.from(map.values());
  }, [loginExamenes, selectedTipoExamenId]);

  const nivelesData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    loginExamenes
      .filter(
        (e) =>
          (!selectedTipoExamenId ||
            String(e.tipoExamenId) === selectedTipoExamenId) &&
          (!selectedModalidadId ||
            String(e.modalidadId) === selectedModalidadId)
      )
      .forEach((e) => {
        if (!map.has(e.nivelId)) {
          map.set(e.nivelId, { id: e.nivelId, nombre: e.nivelNombre });
        }
      });
    return Array.from(map.values());
  }, [loginExamenes, selectedTipoExamenId, selectedModalidadId]);

  const especialidadesData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    loginExamenes
      .filter(
        (e) =>
          (!selectedTipoExamenId ||
            String(e.tipoExamenId) === selectedTipoExamenId) &&
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
    return Array.from(map.values());
  }, [
    loginExamenes,
    selectedTipoExamenId,
    selectedModalidadId,
    selectedNivelId,
  ]);

  const aniosData = useMemo(() => {
    const set = new Set<string>();
    loginExamenes
      .filter(
        (e) =>
          (!selectedTipoExamenId ||
            String(e.tipoExamenId) === selectedTipoExamenId) &&
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
    loginExamenes,
    selectedTipoExamenId,
    selectedModalidadId,
    selectedNivelId,
    selectedEspecialidadId,
  ]);

  // ---------- Metadata helper per Year ----------

  const getMetadataForYear = (year: string) => {
    const firstNivel = nivelesData[0];
    const resolvedNivelId =
      selectedNivelId ||
      (nivelesData.length === 1 &&
      firstNivel?.nombre?.toUpperCase() === 'NINGUNO'
        ? String(firstNivel.id)
        : null);

    if (resolvedNivelId === null) return [];

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

    const exams = loginExamenes.filter(
      (e) =>
        String(e.tipoExamenId) === selectedTipoExamenId &&
        String(e.modalidadId) === selectedModalidadId &&
        String(e.nivelId) === resolvedNivelId &&
        (selectedEspecialidadId
          ? String(e.especialidadId) === selectedEspecialidadId
          : !e.especialidadId || e.especialidadId === 0) &&
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
  };

  const handleConfirm = async () => {
    if (!selectedModalidadId || selectedYears.length < 2) return;

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
      const sampleExam = loginExamenes.find(
        (e) =>
          String(e.tipoExamenId) === selectedTipoExamenId &&
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
        const yearMeta = getMetadataForYear(year);
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

      // 4. LLAMADA AL SERVICIO
      let questions =
        await estructuraAcademicaService.getPreguntasByFilterMultiYear(payload);

      // --- PARCHE DE FRONTEND: Filtrar localmente por si la API devuelve más de lo pedido ---
      if (questions.length > 0) {
        questions = questions.filter((q) => {
          const qYear = String(q.year || q.anio || '0');
          // Buscamos si el año de la pregunta está en nuestros filtros
          const filterForThisYear = yearFilters.find((f) => f.year === qYear);
          if (!filterForThisYear) return false;

          // Si el año coincide, verificamos que la clasificación también esté permitida para ese año
          return (
            q.clasificacionId !== undefined &&
            filterForThisYear.clasificacionIds.includes(q.clasificacionId)
          );
        });
      }

      console.log(`Preguntas obtenidas tras filtro local: ${questions.length}`);

      // 5. Guardar metadata y redirigir
      const metadata = {
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
        router.push('/examen');
      }
    } catch (error) {
      console.error('Error confirming selection:', error);
      alert('Hubo un error al cargar el simulacro.');
    } finally {
      setIsLoading(false);
    }
  };

  // Grand Total calculation
  const totalQuestions = selectedYears.reduce((acc, year) => {
    const meta = getMetadataForYear(year);
    return (
      acc +
      meta.reduce((accM, m) => {
        return yearSelections[year]?.[m.name] ? accM + m.cantidad : accM;
      }, 0)
    );
  }, 0);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PremiumLayout
      title="Simulacro de Examen"
      breadcrumb="Pages / Simulacro de Examen"
    >
      <Head>
        <title>Simulacro de Examen - AVENDOCENTE</title>
      </Head>

      <div className="w-full space-y-6 px-4 md:px-6">
        {/* Main Box: Bloque I */}
        <div className="border border-blue-400 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="bg-white border-b border-blue-100 px-6 py-3 flex items-center gap-2">
            <AcademicCapIcon className="h-5 w-5 text-blue-500" />
            <span className="font-bold text-blue-900 text-lg">
              Bloque I - Exámenes MINEDU
            </span>
          </div>

          <div className="p-6 space-y-8">
            {/* Modalidad Selector */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
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
                className="w-full border border-blue-300 rounded-md p-3 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all shadow-sm"
              >
                <option value="">Selecciona Modalidad</option>
                {modalidadesData.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Hierarchical selectors for Nivel and Especialidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nivelesData.length > 0 &&
                !(
                  nivelesData.length === 1 &&
                  nivelesData[0]?.nombre?.toUpperCase() === 'NINGUNO'
                ) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-blue-900 font-bold">
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
                      className="w-full border border-blue-300 rounded-md p-3 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all shadow-sm"
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
                  <div className="flex items-center gap-2 text-blue-900 font-bold">
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
                    className="w-full border border-blue-300 rounded-md p-3 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all shadow-sm"
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

            {/* Years Selection with per-year classifications */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <AcademicCapIcon className="h-4 w-4" />
                <span>Selecciona mínimo dos años*</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aniosData.map((year) => {
                  const isChecked = selectedYears.includes(year);
                  const yearMeta = getMetadataForYear(year);

                  return (
                    <div key={year} className="flex flex-col gap-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleYearToggle(year)}
                            className="h-5 w-5 rounded border-blue-300 text-orange-500 focus:ring-orange-200 transition-all"
                          />
                        </div>
                        <span
                          className={`text-base font-bold transition-all ${
                            isChecked ? 'text-orange-600' : 'text-blue-900'
                          }`}
                        >
                          {year}
                        </span>
                      </label>

                      {isChecked && yearMeta.length > 0 && (
                        <div className="ml-2 border border-blue-200 rounded-xl p-4 bg-blue-50/30 space-y-3 shadow-inner">
                          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">
                            Tipos de Pregunta
                          </p>
                          <div className="space-y-2">
                            {yearMeta.map((m) => (
                              <label
                                key={m.name}
                                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                                  m.cantidad > 0
                                    ? `cursor-pointer ${
                                        yearSelections[year]?.[m.name]
                                          ? 'bg-white border-orange-200 shadow-sm'
                                          : 'bg-white/50 border-gray-100 opacity-70 hover:opacity-100 hover:border-blue-200'
                                      }`
                                    : 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-100'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={
                                      yearSelections[year]?.[m.name] || false
                                    }
                                    disabled={m.cantidad === 0}
                                    onChange={() =>
                                      handleTypeToggle(year, m.name)
                                    }
                                    className="h-4 w-4 text-orange-500 rounded border-gray-300 focus:ring-orange-200"
                                  />
                                  <span className="text-xs font-bold text-blue-800">
                                    {m.name}
                                  </span>
                                </div>
                                <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full min-w-[32px] text-center">
                                  {m.cantidad}p
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {aniosData.length === 0 && selectedModalidadId && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-red-500 text-sm font-medium">
                    ⚠️ No hay exámenes disponibles para esta selección
                  </p>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 shadow-sm">
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
        </div>

        {/* Resumen Section */}
        <div className="border border-blue-400 rounded-lg p-6 bg-white shadow-sm space-y-6">
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
                <div className="inline-block px-4 py-1.5 bg-blue-50 border border-blue-200 text-blue-500 font-bold text-xs rounded-md shadow-sm">
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
                        className="px-3 py-1 bg-yellow-100/50 border border-yellow-300 text-yellow-700 font-bold text-xs rounded-md shadow-sm"
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
                        className="bg-gray-50/50 border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between"
                      >
                        <p className="text-xs font-black text-blue-900 min-w-[80px]">
                          Año {year}:
                        </p>
                        <div className="flex flex-wrap gap-2 flex-1">
                          {selectionsForYear.length > 0 ? (
                            selectionsForYear.map(([name]) => {
                              const meta = getMetadataForYear(year).find(
                                (m) => m.name === name
                              );
                              return (
                                <span
                                  key={name}
                                  className="px-2.5 py-1 bg-white border border-blue-100 text-blue-500 font-bold text-[10px] rounded-md shadow-sm flex items-center gap-1"
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

            <div className="bg-green-100/50 border border-green-200 rounded-lg p-5 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xl font-bold text-green-700">
                  Total de preguntas seleccionadas:{' '}
                  <span className="text-2xl font-black">{totalQuestions}</span>{' '}
                  preguntas
                </p>
                <p className="text-xs font-semibold text-green-600 mt-0.5">
                  Incluye preguntas de Bloque I Exámenes MINEDU
                </p>
              </div>
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
            className="px-10 py-2.5 border border-blue-400 rounded-md text-blue-500 font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            <span className="text-lg">✕</span> Limpiar
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              isLoading ||
              selectedYears.length < 2 ||
              totalQuestions === 0 ||
              selectedYears.some(
                (y) =>
                  !Object.values(yearSelections[y] || {}).some(
                    (v) => v === true
                  )
              )
            }
            className="px-12 py-2.5 bg-blue-900 text-white rounded-md font-bold shadow-lg hover:bg-blue-800 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
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
