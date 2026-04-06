import React, { useEffect, useState, useMemo } from "react";

import {
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  ArrowLeftIcon,
  RefreshIcon,
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon,
  ChevronDownIcon,
} from "@heroicons/react/outline";
import Head from "next/head";
import { useRouter } from "next/router";

import { useAuth } from "../../hooks/useAuth";
import PremiumLayout from "../../layouts/PremiumLayout";
import ConfirmModal from "../../components/ConfirmModal";
import { ResultadoExamenResponse, PreguntaExamen } from "../../types/examen";
import HtmlMathRenderer from "../../components/common/HtmlMathRenderer";
import { clasificacionService } from "../../services/clasificacionService";
import { erroneasService } from "../../services/erroneasService";

const processCitation = (html: string) => {
  if (!html) return "";
  return html
    .replace(
      /<p([^>]*)>\s*(Adaptado de|Tomado de|Adaptación|Fuente:)(.*?)<\/p>/gi,
      '<p$1 class="citation-text">$2$3</p>',
    )
    .replace(
      /(?:<br\s*\/?>\s*)*(Adaptado de|Tomado de|Fuente:)(.*?)(?=<\/p>|$)/gi,
      '<div class="citation-text">$1$2</div>',
    );
};

const isImageUrl = (url: string) => {
  if (!url) return false;
  // Soporta extensiones comunes y URLs de S3 que contienen /images/ o extensiones
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".bmp",
    ".jfif",
  ];
  const lowercaseUrl = url.trim().toLowerCase();

  // Verificamos si termina o contiene una extensión de imagen
  const hasExtension = imageExtensions.some((ext) =>
    lowercaseUrl.includes(ext),
  );
  // Verificamos si es una URL de S3 que suele contener imágenes aunque no tenga extensión clásica al final (a veces tienen params)
  const isS3Image =
    (lowercaseUrl.includes("amazonaws.com") || lowercaseUrl.includes("s3.")) &&
    (lowercaseUrl.includes("/images/") ||
      lowercaseUrl.includes("/img/") ||
      hasExtension);
  // Verificamos si la cadena misma EMPIEZA con http y tiene apariencia de imagen
  const isDirectImage = lowercaseUrl.startsWith("http") && hasExtension;

  return hasExtension || isS3Image || isDirectImage;
};

const SustentoCollapse = ({ sustento }: { sustento: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isImage = isImageUrl(sustento);

  return (
    <div className="mt-4 pt-4 border-t border-gray-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[10px] font-black text-[#4790FD] uppercase tracking-widest hover:text-blue-600 transition-all group"
      >
        <div
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <ChevronDownIcon className="w-4 h-4" />
        </div>
        <span>Sustento</span>
        {!isOpen && (
          <span className="text-[9px] lowercase font-medium text-gray-400">
            (clic para ver)
          </span>
        )}
      </button>

      {isOpen && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {isImage || sustento.trim().startsWith("http") ? (
            (() => {
              // Si es una imagen o parece URL, intentamos extraerla.
              // Usamos una regex más permisiva que capture espacios si están en medio de una URL (común en S3 mal formateado)
              // Pero lo ideal es capturar todo si la cadena empieza por http
              let imageUrl = sustento.trim();
              if (!imageUrl.startsWith("http")) {
                const match = sustento.match(/https?:\/\/[^\s]+/);
                imageUrl = match ? match[0] : sustento.trim();
              }

              // Si es imagen, la mostramos. Si tiene espacios, los codificamos para el src
              if (isImage) {
                // Codificamos solo los espacios si la URL los tiene sueltos
                const encodedUrl = imageUrl.replace(/ /g, "%20");
                return (
                  <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-md max-w-3xl bg-gray-50 p-1">
                    <img
                      src={encodedUrl}
                      alt="Sustento"
                      className="w-full h-auto object-contain max-h-[500px]"
                      onError={(e) => {
                        // Si falla la carga, mostramos el texto como fallback
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement("div");
                          fallback.className =
                            "text-sm text-red-500 italic p-2";
                          fallback.innerText =
                            "Error al cargar la imagen de sustento.";
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                );
              }
              return (
                <div
                  className="text-sm text-gray-600 italic leading-relaxed bg-blue-50/30 p-4 rounded-xl border border-blue-50"
                  dangerouslySetInnerHTML={{ __html: sustento }}
                />
              );
            })()
          ) : (
            <div
              className="text-sm text-gray-600 italic leading-relaxed bg-blue-50/30 p-4 rounded-xl border border-blue-50"
              dangerouslySetInnerHTML={{ __html: sustento }}
            />
          )}
        </div>
      )}
    </div>
  );
};

const ResultadoPage = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  const [questions, setQuestions] = useState<PreguntaExamen[]>([]);
  const [examResult, setExamResult] = useState<ResultadoExamenResponse | null>(
    null,
  );
  const [respuestas, setRespuestas] = useState<Record<string, any>>({});
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [examMetadata, setExamMetadata] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isNewExamModalOpen, setIsNewExamModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      let cmap = new Map<
        number,
        { nombre: string; abreviatura: string; puntos: number }
      >();
      try {
        const classData = await clasificacionService.getAll();
        cmap = new Map(
          classData.map((c) => [
            c.id,
            {
              nombre: c.clasificacionNombre,
              abreviatura: c.abreviatura || "",
              puntos: c.puntos || 0,
            },
          ]),
        );
      } catch (err) {
        console.error("Error fetching classifications", err);
      }

      const savedQuestions = localStorage.getItem("currentQuestions");
      const savedResult = localStorage.getItem("lastExamResult");
      const savedRespuestas = localStorage.getItem("lastRespuestas");
      const savedTime = localStorage.getItem("lastExamTime");
      const savedMetadata = localStorage.getItem("currentExamMetadata");

      if (savedMetadata) setExamMetadata(JSON.parse(savedMetadata));
      if (savedQuestions) {
        const rawQuestions = JSON.parse(savedQuestions);
        const flattened: PreguntaExamen[] = [];

        rawQuestions.forEach((q: any) => {
          if (q.subPreguntas && q.subPreguntas.length > 0) {
            q.subPreguntas.forEach((sub: any, subIdx: number) => {
              const classId = sub.clasificacionId || q.clasificacionId;
              const cmapData = classId ? cmap.get(classId) : null;
              const rawName =
                sub.clasificacionNombre || q.clasificacionNombre || "";
              const finalName = cmapData?.abreviatura || rawName;

              let pointValue = cmapData?.puntos || sub.puntos || q.puntos;

              const mappedIdA = sub.idAlternativaA ?? sub.alternativas?.[0]?.id;
              const mappedIdB = sub.idAlternativaB ?? sub.alternativas?.[1]?.id;
              const mappedIdC = sub.idAlternativaC ?? sub.alternativas?.[2]?.id;
              const mappedIdD = sub.idAlternativaD ?? sub.alternativas?.[3]?.id;

              flattened.push({
                ...q,
                id: sub.id || sub.subPreguntaId || q.id || q.preguntaId,
                preguntaId: q.preguntaId || q.id || q.preguntaId,
                enunciado: sub.enunciado || "",
                parentEnunciado: q.enunciado || "",
                parentImagen: q.imagen || "",
                imagen: sub.imagen || q.imagen || "",
                alternativaA:
                  sub.alternativaA || sub.alternativas?.[0]?.contenido || "",
                alternativaB:
                  sub.alternativaB || sub.alternativas?.[1]?.contenido || "",
                alternativaC:
                  sub.alternativaC || sub.alternativas?.[2]?.contenido || "",
                alternativaD:
                  sub.alternativaD || sub.alternativas?.[3]?.contenido || "",
                idAlternativaA: mappedIdA,
                idAlternativaB: mappedIdB,
                idAlternativaC: mappedIdC,
                idAlternativaD: mappedIdD,
                puntos: pointValue || sub.puntaje || q.puntaje,
                tiempoPregunta: sub.tiempoPregunta ?? q.tiempoPregunta,
                numeroSubPregunta:
                  sub.numero ||
                  sub.subPreguntaNumero ||
                  sub.orden ||
                  subIdx + 1,
                respuesta: (() => {
                  const res = sub.respuestaCorrecta || sub.respuesta || "";
                  if (typeof res === "number") {
                    if (res === mappedIdA) return "A";
                    if (res === mappedIdB) return "B";
                    if (res === mappedIdC) return "C";
                    if (res === mappedIdD) return "D";
                  }
                  return res;
                })(),
                clasificacionId: classId,
                clasificacionNombre: finalName,
                isSubPregunta: true,
                subPreguntas: [],
                examenId: sub.examenId || q.examenId || 0,
                year: sub.year || q.year || 0,
              });
            });
          } else {
            const classId = q.clasificacionId;
            const cmapData = classId ? cmap.get(classId) : null;
            const rawName = q.clasificacionNombre || "";
            const finalName = cmapData?.abreviatura || rawName;

            let pointValue = cmapData?.puntos || q.puntos;

            const mappedIdA = q.idAlternativaA ?? q.alternativas?.[0]?.id;
            const mappedIdB = q.idAlternativaB ?? q.alternativas?.[1]?.id;
            const mappedIdC = q.idAlternativaC ?? q.alternativas?.[2]?.id;
            const mappedIdD = q.idAlternativaD ?? q.alternativas?.[3]?.id;

            flattened.push({
              ...q,
              id: q.id || q.preguntaId,
              preguntaId: q.preguntaId || q.id,
              alternativaA:
                q.alternativaA || q.alternativas?.[0]?.contenido || "",
              alternativaB:
                q.alternativaB || q.alternativas?.[1]?.contenido || "",
              alternativaC:
                q.alternativaC || q.alternativas?.[2]?.contenido || "",
              alternativaD:
                q.alternativaD || q.alternativas?.[3]?.contenido || "",
              idAlternativaA: mappedIdA,
              idAlternativaB: mappedIdB,
              idAlternativaC: mappedIdC,
              idAlternativaD: mappedIdD,
              clasificacionNombre: finalName,
              puntos: pointValue || q.puntaje,
              respuesta: (() => {
                const res = q.respuestaCorrecta || q.respuesta || "";
                if (typeof res === "number") {
                  if (res === mappedIdA) return "A";
                  if (res === mappedIdB) return "B";
                  if (res === mappedIdC) return "C";
                  if (res === mappedIdD) return "D";
                }
                return res;
              })(),
              isSubPregunta: false,
              parentImagen: "",
              examenId: q.examenId || 0,
              year: q.year || 0,
            });
          }
        });
        setQuestions(flattened);
      }

      if (savedResult) setExamResult(JSON.parse(savedResult));
      if (savedRespuestas) setRespuestas(JSON.parse(savedRespuestas));
      if (savedTime) setTimeTaken(parseInt(savedTime, 10));
    };

    loadData();
  }, [loading, isAuthenticated, router]);

  const getQuestionResult = (
    q: PreguntaExamen,
    _index: number,
  ): "correct" | "incorrect" | "omitted" => {
    const userAnswer = respuestas[String(_index)]?.alternativa;

    // Si el usuario no respondió, es omitida
    if (!userAnswer) return "omitted";

    // Si no hay resultado del backend, calificar localmente
    if (!examResult) {
      const isCorrect = userAnswer.toUpperCase() === q.respuesta?.toUpperCase();
      return isCorrect ? "correct" : "incorrect";
    }

    const backendKey = Number(q.id);

    // Buscamos en todos los bloques de resultados (por clasificación)
    const matchedResult = examResult.resultados.find((r: any) => {
      return (
        r.idsCorrectas.some((id: any) => Number(id) === backendKey) ||
        r.idsIncorrectas.some((id: any) => Number(id) === backendKey) ||
        r.idsOmitidas.some((id: any) => Number(id) === backendKey)
      );
    });

    if (matchedResult) {
      if (
        matchedResult.idsCorrectas.some((id: any) => Number(id) === backendKey)
      ) {
        return "correct";
      }
      if (
        matchedResult.idsIncorrectas.some(
          (id: any) => Number(id) === backendKey,
        )
      ) {
        return "incorrect";
      }
      if (
        matchedResult.idsOmitidas.some((id: any) => Number(id) === backendKey)
      ) {
        return "omitted";
      }
    }

    // Fallback: Si el backend no la encontró (común en examenes mezclados), calificar localmente
    const isCorrect = userAnswer.toUpperCase() === q.respuesta?.toUpperCase();
    return isCorrect ? "correct" : "incorrect";
  };

  const stats = useMemo(() => {
    const total = questions.length;
    if (total === 0) return null;

    // --- RECALCULAR ESTADÍSTICAS MANUALMENTE (Para mayor precisión en lotes mixtos) ---
    let correctas = 0;
    let incorrectas = 0;
    let omitidas = 0;
    let manualScore = 0;

    questions.forEach((q, idx) => {
      const res = getQuestionResult(q, idx);
      if (res === "correct") {
        correctas++;
        manualScore += Number(q.puntos) || 0;
      } else if (res === "incorrect") {
        incorrectas++;
      } else {
        omitidas++;
      }
    });

    const answered = correctas + incorrectas;
    const maxScore = questions.reduce(
      (acc, q) => acc + (Number(q.puntos) || 0),
      0,
    );

    // 2. Cálculo por Clasificación (Manual para el desglose)
    const classificationStats: Record<
      string,
      { points: number; correct: number; total: number; earnedPoints: number }
    > = {};

    questions.forEach((q) => {
      const className = q.clasificacionNombre || "";
      if (!classificationStats[className]) {
        classificationStats[className] = {
          points: 0,
          earnedPoints: 0,
          correct: 0,
          total: 0,
        };
      }
      classificationStats[className].total += 1;
      classificationStats[className].points += Number(q.puntos) || 0;

      const backendKey = Number(q.id);
      const userAnswer = respuestas[String(q.preguntaId || q.id)]?.alternativa;

      let isCorrect = false;

      if (examResult) {
        isCorrect = examResult.resultados.some((r: any) =>
          r.idsCorrectas.some((id: any) => Number(id) === backendKey),
        );
      }

      // Fallback: comparar localmente si el backend no matcheó
      if (!isCorrect && userAnswer && q.respuesta) {
        isCorrect = userAnswer.toUpperCase() === q.respuesta.toUpperCase();
      }

      if (isCorrect) {
        classificationStats[className].correct += 1;
        classificationStats[className].earnedPoints += Number(q.puntos) || 0;
      }
    });

    return {
      correctas,
      incorrectas,
      omitidas,
      total,
      answered,
      score: manualScore || examResult?.puntajeGlobal || 0,
      maxScore: maxScore || 200,
      classStats: Object.entries(classificationStats)
        .map(([name, data]) => ({
          name,
          ...data,
        }))
        .filter(
          (c) =>
            c.name &&
            c.name.toUpperCase() !== "OTROS" &&
            c.name.toUpperCase() !== "OTRO",
        )
        .sort((a, b) => {
          const order = ["CL", "RL", "CCP"];
          const idxA = order.indexOf(a.name);
          const idxB = order.indexOf(b.name);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.name.localeCompare(b.name);
        }),
    };
  }, [examResult, questions, respuestas]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMarkAsReviewed = async (preguntaId: number) => {
    if (!user?.id) return;
    try {
      if (
        !window.confirm(
          "¿Estás seguro de marcar esta pregunta como revisada? Ya no aparecerá en tu lista de errores.",
        )
      )
        return;
      await erroneasService.marcarRevisada(user.id, preguntaId);
      alert("Pregunta marcada como revisada exitosamente.");
    } catch (error) {
      console.error("Error marking as reviewed:", error);
      alert("Error al marcar como revisada");
    }
  };

  if (!isMounted || loading || !isAuthenticated || !examResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4790FD]"></div>
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

      <div className="w-full px-0 space-y-8 pb-20">
        {/* Header Title */}
        <div className="bg-[#4790FD] text-white p-4 rounded-xl shadow-lg border-b-4 border-blue-300 flex justify-center items-center">
          <h1 className="text-xl font-black uppercase tracking-widest">
            Resultados del examen
          </h1>
        </div>

        {/* Top Summary Cards */}
        {/* Summary Area */}
        <div className="space-y-6">
          {/* Main Score Card (Full Width) */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center">
            <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-tighter self-start mb-6">
              <ChartBarIcon className="w-4 h-4" />
              Resumen del examen
            </div>

            <div className="text-center">
              <p className="text-4xl font-black text-gray-800">
                {stats?.score}{" "}
                <span className="text-lg text-gray-400 font-medium">
                  / {stats?.maxScore} pts
                </span>
              </p>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Tu promedio de aciertos es de{" "}
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
              <div className="flex flex-col items-center text-[#4790FD]">
                <span className="text-2xl font-black">{stats?.total}</span>
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  Total
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Actions Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-4">
                <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-tighter mb-4">
                  <AcademicCapIcon className="w-4 h-4" />
                  Acciones
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setIsNewExamModalOpen(true)}
                    className="w-full py-3 border border-blue-100 rounded-xl text-[#4790FD] text-xs font-black shadow-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshIcon className="w-3 h-3" />
                    Dar nuevo examen
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="w-full py-3 border border-blue-100 rounded-xl text-[#4790FD] text-xs font-black shadow-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeftIcon className="w-3 h-3" />
                    Volver al inicio
                  </button>
                </div>
              </div>

              {/* Información del examen */}
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
                      <p className="text-2xl font-black text-[#4790FD]">
                        {c.name === "CCP" ? "3.0" : "2.0"}
                      </p>
                      <p className="text-sm text-gray-500 font-black uppercase tracking-widest">
                        {c.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Banco de Errores Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-blue-50 p-10 flex flex-col md:flex-row items-center gap-8 justify-between">
                <div className="flex-1 text-center md:text-left space-y-4">
                  <div className="flex flex-col items-center md:items-start gap-2">
                    <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center mb-2">
                      <span className="text-yellow-500 font-black">!</span>
                    </div>
                    <h4 className="text-lg font-black text-gray-800">
                      ¿Te equivocaste en algunas preguntas?
                    </h4>
                    <p className="text-sm text-gray-500">
                      Revisa tu módulo de{" "}
                      <span className="font-bold text-blue-600">
                        &quot;Respuestas Erróneas&quot;
                      </span>{" "}
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
                <button
                  onClick={() =>
                    router.push(
                      examMetadata?.tipoExamenId === 1
                        ? "/avendescala/respuestasErroneasAscenso"
                        : "/avendescala/respuestasErroneas",
                    )
                  }
                  className="bg-[#4790FD] text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:scale-105 transition-all text-sm whitespace-nowrap"
                >
                  Ver Respuestas Erróneas
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Percentajes Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6 h-fit">
                <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-tighter mb-2">
                  <ChartBarIcon className="w-4 h-4" />% Porcentajes del examen
                </div>

                <div className="space-y-4">
                  {[
                    {
                      label: "Correctas",
                      count: stats?.correctas,
                      color: "bg-green-500",
                    },
                    {
                      label: "Incorrectas",
                      count: stats?.incorrectas,
                      color: "bg-red-500",
                    },
                    {
                      label: "Sin responder",
                      count: stats?.omitidas,
                      color: "bg-gray-400",
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

              {/* Composición de la Prueba Nacional Card (Moved here) */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-4">
                <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-tighter mb-4">
                  <AcademicCapIcon className="w-4 h-4" />
                  Composición de la Prueba Nacional
                </div>
                <div className="w-full bg-white rounded-xl overflow-hidden border border-gray-50">
                  <img
                    src={
                      examMetadata?.tipoExamenId === 3
                        ? "/assets/images/directivos.jpeg"
                        : examMetadata?.tipoExamenId === 2
                          ? "/assets/images/resultados_ascenso.png"
                          : "/assets/images/Puntaje_minimo.png"
                    }
                    alt="Puntajes mínimos"
                    className="w-full h-auto object-contain"
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-medium text-center italic">
                  Composición de la Prueba Nacional
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- REVIEW SECTION --- */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden mt-12">
          <div className="bg-gradient-to-r from-[#4790FD]/10 to-transparent p-6 border-b border-gray-100 flex flex-col items-center gap-4">
            <h2 className="text-2xl font-black text-[#4790FD] uppercase tracking-[0.2em]">
              Revisión de Respuestas
            </h2>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-[10px] text-gray-400 font-black uppercase mr-2 self-center">
                Detalles de selección:
              </span>
              {examMetadata && (
                <>
                  <span className="bg-blue-600 text-white text-[9px] px-3 py-1 rounded-full font-bold shadow-sm">
                    {examMetadata.modalidad || "Examen"}
                  </span>
                  {examMetadata.nivel && examMetadata.nivel !== "NINGUNO" && (
                    <span className="bg-green-400 text-white text-[9px] px-3 py-1 rounded-full font-bold shadow-sm">
                      {examMetadata.nivel}
                    </span>
                  )}
                  {examMetadata.especialidad && (
                    <span className="bg-pink-400 text-white text-[9px] px-3 py-1 rounded-full font-bold shadow-sm">
                      {examMetadata.especialidad}
                    </span>
                  )}
                  <span className="bg-cyan-600 text-white text-[9px] px-3 py-1 rounded-full font-bold shadow-sm">
                    {examMetadata.year === "0"
                      ? "Año Único"
                      : examMetadata.year}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="p-2 md:p-4 space-y-12">
            {questions.map((q, idx) => {
              const result = getQuestionResult(q, idx);
              const userAnswer = respuestas[String(idx)]?.alternativa;
              const isCorrect = result === "correct";

              // Only show parent enunciado if it's different from the previous one
              const showParent =
                q.parentEnunciado &&
                (idx === 0 || questions[idx - 1]?.preguntaId !== q.preguntaId);

              const getStatusLabel = () => {
                if (isCorrect) return "Correcta";
                if (result === "omitted") return "Omitida";
                return "Incorrecta";
              };

              const getStatusClasses = () => {
                if (isCorrect)
                  return "bg-green-50 text-green-600 border-green-100";
                if (result === "omitted")
                  return "bg-orange-50 text-orange-600 border-orange-100";
                return "bg-red-50 text-red-600 border-red-100";
              };

              const getStatusIcon = () => {
                if (isCorrect) return <CheckCircleIcon className="w-3 h-3" />;
                if (result === "omitted")
                  return <MinusCircleIcon className="w-3 h-3" />;
                return <XCircleIcon className="w-3 h-3" />;
              };

              return (
                <div key={idx} className="space-y-0">
                  {/* Parent text section if available and first of its group */}
                  {showParent && (
                    <div className="bg-gray-50 border-y md:border border-blue-100 p-4 md:p-6 rounded-none md:rounded-t-3xl relative mb-0">
                      <div className="absolute top-0 left-8 -translate-y-1/2 bg-gray-400 text-white text-[9px] font-black px-4 py-1 rounded-md uppercase tracking-widest shadow-sm">
                        Texto de Referencia
                      </div>
                      <HtmlMathRenderer
                        className="text-gray-800 text-lg md:text-xl leading-relaxed italic border-l-4 border-[#4790FD] pl-6 py-2 bg-blue-50/10 rounded-r-xl"
                        html={processCitation(q.parentEnunciado || "")}
                      />
                    </div>
                  )}

                  {/* Question Block */}
                  <div
                    className={`bg-white border-y md:border border-gray-100 p-3 md:p-6 space-y-8 ${
                      showParent
                        ? "rounded-none md:rounded-b-3xl border-t-0"
                        : "rounded-none md:rounded-3xl"
                    } mb-8 shadow-sm`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-blue-50 text-[#4790FD] flex items-center justify-center font-bold text-sm shadow-inner">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                          {(q as any).isSubPregunta
                            ? `Sub pregunta ${
                                (q as any).numeroSubPregunta || ""
                              }`
                            : "Pregunta Individual"}
                        </span>
                      </div>
                      <div className="flex flex-wrap md:flex-nowrap gap-2 flex-shrink-0">
                        {q.clasificacionNombre && (
                          <span className="bg-pink-50 text-pink-500 text-[10px] font-black px-3 py-1.5 rounded-lg border border-pink-100 shadow-sm uppercase whitespace-nowrap">
                            {q.clasificacionNombre}
                          </span>
                        )}
                        <span
                          className={`${getStatusClasses()} text-[10px] font-black px-3 py-1.5 rounded-lg border shadow-sm uppercase flex items-center gap-1 whitespace-nowrap`}
                        >
                          {getStatusIcon()}
                          {getStatusLabel()}
                        </span>
                        <button
                          onClick={() =>
                            handleMarkAsReviewed(q.preguntaId || q.id)
                          }
                          className="bg-blue-50 hover:bg-blue-100 text-[#4790FD] text-[10px] font-black px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm uppercase transition-colors whitespace-nowrap"
                        >
                          Revisado
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Imagen de la pregunta */}
                      {(() => {
                        const showImage =
                          q.imagen &&
                          (!q.isSubPregunta ||
                            q.imagen !== q.parentImagen ||
                            idx === 0 ||
                            questions[idx - 1]?.preguntaId !== q.preguntaId);

                        if (!showImage) return null;

                        return (
                          <div className="mb-6 rounded-2xl overflow-hidden border border-gray-100 shadow-md bg-white">
                            <img
                              src={q.imagen}
                              alt="Imagen de la pregunta"
                              className="w-full h-auto object-contain max-h-[400px]"
                            />
                          </div>
                        );
                      })()}

                      <HtmlMathRenderer
                        className="text-gray-800 text-lg md:text-xl leading-relaxed"
                        html={processCitation(q.enunciado || "")}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {["A", "B", "C", "D"].map((opt) => {
                          const optContent = (q as any)[`alternativa${opt}`];
                          if (!optContent) return null;

                          const isSelected = userAnswer === opt;
                          const isAnswerCorrect = q.respuesta === opt;

                          let borderColor = "border-gray-100";
                          let bgColor = "bg-white";
                          let textColor = "text-gray-700";

                          if (isAnswerCorrect) {
                            borderColor = "border-green-300";
                            bgColor = "bg-green-50/50";
                            textColor = "text-green-800";
                          } else if (isSelected && !isAnswerCorrect) {
                            borderColor = "border-red-300";
                            bgColor = "bg-red-50/50";
                            textColor = "text-red-800";
                          }

                          return (
                            <div
                              key={opt}
                              className={`p-4 border-2 rounded-xl flex items-center gap-4 transition-all ${borderColor} ${bgColor} ${textColor}`}
                            >
                              <div
                                className={`w-8 h-8 flex-shrink-0 border-2 rounded-lg flex items-center justify-center font-bold ${
                                  isAnswerCorrect
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-gray-200 text-gray-400"
                                }`}
                              >
                                {opt}
                              </div>
                              <HtmlMathRenderer
                                className="text-sm md:text-base font-medium"
                                html={optContent}
                                alternativeLabel={opt}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Sustento */}
                      {q.sustento ? (
                        <SustentoCollapse sustento={q.sustento} />
                      ) : (
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

        {/* Final Branding / Logo */}
        <div className="flex justify-center pt-8 pb-12">
          <img
            src="/assets/images/escala_2.png"
            alt="Escala"
            className="h-14 w-auto object-contain opacity-80"
          />
        </div>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap");
        .font-handwriting {
          font-family: "Caveat", cursive;
        }
        .font-serif {
          font-family: "Georgia", serif;
        }
      `}</style>
      <ConfirmModal
        isOpen={isNewExamModalOpen}
        onClose={() => setIsNewExamModalOpen(false)}
        onConfirm={() => {
          setIsNewExamModalOpen(false);
          router.push("/examen");
        }}
        title="Dar nuevo examen"
        message="¿Estás seguro de que deseas iniciar un nuevo examen? Esto te llevará de vuelta a la página de examen."
        confirmText="Sí, iniciar"
        cancelText="Cancelar"
        type="warning"
      />
    </PremiumLayout>
  );
};

export default ResultadoPage;
