import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
   EyeIcon,
   ArrowsExpandIcon
} from '@heroicons/react/outline';

import PremiumLayout from '../layouts/PremiumLayout';
import { useAuth } from '../hooks/useAuth';
import { contenidoIntroductorioService, ContenidoIntroductorio } from '../services/contenidoIntroductorioService';
import { seccionRecursosService, SeccionAnidada } from '../services/seccionRecursosService';

const RecursosAscensoPage = () => {
   const { isAuthenticated, loading: authLoading } = useAuth();
   const router = useRouter();

   const [intro, setIntro] = React.useState<ContenidoIntroductorio | null>(null);
   const [sections, setSections] = React.useState<SeccionAnidada[]>([]);
   const [loading, setLoading] = React.useState(true);

   useEffect(() => {
      if (!authLoading && !isAuthenticated) {
         router.push('/login');
      }
   }, [authLoading, isAuthenticated, router]);

   useEffect(() => {
      const fetchData = async () => {
         try {
            const [introData, nestedData] = await Promise.all([
               contenidoIntroductorioService.getById(1), // Fixed ID for intro as seen in DB
               seccionRecursosService.getDatosAnidados()
            ]);
            setIntro(Array.isArray(introData) ? introData[0] : introData);
            setSections(nestedData);
         } catch (error) {
            console.error("Error loading Recursos Ascenso data:", error);
         } finally {
            setLoading(false);
         }
      };

      if (isAuthenticated) {
         fetchData();
      }
   }, [isAuthenticated]);

   if (authLoading || loading || !isAuthenticated) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0a192f]"></div>
         </div>
      );
   }

   const stats = {
      secciones: sections.length,
      subsecciones: sections.reduce((acc, s) => acc + s.subSecciones.length, 0),
      archivos: sections.reduce((acc, s) => acc + s.subSecciones.filter(sub => sub.recurso && sub.recurso.pdf).length, 0)
   };

   const getYoutubeEmbedUrl = (url?: string) => {
      if (!url) return '';
      // Basic conversion for youtube links to embed
      if (url.includes('youtube.com/shorts/')) {
         return url.replace('youtube.com/shorts/', 'youtube.com/embed/');
      }
      if (url.includes('watch?v=')) {
         return url.replace('watch?v=', 'embed/');
      }
      return url;
   };

   const videoUrl = getYoutubeEmbedUrl(intro?.urlVideo);

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
                  <span className="text-3xl font-bold text-[#3B82F6]">{stats.secciones}</span>
                  <span className="text-sm text-gray-500 font-medium mt-1">Secciones</span>
               </div>

               {/* Card 2 */}
               <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-bold text-[#3B82F6]">{stats.subsecciones}</span>
                  <span className="text-sm text-gray-500 font-medium mt-1">Subsecciones</span>
               </div>

               {/* Card 3 */}
               <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-bold text-[#3B82F6]">{stats.archivos}</span>
                  <span className="text-sm text-gray-500 font-medium mt-1">Archivos PDF</span>
               </div>
            </div>

            {/* Content Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-primary">

               <div className="mb-4">
                  <span className="inline-block bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded mb-2">
                     Contenido Intro
                  </span>
                  <h2 className="text-lg md:text-xl font-bold text-gray-800 uppercase mb-2">
                     {intro?.nombreModulo || '¿CÓMO NAVEGAR EN ESCALA DOCENTE?'}
                  </h2>
                  <p className="text-gray-500 text-sm">
                     {intro?.descripcion || 'SE VIENEN NUEVAS IMPLEMENTACIONES...'}
                  </p>
               </div>

               {/* Video Section */}
               {videoUrl ? (
                  <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6 shadow-lg">
                     <iframe
                        src={videoUrl}
                        title="Introduction Video"
                        className="absolute inset-0 w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                     />
                  </div>
               ) : (
                  <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6 shadow-lg group cursor-pointer">
                     {/* This is a visual approximation of a YouTube player */}
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-12 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-700 transition-colors z-10">
                           <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                        </div>
                     </div>
                     <div className="absolute inset-0 bg-black bg-opacity-20 hover:bg-opacity-10 transition-all"></div>
                  </div>
               )}

               {/* Action Buttons */}
               <div className="flex flex-col sm:flex-row gap-4">
                  <button
                     onClick={() => window.open(intro?.urlVideo, '_blank')}
                     className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-primary text-primary font-bold rounded-lg hover:bg-blue-50 transition-colors"
                  >
                     <EyeIcon className="h-5 w-5" />
                     Ver original
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-md">
                     <ArrowsExpandIcon className="h-5 w-5" />
                     Pantalla completa
                  </button>
               </div>

            </div>

            {/* Resources List (Like Escaladocente) */}
            <div className="space-y-4">
               {sections.map(section => (
                  <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                     <div className="bg-primary px-6 py-3">
                        <h3 className="text-white font-bold uppercase">{section.nombre}</h3>
                     </div>
                     <div className="p-4 space-y-3">
                        {section.subSecciones.length > 0 ? (
                           section.subSecciones.map(sub => (
                              <div key={sub.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 gap-4">
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 p-1 flex-shrink-0">
                                       <img
                                          src={sub.recurso?.imagen || "https://ui-avatars.com/api/?name=PDF&background=3B82F6&color=fff"}
                                          alt={sub.nombre}
                                          className="w-full h-full object-contain"
                                       />
                                    </div>
                                    <div>
                                       <h4 className="font-bold text-gray-800">{sub.nombre}</h4>
                                       <p className="text-xs text-gray-500">{sub.descripcion || 'Sin descripción'}</p>
                                    </div>
                                 </div>

                                 <div className="flex gap-2">
                                    {sub.recurso?.pdf ? (
                                       <button
                                          onClick={() => window.open(sub.recurso?.pdf, '_blank')}
                                          className="flex items-center gap-2 px-4 py-2 bg-white border border-primary text-primary text-sm font-bold rounded-lg hover:bg-blue-50 transition-colors"
                                       >
                                          <EyeIcon className="h-4 w-4" />
                                          Ver Recurso
                                       </button>
                                    ) : (
                                       <span className="text-xs text-gray-400 italic">No hay archivo disponible</span>
                                    )}
                                 </div>
                              </div>
                           ))
                        ) : (
                           <p className="text-center text-gray-400 py-4 italic">No hay subsecciones disponibles</p>
                        )}
                     </div>
                  </div>
               ))}
            </div>

         </div>
      </PremiumLayout>
   );
};

export default RecursosAscensoPage;
