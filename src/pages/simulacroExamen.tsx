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

const SimulacroExamenPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Examenes from login response
  const [loginExamenes, setLoginExamenes] = useState<ExamenLogin[]>([]);

  // Current Selection State
  const [selectedTipoExamenId, setSelectedTipoExamenId] = useState<string>('2');
  const [selectedModalidadId, setSelectedModalidadId] = useState<string>('');
  const [selectedNivelId, setSelectedNivelId] = useState<string>('');
  const [selectedEspecialidadId, setSelectedEspecialidadId] =
    useState<string>('');
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [conteoPreguntas, setConteoPreguntas] = useState<{
    [key: string]: {
      cantidad: number;
      puntos: number;
      tiempoPregunta: number;
      minimo: number;
      clasificacionId: number;
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

  // ---------- Counts & Categories Logic aggregated across selected years ----------

  useEffect(() => {
    if (selectedModalidadId && selectedYears.length > 0) {
      const firstNivel = nivelesData[0];
      const resolvedNivelId =
        selectedNivelId ||
        (nivelesData.length === 1 &&
        firstNivel?.nombre?.toUpperCase() === 'NINGUNO'
          ? String(firstNivel.id)
          : null);

      if (resolvedNivelId === null) return;

      const aggCountMap: any = {};

      selectedYears.forEach((year) => {
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
                  const yearData = item.years.find(
                    (y: any) => String(y.year) === year
                  );
                  cantidadExacta = yearData ? yearData.cantidadPreguntas : 0;
                }

                if (!aggCountMap[name]) {
                  aggCountMap[name] = {
                    cantidad: cantidadExacta,
                    puntos: item.puntos || 0,
                    tiempoPregunta: item.tiempoPregunta || 0,
                    minimo: item.minimo || 0,
                    clasificacionId: item.clasificacionId,
                  };
                } else {
                  aggCountMap[name].cantidad += cantidadExacta;
                  // We assume points and time are consistent or we take the first seen
                }
              }
            });
          }
        });
      });

      setConteoPreguntas(aggCountMap);

      setTiposPregunta((prev) => {
        const nextTipos: Record<string, boolean> = { ...prev };
        Object.keys(aggCountMap).forEach((name) => {
          if (nextTipos[name] === undefined && aggCountMap[name].cantidad > 0) {
            nextTipos[name] = true;
          } else if (aggCountMap[name].cantidad === 0) {
            nextTipos[name] = false;
          }
        });
        return nextTipos;
      });
    } else {
      setConteoPreguntas({});
      setTiposPregunta({});
    }
  }, [
    selectedTipoExamenId,
    selectedModalidadId,
    selectedNivelId,
    selectedEspecialidadId,
    selectedYears,
    loginExamenes,
    nivelesData,
  ]);

  // ---------- Handlers ----------

  const handleYearChange = (year: string) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleClear = () => {
    setSelectedTipoExamenId('2');
    setSelectedModalidadId('');
    setSelectedNivelId('');
    setSelectedEspecialidadId('');
    setSelectedYears([]);
    setTiposPregunta({});
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

      // We need a sample exam to get fuenteId
      const sampleExam = loginExamenes.find(
        (e) =>
          String(e.tipoExamenId) === selectedTipoExamenId &&
          String(e.modalidadId) === selectedModalidadId &&
          String(e.nivelId) === resolvedNivelId
      );

      if (!sampleExam) {
        alert('Error: No se encontró la metadata del examen.');
        setIsLoading(false);
        return;
      }

      // Map selected classifications to IDs
      const activeClasificacionIds: number[] = [];
      Object.entries(tiposPregunta).forEach(([name, isChecked]) => {
        if (isChecked && conteoPreguntas[name]) {
          activeClasificacionIds.push(conteoPreguntas[name].clasificacionId);
        }
      });

      // Construct yearFilters
      const yearFilters = selectedYears.map((y) => ({
        year: y === 'Único' ? '0' : y,
        clasificacionIds: activeClasificacionIds,
      }));

      const payload = {
        tipoExamenId: sampleExam.tipoExamenId,
        fuenteId: sampleExam.fuenteId || 0,
        modalidadId: sampleExam.modalidadId,
        nivelId: sampleExam.nivelId,
        especialidadId: sampleExam.especialidadId || 0,
        yearFilters,
      };

      console.log('Sending multi-year filter to API:', payload);

      const questions =
        await estructuraAcademicaService.getPreguntasByFilterMultiYear(payload);

      const metadata = {
        modalidad: sampleExam.modalidadNombre,
        nivel: sampleExam.nivelNombre || 'NINGUNO',
        especialidad: sampleExam.especialidadNombre || null,
        year: selectedYears.join(', '),
      };

      localStorage.setItem('currentQuestions', JSON.stringify(questions));
      localStorage.setItem('currentExamMetadata', JSON.stringify(metadata));

      router.push('/examen');
    } catch (error) {
      console.error('Error confirming selection:', error);
      alert('Hubo un error al cargar los simulacros.');
    } finally {
      setIsLoading(false);
    }
  };

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

      <div className="w-full space-y-6">
        <div className="text-center py-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-[#2B3674]">
            Configura tu Simulacro
          </h3>
          <p className="text-[#A3AED0] text-base mt-1 font-medium">
            Selecciona al menos dos años para generar un simulacro personalizado
          </p>
        </div>

        <div className="space-y-4">
          {/* Modalidad */}
          <div className="border border-primary rounded-lg p-4 bg-white shadow-sm">
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
                setSelectedYears([]);
              }}
              className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="">Selecciona Modalidad</option>
              {modalidadesData.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Nivel */}
          {nivelesData.length > 0 &&
            !(
              nivelesData.length === 1 &&
              nivelesData[0]?.nombre?.toUpperCase() === 'NINGUNO'
            ) && (
              <div className="border border-primary rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                  <FilterIcon className="h-5 w-5" />
                  <span>Nivel</span>
                </div>
                <select
                  value={selectedNivelId}
                  onChange={(e) => {
                    setSelectedNivelId(e.target.value);
                    setSelectedEspecialidadId('');
                    setSelectedYears([]);
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

          {/* Especialidad */}
          {especialidadesData.length > 0 && (
            <div className="border border-primary rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                <AcademicCapIcon className="h-5 w-5" />
                <span>Especialidad</span>
              </div>
              <select
                value={selectedEspecialidadId}
                onChange={(e) => {
                  setSelectedEspecialidadId(e.target.value);
                  setSelectedYears([]);
                }}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
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

          {/* Años Checkboxes */}
          <div className="border border-primary rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-primary font-bold">
              <CalendarIcon className="h-5 w-5" />
              <span>Selecciona los años (Mínimo 2)*</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {aniosData.map((year) => (
                <label
                  key={year}
                  className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-colors ${
                    selectedYears.includes(year)
                      ? 'border-primary bg-blue-50 text-primary font-bold'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedYears.includes(year)}
                    onChange={() => handleYearChange(year)}
                    className="h-4 w-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm">{year}</span>
                </label>
              ))}
            </div>
            {aniosData.length === 0 && selectedModalidadId && (
              <p className="text-red-500 text-xs mt-2 italic">
                No hay años disponibles para esta selección
              </p>
            )}
          </div>

          {/* Tipos de Pregunta */}
          {selectedYears.length > 0 &&
            Object.keys(conteoPreguntas).length > 0 && (
              <div className="border border-primary rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                  <QuestionMarkCircleIcon className="h-5 w-5" />
                  <span>Configurar Tipos de Pregunta</span>
                </div>
                <div className="space-y-3">
                  {Object.entries(conteoPreguntas).map(([name, data]) => (
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
                              ? `${data.cantidad} preguntas acumuladas`
                              : '0 preguntas disponibles'}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

          {/* Resumen de selección */}
          {(selectedModalidadId || selectedYears.length > 0) && (
            <div className="border border-cyan-300 rounded-xl p-6 bg-[#F8FDFF] shadow-sm mt-6">
              <h3 className="font-bold text-[#2B3674] text-lg mb-4 flex items-center gap-2">
                <AcademicCapIcon className="h-6 w-6" /> Resumen del Simulacro
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                    Modalidad
                  </p>
                  <p className="text-primary font-medium">
                    {modalidadesData.find(
                      (m) => String(m.id) === selectedModalidadId
                    )?.nombre || 'Pendiente'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                    Años Seleccionados
                  </p>
                  <p className="text-primary font-medium">
                    {selectedYears.length > 0
                      ? selectedYears.join(', ')
                      : 'Ninguno'}
                  </p>
                </div>
                {selectedNivelId && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                      Nivel
                    </p>
                    <p className="text-primary font-medium">
                      {
                        nivelesData.find(
                          (n) => String(n.id) === selectedNivelId
                        )?.nombre
                      }
                    </p>
                  </div>
                )}
                {selectedEspecialidadId && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                      Especialidad
                    </p>
                    <p className="text-primary font-medium">
                      {
                        especialidadesData.find(
                          (e) => String(e.id) === selectedEspecialidadId
                        )?.nombre
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Counts Summary */}
              {Object.values(tiposPregunta).some((c) => c) && (
                <div className="mt-4 pt-4 border-t border-cyan-100 flex flex-wrap gap-3">
                  <div className="bg-white border border-blue-100 rounded-lg px-4 py-2 shadow-sm">
                    <span className="text-xs text-gray-500 block mb-1">
                      Preguntas Totales
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {Object.entries(conteoPreguntas).reduce(
                        (acc, [name, curr]) =>
                          tiposPregunta[name] ? acc + curr.cantidad : acc,
                        0
                      )}
                    </span>
                  </div>
                  <div className="bg-white border border-green-100 rounded-lg px-4 py-2 shadow-sm">
                    <span className="text-xs text-gray-500 block mb-1">
                      Tiempo Est.
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      {Object.entries(conteoPreguntas).reduce(
                        (acc, [name, curr]) =>
                          tiposPregunta[name]
                            ? acc + curr.cantidad * curr.tiempoPregunta
                            : acc,
                        0
                      )}{' '}
                      min
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <button
              onClick={handleClear}
              className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <XIcon className="h-5 w-5" /> Limpiar Filtros
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                isLoading ||
                selectedYears.length < 2 ||
                !Object.values(tiposPregunta).some((v) => v)
              }
              className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[200px]"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Iniciar Simulacro'
              )}
            </button>
          </div>
        </div>
      </div>
    </PremiumLayout>
  );
};

export default SimulacroExamenPage;
