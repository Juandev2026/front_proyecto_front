import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  AcademicCapIcon, 
  XIcon,
  FilterIcon,
  CalendarIcon
} from '@heroicons/react/outline';

import PremiumLayout from '../layouts/PremiumLayout';
import { useAuth } from '../hooks/useAuth';
import { estructuraAcademicaService } from '../services/estructuraAcademicaService';
import { ExamenLogin } from '../services/authService';
// ----- Types derived from login examenes -----
interface FilterOption { id: number; nombre: string; }

const BancoPreguntasAscensoPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Examenes from login response
  const [loginExamenes, setLoginExamenes] = useState<ExamenLogin[]>([]);

  // Form State
  const [selectedModalidadId, setSelectedModalidadId] = useState<number | ''>('');
  const [selectedNivelId, setSelectedNivelId] = useState<number | ''>('');
  const [selectedEspecialidadId, setSelectedEspecialidadId] = useState<number | ''>('');
  const [anio, setAnio] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Load examenes from localStorage (saved during login)
  useEffect(() => {
    if (isAuthenticated) {
      const stored = localStorage.getItem('loginExamenes');
      if (stored) {
        try {
          const parsed: ExamenLogin[] = JSON.parse(stored);
          // Filter specifically for Ascenso (tipoExamenId: 1)
          const filtered = parsed.filter(e => e.tipoExamenId === 1);
          setLoginExamenes(filtered);
          
          // Set default Modalidad if only one exists or default to EBR (26) if available
          const modalities = Array.from(new Map(parsed.map(e => [e.modalidadId, e.modalidadId])).values());
          if (modalities.length === 1) {
            setSelectedModalidadId(modalities[0] ?? '');
          } else if (modalities.includes(26)) {
             setSelectedModalidadId(26);
          }
        } catch (e) {
          console.error('Error parsing loginExamenes from localStorage:', e);
        }
      }
    }
  }, [isAuthenticated]);

  // ---------- Derived filter options from loginExamenes ----------
  const modalidadesData: FilterOption[] = Array.from(
     new Map(loginExamenes.map(e => [e.modalidadId, { id: e.modalidadId, nombre: e.modalidadNombre }])).values()
  );

  const nivelesData: FilterOption[] = Array.from(
     new Map(
        loginExamenes
           .filter(e => !selectedModalidadId || e.modalidadId === selectedModalidadId)
           .map(e => [e.nivelId, { id: e.nivelId, nombre: e.nivelNombre }])
     ).values()
  );

  const especialidadesData: FilterOption[] = Array.from(
     new Map(
        loginExamenes
           .filter(e =>
              (!selectedModalidadId || e.modalidadId === selectedModalidadId) &&
              (!selectedNivelId || e.nivelId === selectedNivelId)
           )
           .map(e => [e.especialidadId, { id: e.especialidadId, nombre: e.especialidadNombre }])
     ).values()
  );

  const aniosData: string[] = Array.from(
     new Set(
        loginExamenes
           .filter(e =>
              (!selectedModalidadId || e.modalidadId === selectedModalidadId) &&
              (!selectedNivelId || e.nivelId === selectedNivelId) &&
              (!selectedEspecialidadId || e.especialidadId === selectedEspecialidadId)
           )
           .map(e => e.year)
     )
  ).sort((a, b) => Number(b) - Number(a));

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0a192f]"></div>
      </div>
    );
  }

  const handleClear = () => {
    setSelectedModalidadId('');
    setSelectedNivelId('');
    setSelectedEspecialidadId('');
    setAnio('');
  };

  return (
    <PremiumLayout title="Banco de preguntas Ascenso" breadcrumb="Pages / Banco de preguntas Ascenso">
      <Head>
        <title>Banco de Preguntas Ascenso - AVENDOCENTE</title>
      </Head>

      <div className="w-full space-y-6">
        
        {/* Title and subtitle */}
        <div className="text-center py-4">
           <h3 className="text-2xl md:text-3xl font-extrabold text-[#4790FD]">Selecciona tus preferencias</h3>
           <p className="text-[#A3AED0] text-base mt-1 font-medium">Puedes seleccionar el año de su preferencia</p>
        </div>

        {/* Form Container */}
        <div className="space-y-4">
           
           {/* Modalidad Habilitada */}
           <div className="border border-cyan-400 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-[#4790FD] font-bold">
                 <AcademicCapIcon className="h-5 w-5" />
                 <span>Modalidad habilitada</span>
              </div>
              <select 
                value={selectedModalidadId}
                onChange={(e) => {
                    const id = e.target.value === '' ? '' : Number(e.target.value);
                    setSelectedModalidadId(id);
                    setSelectedNivelId('');
                    setSelectedEspecialidadId('');
                }}
                className="w-full max-w-full truncate border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={isLoading}
              >
                 <option value="">Selecciona Modalidad</option>
                 {modalidadesData.map(m => (
                     <option key={m.id} value={m.id}>{m.nombre}</option>
                 ))}
              </select>
           </div>

           {/* Nivel */}
           <div className="border border-cyan-400 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-[#4790FD] font-bold">
                 <FilterIcon className="h-5 w-5" />
                 <span>Nivel</span>
              </div>
              <select 
                value={selectedNivelId}
                onChange={(e) => {
                    const id = e.target.value === '' ? '' : Number(e.target.value);
                    setSelectedNivelId(id);
                    setSelectedEspecialidadId('');
                    setAnio(''); // Clear year when level changes
                }}
                className="w-full max-w-full truncate border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                disabled={!selectedModalidadId}
              >
                 <option value="">Seleccionar nivel</option>
                 {nivelesData.map(n => (
                     <option key={n.id} value={n.id}>{n.nombre}</option>
                 ))}
              </select>
           </div>

           {/* Especialidad */}
           <div className="border border-cyan-400 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-[#4790FD] font-bold">
                 <AcademicCapIcon className="h-5 w-5" />
                 <span>Especialidad</span>
              </div>
              <select 
                value={selectedEspecialidadId}
                onChange={(e) => {
                    const id = e.target.value === '' ? '' : Number(e.target.value);
                    setSelectedEspecialidadId(id);
                    setAnio(''); // Clear year if specialty changes
                }}
                className="w-full max-w-full truncate border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                disabled={!selectedNivelId || especialidadesData.length === 0}
              >
                 <option value="">Selecciona Especialidad</option>
                 {especialidadesData.map(e => (
                     <option key={e.id} value={e.id}>{e.nombre}</option>
                 ))}
              </select>
           </div>

           {/* Año */}
           <div className="border border-cyan-400 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-[#4790FD] font-bold">
                 <CalendarIcon className="h-5 w-5" />
                 <span>Elige un año</span>
              </div>
              <select 
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className="w-full max-w-full truncate border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                disabled={!selectedEspecialidadId || aniosData.length === 0}
              >
                 <option value="">Selecciona Año</option>
                 {aniosData.map(year => (
                     <option key={year} value={year}>{year}</option>
                 ))}
              </select>
           </div>

           {/* Resumen de selección */}
           {anio && (
               <div className="mt-8">
                  <div className="bg-white border border-[#4790FD] rounded-xl p-8 shadow-sm">
                     <div className="flex items-center gap-2 mb-8 text-[#002B6B] font-bold">
                        <AcademicCapIcon className="h-6 w-6 text-[#4790FD]" />
                        <span className="text-xl">Resumen de selección</span>
                     </div>
                     
                     <div className="space-y-6">
                        {selectedModalidadId && (
                           <div className="flex flex-col gap-2">
                              <span className="text-sm font-bold text-[#2B3674]">Modalidad</span>
                              <div className="inline-flex px-4 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-sm font-medium w-fit">
                                 {modalidadesData.find(m => m.id === Number(selectedModalidadId))?.nombre}
                              </div>
                           </div>
                        )}
                        
                        {selectedNivelId && (
                           <div className="flex flex-col gap-2">
                              <span className="text-sm font-bold text-[#2B3674]">Nivel</span>
                              <div className="inline-flex px-4 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-lg text-sm font-medium w-fit">
                                 {nivelesData.find(n => n.id === Number(selectedNivelId))?.nombre}
                              </div>
                           </div>
                        )}
                        
                        {selectedEspecialidadId && (
                           <div className="flex flex-col gap-2">
                              <span className="text-sm font-bold text-[#2B3674]">Especialidad</span>
                              <div className="inline-flex px-4 py-1.5 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg text-sm font-medium w-fit">
                                 {especialidadesData.find(e => e.id === Number(selectedEspecialidadId))?.nombre}
                              </div>
                           </div>
                        )}
                        
                        {anio && (
                           <div className="flex flex-col gap-2">
                              <span className="text-sm font-bold text-[#2B3674]">Año</span>
                              <div className="inline-flex px-4 py-1.5 bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-lg text-sm font-medium w-fit">
                                 {anio}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
           )}

           {/* Buttons */}
           <div className="flex justify-end gap-4 mt-6">
              <button 
                onClick={handleClear}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium bg-white"
              >
                 <XIcon className="h-4 w-4" />
                 Limpiar
              </button>
                <button 
                   onClick={async () => {
                      if (selectedModalidadId && selectedNivelId && anio) {
                        try {
                           setIsLoading(true);
                           
                           // Find exams matching criteria
                           const exams = JSON.parse(localStorage.getItem('loginExamenes') || '[]') as any[];
                           const matchingExams = exams.filter(e => 
                              e.modalidadId === Number(selectedModalidadId) && 
                              e.nivelId === Number(selectedNivelId) && 
                              e.year === anio &&
                              (selectedEspecialidadId ? e.especialidadId === Number(selectedEspecialidadId) : true)
                           );

                           console.log("Debug - Matching Exams:", matchingExams);

                           const clasificacionIds: number[] = [];
                           matchingExams.forEach((exam: any) => {
                              if (exam.clasificaciones) {
                                 exam.clasificaciones.forEach((c: any) => {
                                    if (!clasificacionIds.includes(c.clasificacionId)) {
                                       clasificacionIds.push(c.clasificacionId);
                                    }
                                 });
                              }
                           });

                           console.log("Debug - Final ClasificacionIds:", clasificacionIds);

                           const questions = await estructuraAcademicaService.getPreguntas(
                             Number(selectedModalidadId),
                             Number(selectedNivelId),
                             anio,
                             selectedEspecialidadId ? Number(selectedEspecialidadId) : undefined,
                             clasificacionIds
                           );

                           // Save metadata for badges in examen.tsx
                           const metadata = {
                               modalidad: modalidadesData.find(m => m.id === Number(selectedModalidadId))?.nombre,
                               nivel: nivelesData.find(n => n.id === Number(selectedNivelId))?.nombre,
                               especialidad: especialidadesData.find(e => e.id === Number(selectedEspecialidadId))?.nombre,
                               year: anio
                           };

                           localStorage.setItem('currentQuestions', JSON.stringify(questions));
                           localStorage.setItem('currentExamMetadata', JSON.stringify(metadata));
                           
                           router.push('/examen');
                        } catch (error) {
                           console.error("Error confirming selection:", error);
                        } finally {
                           setIsLoading(false);
                        }
                      }
                   }}
                   disabled={isLoading || !selectedModalidadId || (nivelesData.length > 0 && !selectedNivelId) || (especialidadesData.length > 0 && !selectedEspecialidadId) || (aniosData.length > 0 && !anio)}
                   className="flex items-center gap-2 px-6 py-2 bg-[#4790FD] text-white rounded-md hover:bg-[#357abd] transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {isLoading ? 'Cargando...' : 'Confirmar selección'}
                </button>
           </div>

        </div>
      </div>
    </PremiumLayout>
  );
};

export default BancoPreguntasAscensoPage;
