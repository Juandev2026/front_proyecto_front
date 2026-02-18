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

import PremiumLayout from '../layouts/PremiumLayout';
import { useAuth } from '../hooks/useAuth';

/* 
  --- FUTURE API INTEGRATION ---
  Se usará para rellenar los selectores dinámicamente en el futuro.
  
  import { examenService } from '../services/examenService';
  import { premiumService, PremiumContent } from '../services/premiumService';
  import { modalidadService, Modalidad } from '../services/modalidadService';
  import { nivelService, Nivel } from '../services/nivelService';
  import { especialidadesService, Especialidad } from '../services/especialidadesService';
  
  export interface ExamenFlat {
    tipoExamenId: number;
    fuenteId: number;
    modalidadId: number;
    nivelId: number | null;
    especialidadId: number | null;
    year: string | null;
  }
*/

const MODALIDADES = [
  'Educación básica alternativa',
  'Educación básica Especial',
  'Educación básica Regular'
];

const NIVELES = [
  'Inicial-Intermedio'
];

const YEARS = Array.from({ length: 8 }, (_, i) => (2018 + i).toString()).reverse();

const BancoPreguntasPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // --- Current Selection State ---
  const [selectedModalidad, setSelectedModalidad] = useState<string>('');
  const [selectedNivel, setSelectedNivel] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

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
    setSelectedModalidad('');
    setSelectedNivel('');
    setSelectedYear('');
    setTiposPregunta({
      comprension: true,
      razonamiento: false,
      conocimientos: false
    });
  };

  const handleConfirm = () => {
     router.push('/examen');
  };

  const getSelectionSummary = () => {
    const parts = [];
    if (selectedModalidad) parts.push(`Modalidad: ${selectedModalidad}`);
    if (selectedNivel) parts.push(`Nivel: ${selectedNivel}`);
    if (selectedYear) parts.push(`Año: ${selectedYear}`);
    return parts;
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
                value={selectedModalidad}
                onChange={(e) => setSelectedModalidad(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                 <option value="">Selecciona Modalidad</option>
                 {MODALIDADES.map(m => (
                     <option key={m} value={m}>{m}</option>
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
                value={selectedNivel}
                onChange={(e) => setSelectedNivel(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                 <option value="">Selecciona Nivel</option>
                 {NIVELES.map(n => (
                     <option key={n} value={n}>{n}</option>
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
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                 <option value="">Selecciona Año</option>
                 {YEARS.map(y => (
                     <option key={y} value={y}>{y}</option>
                 ))}
              </select>
           </div>

           {/* Tipos de Pregunta */}
           <div className="border border-primary rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                 <QuestionMarkCircleIcon className="h-5 w-5" />
                 <span>Tipos de Pregunta*</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {/* Card 1 */}
                 <label className={`border rounded-lg p-4 flex flex-col gap-2 cursor-pointer transition-colors ${tiposPregunta.comprension ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-blue-50'}`}>
                    <div className="flex items-start gap-2">
                       <input 
                         type="checkbox" 
                         className="mt-1"
                         checked={tiposPregunta.comprension}
                         onChange={(e) => setTiposPregunta({...tiposPregunta, comprension: e.target.checked})}
                       />
                       <div>
                          <p className="font-semibold text-gray-700">Comprensión Lectora</p>
                          <p className="text-xs text-gray-400">0 preguntas (no disponible)</p>
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
                         onChange={(e) => setTiposPregunta({...tiposPregunta, razonamiento: e.target.checked})}
                       />
                       <div>
                          <p className="font-semibold text-gray-700">Razonamiento Lógico</p>
                          <p className="text-xs text-gray-400">0 preguntas (no disponible)</p>
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
                         onChange={(e) => setTiposPregunta({...tiposPregunta, conocimientos: e.target.checked})}
                       />
                       <div>
                          <p className="font-semibold text-gray-700">Conocimientos Curriculares y Pedagógicos</p>
                          <p className="text-xs text-gray-400">0 preguntas (no disponible)</p>
                       </div>
                    </div>
                 </label>
              </div>
              <p className="text-xs text-gray-500 mt-3">* Selecciona al menos un tipo de pregunta</p>
           </div>

           {/* Resumen de selección */}
           <div className="border border-primary rounded-lg p-4 bg-white min-h-[100px]">
              <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                 <AcademicCapIcon className="h-5 w-5" />
                 <span>Resumen de selección</span>
              </div>
              <div className="text-gray-500 text-sm">
                 {getSelectionSummary().length === 0 ? (
                    <p>No has seleccionado ninguna opción.</p>
                 ) : (
                    <div className="flex flex-col gap-1">
                       {getSelectionSummary().map((line, idx) => (
                           <p key={idx}><span className="font-semibold">{line.split(':')[0]}:</span> {line.split(':')[1]}</p>
                       ))}
                    </div>
                 )}
              </div>
           </div>

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
                 disabled={!selectedModalidad || !selectedNivel || !selectedYear}
                 className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-md hover:bg-primary transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                 Confirmar selección
              </button>
           </div>

        </div>
      </div>
    </PremiumLayout>
  );
};

export default BancoPreguntasPage;
