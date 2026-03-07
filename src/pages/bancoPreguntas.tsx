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

import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../hooks/useAuth';
import PremiumLayout from '../layouts/PremiumLayout';
import { authService } from '../services/authService';
import {
  preguntaService,
  ClasificacionExamen,
} from '../services/preguntaService';

// ----- Types derived from login examenes -----
interface FilterOption {
  id: number;
  nombre: string;
}

// Fixed missing type for modal headings
interface UserExamen {
  modalidadId: number;
  modalidadNombre: string;
  nivelId: number;
  nivelNombre: string;
  especialidadId?: number;
  especialidadNombre?: string;
}

const TIPO_FULL_NAMES: Record<string, string> = {
  CCP: 'Conocimientos Curriculares y Pedagógicos',
  CL: 'Comprensión Lectora',
  RL: 'Razonamiento Lógico',
  CG: 'Conocimientos Generales',
};

const BancoPreguntasPage = () => {
  const { isAuthenticated, loading, user, refreshAuth } = useAuth();
  const router = useRouter();

  // Fresh examenes fetched directly from API on page load (not from login cache)
  const [examenes, setExamenes] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('examenes');
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
  const [isFetchingExamenes, setIsFetchingExamenes] = useState(false);

  const [allClasificaciones, setAllClasificaciones] = useState<
    ClasificacionExamen[]
  >([]);

  // Current Selection State (Using strings for consistency with <select> values)
  const [selectedTipoExamenId, setSelectedTipoExamenId] = useState<string>('2');
  const [selectedModalidadId, setSelectedModalidadId] = useState<string>('');
  const [selectedNivelId, setSelectedNivelId] = useState<string>('');
  const [selectedEspecialidadId, setSelectedEspecialidadId] =
    useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [examToStart, setExamToStart] = useState<any>(null);
  const [questionsToStore, setQuestionsToStore] = useState<any[]>([]);

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

  // Fetch FRESH data from API
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    // Only show blocking loader if we have NO data in cache
    if (examenes.length === 0) {
      setIsFetchingExamenes(true);
    }

    const loadData = async () => {
      try {
        // Run all critical initialization in parallel
        const [filters, classifications] = await Promise.all([
          authService.getUserFilters(user.id),
          preguntaService.getClasificaciones().catch(() => []),
          refreshAuth().catch(() => null),
        ]);

        // Update classifications
        if (classifications && classifications.length > 0) {
          setAllClasificaciones(classifications);
        }

        // Process examenes
        const rawExamenes = filters.examenes || [];
        const apiUser = (filters as any).user || user;
        const userExamenesList: any[] = apiUser?.userExamenes || [];
        const accesoNombres: string[] = apiUser?.accesoNombres || [];
        const canNombramiento = accesoNombres.some((a) =>
          a.toLowerCase().includes('nombramiento')
        );
        const canAscenso = accesoNombres.some((a) =>
          a.toLowerCase().includes('ascenso')
        );

        const combined = [...rawExamenes];

        if (userExamenesList.length > 0) {
          userExamenesList.forEach((ue: UserExamen, idx: number) => {
            if (canNombramiento) {
              const exists = combined.some(
                (e) =>
                  String(e.tipoExamenId) === '2' &&
                  Number(e.modalidadId) === Number(ue.modalidadId) &&
                  Number(e.nivelId) === Number(ue.nivelId || 0)
              );
              if (!exists && ue.modalidadNombre) {
                combined.push({
                  id: -(idx + 1000),
                  tipoExamenId: 2,
                  tipoExamenNombre: 'Nombramiento',
                  fuenteId: 1,
                  fuenteNombre: 'MINEDU Nombramiento',
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
            }
            if (canAscenso) {
              const exists = combined.some(
                (e) =>
                  String(e.tipoExamenId) === '1' &&
                  Number(e.modalidadId) === Number(ue.modalidadId) &&
                  Number(e.nivelId) === Number(ue.nivelId || 0)
              );
              if (!exists && ue.modalidadNombre) {
                combined.push({
                  id: -(idx + 2000),
                  tipoExamenId: 1,
                  tipoExamenNombre: 'Ascenso',
                  fuenteId: 2,
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
            }
          });
        }

        setExamenes(combined);
        localStorage.setItem('examenes', JSON.stringify(combined));
      } catch (err) {
        console.error('Error fetching fresh data:', err);
      } finally {
        setIsFetchingExamenes(false);
      }
    };

    loadData();
  }, [isAuthenticated, user?.id]);

  // Remove the old separate effect for classifications
  /* 
  useEffect(() => {
    if (isAuthenticated) {
      preguntaService
        .getClasificaciones()
        .then((data) => setAllClasificaciones(data))
        .catch((err) => console.error('Error fetching classifications:', err));
    }
  }, [isAuthenticated]);
  */

  // ---------- Memoized Derived Options ----------

  const tiposExamenData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    examenes.forEach((e) => {
      if (!map.has(e.tipoExamenId)) {
        map.set(e.tipoExamenId, {
          id: e.tipoExamenId,
          nombre: e.tipoExamenNombre || 'Sin nombre',
        });
      }
    });
    return Array.from(map.values());
  }, [examenes]);

  const modalidadesData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    examenes
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
    return Array.from(map.values())
      .filter(
        (m) =>
          m.nombre &&
          m.nombre !== 'string' &&
          m.nombre.toUpperCase() !== 'NINGUNO'
      )
      .sort((a, b) => {
        const orderValues = [
          'Educación Básica Regular',
          'Educación Básica Alternativa',
          'Educación Básica Especial',
          'CETPRO'
        ];
        const idxA = orderValues.findIndex((o) => a.nombre.includes(o));
        const idxB = orderValues.findIndex((o) => b.nombre.includes(o));
        const valA = idxA === -1 ? 99 : idxA;
        const valB = idxB === -1 ? 99 : idxB;
        if (valA !== valB) return valA - valB;
        return a.nombre.localeCompare(b.nombre);
      });
  }, [examenes, selectedTipoExamenId]);

  const nivelesData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    examenes
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
    return Array.from(map.values()).filter(
      (n) => n.nombre && n.nombre.toUpperCase() !== 'NINGUNO' && n.nombre !== 'string'
    );
  }, [examenes, selectedTipoExamenId, selectedModalidadId]);

  const especialidadesData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    examenes
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
    return Array.from(map.values()).filter(
      (e) => e.nombre && e.nombre !== 'string' && e.nombre.toLowerCase() !== 'null'
    );
  }, [
    examenes,
    selectedTipoExamenId,
    selectedModalidadId,
    selectedNivelId,
  ]);

  const aniosData = useMemo(() => {
    const set = new Set<string>();
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
      .forEach((e: any) => {
        if (e.years && e.years.length > 0) {
          e.years.forEach((y: any) => set.add(String(y.year)));
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
    examenes,
    selectedTipoExamenId,
    selectedModalidadId,
    selectedNivelId,
    selectedEspecialidadId,
  ]);

  // ---------- Auto-selection Logic ----------

  // 1. Auto-select Tipo de Examen
  useEffect(() => {
    if (tiposExamenData.length === 1 && !selectedTipoExamenId) {
      setSelectedTipoExamenId(String(tiposExamenData[0]?.id));
    }
  }, [tiposExamenData, selectedTipoExamenId]);

  // 2. Auto-select Nivel (if only NINGUNO)
  useEffect(() => {
    const firstNivel = nivelesData[0];
    if (
      nivelesData.length === 1 &&
      firstNivel?.nombre?.toUpperCase() === 'NINGUNO' &&
      !selectedNivelId
    ) {
      setSelectedNivelId(String(firstNivel.id));
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
      // Resolve nivelId (even if hidden)
      const resolvedNivelId =
        selectedNivelId ||
        (nivelesData.length === 1 &&
        firstNivel?.nombre?.toUpperCase() === 'NINGUNO'
          ? String(firstNivel.id)
          : null);

      if (resolvedNivelId === null) return;

      const exam = examenes.find(
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
            e.years?.some((y: any) => String(y.year) === selectedYear))
      );

      if (exam && exam.clasificaciones) {
        const countMap: any = {};

        exam.clasificaciones.forEach((item: any) => {
          const name = item.clasificacionNombre;

          if (name) {
            // Find metadata from dynamic API classifications if available
            const meta = allClasificaciones.find(
              (c) => c.clasificacionNombre === name
            );

            // Buscar la cantidad exacta para el año seleccionado
            let cantidadExacta = 0;
            const isUnico = selectedYear === 'Único';

            if (isUnico || !item.years || item.years.length === 0) {
              cantidadExacta = item.cantidadPreguntas;
            } else {
              // Buscar específicamente el año en el array de la clasificación
              const yearData = item.years.find(
                (y: any) => String(y.year) === selectedYear
              );
              cantidadExacta = yearData ? yearData.cantidadPreguntas : 0;
            }

            // Evitar duplicados si la API mandara la misma clasificación dos veces por error
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

        setTiposPregunta((prev: any) => {
          const nextTipos: Record<string, boolean> = { ...prev };
          exam.clasificaciones.forEach((item: any) => {
            const name = item.clasificacionNombre;
            if (name && countMap[name]) {
              const cantidadExacta = countMap[name].cantidad;
              // Dynamic re-selection of types based on year data
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
    examenes,
    nivelesData,
    allClasificaciones,
  ]);

  // --- Handlers ---

  const handleClear = () => {
    setIsClearModalOpen(true);
  };

  const confirmClear = () => {
    setSelectedTipoExamenId('2');
    setSelectedModalidadId('');
    setSelectedNivelId('');
    setSelectedEspecialidadId('');
    setSelectedYear('');
    setTiposPregunta({});
    setIsClearModalOpen(false);
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

      // 1. Buscamos el examen en la metadata para sacar TODOS los IDs
      const exam = examenes.find(
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
            e.years?.some((y: any) => String(y.year) === selectedYear))
      );

      // Si no encuentra el examen en la memoria, no podemos armar el payload
      if (!exam) {
        alert(
          'Error de sincronización: No se encontró la metadata del examen.'
        );
        setIsLoading(false);
        return;
      }

      const finalYearValue = selectedYear === 'Único' ? '0' : selectedYear;

      // 2. Extraemos los ClasificacionIds
      const clasificacionIds: number[] = [];
      if (exam.clasificaciones) {
        exam.clasificaciones.forEach((c: any) => {
          if (tiposPregunta[c.clasificacionNombre]) {
            clasificacionIds.push(c.clasificacionId);
          }
        });
      }

      // 3. ARMAMOS EL PAYLOAD EXACTO PARA LA API
      const payloadFiltro = {
        tipoExamenId: exam.tipoExamenId,
        fuenteId: exam.fuenteId || 0,
        modalidadId: exam.modalidadId,
        nivelId: exam.nivelId,
        especialidadId: exam.especialidadId || 0,
        year: finalYearValue,
        clasificaciones: clasificacionIds,
      };

      console.log('Enviando filtro a la API:', payloadFiltro);

      // 4. LLAMADA AL SERVICIO
      let questions = await preguntaService.examenFilter(payloadFiltro);

      // --- PARCHE DE FRONTEND: Filtrar localmente si el backend nos devuelve todo mezclado ---
      if (questions.length > 0) {
        questions = questions.filter((q: any) => {
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

      setQuestionsToStore(questions);
      setExamToStart(exam);
      setIsConfirmModalOpen(true);
    } catch (error) {
      console.error('Error confirming selection:', error);
      alert('Hubo un error al cargar las preguntas.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmGoToExam = () => {
    if (!examToStart) return;

    const finalYearValue = selectedYear === 'Único' ? '0' : selectedYear;
    const metadata = {
      tipoExamen: examToStart.tipoExamenNombre,
      modalidad: examToStart.modalidadNombre,
      nivel: examToStart.nivelNombre || 'NINGUNO',
      especialidad: examToStart.especialidadNombre || null,
      year: finalYearValue,
    };

    localStorage.setItem('currentQuestions', JSON.stringify(questionsToStore));
    localStorage.setItem('currentExamMetadata', JSON.stringify(metadata));

    router.push(`/examen?from=${router.pathname}`);
  };
  if (loading || !isAuthenticated || (isFetchingExamenes && examenes.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0a192f]"></div>
      </div>
    );
  }

  return (
    <PremiumLayout
      title="Banco de preguntas"
      breadcrumb="Pages / Banco de preguntas"
    >
      <Head>
        <title>Banco de Preguntas - AVENDOCENTE</title>
      </Head>

      <div className="w-full px-4 md:px-8 space-y-6 pb-20">
        <div className="text-center py-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-[#2B3674]">
            Selecciona tus preferencias
          </h3>
          <p className="text-[#A3AED0] text-base mt-1 font-medium">
            Filtra paso a paso para encontrar el examen deseado
          </p>
        </div>

        <div className="space-y-4">
          {/* 1. Tipo de Examen - Locked to Nombramiento */}
          {/* <div className="border border-primary rounded-lg p-4 bg-white transition-all shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-primary font-bold">
              <FilterIcon className="h-5 w-5" />
              <span>Tipo de Examen habilitado</span>
            </div>
            <select
              value={selectedTipoExamenId}
              onChange={(e) => {
                setSelectedTipoExamenId(e.target.value);
                setSelectedModalidadId('');
                setSelectedNivelId('');
                setSelectedEspecialidadId('');
                setSelectedYear('');
                setTiposPregunta({});
              }}
              className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              disabled={isLoading}
            >
              <option value="">Selecciona Tipo de Examen</option>
              {tiposExamenData.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div> */}

          {modalidadesData.length > 0 && (
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
                disabled={isLoading || !selectedTipoExamenId}
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

          {nivelesData.length > 0 &&
            !(
              nivelesData.length === 1 &&
              nivelesData[0]?.nombre?.toUpperCase() === 'NINGUNO'
            ) && (
              <div className="border border-primary rounded-lg p-4 bg-white transition-all">
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

          {especialidadesData.length > 0 && (
            <div className="border border-primary rounded-lg p-4 bg-white transition-all">
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

          {aniosData.length > 0 && (
            <div className="border border-primary rounded-lg p-4 bg-white transition-all">
              <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                <CalendarIcon className="h-5 w-5" />
                <span>Elige un año</span>
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                  No hay exámenes disponibles para esta selección
                </p>
              )}
            </div>
          )}

          <div className="border border-primary rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3 text-primary font-bold">
              <QuestionMarkCircleIcon className="h-5 w-5" />
              <span>Tipos de Pregunta*</span>
            </div>

            <div className="space-y-3">
              {Object.entries(conteoPreguntas).map(
                ([name, data]: [string, any]) => (
                  <label
                    key={name}
                    className={`border rounded-xl p-4 flex flex-col gap-2 transition-all ${
                      data.cantidad > 0
                        ? `cursor-pointer hover:bg-gray-50 ${
                            tiposPregunta[name]
                              ? 'border-primary bg-blue-50 ring-1 ring-primary'
                              : 'border-gray-200'
                          }`
                        : 'cursor-not-allowed opacity-50 border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                        checked={tiposPregunta[name] || false}
                        disabled={data.cantidad === 0}
                        onChange={(e) =>
                          setTiposPregunta({
                            ...tiposPregunta,
                            [name]: e.target.checked,
                          })
                        }
                      />
                      <div className="flex flex-col">
                        <span className="text-[#2B3674] font-bold text-lg">
                          {name}
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
                  </label>
                )
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              * Selecciona al menos un tipo de pregunta
            </p>
          </div>

          {Object.values(tiposPregunta).some((isChecked) => isChecked) && (
            <div className="mt-8 space-y-6">
              {Object.values(conteoPreguntas).reduce(
                (acc: number, curr: any) => acc + curr.cantidad,
                0
              ) > 0 && (
                <div className="border border-gray-200 rounded-xl p-5 bg-[#FAFAFA]">
                  <h3 className="font-bold text-[#2B3674] text-lg mb-4">
                    Tipos de Pregunta Seleccionados
                  </h3>

                  <div className="space-y-3">
                    {Object.entries(conteoPreguntas).map(
                      ([name, data]: [string, any]) => {
                        if (tiposPregunta[name] && data.cantidad > 0) {
                          return (
                            <div
                              key={name}
                              className="bg-[#F8FBFF] border border-blue-100 rounded-2xl p-5 shadow-sm"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <span className="font-extrabold text-[#2B3674] text-base leading-tight">
                                  {TIPO_FULL_NAMES[name] || name}
                                </span>
                                <div className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-indigo-200">
                                  {name.substring(0, 3).toUpperCase()}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <span className="bg-blue-100/50 text-blue-500 border border-blue-200 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                                  <span className="text-blue-400">📝</span> {data.cantidad} preguntas
                                </span>
                                <span className="bg-green-100/50 text-green-600 border border-green-200 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                                  <span className="text-green-500">⭐</span> {data.puntos} pts/correcta
                                </span>
                                <span className="bg-purple-100/50 text-purple-500 border border-purple-200 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                                  <span className="text-purple-400">🎯</span> Máx: {data.cantidad * data.puntos} pts
                                </span>
                                <span className="bg-orange-100/50 text-orange-500 border border-orange-200 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                                  <span className="text-orange-400">✅</span> Mínimo: {data.minimo} pts
                                </span>
                                <span className="bg-yellow-100/50 text-yellow-600 border border-yellow-200 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                                  <span className="text-yellow-500">⏱️</span> {data.tiempoPregunta} min/preg
                                </span>
                                <span className="bg-red-100/50 text-red-500 border border-red-200 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                                  <span className="text-red-400">⏰</span> Total: {data.cantidad * data.tiempoPregunta} min
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }
                    )}

                    {/* Resumen Total */}
                    <div className="bg-[#FAFBFD] border border-gray-200 rounded-lg p-4 mt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-lg">📊</div>
                        <span className="font-bold text-[#2B3674]">
                          Resumen Total
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm">
                          <span>📝</span>{' '}
                          {Object.entries(conteoPreguntas).reduce(
                            (acc, [name, curr]: [string, any]) =>
                              tiposPregunta[name] ? acc + curr.cantidad : acc,
                            0
                          )}{' '}
                          preguntas totales
                        </span>
                        <span className="bg-green-50 text-green-700 border border-green-200 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm">
                          <span>⏱️</span>{' '}
                          {Object.entries(conteoPreguntas).reduce(
                            (acc, [name, curr]: [string, any]) =>
                              tiposPregunta[name]
                                ? acc + curr.cantidad * curr.tiempoPregunta
                                : acc,
                            0
                          )}{' '}
                          min totales
                        </span>
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm">
                          <span>🎯</span>{' '}
                          {Object.entries(conteoPreguntas).reduce(
                            (acc, [name, curr]: [string, any]) =>
                              tiposPregunta[name]
                                ? acc + curr.cantidad * curr.puntos
                                : acc,
                            0
                          )}{' '}
                          pts máximo
                        </span>
                        <span className="bg-orange-50 text-orange-700 border border-orange-200 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm">
                          <span>✅</span>{' '}
                          {Object.entries(conteoPreguntas).reduce(
                            (acc, [name, curr]: [string, any]) =>
                              tiposPregunta[name] ? acc + curr.minimo : acc,
                            0
                          )}{' '}
                          pts mínimo
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resumen de selección (Modalidad, Nivel, etc) */}
          {(selectedTipoExamenId ||
            selectedModalidadId ||
            selectedNivelId ||
            selectedEspecialidadId ||
            selectedYear) && (
            <div className="border border-cyan-300 rounded-xl p-6 bg-white shadow-sm mt-6">
              <div className="flex items-center gap-2 mb-6">
                <AcademicCapIcon className="h-6 w-6 text-[#2B3674]" />
                <h3 className="font-bold text-[#2B3674] text-lg">
                  Resumen de selección
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedModalidadId && (
                  <div className="bg-[#F4F7FE] p-3 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] uppercase tracking-widest text-[#A3AED0] font-black mb-1 ml-1">
                      Modalidad
                    </p>
                    <div className="flex items-center gap-2 text-[#4299E1] font-extrabold text-sm">
                      <div className="bg-[#E1F0FF] p-1.5 rounded-lg">
                        <AcademicCapIcon className="h-4 w-4" />
                      </div>
                      {
                        modalidadesData.find(
                          (m) => String(m.id) === selectedModalidadId
                        )?.nombre
                      }
                    </div>
                  </div>
                )}
                {selectedNivelId && (
                  <div className="bg-[#F4F7FE] p-3 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] uppercase tracking-widest text-[#A3AED0] font-black mb-1 ml-1">
                      Nivel
                    </p>
                    <div className="flex items-center gap-2 text-[#48BB78] font-extrabold text-sm">
                      <div className="bg-[#E6F9F0] p-1.5 rounded-lg">
                        <FilterIcon className="h-4 w-4" />
                      </div>
                      {
                        nivelesData.find(
                          (n) => String(n.id) === selectedNivelId
                        )?.nombre
                      }
                    </div>
                  </div>
                )}
                {selectedEspecialidadId && (
                  <div className="bg-[#F4F7FE] p-3 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] uppercase tracking-widest text-[#A3AED0] font-black mb-1 ml-1">
                      Especialidad
                    </p>
                    <div className="flex items-center gap-2 text-[#9F7AEA] font-extrabold text-sm">
                      <div className="bg-[#F5F1FD] p-1.5 rounded-lg">
                        <AcademicCapIcon className="h-4 w-4" />
                      </div>
                      {
                        especialidadesData.find(
                          (e) => String(e.id) === selectedEspecialidadId
                        )?.nombre
                      }
                    </div>
                  </div>
                )}
                {selectedYear && (
                  <div className="bg-[#F4F7FE] p-3 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] uppercase tracking-widest text-[#A3AED0] font-black mb-1 ml-1">
                      Año
                    </p>
                    <div className="flex items-center gap-2 text-[#D69E2E] font-extrabold text-sm">
                      <div className="bg-[#FFF9EA] p-1.5 rounded-lg">
                        <CalendarIcon className="h-4 w-4" />
                      </div>
                      {selectedYear}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 mb-8">
            <button
              onClick={handleClear}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-600 hover:bg-gray-50 transition-all font-black text-sm uppercase tracking-widest shadow-sm active:scale-95"
            >
              <XIcon className="h-5 w-5" />
              Limpiar
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                // 1. Validaciones de carga y campos vacíos
                isLoading ||
                !selectedModalidadId ||
                (nivelesData.length > 0 &&
                  !(
                    nivelesData.length === 1 &&
                    nivelesData[0]?.nombre?.toUpperCase() === 'NINGUNO'
                  ) &&
                  !selectedNivelId) ||
                (especialidadesData.length > 0 && !selectedEspecialidadId) ||
                (aniosData.length > 0 && !selectedYear) ||
                // 2. NUEVA VALIDACIÓN: Bloquear si el total de preguntas es 0
                Object.entries(conteoPreguntas).reduce(
                  (acc, [name, curr]: [string, any]) =>
                    tiposPregunta[name] ? acc + curr.cantidad : acc,
                  0
                ) === 0
              }
              className="flex items-center justify-center gap-3 px-8 py-4 bg-[#002B6B] text-white rounded-2xl hover:bg-blue-900 transition-all font-black text-sm uppercase tracking-widest shadow-[0_10px_20px_rgba(0,43,107,0.2)] disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-1 active:scale-95 whitespace-nowrap"
            >
              Confirmar selección
            </button>
          </div>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmGoToExam}
        title="¿Estás listo para rendir el examen?"
        message={`Se cargará el examen de ${
          examToStart?.tipoExamenNombre || ''
        } con las preferencias de ${
          examToStart?.modalidadNombre || ''
        }${
          examToStart?.nivelNombre && examToStart.nivelNombre.toUpperCase() !== 'NINGUNO' && examToStart.nivelNombre.toUpperCase() !== 'SIN NIVEL' && examToStart.nivelNombre.toUpperCase() !== 'TODAS'
            ? ` - ${examToStart.nivelNombre}`
            : ''
        }${
          examToStart?.especialidadNombre && examToStart.especialidadNombre.toUpperCase() !== 'SIN ESPECIALIDAD' && examToStart.especialidadNombre.toUpperCase() !== 'TODAS'
            ? ` - ${examToStart.especialidadNombre}`
            : ''
        } ${selectedYear !== 'Único' ? `del año ${selectedYear}` : ''}. ¿Deseas comenzar ahora?`}
        confirmText="Sí, ¡empezar!"
        cancelText="No, revisar"
        type="success"
      />

      <ConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={confirmClear}
        title="¿Reiniciar selección?"
        message="Se borrarán todos los filtros que has seleccionado hasta ahora. ¿Estás seguro?"
        confirmText="Sí, limpiar todo"
        cancelText="No, mantener"
        type="danger"
      />
    </PremiumLayout>
  );
};

export default BancoPreguntasPage;

