import React, { useEffect, useState, useMemo, useCallback } from 'react';

import {
  ClockIcon,
  VolumeUpIcon,
  RefreshIcon,
  ViewGridIcon,
  ArrowsExpandIcon,
  CheckCircleIcon,
  StarIcon as Star,
  TicketIcon as TargetIcon,
} from '@heroicons/react/outline';
import { AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';

import Toast from '../../components/Toast';
import { useAuth } from '../../hooks/useAuth';
import PremiumLayout from '../../layouts/PremiumLayout';
import { evaluacionService } from '../../services/evaluacionService';
import {
  PreguntaExamen,
  ResultadoExamenResponse,
  SolucionExamenRequest,
} from '../../types/examen';

const ExamenPage = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  // Data State
  const [questions, setQuestions] = useState<PreguntaExamen[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // { "preguntaId" o "preguntaId_subNumero": { examenId: number, alternativa: string } }
  const [respuestas, setRespuestas] = useState<
    Record<
      string,
      { examenId: number; alternativa: string; isCorrect?: boolean }
    >
  >({}); // Results State
  const [examResult, setExamResult] = useState<ResultadoExamenResponse | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer State
  const [seconds, setSeconds] = useState(0);

  // TTS State
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [showQuestionPanel, setShowQuestionPanel] = useState(true);

  // Toast State
  const [toasts, setToasts] = useState<
    { id: string; message: string; type: 'success' | 'error' | 'info' }[]
  >([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Auth Guard & Data Loading
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const savedQuestions = localStorage.getItem('currentQuestions');
    const savedMetadata = localStorage.getItem('currentExamMetadata');

    if (savedQuestions) {
      const parsedQuestions = JSON.parse(savedQuestions);
      const flattened: any[] = [];

      parsedQuestions.forEach((q: any) => {
        if (q.subPreguntas && q.subPreguntas.length > 0) {
          q.subPreguntas.forEach((sub: any) => {
            flattened.push({
              ...q,
              ...sub, // sub properties will override q properties
              enunciado: sub.enunciado || q.enunciado || '',
              parentEnunciado: (sub.enunciado && q.enunciado) ? q.enunciado : '',
              alternativaA: sub.alternativaA || sub.alternativas?.[0]?.contenido || q.alternativaA || '',
              alternativaB: sub.alternativaB || sub.alternativas?.[1]?.contenido || q.alternativaB || '',
              alternativaC: sub.alternativaC || sub.alternativas?.[2]?.contenido || q.alternativaC || '',
              alternativaD: sub.alternativaD || sub.alternativas?.[3]?.contenido || q.alternativaD || '',
              puntos: sub.puntos || q.puntos,
              tiempoPregunta: sub.tiempoPregunta || q.tiempoPregunta,
              numeroSubPregunta: sub.numero,
              respuesta: sub.respuestaCorrecta || sub.respuesta || q.respuesta, 
              isSubPregunta: true,
              subPreguntas: [], // Clear this to avoid recursive rendering issues
            });
          });
        } else {
          flattened.push({ ...q, isSubPregunta: false });
        }
      });

      console.log('Flattened questions:', flattened);
      setQuestions(flattened);
    }
    if (savedMetadata) {
      setMetadata(JSON.parse(savedMetadata));
    }

    // Trigger start toast
    addToast('Examen iniciado correctamente.', 'success');
  }, [loading, isAuthenticated, router]);

  // Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // TTS Voices Loading
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      const spanishVoices = availableVoices.filter(
        (v) =>
          v.lang.includes('es') ||
          v.name.includes('Microsoft') ||
          v.name.includes('Google')
      );

      const priorityNames = [
        'Microsoft Elena',
        'Microsoft Sabina',
        'Microsoft Raul',
        'Microsoft Laura',
        'Google español',
      ];
      spanishVoices.sort((a, b) => {
        const aIndex = priorityNames.findIndex((name) => a.name.includes(name));
        const bIndex = priorityNames.findIndex((name) => b.name.includes(name));
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return 0;
      });

      const topVoices = spanishVoices.slice(0, 4);
      setVoices(topVoices);
      if (topVoices.length > 0 && !selectedVoice)
        setSelectedVoice(topVoices[0] || null);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => window.speechSynthesis.cancel();
  }, [selectedVoice]);

  // --- Handlers ---
  const formatTime = (totalSeconds: number) => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec
      .toString()
      .padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];

  const handleToggleReading = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
    } else if (currentQuestion) {
      let textToRead = '';
      if ((currentQuestion as any).parentEnunciado) {
        textToRead += `Texto de lectura: ${
          (currentQuestion as any).parentEnunciado
        }. `;
      }
      textToRead += `Pregunta: ${currentQuestion.enunciado || ''}. `;

      textToRead += `Alternativa A: ${currentQuestion.alternativaA || ''}. `;
      textToRead += `Alternativa B: ${currentQuestion.alternativaB || ''}. `;
      textToRead += `Alternativa C: ${currentQuestion.alternativaC || ''}. `;
      if (currentQuestion.alternativaD)
        textToRead += `Alternativa D: ${currentQuestion.alternativaD}. `;
      const stripHtml = (html: string) => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
      };
      const cleanText = stripHtml(textToRead);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.onend = () => setIsReading(false);
      window.speechSynthesis.speak(utterance);
      setIsReading(true);
    }
  };

  const handleSelectOption = (option: string) => {
    if (!currentQuestion) return;
    if (examResult) return;

    const key = String(currentIndex);

    // LOCK: If already answered and reviewed, don't allow change
    if (respuestas[key]?.isCorrect !== undefined) return;

    console.log(
      `Selecting answer for Index ${currentIndex} (ID: ${currentQuestion.id}): ${option}`
    );

    setRespuestas((prev) => ({
      ...prev,
      [key]: {
        examenId: currentQuestion.examenId,
        alternativa: option,
      },
    }));
  };

  const reviewCurrentQuestion = () => {
    if (!currentQuestion) return;

    const key = String(currentIndex);

    if (respuestas[key] && respuestas[key].isCorrect === undefined) {
      const isCorrect =
        respuestas[key].alternativa.toUpperCase() ===
        currentQuestion.respuesta?.toUpperCase();

      setRespuestas((prev) => {
        const current = prev[key];
        if (!current) return prev;
        return {
          ...prev,
          [key]: {
            ...current,
            isCorrect,
          },
        };
      });

      if (isCorrect) {
        addToast('¡Respuesta correcta!', 'success');
      } else {
        addToast('Respuesta incorrecta.', 'error');
      }
    }
  };

  const handleNext = () => {
    reviewCurrentQuestion();

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      window.speechSynthesis.cancel();
      setIsReading(false);
    }
  };

  const handleRegenerate = () => {
    if (
      confirm(
        '¿Estás seguro de reiniciar el examen? Perderás todo el progreso.'
      )
    ) {
      setSeconds(0);
      setCurrentIndex(0);
      setRespuestas({});
      setExamResult(null);
      window.speechSynthesis.cancel();
      setIsReading(false);
    }
  };

  const handleFinishExam = async () => {
    console.log('--- handleFinishExam initiated ---');
    console.log('Current User Answers:', respuestas);

    if (!confirm('¿Estás seguro de finalizar el examen?')) {
      console.log('User cancelled exam finish.');
      return;
    }

    reviewCurrentQuestion();

    try {
      console.log('Setting isSubmitting to true...');
      setIsSubmitting(true);
      window.speechSynthesis.cancel();

      const firstQuestion = questions[0];
      const examYearRaw = String(metadata?.year || firstQuestion?.year || '0')
        .split(',')[0]
        .trim();
      const examYear = parseInt(examYearRaw, 10) || 0;

      const respuestasPayload = questions.map((q, index) => {
        const key = String(index);
        const data = respuestas[key];

        // El backend espera números (1, 2, 3) para preguntas regulares, pero letras (A, B) para sub-preguntas.
        let finalAnswer = data?.alternativa || '';
        if (finalAnswer && !(q as any).isSubPregunta) {
          const charMap: Record<string, string> = {
            A: '1',
            B: '2',
            C: '3',
            D: '4',
          };
          finalAnswer = charMap[finalAnswer] || finalAnswer;
        }

        return {
          preguntaId: q.preguntaId || q.id,
          subPreguntaNumero: (q as any).numeroSubPregunta || null,
          alternativaMarcada: finalAnswer,
        };
      });

      const payload: SolucionExamenRequest = {
        examenId: firstQuestion?.examenId || 0,
        userId: user?.id || 0,
        year: examYear,
        respuestas: respuestasPayload as any[], // Safe cast as we've matched documentation
      };

      console.log(
        'Payload prepared for grading:',
        JSON.stringify(payload, null, 2)
      );

      if (payload.respuestas.length === 0) {
        console.warn('Payload is empty! No answers recorded?');
        alert(
          'Advertencia: No se han registrado respuestas. ¿Estás seguro de que marcaste alguna alternativa?'
        );
      }

      console.log('Calling evaluacionService.calificar...');
      const result = await evaluacionService.calificar(payload);
      console.log('Service returned result:', result);

      setExamResult(result);

      // Persist results and answers for the dedicated results page
      localStorage.setItem('lastExamResult', JSON.stringify(result));
      localStorage.setItem('lastRespuestas', JSON.stringify(respuestas));
      localStorage.setItem('lastExamTime', String(seconds));

      console.log('Redirecting to results page...');
      router.push('/examen/resultado');
    } catch (error: any) {
      console.error('Error in handleFinishExam:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(`Error al calificar el examen: ${errorMessage}`);
    } finally {
      console.log('Setting isSubmitting to false.');
      setIsSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const total = questions.length;
    let answeredCount = 0;
    Object.keys(respuestas).forEach((key) => {
      if (respuestas[key]?.alternativa) answeredCount++;
    });
    const percentage = total > 0 ? (answeredCount / total) * 100 : 0;

    return {
      total,
      answered: answeredCount,
      unanswered: Math.max(0, total - answeredCount),
      percentage,
    };
  }, [questions, respuestas]);

  // Helper to check if a question is correct/incorrect based on results
  const getQuestionStatus = (index: number) => {
    const q = questions[index];
    if (!q) return null;

    // 1. Check local immediate feedback (index-based)
    const localKey = String(index);
    if (respuestas[localKey]?.isCorrect !== undefined) {
      return respuestas[localKey].isCorrect ? 'correct' : 'incorrect';
    }

    // 2. Fallback to global exam result (ID-based)
    if (!examResult) return null;
    const result = examResult.resultados.find((r) => r.examenId === q.examenId);
    if (!result) return null;

    const subNum = (q as any).numeroSubPregunta;
    // Backend returns IDs like "100" or "100-1"
    const backendKey = subNum !== undefined ? `${q.id}-${subNum}` : `${q.id}`;

    if (
      result.idsCorrectas.includes(backendKey) ||
      result.idsCorrectas.includes(String(q.id))
    )
      return 'correct';
    if (
      result.idsIncorrectas.includes(backendKey) ||
      result.idsIncorrectas.includes(String(q.id))
    )
      return 'incorrect';
    if (
      result.idsOmitidas.includes(backendKey) ||
      result.idsOmitidas.includes(String(q.id))
    )
      return 'omitted';
    return null;
  };

  if (loading || !isAuthenticated || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#002B6B]"></div>
          <p className="text-gray-500 font-medium font-sans">
            Cargando examen...
          </p>
        </div>
      </div>
    );
  }

  return (
    <PremiumLayout title="Examen" breadcrumb="Pages / Examen">
      <Head>
        <title>Examen - Avendocente</title>
      </Head>

      {/* Top Bar Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 relative z-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Timer Section */}
          <div className="flex items-center gap-2 text-gray-700 font-bold text-xl min-w-[140px]">
            <ClockIcon className="h-6 w-6 text-gray-500" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm text-gray-500 font-normal font-sans">
                Tiempo:
              </span>
              <span className="font-mono">{formatTime(seconds)}</span>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex flex-wrap items-center justify-center gap-2 flex-1 font-sans">
            <button
              onClick={handleToggleReading}
              className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm transition-all ${
                isReading
                  ? 'bg-red-50 border-red-200 text-red-600 shadow-inner'
                  : 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100 font-medium shadow-sm'
              }`}
            >
              <VolumeUpIcon className="h-4 w-4" />
              {isReading ? 'Detener lectura' : 'Activar sonido'}
            </button>

            <div className="relative min-w-[180px] max-w-[220px]">
              <select
                className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 truncate font-sans"
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = voices.find((v) => v.name === e.target.value);
                  if (voice) setSelectedVoice(voice);
                }}
              >
                {voices.length === 0 && <option>Cargando voces...</option>}
                {voices.map((voice, idx) => (
                  <option
                    key={`${voice.name}-${idx}`}
                    value={voice.name}
                    title={voice.name}
                  >
                    {voice.name.replace('Microsoft ', '').split(' - ')[0]}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            <button
              onClick={handleRegenerate}
              className="flex items-center gap-2 px-3 py-2 border border-blue-200 text-[#002B6B] rounded-md text-sm hover:bg-blue-50 font-medium transition-colors"
            >
              <RefreshIcon className="h-4 w-4" />
              Generar de nuevo
            </button>

            {!examResult && (
              <button
                onClick={() => {
                  console.log('Botón Finalizar Examen clickeado');
                  handleFinishExam();
                }}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 font-bold transition-colors shadow-md disabled:opacity-70"
              >
                <CheckCircleIcon className="h-4 w-4" />
                {isSubmitting ? 'Calificando...' : 'Finalizar Examen'}
              </button>
            )}

            <button
              onClick={() => setShowQuestionPanel(!showQuestionPanel)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-bold transition-all ${
                showQuestionPanel
                  ? 'bg-[#002B6B] text-white border-[#002B6B]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ViewGridIcon className="h-4 w-4" />
              {showQuestionPanel ? 'Ocultar Panel' : 'Panel de Preguntas'}
            </button>

            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                } else {
                  document.exitFullscreen();
                }
              }}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowsExpandIcon className="h-4 w-4" />
              Pantalla completa
            </button>
          </div>

          {/* Badges Section */}
          <div className="flex flex-col gap-2 items-end min-w-[150px] font-sans">
            <div className="bg-[#D6FFD8] border border-green-200 text-[#008000] px-3 py-1 rounded-full flex items-center gap-1 text-[11px] font-bold w-fit whitespace-nowrap shadow-sm">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              ¡Examen listo!
            </div>
            <div className="flex gap-1 justify-end flex-wrap">
              {metadata?.modalidad && (
                <span className="bg-[#EFEEFF] text-[#002B6B] text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 shadow-sm">
                  {metadata.modalidad}
                </span>
              )}
              {metadata?.nivel && metadata.nivel !== 'NINGUNO' && (
                <span className="bg-[#EFEEFF] text-[#002B6B] text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 shadow-sm">
                  {metadata.nivel}
                </span>
              )}
              {metadata?.especialidad && (
                <span className="bg-[#EFEEFF] text-[#002B6B] text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 shadow-sm">
                  {metadata.especialidad}
                </span>
              )}
              {metadata?.year && (
                <span className="bg-[#D1E9FF] text-[#002B6B] text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 shadow-sm">
                  {metadata.year}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 pb-8">
        {/* Main Content (Left) */}
        <div className="flex-1 flex flex-col gap-6 font-serif leading-relaxed text-gray-800">
          {/* Reading Text / Question Content Section */}
          <div className="bg-white rounded-2xl p-6 md:p-10 shadow-lg border border-gray-100 min-h-[500px] flex flex-col">
            <div className="flex justify-between items-start mb-8 border-b border-gray-50 pb-5">
              <div className="font-sans">
                <h2 className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">
                  Pregunta {currentIndex + 1} de {questions.length}
                </h2>
                <span className="bg-[#002B6B] text-white text-[11px] px-3 py-1.5 rounded-lg font-bold shadow-sm inline-block">
                  {currentQuestion?.clasificacionNombre ||
                    'Pregunta Individual'}
                </span>
              </div>
              <div className="flex gap-2 font-sans">
                {(() => {
                  const name =
                    currentQuestion?.clasificacionNombre?.toLowerCase() || '';
                  let code = '';
                  let classes = '';

                  if (name === 'cl' || name.includes('comprensión')) {
                    code = 'CL';
                    classes = 'bg-pink-50 text-pink-600 border-pink-100';
                  } else if (name === 'rl' || name.includes('razonamiento')) {
                    code = 'RL';
                    classes = 'bg-amber-50 text-amber-600 border-amber-100';
                  } else if (
                    name === 'ccp' ||
                    name.includes('pedagógico') ||
                    name.includes('conocimientos') ||
                    name.includes('curricular')
                  ) {
                    code = 'CCP';
                    classes = 'bg-blue-50 text-blue-600 border-blue-100';
                  }

                  if (!code) return null;

                  return (
                    <span
                      className={`${classes} text-[11px] font-extrabold px-3 py-1.5 rounded-lg border shadow-sm`}
                    >
                      {code}
                    </span>
                  );
                })()}
                {(() => {
                  const isAnyAnswered =
                    respuestas[String(currentIndex)] !== undefined;
                  return (
                    <span
                      className={`${
                        isAnyAnswered
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      } text-[11px] font-extrabold px-3 py-1.5 rounded-lg border shadow-sm`}
                    >
                      {isAnyAnswered ? 'Respondida' : 'Sin responder'}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Reading Text (if sub-question) */}
            {(currentQuestion as any)?.parentEnunciado && (
              <div className="bg-gray-100/50 p-6 md:p-8 rounded-2xl border border-blue-100 mb-8 text-gray-800 font-serif leading-relaxed shadow-sm force-black-text">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-blue-600"></div>
                  Texto de Referencia
                </div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: (currentQuestion as any).parentEnunciado,
                  }}
                  className="text-base md:text-lg"
                />
              </div>
            )}

            <div className="space-y-6 text-justify mb-8 font-serif text-lg leading-relaxed text-black">
              {currentQuestion?.imagen && (
                <div className="mb-6 rounded-xl overflow-hidden border border-gray-100 shadow-md">
                  <img
                    src={currentQuestion.imagen}
                    alt="Imagen de la pregunta"
                    className="w-full h-auto object-contain"
                  />
                </div>
              )}
              {currentQuestion && (
                <div className="force-black-text">
                  {(currentQuestion as any).isSubPregunta && (
                    <span className="bg-blue-600 text-white text-[10px] uppercase font-black px-2.5 py-1 rounded-md mb-4 inline-block shadow-sm">
                      Pregunta {(currentQuestion as any).numeroSubPregunta}
                    </span>
                  )}
                  <div
                    dangerouslySetInnerHTML={{
                      __html: currentQuestion.enunciado,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Alternatives Area */}
            <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 font-sans shadow-inner">
              <div className="space-y-3">
                {currentQuestion &&
                  ['A', 'B', 'C', 'D'].map((opt) => {
                    const optKey = `alternativa${opt}` as keyof PreguntaExamen;
                    const content = currentQuestion[optKey] as string;
                    if (!content) return null;

                    const answerKey = String(currentIndex);
                    const isSelected =
                      respuestas[answerKey]?.alternativa === opt;
                    const isLocked =
                      respuestas[answerKey]?.isCorrect !== undefined;
                    const status = getQuestionStatus(currentIndex);

                    let containerClass =
                      'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50/30';
                    let letterClass =
                      'bg-gray-50 border-gray-300 text-gray-500 group-hover:border-blue-300 group-hover:text-blue-500';

                    if (isSelected) {
                      containerClass =
                        'bg-[#002B6B] border-[#002B6B] text-white shadow-md transform -translate-y-0.5';
                      letterClass = 'bg-white/20 border-white/40 text-white';

                      // Real-time or Final result coloring
                      if (status === 'correct') {
                        containerClass =
                          'bg-green-600 border-green-600 text-white';
                      } else if (status === 'incorrect') {
                        containerClass = 'bg-red-500 border-red-500 text-white';
                      }
                    } else if (isLocked && !isSelected) {
                      // De-emphasize other options ONLY when locked/reviewed
                      containerClass =
                        'bg-gray-50 border-gray-100 text-gray-400 opacity-60';
                      letterClass = 'bg-gray-100 border-gray-200 text-gray-300';
                    }

                    return (
                      <button
                        key={`${currentQuestion.id}-${opt}`}
                        onClick={() => handleSelectOption(opt)}
                        disabled={!!examResult || isLocked}
                        className={`w-full flex items-center gap-4 p-4 border rounded-xl transition-all duration-200 text-left group ${containerClass}`}
                      >
                        <div
                          className={`w-10 h-10 flex items-center justify-center border rounded-lg font-bold text-lg flex-shrink-0 transition-colors ${letterClass}`}
                        >
                          {opt}
                        </div>
                        <span
                          className="font-medium text-base flex-1 alternative-content"
                          dangerouslySetInnerHTML={{ __html: content }}
                        />
                        {/* Icons for results */}
                        {examResult && isSelected && status === 'correct' && (
                          <CheckCircleIcon className="w-6 h-6 text-white" />
                        )}
                      </button>
                    );
                  })}
              </div>

              <div className="mt-8 flex items-center justify-between gap-4">
                <button
                  onClick={() =>
                    setCurrentIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentIndex === 0}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Anterior
                </button>

                {currentIndex === questions.length - 1 ? (
                  <button
                    onClick={handleFinishExam}
                    disabled={isSubmitting || !!examResult}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    {isSubmitting ? 'Calificando...' : 'Finalizar Examen'}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex-1 bg-[#002B6B] hover:bg-blue-900 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Siguiente
                  </button>
                )}
              </div>

              {/* Brand Signature */}
              <div className="flex justify-end mt-6">
                <div className="flex flex-col items-end opacity-70">
                  <span className="font-handwriting text-3xl text-black transform -rotate-2">
                    Juan Avendaño
                  </span>
                  <div className="bg-[#1DA1F2] text-white p-1 rounded-full w-6 h-6 flex items-center justify-center mt-1 shadow-sm">
                    <span className="text-[12px] font-bold">t</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Panel (Right) - Conditionally Rendered */}
        {showQuestionPanel && (
          <div className="w-full lg:w-80 space-y-6 font-sans animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Stats Summary Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-50">
              <h3 className="text-[#002B6B] font-extrabold text-lg border-b border-gray-50 pb-3 mb-6 flex items-center gap-2">
                <TargetIcon className="w-5 h-5 text-red-500" />
                Resumen actual
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-green-50 p-3 rounded-2xl border border-green-100 flex flex-col items-center">
                  <p className="text-2xl font-black text-green-600">
                    {stats.answered}
                  </p>
                  <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">
                    Respondidas
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 flex flex-col items-center">
                  <p className="text-2xl font-black text-gray-500">
                    {stats.unanswered}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Pendientes
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2 px-1">
                    <span className="text-[#4790FD] font-bold">
                      Progreso del examen
                    </span>
                    <span className="text-gray-500 font-bold">
                      {stats.answered}/{stats.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 border border-gray-50 shadow-inner overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-[#002B6B] h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                      style={{ width: `${stats.percentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2">
                  {examResult ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-sm text-[#4790FD] font-medium bg-green-50/50 p-2.5 rounded-xl border border-green-50">
                        <Star className="w-4 h-4 text-green-500" />
                        <span className="font-bold">
                          Puntaje Global: {examResult.puntajeGlobal} pts
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 mt-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">
                          Detalle por Examen
                        </span>
                        {examResult.resultados.map((r) => (
                          <div
                            key={r.examenId}
                            className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-[#4790FD]">
                                Examen #{r.examenId}
                              </span>
                              <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                                {r.puntajeTotal} pts
                              </span>
                            </div>
                            <div className="flex gap-2 text-[10px] text-gray-500">
                              <span className="text-green-600 font-bold">
                                {r.cantidadCorrectas} correctas
                              </span>
                              <span className="text-red-500 font-bold">
                                {r.cantidadIncorrectas} incorrectas
                              </span>
                              <span className="text-orange-500 font-bold">
                                {r.cantidadOmitidas} omitidas
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-[#4790FD] font-medium bg-blue-50/50 p-2.5 rounded-xl border border-blue-50">
                      <ClockIcon className="w-4 h-4 text-primary" />
                      <span>En curso...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Question Panel Grid */}
            <div
              id="question-panel"
              className="bg-white rounded-2xl p-6 shadow-xl border border-cyan-100"
            >
              <div className="flex items-center gap-2 mb-6 text-[#002B6B] font-extrabold text-lg border-b border-gray-50 pb-3">
                <ViewGridIcon className="h-5 w-5 text-blue-500" />
                <h3>Panel de Navegación</h3>
              </div>

              <div className="grid grid-cols-5 gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {questions.map((_, i) => {
                  const status = getQuestionStatus(i);
                  const isAnswered = respuestas[String(i)] !== undefined;

                  let btnClass =
                    'bg-white border-gray-100 text-gray-400 hover:border-gray-300 hover:bg-gray-50';
                  if (currentIndex === i) {
                    btnClass =
                      'bg-[#002B6B] border-[#002B6B] text-white shadow-lg scale-110 z-10';
                  } else if (status === 'correct') {
                    btnClass = 'bg-green-100 border-green-300 text-green-700';
                  } else if (status === 'incorrect') {
                    btnClass = 'bg-red-100 border-red-300 text-red-700';
                  } else if (status === 'omitted') {
                    btnClass =
                      'bg-orange-100 border-orange-300 text-orange-700';
                  } else if (isAnswered) {
                    btnClass =
                      'bg-blue-50 border-blue-200 text-[#002B6B] hover:border-blue-400';
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        reviewCurrentQuestion();
                        setCurrentIndex(i);
                        window.speechSynthesis.cancel();
                        setIsReading(false);
                      }}
                      className={`
                             h-10 w-full rounded-xl flex items-center justify-center text-sm font-black transition-all duration-200 border-2
                             ${btnClass}
                           `}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-5 border-t border-gray-50 flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest justify-center">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 bg-[#002B6B] rounded-sm"></div>
                  <span>Actual</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 bg-blue-50 border border-blue-200 rounded-sm"></div>
                  <span>Hecho</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => removeToast(toast.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d1d1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');
        .font-handwriting {
          font-family: 'Caveat', cursive;
        }
      `}</style>
    </PremiumLayout>
  );
};

export default ExamenPage;
