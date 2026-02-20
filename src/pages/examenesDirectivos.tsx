import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  AcademicCapIcon, 
  ChevronDownIcon,
  ChevronUpIcon,
  FolderIcon,
  XIcon
} from '@heroicons/react/outline';

import PremiumLayout from '../layouts/PremiumLayout';
import { useAuth } from '../hooks/useAuth';

const ExamenesDirectivosPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // State
  const [openAccordions, setOpenAccordions] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const exams = [
    { id: '2023', title: 'MINEDU 2023', count: '1 examen' },
    { id: '2025', title: 'MINEDU 2025', count: '1 examen' },
    { id: '2021', title: 'MINEDU 2021', count: '1 examen' },
    { id: '2018', title: 'MINEDU 2018', count: '2 exámenes' },
    { id: '2016_DIRECTIVOS', title: 'MINEDU- 2016 DIRECTIVOS', count: '1 examen' },
    { id: '2016_ESPECIALISTA', title: 'MINEDU 2016 - ESPECIALISTA', count: '5 exámenes' },
    { id: '2014', title: 'MINEDU - 2014', count: '1 examen' },
  ];

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4790FD]"></div>
      </div>
    );
  }

  return (
    <PremiumLayout title="Exámenes MINEDU y Simulacros" breadcrumb="Pages / Exámenes MINEDU y Simulacros">
      <Head>
        <title>Exámenes MINEDU y Simulacros - AVENDOCENTE</title>
      </Head>

      <div className="w-full space-y-6">
        
        {/* Title and subtitle */}
        <div className="text-center py-4">
           <h3 className="text-2xl md:text-3xl font-extrabold text-[#4790FD]">Selecciona tus preferencias</h3>
           <p className="text-[#A3AED0] text-base mt-1 font-medium">Selecciona el/los exámenes que deseas resolver ahora</p>
        </div>

        {/* Accordions List */}
        <div className="space-y-3">
           {exams.map((exam) => (
             <div key={exam.id} className="border border-cyan-400 rounded-lg bg-white overflow-hidden">
                <button 
                  onClick={() => toggleAccordion(exam.id)}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                >
                   <div className="flex items-center gap-3 text-[#4790FD] font-bold">
                      <FolderIcon className="h-6 w-6" />
                      <span>{exam.title} ({exam.count})</span>
                   </div>
                   {openAccordions[exam.id] ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                   ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                   )}
                </button>
                
                {/* Accordion Content Placeholder */}
                {openAccordions[exam.id] && (
                   <div className="p-4 border-t border-gray-100 bg-gray-50">
                      <p className="text-sm text-gray-500">Contenido del examen...</p>
                   </div>
                )}
             </div>
           ))}
        </div>

        {/* Resumen de selección */}
        <div className="border border-cyan-400 rounded-lg p-4 bg-white min-h-[100px] mt-6">
           <div className="flex items-center gap-2 mb-3 text-[#4790FD] font-bold">
              <AcademicCapIcon className="h-5 w-5" />
              <span>Resumen de selección</span>
           </div>
           <div className="text-gray-500 text-sm">
              <p>No has seleccionado ninguna opción.</p>
           </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-6">
           <button 
             className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium bg-white"
           >
              <XIcon className="h-4 w-4" />
              Limpiar
           </button>
           <button className="flex items-center gap-2 px-6 py-2 bg-[#4790FD] text-white rounded-md hover:bg-[#3b7ddb] transition-colors font-medium shadow-md">
              Confirmar selección
           </button>
        </div>

      </div>
    </PremiumLayout>
  );
};

export default ExamenesDirectivosPage;
