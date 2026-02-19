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
import { estructuraAcademicaService, Modalidad } from '../services/estructuraAcademicaService';
// We'll use dynamic years instead of a static constant
// const YEARS = Array.from({ length: 8 }, (_, i) => (2018 + i).toString()).reverse();

const BancoPreguntasPage = () => {
   const { isAuthenticated, loading } = useAuth();
   const router = useRouter();

   // --- Current Selection State ---
   const [modalidades, setModalidades] = useState<Modalidad[]>([]);
   const [selectedModalidadId, setSelectedModalidadId] = useState<number | ''>('');
   const [selectedNivelId, setSelectedNivelId] = useState<number | ''>('');
   const [selectedEspecialidadId, setSelectedEspecialidadId] = useState<number | ''>('');
   const [selectedYear, setSelectedYear] = useState<string>('');
   const [isLoading, setIsLoading] = useState(true);
   const [conteoPreguntas, setConteoPreguntas] = useState<{ [key: string]: number }>({});
   const [isCounting, setIsCounting] = useState(false);

   /* 
     --- FUTURE API STATES ---
     const [groupedData, setGroupedData] = useState<ExamenFlat[]>([]);
     const [fuentes, setFuentes] = useState<PremiumContent[]>([]);
     const [modalidades, setModalidades] = useState<Modalidad[]>([]);
     const [niveles, setNiveles] = useState<Nivel[]>([]);
     const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
     const [isLoadingData, setIsLoadingData] = useState(true);
   */

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

   useEffect(() => {
      const fetchData = async () => {
         try {
            setIsLoading(true);
            const data = await estructuraAcademicaService.getAgrupados();
            setModalidades(data);
         } catch (error) {
            console.error("Error loading filters:", error);
         } finally {
            setIsLoading(false);
         }
      };
      if (isAuthenticated) {
         fetchData();
      }
   }, [isAuthenticated]);

   const modalidadesData = modalidades;
   const nivelesData = selectedModalidadId ? modalidades.find(m => m.id === selectedModalidadId)?.niveles || [] : [];
   const especialidadesData = selectedNivelId ? nivelesData.find(n => n.id === selectedNivelId)?.especialidades || [] : [];
   const aniosData = selectedNivelId ? nivelesData.find(n => n.id === selectedNivelId)?.anios || [] : [];

   useEffect(() => {
      const fetchCounts = async () => {
         if (selectedModalidadId && selectedNivelId && selectedYear) {
            try {
               setIsCounting(true);
               const counts = await estructuraAcademicaService.getConteoPreguntas(
                  Number(selectedModalidadId),
                  Number(selectedNivelId),
                  selectedYear
               );
               // Assuming counts is an array of { tipoPregunta: string, cantidad: number }
               const countMap: { [key: string]: number } = {};
               counts.forEach((item: any) => {
                  countMap[item.tipoPregunta.toLowerCase()] = item.cantidad;
               });
               setConteoPreguntas(countMap);
            } catch (error) {
               console.error("Error fetching counts:", error);
               setConteoPreguntas({});
            } finally {
               setIsCounting(false);
            }
         } else {
            setConteoPreguntas({});
         }
      };
      fetchCounts();
   }, [selectedModalidadId, selectedNivelId, selectedYear]);

   /* 
     --- FUTURE API EFFECT ---
     useEffect(() => {
       const fetchAllData = async () => {
         try {
           setIsLoadingData(true);
           const [grouped, fuentesData, modalidadesData, nivelesData, especialidadesData] = await Promise.all([
             examenService.getGrouped(),
             premiumService.getAll(),
             modalidadService.getAll(),
             nivelService.getAll(),
             especialidadesService.getAll()
           ]);
           // ... logic to flatten and set state
         } catch (error) { console.error(error); } finally { setIsLoadingData(false); }
       };
       if (isAuthenticated) fetchAllData();
     }, [isAuthenticated]);
   */

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
                  <label className={`border rounded-lg p-4 flex flex-col gap-2 cursor-pointer transition-colors ${tiposPregunta.comprension ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-blue-50'}`}>
                     <div className="flex items-start gap-2">
                        <input
                           type="checkbox"
                           className="mt-1"
                           checked={tiposPregunta.comprension}
                           onChange={(e) => setTiposPregunta({ ...tiposPregunta, comprension: e.target.checked })}
                        />
                        <div className="flex flex-col">
                           <span className="text-[#2B3674] font-bold text-lg">Comprensión Lectora</span>
                           <span className="text-[#05CD99] text-sm font-medium">
                              {isCounting ? 'Cargando...' : `${conteoPreguntas['comprensión lectora'] || 0} preguntas`}
                           </span>
                        </div>
                     </div>
                  </label>

                  {/* Card 2 */}
                  <label className={`border rounded-lg p-4 flex flex-col gap-2 cursor-pointer transition-colors ${tiposPregunta.razonamiento ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-blue-50'}`}>
                     <div className="flex items-start gap-2">
                        <input
                           type="checkbox"
                           className="mt-1"
                           checked={tiposPregunta.razonamiento}
                           onChange={(e) => setTiposPregunta({ ...tiposPregunta, razonamiento: e.target.checked })}
                        />
                        <div className="flex flex-col">
                           <span className="text-[#2B3674] font-bold text-lg">Razonamiento Lógico</span>
                           <span className="text-[#05CD99] text-sm font-medium">
                              {isCounting ? 'Cargando...' : `${conteoPreguntas['razonamiento lógico'] || 0} preguntas`}
                           </span>
                        </div>
                     </div>
                  </label>

                  {/* Card 3 */}
                  <label className={`border rounded-lg p-4 flex flex-col gap-2 cursor-pointer transition-colors ${tiposPregunta.conocimientos ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-blue-50'}`}>
                     <div className="flex items-start gap-2">
                        <input
                           type="checkbox"
                           className="mt-1"
                           checked={tiposPregunta.conocimientos}
                           onChange={(e) => setTiposPregunta({ ...tiposPregunta, conocimientos: e.target.checked })}
                        />
                        <div className="flex flex-col">
                           <span className="text-[#2B3674] font-bold uppercase text-sm">Conocimientos Curriculares y Pedagógicos</span>
                           <span className="text-[#05CD99] text-sm font-medium">
                              {isCounting ? 'Cargando...' : `${conteoPreguntas['conocimientos pedagógicos'] || 0} preguntas`}
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
                                       {conteoPreguntas['conocimientos pedagógicos'] || 0} preguntas
                                    </span>
                                    <span className="bg-[#D6FFD8] text-[#008000] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Star className="w-3.5 h-3.5" /> 3 pts/correcta
                                    </span>
                                    <span className="bg-[#FFE5E5] text-[#FF0000] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Target className="w-3.5 h-3.5" /> Máx: 120 pts
                                    </span>
                                    <span className="bg-[#FFF4D1] text-[#B8860B] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <CheckCircle className="w-3.5 h-3.5" /> Mínimo: 90 pts
                                    </span>
                                    <span className="bg-[#FFF9C4] text-[#856404] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Timer className="w-3.5 h-3.5" /> 3 min/pregunta
                                    </span>
                                    <span className="bg-[#FDE2E2] text-[#E53E3E] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Clock className="w-3.5 h-3.5" /> Total: 120min
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
                                       {conteoPreguntas['razonamiento lógico'] || 0} preguntas
                                    </span>
                                    <span className="bg-[#D6FFD8] text-[#008000] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Star className="w-3.5 h-3.5" /> 2 pts/correcta
                                    </span>
                                    <span className="bg-[#FFE5E5] text-[#FF0000] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Target className="w-3.5 h-3.5" /> Máx: 50 pts
                                    </span>
                                    <span className="bg-[#FFF4D1] text-[#B8860B] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <CheckCircle className="w-3.5 h-3.5" /> Mínimo: 16 pts
                                    </span>
                                    <span className="bg-[#FFF9C4] text-[#856404] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Timer className="w-3.5 h-3.5" /> 3 min/pregunta
                                    </span>
                                    <span className="bg-[#FDE2E2] text-[#E53E3E] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Clock className="w-3.5 h-3.5" /> Total: 75min
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
                                       {conteoPreguntas['comprensión lectora'] || 0} preguntas
                                    </span>
                                    <span className="bg-[#D6FFD8] text-[#008000] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Star className="w-3.5 h-3.5" /> 2 pts/correcta
                                    </span>
                                    <span className="bg-[#FFE5E5] text-[#FF0000] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Target className="w-3.5 h-3.5" /> Máx: 50 pts
                                    </span>
                                    <span className="bg-[#FFF4D1] text-[#B8860B] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <CheckCircle className="w-3.5 h-3.5" /> Mínimo: 14 pts
                                    </span>
                                    <span className="bg-[#FFF9C4] text-[#856404] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Timer className="w-3.5 h-3.5" /> 3 min/pregunta
                                    </span>
                                    <span className="bg-[#FDE2E2] text-[#E53E3E] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                       <Clock className="w-3.5 h-3.5" /> Total: 75min
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
                                 (tiposPregunta.conocimientos ? (conteoPreguntas['conocimientos pedagógicos'] || 0) : 0) +
                                 (tiposPregunta.razonamiento ? (conteoPreguntas['razonamiento lógico'] || 0) : 0) +
                                 (tiposPregunta.comprension ? (conteoPreguntas['comprensión lectora'] || 0) : 0)
                              } preguntas totales</span>
                           </div>
                           <div className="bg-[#05CD99] text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-transform hover:scale-105">
                              <div className="bg-white/30 p-1.5 rounded">
                                 <Clock className="w-4 h-4" />
                              </div>
                              <span>{
                                 (tiposPregunta.conocimientos ? 120 : 0) +
                                 (tiposPregunta.razonamiento ? 75 : 0) +
                                 (tiposPregunta.comprension ? 75 : 0)
                              } min totales</span>
                           </div>
                           <div className="bg-[#6B4BFF] text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-transform hover:scale-105">
                              <div className="bg-white/30 p-1.5 rounded">
                                 <Target className="w-4 h-4" />
                              </div>
                              <span>{
                                 (tiposPregunta.conocimientos ? 120 : 0) +
                                 (tiposPregunta.razonamiento ? 50 : 0) +
                                 (tiposPregunta.comprension ? 50 : 0)
                              } pts máximo</span>
                           </div>
                           <div className="bg-[#F6AD55] text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-transform hover:scale-105">
                              <div className="bg-white/30 p-1.5 rounded">
                                 <CheckCircle className="w-4 h-4" />
                              </div>
                              <span>{
                                 (tiposPregunta.conocimientos ? 90 : 0) +
                                 (tiposPregunta.razonamiento ? 16 : 0) +
                                 (tiposPregunta.comprension ? 14 : 0)
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
