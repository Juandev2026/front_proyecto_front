import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  AcademicCapIcon, 
  XIcon,
} from '@heroicons/react/outline';

import PremiumLayout from '../layouts/PremiumLayout';
import { useAuth } from '../hooks/useAuth';

const SimulacroExamenPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Form State
  const [modalidad, setModalidad] = useState('Educación Básica Regular');
  const [nivel, setNivel] = useState('');
  
  // Year Checkbox State
  const [selectedYears, setSelectedYears] = useState({
    '2018': false,
    '2019': false,
    '2022': false,
    '2024': false,
    '2025': false,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0a192f]"></div>
      </div>
    );
  }

  const handleYearChange = (year: string) => {
    setSelectedYears(prev => ({
      ...prev,
      [year]: !prev[year as keyof typeof selectedYears]
    }));
  };

  const selectedYearsList = Object.entries(selectedYears)
    .filter(([_, isSelected]) => isSelected)
    .map(([year]) => year);

  const handleClear = () => {
    setModalidad('Educación Básica Regular');
    setNivel('');
    setSelectedYears({
      '2018': false,
      '2019': false,
      '2022': false,
      '2024': false,
      '2025': false,
    });
  };

  const handleConfirm = () => {
    router.push('/examen');
  };

  return (
    <PremiumLayout title="Simulacro de Examen" breadcrumb="Pages / Simulacro de Examen">
      <Head>
        <title>Simulacro de Examen - AVENDOCENTE</title>
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
           <div className="border border-cyan-400 rounded-lg p-6 bg-white relative mt-6">
              <div className=" bg-white px-4 py-1 text-[#002B6B] font-bold">
                 <span className="text-xl">Bloque I - Exámenes MINEDU</span>
              </div>

              <div className="mt-2 space-y-4">
                  {/* Modalidad Habilitada */}
                  <div className="border border-cyan-400 rounded-lg p-3 bg-white">
                      <div className="flex items-center gap-2 mb-2 text-[#002B6B] font-bold text-sm">
                        <AcademicCapIcon className="h-4 w-4" />
                        <span>Modalidad habilitada</span>
                      </div>
                      <select 
                        value={modalidad}
                        onChange={(e) => setModalidad(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option>Educación Básica Regular</option>
                        <option>Educación Básica Alternativa</option>
                        <option>Educación Básica Especial</option>
                      </select>
                  </div>

                  {/* Nivel */}
                  <div className="border border-cyan-400 rounded-lg p-3 bg-white">
                      <div className="flex items-center gap-2 mb-2 text-[#002B6B] font-bold text-sm">
                        <AcademicCapIcon className="h-4 w-4" />
                        <span>Nivel</span>
                      </div>
                      <select 
                        value={nivel}
                        onChange={(e) => setNivel(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Seleccionar nivel</option>
                        <option value="inicial">Inicial</option>
                        <option value="primaria">Primaria</option>
                        <option value="secundaria">Secundaria</option>
                      </select>
                  </div>

                  {/* Selecciona mínimo dos años */}
                  <div className="border border-cyan-400 rounded-lg p-3 bg-white">
                      <div className="flex items-center gap-2 mb-3 text-[#002B6B] font-bold text-sm">
                        <AcademicCapIcon className="h-4 w-4" />
                        <span>Selecciona mínimo dos años*</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {['2018', '2019', '2022', '2024', '2025'].map((year) => (
                             <label key={year} className="flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={selectedYears[year as keyof typeof selectedYears]}
                                  onChange={() => handleYearChange(year)}
                                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                />
                                <span className="text-gray-700 text-sm">{year}</span>
                             </label>
                          ))}
                      </div>
                  </div>
              </div>
           </div>

           {/* Resumen de selección */}
           <div className="border border-cyan-400 rounded-lg p-4 bg-white min-h-[100px]">
              <div className="flex items-center gap-2 mb-3 text-[#002B6B] font-bold">
                 <AcademicCapIcon className="h-5 w-5" />
                 <span>Resumen de selección</span>
              </div>
              <div className="text-gray-500 text-sm">
                 <div className="flex flex-col gap-1">
                     <p><span className="font-semibold text-xs text-gray-600 uppercase">Modalidad</span></p>
                     <div className="inline-block px-3 py-1 border border-blue-200 bg-blue-50 text-blue-800 rounded-md text-sm mb-2 w-max">
                        {modalidad}
                     </div>

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
                onClick={handleClear}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm md:text-base"
              >
                 <XIcon className="h-4 w-4" />
                 Limpiar
              </button>
              <button 
                 onClick={handleConfirm}
                 disabled={selectedYearsList.length < 2 || !nivel}
                 className="flex items-center gap-2 px-6 py-2 bg-[#002B6B] text-white rounded-md hover:bg-blue-900 transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base">
                 Confirmar selección
              </button>
           </div>

           {/* Footer Note */}
           <div className="flex items-start gap-2 text-xs text-gray-600 px-2 mt-4">
              <span className="font-bold">•</span>
              <p>Si desea solo de un año determinado en específico puede ir al módulo de <Link href="/bancoPreguntas"><a className="font-bold text-gray-800 hover:underline">Banco de preguntas</a></Link></p>
           </div>
           
           {/* START Button (Floating or Fixed at bottom right if desired, but not in screenshot. Assuming consistency or simple note for now. Adding a button just in case is good practice, or user might ask for it later. Screenshot shows a green button cut off at the bottom right?) */}
           {/* Looking closely at the uploaded image 'uploaded_media_1769283719704.png', there is a green circular button with a phone/whatsapp icon at the bottom right. That's likely a global support widget. */}
           
        </div>
      </div>
    </PremiumLayout>
  );
};

export default SimulacroExamenPage;
