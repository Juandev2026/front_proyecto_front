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
import { erroneasService, GrupoErroneas } from '../services/erroneasService';

const RespuestasErroneasPage = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [modalidad, setModalidad] = useState(
    'Educación Básica Alternativa - Inicial - Intermedio'
  );
  const [numPreguntas, setNumPreguntas] = useState('10 preguntas');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [erroneas, setErroneas] = useState<GrupoErroneas[]>([]);
  const [loading, setLoading] = useState(true);

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

    erroneas.forEach((group) => {
      group.preguntas.forEach((q) => {
        uniqueQuestions.add(q.preguntaId);
        if (q.subPreguntas && q.subPreguntas.length > 0) {
          totalErrors += q.subPreguntas.length;
        } else if (q.erroresInmediatos) {
          totalErrors += q.erroresInmediatos.length;
        } else {
          totalErrors += 1;
        }
      });
    });

    const pointsLost = (totalErrors * 1.5).toFixed(1);
    return { totalErrors, uniqueQuestions: uniqueQuestions.size, pointsLost };
  }, [erroneas]);

  const groupedByDate = useMemo(() => {
    return erroneas.map((group) => {
      const date = group.fecha ? new Date(group.fecha + 'T12:00:00') : new Date();
      const options: any = { day: 'numeric', month: 'long', year: 'numeric' };
      let dateString = date.toLocaleDateString('es-ES', options);

      if (dateString === 'Invalid Date' || !group.fecha) {
        dateString = 'Fecha no disponible';
      }

      let groupErrors = 0;
      group.preguntas.forEach((q) => {
        if (q.subPreguntas && q.subPreguntas.length > 0) {
          groupErrors += q.subPreguntas.length;
        } else if (q.erroresInmediatos) {
          groupErrors += q.erroresInmediatos.length;
        } else {
          groupErrors += 1;
        }
      });

      return {
        date: dateString,
        errors: groupErrors,
        points: groupErrors * 1.5,
        items: group.preguntas,
        rawDate: group.fecha || '',
      };
    });
  }, [erroneas]);

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
                    <option>
                      Educación Básica Alternativa - Inicial - Intermedio
                    </option>
                    <option>Educación Básica Regular - Inicial</option>
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
                      defaultChecked
                      className="text-red-500 focus:ring-red-500 rounded"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      MINEDU
                    </span>
                  </label>
                  <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-gray-200 shadow-sm flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
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
              <button className="w-full bg-[#00C853] hover:bg-green-600 text-white font-bold py-3 px-4 rounded-md shadow-md flex items-center justify-center gap-2 mt-2 transition-colors">
                <CheckCircleIcon className="h-5 w-5" />
                ¡Comienza a practicar Ahora!
              </button>
            </div>
          </div>

          {/* Right Panel: Statistics (White) */}
          <div className="bg-white rounded-xl p-6 border border-cyan-400 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-gray-900">
              <ChartBarIcon className="h-5 w-5" />
              <h2 className="font-bold text-lg">Estadísticas de Errores</h2>
            </div>

            <div className="flex justify-between text-center mb-8 px-4">
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

            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-gray-600">
                    Categoría
                  </span>
                </div>
                <span className="text-sm font-bold text-red-500">
                  {user?.especialidad || 'No especificada'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-sm font-medium text-gray-600">Año</span>
                </div>
                <span className="text-sm font-bold text-orange-500">
                  {new Date().getFullYear()}
                </span>
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
            Revisa las {groupedByDate.length} fechas y las preguntas que has
            respondido incorrectamente. Las más recientes aparecen primero.
          </p>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-semibold text-gray-600 ml-1">
                Filtrar por Categoría
              </label>
              <select className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm bg-gray-50">
                <option>Todas las categorías</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 ml-1">
                Filtrar por Fuente
              </label>
              <select className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm bg-gray-50">
                <option>Todas las fuentes</option>
              </select>
            </div>
          </div>

          {/* History List */}
          <div className="space-y-4">
            {groupedByDate.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                No tienes preguntas erróneas registradas.
              </div>
            ) : (
              groupedByDate.map((item, index) => (
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
                    <span className="font-bold text-gray-900 text-sm md:text-base">
                      Errores - {item.date}
                    </span>

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
                      {item.items.map((q) => (
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
                                {q.alternativas.map((alt) => {
                                  const isCorrect = String(alt.id) === String(q.respuestaCorrecta);
                                  const isMarked = q.erroresInmediatos?.some(
                                    (err) => String(err.alternativaMarcada) === String(alt.id)
                                  );

                                  let bgColor = 'bg-gray-50 border-gray-100';
                                  if (isCorrect) bgColor = 'bg-green-100 border-green-400';
                                  else if (isMarked) bgColor = 'bg-red-50 border-red-400';

                                  return (
                                    <div
                                      key={alt.id}
                                      className={`p-4 rounded-xl border-2 shadow-sm transition-all ${bgColor}`}
                                    >
                                      <div
                                        className="text-sm leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: alt.contenido }}
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
                              {q.subPreguntas.map((sub) => (
                                <div
                                  key={sub.subPreguntaId}
                                  className="border-l-4 border-cyan-400 pl-4 py-2 bg-gray-50/10 rounded-r-lg space-y-4"
                                >
                                  <div
                                    className="text-sm md:text-base font-bold text-gray-900"
                                    dangerouslySetInnerHTML={{ __html: sub.enunciado }}
                                  />
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {sub.alternativas.map((alt) => {
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
                                          <div
                                            className="text-sm leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: alt.contenido }}
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
                          <div className="pt-4 border-t border-gray-100 mt-6 flex justify-end items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            <div>fecha: {item.date}</div>
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

