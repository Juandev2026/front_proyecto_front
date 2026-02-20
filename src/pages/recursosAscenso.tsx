import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
   EyeIcon,
   ArrowsExpandIcon,
   ChevronRightIcon,
   ChevronDownIcon,
   XIcon,
   DownloadIcon
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
   const [expandedSections, setExpandedSections] = React.useState<number[]>([]);
   const [expandedSubSections, setExpandedSubSections] = React.useState<string[]>([]);
   const [loading, setLoading] = React.useState(true);
   const [isFullscreen, setIsFullscreen] = React.useState(false);

   // Bloquear scroll del body cuando el modal está abierto
   useEffect(() => {
      if (isFullscreen) {
         document.body.style.overflow = 'hidden';
      } else {
         document.body.style.overflow = '';
      }
      return () => { document.body.style.overflow = ''; };
   }, [isFullscreen]);

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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4790FD]"></div>
         </div>
      );
   }

   const stats = {
      secciones: sections.length,
      subsecciones: sections.reduce((acc, s) => acc + s.subSecciones.length, 0),
      archivos: sections.reduce((acc, s) => acc + s.subSecciones.reduce((subAcc, sub) => subAcc + (sub.recurso?.length || 0), 0), 0)
   };

   const getYoutubeEmbedUrl = (url?: string): string => {
      if (!url) return '';
      let videoId: string | undefined = '';
      if (url.includes('v=')) {
         videoId = url.split('v=')[1]?.split('&')[0];
      } else if (url.includes('youtu.be/')) {
         videoId = url.split('youtu.be/')[1]?.split('?')[0];
      } else if (url.includes('youtube.com/shorts/')) {
         videoId = url.split('youtube.com/shorts/')[1]?.split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
         return url;
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
   };

   const videoUrl = getYoutubeEmbedUrl(intro?.urlVideo);

   return (
      <>
         <PremiumLayout title="Recursos Ascenso" breadcrumb="Pages / Recursos Ascenso">
         <Head>
            <title>Recursos Ascenso - AVENDOCENTE</title>
         </Head>

         <div className="w-full space-y-6">

            {/* Header Banner - Más pequeño */}
            <div className="w-full bg-[#4790FD] rounded-xl py-3 md:py-4 px-6 text-white text-center shadow-lg">
               <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Recursos</h1>
               <p className="text-xs md:text-sm font-bold text-gray-200 mt-0.5 uppercase tracking-wider">Ascenso Docente</p>
            </div>

            {/* Stats Cards - Horizontal even on mobile */}
            <div className="grid grid-cols-3 gap-3 md:gap-6">
               {/* Card 1 */}
               <div className="bg-white rounded-xl p-3 md:p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                  <span className="text-xl md:text-3xl font-bold text-[#4790FD]">{stats.secciones}</span>
                  <span className="text-[10px] md:text-sm text-gray-500 font-medium mt-1">Secciones</span>
               </div>

               {/* Card 2 */}
               <div className="bg-white rounded-xl p-3 md:p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                  <span className="text-xl md:text-3xl font-bold text-[#4790FD]">{stats.subsecciones}</span>
                  <span className="text-[10px] md:text-sm text-gray-500 font-medium mt-1">Subsecciones</span>
               </div>

               {/* Card 3 */}
               <div className="bg-white rounded-xl p-3 md:p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                  <span className="text-xl md:text-3xl font-bold text-[#4790FD]">{stats.archivos}</span>
                  <span className="text-[10px] md:text-sm text-gray-500 font-medium mt-1">Archivos PDF</span>
               </div>
            </div>

            {/* Content Section (Contenido Intro) */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md border border-gray-100 transition-all hover:shadow-lg">
               {/* Header centrado */}
               <div className="flex flex-col items-center text-center mb-6">
                  <span className="bg-[#4790FD]/10 text-[#4790FD] text-[11px] font-extrabold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                     Contenido Intro
                  </span>
                  <h2 className="text-xl md:text-3xl font-extrabold text-[#4790FD] mb-3 leading-tight">
                     {intro?.nombreModulo || '¿CÓMO NAVEGAR EN ESCALA DOCENTE?'}
                  </h2>
                  <p className="text-gray-500 text-sm md:text-base max-w-2xl font-medium">
                     {intro?.descripcion || 'Se vienen nuevas implementaciones para ASCENSO, DIRECTIVO Y NOMBRAMIENTO.'}
                  </p>
               </div>

               {/* Video Section - responsive height */}
               {videoUrl ? (
                  <div className="w-full max-w-4xl mx-auto h-[250px] md:h-[520px] bg-black rounded-2xl overflow-hidden mb-6 shadow-2xl border-4 border-white transition-all">
                     <iframe
                        src={videoUrl}
                        title="Introduction Video"
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                     />
                  </div>
               ) : (
                  <div className="w-full max-w-4xl mx-auto h-[250px] md:h-[520px] bg-gray-100 rounded-2xl flex items-center justify-center mb-6 border-2 border-dashed border-gray-200">
                     <p className="text-gray-400 font-medium text-sm">No hay video disponible</p>
                  </div>
               )}

               {/* Action Buttons */}
               <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <button
                     onClick={() => window.open(intro?.urlVideo, '_blank')}
                     className="flex-1 flex items-center justify-center gap-3 px-6 py-3 border-2 border-[#4790FD] text-[#4790FD] font-bold rounded-xl hover:bg-[#4790FD]/5 transition-all shadow-sm"
                  >
                     <EyeIcon className="h-5 w-5" />
                     Ver original
                  </button>
                  <button
                     onClick={() => setIsFullscreen(true)}
                     className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-[#4790FD] text-white font-bold rounded-xl hover:bg-[#3b7ddb] transition-all shadow-lg"
                  >
                     <ArrowsExpandIcon className="h-5 w-5" />
                     Pantalla completa
                  </button>
               </div>
            </div>


            {/* Resources List (Accordion Style) */}
            <div className="space-y-4">
               {sections.map(section => {
                  const isExpanded = expandedSections.includes(section.id);
                  const toggleSection = () => {
                     setExpandedSections((prev: number[]) => {
                        const isExpanding = !prev.includes(section.id);
                        if (isExpanding) {
                           // Auto-expand all sub-sections when expanding a parent section
                           const subKeys = section.subSecciones.map(sub => `${section.id}-${sub.id}`);
                           setExpandedSubSections((current: string[]) => Array.from(new Set([...current, ...subKeys])));
                        }
                        return isExpanding 
                           ? [...prev, section.id] 
                           : prev.filter((id: number) => id !== section.id);
                     });
                  };

                  return (
                     <div key={section.id} className="bg-white rounded-xl shadow-sm border border-[#4790FD]/30 overflow-hidden transition-all duration-300">
                        {/* Accordion Header */}
                        <div 
                           onClick={toggleSection}
                           className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-blue-50/30 transition-colors"
                        >
                           <div className="flex flex-col text-left">
                              <h3 className="text-[#4790FD] font-bold uppercase tracking-wide">
                                 {section.nombre}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 font-medium">
                                 <span>{section.subSecciones.length} subsecciones</span>
                                 <span>•</span>
                                 <span>{section.subSecciones.reduce((acc, sub) => acc + (sub.recurso?.length || 0), 0)} recursos</span>
                              </div>
                              {section.descripcion && (
                                 <p className="text-xs text-gray-500 mt-2 font-normal leading-relaxed">
                                    {section.descripcion}
                                 </p>
                              )}
                           </div>
                           <div className="flex-shrink-0 ml-4">
                              {isExpanded ? (
                                 <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                              ) : (
                                 <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                              )}
                           </div>
                        </div>

                        {/* Accordion Content */}
                        {isExpanded && (
                           <div className="px-6 pb-6 pt-2 border-t border-gray-50 animate-fadeIn">
                              <div className="space-y-3">
                                 {section.subSecciones.length > 0 ? (
                                    section.subSecciones.map(sub => {
                                       const subKey = `${section.id}-${sub.id}`;
                                       const isSubExpanded = expandedSubSections.includes(subKey);
                                       const toggleSubSection = () => {
                                          setExpandedSubSections((prev: string[]) => 
                                             prev.includes(subKey) 
                                                ? prev.filter((k: string) => k !== subKey) 
                                                : [...prev, subKey]
                                          );
                                       };

                                       return (
                                          <div key={sub.id} className="space-y-4">
                                             {/* Sub-section Accordion Header */}
                                             <div 
                                                onClick={toggleSubSection}
                                                className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-100 hover:border-[#4790FD]/30 transition-all cursor-pointer group"
                                             >
                                                <div className="flex flex-col text-left">
                                                   <h4 className="font-bold text-gray-800 text-sm">{sub.nombre}</h4>
                                                   <p className="text-[11px] text-gray-400 font-medium">
                                                      {sub.recurso?.length || 0} documentos disponibles
                                                   </p>
                                                </div>
                                                <div className="flex-shrink-0 ml-4">
                                                   {isSubExpanded ? (
                                                      <ChevronDownIcon className="h-4 w-4 text-gray-400 group-hover:text-[#4790FD]" />
                                                   ) : (
                                                      <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-[#4790FD]" />
                                                   )}
                                                </div>
                                             </div>

                                             {/* Resources Grid - 2 per row */}
                                             {isSubExpanded && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fadeIn pb-6">
                                                   {sub.recurso && sub.recurso.length > 0 ? (
                                                      sub.recurso.map((rec, idx) => (
                                                         <div key={idx} className="bg-white rounded-xl overflow-hidden border border-[#d1e7dd] hover:shadow-md transition-all flex flex-col group">
                                                            {/* Image Header with PDF Tag */}
                                                            <div className="relative h-40 md:h-48 w-full bg-gray-50 overflow-hidden border-b border-gray-100">
                                                               <div className="absolute top-3 left-3 z-10">
                                                                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">PDF</span>
                                                               </div>
                                                               <img
                                                                  src={rec.imagen || "https://ui-avatars.com/api/?name=PDF&background=4790FD&color=fff"}
                                                                  alt={rec.nombreArchivo || 'Recurso'}
                                                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                               />
                                                            </div>

                                                            {/* Body */}
                                                            <div className="p-4 flex-1 flex flex-col">
                                                               <div className="mb-3">
                                                                  <span className="bg-[#d1e7dd] text-[#0f5132] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Libre</span>
                                                               </div>
                                                               <h5 className="text-gray-900 font-bold text-sm mb-1 line-clamp-2 leading-snug">
                                                                  {rec.nombreArchivo || 'Recurso sin nombre'}
                                                               </h5>
                                                               <p className="text-[10px] text-gray-400 font-medium mb-4">
                                                                  Archivo PDF
                                                               </p>

                                                               <div className="mt-auto flex gap-2">
                                                                  <button
                                                                     onClick={() => window.open(rec.pdf, '_blank')}
                                                                     className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-[#4790FD] text-[#4790FD] text-[11px] font-bold rounded-lg transition-all hover:bg-[#4790FD] hover:text-white ${!rec.pdf ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                     disabled={!rec.pdf}
                                                                  >
                                                                     <EyeIcon className="h-3.5 w-3.5" />
                                                                     Ver
                                                                  </button>
                                                                  <button
                                                                     onClick={() => {
                                                                        if (rec.pdf) {
                                                                           const link = document.createElement('a');
                                                                           link.href = rec.pdf;
                                                                           link.download = rec.nombreArchivo || 'recurso.pdf';
                                                                           document.body.appendChild(link);
                                                                           link.click();
                                                                           document.body.removeChild(link);
                                                                        }
                                                                     }}
                                                                     className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#002855] text-white text-[11px] font-bold rounded-lg transition-all hover:bg-[#001d3d] ${!rec.pdf ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                     disabled={!rec.pdf}
                                                                  >
                                                                     <DownloadIcon className="h-3.5 w-3.5" />
                                                                     Descargar
                                                                  </button>
                                                               </div>
                                                            </div>
                                                         </div>
                                                      ))
                                                   ) : (
                                                      <p className="col-span-full text-center text-gray-400 py-4 italic text-sm">No hay recursos en esta subsección</p>
                                                   )}
                                                </div>
                                             )}
                                             
                                             {/* Separator if not last */}
                                             <div className="h-px bg-gray-100 my-4 w-full last:hidden" />
                                          </div>
                                       );
                                    })
                                 ) : (
                                    <p className="text-center text-gray-400 py-4 italic text-sm">No hay subsecciones disponibles</p>
                                 )}
                              </div>
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>

         </div>
         </PremiumLayout>

         {/* Fullscreen Modal */}
         {isFullscreen && (
            <div
               className="fixed inset-0 z-[9999] bg-black flex flex-col"
               onClick={(e) => { if (e.target === e.currentTarget) setIsFullscreen(false); }}
            >
               {/* Top bar */}
               <div className="flex items-center justify-between px-6 py-3 bg-black/80">
                  <h2 className="text-white font-bold text-base">
                     {intro?.nombreModulo || '¿CÓMO NAVEGAR EN ESCALA DOCENTE?'}
                  </h2>
                  <button
                     onClick={() => setIsFullscreen(false)}
                     className="text-white hover:text-gray-300 transition-colors p-1"
                  >
                     <XIcon className="h-7 w-7" />
                  </button>
               </div>

               {/* Video */}
               <div className="flex-1 flex items-center justify-center p-4">
                  <iframe
                     src={videoUrl}
                     title="Introduction Video Fullscreen"
                     className="w-full h-full max-w-7xl rounded-lg"
                     frameBorder="0"
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                     allowFullScreen
                  />
               </div>
            </div>
         )}
      </>
   );
};

export default RecursosAscensoPage;
