import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  BookOpenIcon, 
  ChevronDownIcon, 
  ChartBarIcon, 
  FilterIcon, 
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/solid';
import { 
  AcademicCapIcon,
} from '@heroicons/react/outline';

import PremiumLayout from '../layouts/PremiumLayout';
import { useAuth } from '../hooks/useAuth';

const RespuestasErroneasPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // State
  const [modalidad, setModalidad] = useState('Educación Básica Alternativa - Inicial - Intermedio');
  const [numPreguntas, setNumPreguntas] = useState('10 preguntas');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Mock Question Data
  const MOCK_QUESTIONS = [
    {
      id: 90,
      type: 'Pregunta Común',
      text: 'Un estudiante realiza el siguiente comentario:',
      comment: '"Yo creo que, si hay espacio libre en el envase, este no se va a hundir, sin importar lo que coloquemos dentro".',
      subText: '¿Cuál de las siguientes acciones es pertinente que realice el docente para retroalimentar al estudiante respecto del error en su comentario?',
      options: [
        { id: 'A', text: 'Proponerle que repita la experiencia colocando una esfera pequeña de acero en el interior del envase.', status: 'correct' },
        { id: 'B', text: 'Proponerle que vuelva a realizar la experiencia utilizando envases del mismo material, pero de mayor volumen.', status: 'neutral' },
        { id: 'C', text: 'Preguntarle cómo puede relacionar su comentario con el hecho de que hay barcos muy grandes que pueden flotar en el agua.', status: 'wrong' },
      ],
      sustento: 'Sin justificación disponible'
    }
  ];

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
    <PremiumLayout title="Respuestas Erróneas" breadcrumb="Pages / Respuestas Erróneas">
      <Head>
        <title>Respuestas Erróneas - AVENDOCENTE</title>
      </Head>

      <div className="w-full space-y-6">
        
        {/* Top Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           
           {/* Left Panel: Configuration (Green) */}
           <div className="bg-[#E6F4EA] rounded-xl p-6 border border-green-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-[#004d40]">
                 <BookOpenIcon className="h-5 w-5" />
                 <h2 className="font-bold text-lg">Perfecciona tu rendimiento corrigiendo tus errores</h2>
              </div>
              
              <p className="text-center font-medium text-gray-700 mb-4">Selecciona las preguntas a practicar.<span className="ml-1">👇</span></p>

              <div className="space-y-4">
                 {/* Modalidad Dropdown */}
                 <div>
                    <label className="text-xs font-semibold text-gray-600 ml-1">Modalidad/Nivel/Especialidad</label>
                    <div className="relative mt-1">
                       <select 
                         value={modalidad}
                         onChange={(e) => setModalidad(e.target.value)}
                         className="w-full appearance-none border border-gray-300 rounded-md p-2 pr-8 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm shadow-sm"
                       >
                          <option>Educación Básica Alternativa - Inicial - Intermedio</option>
                          <option>Educación Básica Regular - Inicial</option>
                       </select>
                       <ChevronDownIcon className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                    </div>
                 </div>

                 {/* Fuente de Preguntas */}
                 <div>
                    <label className="text-xs font-semibold text-gray-600 ml-1">Fuente de Preguntas</label>
                    <div className="flex gap-4 mt-1">
                       <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-gray-200 shadow-sm flex-1 cursor-pointer">
                          <input type="checkbox" defaultChecked className="text-red-500 focus:ring-red-500 rounded" /> 
                          <span className="text-sm font-semibold text-gray-700">MINEDU</span>
                       </label>
                       <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-gray-200 shadow-sm flex-1 cursor-pointer">
                          <input type="checkbox" defaultChecked className="text-red-500 focus:ring-red-500 rounded" /> 
                          <span className="text-sm font-semibold text-gray-700">Escala Docente</span>
                       </label>
                    </div>
                 </div>

                 {/* Tipos de Pregunta */}
                 <div>
                    <label className="text-xs font-semibold text-gray-600 ml-1">Tipos de Pregunta</label>
                    <div className="flex gap-2 mt-1">
                       <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-gray-200 shadow-sm flex-1 cursor-pointer">
                          <input type="checkbox" defaultChecked className="text-red-500 focus:ring-red-500 rounded" /> 
                          <span className="text-sm font-semibold text-gray-700">CL</span>
                       </label>
                       <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-gray-200 shadow-sm flex-1 cursor-pointer">
                          <input type="checkbox" defaultChecked className="text-red-500 focus:ring-red-500 rounded" /> 
                          <span className="text-sm font-semibold text-gray-700">RL</span>
                       </label>
                       <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-gray-200 shadow-sm flex-1 cursor-pointer">
                          <input type="checkbox" defaultChecked className="text-red-500 focus:ring-red-500 rounded" /> 
                          <span className="text-sm font-semibold text-gray-700">CCP</span>
                       </label>
                    </div>
                 </div>

                 {/* Numero de Preguntas */}
                 <div>
                    <label className="text-xs font-semibold text-gray-600 ml-1">Número de Preguntas</label>
                    <div className="relative mt-1">
                       <select 
                         value={numPreguntas}
                         onChange={(e) => setNumPreguntas(e.target.value)}
                         className="w-full appearance-none border border-gray-300 rounded-md p-2 pr-8 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm shadow-sm"
                       >
                          <option>10 preguntas</option>
                          <option>20 preguntas</option>
                          <option>50 preguntas</option>
                       </select>
                       <ChevronDownIcon className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                    </div>
                 </div>

                 {/* Button */}
                 <button className="w-full bg-[#00C853] hover:bg-green-600 text-white font-bold py-3 px-4 rounded-md shadow-md flex items-center justify-center gap-2 mt-2 transition-colors">
                    <CheckCircleIcon className="h-5 w-5" />
                    ¡Comienza a practicar Ahora!
                 </button>

              </div>
           </div>

           {/* Right Panel: Statistics (White) */}
           <div className="bg-white rounded-xl p-6 border border-cyan-400 shadow-sm">
              <div className="flex items-center gap-2 mb-6 text-[#002B6B]">
                 <ChartBarIcon className="h-5 w-5" />
                 <h2 className="font-bold text-lg">Estadísticas de Errores</h2>
              </div>

              <div className="flex justify-between text-center mb-8 px-4">
                 <div>
                    <p className="text-3xl font-bold text-red-500">8</p>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Errores Totales</p>
                 </div>
                 <div>
                    <p className="text-3xl font-bold text-red-500">8</p>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Preguntas Equivocadas</p>
                 </div>
                 <div>
                    <p className="text-3xl font-bold text-purple-500">0.8</p>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Puntos Perdidos</p>
                 </div>
              </div>

              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                 <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-red-500"></div>
                       <span className="text-sm font-medium text-gray-600">Categoría</span>
                    </div>
                    <span className="text-sm font-bold text-red-500">Educación Básica Regular - Inicial</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                       <span className="text-sm font-medium text-gray-600">Año</span>
                    </div>
                    <span className="text-sm font-bold text-orange-500">2019</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Bottom Section: History */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
           <div className="flex items-center gap-2 mb-2 text-[#002B6B]">
              <ClockIcon className="h-5 w-5" />
              <h2 className="font-bold text-lg">Historial de Preguntas Erróneas</h2>
           </div>
           
           <p className="text-sm text-gray-500 mb-6">Revisa las 4 fechas y las preguntas que has respondido incorrectamente. Las más recientes aparecen primero.</p>

           {/* Filters */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                 <label className="text-xs font-semibold text-gray-600 ml-1">Filtrar por Categoría</label>
                 <select className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm bg-gray-50">
                    <option>Todas las categorías</option>
                 </select>
              </div>
              <div>
                 <label className="text-xs font-semibold text-gray-600 ml-1">Filtrar por Tipo de Pregunta</label>
                 <select className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm bg-gray-50">
                    <option>Todos los tipos</option>
                 </select>
              </div>
              <div>
                 <label className="text-xs font-semibold text-gray-600 ml-1">Filtrar por Fuente</label>
                 <select className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm bg-gray-50">
                    <option>Todas las fuentes</option>
                 </select>
              </div>
           </div>

           {/* History List */}
           <div className="space-y-4">
              {[
                 { date: '29 de enero de 2026', errors: 1, points: 1.5 },
                 { date: '14 de enero de 2026', errors: 4, points: 6 },
                 { date: '2 de enero de 2026', errors: 1, points: 1.5 },
                 { date: '1 de diciembre de 2025', errors: 1, points: 1.5 },
              ].map((item, index) => (
                 <div key={index} className="space-y-3">
                    {/* Header Row */}
                    <div 
                      onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all group ${expandedIndex === index ? 'border-cyan-400 bg-gray-50 shadow-sm' : 'border-gray-100 hover:bg-gray-50'}`}
                    >
                       <span className="font-bold text-[#002B6B] text-sm md:text-base">Errores - {item.date}</span>
                       
                       <div className="flex items-center gap-4">
                          <span className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border border-red-100 flex items-center gap-1">
                             <span className="text-base leading-none font-bold">!</span> {item.errors} {item.errors === 1 ? 'error' : 'errores'}
                          </span>
                          <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold">{item.points} pts</span>
                          <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${expandedIndex === index ? 'rotate-180 text-[#002B6B]' : 'group-hover:text-gray-600'}`} />
                       </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedIndex === index && (
                       <div className="pl-0 md:pl-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          {MOCK_QUESTIONS.map((q) => (
                             <div key={q.id} className="border border-cyan-400 rounded-xl p-4 md:p-8 bg-white shadow-sm space-y-4">
                                {/* Question Header */}
                                <div className="flex items-center gap-3">
                                   <div className="bg-white border-2 border-gray-100 rounded-full h-10 w-10 flex items-center justify-center font-bold text-gray-700 shadow-sm">
                                      {q.id}
                                   </div>
                                   <span className="font-bold text-[#2B3674] text-lg">{q.type}</span>
                                </div>

                                {/* Question Body */}
                                <div className="space-y-4 text-[#2B3674] font-medium">
                                   <p>{q.text}</p>
                                   
                                   {/* Comment Box */}
                                   <div className="bg-gray-100 rounded-lg p-6 my-4 italic text-center text-gray-700 font-normal">
                                      {q.comment}
                                   </div>

                                   <p>{q.subText}</p>
                                </div>

                                {/* Options Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                                   {q.options.map((opt) => (
                                      <div 
                                        key={opt.id}
                                        className={`flex flex-col gap-2 p-5 rounded-xl border-2 transition-all ${
                                          opt.status === 'correct' ? 'border-green-400 bg-green-50 shadow-sm' : 
                                          opt.status === 'wrong' ? 'border-red-400 bg-red-50 shadow-sm' : 
                                          'border-gray-200 bg-white opacity-80'
                                        }`}
                                      >
                                         <div className="flex gap-3">
                                            <span className="font-bold text-lg">{opt.id})</span>
                                            <span className="text-sm md:text-base leading-relaxed">{opt.text}</span>
                                         </div>
                                      </div>
                                   ))}
                                </div>

                                {/* Sustento */}
                                <div className="pt-4 border-t border-gray-100 mt-6">
                                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Sustento :</p>
                                   <p className="text-gray-500 text-sm">{q.sustento}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              ))}
           </div>
        </div>
      </div>
    </PremiumLayout>
  );
};

export default RespuestasErroneasPage;
