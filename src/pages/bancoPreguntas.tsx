import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  AcademicCapIcon, 
  QuestionMarkCircleIcon, 
  XIcon,
} from '@heroicons/react/outline';

import PremiumLayout from '../layouts/PremiumLayout';
import { useAuth } from '../hooks/useAuth';

const BancoPreguntasPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Form State
  const [modalidad, setModalidad] = useState('Educación Básica Regular');
  const [nivel, setNivel] = useState('');
  const [anio, setAnio] = useState('');
  
  // Checkbox State
  const [tiposPregunta, setTiposPregunta] = useState({
    comprension: false,
    razonamiento: false,
    conocimientos: false
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

  const handleClear = () => {
    setModalidad('Educación Básica Regular');
    setNivel('');
    setAnio('');
    setTiposPregunta({
      comprension: false,
      razonamiento: false,
      conocimientos: false
    });
  };

  return (
    <PremiumLayout title="Banco de preguntas" breadcrumb="Pages / Banco de preguntas">
      <Head>
        <title>Banco de Preguntas - AVENDOCENTE</title>
      </Head>

      <div className="w-full space-y-6">
        
        {/* Title and subtitle */}
        <div className="text-center py-4">
           <h3 className="text-2xl md:text-3xl font-extrabold text-[#2B3674]">Selecciona tus preferencias</h3>
           <p className="text-[#A3AED0] text-base mt-1 font-medium">Puedes seleccionar el año de su preferencia</p>
        </div>

        {/* Form Container */}
        <div className="space-y-4">
           
           {/* Modalidad Habilitada */}
           <div className="border border-cyan-400 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-[#002B6B] font-bold">
                 <AcademicCapIcon className="h-5 w-5" />
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
           <div className="border border-cyan-400 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-[#002B6B] font-bold">
                 <AcademicCapIcon className="h-5 w-5" />
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

           {/* Elige un Año */}
           <div className="border border-cyan-400 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-[#002B6B] font-bold">
                 <AcademicCapIcon className="h-5 w-5" />
                 <span>Elige un Año</span>
              </div>
              <select 
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                 <option value="">Selecciona un año</option>
                 <option value="2024">2024</option>
                 <option value="2023">2023</option>
                 <option value="2022">2022</option>
              </select>
           </div>

           {/* Tipos de Pregunta */}
           <div className="border border-cyan-400 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-[#002B6B] font-bold">
                 <QuestionMarkCircleIcon className="h-5 w-5" />
                 <span>Tipos de Pregunta*</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {/* Card 1 */}
                 <label className={`border rounded-lg p-4 flex flex-col gap-2 cursor-pointer transition-colors ${tiposPregunta.comprension ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <div className="flex items-start gap-2">
                       <input 
                         type="checkbox" 
                         className="mt-1"
                         checked={tiposPregunta.comprension}
                         onChange={(e) => setTiposPregunta({...tiposPregunta, comprension: e.target.checked})}
                       />
                       <div>
                          <p className="font-semibold text-gray-700">Comprensión Lectora</p>
                          <p className="text-xs text-gray-400">0 preguntas (no disponible)</p>
                       </div>
                    </div>
                 </label>

                 {/* Card 2 */}
                 <label className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2 opacity-60 cursor-not-allowed bg-gray-50">
                    <div className="flex items-start gap-2">
                       <input type="checkbox" className="mt-1" disabled />
                       <div>
                          <p className="font-semibold text-gray-700">Razonamiento Lógico</p>
                          <p className="text-xs text-gray-400">0 preguntas (no disponible)</p>
                       </div>
                    </div>
                 </label>

                 {/* Card 3 */}
                 <label className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2 opacity-60 cursor-not-allowed bg-gray-50">
                    <div className="flex items-start gap-2">
                       <input type="checkbox" className="mt-1" disabled />
                       <div>
                          <p className="font-semibold text-gray-700">Conocimientos Curriculares y Pedagógicos</p>
                          <p className="text-xs text-gray-400">0 preguntas (no disponible)</p>
                       </div>
                    </div>
                 </label>
              </div>
              <p className="text-xs text-gray-500 mt-3">* Selecciona al menos un tipo de pregunta</p>
           </div>

           {/* Resumen de selección */}
           <div className="border border-cyan-400 rounded-lg p-4 bg-white min-h-[100px]">
              <div className="flex items-center gap-2 mb-3 text-[#002B6B] font-bold">
                 <AcademicCapIcon className="h-5 w-5" />
                 <span>Resumen de selección</span>
              </div>
              <div className="text-gray-500 text-sm">
                 {(!nivel && !anio) ? (
                    <p>No has seleccionado ninguna opción.</p>
                 ) : (
                    <div className="flex flex-col gap-1">
                       <p><span className="font-semibold">Modalidad:</span> {modalidad}</p>
                       {nivel && <p><span className="font-semibold">Nivel:</span> {nivel}</p>}
                       {anio && <p><span className="font-semibold">Año:</span> {anio}</p>}
                    </div>
                 )}
              </div>
           </div>

           {/* Buttons */}
           <div className="flex justify-end gap-4 mt-6">
              <button 
                onClick={handleClear}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                 <XIcon className="h-4 w-4" />
                 Limpiar
              </button>
              <button 
                 onClick={() => router.push('/examen')}
                 className="flex items-center gap-2 px-6 py-2 bg-[#002B6B] text-white rounded-md hover:bg-blue-900 transition-colors font-medium shadow-md">
                 Confirmar selección
              </button>
           </div>

        </div>
      </div>
    </PremiumLayout>
  );
};

export default BancoPreguntasPage;
