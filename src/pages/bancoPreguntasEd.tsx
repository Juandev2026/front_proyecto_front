import React, { useEffect, useState, useMemo } from 'react';
import {
  AcademicCapIcon,
  XIcon,
  QuestionMarkCircleIcon,
  ClipboardListIcon,
} from '@heroicons/react/outline';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuth } from '../hooks/useAuth';
import PremiumLayout from '../layouts/PremiumLayout';
import { examenService } from '../services/examenService';
import { estructuraAcademicaService } from '../services/estructuraAcademicaService';

interface SeccionPropia {
  id: number;
  nombre: string;
  descripcion: string;
  tipoExamenId: number;
  tipoExamenNombre: string;
  visible: boolean;
  categorias: any[];
}

const TIPO_FULL_NAMES: Record<string, string> = {
  'CCP': 'Conocimientos Curriculares y Pedagógicos',
  'CL': 'Comprensión Lectora',
  'RL': 'Razonamiento Lógico',
  'CG': 'Conocimientos Generales',
};

const BancoPreguntasEdPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [secciones, setSecciones] = useState<SeccionPropia[]>([]);
  const [selectedSeccionId, setSelectedSeccionId] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [conteoPreguntas, setConteoPreguntas] = useState<Record<string, any>>({});
  const [tiposPregunta, setTiposPregunta] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const fetchSecciones = async () => {
    setIsLoading(true);
    try {
      const { context } = router.query;
      const data = await examenService.getPropios();
      
      // Mapeo de contexto a ID (1: Ascenso, 2: Nombramiento)
      const targetTipoExamenId = context === 'nombramiento' ? '2' : '1';
      
      const filtered = data
        .filter((s: any) => String(s.tipoExamenId) === targetTipoExamenId && s.visible)
        .map((s: any) => ({
          id: s.fuenteId || s.id,
          nombre: s.fuenteNombre || 'Sin nombre',
          descripcion: s.descripcion || '',
          tipoExamenId: s.tipoExamenId,
          tipoExamenNombre: s.tipoExamenNombre || (context === 'nombramiento' ? 'Nombramiento' : 'Ascenso'),
          visible: s.visible,
          categorias: s.examenesPropios || [],
        }));
      setSecciones(filtered);
      
      if (filtered.length > 0 && filtered[0]) {
        setSelectedSeccionId(filtered[0].id);
      }
    } catch (error) {
      console.error('Error fetching secciones propias:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSecciones();
    }
  }, [isAuthenticated]);

  const selectedSeccion = useMemo(() => {
    return secciones.find((s) => s.id === selectedSeccionId);
  }, [secciones, selectedSeccionId]);

  useEffect(() => {
    if (selectedSeccion && selectedSeccion.categorias) {
      const countMap: any = {};
      
      selectedSeccion.categorias.forEach((exam: any) => {
        if (exam.clasificaciones) {
          exam.clasificaciones.forEach((item: any) => {
            const name = item.clasificacionNombre;
            if (name) {
              const cantidad = item.cantidadPreguntas || 0;
              if (cantidad > 0) {
                if (!countMap[name]) {
                  countMap[name] = {
                    id: item.clasificacionId,
                    cantidad: 0,
                    puntos: item.puntos || 0,
                    tiempoPregunta: item.tiempoPregunta || 0,
                    minimo: item.minimo || 0,
                  };
                }
                countMap[name].cantidad += cantidad;
              }
            }
          });
        }
      });
      
      setConteoPreguntas(countMap);
      
      // Auto-check categories that have questions
      const initialTipos: Record<string, boolean> = {};
      Object.keys(countMap).forEach(name => {
        initialTipos[name] = true;
      });
      setTiposPregunta(initialTipos);
    } else {
      setConteoPreguntas({});
      setTiposPregunta({});
    }
  }, [selectedSeccion]);

  const handleConfirm = async () => {
    if (!selectedSeccion) return;

    // Get selected classification IDs
    const selectedClasificacionIds = Object.entries(conteoPreguntas)
      .filter(([name]) => tiposPregunta[name])
      .map(([_, data]) => data.id);

    if (selectedClasificacionIds.length === 0) {
      alert('Por favor, selecciona al menos un tipo de pregunta.');
      return;
    }

    setIsLoading(true);
    try {
      let allQuestions: any[] = [];
      
      for (const cat of selectedSeccion.categorias) {
        const payload = {
          tipoExamenId: selectedSeccion.tipoExamenId,
          fuenteId: selectedSeccion.id,
          modalidadId: cat.modalidadId,
          nivelId: cat.nivelId,
          especialidadId: cat.especialidadId || 0,
          year: '0',
          clasificaciones: selectedClasificacionIds,
        };

        const questions = await estructuraAcademicaService.getPreguntasByFilter(payload);
        
        // Local Filter Patch just in case
        const filteredQuestions = questions.filter(q => 
          q.clasificacionId !== undefined && selectedClasificacionIds.includes(q.clasificacionId)
        );

        allQuestions = [...allQuestions, ...filteredQuestions];
      }

      // Eliminar duplicados si los hay (por id de pregunta)
      const uniqueQuestions = Array.from(new Map(allQuestions.map(q => [q.id, q])).values());

      const metadata = {
        modalidad: selectedSeccion.nombre,
        nivel: "Exámenes Propios",
        year: "Único",
      };

      localStorage.setItem('currentQuestions', JSON.stringify(uniqueQuestions));
      localStorage.setItem('currentExamMetadata', JSON.stringify(metadata));

      router.push('/examen');
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Hubo un error al cargar las preguntas.');
    } finally {
      setIsLoading(false);
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
    <PremiumLayout
      title="Banco de Preguntas ED"
      breadcrumb="Pages / Banco de Preguntas ED"
    >
      <Head>
        <title>Banco de Preguntas ED - AVENDOCENTE</title>
      </Head>

      <div className="w-full space-y-6">
        <div className="text-center py-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-[#2B3674]">
            Banco de Preguntas ED
          </h3>
          <p className="text-[#A3AED0] text-base mt-1 font-medium">
            Selecciona tu sección de estudio para practicar hoy
          </p>
        </div>

        <div className="space-y-4">
          {/* Sección / Fuente Selector */}
          <div className="border border-primary rounded-lg p-4 bg-white transition-all shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-primary font-bold">
              <ClipboardListIcon className="h-5 w-5" />
              <span>Exámenes Propios ED</span>
              <span className="ml-auto bg-blue-50 text-blue-600 px-3 py-0.5 rounded-full text-xs font-bold ring-1 ring-blue-100">
                {secciones.length} Disponibles
              </span>
            </div>
            <select
              value={selectedSeccionId}
              onChange={(e) => setSelectedSeccionId(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              disabled={isLoading || secciones.length === 0}
            >
              {secciones.length === 0 ? (
                <option value="">No hay secciones disponibles</option>
              ) : (
                secciones.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))
              )}
            </select>
            
            {selectedSeccion && (
              <div className="mt-4 p-5 bg-[#F0F7FF] rounded-2xl border border-blue-100 shadow-sm animate-fadeIn">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <ClipboardListIcon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[#2B3674] font-black">{selectedSeccion.nombre}</span>
                    <div className="flex gap-2 mt-1">
                      <span className="px-3 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Tipo: {selectedSeccion.tipoExamenNombre}
                      </span>
                      {selectedSeccion.descripcion && (
                        <span className="px-3 py-0.5 bg-green-100 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                          {selectedSeccion.descripcion}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-blue-50 p-4 shadow-sm">
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 text-center">
                     PREGUNTAS DISPONIBLES POR TIPO:
                   </p>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['CCP', 'CL', 'RL', 'CG'].map((label) => {
                        const data = conteoPreguntas[label];
                        const count = data ? data.cantidad : 0;
                        return (
                          <div key={label} className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${count > 0 ? 'bg-[#F0FFF4]/30 border-green-100 text-[#05CD99]' : 'bg-gray-50/50 border-gray-100 text-gray-300'}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                            <span className="text-xl font-black">{count}</span>
                          </div>
                        );
                      })}
                   </div>
                </div>
                
                {selectedSeccion.descripcion && (
                  <p className="text-xs text-blue-500 font-bold mt-3 ml-1 underline cursor-default">
                    {selectedSeccion.descripcion}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 2. Tipos de Pregunta Checkboxes */}
          <div className="border border-primary rounded-lg p-5 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-primary font-bold">
              <QuestionMarkCircleIcon className="h-5 w-5" />
              <span>Tipos de Pregunta*</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {['CL', 'RL', 'CCP'].map((shortName) => {
                const fullName = TIPO_FULL_NAMES[shortName] || shortName;
                const data = conteoPreguntas[shortName];
                const available = (data?.cantidad || 0) > 0;
                const isSelected = tiposPregunta[shortName];

                return (
                  <label
                    key={shortName}
                    className={`relative border-2 rounded-xl p-5 flex items-center gap-4 transition-all ${
                      !available 
                        ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' 
                        : isSelected
                          ? 'border-blue-600 bg-blue-50 shadow-md ring-1 ring-blue-600'
                          : 'border-gray-200 bg-white hover:border-blue-200 cursor-pointer'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${
                        isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                      }`}>
                        {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                        <input
                          type="checkbox"
                          className="sr-only"
                          disabled={!available}
                          checked={isSelected || false}
                          onChange={(e) =>
                            setTiposPregunta({
                              ...tiposPregunta,
                              [shortName]: e.target.checked,
                            })
                          }
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col flex-1">
                      <span className={`font-black text-sm leading-tight ${available ? 'text-[#2B3674]' : 'text-gray-400'}`}>
                        {fullName}
                      </span>
                      <span className={`text-[11px] font-bold mt-1 ${available ? 'text-[#05CD99]' : 'text-gray-400'}`}>
                        {data?.cantidad || 0} preguntas {available ? '' : '(no disponible)'} <span className="text-[10px] text-gray-400 uppercase ml-1">{shortName}</span>
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
            
            <p className="text-[11px] text-[#A3AED0] mt-4 font-medium italic">
              * Selecciona al menos un tipo de pregunta. Los tipos en gris no tienen preguntas disponibles en esta sección.
            </p>
          </div>

          {/* 3. Selección Detallada Blocks - Refined Badges */}
          {Object.entries(tiposPregunta).some(([_, checked]) => checked) && (
            <div className="mt-8 space-y-6 bg-white border border-gray-100 rounded-3xl p-6 shadow-xl shadow-gray-100/50">
               <h3 className="font-extrabold text-[#2B3674] text-xl mb-2 ml-2">
                 Tipos de Pregunta Seleccionados
               </h3>

               <div className="space-y-4">
                 {Object.entries(conteoPreguntas).map(([shortName, data]) => {
                   if (!tiposPregunta[shortName]) return null;
                   const fullName = TIPO_FULL_NAMES[shortName] || shortName;
                   const maxPts = data.cantidad * (data.puntos || 0);
                   const totalTime = data.cantidad * (data.tiempoPregunta || 0);

                   return (
                     <div key={shortName} className="bg-[#F8FBFF] border border-blue-100 rounded-[2rem] p-6 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full translate-x-16 -translate-y-16 blur-xl group-hover:scale-110 transition-transform"></div>
                       
                       <div className="flex justify-between items-start mb-5 relative z-10">
                          <div>
                            <h4 className="text-[#344079] font-black text-lg mb-1">{fullName}</h4>
                          </div>
                          <div className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-indigo-200">
                            {shortName}
                          </div>
                       </div>

                       <div className="flex flex-wrap gap-3 relative z-10">
                          {/* 1. Cantidad Badge */}
                          <div className="flex items-center gap-2 bg-[#E1F1FF] text-[#0075FF] px-4 py-1.5 rounded-full border border-blue-100 shadow-sm">
                             <div className="w-5 h-5 bg-white/50 rounded-md flex items-center justify-center text-xs">📝</div>
                             <span className="text-xs font-black uppercase tracking-tight">{data.cantidad} preguntas disponibles</span>
                          </div>

                          {/* 2. Puntos/c Badge */}
                          <div className="flex items-center gap-2 bg-[#E6FFF1] text-[#05CD99] px-4 py-1.5 rounded-full border border-green-100 shadow-sm">
                             <div className="w-5 h-5 bg-white/50 rounded-md flex items-center justify-center text-xs text-yellow-500">⭐</div>
                             <span className="text-xs font-black uppercase tracking-tight">{data.puntos || 0} pts/correcta</span>
                          </div>

                          {/* 3. Máx Posible Badge */}
                          <div className="flex items-center gap-2 bg-[#FEECEC] text-[#FF5B5B] px-4 py-1.5 rounded-full border border-red-100 shadow-sm">
                             <div className="w-5 h-5 bg-white/50 rounded-md flex items-center justify-center text-xs">🎯</div>
                             <span className="text-xs font-black uppercase tracking-tight">Máx posible: {maxPts} pts</span>
                          </div>

                          {/* 4. Mínimo Badge */}
                          <div className="flex items-center gap-2 bg-[#FFF4E5] text-[#FF9933] px-4 py-1.5 rounded-full border border-orange-100 shadow-sm">
                             <div className="w-5 h-5 bg-white/50 rounded-md flex items-center justify-center text-xs">✅</div>
                             <span className="text-xs font-black uppercase tracking-tight">Mínimo recomendado: {data.minimo || 90} pts</span>
                          </div>

                          {/* 5. Min/p Badge */}
                          <div className="flex items-center gap-2 bg-[#FEFCE8] text-[#A16207] px-4 py-1.5 rounded-full border border-yellow-100 shadow-sm">
                             <div className="w-5 h-5 bg-white/50 rounded-md flex items-center justify-center text-xs">⏱️</div>
                             <span className="text-xs font-black uppercase tracking-tight">{data.tiempoPregunta || 3} min/pregunta</span>
                          </div>

                          {/* 6. Tiempo Total Badge */}
                          <div className="flex items-center gap-2 bg-[#FFF1F2] text-[#E11D48] px-4 py-1.5 rounded-full border border-red-100 shadow-sm">
                             <div className="w-5 h-5 bg-white/50 rounded-md flex items-center justify-center text-xs">⌚</div>
                             <span className="text-xs font-black uppercase tracking-tight">Tiempo total: {totalTime || (data.cantidad * 3)}min</span>
                          </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          )}

          {/* 4. Resumen de selección Block Final */}
          {selectedSeccion && (
            <div className="border border-[#BEE3F8] rounded-[2.5rem] p-8 md:p-10 bg-white shadow-2xl shadow-blue-900/5 mt-10 animate-fadeIn">
              <div className="flex items-center gap-3 mb-8 text-[#2B3674] font-black text-2xl">
                <AcademicCapIcon className="h-8 w-8 text-blue-600" />
                <span className="tracking-tight">Resumen de selección</span>
              </div>

              <div className="space-y-8">
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-black text-[#A3AED0] uppercase tracking-[0.2em] ml-1">Sección</span>
                  <div className="inline-flex px-5 py-3 bg-[#E1F1FF] text-[#0075FF] border border-[#BEE3F8] rounded-2xl text-base font-black w-fit shadow-sm">
                    {selectedSeccion.nombre}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-xs font-black text-[#A3AED0] uppercase tracking-[0.2em] ml-1">Tipos de Pregunta</span>
                  <div className="flex flex-col gap-3">
                    {Object.entries(tiposPregunta).map(([shortName, checked]) => {
                      if (!checked) return null;
                      const data = conteoPreguntas[shortName];
                      const fullName = TIPO_FULL_NAMES[shortName] || shortName;
                      return (
                        <div key={shortName} className="inline-flex px-5 py-3 bg-[#F4ECFF] text-[#7A00FF] border border-[#E9D8FD] rounded-2xl text-base font-black w-fit shadow-sm">
                          {fullName} ({shortName}) - {data?.cantidad || 0} preguntas
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-5 mt-12 pt-8 border-t border-gray-50">
                <button
                  onClick={() => {
                    setSelectedSeccionId('');
                    setTiposPregunta({});
                  }}
                  className="px-10 py-5 border-2 border-[#BEE3F8] rounded-2xl text-[#607D8B] font-black text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                >
                  <XIcon className="h-6 w-6 group-hover:rotate-90 transition-all" />
                  Limpiar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading || !selectedSeccionId || !Object.values(tiposPregunta).some(c => c)}
                  className="px-12 py-5 bg-[#0a192f] text-white rounded-2xl font-black text-lg hover:scale-105 hover:shadow-2xl hover:shadow-blue-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-110 shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Cargando...</span>
                    </div>
                  ) : (
                    'Confirmar selección'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </PremiumLayout>
  );
};

export default BancoPreguntasEdPage;
