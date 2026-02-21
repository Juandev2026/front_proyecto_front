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
               // Filter for Nombramiento (tipoExamenId: 3)
               const filtered = parsed.filter(e => e.tipoExamenId === 3);
               setLoginExamenes(filtered);
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

   // Fetch question counts when filters are selected
   useEffect(() => {
      const updateCounts = async () => {
         if (selectedModalidadId && selectedNivelId && selectedEspecialidadId && selectedYear) {
            
            // Find metadata from login array for fallback values like 'minimo'
            const examMeta = loginExamenes.find(e =>
               e.modalidadId === selectedModalidadId &&
               e.nivelId === selectedNivelId &&
               e.especialidadId === selectedEspecialidadId &&
               e.year === selectedYear
            );

            // Fetch actual questions to get accurate counts (including sub-questions)
            try {
               const questions = await estructuraAcademicaService.getPreguntas(
                  Number(selectedModalidadId),
                  Number(selectedNivelId),
                  selectedYear,
                  Number(selectedEspecialidadId)
               );

               const countMap: { [key: string]: { cantidad: number; puntos: number; tiempoPregunta: number; minimo: number; } } = {};

               questions.forEach((q) => {
                  const name = (q.clasificacionNombre || '').toLowerCase();
                  let key = '';

                  // Robust mapping for classifications
                  if (name === 'ccp' || name.includes('pedagógico') || name.includes('conocimientos') || name.includes('curricular')) {
                     key = 'conocimientos pedagógicos';
                  } else if (name === 'cl' || name.includes('comprensión')) {
                     key = 'comprensión lectora';
                  } else if (name === 'rl' || name.includes('razonamiento')) {
                     key = 'razonamiento lógico';
                  } else {
                     key = name || 'otros'; 
                  }

                  if (!countMap[key]) {
                     // Try to find matching classification in meta for 'minimo' and 'tiempoPregunta' base
                     const metaClass = examMeta?.clasificaciones?.find(c => c.clasificacionNombre.toLowerCase().includes(name.split(' ')[0] || ''));
                     countMap[key] = {
                        cantidad: 0,
                        puntos: 0,
                        tiempoPregunta: metaClass?.tiempoPregunta || 2, // Default 2 min if missing
                        minimo: metaClass?.minimo || 0 // Default 0
                     };
                  }
                  
                  const entry = countMap[key];
                  // Count items (Subquestions or single question)
                  if (entry) {
                      if (q.subPreguntas && q.subPreguntas.length > 0) {
                         entry.cantidad += q.subPreguntas.length;
                         const subPoints = q.subPreguntas.reduce((acc, sub) => acc + (sub.puntos || 0), 0);
                         entry.puntos += subPoints;
                      } else {
                         entry.cantidad += 1;
                         entry.puntos += (q.puntos || 0);
                      }
                  }
               });

               // Calculate average time per question for display if needed, or keep metadata time
               // The UI displays "min/pregunta" and "Total min".
               // Total min = min/pregunta * cantidad. 
               // If we have varied times, this might be tricky. 
               // Let's rely on the metadata 'tiempoPregunta' for the rate, but use the new 'cantidad' for the total.


               // Sanity check: Ensure we have at least defaults
               ['conocimientos pedagógicos', 'comprensión lectora', 'razonamiento lógico'].forEach(k => {
                   const countEntry = countMap[k];
                   if (countEntry) {
                       // Fix average points per question for display (puntos / cantidad)
                       // distinct from total points.
                       // The UI shows: "{puntos} pts/correcta". 
                       // We can average it or use metadata. 
                       // Let's use metadata Puntos if available, else average.
                       if (countEntry.cantidad > 0) {
                           const avg = countEntry.puntos / countEntry.cantidad;
                           // Store AVERAGE in 'puntos' field because UI multiplies it by quantity for Max.
                           // Wait, UI does: `puntos * cantidad`. 
                           // So 'puntos' in state should be "points per question".
                           countEntry.puntos = parseFloat(avg.toFixed(2));
                       }
                   }
               });

               setConteoPreguntas(countMap);

               // Auto-uncheck categories if they have 0 questions
               setTiposPregunta(prev => ({
                  comprension: (countMap['comprensión lectora']?.cantidad || 0) > 0 ? prev.comprension : false,
                  razonamiento: (countMap['razonamiento lógico']?.cantidad || 0) > 0 ? prev.razonamiento : false,
                  conocimientos: (countMap['conocimientos pedagógicos']?.cantidad || 0) > 0 ? prev.conocimientos : false
               }));

            } catch (error) {
               console.error("Error fetching question counts:", error);
               setConteoPreguntas({});
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
            
            // Find the filtered exam to get actual classification IDs
            const exams = JSON.parse(localStorage.getItem('loginExamenes') || '[]') as any[];
            const exam = exams.find(e => 
               e.modalidadId === Number(selectedModalidadId) && 
               e.nivelId === Number(selectedNivelId) && 
               e.year === selectedYear &&
               (selectedEspecialidadId ? e.especialidadId === Number(selectedEspecialidadId) : true)
            );

            console.log("Debug - Found Exam:", exam);
            console.log("Debug - Selected Filters:", {
               modalidad: selectedModalidadId,
               nivel: selectedNivelId,
               year: selectedYear,
               especialidad: selectedEspecialidadId,
               tipos: tiposPregunta
            });

            const clasificacionIds: number[] = [];
            if (exam && exam.clasificaciones) {
               exam.clasificaciones.forEach((c: any) => {
                  const name = c.clasificacionNombre.toLowerCase();
                  const isConocimientos = name === 'ccp' || name.includes('pedagógico') || name.includes('conocimientos') || name.includes('curricular');
                  const isComprension = name === 'cl' || name.includes('comprensión');
                  const isRazonamiento = name === 'rl' || name.includes('razonamiento');

                  if (isComprension && tiposPregunta.comprension) clasificacionIds.push(c.clasificacionId);
                  else if (isRazonamiento && tiposPregunta.razonamiento) clasificacionIds.push(c.clasificacionId);
                  else if (isConocimientos && tiposPregunta.conocimientos) clasificacionIds.push(c.clasificacionId);
               });
            }

            console.log("Debug - Final ClasificacionIds:", clasificacionIds);

            const questions = await estructuraAcademicaService.getPreguntas(
               Number(selectedModalidadId),
               Number(selectedNivelId),
               selectedYear,
               selectedEspecialidadId ? Number(selectedEspecialidadId) : undefined,
               clasificacionIds
            );
            
            // Save metadata for badges in examen.tsx
            const metadata = {
               modalidad: modalidadesData.find(m => m.id === Number(selectedModalidadId))?.nombre,
               nivel: nivelesData.find(n => n.id === Number(selectedNivelId))?.nombre,
               especialidad: especialidadesData.find(e => e.id === Number(selectedEspecialidadId))?.nombre,
               year: selectedYear
            };
            
            localStorage.setItem('currentQuestions', JSON.stringify(questions));
            localStorage.setItem('currentExamMetadata', JSON.stringify(metadata));
            
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
            <title>Banco de Preguntas - Avendocente</title>
         </Head>

         <div className="w-full space-y-6">

            {/* Title and subtitle */}
            <div className="text-center py-4">
               <h3 className="text-2xl md:text-3xl font-extrabold text-[#4790FD]">Selecciona tus preferencias</h3>
               <p className="text-[#A3AED0] text-base mt-1 font-medium">Filtra paso a paso para encontrar el examen deseado</p>
            </div>

            {/* Form Container */}
            <div className="space-y-4">

               {/* 1. Modalidad */}
               <div className="border border-primary rounded-lg p-4 bg-white">
                  <div className="flex items-center gap-2 mb-3 text-[#4790FD] font-bold">
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
                     className="w-full max-w-full truncate border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
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
                  <div className="flex items-center gap-2 mb-3 text-[#4790FD] font-bold">
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
                     className="w-full max-w-full truncate border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
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
                  <div className="flex items-center gap-2 mb-3 text-[#4790FD] font-bold">
                     <AcademicCapIcon className="h-5 w-5" />
                     <span>Especialidad</span>
                  </div>
                  <select
                     value={selectedEspecialidadId}
                     onChange={(e) => {
                        const id = e.target.value === '' ? '' : Number(e.target.value);
                        setSelectedEspecialidadId(id);
                     }}
                     className="w-full max-w-full truncate border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
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
                  <div className="flex items-center gap-2 mb-3 text-[#4790FD] font-bold">
                     <CalendarIcon className="h-5 w-5" />
                     <span>Elige un año</span>
                  </div>
                  <select
                     value={selectedYear}
                     onChange={(e) => setSelectedYear(e.target.value)}
                     className="w-full max-w-full truncate border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                  <div className="flex items-center gap-2 mb-3 text-[#4790FD] font-bold">
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
                           <span className="text-[#4790FD] font-bold text-lg">Comprensión Lectora</span>
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
                           <span className="text-[#4790FD] font-bold text-lg">Razonamiento Lógico</span>
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
                           <span className="text-[#4790FD] font-bold uppercase text-sm">Conocimientos Curriculares y Pedagógicos</span>
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
                     <h3 className="text-[#4790FD] font-bold text-xl">Tipos de Pregunta Seleccionados</h3>

                     <div className="space-y-3">
                        {tiposPregunta.conocimientos && (
                           <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-[#4790FD]">
                              <div className="flex flex-col z-10 w-full">
                                 <span className="text-[#4790FD] font-bold text-lg">Conocimientos Curriculares y Pedagógicos</span>
                                 <div className="flex flex-wrap gap-3 mt-4">
                                    <span className="bg-gray-50 text-[#4790FD] px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <div className="bg-[#4790FD]/10 w-6 h-6 rounded flex items-center justify-center text-[11px] text-[#4790FD]">Q</div>
                                       {conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0} preguntas
                                    </span>
                                    <span className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <Star className="w-4 h-4 text-[#4790FD]" /> {conteoPreguntas['conocimientos pedagógicos']?.puntos || 0} pts/correcta
                                    </span>
                                    <span className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <Target className="w-4 h-4 text-[#4790FD]" /> Máx: {(conteoPreguntas['conocimientos pedagógicos']?.puntos || 0) * (conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0)} pts
                                    </span>
                                    <span className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <CheckCircle className="w-4 h-4 text-[#4790FD]" /> Mínimo: {conteoPreguntas['conocimientos pedagógicos']?.minimo || 0} pts
                                    </span>
                                    <span className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <Timer className="w-4 h-4 text-[#4790FD]" /> {conteoPreguntas['conocimientos pedagógicos']?.tiempoPregunta || 0} min/pregunta
                                    </span>
                                    <span className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <Clock className="w-4 h-4 text-[#4790FD]" /> Total: {(conteoPreguntas['conocimientos pedagógicos']?.tiempoPregunta || 0) * (conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0)} min
                                    </span>
                                 </div>
                              </div>
                              <div className="hidden md:flex items-center justify-center p-2 bg-gray-50 rounded-xl border border-gray-100">
                                 <div className="text-[#4790FD] text-[10px] font-bold uppercase">CCP</div>
                              </div>
                           </div>
                        )}

                        {tiposPregunta.razonamiento && (
                           <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-[#4790FD]">
                              <div className="flex flex-col z-10 w-full">
                                 <span className="text-[#4790FD] font-bold text-lg">Razonamiento Lógico</span>
                                 <div className="flex flex-wrap gap-3 mt-4">
                                    <span className="bg-gray-50 text-[#4790FD] px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <div className="bg-[#4790FD]/10 w-6 h-6 rounded flex items-center justify-center text-[11px] text-[#4790FD]">Q</div>
                                       {conteoPreguntas['razonamiento lógico']?.cantidad || 0} preguntas
                                    </span>
                                    <span className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <Star className="w-4 h-4 text-[#4790FD]" /> {conteoPreguntas['razonamiento lógico']?.puntos || 0} pts/correcta
                                    </span>
                                    <span className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <Target className="w-4 h-4 text-[#4790FD]" /> Máx: {(conteoPreguntas['razonamiento lógico']?.puntos || 0) * (conteoPreguntas['razonamiento lógico']?.cantidad || 0)} pts
                                    </span>
                                    <span className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <CheckCircle className="w-4 h-4 text-[#4790FD]" /> Mínimo: {conteoPreguntas['razonamiento lógico']?.minimo || 0} pts
                                    </span>
                                    <span className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <Timer className="w-4 h-4 text-[#4790FD]" /> {conteoPreguntas['razonamiento lógico']?.tiempoPregunta || 0} min/pregunta
                                    </span>
                                    <span className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <Clock className="w-4 h-4 text-[#4790FD]" /> Total: {(conteoPreguntas['razonamiento lógico']?.tiempoPregunta || 0) * (conteoPreguntas['razonamiento lógico']?.cantidad || 0)} min
                                    </span>
                                 </div>
                              </div>
                              <div className="hidden md:flex items-center justify-center p-2 bg-gray-50 rounded-xl border border-gray-100">
                                 <div className="text-[#4790FD] text-[10px] font-bold uppercase">RL</div>
                              </div>
                           </div>
                        )}

                        {tiposPregunta.comprension && (
                           <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-[#4790FD]">
                              <div className="flex flex-col z-10 w-full">
                                 <span className="text-[#4790FD] font-bold text-lg">Comprensión Lectora</span>
                                 <div className="flex flex-wrap gap-3 mt-4">
                                    <span className="bg-gray-50 text-[#4790FD] px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <div className="bg-[#4790FD]/10 w-6 h-6 rounded flex items-center justify-center text-[11px] text-[#4790FD]">Q</div>
                                       {conteoPreguntas['comprensión lectora']?.cantidad || 0} preguntas
                                    </span>
                                    <span className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <Star className="w-4 h-4 text-[#4790FD]" /> {conteoPreguntas['comprensión lectora']?.puntos || 0} pts/correcta
                                    </span>
                                    <span className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <Target className="w-4 h-4 text-[#4790FD]" /> Máx: {(conteoPreguntas['comprensión lectora']?.puntos || 0) * (conteoPreguntas['comprensión lectora']?.cantidad || 0)} pts
                                    </span>
                                    <span className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <CheckCircle className="w-4 h-4 text-[#4790FD]" /> Mínimo: {conteoPreguntas['comprensión lectora']?.minimo || 0} pts
                                    </span>
                                    <span className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <Timer className="w-4 h-4 text-[#4790FD]" /> {conteoPreguntas['comprensión lectora']?.tiempoPregunta || 0} min/pregunta
                                    </span>
                                    <span className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 border border-gray-100">
                                       <Clock className="w-4 h-4 text-[#4790FD]" /> Total: {(conteoPreguntas['comprensión lectora']?.tiempoPregunta || 0) * (conteoPreguntas['comprensión lectora']?.cantidad || 0)} min
                                    </span>
                                 </div>
                              </div>
                              <div className="hidden md:flex items-center justify-center p-2 bg-gray-50 rounded-xl border border-gray-100">
                                 <div className="text-[#4790FD] text-[10px] font-bold uppercase">CL</div>
                              </div>
                           </div>
                        )}
                     </div>

                     <div className="bg-white border border-gray-100 rounded-3xl p-8 mt-12 shadow-sm border-t-8 border-t-[#4790FD]">
                        <div className="flex items-center gap-4 mb-8 text-[#4790FD] font-black pb-4 border-b border-gray-50">
                           <div className="bg-[#4790FD]/10 p-3 rounded-2xl flex items-center justify-center text-3xl">
                              <BarChart3 className="w-8 h-8" />
                           </div>
                           <h4 className="text-2xl tracking-tight">Resumen Total de Evaluación</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                           <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl flex items-center gap-4 hover:bg-white hover:shadow-md transition-all group">
                              <div className="bg-[#4FACFE]/10 p-4 rounded-xl flex items-center justify-center w-14 h-14 text-[#4FACFE] group-hover:bg-[#4FACFE] group-hover:text-white transition-colors">
                                 <Library className="w-7 h-7" />
                              </div>
                              <div className="flex flex-col">
                                  <span className="text-3xl font-black text-[#2B3674] leading-none">{
                                     (tiposPregunta.conocimientos ? (conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0) : 0) +
                                     (tiposPregunta.razonamiento ? (conteoPreguntas['razonamiento lógico']?.cantidad || 0) : 0) +
                                     (tiposPregunta.comprension ? (conteoPreguntas['comprensión lectora']?.cantidad || 0) : 0)
                                  }</span>
                                  <span className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-widest mt-2">preguntas totales</span>
                              </div>
                           </div>
                           <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl flex items-center gap-4 hover:bg-white hover:shadow-md transition-all group">
                              <div className="bg-[#05CD99]/10 p-4 rounded-xl flex items-center justify-center w-14 h-14 text-[#05CD99] group-hover:bg-[#05CD99] group-hover:text-white transition-colors">
                                 <Clock className="w-7 h-7" />
                              </div>
                              <div className="flex flex-col">
                                  <span className="text-3xl font-black text-[#2B3674] leading-none">{
                                     (tiposPregunta.conocimientos ? (conteoPreguntas['conocimientos pedagógicos']?.tiempoPregunta || 0) * (conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0) : 0) +
                                     (tiposPregunta.razonamiento ? (conteoPreguntas['razonamiento lógico']?.tiempoPregunta || 0) * (conteoPreguntas['razonamiento lógico']?.cantidad || 0) : 0) +
                                     (tiposPregunta.comprension ? (conteoPreguntas['comprensión lectora']?.tiempoPregunta || 0) * (conteoPreguntas['comprensión lectora']?.cantidad || 0) : 0)
                                  }</span>
                                  <span className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-widest mt-2">min totales</span>
                              </div>
                           </div>
                           <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl flex items-center gap-4 hover:bg-white hover:shadow-md transition-all group">
                              <div className="bg-[#6B4BFF]/10 p-4 rounded-xl flex items-center justify-center w-14 h-14 text-[#6B4BFF] group-hover:bg-[#6B4BFF] group-hover:text-white transition-colors">
                                 <Target className="w-7 h-7" />
                              </div>
                              <div className="flex flex-col">
                                  <span className="text-3xl font-black text-[#2B3674] leading-none">{
                                     (tiposPregunta.conocimientos ? (conteoPreguntas['conocimientos pedagógicos']?.puntos || 0) * (conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0) : 0) +
                                     (tiposPregunta.razonamiento ? (conteoPreguntas['razonamiento lógico']?.puntos || 0) * (conteoPreguntas['razonamiento lógico']?.cantidad || 0) : 0) +
                                     (tiposPregunta.comprension ? (conteoPreguntas['comprensión lectora']?.puntos || 0) * (conteoPreguntas['comprensión lectora']?.cantidad || 0) : 0)
                                  }</span>
                                  <span className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-widest mt-2">pts máximo</span>
                              </div>
                           </div>
                           <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl flex items-center gap-4 hover:bg-white hover:shadow-md transition-all group">
                              <div className="bg-[#F6AD55]/10 p-4 rounded-xl flex items-center justify-center w-14 h-14 text-[#F6AD55] group-hover:bg-[#F6AD55] group-hover:text-white transition-colors">
                                 <CheckCircle className="w-7 h-7" />
                              </div>
                              <div className="flex flex-col">
                                  <span className="text-3xl font-black text-[#2B3674] leading-none">{
                                     (tiposPregunta.conocimientos ? (conteoPreguntas['conocimientos pedagógicos']?.minimo || 0) : 0) +
                                     (tiposPregunta.razonamiento ? (conteoPreguntas['razonamiento lógico']?.minimo || 0) : 0) +
                                     (tiposPregunta.comprension ? (conteoPreguntas['comprensión lectora']?.minimo || 0) : 0)
                                  }</span>
                                  <span className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-widest mt-2">pts mínimo</span>
                              </div>
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
                     className="flex items-center gap-2 px-6 py-2 bg-[#4790FD] text-white rounded-md hover:bg-[#357abd] transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
