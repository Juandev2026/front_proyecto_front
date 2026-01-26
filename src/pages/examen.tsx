import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  ClockIcon, 
  VolumeUpIcon, 
  RefreshIcon, 
  ViewGridIcon, 
  ArrowsExpandIcon, 
  CheckCircleIcon
} from '@heroicons/react/outline';

import PremiumLayout from '../layouts/PremiumLayout';
import { useAuth } from '../hooks/useAuth';

const ExamenPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);



  // Timer State
  const [seconds, setSeconds] = useState(0);

  // TTS State
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time MM:SS
  const formatTime = (totalSeconds: number) => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };
  
  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      let availableVoices = window.speechSynthesis.getVoices();
      
      // Filter for Spanish or Microsoft voices
      const spanishVoices = availableVoices.filter(v => v.lang.includes('es') || v.name.includes('Microsoft') || v.name.includes('Google'));
      
      // Prioritize specific high quality voices if available
      const priorityNames = ['Microsoft Elena', 'Microsoft Sabina', 'Microsoft Raul', 'Microsoft Laura', 'Google español'];
      
      spanishVoices.sort((a, b) => {
         const aIndex = priorityNames.findIndex(name => a.name.includes(name));
         const bIndex = priorityNames.findIndex(name => b.name.includes(name));
         
         // Both found, sort by priority index
         if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
         // Only a found, it comes first
         if (aIndex !== -1) return -1;
         // Only b found, it comes first
         if (bIndex !== -1) return 1;
         // Neither found, keep original order (or maybe sort by name)
         return 0;
      });

      // Take top 4
      const topVoices = spanishVoices.slice(0, 4);
      setVoices(topVoices);
      
      if (topVoices.length > 0 && topVoices[0]) setSelectedVoice(topVoices[0]);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleToggleReading = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      setIsPaused(false);
    } else {
      const textToRead = `Tenía un hermano pequeño, y a nadie más tenía. Hacía mucho tiempo, desde la muerte de sus padres, habitaban los dos solos esa playa desierta, rodeada de montañas. Pescaban, cazaban, recogían frutos y eran felices. En verdad, tan pequeño era el otro, apenas como la palma de su mano, que el hermano grande encontraba normal ocuparse de todo. Pero siempre atento a su pequeño hermano, delicado y único en su minúsculo tamaño. Nada hacía sin llevarlo consigo. Si era día de pesca, se iban los dos mar adentro, el hermano grande metido en el agua hasta los muslos, el pequeño encaramado en su oreja, ambos inclinados sobre la transparencia del agua, esperando el momento en que el pez se acercaría y, ¡zas!, caería preso en la celada de sus manos. Si se trataba de cazar, salían al bosque, el pequeño acomodado a sus anchas en la alforja de cuero de su hermano, quien daba largos pasos por entre los arbustos, en busca de algún animal salvaje que les garantizara el almuerzo, o de frutas maduras y jugosas que calmaran la sed. Nada faltaba a los dos hermanos. Pero en las noches, sentados frente al fuego, la casa entera parecía llenarse de vacío. Casi sin advertirlo, comenzaban a hablar de un mundo más allá de las montañas, preguntándose cómo sería, si estaría habitado, e imaginando la vida de aquellos habitantes. De una suposición a otra, la charla se ampliaba hasta el amanecer con nuevas historias que se ligaban entre sí.`;

      const utterance = new SpeechSynthesisUtterance(textToRead);
      if (selectedVoice) {
         utterance.voice = selectedVoice;
      }
      
      utterance.onend = () => {
         setIsReading(false);
         setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsReading(true);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0a192f]"></div>
      </div>
    );
  }

  return (
    <PremiumLayout title="Examen" breadcrumb="Pages / Examen">
      <Head>
        <title>Examen - AVENDOCENTE</title>
      </Head>

      {/* Top Bar Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 sticky top-0 z-20">
         <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Timer Section */}
            <div className="flex items-center gap-2 text-gray-700 font-bold text-xl min-w-[140px]">
               <ClockIcon className="h-6 w-6 text-gray-500" />
               <div className="flex flex-col leading-tight">
                  <span className="text-sm text-gray-500 font-normal">Tiempo:</span>
                  <span>{formatTime(seconds)}</span>
               </div>
            </div>

            {/* Controls Section */}
            <div className="flex flex-wrap items-center justify-center gap-2 flex-1">
               <button 
                  onClick={handleToggleReading}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm transition-colors ${isReading ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100 font-medium'}`}
               >
                  <VolumeUpIcon className="h-4 w-4" />
                  {isReading ? 'Detener lectura' : 'Activar sonido'}
               </button>
               
               <div className="relative min-w-[200px] max-w-[250px]">
                  <select 
                     className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
                     value={selectedVoice?.name || ''}
                     onChange={(e) => {
                        const voice = voices.find(v => v.name === e.target.value);
                        if (voice) setSelectedVoice(voice);
                     }}
                  >
                     {voices.length === 0 && <option>Cargando voces...</option>}
                     {voices.map(voice => (
                        <option key={voice.name} value={voice.name} title={voice.name}>
                           {voice.name.replace('Microsoft ', '').split(' - ')[0]}
                        </option>
                     ))}
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                  </div>
               </div>

               <button className="flex items-center gap-2 px-3 py-2 border border-blue-200 text-blue-700 rounded-md text-sm hover:bg-blue-50 font-medium">
                  <RefreshIcon className="h-4 w-4" />
                  Generar de nuevo
               </button>
               
               <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 font-bold">
                   <ViewGridIcon className="h-4 w-4" />
                   Panel de Preguntas
               </button>
               
               <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                   <ArrowsExpandIcon className="h-4 w-4" />
                   Pantalla completa
               </button>
            </div>

            {/* Badges Section */}
            <div className="flex flex-col gap-2 items-end min-w-[150px]">
                <div className="bg-green-100 border border-green-200 text-green-700 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-medium w-fit whitespace-nowrap">
                   <CheckCircleIcon className="h-3 w-3" />
                   Iniciando examen correctamente.
                </div>
                <div className="flex gap-1 justify-end flex-wrap">
                   <span className="bg-green-200 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded">Nombramiento</span>
                   <span className="bg-blue-200 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">MINEDU Nombramiento</span>
                </div>
            </div>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full">
         
         {/* Main Content (Left) - Split into Text vs Question Area */}
         <div className="flex-1 flex flex-col gap-6 font-serif leading-relaxed text-gray-800">
            
            {/* Reading Text Section */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 min-h-[400px]">
               <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                  <div>
                     <h2 className="text-gray-400 text-sm font-sans mb-1">Pregunta 1 de 65</h2>
                     <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded font-sans">Texto 1</span>
                  </div>
                  <div className="flex gap-2 font-sans">
                     <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-1 rounded">CL</span>
                     <span className="bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded">Sin responder</span>
                  </div>
               </div>

               <div className="space-y-4 text-justify h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <p>
                     Tenía un hermano pequeño, y a nadie más tenía. Hacía mucho tiempo, desde la muerte de sus padres, habitaban los dos solos esa playa desierta, rodeada de montañas. Pescaban, cazaban, recogían frutos y eran felices. En verdad, tan pequeño era el otro, apenas como la palma de su mano, que el hermano grande encontraba normal ocuparse de todo. Pero siempre atento a su pequeño hermano, delicado y único en su minúsculo tamaño.
                  </p>
                  <p>
                     Nada hacía sin llevarlo consigo. Si era día de pesca, se iban los dos mar adentro, el hermano grande metido en el agua hasta los muslos, el pequeño encaramado en su oreja, ambos inclinados sobre la transparencia del agua, esperando el momento en que el pez se acercaría y, ¡zas!, caería preso en la celada de sus manos. Si se trataba de cazar, salían al bosque, el pequeño acomodado a sus anchas en la alforja de cuero de su hermano, quien daba largos pasos por entre los arbustos, en busca de algún animal salvaje que les garantizara el almuerzo, o de frutas maduras y jugosas que calmaran la sed. Nada faltaba a los dos hermanos.
                  </p>
                  <p>
                     Pero en las noches, sentados frente al fuego, la casa entera parecía llenarse de vacío. Casi sin advertirlo, comenzaban a hablar de un mundo más allá de las montañas, preguntándose cómo sería, si estaría habitado, e imaginando la vida de aquellos habitantes. De una suposición a otra, la charla se ampliaba hasta el amanecer con nuevas historias que se ligaban entre sí.
                  </p>
               </div>
            </div>

            {/* Question & Options Section */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 font-sans">
                <p className="text-gray-800 font-medium mb-4">En el texto, ¿cuál de los siguientes rasgos caracteriza al esposo de la tejedora?</p>
                
                <div className="space-y-3">
                   {/* Option A */}
                   <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 flex items-center justify-center border border-gray-400 rounded-md font-bold text-gray-600">A</div>
                      <span className="text-gray-700">Es alegre.</span>
                   </label>

                   {/* Option B */}
                   <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 flex items-center justify-center border border-gray-400 rounded-md font-bold text-gray-600">B</div>
                      <span className="text-gray-700">Es paciente.</span>
                   </label>

                   {/* Option C */}
                   <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 flex items-center justify-center border border-gray-400 rounded-md font-bold text-gray-600">C</div>
                      <span className="text-gray-700">Es codicioso.</span>
                   </label>
                </div>

                <div className="mt-6">
                   <button className="w-full bg-[#002B6B] hover:bg-blue-900 text-white font-bold py-3 rounded-lg shadow-md transition-colors">
                      Siguiente
                   </button>
                </div>
                
                {/* Brand Signature */}
                 <div className="flex justify-end mt-4">
                     <div className="flex flex-col items-end">
                       <span className="font-handwriting text-2xl text-gray-800 transform -rotate-6">Juan Avendaño</span>
                         {/* TikTok Icon Placeholder */}
                        <div className="bg-black text-white p-0.5 rounded-full w-5 h-5 flex items-center justify-center mt-1">
                           <span className="text-[10px] font-bold">t</span>
                        </div>
                     </div>
                 </div>
            </div>

         </div>

         {/* Summary Panel (Right) */}
         <div className="w-full lg:w-80 space-y-4 h-fit">
            
            {/* Stats Summary Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
               <h3 className="text-[#002B6B] font-bold border-b border-gray-100 pb-2 mb-4">Resumen</h3>
               
               <div className="flex justify-between text-center mb-6">
                  <div>
                     <p className="text-3xl font-bold text-green-500">0</p>
                     <p className="text-xs text-gray-500">Correctas</p>
                  </div>
                  <div>
                     <p className="text-3xl font-bold text-red-500">0</p>
                     <p className="text-xs text-gray-500">Incorrectas</p>
                  </div>
                  <div>
                     <p className="text-3xl font-bold text-gray-500">90</p>
                     <p className="text-xs text-gray-500">Sin responder</p>
                  </div>
               </div>

               <div>
                  <div className="flex justify-between text-sm mb-1">
                     <span className="text-gray-700 font-medium">Progreso</span>
                     <span className="text-gray-500">0/90</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                     <div className="bg-[#002B6B] h-2.5 rounded-full" style={{ width: '0%' }}></div>
                  </div>
               </div>
            </div>

            {/* Question Panel (Previously created, moved here or kept below stats) */}
            {/* Depending on request "Abajo deben salir estos datos" implying the summary might be below question content or floating right. 
                The screenshot puts Summary on the right column. 
                The previous 'Panel de Preguntas' (grid 1-65) can remain below the summary card.
            */}
             <div className="bg-white rounded-xl p-4 shadow-sm border border-cyan-400">
                <div className="flex items-center gap-2 mb-4 text-[#002B6B] font-bold border-b border-gray-100 pb-2">
                   <ViewGridIcon className="h-5 w-5" />
                   <h3>Panel de Preguntas</h3>
                </div>
                
                <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                   {Array.from({ length: 65 }, (_, i) => i + 1).map((num) => (
                      <button 
                         key={num}
                         className={`
                            h-8 w-full rounded flex items-center justify-center text-xs font-bold transition-colors
                            ${num === 1 ? 'bg-[#002B6B] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}
                         `}
                      >
                         {num}
                      </button>
                   ))}
                </div>
             </div>

         </div>

      </div>
    </PremiumLayout>
  );
};

export default ExamenPage;
