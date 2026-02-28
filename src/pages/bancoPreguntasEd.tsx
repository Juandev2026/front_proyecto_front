import React, { useEffect, useState, useMemo } from 'react';
import {
  AcademicCapIcon,
  XIcon,
  ChevronDownIcon,
  FolderOpenIcon,
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

const BancoPreguntasEdPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [secciones, setSecciones] = useState<SeccionPropia[]>([]);
  const [selectedSeccionId, setSelectedSeccionId] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleConfirm = async () => {
    if (!selectedSeccion) return;

    setIsLoading(true);
    try {
      let allQuestions: any[] = [];
      
      // Para secciones propias, solemos buscar preguntas que coincidan con CUALQUIERA de sus categorías configuradas
      for (const cat of selectedSeccion.categorias) {
        const payload = {
          tipoExamenId: selectedSeccion.tipoExamenId,
          fuenteId: selectedSeccion.id,
          modalidadId: cat.modalidadId,
          nivelId: cat.nivelId,
          especialidadId: cat.especialidadId || 0,
          year: '0', // Por ahora asumimos '0' para ED
          clasificaciones: [], // Traer todas las clasificaciones habilitadas
        };

        const questions = await estructuraAcademicaService.getPreguntasByFilter(payload);
        allQuestions = [...allQuestions, ...questions];
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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

      <div className="w-full space-y-6 max-w-5xl mx-auto">
        {/* Banner Header */}
        <div className="bg-[#002855] rounded-lg p-8 text-center shadow-lg border border-blue-900 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500 opacity-10 rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-300 opacity-5 rounded-full translate-x-24 translate-y-24"></div>
          
          <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Banco de Preguntas ED
          </h2>
          <h3 className="text-blue-200 text-xl font-medium">
            {router.query.context === 'nombramiento' ? 'Nombramiento Docente' : 'Ascenso Docente'}
          </h3>
        </div>

        <div className="text-center py-2">
          <h4 className="text-2xl font-bold text-[#2B3674]">
            Selecciona tu sección de estudio
          </h4>
          <p className="text-[#A3AED0] text-sm font-medium">
            Estas son las secciones específicas disponibles para tu tipo de examen
          </p>
        </div>

        {/* Sección Selector */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3 text-[#2B3674] font-bold text-lg border-b border-gray-50 pb-4">
            <FolderOpenIcon className="h-6 w-6 text-primary" />
            <span>Examenes Propios ED ({secciones.length})</span>
          </div>

          <div className="relative group">
            <select
              value={selectedSeccionId}
              onChange={(e) => setSelectedSeccionId(Number(e.target.value))}
              className="w-full h-14 pl-5 pr-12 rounded-xl border-2 border-gray-100 bg-[#F4F7FE] text-[#2B3674] font-bold text-lg appearance-none focus:outline-none focus:border-primary transition-all cursor-pointer group-hover:bg-[#E9EDF7]"
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
            <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none">
              <ChevronDownIcon className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
          </div>

          {selectedSeccion && (
            <div className="mt-8 animate-fadeIn">
              <div className="bg-[#F8FAFF] rounded-2xl p-6 border border-blue-50 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-400 rounded-lg flex items-center justify-center text-white">
                         <ClipboardListIcon className="h-4 w-4" />
                      </div>
                      <h5 className="text-xl font-bold text-[#2B3674]">{selectedSeccion.nombre}</h5>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-3 py-1 bg-blue-100 text-[#4790FD] text-xs font-bold rounded-full border border-blue-200 uppercase">
                        Tipo: {selectedSeccion.tipoExamenNombre}
                      </span>
                      {selectedSeccion.descripcion && (
                        <span className="px-3 py-1 bg-green-100 text-[#05CD99] text-xs font-bold rounded-full border border-green-200">
                          {selectedSeccion.descripcion}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Question Type Breakdown */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Preguntas disponibles por tipo:</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'CCP', count: 3, color: 'bg-green-50 text-[#05CD99] border-green-100' },
                            { label: 'CL', count: 0, color: 'bg-gray-50 text-gray-400 border-gray-100' },
                            { label: 'RL', count: 0, color: 'bg-gray-50 text-gray-400 border-gray-100' },
                            { label: 'CG', count: 0, color: 'bg-gray-50 text-gray-400 border-gray-100' },
                        ].map((item, idx) => (
                            <div key={idx} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${item.color}`}>
                                <span className="text-sm font-bold opacity-80">{item.label}</span>
                                <span className="text-2xl font-black mt-1">{item.count}</span>
                            </div>
                        ))}
                    </div>
                    {/* Footnote matching screenshot */}
                    <div className="mt-4">
                         <p className="text-xs text-[#4790FD] italic font-medium">{selectedSeccion.descripcion}</p>
                    </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resumen de selección */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 overflow-hidden relative">
          <div className="flex items-center gap-3 text-[#2B3674] font-bold text-lg mb-6">
            <AcademicCapIcon className="h-6 w-6 text-primary" />
            <span>Resumen de selección</span>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sección</span>
              <div className="inline-flex px-4 py-2 bg-blue-50 text-[#4790FD] border border-blue-100 rounded-xl text-sm font-bold w-fit shadow-sm">
                {selectedSeccion?.nombre || 'Ninguna seleccionada'}
              </div>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#F4F7FE] opacity-40 rounded-full translate-x-12 -translate-y-12"></div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pb-12 pt-4">
          <button
            onClick={() => setSelectedSeccionId('')}
            className="px-8 py-3.5 border border-gray-200 rounded-2xl text-[#A3AED0] font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all text-sm group"
          >
            <XIcon className="h-5 w-5 group-hover:rotate-90 transition-transform" />
            Limpiar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !selectedSeccionId}
            className={`
              px-12 py-3.5 rounded-2xl font-bold shadow-xl transition-all text-sm min-w-[220px]
              ${
                !selectedSeccionId || isLoading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-primary text-white hover:bg-blue-600 hover:scale-[1.02] active:scale-95 shadow-[#4790FD]/20'
              }
            `}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Cargando...</span>
              </div>
            ) : (
              'Confirmar selección'
            )}
          </button>
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
