import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  AcademicCapIcon, 
  XIcon,
  FilterIcon
} from '@heroicons/react/outline';

import PremiumLayout from '../layouts/PremiumLayout';
import { useAuth } from '../hooks/useAuth';
import { estructuraAcademicaService, Modalidad } from '../services/estructuraAcademicaService';

const SimulacroExamenAscensoPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Form State
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [selectedModalidadId, setSelectedModalidadId] = useState<number | ''>(26); // default EBR
  const [selectedNivelId, setSelectedNivelId] = useState<number | ''>('');
  const [selectedEspecialidadId, setSelectedEspecialidadId] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Year Checkbox State
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  const handleConfirm = async () => {
    if (selectedModalidadId && selectedNivelId && selectedYearsList.length >= 2) {
      try {
        setIsLoading(true);
        const allQuestions: any[] = [];
        
        for (const year of selectedYearsList) {
          const questions = await estructuraAcademicaService.getPreguntas(
            Number(selectedModalidadId),
            Number(selectedNivelId),
            year
          );
          allQuestions.push(...questions);
        }
        
        console.log("Total fetched questions (Ascenso):", allQuestions.length);

        const metadata = {
          modalidad: modalidades.find(m => m.id === Number(selectedModalidadId))?.nombre,
          nivel: nivelesData.find(n => n.id === Number(selectedNivelId))?.nombre,
          especialidad: especialidadesData.find(e => e.id === Number(selectedEspecialidadId))?.nombre,
          year: selectedYearsList.join(', ')
        };

        localStorage.setItem('currentQuestions', JSON.stringify(allQuestions));
        localStorage.setItem('currentExamMetadata', JSON.stringify(metadata));
        router.push('/examen');
      } catch (error) {
        console.error("Error fetching simulation questions:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
       try {
         setIsLoading(true);
         const data = await estructuraAcademicaService.getAgrupados();
         setModalidades(data);
       } catch (error) {
         console.error("Error loading filters:", error);
       } finally {
         setIsLoading(false);
       }
    };
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const modalidadesData = modalidades;
  const nivelesData = selectedModalidadId ? modalidades.find(m => m.id === selectedModalidadId)?.niveles || [] : [];
  const especialidadesData = selectedNivelId ? nivelesData.find(n => n.id === selectedNivelId)?.especialidades || [] : [];
  const aniosData = selectedNivelId ? nivelesData.find(n => n.id === selectedNivelId)?.anios || [] : [];


  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0a192f]"></div>
      </div>
    );
  }

  const handleYearChange = (year: string) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year) 
        : [...prev, year]
    );
  };

  const selectedYearsList = selectedYears;

  return (
    <PremiumLayout title="Simulacro de Examen Ascenso" breadcrumb="Pages / Simulacro de Examen Ascenso">
      <Head>
        <title>Simulacro de Examen Ascenso - AVENDOCENTE</title>
      </Head>

      <div className="w-full space-y-6">
        
        {/* Title and subtitle */}
        <div className="text-center py-4">
           <h3 className="text-2xl md:text-3xl font-extrabold text-[#2B3674]">Selecciona tus preferencias</h3>
           <p className="text-[#A3AED0] text-base mt-1 font-medium">Puedes elegir los exámenes que consideres para poder practicar ahora</p>
           <p className="text-[#A3AED0] text-xs mt-1">Debes seleccionar al menos 2 exámenes entre Bloque I y Bloque II</p>
        </div>

        {/* Form Container */}
        <div className="space-y-4">
           
           {/* Bloque I Container */}
           <div className="border border-primary rounded-lg p-6 bg-white relative mt-6">
              <div className=" bg-white px-4 py-1 text-primary font-bold">
                 <span className="text-xl">Bloque I - Exámenes MINEDU</span>
              </div>

              <div className="mt-2 space-y-4">
                  {/* Modalidad Habilitada */}
                  <div className="border border-primary rounded-lg p-3 bg-white">
                      <div className="flex items-center gap-2 mb-2 text-primary font-bold text-sm">
                        <AcademicCapIcon className="h-4 w-4" />
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
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        disabled={isLoading}
                      >
                         <option value="">Selecciona Modalidad</option>
                         {modalidadesData.map(m => (
                             <option key={m.id} value={m.id}>{m.nombre}</option>
                         ))}
                      </select>
                  </div>

                  {/* Nivel */}
                  <div className="border border-primary rounded-lg p-3 bg-white">
                      <div className="flex items-center gap-2 mb-2 text-primary font-bold text-sm">
                        <FilterIcon className="h-4 w-4" />
                        <span>Nivel</span>
                      </div>
                      <select 
                        value={selectedNivelId}
                        onChange={(e) => {
                            const id = e.target.value === '' ? '' : Number(e.target.value);
                            setSelectedNivelId(id);
                            setSelectedEspecialidadId('');
                            setSelectedYears([]); // Clear selected years when level changes
                        }}
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        disabled={!selectedModalidadId}
                      >
                        <option value="">Seleccionar nivel</option>
                        {nivelesData.map(n => (
                            <option key={n.id} value={n.id}>{n.nombre}</option>
                        ))}
                      </select>
                  </div>

                  {/* Especialidad */}
                  <div className="border border-primary rounded-lg p-3 bg-white">
                      <div className="flex items-center gap-2 mb-2 text-primary font-bold text-sm">
                        <AcademicCapIcon className="h-4 w-4" />
                        <span>Especialidad</span>
                      </div>
                      <select 
                        value={selectedEspecialidadId}
                        onChange={(e) => {
                            const id = e.target.value === '' ? '' : Number(e.target.value);
                            setSelectedEspecialidadId(id);
                        }}
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        disabled={!selectedNivelId}
                      >
                        <option value="">Seleccionar especialidad</option>
                        {especialidadesData.map(e => (
                             <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                      </select>
                  </div>

                  {/* Selecciona mínimo dos años */}
                  <div className="border border-primary rounded-lg p-3 bg-white">
                      <div className="flex items-center gap-2 mb-3 text-primary font-bold text-sm">
                        <AcademicCapIcon className="h-4 w-4" />
                        <span>Selecciona mínimo dos años*</span>
                      </div>
                      
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {aniosData.map((year) => (
                             <label key={year} className="flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={selectedYears.includes(year)}
                                  onChange={() => handleYearChange(year)}
                                  className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500 h-4 w-4"
                                />
                                <span className="text-gray-700 text-sm">{year}</span>
                             </label>
                          ))}
                          {selectedNivelId && aniosData.length === 0 && (
                             <p className="text-gray-500 text-xs italic col-span-full">No hay años disponibles para este nivel.</p>
                          )}
                          {!selectedNivelId && (
                             <p className="text-gray-500 text-xs italic col-span-full">Selecciona un nivel para ver los años disponibles.</p>
                          )}
                      </div>
                  </div>
              </div>
           </div>

           {/* Resumen de selección */}
           <div className="border border-primary rounded-lg p-4 bg-white min-h-[100px]">
              <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                 <AcademicCapIcon className="h-5 w-5" />
                 <span>Resumen de selección</span>
              </div>
              <div className="text-gray-500 text-sm">
                 <div className="flex flex-col gap-1">
                      <div className="inline-block px-3 py-1 border border-blue-200 bg-blue-50 text-blue-800 rounded-md text-sm mb-2 w-max">
                        {modalidades.find(m => m.id === selectedModalidadId)?.nombre || 'None'}
                      </div>

                      {selectedNivelId && (
                         <p><span className="font-semibold text-xs text-gray-600 uppercase">Nivel</span>: {nivelesData.find(n => n.id === selectedNivelId)?.nombre}</p>
                      )}
                      {selectedEspecialidadId && (
                         <p><span className="font-semibold text-xs text-gray-600 uppercase">Especialidad</span>: {especialidadesData.find(e => e.id === selectedEspecialidadId)?.nombre}</p>
                      )}

                     {selectedYearsList.length > 0 && (
                        <>
                           <p><span className="font-semibold text-xs text-gray-600 uppercase">Años seleccionados</span></p>
                           <p>{selectedYearsList.join(', ')}</p>
                        </>
                     )}
                 </div>
              </div>
           </div>

            {/* Buttons */}
            <div className="flex justify-center gap-4 mt-6">
               <button 
                 onClick={() => {
                   setSelectedModalidadId(26);
                   setSelectedNivelId('');
                   setSelectedEspecialidadId('');
                   setSelectedYears([]);
                 }}
                 className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm md:text-base bg-white"
               >
                  <XIcon className="h-4 w-4" />
                  Limpiar
               </button>
                 <button 
                    onClick={handleConfirm}
                    disabled={selectedYearsList.length < 2 || (nivelesData.length > 0 && !selectedNivelId) || (especialidadesData.length > 0 && !selectedEspecialidadId)}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                 >
                    Confirmar selección
                 </button>
            </div>

           {/* Footer Note */}
           <div className="flex items-start gap-2 text-xs text-gray-600 px-2 mt-4">
              <span className="font-bold">•</span>
              <p>Si desea solo de un año determinado en específico puede ir al módulo de <a href="/bancoPreguntas" className="font-bold text-gray-800 hover:underline">Banco de preguntas</a></p>
           </div>
           
           {/* START Button (placeholder if needed) */}
           
        </div>
      </div>
    </PremiumLayout>
  );
};

export default SimulacroExamenAscensoPage;
