import React, { useEffect, useState, useMemo } from 'react';

import {
  AcademicCapIcon,
  XIcon,
  FilterIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/outline';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuth } from '../hooks/useAuth';
import PremiumLayout from '../layouts/PremiumLayout';
import { authService } from '../services/authService';
import { preguntaService } from '../services/preguntaService';

// ----- Types derived from login examenes -----
interface FilterOption {
  id: number;
  nombre: string;
}

const BancoPreguntasAscensoPage = () => {
  const { isAuthenticated, loading, user, refreshAuth } = useAuth();
  const router = useRouter();

  // Fresh examenes fetched directly from API on page load
  const [examenes, setExamenes] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('loginExamenes');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });
  // const [isFetchingExamenes, setIsFetchingExamenes] = useState(false);

  // Current Selection State (Locked to Ascenso - ID: '1')
  const [selectedTipoExamenId] = useState<string>('1');
  const [selectedModalidadId, setSelectedModalidadId] = useState<string>('');
  const [selectedNivelId, setSelectedNivelId] = useState<string>('');
  const [selectedEspecialidadId, setSelectedEspecialidadId] =
    useState<string>('');
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [conteoPreguntas, setConteoPreguntas] = useState<any>({});

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Fetch FRESH data from API
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    if (examenes.length === 0) {
      // setIsFetchingExamenes(true);
    }

    const loadData = async () => {
      try {
        const [filters] = await Promise.all([
          authService.getUserFilters(user.id),
          refreshAuth().catch(() => null),
        ]);

        const rawExamenes = filters.examenes || [];
        const apiUser = (filters as any).user || user;
        const userExamenesList: any[] = apiUser?.userExamenes || [];
        const accesoNombres: string[] = apiUser?.accesoNombres || [];
        const canAscenso = accesoNombres.some((a) =>
          a.toLowerCase().includes('ascenso')
        );

        const combined = [...rawExamenes];

        if (canAscenso) {
          userExamenesList.forEach((ue: any, idx: number) => {
            const exists = combined.some(
              (e) =>
                String(e.tipoExamenId) === '1' &&
                Number(e.modalidadId) === Number(ue.modalidadId) &&
                Number(e.nivelId) === Number(ue.nivelId || 0)
            );
            if (!exists) {
              combined.push({
                id: -(idx + 3000),
                tipoExamenId: 1,
                tipoExamenNombre: 'Ascenso',
                fuenteId: 1,
                fuenteNombre: 'MINEDU Ascenso',
                modalidadId: ue.modalidadId,
                modalidadNombre: ue.modalidadNombre,
                nivelId: ue.nivelId || 0,
                nivelNombre: ue.nivelNombre || 'NINGUNO',
                especialidadId: ue.especialidadId || null,
                especialidadNombre: ue.especialidadNombre || null,
                years: [{ year: 0, cantidadPreguntas: 0 }],
                cantidadPreguntas: 0,
                clasificaciones: [],
              });
            }
          });
        }

        setExamenes(combined);
        localStorage.setItem('loginExamenes', JSON.stringify(combined));
      } catch (error) {
        console.error('Error loading filters:', error);
      } finally {
        // setIsFetchingExamenes(false);
      }
    };

    loadData();
  }, [user?.id, isAuthenticated, refreshAuth]);

  // ---------- Memoized Derived Options ----------

  const modalidadesData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    examenes
      .filter((e) => String(e.tipoExamenId) === selectedTipoExamenId)
      .forEach((e) => {
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
  }, [examenes, selectedTipoExamenId]);

  const nivelesData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    examenes
      .filter(
        (e) =>
          String(e.tipoExamenId) === selectedTipoExamenId &&
          (!selectedModalidadId ||
            String(e.modalidadId) === selectedModalidadId)
      )
      .forEach((e) => {
        if (!map.has(e.nivelId)) {
          map.set(e.nivelId, { id: e.nivelId, nombre: e.nivelNombre });
        }
      });
    return Array.from(map.values());
  }, [examenes, selectedTipoExamenId, selectedModalidadId]);

  const especialidadesData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    examenes
      .filter(
        (e) =>
          String(e.tipoExamenId) === selectedTipoExamenId &&
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
  }, [examenes, selectedTipoExamenId, selectedModalidadId, selectedNivelId]);

  const yearsData = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string }>();
    examenes
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
        if (e.years && Array.isArray(e.years)) {
          e.years.forEach((y: any) => {
            const yVal = typeof y === 'object' ? y.year : y;
            const yCant =
              typeof y === 'object'
                ? y.cantidadPreguntas ?? y.cantidad_p ?? 1
                : 1;

            if (yVal && Number(yVal) > 0 && yCant > 0) {
              map.set(Number(yVal), {
                id: Number(yVal),
                nombre: String(yVal),
              });
            }
          });
        } else if (e.year) {
          const yVal = Number(e.year);
          if (yVal > 0) {
            map.set(yVal, {
              id: yVal,
              nombre: String(yVal),
            });
          }
        }
      });
    return Array.from(map.values()).sort((a, b) => b.id - a.id);
  }, [
    examenes,
    selectedTipoExamenId,
    selectedModalidadId,
    selectedNivelId,
    selectedEspecialidadId,
  ]);

  // ---------- Auto-selection Logic ----------

  useEffect(() => {
    if (modalidadesData.length === 1 && !selectedModalidadId) {
      setSelectedModalidadId(String(modalidadesData[0]?.id));
    }
  }, [modalidadesData, selectedModalidadId]);

  useEffect(() => {
    if (nivelesData.length === 1 && !selectedNivelId) {
      setSelectedNivelId(String(nivelesData[0]?.id));
    }
  }, [nivelesData, selectedNivelId]);

  useEffect(() => {
    if (especialidadesData.length === 1 && !selectedEspecialidadId) {
      setSelectedEspecialidadId(String(especialidadesData[0]?.id));
    }
  }, [especialidadesData, selectedEspecialidadId]);

  useEffect(() => {
    if (yearsData.length === 1 && yearsData[0]?.id !== 0 && !selectedYearId) {
      setSelectedYearId(String(yearsData[0]?.id));
    }
  }, [yearsData, selectedYearId]);

  // ---------- Counts Logic ----------
  useEffect(() => {
    if (selectedModalidadId) {
      const firstNivel = nivelesData[0];
      const resolvedNivelId =
        selectedNivelId ||
        (nivelesData.length === 1 &&
        firstNivel?.nombre?.toUpperCase() === 'NINGUNO'
          ? String(firstNivel.id)
          : null) ||
        '0';

      const matchedExams = examenes.filter(
        (e) =>
          String(e.tipoExamenId) === selectedTipoExamenId &&
          String(e.modalidadId) === selectedModalidadId &&
          String(e.nivelId) === resolvedNivelId &&
          (selectedEspecialidadId
            ? String(e.especialidadId) === selectedEspecialidadId
            : true) &&
          (selectedYearId !== '0' && selectedYearId !== ''
            ? e.years?.some((y: any) => String(y.year) === selectedYearId) ||
              String(e.year) === selectedYearId
            : true)
      );

      const countMap: any = {};
      matchedExams.forEach((exam) => {
        if (exam.clasificaciones) {
          exam.clasificaciones.forEach((item: any) => {
            const name = item.clasificacionNombre;
            if (name) {
              let cantidad = 0;
              if (selectedYearId === '0') {
                cantidad = item.cantidadPreguntas || 0;
              } else if (selectedYearId) {
                if (item.years && Array.isArray(item.years)) {
                  const yrObj = item.years.find(
                    (y: any) => String(y.year) === selectedYearId
                  );
                  cantidad = yrObj ? yrObj.cantidadPreguntas || 0 : 0;
                } else if (String(exam.year) === selectedYearId) {
                  cantidad = item.cantidadPreguntas || 0;
                }
              }

              if (!countMap[name]) {
                let correctedCantidad = cantidad;
                if (
                  name === 'CCP' ||
                  name === 'Conocimientos Curriculares y Pedagógicos' ||
                  name === 'Conocimientos Curriculares y Pedagócicos'
                ) {
                  if (cantidad > 0) correctedCantidad = 60;
                }

                countMap[name] = {
                  cantidad: correctedCantidad,
                  puntos: item.puntos || 0,
                  tiempoPregunta: item.tiempoPregunta || 0,
                  minimo: item.minimo || 0,
                };
              } else {
                countMap[name].cantidad += cantidad;
                if (
                  name === 'CCP' ||
                  name === 'Conocimientos Curriculares y Pedagógicos' ||
                  name === 'Conocimientos Curriculares y Pedagócicos'
                ) {
                  if (countMap[name].cantidad > 0) countMap[name].cantidad = 60;
                }
              }
            }
          });
        }
      });
      setConteoPreguntas(countMap);
    }
  }, [
    selectedTipoExamenId,
    selectedModalidadId,
    selectedNivelId,
    selectedEspecialidadId,
    selectedYearId,
    examenes,
    nivelesData,
  ]);

  // ---------- Handlers ----------

  const handleClear = () => {
    setSelectedModalidadId('');
    setSelectedNivelId('');
    setSelectedEspecialidadId('');
    setSelectedYearId('');
    setConteoPreguntas({});
  };

  const handleConfirm = async () => {
    if (!selectedModalidadId) return;

    try {
      setIsLoading(true);

      const firstNivel = nivelesData[0];
      const resolvedNivelId =
        selectedNivelId ||
        (nivelesData.length === 1 &&
        firstNivel?.nombre?.toUpperCase() === 'NINGUNO'
          ? String(firstNivel.id)
          : '0');

      const exam = examenes.find(
        (e) =>
          String(e.tipoExamenId) === selectedTipoExamenId &&
          String(e.modalidadId) === selectedModalidadId &&
          String(e.nivelId) === resolvedNivelId &&
          (selectedEspecialidadId
            ? String(e.especialidadId) === selectedEspecialidadId
            : true) &&
          (selectedYearId !== '0' && selectedYearId !== ''
            ? e.years?.some((y: any) => String(y.year) === selectedYearId) ||
              String(e.year) === selectedYearId
            : true)
      );

      if (!exam) {
        alert('Error: No se encontró la metadata del examen.');
        setIsLoading(false);
        return;
      }

      const finalYearValue = selectedYearId || '0';
      const clasificacionIds: number[] = [];
      if (exam.clasificaciones) {
        exam.clasificaciones.forEach((c: any) => {
          clasificacionIds.push(c.clasificacionId);
        });
      }

      const payloadFiltro = {
        tipoExamenId: exam.tipoExamenId,
        fuenteId: exam.fuenteId || 0,
        modalidadId: exam.modalidadId,
        nivelId: exam.nivelId,
        especialidadId: exam.especialidadId || 0,
        year: finalYearValue,
        clasificaciones: [], // empty to fetch all questions for this exam
      };

      const questions = await preguntaService.examenFilter(payloadFiltro);

      // Note: We used to filter locally here by year and clasificacionId,
      // but since the API is already doing it, it's safer to trust the API result
      // to avoid missing questions with inconsistent metadata.
      // (e.g. 53 vs 60 questions issue).

      const metadata = {
        tipoExamenId: 1,
        modalidad: exam.modalidadNombre,
        nivel: exam.nivelNombre || 'NINGUNO',
        especialidad: exam.especialidadNombre || null,
        year: selectedYearId || '0',
      };

      localStorage.setItem('currentQuestions', JSON.stringify(questions));
      localStorage.setItem('currentExamMetadata', JSON.stringify(metadata));

      router.push(`/examen?from=${router.asPath}`);
    } catch (error) {
      console.error('Error confirming selection:', error);
      alert('Hubo un error al cargar las preguntas.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0a192f]"></div>
      </div>
    );
  }

  return (
    <PremiumLayout
      title="Banco de preguntas Ascenso"
      breadcrumb="Pages / Banco de preguntas Ascenso"
    >
      <Head>
        <title>Banco de Preguntas Ascenso - AVENDOCENTE</title>
      </Head>

      <div className="w-full space-y-6">
        <div className="text-center py-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-[#2B3674]">
            Selecciona tus preferencias (Ascenso)
          </h3>
          <p className="text-[#A3AED0] text-base mt-1 font-medium">
            Filtra paso a paso para encontrar el examen de ascenso deseado
          </p>
          <p className="text-xl md:text-2xl font-extrabold text-[#2B3674] mt-2">
            Ascenso
          </p>
        </div>

        <div className="space-y-4">
          {/* Modalidad Selector */}
          <div className="border border-primary rounded-lg p-4 bg-white transition-all shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-primary font-bold">
              <AcademicCapIcon className="h-5 w-5" />
              <span>Modalidad habilitada</span>
            </div>
            <select
              value={selectedModalidadId}
              onChange={(e) => {
                setSelectedModalidadId(e.target.value);
                setSelectedNivelId('');
                setSelectedEspecialidadId('');
                setSelectedYearId('');
              }}
              className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              disabled={isLoading}
            >
              <option value="">Selecciona Modalidad</option>
              {modalidadesData.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Nivel Selector */}
          {nivelesData.length > 0 &&
            !(
              nivelesData.length === 1 &&
              nivelesData[0]?.nombre?.toUpperCase() === 'NINGUNO'
            ) && (
              <div className="border border-primary rounded-lg p-4 bg-white transition-all shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                  <FilterIcon className="h-5 w-5" />
                  <span>Nivel</span>
                </div>
                <select
                  value={selectedNivelId}
                  onChange={(e) => {
                    setSelectedNivelId(e.target.value);
                    setSelectedEspecialidadId('');
                    setSelectedYearId('');
                  }}
                  className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
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
            <div className="border border-primary rounded-lg p-4 bg-white transition-all shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                <AcademicCapIcon className="h-5 w-5" />
                <span>Especialidad</span>
              </div>
              <select
                value={selectedEspecialidadId}
                onChange={(e) => {
                  setSelectedEspecialidadId(e.target.value);
                  setSelectedYearId('');
                }}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                disabled={
                  !selectedModalidadId ||
                  (nivelesData.length > 1 && !selectedNivelId)
                }
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

          {/* Año Selector */}
          {yearsData.length > 0 && (
            <div className="border border-primary rounded-lg p-4 bg-white transition-all shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                <AcademicCapIcon className="h-5 w-5" />
                <span>Año</span>
              </div>
              <select
                value={selectedYearId}
                onChange={(e) => {
                  setSelectedYearId(e.target.value);
                }}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white transition-all"
                disabled={
                  isLoading ||
                  !selectedModalidadId ||
                  (nivelesData.length > 1 && !selectedNivelId) ||
                  (especialidadesData.length > 0 && !selectedEspecialidadId)
                }
              >
                <option value="">Selecciona Año</option>
                {yearsData.map((y) => (
                  <option key={y.id} value={String(y.id)}>
                    {y.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tipos de Pregunta - Only show after Year is selected */}
          {selectedYearId && (
            <div className="border border-primary rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                <QuestionMarkCircleIcon className="h-5 w-5" />
                <span>Tipos de Pregunta*</span>
              </div>

              <div className="space-y-3">
                {Object.entries(conteoPreguntas)
                  .sort(([a], [b]) => {
                    const order: Record<string, number> = {
                      CL: 1,
                      'Comprensión Lectora': 1,
                      RL: 2,
                      'Razonamiento Lógico': 2,
                      CCP: 3,
                      'Conocimientos Curriculares y Pedagógicos': 3,
                    };
                    return (order[a] || 99) - (order[b] || 99);
                  })
                  .map(([name, data]: [string, any]) => (
                    <div
                      key={name}
                      className={`border rounded-xl p-4 flex flex-col gap-2 transition-all ${
                        data.cantidad > 0
                          ? 'border-gray-200 bg-gray-50/30'
                          : 'opacity-50 border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[#2B3674] font-bold text-lg">
                          {name === 'Conocimientos Curriculares y Pedagócicos'
                            ? 'Conocimientos Curriculares y Pedagógicos'
                            : name}
                        </span>
                        <span
                          className={`${
                            data.cantidad > 0
                              ? 'text-[#05CD99]'
                              : 'text-gray-400'
                          } text-sm font-medium`}
                        >
                          {data.cantidad > 0
                            ? `${data.cantidad} preguntas`
                            : '0 preguntas (no disponible)'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Resumen de selección */}
          {selectedModalidadId && (
            <div className="border border-primary rounded-lg p-4 bg-white shadow-sm mt-6">
              <div className="flex items-center gap-2 mb-4 text-primary font-bold">
                <AcademicCapIcon className="h-5 w-5" />
                <span>Resumen de selección</span>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    Modalidad
                  </span>
                  <div className="inline-flex px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-sm font-bold w-fit">
                    {
                      modalidadesData.find(
                        (m) => String(m.id) === selectedModalidadId
                      )?.nombre
                    }
                  </div>
                </div>

                {selectedNivelId && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      Nivel
                    </span>
                    <div className="inline-flex px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-lg text-sm font-bold w-fit">
                      {
                        nivelesData.find(
                          (n) => String(n.id) === selectedNivelId
                        )?.nombre
                      }
                    </div>
                  </div>
                )}

                {selectedEspecialidadId && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      Especialidad
                    </span>
                    <div className="inline-flex px-3 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-lg text-sm font-bold w-fit">
                      {
                        especialidadesData.find(
                          (e) => String(e.id) === selectedEspecialidadId
                        )?.nombre
                      }
                    </div>
                  </div>
                )}

                {selectedYearId && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      Año
                    </span>
                    <div className="inline-flex px-3 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg text-sm font-bold w-fit">
                      {yearsData.find((y) => String(y.id) === selectedYearId)
                        ?.nombre ||
                        (selectedYearId === '0'
                          ? 'Todos los años'
                          : selectedYearId)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resumen Final y Botones */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={handleClear}
              className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-500 font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <XIcon className="h-5 w-5" />
              Limpiar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || !selectedModalidadId || !selectedYearId}
              className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Cargando...' : 'Confirmar selección'}
            </button>
          </div>
        </div>
      </div>
    </PremiumLayout>
  );
};

export default BancoPreguntasAscensoPage;
