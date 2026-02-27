import React, { useEffect, useState, useMemo } from 'react';

import {
  AcademicCapIcon,
  QuestionMarkCircleIcon,
  XIcon,
  FilterIcon,
  CalendarIcon,
} from '@heroicons/react/outline';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuth } from '../hooks/useAuth';
import PremiumLayout from '../layouts/PremiumLayout';
import { ExamenLogin } from '../services/authService';
import { estructuraAcademicaService } from '../services/estructuraAcademicaService';
import {
  preguntaService,
  ClasificacionExamen,
} from '../services/preguntaService';

// ----- Types derived from login examenes -----
interface FilterOption {
  id: number;
  nombre: string;
}

const BancoPreguntasAscensoPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Examenes from login response
  const [loginExamenes, setLoginExamenes] = useState<ExamenLogin[]>([]);
  const [allClasificaciones, setAllClasificaciones] = useState<
    ClasificacionExamen[]
  >([]);

  // Current Selection State (Locked to Ascenso - ID: '1')
  const [selectedTipoExamenId] = useState<string>('1');
  const [selectedModalidadId, setSelectedModalidadId] = useState<string>('');
  const [selectedNivelId, setSelectedNivelId] = useState<string>('');
  const [selectedEspecialidadId, setSelectedEspecialidadId] =
    useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [conteoPreguntas, setConteoPreguntas] = useState<{
    [key: string]: {
      cantidad: number;
      puntos: number;
      tiempoPregunta: number;
      minimo: number;
    };
  }>({});

  // Checkbox State (Dynamic based on classifications)
  const [tiposPregunta, setTiposPregunta] = useState<Record<string, boolean>>(
    {}
  );

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

      // Fetch dynamic classifications from API
      preguntaService
        .getClasificaciones()
        .then((data) => setAllClasificaciones(data))
        .catch((err) => console.error('Error fetching classifications:', err));
    }
  }, [isAuthenticated]);

  // ---------- Memoized Derived Options ----------

  const modalidadesData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    loginExamenes
      .filter((e) => String(e.tipoExamenId) === selectedTipoExamenId)
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
  }, [loginExamenes, selectedTipoExamenId, selectedModalidadId]);

  const especialidadesData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    loginExamenes
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
          String(e.tipoExamenId) === selectedTipoExamenId &&
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

  // ---------- Auto-selection Logic ----------

  // 1. Auto-select Modalidad if only one
  useEffect(() => {
    if (modalidadesData.length === 1 && !selectedModalidadId) {
      setSelectedModalidadId(String(modalidadesData[0]?.id));
    }
  }, [modalidadesData, selectedModalidadId]);

  // 2. Auto-select Nivel (if only NINGUNO or unique)
  useEffect(() => {
    if (nivelesData.length === 1 && !selectedNivelId) {
      setSelectedNivelId(String(nivelesData[0]?.id));
    }
  }, [nivelesData, selectedNivelId]);

  // 3. Auto-select Especialidad
  useEffect(() => {
    if (especialidadesData.length === 1 && !selectedEspecialidadId) {
      setSelectedEspecialidadId(String(especialidadesData[0]?.id));
    }
  }, [especialidadesData, selectedEspecialidadId]);

  // ---------- Counts & Categories Logic ----------

  useEffect(() => {
    if (selectedModalidadId && selectedYear) {
      const firstNivel = nivelesData[0];
      const resolvedNivelId =
        selectedNivelId ||
        (nivelesData.length === 1 &&
        firstNivel?.nombre?.toUpperCase() === 'NINGUNO'
          ? String(firstNivel.id)
          : null);

      if (resolvedNivelId === null) return;

      const exam = loginExamenes.find(
        (e) =>
          String(e.tipoExamenId) === selectedTipoExamenId &&
          String(e.modalidadId) === selectedModalidadId &&
          String(e.nivelId) === resolvedNivelId &&
          (selectedEspecialidadId
            ? String(e.especialidadId) === selectedEspecialidadId
            : !e.especialidadId || e.especialidadId === 0) &&
          ((selectedYear === 'Único' &&
            (e.year === '0' || Number(e.year) === 0)) ||
            String(e.year) === selectedYear ||
            e.years?.some((y) => String(y.year) === selectedYear))
      );

      if (exam && exam.clasificaciones) {
        const countMap: any = {};
        exam.clasificaciones.forEach((item) => {
          const name = item.clasificacionNombre;
          if (name) {
            const meta = allClasificaciones.find(
              (c) => c.clasificacionNombre === name
            );
            let cantidadExacta = 0;
            const isUnico = selectedYear === 'Único';
            if (isUnico || !item.years || item.years.length === 0) {
              cantidadExacta = item.cantidadPreguntas;
            } else {
              const yearData = item.years.find(
                (y: any) => String(y.year) === selectedYear
              );
              cantidadExacta = yearData ? yearData.cantidadPreguntas : 0;
            }

            if (!countMap[name]) {
              countMap[name] = {
                cantidad: cantidadExacta,
                puntos: meta?.puntos || item.puntos || 0,
                tiempoPregunta:
                  meta?.tiempoPregunta || item.tiempoPregunta || 0,
                minimo: meta?.minimo || item.minimo || 0,
              };
            } else {
              countMap[name].cantidad += cantidadExacta;
            }
          }
        });
        setConteoPreguntas(countMap);

        setTiposPregunta((prev) => {
          const nextTipos: Record<string, boolean> = { ...prev };
          exam.clasificaciones.forEach((item) => {
            const name = item.clasificacionNombre;
            if (name && countMap[name]) {
              const cantidadExacta = countMap[name].cantidad;
              if (nextTipos[name] === undefined && cantidadExacta > 0) {
                nextTipos[name] = true;
              } else if (cantidadExacta === 0) {
                nextTipos[name] = false;
              }
            }
          });
          return nextTipos;
        });
      } else {
        setConteoPreguntas({});
      }
    } else {
      setConteoPreguntas({});
    }
  }, [
    selectedTipoExamenId,
    selectedModalidadId,
    selectedNivelId,
    selectedEspecialidadId,
    selectedYear,
    loginExamenes,
    nivelesData,
    allClasificaciones,
  ]);

  // --- Handlers ---

  const handleClear = () => {
    setSelectedModalidadId('');
    setSelectedNivelId('');
    setSelectedEspecialidadId('');
    setSelectedYear('');
    setTiposPregunta({});
  };

  const handleConfirm = async () => {
    if (!selectedModalidadId || !selectedYear) return;

    try {
      setIsLoading(true);

      const firstNivel = nivelesData[0];
      const resolvedNivelId =
        selectedNivelId ||
        (nivelesData.length === 1 &&
        firstNivel?.nombre?.toUpperCase() === 'NINGUNO'
          ? String(firstNivel.id)
          : '0');

      const exam = loginExamenes.find(
        (e) =>
          String(e.tipoExamenId) === selectedTipoExamenId &&
          String(e.modalidadId) === selectedModalidadId &&
          String(e.nivelId) === resolvedNivelId &&
          (selectedEspecialidadId
            ? String(e.especialidadId) === selectedEspecialidadId
            : true) &&
          ((selectedYear === 'Único' &&
            (e.year === '0' || Number(e.year) === 0)) ||
            String(e.year) === selectedYear ||
            e.years?.some((y) => String(y.year) === selectedYear))
      );

      if (!exam) {
        alert('Error: No se encontró la metadata del examen.');
        setIsLoading(false);
        return;
      }

      const finalYearValue = selectedYear === 'Único' ? '0' : selectedYear;
      const clasificacionIds: number[] = [];
      if (exam.clasificaciones) {
        exam.clasificaciones.forEach((c) => {
          // Send all classifications that have questions
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
        clasificaciones: clasificacionIds,
      };

      let questions = await estructuraAcademicaService.getPreguntasByFilter(
        payloadFiltro
      );

      // Local Filter Patch
      if (questions.length > 0) {
        questions = questions.filter((q) => {
          const matchYear =
            finalYearValue === '0' ||
            String(q.year) === finalYearValue ||
            String(q.anio) === finalYearValue;
          const matchClass =
            clasificacionIds.length === 0 ||
            (q.clasificacionId !== undefined &&
              clasificacionIds.includes(q.clasificacionId));
          return matchYear && matchClass;
        });
      }

      const metadata = {
        modalidad: exam.modalidadNombre,
        nivel: exam.nivelNombre || 'NINGUNO',
        especialidad: exam.especialidadNombre || null,
        year: finalYearValue,
      };

      localStorage.setItem('currentQuestions', JSON.stringify(questions));
      localStorage.setItem('currentExamMetadata', JSON.stringify(metadata));

      router.push('/examen');
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
                setSelectedYear('');
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
                    setSelectedYear('');
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
                  setSelectedYear('');
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
          <div className="border border-primary rounded-lg p-4 bg-white transition-all shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-primary font-bold">
              <CalendarIcon className="h-5 w-5" />
              <span>Elige un año</span>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              disabled={aniosData.length === 0}
            >
              <option value="">Selecciona Año</option>
              {aniosData.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {selectedModalidadId && aniosData.length === 0 && !isLoading && (
              <p className="text-red-500 text-xs mt-2 font-medium">
                No hay años disponibles para esta selección
              </p>
            )}
          </div>



          {/* Resumen de selección */}
          {(selectedModalidadId || selectedYear) && (
            <div className="border border-primary rounded-lg p-4 bg-white shadow-sm mt-6">
              <div className="flex items-center gap-2 mb-4 text-primary font-bold">
                <AcademicCapIcon className="h-5 w-5" />
                <span>Resumen de selección</span>
              </div>

              <div className="space-y-4">
                {selectedModalidadId && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">Modalidad</span>
                    <div className="inline-flex px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-sm font-bold w-fit">
                      {modalidadesData.find(m => String(m.id) === selectedModalidadId)?.nombre}
                    </div>
                  </div>
                )}

                {selectedNivelId && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">Nivel</span>
                    <div className="inline-flex px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-lg text-sm font-bold w-fit">
                      {nivelesData.find(n => String(n.id) === selectedNivelId)?.nombre}
                    </div>
                  </div>
                )}

                {selectedEspecialidadId && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">Especialidad</span>
                    <div className="inline-flex px-3 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-lg text-sm font-bold w-fit">
                      {especialidadesData.find(e => String(e.id) === selectedEspecialidadId)?.nombre}
                    </div>
                  </div>
                )}

                {selectedYear && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">Año</span>
                    <div className="inline-flex px-3 py-1 bg-yellow-50 text-yellow-600 border border-yellow-100 rounded-lg text-sm font-bold w-fit">
                      {selectedYear}
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
              disabled={
                isLoading ||
                !selectedModalidadId ||
                !selectedYear
              }
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
