import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  AcademicCapIcon, 
  XIcon,
} from '@heroicons/react/outline';

import PremiumLayout from '../layouts/PremiumLayout';
import { useAuth } from '../hooks/useAuth';

const BancoPreguntasAscensoPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Form State
  const [modalidad, setModalidad] = useState('Educación Básica Regular');
  const [nivel, setNivel] = useState('');
  const [anio, setAnio] = useState('');

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
  };

  return (
    <PremiumLayout title="Banco de preguntas Ascenso" breadcrumb="Pages / Banco de preguntas Ascenso">
      <Head>
        <title>Banco de Preguntas Ascenso - AVENDOCENTE</title>
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
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium bg-white"
              >
                 <XIcon className="h-4 w-4" />
                 Limpiar
              </button>
              <button className="flex items-center gap-2 px-6 py-2 bg-[#002B6B] text-white rounded-md hover:bg-blue-900 transition-colors font-medium shadow-md">
                 Confirmar selección
              </button>
           </div>

        </div>
      </div>
    </PremiumLayout>
  );
};

export default BancoPreguntasAscensoPage;
