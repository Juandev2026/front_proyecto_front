import React, { useEffect, useState, useMemo } from 'react';

import {
  AcademicCapIcon,
  QuestionMarkCircleIcon,
  XIcon,
  FilterIcon,
  ChevronDownIcon,
  ChevronUpIcon,
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
  const [selectedYearId, setSelectedYearId] = useState<string>('');

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isDesgloseOpen, setIsDesgloseOpen] = useState(true);
  const [examToStart, setExamToStart] = useState<any>(null);
  const [questionsToStore, setQuestionsToStore] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [conteoPreguntas, setConteoPreguntas] = useState<{
    [key: string]: {
      cantidad: number;
      puntos: number;
      tiempoPregunta: number;
      minimo: number;
      abreviatura?: string;
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
          'CETPRO',
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
      (n) =>
        n.nombre &&
        n.nombre.toUpperCase() !== 'NINGUNO' &&
        n.nombre !== 'string'
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
      (e) =>
        e.nombre && e.nombre !== 'string' && e.nombre.toLowerCase() !== 'null'
    );
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

  // 4. Auto-select Year if only one specific year
  useEffect(() => {
    if (yearsData.length === 1 && yearsData[0]?.id !== 0 && !selectedYearId) {
      setSelectedYearId(String(yearsData[0]?.id));
    }
  }, [yearsData, selectedYearId]);

  // ---------- Counts & Categories Logic ----------

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
            : !e.especialidadId || e.especialidadId === 0) &&
          (selectedYearId !== '0'
            ? e.years?.some((y: any) => String(y.year) === selectedYearId) ||
              String(e.year) === selectedYearId
            : true)
      );

      const countMap: any = {};
      const nextTipos: Record<string, boolean> = { ...tiposPregunta };

      matchedExams.forEach((exam) => {
        if (exam.clasificaciones) {
          exam.clasificaciones.forEach((item: any) => {
            const name = item.clasificacionNombre;
            if (name) {
              const meta = allClasificaciones.find(
                (c) => c.clasificacionNombre === name || c.abreviatura === name
              );
              const clCode =
                meta?.abreviatura || name.substring(0, 3).toUpperCase();

              let cantidad = 0;
              if (selectedYearId === '0') {
                // Total accumulation (existing logic)
                cantidad = item.cantidadPreguntas || 0;
              } else if (selectedYearId) {
                // Year-specific drill down
                if (item.years && Array.isArray(item.years)) {
                  const yrObj = item.years.find(
                    (y: any) => String(y.year) === selectedYearId
                  );
                  cantidad = yrObj
                    ? yrObj.cantidadPreguntas || yrObj.cantidad_p || 0
                    : 0;
                } else if (String(exam.year) === selectedYearId) {
                  cantidad = item.cantidadPreguntas || 0;
                }
              }

              if (!countMap[name]) {
                // Official Nombramiento 2024 Score Logic
                let correctedMinimo = meta?.minimo || item.minimo || 0;
                let correctedCantidad = cantidad;

                if (String(selectedTipoExamenId) === '2') {
                  // Nombramiento
                  if (name === 'CL' || name === 'Comprensión Lectora') {
                    correctedMinimo = 0;
                    if (cantidad > 0) correctedCantidad = 15;
                  } else if (name === 'RL' || name === 'Razonamiento Lógico') {
                    correctedMinimo = 0;
                  } else if (
                    name === 'CCP' ||
                    name === 'Conocimientos Curriculares y Pedagógicos'
                  ) {
                    correctedMinimo = 90;
                    if (cantidad > 0) correctedCantidad = 50;
                  }
                }

                countMap[name] = {
                  cantidad: correctedCantidad,
                  puntos: meta?.puntos || item.puntos || 0,
                  tiempoPregunta:
                    meta?.tiempoPregunta || item.tiempoPregunta || 0,
                  minimo: correctedMinimo,
                  abreviatura: clCode,
                };
              } else {
                const correctedCantidad = cantidad;
                if (String(selectedTipoExamenId) === '2') {
                  if (
                    (name === 'CL' || name === 'Comprensión Lectora') &&
                    cantidad > 0
                  ) {
                    // We don't want to sum up to more than 15 if it's already set or being accumulated
                    // but the logic here handles accumulation. For Nombramiento, it's usually one exam anyway.
                    // If it's multi-source, we ensure the final display is 15.
                  }
                }
                countMap[name].cantidad += correctedCantidad;

                // Final cap for Nombramiento display
                if (String(selectedTipoExamenId) === '2') {
                  if (name === 'CL' || name === 'Comprensión Lectora')
                    countMap[name].cantidad = 15;
                  if (
                    name === 'CCP' ||
                    name === 'Conocimientos Curriculares y Pedagógicos'
                  )
                    countMap[name].cantidad = 50;
                }
              }

              if (
                nextTipos[name] === undefined &&
                countMap[name].cantidad > 0
              ) {
                nextTipos[name] = true;
              }
            }
          });
        }
      });

      setConteoPreguntas(countMap);
      setTiposPregunta(nextTipos);
    }
  }, [
    selectedTipoExamenId,
    selectedModalidadId,
    selectedNivelId,
    selectedEspecialidadId,
    selectedYearId,
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
    setSelectedYearId('0');
    setTiposPregunta({});
    setIsClearModalOpen(false);
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

      // 1. Buscamos el examen en la metadata para sacar TODOS los IDs
      const exam = examenes.find(
        (e) =>
          String(e.tipoExamenId) === selectedTipoExamenId &&
          String(e.modalidadId) === selectedModalidadId &&
          String(e.nivelId) === resolvedNivelId &&
          (selectedEspecialidadId
            ? String(e.especialidadId) === selectedEspecialidadId
            : true) &&
          (selectedYearId !== '0'
            ? e.years?.some((y: any) => String(y.year) === selectedYearId) ||
              String(e.year) === selectedYearId
            : true)
      );

      // Si no encuentra el examen en la memoria, no podemos armar el payload
      if (!exam) {
        alert(
          'Error de sincronización: No se encontró la metadata del examen.'
        );
        setIsLoading(false);
        return;
      }

      const finalYearValue = selectedYearId || '0';

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
        tipoExamenId: Number(selectedTipoExamenId),
        fuenteId: 0,
        modalidadId: Number(selectedModalidadId),
        nivelId: Number(resolvedNivelId),
        especialidadId: Number(selectedEspecialidadId || 0),
        year: finalYearValue,
        clasificaciones: clasificacionIds,
      };

      console.log('Enviando filtro a la API:', payloadFiltro);

      // 4. LLAMADA AL SERVICIO
      const questions = await preguntaService.examenFilter(payloadFiltro);

      // --- PARCHE DE FRONTEND: Filtrar localmente si el backend nos devuelve todo mezclado ---
      // Note: We used to filter locally here, but it was causing missing questions
      // when metadata was inconsistent. Trust the API result.

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

    const metadata = {
      tipoExamenId: 2,
      tipoExamen: examToStart.tipoExamenNombre,
      modalidad: examToStart.modalidadNombre,
      nivel: examToStart.nivelNombre || 'NINGUNO',
      especialidad: examToStart.especialidadNombre || null,
      year: selectedYearId || '0',
    };

    localStorage.setItem('currentQuestions', JSON.stringify(questionsToStore));
    localStorage.setItem('currentExamMetadata', JSON.stringify(metadata));

    router.push(`/examen?from=${router.asPath}`);
  };
  if (
    loading ||
    !isAuthenticated ||
    (isFetchingExamenes && examenes.length === 0)
  ) {
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
          <p className="text-[#2B3674] text-base mt-1 font-medium">
            Filtra paso a paso para encontrar el examen deseado
          </p>
          <p className="text-xl md:text-2xl font-extrabold text-[#2B3674] mt-2">
            {selectedTipoExamenId === '1' ? 'Ascenso' : 'Nombramiento'}
          </p>
        </div>

        <div className="space-y-4">
          {/* 1. Tipo de Examen - Locked to Nombramiento */}
          {/* <div className="border border-primary rounded-lg p-4 bg-white transition-all shadow-md">
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
            <div className="border border-primary rounded-lg p-4 bg-white transition-all shadow-md">
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

          {/* Year Selector */}
          {yearsData.length > 0 && (
            <div className="border border-primary rounded-lg p-4 bg-white transition-all shadow-md">
              <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                <FilterIcon className="h-5 w-5" />
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
                      'Conocimientos Curriculares y Pedagócicos': 3,
                    };
                    const valA = order[a] || 99;
                    const valB = order[b] || 99;
                    if (valA !== valB) return valA - valB;
                    return a.localeCompare(b);
                  })
                  .map(([name, data]: [string, any]) => (
                    <label
                      key={name}
                      className={`border rounded-xl p-4 flex flex-col gap-2 transition-all ${
                        data.cantidad > 0
                          ? `cursor-pointer hover:bg-gray-50 ${
                              tiposPregunta[name]
                                ? 'border-primary bg-blue-50 ring-1 ring-primary'
                                : 'border-gray-300'
                            }`
                          : 'cursor-not-allowed opacity-50 border-gray-300 bg-gray-50'
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
                  ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                * Selecciona al menos un tipo de pregunta
              </p>
            </div>
          )}

          {Object.values(tiposPregunta).some((isChecked) => isChecked) && (
            <div className="mt-8 space-y-6">
              {Object.values(conteoPreguntas).reduce(
                (acc: number, curr: any) => acc + curr.cantidad,
                0
              ) > 0 && (
                <div className="border border-gray-300 rounded-xl p-5 bg-[#FAFAFA]">
                  <div
                    onClick={() => setIsDesgloseOpen(!isDesgloseOpen)}
                    className="flex items-center justify-between cursor-pointer mb-4"
                  >
                    <h3 className="font-bold text-[#2B3674] text-lg">
                      Tipos de Pregunta Seleccionados
                    </h3>
                    <button className="text-[#A3AED0] hover:text-[#4790FD] transition-colors focus:outline-none bg-blue-50/50 p-2 rounded-full">
                      {isDesgloseOpen ? (
                        <ChevronUpIcon className="h-5 w-5" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <div
                    className={`space-y-3 ${
                      isDesgloseOpen ? 'block animate-fadeIn' : 'hidden'
                    }`}
                  >
                    {Object.entries(conteoPreguntas)
                      .sort(([a], [b]) => {
                        const order: Record<string, number> = {
                          CL: 1,
                          RL: 2,
                          CCP: 3,
                        };
                        return (order[a] || 99) - (order[b] || 99);
                      })
                      .map(([name, data]: [string, any]) => {
                        if (tiposPregunta[name] && data.cantidad > 0) {
                          return (
                            <div
                              key={name}
                              className="bg-[#F8FBFF] border border-blue-100 rounded-2xl p-5 shadow-md"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <span className="font-extrabold text-[#2B3674] text-base leading-tight">
                                  {TIPO_FULL_NAMES[name] || name}
                                </span>
                                <div className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-indigo-200">
                                  {data.abreviatura ||
                                    name.substring(0, 3).toUpperCase()}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <span className="bg-blue-100/50 text-blue-500 border border-blue-200 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                                  <span className="text-blue-400">📝</span>{' '}
                                  {data.cantidad} preguntas
                                </span>
                                <span className="bg-green-100/50 text-green-600 border border-green-200 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                                  <span className="text-green-500">⭐</span>{' '}
                                  {data.puntos} pts/correcta
                                </span>
                                <span className="bg-purple-100/50 text-purple-500 border border-purple-200 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                                  <span className="text-purple-400">🎯</span>{' '}
                                  Máx: {data.cantidad * data.puntos} pts
                                </span>
                                <span className="bg-orange-100/50 text-orange-500 border border-orange-200 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                                  <span className="text-orange-400">✅</span>{' '}
                                  Mínimo: {data.minimo} pts
                                </span>
                                <span className="bg-yellow-100/50 text-yellow-600 border border-yellow-200 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                                  <span className="text-yellow-500">⏱️</span>{' '}
                                  {data.tiempoPregunta} min/preg
                                </span>
                                <span className="bg-red-100/50 text-red-500 border border-red-200 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                                  <span className="text-red-400">⏰</span>{' '}
                                  Total: {data.cantidad * data.tiempoPregunta}{' '}
                                  min
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                  </div>

                  {/* Resumen Total */}
                  <div className="bg-[#FAFBFD] border border-gray-300 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-lg">📊</div>
                      <span className="font-bold text-[#2B3674]">
                        Resumen Total
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-md">
                        <span>📝</span>{' '}
                        {Object.entries(conteoPreguntas).reduce(
                          (acc, [name, curr]: [string, any]) =>
                            tiposPregunta[name] ? acc + curr.cantidad : acc,
                          0
                        )}{' '}
                        preguntas totales
                      </span>
                      <span className="bg-green-50 text-green-700 border border-green-200 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-md">
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
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-md">
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
                      <span className="bg-orange-50 text-orange-700 border border-orange-200 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-md">
                        <span>✅</span>{' '}
                        {(() => {
                          const isNombramiento =
                            String(selectedTipoExamenId) === '2';
                          const hasCCP = Object.entries(conteoPreguntas).some(
                            ([name, _]) =>
                              tiposPregunta[name] &&
                              (name === 'CCP' ||
                                name ===
                                  'Conocimientos Curriculares y Pedagógicos')
                          );

                          if (isNombramiento) {
                            return hasCCP ? 110 : 0;
                          }

                          return Object.entries(conteoPreguntas).reduce(
                            (acc, [name, curr]: [string, any]) =>
                              tiposPregunta[name]
                                ? acc + (curr.minimo || 0)
                                : acc,
                            0
                          );
                        })()}{' '}
                        pts mínimo
                      </span>
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
            selectedEspecialidadId) && (
            <div className="border border-cyan-300 rounded-xl p-6 bg-white shadow-md mt-6">
              <div className="flex items-center gap-2 mb-6">
                <AcademicCapIcon className="h-6 w-6 text-[#2B3674]" />
                <h3 className="font-bold text-[#2B3674] text-lg">
                  Resumen de selección
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedModalidadId && (
                  <div className="bg-[#F4F7FE] p-3 rounded-2xl border border-gray-100 shadow-md transition-all hover:shadow-md">
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
                  <div className="bg-[#F4F7FE] p-3 rounded-2xl border border-gray-100 shadow-md transition-all hover:shadow-md">
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
                  <div className="bg-[#F4F7FE] p-3 rounded-2xl border border-gray-100 shadow-md transition-all hover:shadow-md">
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
                {selectedYearId && selectedYearId !== '0' && (
                  <div className="bg-[#F4F7FE] p-3 rounded-2xl border border-gray-100 shadow-md transition-all hover:shadow-md">
                    <p className="text-[10px] uppercase tracking-widest text-[#A3AED0] font-black mb-1 ml-1">
                      Año
                    </p>
                    <div className="flex items-center gap-2 text-[#D69E2E] font-extrabold text-sm">
                      <div className="bg-[#FEF6E1] p-1.5 rounded-lg">
                        <CalendarIcon className="h-4 w-4" />
                      </div>
                      {
                        yearsData.find((y) => String(y.id) === selectedYearId)
                          ?.nombre
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 mb-8">
            <button
              onClick={handleClear}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-600 hover:bg-gray-50 transition-all font-black text-sm uppercase tracking-widest shadow-md active:scale-95"
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
        } con las preferencias de ${examToStart?.modalidadNombre || ''}${
          examToStart?.nivelNombre &&
          examToStart.nivelNombre.toUpperCase() !== 'NINGUNO' &&
          examToStart.nivelNombre.toUpperCase() !== 'SIN NIVEL' &&
          examToStart.nivelNombre.toUpperCase() !== 'TODAS'
            ? ` - ${examToStart.nivelNombre}`
            : ''
        }${
          examToStart?.especialidadNombre &&
          examToStart.especialidadNombre.toUpperCase() !== 'SIN ESPECIALIDAD' &&
          examToStart.especialidadNombre.toUpperCase() !== 'TODAS'
            ? ` - ${examToStart.especialidadNombre}`
            : ''
        } ¿Deseas comenzar ahora?`}
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
