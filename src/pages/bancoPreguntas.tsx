import React, { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  AcademicCapIcon, 
  QuestionMarkCircleIcon, 
  XIcon,
  FilterIcon,
  BookOpenIcon,
  CalendarIcon
} from '@heroicons/react/outline';

import PremiumLayout from '../layouts/PremiumLayout';
import { useAuth } from '../hooks/useAuth';
import { examenService } from '../services/examenService';
import { premiumService, PremiumContent } from '../services/premiumService';
import { modalidadService, Modalidad } from '../services/modalidadService';
import { nivelService, Nivel } from '../services/nivelService';
import { especialidadesService, Especialidad } from '../services/especialidadesService';

const TIPOS_EXAMEN = [
  { id: 1, nombre: 'Nombramiento' },
  { id: 2, nombre: 'Ascenso' },
  { id: 3, nombre: 'Directivos' },
];

export interface ExamenFlat {
  tipoExamenId: number;
  fuenteId: number;
  modalidadId: number;
  nivelId: number | null;
  especialidadId: number | null;
  year: string | null;
}

const BancoPreguntasPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // --- Data & Catalogs State ---
  const [groupedData, setGroupedData] = useState<ExamenFlat[]>([]);
  const [fuentes, setFuentes] = useState<PremiumContent[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);

  // --- Selection State ---
  const [selectedTipo, setSelectedTipo] = useState<number | ''>('');
  const [selectedFuente, setSelectedFuente] = useState<number | ''>('');
  const [selectedModalidad, setSelectedModalidad] = useState<number | ''>('');
  const [selectedNivel, setSelectedNivel] = useState<number | ''>('');
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<number | ''>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Checkbox State (Stateless types)
  const [tiposPregunta, setTiposPregunta] = useState({
    comprension: false,
    razonamiento: false,
    conocimientos: false
  });

  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- Initial Data Fetch ---
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoadingData(true);
        const [
          grouped,
          fuentesData,
          modalidadesData,
          nivelesData,
          especialidadesData
        ] = await Promise.all([
          examenService.getGrouped(),
          premiumService.getAll(),
          modalidadService.getAll(),
          nivelService.getAll(),
          especialidadesService.getAll()
        ]);

        // Aplanar la estructura jerárquica
        const flatData: ExamenFlat[] = [];
        grouped.forEach(examen => {
          if (!examen.fuentes || examen.fuentes.length === 0) {
             // Caso base si no hay fuentes (aunque raro)
             // flatData.push(...) - Omitir si no es útil
             return; 
          }
          examen.fuentes.forEach(fuente => {
             if (!fuente.modalidades || fuente.modalidades.length === 0) {
                 flatData.push({
                     tipoExamenId: examen.tipoExamenId,
                     fuenteId: fuente.fuenteId,
                     modalidadId: 0, // Placeholder or simply omit
                     nivelId: null,
                     especialidadId: null,
                     year: null
                 });
                 return;
             }
             fuente.modalidades.forEach(modalidad => {
                 if (!modalidad.niveles || modalidad.niveles.length === 0) {
                      flatData.push({
                          tipoExamenId: examen.tipoExamenId,
                          fuenteId: fuente.fuenteId,
                          modalidadId: modalidad.modalidadId,
                          nivelId: null,
                          especialidadId: null,
                          year: null
                      });
                      return;
                 }
                 modalidad.niveles.forEach(nivel => {
                      if (!nivel.especialidades || nivel.especialidades.length === 0) {
                          flatData.push({
                              tipoExamenId: examen.tipoExamenId,
                              fuenteId: fuente.fuenteId,
                              modalidadId: modalidad.modalidadId,
                              nivelId: nivel.nivelId,
                              especialidadId: null,
                              year: null
                          });
                          return;
                      }
                      nivel.especialidades.forEach(especialidad => {
                           if (!especialidad.years || especialidad.years.length === 0) {
                               flatData.push({
                                   tipoExamenId: examen.tipoExamenId,
                                   fuenteId: fuente.fuenteId,
                                   modalidadId: modalidad.modalidadId,
                                   nivelId: nivel.nivelId,
                                   especialidadId: especialidad.especialidadId,
                                   year: null
                               });
                               return;
                           }
                           especialidad.years.forEach(year => {
                               flatData.push({
                                   tipoExamenId: examen.tipoExamenId,
                                   fuenteId: fuente.fuenteId,
                                   modalidadId: modalidad.modalidadId,
                                   nivelId: nivel.nivelId,
                                   especialidadId: especialidad.especialidadId,
                                   year: year.year
                               });
                           });
                      });
                 });
             });
          });
        });

        setGroupedData(flatData);
        setFuentes(fuentesData);
        setModalidades(modalidadesData);
        setNiveles(nivelesData);
        setEspecialidades(especialidadesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // --- Cascading Logic (Derived State) ---

  // 1. Available FUENTES based on Tipo
  const availableFuentes = useMemo(() => {
    if (!selectedTipo) return [];
    const validIds = new Set(
      groupedData
        .filter(d => d.tipoExamenId === Number(selectedTipo))
        .map(d => d.fuenteId)
    );
    return fuentes.filter(f => validIds.has(f.id));
  }, [groupedData, fuentes, selectedTipo]);

  // 2. Available MODALIDADES based on Tipo + Fuente
  const availableModalidades = useMemo(() => {
    if (!selectedTipo || !selectedFuente) return [];
    const validIds = new Set(
      groupedData
        .filter(d => 
          d.tipoExamenId === Number(selectedTipo) && 
          d.fuenteId === Number(selectedFuente)
        )
        .map(d => d.modalidadId)
    );
    return modalidades.filter(m => validIds.has(m.id));
  }, [groupedData, modalidades, selectedTipo, selectedFuente]);

  // 3. Available NIVELES based on Tipo + Fuente + Modalidad
  const availableNiveles = useMemo(() => {
    if (!selectedTipo || !selectedFuente || !selectedModalidad) return [];
    const validIds = new Set(
      groupedData
        .filter(d => 
          d.tipoExamenId === Number(selectedTipo) && 
          d.fuenteId === Number(selectedFuente) &&
          d.modalidadId === Number(selectedModalidad) &&
          d.nivelId !== null // Filter out nulls
        )
        .map(d => d.nivelId)
    );
    return niveles.filter(n => validIds.has(n.id));
  }, [groupedData, niveles, selectedTipo, selectedFuente, selectedModalidad]);

  // 4. Available ESPECIALIDADES based on Tipo + Fuente + Modalidad + Nivel
  const availableEspecialidades = useMemo(() => {
    if (!selectedTipo || !selectedFuente || !selectedModalidad) return [];
    // Nivel is optional for filtering but if selected, refine further
    // Some records might have especialidad but no nivel? Usually hierarchy implies Nivel -> Especialidad
    
    const relevantData = groupedData.filter(d => 
      d.tipoExamenId === Number(selectedTipo) && 
      d.fuenteId === Number(selectedFuente) &&
      d.modalidadId === Number(selectedModalidad) &&
      (selectedNivel ? d.nivelId === Number(selectedNivel) : true) &&
      d.especialidadId !== null
    );

    const validIds = new Set(relevantData.map(d => d.especialidadId));
    return especialidades.filter(e => validIds.has(e.id));
  }, [groupedData, especialidades, selectedTipo, selectedFuente, selectedModalidad, selectedNivel]);

  // 5. Available YEARS based on all selections
  const availableYears = useMemo(() => {
    if (!selectedTipo || !selectedFuente || !selectedModalidad) return [];

    const relevantData = groupedData.filter(d => 
      d.tipoExamenId === Number(selectedTipo) && 
      d.fuenteId === Number(selectedFuente) &&
      d.modalidadId === Number(selectedModalidad) &&
      (selectedNivel ? d.nivelId === Number(selectedNivel) : true) &&
      (selectedEspecialidad ? d.especialidadId === Number(selectedEspecialidad) : true)
    );

    const years = new Set(relevantData.map(d => d.year).filter((y): y is string => !!y)); // Filter out empty strings
    return Array.from(years).sort().reverse();
  }, [groupedData, selectedTipo, selectedFuente, selectedModalidad, selectedNivel, selectedEspecialidad]);


  // --- Handlers ---
  const handleClear = () => {
    setSelectedTipo('');
    setSelectedFuente('');
    setSelectedModalidad('');
    setSelectedNivel('');
    setSelectedEspecialidad('');
    setSelectedYear('');
    setTiposPregunta({
      comprension: false,
      razonamiento: false,
      conocimientos: false
    });
  };

  const handleConfirm = () => {
     // Here you would typically navigate to the exam or start the test with the selected filters
     // For now, mirroring existing behavior:
     router.push('/examen');
  };

  const getSelectionSummary = () => {
    const parts = [];
    if (selectedTipo) parts.push(`Tipo: ${TIPOS_EXAMEN.find(t => t.id === Number(selectedTipo))?.nombre}`);
    if (selectedFuente) parts.push(`Fuente: ${fuentes.find(f => f.id === Number(selectedFuente))?.titulo}`);
    if (selectedModalidad) parts.push(`Modalidad: ${modalidades.find(m => m.id === Number(selectedModalidad))?.nombre}`);
    if (selectedNivel) parts.push(`Nivel: ${niveles.find(n => n.id === Number(selectedNivel))?.nombre}`);
    if (selectedEspecialidad) parts.push(`Especialidad: ${especialidades.find(e => e.id === Number(selectedEspecialidad))?.nombre}`);
    if (selectedYear) parts.push(`Año: ${selectedYear}`);
    return parts;
  };

  if (loading || !isAuthenticated || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
           
           {/* 1. Tipo de Examen */}
           <div className="border border-cyan-400 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-[#002B6B] font-bold">
                 <FilterIcon className="h-5 w-5" />
                 <span>Tipo de Examen</span>
              </div>
              <select 
                value={selectedTipo}
                onChange={(e) => {
                    setSelectedTipo(e.target.value ? Number(e.target.value) : '');
                    setSelectedFuente(''); // Reset downstream
                    setSelectedModalidad('');
                    setSelectedNivel('');
                    setSelectedEspecialidad('');
                    setSelectedYear('');
                }}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                 <option value="">Seleccionar Tipo</option>
                 {TIPOS_EXAMEN.map(t => (
                     <option key={t.id} value={t.id}>{t.nombre}</option>
                 ))}
              </select>
           </div>

           {/* 2. Fuente */}
           <div className={`border border-cyan-400 rounded-lg p-4 bg-white ${!selectedTipo ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 mb-3 text-[#002B6B] font-bold">
                 <BookOpenIcon className="h-5 w-5" />
                 <span>Fuente / Origen</span>
              </div>
              <select 
                value={selectedFuente}
                onChange={(e) => {
                    setSelectedFuente(e.target.value ? Number(e.target.value) : '');
                    setSelectedModalidad(''); // Reset downstream
                    setSelectedNivel('');
                    setSelectedEspecialidad('');
                    setSelectedYear('');
                }}
                disabled={!selectedTipo}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
              >
                 <option value="">Seleccionar Fuente</option>
                 {availableFuentes.map(f => (
                     <option key={f.id} value={f.id}>{f.titulo}</option>
                 ))}
              </select>
           </div>

           {/* 3. Modalidad */}
           <div className={`border border-cyan-400 rounded-lg p-4 bg-white ${!selectedFuente ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 mb-3 text-[#002B6B] font-bold">
                 <AcademicCapIcon className="h-5 w-5" />
                 <span>Modalidad</span>
              </div>
              <select 
                value={selectedModalidad}
                onChange={(e) => {
                    setSelectedModalidad(e.target.value ? Number(e.target.value) : '');
                    setSelectedNivel(''); // Reset downstream
                    setSelectedEspecialidad('');
                    setSelectedYear('');
                }}
                disabled={!selectedFuente}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
              >
                 <option value="">Seleccionar Modalidad</option>
                 {availableModalidades.map(m => (
                     <option key={m.id} value={m.id}>{m.nombre}</option>
                 ))}
              </select>
           </div>

           {/* 4. Nivel */}
            {availableNiveles.length > 0 && (
               <div className={`border border-cyan-400 rounded-lg p-4 bg-white ${!selectedModalidad ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-center gap-2 mb-3 text-[#002B6B] font-bold">
                     <AcademicCapIcon className="h-5 w-5" />
                     <span>Nivel</span>
                  </div>
                  <select 
                    value={selectedNivel}
                    onChange={(e) => {
                        setSelectedNivel(e.target.value ? Number(e.target.value) : '');
                        setSelectedEspecialidad('');
                        setSelectedYear('');
                    }}
                    disabled={!selectedModalidad}
                    className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
                  >
                     <option value="">Seleccionar Nivel</option>
                     {availableNiveles.map(n => (
                         <option key={n.id} value={n.id}>{n.nombre}</option>
                     ))}
                  </select>
               </div>
            )}

           {/* 5. Especialidad */}
           {availableEspecialidades.length > 0 && (
               <div className={`border border-cyan-400 rounded-lg p-4 bg-white ${!selectedModalidad ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-center gap-2 mb-3 text-[#002B6B] font-bold">
                     <AcademicCapIcon className="h-5 w-5" />
                     <span>Especialidad</span>
                  </div>
                  <select 
                    value={selectedEspecialidad}
                    onChange={(e) => {
                        setSelectedEspecialidad(e.target.value ? Number(e.target.value) : '');
                        setSelectedYear('');
                    }}
                    // Enable even if Nivel is not selected if it's available? 
                    // Usually depends on Nivel, but logic allows it if availableEspecialidades has items.
                    disabled={!selectedModalidad} 
                    className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
                  >
                     <option value="">Seleccionar Especialidad</option>
                     {availableEspecialidades.map(e => (
                         <option key={e.id} value={e.id}>{e.nombre}</option>
                     ))}
                  </select>
               </div>
           )}

           {/* 6. Año */}
           <div className={`border border-cyan-400 rounded-lg p-4 bg-white ${!selectedModalidad ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 mb-3 text-[#002B6B] font-bold">
                 <CalendarIcon className="h-5 w-5" />
                 <span>Año</span>
              </div>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={!selectedModalidad}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
              >
                 <option value="">Seleccionar Año</option>
                 {availableYears.map(y => (
                     <option key={y} value={y}>{y}</option>
                 ))}
              </select>
           </div>

           {/* Tipos de Pregunta */}
           <div className="border border-cyan-400 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-[#002B6B] font-bold">
                 <QuestionMarkCircleIcon className="h-5 w-5" />
                 <span>Tipos de Pregunta*</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {/* Card 1 */}
                 <label className={`border rounded-lg p-4 flex flex-col gap-2 cursor-pointer transition-colors ${tiposPregunta.comprension ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
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
                 <label className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2 opacity-60 cursor-not-allowed bg-gray-50">
                    <div className="flex items-start gap-2">
                       <input type="checkbox" className="mt-1" disabled />
                       <div>
                          <p className="font-semibold text-gray-700">Razonamiento Lógico</p>
                          <p className="text-xs text-gray-400">0 preguntas (no disponible)</p>
                       </div>
                    </div>
                 </label>

                 {/* Card 3 */}
                 <label className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2 opacity-60 cursor-not-allowed bg-gray-50">
                    <div className="flex items-start gap-2">
                       <input type="checkbox" className="mt-1" disabled />
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
           <div className="border border-cyan-400 rounded-lg p-4 bg-white min-h-[100px]">
              <div className="flex items-center gap-2 mb-3 text-[#002B6B] font-bold">
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
           <div className="flex justify-end gap-4 mt-6">
              <button 
                onClick={handleClear}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                 <XIcon className="h-4 w-4" />
                 Limpiar
              </button>
              <button 
                 onClick={handleConfirm}
                 disabled={!selectedTipo}
                 className="flex items-center gap-2 px-6 py-2 bg-[#002B6B] text-white rounded-md hover:bg-blue-900 transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                 Confirmar selección
              </button>
           </div>

        </div>
      </div>
    </PremiumLayout>
  );
};

export default BancoPreguntasPage;
