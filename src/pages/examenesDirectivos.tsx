import React, { useEffect, useState, useMemo } from 'react';

import {
  AcademicCapIcon,
  XIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
} from '@heroicons/react/outline';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuth } from '../hooks/useAuth';
import PremiumLayout from '../layouts/PremiumLayout';
import { ExamenLogin } from '../services/authService';
import { estructuraAcademicaService } from '../services/estructuraAcademicaService';

const ExamenesDirectivosPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [loginExamenes, setLoginExamenes] = useState<ExamenLogin[]>([]);
  const [openAccordions, setOpenAccordions] = useState<Record<number, boolean>>(
    {}
  );
  
  // Secciones seleccionadas: examId -> [clasificacionIds]
  const [selections, setSelections] = useState<Record<number, number[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
    if (isAuthenticated) {
      const stored = localStorage.getItem('loginExamenes');
      if (stored) {
        setLoginExamenes(JSON.parse(stored));
      }
    }
  }, [isAuthenticated, loading, router]);

  const directivosExams = useMemo(
    () => loginExamenes.filter((e) => String(e.tipoExamenId) === '3'),
    [loginExamenes]
  );

  const groupedByModalidad = useMemo(() => {
    const groups: Record<number, { nombre: string; exams: ExamenLogin[] }> = {};
    directivosExams.forEach((e) => {
      if (!groups[e.modalidadId]) {
        groups[e.modalidadId] = { nombre: e.modalidadNombre, exams: [] };
      }
      groups[e.modalidadId]!.exams.push(e);
    });
    return groups;
  }, [directivosExams]);

  const handleToggleClass = (examId: number, classId: number) => {
    setSelections(prev => {
      const currentClasses = prev[examId] || [];
      const isSelected = currentClasses.includes(classId);
      
      const newClasses = isSelected
        ? currentClasses.filter(id => id !== classId)
        : [...currentClasses, classId];
      
      const newSelections = { ...prev };
      if (newClasses.length > 0) {
        newSelections[examId] = newClasses;
      } else {
        delete newSelections[examId];
      }
      return newSelections;
    });
  };

  const handleConfirm = async () => {
    const examIds = Object.keys(selections).map(Number);
    if (examIds.length === 0) return;

    setIsLoading(true);
    try {
      let allQuestions: any[] = [];
      const metadataList: any[] = [];

      for (const examId of examIds) {
        const exam = directivosExams.find(e => e.id === examId);
        if (!exam) continue;

        const payload = {
          tipoExamenId: exam.tipoExamenId,
          fuenteId: exam.fuenteId || 0,
          modalidadId: exam.modalidadId,
          nivelId: exam.nivelId,
          especialidadId: exam.especialidadId || 0,
          year: exam.year || '0',
          clasificaciones: selections[examId],
        };

        const questions = await estructuraAcademicaService.getPreguntasByFilter(
          payload
        );
        allQuestions = [...allQuestions, ...questions];

        metadataList.push({
          modalidad: exam.modalidadNombre,
          nivel: exam.nivelNombre || 'DIRECTIVO',
          year: exam.year === '0' || !exam.year ? 'Único' : String(exam.year),
        });
      }

      // Si hay más de un examen, simplificamos el metadata
      const firstMetadata = metadataList[0];
      const metadata = metadataList.length > 1 ? {
        modalidad: "Varios Exámenes",
        nivel: "Múltiple",
        year: "Varios"
      } : firstMetadata;

      localStorage.setItem('currentQuestions', JSON.stringify(allQuestions));
      localStorage.setItem('currentExamMetadata', JSON.stringify(metadata));

      router.push('/examen');
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Hubo un error al cargar las preguntas.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalSelectedCategories = Object.values(selections).reduce((acc, val) => acc + val.length, 0);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PremiumLayout
      title="Exámenes MINEDU y Simulacros"
      breadcrumb="Pages / Directivos"
    >
      <Head>
        <title>Directivos - AVENDOCENTE</title>
      </Head>

      <div className="w-full space-y-6 px-4 md:px-6">
        {/* Banner Header */}
        <div className="bg-[#4790FD] rounded-lg p-6 text-center shadow-lg border border-blue-200">
          <h2 className="text-white text-2xl md:text-3xl font-bold tracking-tight">
            Banco de preguntas MINEDU
          </h2>
          <h3 className="text-white text-lg font-medium opacity-80 mt-1">
            Directivos Docente
          </h3>
        </div>

        <div className="text-center py-2">
          <h4 className="text-xl font-bold text-[#4790FD]">
            Selecciona tus preferencias
          </h4>
          <p className="text-[#A3AED0] text-sm">
            Selecciona el/los exámenes que deseas resolver ahora
          </p>
        </div>

        {/* Accordions List */}
        <div className="space-y-3">
          {Object.entries(groupedByModalidad).map(([id, group]) => (
            <div
              key={id}
              className="border border-[#4790FD]/20 rounded-xl bg-white overflow-hidden shadow-sm transition-all duration-200"
            >
              <button
                onClick={() =>
                  setOpenAccordions((prev) => ({
                    ...prev,
                    [Number(id)]: !prev[Number(id)],
                  }))
                }
                className="w-full flex items-center justify-between p-4 px-6 hover:bg-blue-50/50 transition-all font-bold text-[#4790FD]"
              >
                <div className="flex items-center gap-3">
                  <FolderIcon className="h-6 w-6 text-[#4790FD]" />
                  <span className="text-lg">
                    {group.nombre}
                  </span>
                </div>
                {openAccordions[Number(id)] ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {openAccordions[Number(id)] && (
                <div className="p-6 bg-[#F8FAFF] border-t border-blue-50 space-y-6">
                  {group.exams.map((exam) => (
                    <div key={exam.id} className="space-y-4">
                      {/* Exam Header within Accordion */}
                      <div className="flex items-center gap-2 text-[#4790FD] font-bold">
                        <div className="p-1 px-1.5 bg-blue-100 rounded-full">
                          <AcademicCapIcon className="h-4 w-4" />
                        </div>
                        <span className="text-sm md:text-base">
                          {exam.nivelNombre}
                        </span>
                        <span className="text-xs text-gray-400 font-normal ml-3">
                          Total de preguntas: {exam.cantidadPreguntas}
                        </span>
                      </div>

                      {/* Classifications cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {exam.clasificaciones?.map((c) => {
                          const isSelected = selections[exam.id]?.includes(c.clasificacionId);

                          // Logic for classification names
                          let displayName = c.clasificacionNombre;
                          if (c.clasificacionNombre === 'CL')
                            displayName = 'Comprensión Lectora';
                          if (c.clasificacionNombre === 'CG')
                            displayName =
                              'Conocimientos de Gestión Educativa y Gestión Pública';

                          return (
                            <div
                              key={c.clasificacionId}
                              onClick={() =>
                                handleToggleClass(exam.id, c.clasificacionId)
                              }
                              className={`
                                flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200
                                ${
                                  isSelected
                                    ? 'border-[#4790FD] bg-[#EEF5FF] shadow-md ring-1 ring-[#4790FD]'
                                    : 'border-white bg-white hover:border-blue-100 shadow-sm'
                                }
                              `}
                            >
                              <div
                                className={`
                                  h-5 w-5 rounded border-2 flex items-center justify-center transition-colors
                                  ${
                                    isSelected
                                      ? 'bg-[#4790FD] border-[#4790FD]'
                                      : 'bg-white border-gray-300'
                                  }
                                `}
                              >
                                {isSelected && (
                                  <CheckIcon className="h-3.5 w-3.5 text-white stroke-[3px]" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-[#4790FD] text-sm md:text-base leading-tight">
                                  {displayName}
                                </span>
                                <span className="text-xs md:text-sm text-[#05CD99] font-semibold mt-1">
                                  {c.cantidadPreguntas} preguntas
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Resumen de selección */}
        <div className="border border-blue-100 rounded-2xl p-6 bg-white shadow-sm transition-all">
          <div className="flex items-center gap-2 mb-4 text-[#4790FD] font-bold">
            <AcademicCapIcon className="h-6 w-6" />
            <span className="text-lg">Resumen de selección</span>
          </div>

          {totalSelectedCategories > 0 ? (
            <div className="space-y-6">
              {Object.entries(selections).map(([examId, classIds]) => {
                const exam = directivosExams.find(e => e.id === Number(examId));
                if (!exam) return null;
                
                return (
                  <div key={examId} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-col gap-1.5 mb-2">
                      <span className="text-[11px] font-bold text-gray-400 subtitle uppercase tracking-wider">
                        {exam.modalidadNombre} - {exam.nivelNombre}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {classIds.map((id) => {
                        const c = exam.clasificaciones?.find(
                          (item) => item.clasificacionId === id
                        );
                        return (
                          <span
                            key={id}
                            className="px-4 py-1.5 bg-green-50 text-[#05CD99] border border-green-100 rounded-xl text-sm font-bold shadow-sm"
                          >
                            {c?.clasificacionNombre}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 py-2 text-gray-400 italic">
              <span className="text-sm">No has seleccionado ninguna opción aún.</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pb-12 pt-4">
          <button
            onClick={() => {
              setSelections({});
            }}
            className="px-8 py-3 border border-gray-200 rounded-xl text-[#A3AED0] font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all text-sm"
          >
            <XIcon className="h-5 w-5" />
            Limpiar Selección
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              isLoading || totalSelectedCategories === 0
            }
            className={`
              px-12 py-3 rounded-xl font-bold shadow-lg transition-all text-sm
              ${
                totalSelectedCategories === 0 || isLoading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#4790FD] text-white hover:bg-blue-600 hover:scale-[1.02] active:scale-95 shadow-blue-200'
              }
            `}
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Confirmar selección'
            )}
          </button>
        </div>
      </div>
    </PremiumLayout>
  );
};

export default ExamenesDirectivosPage;
