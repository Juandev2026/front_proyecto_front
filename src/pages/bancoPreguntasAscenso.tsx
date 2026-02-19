import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  AcademicCapIcon, 
  XIcon,
  FilterIcon,
  CalendarIcon
} from '@heroicons/react/outline';

import PremiumLayout from '../layouts/PremiumLayout';
import { useAuth } from '../hooks/useAuth';
import { estructuraAcademicaService } from '../services/estructuraAcademicaService';
import { ExamenLogin } from '../services/authService';

// ----- Types derived from login examenes -----
interface FilterOption { id: number; nombre: string; }

const BancoPreguntasAscensoPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Examenes from login response
  const [loginExamenes, setLoginExamenes] = useState<ExamenLogin[]>([]);

  // Form State
  const [selectedModalidadId, setSelectedModalidadId] = useState<number | ''>('');
  const [selectedNivelId, setSelectedNivelId] = useState<number | ''>('');
  const [selectedEspecialidadId, setSelectedEspecialidadId] = useState<number | ''>('');
  const [anio, setAnio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [tiposPregunta, setTiposPregunta] = useState({
    comprension: true,
    razonamiento: true,
    conocimientos: true
  });
  const [conteoPreguntas, setConteoPreguntas] = useState<{ [key: string]: {
    cantidad: number;
    puntos: number;
    tiempoPregunta: number;
    minimo: number;
  } }>({});

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
          // Filter specifically for Ascenso (tipoExamenId: 1)
          const filtered = parsed.filter(e => e.tipoExamenId === 1);
          setLoginExamenes(filtered);
          
          // Set default Modalidad if only one exists or default to EBR (26) if available
          const modalities = Array.from(new Map(parsed.map(e => [e.modalidadId, e.modalidadId])).values());
          if (modalities.length === 1) {
            setSelectedModalidadId(modalities[0] ?? '');
          } else if (modalities.includes(26)) {
             setSelectedModalidadId(26);
          }
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

  useEffect(() => {
    const updateCounts = () => {
      if (selectedModalidadId && selectedNivelId && selectedEspecialidadId && anio) {
        // Find the specific exam matching all filters
        const exam = loginExamenes.find(e => 
          e.modalidadId === selectedModalidadId &&
          e.nivelId === selectedNivelId &&
          e.especialidadId === selectedEspecialidadId &&
          e.year === anio
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
  }, [selectedModalidadId, selectedNivelId, selectedEspecialidadId, anio, loginExamenes]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0a192f]"></div>
      </div>
    );
  }

  const handleClear = () => {
    setSelectedModalidadId('');
    setSelectedNivelId('');
    setSelectedEspecialidadId('');
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
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={isLoading}
              >
                 <option value="">Selecciona Modalidad</option>
                 {modalidadesData.map(m => (
                     <option key={m.id} value={m.id}>{m.nombre}</option>
                 ))}
              </select>
           </div>

           {/* Nivel */}
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
                    setAnio(''); // Clear year when level changes
                }}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                disabled={!selectedModalidadId}
              >
                 <option value="">Seleccionar nivel</option>
                 {nivelesData.map(n => (
                     <option key={n.id} value={n.id}>{n.nombre}</option>
                 ))}
              </select>
           </div>

           {/* Especialidad */}
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
                    setAnio(''); // Clear year if specialty changes
                }}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                disabled={!selectedNivelId || especialidadesData.length === 0}
              >
                 <option value="">Selecciona Especialidad</option>
                 {especialidadesData.map(e => (
                     <option key={e.id} value={e.id}>{e.nombre}</option>
                 ))}
              </select>
           </div>

           {/* Año */}
           <div className="border border-primary rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                 <CalendarIcon className="h-5 w-5" />
                 <span>Elige un año</span>
              </div>
              <select 
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                disabled={!selectedEspecialidadId || aniosData.length === 0}
              >
                 <option value="">Selecciona Año</option>
                 {aniosData.map(year => (
                     <option key={year} value={year}>{year}</option>
                 ))}
              </select>
           </div>

           {/* Tipos de Pregunta */}
           <div className={`border border-primary rounded-lg p-6 bg-white shadow-sm transition-opacity duration-300 ${!anio ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
               <div className="flex items-center gap-2 mb-6 text-primary font-bold border-b pb-2">
                  <FilterIcon className="h-5 w-5" />
                  <span>Tipos de Pregunta*</span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                             onChange={(e) => setTiposPregunta({...tiposPregunta, comprension: e.target.checked})}
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
                             onChange={(e) => setTiposPregunta({...tiposPregunta, razonamiento: e.target.checked})}
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
                             onChange={(e) => setTiposPregunta({...tiposPregunta, conocimientos: e.target.checked})}
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
               </div>
               <p className="text-xs text-gray-500 mt-4 italic font-medium">* Selecciona al menos un tipo de pregunta</p>
           </div>

           {/* Tipos de Pregunta Seleccionados */}
           {(tiposPregunta.comprension || tiposPregunta.razonamiento || tiposPregunta.conocimientos) && (
               <div className="mt-10 space-y-6">
                  <h3 className="text-[#2B3674] font-bold text-2xl px-2">Tipos de Pregunta Seleccionados</h3>
                  
                  <div className="space-y-4">
                     {tiposPregunta.conocimientos && (
                        <div className="bg-[#EFEEFF] border border-blue-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-sm">
                           <div className="flex flex-col z-10">
                              <span className="text-[#2B3674] font-extrabold text-lg">Conocimientos Curriculares y Pedagógicos</span>
                              <div className="flex flex-wrap gap-2 mt-3">
                                  <span className="bg-[#D1E9FF] text-[#002B6B] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <div className="bg-primary w-5 h-5 rounded flex items-center justify-center text-[11px] text-white">Q</div>
                                    {conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0} preguntas
                                 </span>
                                 <span className="bg-[#D6FFD8] text-[#008000] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <span className="text-base">⭐</span> {conteoPreguntas['conocimientos pedagógicos']?.puntos || 0} pts/correcta
                                 </span>
                                 <span className="bg-[#FFE5E5] text-[#FF0000] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <span className="text-base">🎯</span> Máx: {(conteoPreguntas['conocimientos pedagógicos']?.puntos || 0) * (conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0)} pts
                                 </span>
                                 <span className="bg-[#FFF4D1] text-[#B8860B] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <span className="text-base">✅</span> Mínimo: {conteoPreguntas['conocimientos pedagógicos']?.minimo || 0} pts
                                 </span>
                                 <span className="bg-[#FFF9C4] text-[#856404] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <span className="text-base">⏱️</span> {conteoPreguntas['conocimientos pedagógicos']?.tiempoPregunta || 0} min/pregunta
                                 </span>
                                 <span className="bg-[#FDE2E2] text-[#E53E3E] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <span className="text-base">🕒</span> Total: {(conteoPreguntas['conocimientos pedagógicos']?.tiempoPregunta || 0) * (conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0)} min
                                 </span>
                              </div>
                           </div>
                           <div className="hidden md:flex items-center justify-center p-2">
                              <div className="bg-[#6B4BFF] text-white text-[11px] font-black rounded-lg px-3 py-1.5 uppercase shadow-sm">CCP</div>
                           </div>
                        </div>
                     )}

                     {tiposPregunta.razonamiento && (
                        <div className="bg-[#EFEEFF] border border-blue-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-sm">
                           <div className="flex flex-col z-10">
                              <span className="text-[#2B3674] font-extrabold text-lg">Razonamiento Lógico</span>
                              <div className="flex flex-wrap gap-2 mt-3">
                                  <span className="bg-[#D1E9FF] text-[#002B6B] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <div className="bg-primary w-5 h-5 rounded flex items-center justify-center text-[11px] text-white">Q</div>
                                    {conteoPreguntas['razonamiento lógico']?.cantidad || 0} preguntas
                                 </span>
                                 <span className="bg-[#D6FFD8] text-[#008000] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <span className="text-base">⭐</span> {conteoPreguntas['razonamiento lógico']?.puntos || 0} pts/correcta
                                 </span>
                                 <span className="bg-[#FFE5E5] text-[#FF0000] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <span className="text-base">🎯</span> Máx: {(conteoPreguntas['razonamiento lógico']?.puntos || 0) * (conteoPreguntas['razonamiento lógico']?.cantidad || 0)} pts
                                 </span>
                                 <span className="bg-[#FFF4D1] text-[#B8860B] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <span className="text-base">✅</span> Mínimo: {conteoPreguntas['razonamiento lógico']?.minimo || 0} pts
                                 </span>
                                 <span className="bg-[#FFF9C4] text-[#856404] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <span className="text-base">⏱️</span> {conteoPreguntas['razonamiento lógico']?.tiempoPregunta || 0} min/pregunta
                                 </span>
                                 <span className="bg-[#FDE2E2] text-[#E53E3E] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <span className="text-base">🕒</span> Total: {(conteoPreguntas['razonamiento lógico']?.tiempoPregunta || 0) * (conteoPreguntas['razonamiento lógico']?.cantidad || 0)} min
                                 </span>
                              </div>
                           </div>
                           <div className="hidden md:flex items-center justify-center p-2">
                              <div className="bg-[#4318FF] text-white text-[11px] font-black rounded-lg px-3 py-1.5 uppercase shadow-sm">RL</div>
                           </div>
                        </div>
                     )}

                     {tiposPregunta.comprension && (
                        <div className="bg-[#EFEEFF] border border-blue-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-sm">
                           <div className="flex flex-col z-10">
                              <span className="text-[#2B3674] font-extrabold text-lg">Comprensión Lectora</span>
                              <div className="flex flex-wrap gap-2 mt-3">
                                  <span className="bg-[#D1E9FF] text-[#002B6B] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <div className="bg-primary w-5 h-5 rounded flex items-center justify-center text-[11px] text-white">Q</div>
                                    {conteoPreguntas['comprensión lectora']?.cantidad || 0} preguntas
                                 </span>
                                 <span className="bg-[#D6FFD8] text-[#008000] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <span className="text-base">⭐</span> {conteoPreguntas['comprensión lectora']?.puntos || 0} pts/correcta
                                 </span>
                                 <span className="bg-[#FFE5E5] text-[#FF0000] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <span className="text-base">🎯</span> Máx: {(conteoPreguntas['comprensión lectora']?.puntos || 0) * (conteoPreguntas['comprensión lectora']?.cantidad || 0)} pts
                                 </span>
                                 <span className="bg-[#FFF4D1] text-[#B8860B] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <span className="text-base">✅</span> Mínimo: {conteoPreguntas['comprensión lectora']?.minimo || 0} pts
                                 </span>
                                 <span className="bg-[#FFF9C4] text-[#856404] px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
                                    <span className="text-base">⏱️</span> {conteoPreguntas['comprensión lectora']?.tiempoPregunta || 0} min/pregunta
                                 </span>
                                 <span className="bg-[#FDE2E2] text-[#E53E3E] px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-2">
                                    <span className="text-base">🕒</span> Total: {(conteoPreguntas['comprensión lectora']?.tiempoPregunta || 0) * (conteoPreguntas['comprensión lectora']?.cantidad || 0)} min
                                 </span>
                              </div>
                           </div>
                           <div className="hidden md:flex items-center justify-center p-2">
                              <div className="bg-[#01B9FF] text-white text-[11px] font-black rounded-lg px-3 py-1.5 uppercase shadow-sm">CL</div>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Resumen Total Section */}
                  <div className="bg-white border-2 border-[#E2E8F0] rounded-2xl p-6 mt-10 shadow-lg">
                     <div className="flex items-center gap-3 mb-6 text-[#2B3674] font-extrabold pb-3 border-b">
                        <span className="text-2xl">📊</span>
                        <span className="text-xl">Resumen Total</span>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[#4FACFE] text-white px-5 py-4 rounded-2xl flex items-center gap-3 font-extrabold shadow-md transform hover:scale-[1.02] transition-transform">
                           <div className="bg-white/25 p-2 rounded-lg flex items-center justify-center w-10 h-10 text-xl">📚</div>
                           <div className="flex flex-col">
                               <span className="text-2xl leading-none">{
                                 (tiposPregunta.conocimientos ? (conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0) : 0) +
                                 (tiposPregunta.razonamiento ? (conteoPreguntas['razonamiento lógico']?.cantidad || 0) : 0) +
                                 (tiposPregunta.comprension ? (conteoPreguntas['comprensión lectora']?.cantidad || 0) : 0)
                              }</span>
                               <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">preguntas totales</span>
                           </div>
                        </div>
                        <div className="bg-[#05CD99] text-white px-5 py-4 rounded-2xl flex items-center gap-3 font-extrabold shadow-md transform hover:scale-[1.02] transition-transform">
                           <div className="bg-white/25 p-2 rounded-lg flex items-center justify-center w-10 h-10 text-xl">🕒</div>
                           <div className="flex flex-col">
                               <span className="text-2xl leading-none">{
                                 (tiposPregunta.conocimientos ? (conteoPreguntas['conocimientos pedagógicos']?.tiempoPregunta || 0) * (conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0) : 0) +
                                 (tiposPregunta.razonamiento ? (conteoPreguntas['razonamiento lógico']?.tiempoPregunta || 0) * (conteoPreguntas['razonamiento lógico']?.cantidad || 0) : 0) +
                                 (tiposPregunta.comprension ? (conteoPreguntas['comprensión lectora']?.tiempoPregunta || 0) * (conteoPreguntas['comprensión lectora']?.cantidad || 0) : 0)
                              }</span>
                               <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">min totales</span>
                           </div>
                        </div>
                        <div className="bg-[#6B4BFF] text-white px-5 py-4 rounded-2xl flex items-center gap-3 font-extrabold shadow-md transform hover:scale-[1.02] transition-transform">
                           <div className="bg-white/25 p-2 rounded-lg flex items-center justify-center w-10 h-10 text-xl">🎯</div>
                           <div className="flex flex-col">
                               <span className="text-2xl leading-none">{
                                 (tiposPregunta.conocimientos ? (conteoPreguntas['conocimientos pedagógicos']?.puntos || 0) * (conteoPreguntas['conocimientos pedagógicos']?.cantidad || 0) : 0) +
                                 (tiposPregunta.razonamiento ? (conteoPreguntas['razonamiento lógico']?.puntos || 0) * (conteoPreguntas['razonamiento lógico']?.cantidad || 0) : 0) +
                                 (tiposPregunta.comprension ? (conteoPreguntas['comprensión lectora']?.puntos || 0) * (conteoPreguntas['comprensión lectora']?.cantidad || 0) : 0)
                              }</span>
                               <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">pts máximo</span>
                           </div>
                        </div>
                        <div className="bg-[#F6AD55] text-white px-5 py-4 rounded-2xl flex items-center gap-3 font-extrabold shadow-md transform hover:scale-[1.02] transition-transform">
                           <div className="bg-white/25 p-2 rounded-lg flex items-center justify-center w-10 h-10 text-xl">✅</div>
                           <div className="flex flex-col">
                               <span className="text-2xl leading-none">{
                                 (tiposPregunta.conocimientos ? (conteoPreguntas['conocimientos pedagógicos']?.minimo || 0) : 0) +
                                 (tiposPregunta.razonamiento ? (conteoPreguntas['razonamiento lógico']?.minimo || 0) : 0) +
                                 (tiposPregunta.comprension ? (conteoPreguntas['comprensión lectora']?.minimo || 0) : 0)
                              }</span>
                               <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">pts mínimo</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
           )}

           {/* Buttons */}
           <div className="flex justify-end gap-4 mt-6">
              <button 
                onClick={handleClear}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium bg-white"
              >
                 <XIcon className="h-4 w-4" />
                 Limpiar
              </button>
                <button 
                   onClick={async () => {
                      if (selectedModalidadId && selectedNivelId && anio) {
                        try {
                           setIsLoading(true);
                           
                           // Find the filtered exam to get actual classification IDs
                           const exams = JSON.parse(localStorage.getItem('loginExamenes') || '[]') as any[];
                           const exam = exams.find(e => 
                              e.modalidadId === Number(selectedModalidadId) && 
                              e.nivelId === Number(selectedNivelId) && 
                              e.year === anio &&
                              (selectedEspecialidadId ? e.especialidadId === Number(selectedEspecialidadId) : true)
                           );

                           console.log("Debug - Found Exam:", exam);
                           console.log("Debug - Selected Filters:", {
                              modalidad: selectedModalidadId,
                              nivel: selectedNivelId,
                              year: anio,
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
                             anio,
                             selectedEspecialidadId ? Number(selectedEspecialidadId) : undefined,
                             clasificacionIds
                           );

                           // Save metadata for badges in examen.tsx
                           const metadata = {
                              modalidad: modalidadesData.find(m => m.id === Number(selectedModalidadId))?.nombre,
                              nivel: nivelesData.find(n => n.id === Number(selectedNivelId))?.nombre,
                              especialidad: especialidadesData.find(e => e.id === Number(selectedEspecialidadId))?.nombre,
                              year: anio
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
                   }}
                   disabled={isLoading || !selectedModalidadId || (nivelesData.length > 0 && !selectedNivelId) || (especialidadesData.length > 0 && !selectedEspecialidadId) || (aniosData.length > 0 && !anio) || (!tiposPregunta.comprension && !tiposPregunta.razonamiento && !tiposPregunta.conocimientos)}
                   className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {isLoading ? 'Cargando...' : 'Confirmar selección'}
                </button>
           </div>

        </div>
      </div>
    </PremiumLayout>
  );
};

export default BancoPreguntasAscensoPage;
