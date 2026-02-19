import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
   AcademicCapIcon,
   QuestionMarkCircleIcon,
   XIcon,
   FilterIcon,
   CalendarIcon
} from '@heroicons/react/outline';
import {
   Star,
   Target,
   CheckCircle,
   Timer,
   Clock,
   BarChart3,
   Library
} from 'lucide-react';

import PremiumLayout from '../layouts/PremiumLayout';
import { useAuth } from '../hooks/useAuth';
import { estructuraAcademicaService } from '../services/estructuraAcademicaService';
import { ExamenLogin } from '../services/authService';

// ----- Types derived from login examenes -----
interface FilterOption { id: number; nombre: string; }

const BancoPreguntasPage = () => {
   const { isAuthenticated, loading } = useAuth();
   const router = useRouter();

   // Examenes from login response
   const [loginExamenes, setLoginExamenes] = useState<ExamenLogin[]>([]);

   // Current Selection State
   const [selectedModalidadId, setSelectedModalidadId] = useState<number | ''>('');
   const [selectedNivelId, setSelectedNivelId] = useState<number | ''>('');
   const [selectedEspecialidadId, setSelectedEspecialidadId] = useState<number | ''>('');
   const [selectedYear, setSelectedYear] = useState<string>('');
   const [isLoading, setIsLoading] = useState(false);
   const [conteoPreguntas, setConteoPreguntas] = useState<{ [key: string]: {
      cantidad: number;
      puntos: number;
      tiempoPregunta: number;
      minimo: number;
   } }>({});

   // Checkbox State 
   const [tiposPregunta, setTiposPregunta] = useState({
      comprension: true,
      razonamiento: false,
      conocimientos: false
   });

   useEffect(() => {
      if (!loading && !isAuthenticated) {
         router.push('/login');
      }
   }, [loading, isAuthenticated, router]);

   // Load examenes from localStorage (saved during login)
   useEffect(() => {
      if (isAuthenticated) {
         const stored = localStorage.getItem('loginExamenes');
         if (stored) {
            try {
               const parsed: ExamenLogin[] = JSON.parse(stored);
               setLoginExamenes(parsed);
            } catch (e) {
               console.error('Error parsing loginExamenes from localStorage:', e);
            }
         }
      }
   }, [isAuthenticated]);

   // ---------- Derived filter options from loginExamenes ----------
   const modalidadesData: FilterOption[] = Array.from(
      new Map(loginExamenes.map(e => [e.modalidadId, { id: e.modalidadId, nombre: e.modalidadNombre }])).values()
   );

   const nivelesData: FilterOption[] = Array.from(
      new Map(
         loginExamenes
            .filter(e => !selectedModalidadId || e.modalidadId === selectedModalidadId)
            .map(e => [e.nivelId, { id: e.nivelId, nombre: e.nivelNombre }])
      ).values()
   );

   const especialidadesData: FilterOption[] = Array.from(
      new Map(
         loginExamenes
            .filter(e =>
               (!selectedModalidadId || e.modalidadId === selectedModalidadId) &&
               (!selectedNivelId || e.nivelId === selectedNivelId)
            )
            .map(e => [e.especialidadId, { id: e.especialidadId, nombre: e.especialidadNombre }])
      ).values()
   );

   const aniosData: string[] = Array.from(
      new Set(
         loginExamenes
            .filter(e =>
               (!selectedModalidadId || e.modalidadId === selectedModalidadId) &&
               (!selectedNivelId || e.nivelId === selectedNivelId) &&
               (!selectedEspecialidadId || e.especialidadId === selectedEspecialidadId)
            )
            .map(e => e.year)
      )
   ).sort((a, b) => Number(b) - Number(a));

   // Fetch question counts when year is selected
   useEffect(() => {
      const updateCounts = () => {
         if (selectedModalidadId && selectedNivelId && selectedEspecialidadId && selectedYear) {
            // Find the specific exam matching all filters
            const exam = loginExamenes.find(e =>
               e.modalidadId === selectedModalidadId &&
               e.nivelId === selectedNivelId &&
               e.especialidadId === selectedEspecialidadId &&
               e.year === selectedYear
            );

            if (exam && exam.clasificaciones) {
               const countMap: { [key: string]: { cantidad: number; puntos: number; tiempoPregunta: number; minimo: number; } } = {};
               exam.clasificaciones.forEach((item) => {
                  const name = item.clasificacionNombre.toLowerCase();
                  let key = '';

                  // Robust mapping for classifications
                  if (name === 'ccp' || name.includes('pedagógico') || name.includes('curricular')) {
                     key = 'conocimientos pedagógicos';
                  } else if (name === 'cl' || name.includes('comprensión')) {
                     key = 'comprensión lectora';
                  } else if (name === 'rl' || name.includes('razonamiento')) {
                     key = 'razonamiento lógico';
                  } else {
                     key = name; // Fallback to raw name if no match
                  }

                  if (key) {
                     countMap[key] = {
                        cantidad: (countMap[key]?.cantidad || 0) + item.cantidadPreguntas,
                        puntos: item.puntos || countMap[key]?.puntos || 0,
                        tiempoPregunta: item.tiempoPregunta || countMap[key]?.tiempoPregunta || 0,
                        minimo: item.minimo || countMap[key]?.minimo || 0
                     };
                  }
               });
               setConteoPreguntas(countMap);

               // Auto-uncheck categories if they have 0 questions
               setTiposPregunta(prev => ({
                  comprension: (countMap['comprensión lectora']?.cantidad || 0) > 0 ? prev.comprension : false,
                  razonamiento: (countMap['razonamiento lógico']?.cantidad || 0) > 0 ? prev.razonamiento : false,
                  conocimientos: (countMap['conocimientos pedagógicos']?.cantidad || 0) > 0 ? prev.conocimientos : false
               }));
            } else {
               setConteoPreguntas({});
               setTiposPregunta({ comprension: false, razonamiento: false, conocimientos: false });
            }
         } else {
            setConteoPreguntas({});
            setTiposPregunta({ comprension: false, razonamiento: false, conocimientos: false });
         }
      };
      updateCounts();
   }, [selectedModalidadId, selectedNivelId, selectedEspecialidadId, selectedYear, loginExamenes]);

   // --- Handlers ---
   const handleClear = () => {
      setSelectedModalidadId('');
      setSelectedNivelId('');
      setSelectedEspecialidadId('');
      setSelectedYear('');
      setTiposPregunta({
         comprension: true,
         razonamiento: false,
         conocimientos: false
      });
   };

   const handleConfirm = async () => {
      if (selectedModalidadId && selectedNivelId && selectedYear) {
         try {
            setIsLoading(true);
            // Map types to IDs (Assuming IDs for now, should ideally come from API)
            const tipoPreguntaIds: number[] = [];
            if (tiposPregunta.comprension) tipoPreguntaIds.push(1);
            if (tiposPregunta.razonamiento) tipoPreguntaIds.push(2);
            if (tiposPregunta.conocimientos) tipoPreguntaIds.push(3);

            const questions = await estructuraAcademicaService.getPreguntas(
               Number(selectedModalidadId),
               Number(selectedNivelId),
               selectedYear,
               tipoPreguntaIds
            );
            console.log("Fetched questions:", questions);
            // Store in localStorage or state management to be used in /examen
            localStorage.setItem('currentQuestions', JSON.stringify(questions));
            router.push('/examen');
         } catch (error) {
            console.error("Error confirming selection:", error);
         } finally {
            setIsLoading(false);
         }
      }
   };

   if (loading || !isAuthenticated) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-blue-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0a192f]"></div>
         </div>
      );
   }

   return (
      <PremiumLayout title="Banco de preguntas" breadcrumb="Pages / Banco de preguntas">
         <Head>
            <title>Banco de Preguntas - AVENDOCENTE</title>
         </Head>

         <div className="w-full space-y-6">

            {/* Title and subtitle */}
            <div className="text-center py-4">
               <h3 className="text-2xl md:text-3xl font-extrabold text-[#2B3674]">Selecciona tus preferencias</h3>
               <p className="text-[#A3AED0] text-base mt-1 font-medium">Filtra paso a paso para encontrar el examen deseado</p>
            </div>

            {/* Form Container */}
            <div className="space-y-4">

               {/* 1. Modalidad */}
               <div className="border border-primary rounded-lg p-4 bg-white">
                  <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                     <AcademicCapIcon className="h-5 w-5" />
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
                     className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                     disabled={isLoading}
                  >
                     <option value="">Selecciona Modalidad</option>
                     {modalidadesData.map(m => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                     ))}
                  </select>
               </div>

               {/* 2. Nivel */}
               <div className="border border-primary rounded-lg p-4 bg-white">
                  <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                     <FilterIcon className="h-5 w-5" />
                     <span>Nivel</span>
                  </div>
                  <select
                     value={selectedNivelId}
                     onChange={(e) => {
                        const id = e.target.value === '' ? '' : Number(e.target.value);
                        setSelectedNivelId(id);
                        setSelectedEspecialidadId('');
                        setSelectedYear(''); // Clear year when level changes
                     }}
                     className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                     disabled={!selectedModalidadId}
                  >
                     <option value="">Selecciona Nivel</option>
                     {nivelesData.map(n => (
                        <option key={n.id} value={n.id}>{n.nombre}</option>
                     ))}
                  </select>
               </div>

               {/* 3. Especialidad */}
               <div className="border border-primary rounded-lg p-4 bg-white">
                  <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                     <AcademicCapIcon className="h-5 w-5" />
                     <span>Especialidad</span>
                  </div>
                  <select
                     value={selectedEspecialidadId}
                     onChange={(e) => {
                        const id = e.target.value === '' ? '' : Number(e.target.value);
                        setSelectedEspecialidadId(id);
                     }}
                     className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                     disabled={!selectedNivelId}
                  >
                     <option value="">Selecciona Especialidad</option>
                     {especialidadesData.map(e => (
                        <option key={e.id} value={e.id}>{e.nombre}</option>
                     ))}
                  </select>
               </div>

               {/* 3. Año */}
               <div className="border border-primary rounded-lg p-4 bg-white">
                  <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                     <CalendarIcon className="h-5 w-5" />
                     <span>Elige un año</span>
                  </div>
                  <select
                     value={selectedYear}
                     onChange={(e) => setSelectedYear(e.target.value)}
                     className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                     disabled={!selectedNivelId || aniosData.length === 0}
                  >
                     <option value="">Selecciona Año</option>
                     {aniosData.map(year => (
                        <option key={year} value={year}>{year}</option>
                     ))}
                  </select>
               </div>

               {/* Tipos de Pregunta */}
               <div className="border border-primary rounded-lg p-4 bg-white">
                  <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                     <QuestionMarkCircleIcon className="h-5 w-5" />
                     <span>Tipos de Pregunta*</span>
                  </div>

                  {/* Card 1 */}
                  <label className={`border rounded-xl p-4 flex flex-col gap-2 transition-all ${
                     (conteoPreguntas['comprensión lectora']?.cantidad || 0) > 0 
                        ? 'cursor-pointer hover:bg-gray-50 ' + (tiposPregunta.comprension ? 'border-primary bg-blue-50 ring-1 ring-primary' : 'border-gray-200')
                        : 'cursor-not-allowed opacity-50 border-gray-200 bg-gray-50'
                  }`}>
                     <div className="flex items-start gap-2">
                        <input
                           type="checkbox"
                           className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                           checked={tiposPregunta.comprension}
                           disabled={(conteoPreguntas['comprensión lectora']?.cantidad || 0) === 0}
                           onChange={(e) => setTiposPregunta({ ...tiposPregunta, comprension: e.target.checked })}
                        />
                        <div className="flex flex-col">
                           <span className="text-[#2B3674] font-bold text-lg">Comprensión Lectora</span>
                           <span className={`${(conteoPreguntas['comprensión lectora']?.cantidad || 0) > 0 ? 'text-[#05CD99]' : 'text-gray-400'} text-sm font-medium`}>
                              {(conteoPreguntas['comprensión lectora']?.cantidad || 0) > 0 
                                 ? `${conteoPreguntas['comprensión lectora']?.cantidad} preguntas`
                                 : '0 preguntas (no disponible)'}
                           </span>
                        </div>
                     </div>
                  </label>

                  {/* Card 2 */}
                  <label className={`border rounded-xl p-4 flex flex-col gap-2 transition-all ${
                     (conteoPreguntas['razonamiento lógico']?.cantidad || 0) > 0 
                        ? 'cursor-pointer hover:bg-gray-50 ' + (tiposPregunta.razonamiento ? 'border-primary bg-blue-50 ring-1 ring-primary' : 'border-gray-200')
                        : 'cursor-not-allowed opacity-50 border-gray-200 bg-gray-50'
                  }`}>
                     <div className="flex items-start gap-2">
                        <input
                           type="checkbox"
                           className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                           checked={tiposPregunta.razonamiento}
                           disabled={(conteoPreguntas['razonamiento lógico']?.cantidad || 0) === 0}
                           onChange={(e) => setTiposPregunta({ ...tiposPregunta, razonamiento: e.target.checked })}
                        />
                        <div className="flex flex-col">
                           <span className="text-[#2B3674] font-bold text-lg">Razonamiento Lógico</span>
                           <span className={`${(conteoPreguntas['razonamiento lógico']?.cantidad || 0) > 0 ? 'text-[#05CD99]' : 'text-gray-400'} text-sm font-medium`}>
                              {(conteoPreguntas['razonamiento lógico']?.cantidad || 0) > 0 
                                 ? `${conteoPreguntas['razonamiento lógico']?.cantidad} preguntas`
                                 : '0 preguntas (no disponible)'}
                           </span>
                        </div>
                     </div>
                  </label>

                  {/* Card 3 */}
                  <label className={`border rounded-xl p-4 flex flex-col gap-2 transition-all ${
                     (conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0) > 0 
                        ? 'cursor-pointer hover:bg-gray-50 ' + (tiposPregunta.conocimientos ? 'border-primary bg-blue-50 ring-1 ring-primary' : 'border-gray-200')
                        : 'cursor-not-allowed opacity-50 border-gray-200 bg-gray-50'
                  }`}>
                     <div className="flex items-start gap-2">
                        <input
                           type="checkbox"
                           className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                           checked={tiposPregunta.conocimientos}
                           disabled={(conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0) === 0}
                           onChange={(e) => setTiposPregunta({ ...tiposPregunta, conocimientos: e.target.checked })}
                        />
                        <div className="flex flex-col">
                           <span className="text-[#2B3674] font-bold uppercase text-sm">Conocimientos Curriculares y Pedagógicos</span>
                           <span className={`${(conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0) > 0 ? 'text-[#05CD99]' : 'text-gray-400'} text-sm font-medium`}>
                              {(conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0) > 0 
                                 ? `${conteoPreguntas['conocimientos pedagógicos']?.cantidad} preguntas`
                                 : '0 preguntas (no disponible)'}
                           </span>
                        </div>
                     </div>
                  </label>
                  <p className="text-xs text-gray-500 mt-3">* Selecciona al menos un tipo de pregunta</p>
               </div>

               {/* Tipos de Pregunta Seleccionados */}
               {(tiposPregunta.comprension || tiposPregunta.razonamiento || tiposPregunta.conocimientos) && (
                  <div className="mt-8 space-y-4">
                     <h3 className="text-[#2B3674] font-bold text-xl">Tipos de Pregunta Seleccionados</h3>

                     <div className="space-y-3">
                        {tiposPregunta.conocimientos && (
                           <div className="bg-[#EFEEFF] border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
                              <div className="flex flex-col">
                                 <span className="text-[#2B3674] font-bold text-base">Conocimientos Curriculares y Pedagógicos</span>
                                 <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="bg-[#D1E9FF] text-[#002B6B] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <div className="bg-[#002B6B] w-4 h-4 rounded flex items-center justify-center text-[10px] text-white">Q</div>
                                       {conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0} preguntas
                                    </span>
                                    <span className="bg-[#D6FFD8] text-[#008000] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Star className="w-3.5 h-3.5" /> {conteoPreguntas['conocimientos pedagógicos']?.puntos || 0} pts/correcta
                                    </span>
                                    <span className="bg-[#FFE5E5] text-[#FF0000] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Target className="w-3.5 h-3.5" /> Máx: {(conteoPreguntas['conocimientos pedagógicos']?.puntos || 0) * (conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0)} pts
                                    </span>
                                    <span className="bg-[#FFF4D1] text-[#B8860B] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <CheckCircle className="w-3.5 h-3.5" /> Mínimo: {conteoPreguntas['conocimientos pedagógicos']?.minimo || 0} pts
                                    </span>
                                    <span className="bg-[#FFF9C4] text-[#856404] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Timer className="w-3.5 h-3.5" /> {conteoPreguntas['conocimientos pedagógicos']?.tiempoPregunta || 0} min/pregunta
                                    </span>
                                    <span className="bg-[#FDE2E2] text-[#E53E3E] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Clock className="w-3.5 h-3.5" /> Total: {(conteoPreguntas['conocimientos pedagógicos']?.tiempoPregunta || 0) * (conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0)} min
                                    </span>
                                 </div>
                              </div>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:block">
                                 <div className="bg-[#6B4BFF] text-white text-[10px] font-bold rounded-lg px-2 py-1 uppercase">CCP</div>
                              </div>
                           </div>
                        )}

                        {tiposPregunta.razonamiento && (
                           <div className="bg-[#EFEEFF] border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
                              <div className="flex flex-col">
                                 <span className="text-[#2B3674] font-bold text-base">Razonamiento Lógico</span>
                                 <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="bg-[#D1E9FF] text-[#002B6B] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <div className="bg-[#002B6B] w-4 h-4 rounded flex items-center justify-center text-[10px] text-white">Q</div>
                                       {conteoPreguntas['razonamiento lógico']?.cantidad || 0} preguntas
                                    </span>
                                    <span className="bg-[#D6FFD8] text-[#008000] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Star className="w-3.5 h-3.5" /> {conteoPreguntas['razonamiento lógico']?.puntos || 0} pts/correcta
                                    </span>
                                    <span className="bg-[#FFE5E5] text-[#FF0000] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Target className="w-3.5 h-3.5" /> Máx: {(conteoPreguntas['razonamiento lógico']?.puntos || 0) * (conteoPreguntas['razonamiento lógico']?.cantidad || 0)} pts
                                    </span>
                                    <span className="bg-[#FFF4D1] text-[#B8860B] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <CheckCircle className="w-3.5 h-3.5" /> Mínimo: {conteoPreguntas['razonamiento lógico']?.minimo || 0} pts
                                    </span>
                                    <span className="bg-[#FFF9C4] text-[#856404] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Timer className="w-3.5 h-3.5" /> {conteoPreguntas['razonamiento lógico']?.tiempoPregunta || 0} min/pregunta
                                    </span>
                                    <span className="bg-[#FDE2E2] text-[#E53E3E] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Clock className="w-3.5 h-3.5" /> Total: {(conteoPreguntas['razonamiento lógico']?.tiempoPregunta || 0) * (conteoPreguntas['razonamiento lógico']?.cantidad || 0)} min
                                    </span>
                                 </div>
                              </div>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:block">
                                 <div className="bg-[#4318FF] text-white text-[10px] font-bold rounded-lg px-2 py-1 uppercase">RL</div>
                              </div>
                           </div>
                        )}

                        {tiposPregunta.comprension && (
                           <div className="bg-[#EFEEFF] border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
                              <div className="flex flex-col">
                                 <span className="text-[#2B3674] font-bold text-base">Comprensión Lectora</span>
                                 <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="bg-[#D1E9FF] text-[#002B6B] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <div className="bg-[#002B6B] w-4 h-4 rounded flex items-center justify-center text-[10px] text-white">Q</div>
                                       {conteoPreguntas['comprensión lectora']?.cantidad || 0} preguntas
                                    </span>
                                    <span className="bg-[#D6FFD8] text-[#008000] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Star className="w-3.5 h-3.5" /> {conteoPreguntas['comprensión lectora']?.puntos || 0} pts/correcta
                                    </span>
                                    <span className="bg-[#FFE5E5] text-[#FF0000] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Target className="w-3.5 h-3.5" /> Máx: {(conteoPreguntas['comprensión lectora']?.puntos || 0) * (conteoPreguntas['comprensión lectora']?.cantidad || 0)} pts
                                    </span>
                                    <span className="bg-[#FFF4D1] text-[#B8860B] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <CheckCircle className="w-3.5 h-3.5" /> Mínimo: {conteoPreguntas['comprensión lectora']?.minimo || 0} pts
                                    </span>
                                    <span className="bg-[#FFF9C4] text-[#856404] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Timer className="w-3.5 h-3.5" /> {conteoPreguntas['comprensión lectora']?.tiempoPregunta || 0} min/pregunta
                                    </span>
                                    <span className="bg-[#FDE2E2] text-[#E53E3E] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Clock className="w-3.5 h-3.5" /> Total: {(conteoPreguntas['comprensión lectora']?.tiempoPregunta || 0) * (conteoPreguntas['comprensión lectora']?.cantidad || 0)} min
                                    </span>
                                 </div>
                              </div>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:block">
                                 <div className="bg-[#01B9FF] text-white text-[10px] font-bold rounded-lg px-2 py-1 uppercase">CL</div>
                              </div>
                           </div>
                        )}
                     </div>

                     {/* New Row: Resumen Total */}
                     <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-4 mt-6">
                        <div className="flex items-center gap-2 mb-3 text-[#2B3674] font-bold">
                           <BarChart3 className="w-5 h-5 text-primary" />
                           <span>Resumen Total</span>
                        </div>
                        <div className="flex flex-wrap gap-4">
                           <div className="bg-[#4FACFE] text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-transform hover:scale-105">
                              <div className="bg-white/30 p-1.5 rounded">
                                 <Library className="w-4 h-4" />
                               </div>
                               <span>{
                                  (tiposPregunta.conocimientos ? (conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0) : 0) +
                                  (tiposPregunta.razonamiento ? (conteoPreguntas['razonamiento lógico']?.cantidad || 0) : 0) +
                                  (tiposPregunta.comprension ? (conteoPreguntas['comprensión lectora']?.cantidad || 0) : 0)
                               } preguntas totales</span>
                            </div>
                            <div className="bg-[#05CD99] text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-transform hover:scale-105">
                               <div className="bg-white/30 p-1.5 rounded">
                                  <Clock className="w-4 h-4" />
                               </div>
                               <span>{
                                  (tiposPregunta.conocimientos ? (conteoPreguntas['conocimientos pedagógicos']?.tiempoPregunta || 0) * (conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0) : 0) +
                                  (tiposPregunta.razonamiento ? (conteoPreguntas['razonamiento lógico']?.tiempoPregunta || 0) * (conteoPreguntas['razonamiento lógico']?.cantidad || 0) : 0) +
                                  (tiposPregunta.comprension ? (conteoPreguntas['comprensión lectora']?.tiempoPregunta || 0) * (conteoPreguntas['comprensión lectora']?.cantidad || 0) : 0)
                               } min totales</span>
                            </div>
                            <div className="bg-[#6B4BFF] text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-transform hover:scale-105">
                               <div className="bg-white/30 p-1.5 rounded">
                                  <Target className="w-4 h-4" />
                               </div>
                               <span>{
                                  (tiposPregunta.conocimientos ? (conteoPreguntas['conocimientos pedagógicos']?.puntos || 0) * (conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0) : 0) +
                                  (tiposPregunta.razonamiento ? (conteoPreguntas['razonamiento lógico']?.puntos || 0) * (conteoPreguntas['razonamiento lógico']?.cantidad || 0) : 0) +
                                  (tiposPregunta.comprension ? (conteoPreguntas['comprensión lectora']?.puntos || 0) * (conteoPreguntas['comprensión lectora']?.cantidad || 0) : 0)
                               } pts máximo</span>
                            </div>
                            <div className="bg-[#F6AD55] text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-transform hover:scale-105">
                               <div className="bg-white/30 p-1.5 rounded">
                                  <CheckCircle className="w-4 h-4" />
                               </div>
                               <span>{
                                  (tiposPregunta.conocimientos ? (conteoPreguntas['conocimientos pedagógicos']?.minimo || 0) : 0) +
                                  (tiposPregunta.razonamiento ? (conteoPreguntas['razonamiento lógico']?.minimo || 0) : 0) +
                                  (tiposPregunta.comprension ? (conteoPreguntas['comprensión lectora']?.minimo || 0) : 0)
                               } pts mínimo</span>
                            </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* Buttons */}
               <div className="flex justify-center gap-4 mt-6">
                  <button
                     onClick={handleClear}
                     className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-blue-50 transition-colors font-medium"
                  >
                     <XIcon className="h-4 w-4" />
                     Limpiar
                  </button>
                  <button
                     onClick={handleConfirm}
                     disabled={!selectedModalidadId || (nivelesData.length > 0 && !selectedNivelId) || (especialidadesData.length > 0 && !selectedEspecialidadId) || (aniosData.length > 0 && !selectedYear)}
                     className="flex items-center gap-2 px-6 py-2 bg-[#002B6B] text-white rounded-md hover:bg-blue-900 transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     Confirmar selección
                  </button>
               </div>

            </div>
         </div>
      </PremiumLayout>
   );
};

export default BancoPreguntasPage;
