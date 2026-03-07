import React, { useEffect, useState, useMemo } from 'react';

import {
  BookOpenIcon,
  ChevronDownIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/solid';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuth } from '../hooks/useAuth';
import PremiumLayout from '../layouts/PremiumLayout';
import { erroneasService, GroupByFechaErroneas, PreguntaErronea } from '../services/erroneasService';
import HtmlMathRenderer from '../components/common/HtmlMathRenderer';

const RespuestasErroneasPage = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [numPreguntas, setNumPreguntas] = useState('10 preguntas');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [erroneas, setErroneas] = useState<GroupByFechaErroneas[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Practice Filters
  const [selectedFecha, setSelectedFecha] = useState('Todas las fechas');
  const [modalidad, setModalidad] = useState('');
  const [fuenteMinedu, setFuenteMinedu] = useState(true);
  const [fuenteEscala, setFuenteEscala] = useState(true);

  // History Filters
  const [historyFechaFilter, setHistoryFechaFilter] = useState('Todas las fechas');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState('Todas las categorías');
  const [historyFuenteFilter, setHistoryFuenteFilter] = useState('Todas las fuentes');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchErroneas = async () => {
      // Prioritize using user.id from auth context
      if (user?.id) {
        try {
          setLoading(true);
          // Nombramiento corresponds to tipoExamenId: 2
          const data = await erroneasService.getByUser(user.id, 2);
          setErroneas(data || []);

          if (data && data.length > 0) {
            setSelectedFecha(data[0]?.fecha || '');
            const firstGroup = data[0]?.modalidades?.[0];
            const firstNivel = firstGroup?.niveles?.[0];
            const firstEsp = firstNivel?.especialidades?.[0];
            if (firstGroup && firstNivel && firstEsp) {
              setModalidad(`${firstGroup.modalidadNombre} - ${firstNivel.nivelNombre} - ${firstEsp.especialidadNombre}`);
            }
          }
        } catch (error) {
          console.error('Error fetching Nombramiento erroneas:', error);
          setErroneas([]);
        } finally {
          setLoading(false);
        }
      }
    };

    if (isAuthenticated && !authLoading) {
      fetchErroneas();
    }
  }, [isAuthenticated, user?.id, authLoading]);

  // Calculations
  const stats = useMemo(() => {
    let totalErrors = 0;
    const uniqueQuestions = new Set<number>();

    erroneas?.forEach((groupFecha) => {
      groupFecha.modalidades?.forEach((mod) => {
        mod.niveles?.forEach((niv) => {
          niv.especialidades?.forEach((esp) => {
            const allQs = [...(esp.propios || []), ...(esp.otros || [])];
            allQs.forEach((q) => {
              uniqueQuestions.add(q.preguntaId);
              if (q.subPreguntas && q.subPreguntas.length > 0) {
                totalErrors += q.subPreguntas.length;
              } else if (q.erroresInmediatos && q.erroresInmediatos.length > 0) {
                totalErrors += q.erroresInmediatos.length;
              } else {
                totalErrors += 1;
              }
            });
          });
        });
      });
    });

    const pointsLost = (totalErrors * 1.5).toFixed(1);
    return { totalErrors, uniqueQuestions: uniqueQuestions.size, pointsLost };
  }, [erroneas]);

  const groupedByHierarchy = useMemo(() => {
    const flatGroups: Array<{
      title: string;
      errors: number;
      points: number;
      items: PreguntaErronea[];
      subtitle: string;
    }> = [];

    erroneas?.forEach((groupFecha) => {
      // Apply History Date Filter
      if (historyFechaFilter !== 'Todas las fechas' && groupFecha.fecha !== historyFechaFilter) {
        return;
      }

      groupFecha.modalidades?.forEach((mod) => {
        mod.niveles?.forEach((niv) => {
          niv.especialidades?.forEach((esp) => {
            const categoryName = `${mod.modalidadNombre} - ${niv.nivelNombre} - ${esp.especialidadNombre}`;
            
            // Apply History Category Filter
            if (historyCategoryFilter !== 'Todas las categorías' && categoryName !== historyCategoryFilter) {
              return;
            }

            // Apply History Fuente Filter
            // MINEDU = otros, Escala Docente = propios
            let allQs: PreguntaErronea[] = [];
            if (historyFuenteFilter === 'Todas las fuentes') {
              allQs = [...(esp.propios || []), ...(esp.otros || [])];
            } else if (historyFuenteFilter === 'MINEDU') {
              allQs = esp.otros || [];
            } else if (historyFuenteFilter === 'Escala Docente') {
              allQs = esp.propios || [];
            }

            if (allQs.length === 0) return;

            let groupErrors = 0;
            allQs.forEach((q) => {
              if (q.subPreguntas && q.subPreguntas.length > 0) {
                groupErrors += q.subPreguntas.length;
              } else if (q.erroresInmediatos && q.erroresInmediatos.length > 0) {
                groupErrors += q.erroresInmediatos.length;
              } else {
                groupErrors += 1;
              }
            });

            flatGroups.push({
              title: `${mod.modalidadNombre} - ${niv.nivelNombre}`,
              subtitle: esp.especialidadNombre,
              errors: groupErrors,
              points: groupErrors * 1.5,
              items: allQs,
            });
          });
        });
      });
    });

    return flatGroups;
  }, [erroneas, historyFechaFilter, historyCategoryFilter, historyFuenteFilter]);

  const fechaOptions = useMemo(() => {
    if (!erroneas) return [];
    return erroneas.map(g => g.fecha);
  }, [erroneas]);

  const modalidadOptions = useMemo(() => {
    const options = new Set<string>();
    erroneas?.forEach((groupFecha) => {
      // Filter by selected practice date
      if (selectedFecha !== 'Todas las fechas' && groupFecha.fecha !== selectedFecha) {
        return;
      }

      groupFecha.modalidades?.forEach((mod) => {
        mod.niveles?.forEach((niv) => {
          niv.especialidades?.forEach((esp) => {
            options.add(
              `${mod.modalidadNombre} - ${niv.nivelNombre} - ${esp.especialidadNombre}`
            );
          });
        });
      });
    });
    return Array.from(options);
  }, [erroneas, selectedFecha]);

  const allCategoryOptions = useMemo(() => {
    const options = new Set<string>();
    erroneas?.forEach((groupFecha) => {
      groupFecha.modalidades?.forEach((mod) => {
        mod.niveles?.forEach((niv) => {
          niv.especialidades?.forEach((esp) => {
            options.add(
              `${mod.modalidadNombre} - ${niv.nivelNombre} - ${esp.especialidadNombre}`
            );
          });
        });
      });
    });
    return Array.from(options);
  }, [erroneas]);

  const handleStartPractice = () => {
    let allFilteredQuestions: PreguntaErronea[] = [];

    erroneas?.forEach((groupFecha) => {
      if (selectedFecha !== 'Todas las fechas' && groupFecha.fecha !== selectedFecha) {
        return;
      }

      groupFecha.modalidades?.forEach((mod) => {
        mod.niveles?.forEach((niv) => {
          niv.especialidades?.forEach((esp) => {
            const currentHierarchy = `${mod.modalidadNombre} - ${niv.nivelNombre} - ${esp.especialidadNombre}`;
            if (modalidad && currentHierarchy !== modalidad) return;

            if (fuenteEscala) {
              allFilteredQuestions = [...allFilteredQuestions, ...(esp.propios || [])];
            }
            if (fuenteMinedu) {
              allFilteredQuestions = [...allFilteredQuestions, ...(esp.otros || [])];
            }
          });
        });
      });
    });

    if (allFilteredQuestions.length === 0) {
      alert('No hay preguntas disponibles con los filtros seleccionados.');
      return;
    }

    // Shuffle questions
    const shuffled = [...allFilteredQuestions].sort(() => 0.5 - Math.random());

    // Limit by numPreguntas
    const limitString = numPreguntas.split(' ')[0] || '10';
    const limit = parseInt(limitString, 10);
    const selectedBatch = shuffled.slice(0, limit);

    // Prepare metadata for the exam page
    const metadata = {
      tipoExamenId: 2, // Nombramiento
      modalidad: modalidad || 'Varias modalidades',
      nivel: '',
      especialidad: null,
      year: selectedFecha === 'Todas las fechas' ? 'Histórico' : selectedFecha,
      isSimulacro: false,
    };

    localStorage.setItem('currentQuestions', JSON.stringify(selectedBatch));
    localStorage.setItem('currentExamMetadata', JSON.stringify(metadata));

    router.push(`/examen?from=${router.pathname || ''}`);
  };

  const handleMarkAsReviewed = async (preguntaId: number) => {
    if (!user?.id) return;
    try {
      if (!window.confirm('¿Estás seguro de marcar esta pregunta como revisada? Ya no aparecerá en tu lista de errores.')) return;
      await erroneasService.marcarRevisada(user.id, preguntaId);
      // Refresh the list
      const data = await erroneasService.getByUser(user.id, 2);
      setErroneas(data || []);
    } catch (error) {
      console.error('Error marking as reviewed:', error);
      alert('Error al marcar como revisada');
    }
  };

  if (authLoading || (isAuthenticated && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4790FD]"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <PremiumLayout
      title="Respuestas Erróneas"
      breadcrumb="Pages / Respuestas Erróneas"
    >
      <Head>
        <title>Respuestas Erróneas - Avendocente</title>
      </Head>

      <div className="w-full space-y-6">
        {/* Top Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Configuration (Green) */}
          <div className="bg-[#E6F4EA] rounded-xl p-6 border border-green-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-[#004d40]">
              <BookOpenIcon className="h-5 w-5" />
              <h2 className="font-bold text-lg">
                Perfecciona tu rendimiento corrigiendo tus errores
              </h2>
            </div>

            <p className="text-center font-medium text-gray-700 mb-4">
              Selecciona las preguntas a practicar.
              <span className="ml-1">👇</span>
            </p>

            <div className="space-y-4">
              {/* Fecha Dropdown */}
              <div>
                <label className="text-xs font-semibold text-gray-600 ml-1">
                  Fecha
                </label>
                <div className="relative mt-1">
                  <select
                    value={selectedFecha}
                    onChange={(e) => setSelectedFecha(e.target.value)}
                    className="w-full appearance-none border border-gray-300 rounded-md p-2 pr-8 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm shadow-sm"
                  >
                    <option>Todas las fechas</option>
                    {fechaOptions.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Modalidad Dropdown */}
              <div>
                <label className="text-xs font-semibold text-gray-600 ml-1">
                  Modalidad/Nivel/Especialidad
                </label>
                <div className="relative mt-1">
                  <select
                    value={modalidad}
                    onChange={(e) => setModalidad(e.target.value)}
                    className="w-full appearance-none border border-gray-300 rounded-md p-2 pr-8 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm shadow-sm"
                  >
                    {modalidadOptions.length === 0 ? (
                      <option value="">Cargando opciones...</option>
                    ) : (
                      modalidadOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Fuente de Preguntas */}
              <div>
                <label className="text-xs font-semibold text-gray-600 ml-1">
                  Fuente de Preguntas
                </label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-gray-200 shadow-sm flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fuenteMinedu}
                      onChange={(e) => setFuenteMinedu(e.target.checked)}
                      className="text-red-500 focus:ring-red-500 rounded"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      MINEDU
                    </span>
                  </label>
                  <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-gray-200 shadow-sm flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fuenteEscala}
                      onChange={(e) => setFuenteEscala(e.target.checked)}
                      className="text-red-500 focus:ring-red-500 rounded"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Escala Docente
                    </span>
                  </label>
                </div>
              </div>

              {/* Numero de Preguntas */}
              <div>
                <label className="text-xs font-semibold text-gray-600 ml-1">
                  Número de Preguntas
                </label>
                <div className="relative mt-1">
                  <select
                    value={numPreguntas}
                    onChange={(e) => setNumPreguntas(e.target.value)}
                    className="w-full appearance-none border border-gray-300 rounded-md p-2 pr-8 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm shadow-sm"
                  >
                    <option>10 preguntas</option>
                    <option>20 preguntas</option>
                    <option>50 preguntas</option>
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Button */}
              <button 
                onClick={handleStartPractice}
                className="w-full bg-[#00C853] hover:bg-green-600 text-white font-bold py-3 px-4 rounded-md shadow-md flex items-center justify-center gap-2 mt-2 transition-colors"
              >
                <CheckCircleIcon className="h-5 w-5" />
                ¡Comienza a practicar Ahora!
              </button>
            </div>
          </div>

          {/* Right Panel: Statistics (White) */}
          <div className="bg-white rounded-xl p-6 border border-cyan-400 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6 text-gray-900">
              <ChartBarIcon className="h-5 w-5" />
              <h2 className="font-bold text-lg">Estadísticas de Errores</h2>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="flex justify-around text-center px-4">
                <div>
                  <p className="text-3xl font-bold text-red-500">
                    {stats.totalErrors}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                    Errores Totales
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-500">
                    {stats.uniqueQuestions}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                    Preguntas Equivocadas
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-500">
                    {stats.pointsLost}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                    Puntos Perdidos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: History */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-gray-900">
            <ClockIcon className="h-5 w-5" />
            <h2 className="font-bold text-lg">
              Historial de Preguntas Erróneas
            </h2>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Revisa las {groupedByHierarchy.length} categorías y las preguntas que has
            respondido incorrectamente.
          </p>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-xs font-semibold text-gray-600 ml-1">
                Filtrar por Fecha
              </label>
              <select 
                value={historyFechaFilter}
                onChange={(e) => setHistoryFechaFilter(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm bg-gray-50"
              >
                <option>Todas las fechas</option>
                {fechaOptions.map(f => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 ml-1">
                Filtrar por Categoría
              </label>
              <select 
                value={historyCategoryFilter}
                onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm bg-gray-50"
              >
                <option>Todas las categorías</option>
                {allCategoryOptions.map(opt => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 ml-1">
                Filtrar por Fuente
              </label>
              <select 
                value={historyFuenteFilter}
                onChange={(e) => setHistoryFuenteFilter(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm bg-gray-50"
              >
                <option>Todas las fuentes</option>
                <option>MINEDU</option>
                <option>Escala Docente</option>
              </select>
            </div>
          </div>

          {/* History List */}
          <div className="space-y-4">
            {groupedByHierarchy.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                No tienes preguntas erróneas registradas.
              </div>
            ) : (
              groupedByHierarchy.map((item, index) => (
                <div key={index} className="space-y-3">
                  {/* Header Row */}
                  <div
                    onClick={() =>
                      setExpandedIndex(expandedIndex === index ? null : index)
                    }
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all group ${
                      expandedIndex === index
                        ? 'border-cyan-400 bg-gray-50 shadow-sm'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-sm md:text-base">
                        {item.title}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {item.subtitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border border-red-100 flex items-center gap-1">
                        <span className="text-base leading-none font-bold">
                          !
                        </span>{' '}
                        {item.errors} {item.errors === 1 ? 'error' : 'errores'}
                      </span>
                      <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold">
                        {item.points.toFixed(1)} pts
                      </span>
                      <ChevronDownIcon
                        className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                          expandedIndex === index
                            ? 'rotate-180 text-[#4790FD]'
                            : 'group-hover:text-gray-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedIndex === index && (
                    <div className="pl-0 md:pl-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      {item.items.map((q: PreguntaErronea) => (
                        <div
                          key={q.preguntaId}
                          className="border border-cyan-400 rounded-xl p-4 md:p-8 bg-white shadow-sm space-y-4"
                        >
                          {/* Question Header */}
                          <div className="flex items-center gap-3">
                            <div className="bg-white border-2 border-gray-100 rounded-full h-10 w-10 flex items-center justify-center font-bold text-gray-700 shadow-sm">
                              {q.numero || q.preguntaId}
                            </div>
                            <span className="font-bold text-gray-900 text-lg">
                              Pregunta de Examen {q.year ? `(${q.year})` : ''}
                            </span>
                          </div>

                          {/* Question Body */}
                          <div className="space-y-4 text-gray-900 font-medium">
                            <div
                              className="prose prose-gray max-w-none"
                              dangerouslySetInnerHTML={{ __html: q.enunciado }}
                            />
                          </div>

                          {/* Options Section for simple question */}
                          {(!q.subPreguntas || q.subPreguntas.length === 0) && (
                            <div className="mt-6 space-y-3">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                Alternativas:
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {q.alternativas.map((alt: any, altIdx: number) => {
                                  const isCorrect = String(alt.id) === String(q.respuestaCorrecta);
                                  const isMarked = q.erroresInmediatos?.some(
                                    (err: any) => String(err.alternativaMarcada) === String(alt.id)
                                  );

                                  let bgColor = 'bg-gray-50 border-gray-100';
                                  if (isCorrect) bgColor = 'bg-green-100 border-green-400';
                                  else if (isMarked) bgColor = 'bg-red-50 border-red-400';

                                  return (
                                    <div
                                      key={alt.id}
                                      className={`p-4 rounded-xl border-2 shadow-sm transition-all ${bgColor}`}
                                    >
                                      <HtmlMathRenderer
                                        className="text-sm leading-relaxed"
                                        html={alt.contenido}
                                        alternativeLabel={String.fromCharCode(65 + altIdx)}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Subquestions Section */}
                          {q.subPreguntas && q.subPreguntas.length > 0 && (
                            <div className="mt-6 space-y-8">
                              {q.subPreguntas.map((sub: any) => (
                                <div
                                  key={sub.subPreguntaId}
                                  className="border-l-4 border-cyan-400 pl-4 py-2 bg-gray-50/10 rounded-r-lg space-y-4"
                                >
                                  <div
                                    className="text-sm md:text-base font-bold text-gray-900"
                                    dangerouslySetInnerHTML={{ __html: sub.enunciado }}
                                  />
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {sub.alternativas.map((alt: any, altIdx: number) => {
                                      const isCorrect = String(alt.id) === String(sub.respuestaCorrecta);
                                      const isMarked = String(sub.alternativaMarcada) === String(alt.id);

                                      let bgColor = 'bg-white border-gray-100';
                                      if (isCorrect) bgColor = 'bg-green-100 border-green-400';
                                      else if (isMarked) bgColor = 'bg-red-50 border-red-400';

                                      return (
                                        <div
                                          key={alt.id}
                                          className={`p-4 rounded-xl border-2 shadow-sm transition-all ${bgColor}`}
                                        >
                                          <HtmlMathRenderer
                                            className="text-sm leading-relaxed"
                                            html={alt.contenido}
                                            alternativeLabel={String.fromCharCode(65 + altIdx)}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Info Footer */}
                          <div className="pt-4 border-t border-gray-100 mt-6 flex justify-between items-center">
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                               categoría: {item.subtitle}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsReviewed(q.preguntaId);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#4790FD] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-blue-100"
                            >
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                              Marcar como Revisada
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PremiumLayout>
  );
};

export default RespuestasErroneasPage;

