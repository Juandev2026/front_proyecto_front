import React, { useEffect, useState, useMemo } from 'react';

import {
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  ArrowLeftIcon,
  RefreshIcon,
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/outline';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuth } from '../../hooks/useAuth';
import PremiumLayout from '../../layouts/PremiumLayout';
import { ResultadoExamenResponse, PreguntaExamen } from '../../types/examen';

const ResultadoPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [questions, setQuestions] = useState<PreguntaExamen[]>([]);
  const [examResult, setExamResult] = useState<ResultadoExamenResponse | null>(
    null
  );
  const [respuestas, setRespuestas] = useState<Record<string, any>>({});
  const [timeTaken, setTimeTaken] = useState<number>(0);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const savedQuestions = localStorage.getItem('currentQuestions');
    const savedResult = localStorage.getItem('lastExamResult');
    const savedRespuestas = localStorage.getItem('lastRespuestas');
    const savedTime = localStorage.getItem('lastExamTime');

    if (savedQuestions) setQuestions(JSON.parse(savedQuestions));
    if (savedResult) setExamResult(JSON.parse(savedResult));
    if (savedRespuestas) setRespuestas(JSON.parse(savedRespuestas));
    if (savedTime) setTimeTaken(parseInt(savedTime, 10));
  }, [loading, isAuthenticated, router]);

  const stats = useMemo(() => {
    if (!examResult) return null;

    const global = examResult.resultados.reduce(
      (acc, r) => ({
        correctas: acc.correctas + r.cantidadCorrectas,
        incorrectas: acc.incorrectas + r.cantidadIncorrectas,
        omitidas: acc.omitidas + r.cantidadOmitidas,
      }),
      { correctas: 0, incorrectas: 0, omitidas: 0 }
    );

    const total = questions.length;
    const answered = global.correctas + global.incorrectas;

    // Calculate classification averages/points
    const classificationStats: Record<
      string,
      { points: number; correct: number; total: number }
    > = {};

    questions.forEach((q, _idx) => {
      const className = q.clasificacionNombre || 'Otros';
      if (!classificationStats[className]) {
        classificationStats[className] = {
          points: q.puntos || 0,
          correct: 0,
          total: 0,
        };
      }
      classificationStats[className].total += 1;

      const subNum = (q as any).numeroSubPregunta;
      const backendKey = subNum !== undefined ? `${q.id}-${subNum}` : `${q.id}`;

      const isCorrect = examResult.resultados.some((r) => {
        return (
          r.idsCorrectas.includes(backendKey) ||
          r.idsCorrectas.includes(String(q.id))
        );
      });

      if (isCorrect) {
        classificationStats[className].correct += 1;
      }
    });

    return {
      ...global,
      total,
      answered,
      score: examResult.puntajeGlobal,
      classStats: Object.entries(classificationStats).map(([name, data]) => ({
        name,
        ...data,
      })),
    };
  }, [examResult, questions]);

  const getQuestionResult = (
    q: PreguntaExamen,
    _index: number
  ): 'correct' | 'incorrect' | 'omitted' => {
    if (!examResult) return 'omitted';

    const subNum = (q as any).numeroSubPregunta;
    const backendKey = subNum !== undefined ? `${q.id}-${subNum}` : `${q.id}`;

    let finalResult: 'correct' | 'incorrect' | 'omitted' = 'incorrect';

    examResult.resultados.forEach((r) => {
      if (
        r.idsCorrectas.includes(backendKey) ||
        r.idsCorrectas.includes(String(q.id))
      ) {
        finalResult = 'correct';
      } else if (
        r.idsIncorrectas.includes(backendKey) ||
        r.idsIncorrectas.includes(String(q.id))
      ) {
        finalResult = 'incorrect';
      } else if (
        r.idsOmitidas.includes(backendKey) ||
        r.idsOmitidas.includes(String(q.id))
      ) {
        finalResult = 'omitted';
      }
    });

    return finalResult;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !isAuthenticated || !examResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#002B6B]"></div>
      </div>
    );
  }

  return (
    <PremiumLayout
      title="Resultados del Examen"
      breadcrumb="Pages / Resultados"
    >
      <Head>
        <title>Resultados del Examen - Avendocente</title>
      </Head>

      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {/* Header Title */}
        <div className="bg-[#002B6B] text-white p-4 rounded-xl shadow-lg border-b-4 border-blue-900 flex justify-center items-center">
          <h1 className="text-xl font-black uppercase tracking-widest">
            Resultados del examen
          </h1>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Summary Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center">
              <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-tighter self-start mb-6">
                <ChartBarIcon className="w-4 h-4" />
                Resumen del examen
              </div>

              <div className="text-center">
                <p className="text-4xl font-black text-gray-800">
                  {stats?.score}{' '}
                  <span className="text-lg text-gray-400 font-medium">
                    / 200 pts
                  </span>
                </p>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  Tu promedio de aciertos es de{' '}
                  <span className="font-bold text-blue-600">
                    {(
                      ((stats?.correctas || 0) / (stats?.total || 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </p>
              </div>

              {/* Progress visual */}
              <div className="w-full max-w-md mt-8 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner flex">
                <div
                  style={{
                    width: `${
                      ((stats?.correctas || 0) / (stats?.total || 1)) * 100
                    }%`,
                  }}
                  className="bg-green-500 h-full"
                ></div>
                <div
                  style={{
                    width: `${
                      ((stats?.incorrectas || 0) / (stats?.total || 1)) * 100
                    }%`,
                  }}
                  className="bg-red-500 h-full"
                ></div>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-4 gap-8 mt-10 w-full">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-green-600">
                    {stats?.correctas}
                  </span>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    Correctas
                  </span>
                </div>
                <div className="flex flex-col items-center text-red-600">
                  <span className="text-2xl font-black">
                    {stats?.incorrectas}
                  </span>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    Incorrectas
                  </span>
                </div>
                <div className="flex flex-col items-center text-gray-500">
                  <span className="text-2xl font-black">{stats?.omitidas}</span>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    Omitidas
                  </span>
                </div>
                <div className="flex flex-col items-center text-[#002B6B]">
                  <span className="text-2xl font-black">{stats?.total}</span>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    Total
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: Classification points */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-tighter mb-6">
                <ClockIcon className="w-4 h-4" />
                Información del examen
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="space-y-1">
                  <p className="text-xl font-bold text-gray-700">
                    {formatTime(timeTaken)}
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                    Tiempo total
                  </p>
                </div>
                {stats?.classStats.map((c) => (
                  <div key={c.name} className="space-y-1">
                    <p className="text-xl font-bold text-[#002B6B]">
                      {c.points.toFixed(1)}
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                      {c.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Banco de Errores Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-blue-50 p-10 flex flex-col md:flex-row items-center gap-8 justify-between">
              <div className="flex-1 text-center md:text-left space-y-4">
                <p className="text-gray-500 font-medium text-center md:text-left">
                  Actualmente realizaste un total de{' '}
                  <span className="text-green-500 font-black">
                    361 examenes
                  </span>
                </p>
                <div className="flex flex-col items-center md:items-start gap-2">
                  <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center mb-2">
                    <span className="text-yellow-500 font-black">!</span>
                  </div>
                  <h4 className="text-lg font-black text-gray-800">
                    ¿Te equivocaste en algunas preguntas?
                  </h4>
                  <p className="text-sm text-gray-500">
                    Revisa tu módulo de{' '}
                    <span className="font-bold text-blue-600">
                      &quot;Respuestas Erróneas&quot;
                    </span>{' '}
                    y convierte tus errores en oportunidades de aprendizaje.
                  </p>
                  <p className="text-xs text-gray-400">
                    👍 ¡Cada error corregido es un paso más hacia tu Ascenso!
                  </p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg inline-flex items-center gap-2 text-[10px] text-blue-600 font-bold">
                  <span className="text-blue-400">💡</span> Tip: estudiar tus
                  errores es la clave del éxito
                </div>
              </div>
              <button className="bg-[#002B6B] text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:scale-105 transition-all text-sm whitespace-nowrap">
                Ver Respuestas Erróneas
              </button>
            </div>
          </div>

          {/* Right: Actions and Percentages */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-4">
              <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-tighter mb-4">
                <AcademicCapIcon className="w-4 h-4" />
                Acciones
              </div>
              <button
                onClick={() => router.push('/simulacroExamen')}
                className="w-full py-3 border border-blue-100 rounded-xl text-[#002B6B] text-xs font-black shadow-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                <RefreshIcon className="w-3 h-3" />
                Dar nuevo examen
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full py-3 border border-blue-100 rounded-xl text-[#002B6B] text-xs font-black shadow-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeftIcon className="w-3 h-3" />
                Volver al inicio
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
              <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-tighter mb-2">
                <ChartBarIcon className="w-4 h-4" />% Porcentajes del examen
              </div>

              <div className="space-y-4">
                {[
                  {
                    label: 'Correctas',
                    count: stats?.correctas,
                    color: 'bg-green-500',
                  },
                  {
                    label: 'Incorrectas',
                    count: stats?.incorrectas,
                    color: 'bg-red-500',
                  },
                  {
                    label: 'Sin responder',
                    count: stats?.omitidas,
                    color: 'bg-gray-400',
                  },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${item.color}`}
                        ></div>
                        {item.label}
                      </div>
                      <span>
                        {(
                          ((item.count || 0) / (stats?.total || 1)) *
                          100
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color}`}
                        style={{
                          width: `${
                            ((item.count || 0) / (stats?.total || 1)) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* National Average Table MOCK/Based on image */}
            <div className="bg-[#EBFAFA] rounded-3xl p-8 border border-cyan-100">
              <h4 className="text-2xl font-serif text-[#1F5454] font-black text-center mb-8">
                Composición de la Prueba Nacional
              </h4>
              <div className="overflow-hidden rounded-xl border border-cyan-200 shadow-sm bg-white">
                <table className="w-full text-[10px] text-gray-700 font-medium">
                  <thead className="bg-cyan-50/50">
                    <tr className="border-b border-cyan-100 text-[#1F5454]">
                      <th className="p-3 text-left">Subpruebas</th>
                      <th className="p-3"># de preguntas</th>
                      <th className="p-3">Valor por pregunta</th>
                      <th className="p-3 text-center">Puntaje máximo</th>
                      <th className="p-3 text-center">
                        Puntaje mínimo requerido
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-cyan-50">
                      <td className="p-3 font-bold">Habilidades Generales</td>
                      <td className="p-3 text-center">25</td>
                      <td className="p-3 text-center">2</td>
                      <td className="p-3 text-center font-bold">50</td>
                      <td className="p-3 text-center">—</td>
                    </tr>
                    <tr className="border-b border-cyan-50">
                      <td className="p-3 font-bold">
                        Conocimientos Pedagógicos, Curriculares y Disciplinarios
                        de la Especialidad
                      </td>
                      <td className="p-3 text-center">50</td>
                      <td className="p-3 text-center">3</td>
                      <td className="p-3 text-center font-bold">150</td>
                      <td className="p-3 text-center font-bold">84</td>
                    </tr>
                    <tr className="bg-cyan-50/20">
                      <td className="p-3 font-black uppercase">Total</td>
                      <td className="p-3 text-center font-black text-lg">75</td>
                      <td className="p-3 text-center">—</td>
                      <td className="p-3 text-center font-black text-[#1F5454] text-lg">
                        200
                      </td>
                      <td className="p-3 text-center font-black text-[#1F5454] text-lg">
                        110
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* --- REVIEW SECTION --- */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden mt-12">
          <div className="bg-gradient-to-r from-[#002B6B]/5 to-transparent p-6 border-b border-gray-100 flex flex-col items-center gap-4">
            <h2 className="text-2xl font-black text-[#002B6B] uppercase tracking-[0.2em]">
              Revisión de Respuestas
            </h2>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-[10px] text-gray-400 font-black uppercase mr-2 self-center">
                Categorías del examen:
              </span>
              <span className="bg-blue-600 text-white text-[9px] px-3 py-1 rounded-full font-bold shadow-sm">
                MINEDU Nombramiento
              </span>
              <span className="bg-green-400 text-white text-[9px] px-3 py-1 rounded-full font-bold shadow-sm">
                Nombramiento
              </span>
              <span className="bg-pink-400 text-white text-[9px] px-3 py-1 rounded-full font-bold shadow-sm">
                Educación Básica Alternativa
              </span>
              <span className="bg-cyan-400 text-white text-[9px] px-3 py-1 rounded-full font-bold shadow-sm">
                Inicial - Intermedio
              </span>
              <span className="bg-green-600 text-white text-[9px] px-3 py-1 rounded-full font-bold shadow-sm">
                2023
              </span>
            </div>
          </div>

          <div className="p-6 md:p-10 space-y-12">
            {questions.map((q, idx) => {
              const result = getQuestionResult(q, idx);
              const userAnswer = respuestas[String(idx)]?.alternativa;
              const isCorrect = result === 'correct';

              // Only show parent enunciado if it's different from the previous one
              const showParent =
                (q as any).parentEnunciado &&
                (idx === 0 ||
                  (questions[idx - 1] as any).parentEnunciado !==
                    (q as any).parentEnunciado);

              const getStatusLabel = () => {
                if (isCorrect) return 'Correcta';
                if (result === 'omitted') return 'Omitida';
                return 'Incorrecta';
              };

              const getStatusClasses = () => {
                if (isCorrect)
                  return 'bg-green-50 text-green-600 border-green-100';
                if (result === 'omitted')
                  return 'bg-orange-50 text-orange-600 border-orange-100';
                return 'bg-red-50 text-red-600 border-red-100';
              };

              const getStatusIcon = () => {
                if (isCorrect) return <CheckCircleIcon className="w-3 h-3" />;
                if (result === 'omitted')
                  return <MinusCircleIcon className="w-3 h-3" />;
                return <XCircleIcon className="w-3 h-3" />;
              };

              return (
                <div key={idx} className="space-y-0">
                  {/* Parent text section if available and first of its group */}
                  {showParent && (
                    <div className="bg-gray-50 border border-blue-100 p-8 rounded-t-3xl relative mb-0">
                      <div className="absolute top-0 left-8 -translate-y-1/2 bg-gray-400 text-white text-[9px] font-black px-4 py-1 rounded-md uppercase tracking-widest shadow-sm">
                        Texto de Referencia
                      </div>
                      <div
                        className="text-gray-800 font-serif leading-relaxed text-sm text-justify"
                        dangerouslySetInnerHTML={{
                          __html: (q as any).parentEnunciado,
                        }}
                      />
                    </div>
                  )}

                  {/* Question Block */}
                  <div
                    className={`bg-white border border-gray-100 p-4 md:p-8 space-y-8 ${
                      showParent ? 'rounded-b-3xl border-t-0' : 'rounded-3xl'
                    } mb-8 shadow-sm`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-[#002B6B] flex items-center justify-center font-bold text-sm shadow-inner">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                          {(q as any).isSubPregunta
                            ? `Sub pregunta ${
                                (q as any).numeroSubPregunta || ''
                              }`
                            : 'Pregunta Individual'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {q.clasificacionNombre && (
                          <span className="bg-pink-50 text-pink-500 text-[10px] font-black px-3 py-1.5 rounded-lg border border-pink-100 shadow-sm uppercase">
                            {q.clasificacionNombre}
                          </span>
                        )}
                        <span
                          className={`${getStatusClasses()} text-[10px] font-black px-3 py-1.5 rounded-lg border shadow-sm uppercase flex items-center gap-1`}
                        >
                          {getStatusIcon()}
                          {getStatusLabel()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div
                        className="text-gray-900 font-bold text-base leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: q.enunciado }}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['A', 'B', 'C', 'D'].map((opt) => {
                          const optContent = (q as any)[`alternativa${opt}`];
                          if (!optContent) return null;

                          const isSelected = userAnswer === opt;
                          const isAnswerCorrect = q.respuesta === opt;

                          let borderColor = 'border-gray-100';
                          let bgColor = 'bg-white';
                          let textColor = 'text-gray-700';

                          if (isAnswerCorrect) {
                            borderColor = 'border-green-300';
                            bgColor = 'bg-green-50/50';
                            textColor = 'text-green-800';
                          } else if (isSelected && !isAnswerCorrect) {
                            borderColor = 'border-red-300';
                            bgColor = 'bg-red-50/50';
                            textColor = 'text-red-800';
                          }

                          return (
                            <div
                              key={opt}
                              className={`p-4 border-2 rounded-xl flex items-center gap-4 transition-all ${borderColor} ${bgColor} ${textColor}`}
                            >
                              <div
                                className={`w-8 h-8 flex-shrink-0 border-2 rounded-lg flex items-center justify-center font-bold ${
                                  isAnswerCorrect
                                    ? 'border-green-500 bg-green-500 text-white'
                                    : 'border-gray-200 text-gray-400'
                                }`}
                              >
                                {opt}
                              </div>
                              <div
                                className="text-xs font-semibold"
                                dangerouslySetInnerHTML={{ __html: optContent }}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Sustento */}
                      {q.sustento && (
                        <div className="mt-8 pt-6 border-t border-gray-50">
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                            Sustento:
                          </div>
                          <div
                            className="text-xs text-gray-600 italic leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: q.sustento }}
                          />
                        </div>
                      )}
                      {!q.sustento && (
                        <div className="mt-8 pt-6 border-t border-gray-50">
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Sustento:
                          </div>
                          <p className="text-[10px] text-gray-300 italic">
                            No hay sustento disponible para esta pregunta.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Final Branding / Sign */}
        <div className="flex flex-col items-center opacity-70 pt-12">
          <span className="font-handwriting text-4xl text-black transform -rotate-1">
            Juan Avendaño
          </span>
          <div className="bg-[#1DA1F2] text-white p-1 rounded-full w-8 h-8 flex items-center justify-center mt-2 shadow-lg">
            <span className="text-[14px] font-bold">t</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');
        .font-handwriting {
          font-family: 'Caveat', cursive;
        }
        .font-serif {
          font-family: 'Georgia', serif;
        }
      `}</style>
    </PremiumLayout>
  );
};

export default ResultadoPage;
