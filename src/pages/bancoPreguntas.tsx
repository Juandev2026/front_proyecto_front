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

// ----- Types derived from login examenes -----
interface FilterOption {
  id: number;
  nombre: string;
}

const BancoPreguntasPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Examenes from login response
  const [loginExamenes, setLoginExamenes] = useState<ExamenLogin[]>([]);

  // Current Selection State (Using strings for consistency with <select> values)
  const [selectedTipoExamenId, setSelectedTipoExamenId] = useState<string>('2');
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
    }
  }, [isAuthenticated]);

  // ---------- Memoized Derived Options ----------

  const tiposExamenData = useMemo(() => {
    const map = new Map<number, FilterOption>();
    loginExamenes.forEach((e) => {
      if (!map.has(e.tipoExamenId)) {
        map.set(e.tipoExamenId, {
          id: e.tipoExamenId,
          nombre: e.tipoExamenNombre || 'Sin nombre',
        });
      }
    });
    return Array.from(map.values());
  }, [loginExamenes]);

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
              // Si encontramos el año, usamos su cantidad. Si no, pero existe el array,
              // podríamos decidir si usar 0 o el total. El usuario dice que debe ser el del año.
              cantidadExacta = yearData ? yearData.cantidadPreguntas : 0;
            }

            // Evitar duplicados si la API mandara la misma clasificación dos veces por error
            if (!countMap[name]) {
              countMap[name] = {
                cantidad: cantidadExacta,
                puntos: item.puntos || 0,
                tiempoPregunta: item.tiempoPregunta || 0,
                minimo: item.minimo || 0,
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
    loginExamenes,
    nivelesData,
  ]);

  // --- Handlers ---

  const handleClear = () => {
    setSelectedTipoExamenId('');
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

      // 1. Buscamos el examen en la metadata para sacar TODOS los IDs
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

      // Si no encuentra el examen en la memoria, no podemos armar el payload
      if (!exam) {
        alert(
          'Error de sincronización: No se encontró la metadata del examen.'
        );
        setIsLoading(false);
        return;
      }

      const finalYearValue = selectedYear === 'Único' ? '0' : selectedYear;

      // 2. Extraemos los ClasificacionIds (Igual que antes)
      const clasificacionIds: number[] = [];
      if (exam.clasificaciones) {
        exam.clasificaciones.forEach((c) => {
          if (tiposPregunta[c.clasificacionNombre]) {
            clasificacionIds.push(c.clasificacionId);
          }
        });
      }

      // 3. ARMAMOS EL PAYLOAD EXACTO PARA LA API
      const payloadFiltro = {
        tipoExamenId: exam.tipoExamenId,
        fuenteId: exam.fuenteId || 0, // <-- Aseguramos que vaya
        modalidadId: exam.modalidadId,
        nivelId: exam.nivelId,
        especialidadId: exam.especialidadId || 0, // Si es null, enviamos 0 según tu JSON
        year: finalYearValue,
        clasificaciones: clasificacionIds, // Asegúrate de que tu API reciba este array para filtrar por RL, CL, CCP
      };

      console.log('Enviando filtro a la API:', payloadFiltro);

      // 4. LLAMADA AL SERVICIO
      console.log('Calling evaluacionService.calificar...');
      let questions = await estructuraAcademicaService.getPreguntasByFilter(
        payloadFiltro
      );

      // --- PARCHE DE FRONTEND: Filtrar localmente si el backend nos devuelve todo mezclado ---
      if (questions.length > 0) {
        questions = questions.filter((q) => {
          // 1. Filtrar por año (si tu API devuelve q.year o q.anio)
          const matchYear =
            finalYearValue === '0' ||
            String(q.year) === finalYearValue ||
            String(q.anio) === finalYearValue;

          // 2. Filtrar por tipo de pregunta (Comprensión, Razonamiento, etc)
          const matchClass =
            clasificacionIds.length === 0 ||
            (q.clasificacionId !== undefined &&
              clasificacionIds.includes(q.clasificacionId));

          return matchYear && matchClass;
        });
      }

      console.log(`Preguntas después del filtro local: ${questions.length}`);
      // ------------------------------------------------------------------------

      // 5. Guardar metadata y redirigir
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
      title="Banco de preguntas"
      breadcrumb="Pages / Banco de preguntas"
    >
      <Head>
        <title>Banco de Preguntas - AVENDOCENTE</title>
      </Head>

      <div className="w-full space-y-6">
        <div className="text-center py-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-[#2B3674]">
            Selecciona tus preferencias
          </h3>
          <p className="text-[#A3AED0] text-base mt-1 font-medium">
            Filtra paso a paso para encontrar el examen deseado
          </p>
        </div>

        <div className="space-y-4">
          {/* 1. Tipo de Examen */}
          <div className="border border-primary rounded-lg p-4 bg-white transition-all shadow-sm">
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
          </div>

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
                              className="bg-[#F4F7FE] border border-blue-100 rounded-lg p-4"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-[#2B3674]">
                                  {name}
                                </span>
                                <div className="bg-[#4318FF] text-white text-xs font-bold w-12 h-8 rounded-full flex items-center justify-center border border-white shadow-sm overflow-hidden whitespace-nowrap px-1">
                                  {name.substring(0, 3).toUpperCase()}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="bg-blue-100/50 text-blue-500 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                  <span className="text-blue-400">📝</span>{' '}
                                  {data.cantidad} preguntas
                                </span>
                                <span className="bg-green-100/50 text-green-600 border border-green-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                  <span className="text-green-500">⭐</span>{' '}
                                  {data.puntos} pts/correcta
                                </span>
                                <span className="bg-purple-100/50 text-purple-500 border border-purple-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                  <span className="text-purple-400">🎯</span>{' '}
                                  Máx: {data.cantidad * data.puntos} pts
                                </span>
                                <span className="bg-orange-100/50 text-orange-500 border border-orange-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                  <span className="text-orange-400">✅</span>{' '}
                                  Mínimo: {data.minimo} pts
                                </span>
                                <span className="bg-yellow-100/50 text-yellow-600 border border-yellow-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                  <span className="text-yellow-500">⏱️</span>{' '}
                                  {data.tiempoPregunta} min/pregunta
                                </span>
                                <span className="bg-red-100/50 text-red-500 border border-red-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                  <span className="text-red-400">⏰</span>{' '}
                                  Total: {data.cantidad * data.tiempoPregunta}{' '}
                                  min
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

              <div className="space-y-5">
                {/* Tipo de Examen is hidden in summary as it is fixed to Nombramiento */}
                {selectedModalidadId && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5 ml-1">
                      Modalidad
                    </p>
                    <span className="inline-block px-4 py-1.5 border border-[#8ec7ed] text-[#4299E1] bg-[#eef6fc] rounded-md text-sm font-medium">
                      {
                        modalidadesData.find(
                          (m) => String(m.id) === selectedModalidadId
                        )?.nombre
                      }
                    </span>
                  </div>
                )}
                {selectedNivelId && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5 ml-1">Nivel</p>
                    <span className="inline-block px-4 py-1.5 border border-[#a2e0bb] text-[#48BB78] bg-[#f0f9f4] rounded-md text-sm font-medium">
                      {
                        nivelesData.find(
                          (n) => String(n.id) === selectedNivelId
                        )?.nombre
                      }
                    </span>
                  </div>
                )}
                {selectedEspecialidadId && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5 ml-1">
                      Especialidad
                    </p>
                    <span className="inline-block px-4 py-1.5 border border-[#d1bef6] text-[#9F7AEA] bg-[#f5f1fd] rounded-md text-sm font-medium">
                      {
                        especialidadesData.find(
                          (e) => String(e.id) === selectedEspecialidadId
                        )?.nombre
                      }
                    </span>
                  </div>
                )}
                {selectedYear && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5 ml-1">Año</p>
                    <span className="inline-block px-4 py-1.5 border border-[#fbd38d] text-[#D69E2E] bg-[#fefcfa] rounded-md text-sm font-medium">
                      {selectedYear}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-blue-50 transition-all font-bold"
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
              className="flex items-center gap-2 px-8 py-3 bg-[#002B6B] text-white rounded-xl hover:bg-blue-900 transition-all font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar selección
            </button>
          </div>
        </div>
      </div>
    </PremiumLayout>
  );
};

export default BancoPreguntasPage;
