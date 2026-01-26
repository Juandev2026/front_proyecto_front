import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  EyeIcon, 
  ArrowsExpandIcon 
} from '@heroicons/react/outline';

import PremiumLayout from '../layouts/PremiumLayout';
import { useAuth } from '../hooks/useAuth';

const RecursosAscensoPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

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

  return (
    <PremiumLayout title="Recursos Ascenso" breadcrumb="Pages / Recursos Ascenso">
      <Head>
        <title>Recursos Ascenso - AVENDOCENTE</title>
      </Head>

      <div className="w-full space-y-6">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Card 1 */}
           <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-[#002B6B]">5</span>
              <span className="text-sm text-gray-500 font-medium mt-1">Secciones</span>
           </div>
           
           {/* Card 2 */}
           <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-[#002B6B]">5</span>
              <span className="text-sm text-gray-500 font-medium mt-1">Subsecciones</span>
           </div>

           {/* Card 3 */}
           <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-[#002B6B]">5</span>
              <span className="text-sm text-gray-500 font-medium mt-1">Archivos PDF</span>
           </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-cyan-400">
           
           <div className="mb-4">
              <span className="inline-block bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded mb-2">
                 Contenido Intro
              </span>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 uppercase mb-2">
                 ¿CÓMO NAVEGAR EN ESCALA DOCENTE?
              </h2>
              <p className="text-gray-500 text-sm">
                 SE VIENEN NUEVAS IMPLEMENTACIONES PARA ASCENSO, DIRECTIVO Y NOMBRAMIENTO. PRONTO: GENERADORES DE PROMPT PARA SESIONES Y COMUNIDAD VIP.
              </p>
           </div>

           {/* Video Placeholder - imitating a YouTube embed */}
           <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6 shadow-lg group cursor-pointer">
              {/* This is a visual approximation of a YouTube player */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-16 h-12 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-700 transition-colors z-10">
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                 </div>
              </div>
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                 <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden border border-white">
                    {/* Placeholder avatar */}
                    <img src="https://ui-avatars.com/api/?name=Escala+Docente&background=random" alt="Avatar" className="w-full h-full object-cover"/>
                 </div>
                 <span className="text-white text-sm font-medium shadow-black drop-shadow-md">NAVEGAR EN ESCALA DOCENTE</span>
              </div>
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-black bg-opacity-20 hover:bg-opacity-10 transition-all"></div>
           </div>

           {/* Action Buttons */}
           <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-cyan-400 text-cyan-600 font-bold rounded-lg hover:bg-cyan-50 transition-colors">
                 <EyeIcon className="h-5 w-5" />
                 Ver original
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#002B6B] text-white font-bold rounded-lg hover:bg-blue-900 transition-colors shadow-md">
                 <ArrowsExpandIcon className="h-5 w-5" />
                 Pantalla completa
              </button>
           </div>

        </div>

      </div>
    </PremiumLayout>
  );
};

export default RecursosAscensoPage;
