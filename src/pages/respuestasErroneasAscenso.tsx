import React, { useEffect, useState, useMemo } from 'react';

import {
  BookOpenIcon,
  ChevronDownIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/solid';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuth } from '../hooks/useAuth';
import PremiumLayout from '../layouts/PremiumLayout';
import { erroneasService, RespuestaErronea } from '../services/erroneasService';

const RespuestasErroneasAscensoPage = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [modalidad, setModalidad] = useState(
    'Educación Básica Alternativa - Inicial - Intermedio'
  );
  const [numPreguntas, setNumPreguntas] = useState('10 preguntas');
  const [erroneas, setErroneas] = useState<RespuestaErronea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchErroneas = async () => {
      if (user?.id) {
        try {
          setLoading(true);
          const data = await erroneasService.getByUser(user.id);
          setErroneas(data);
        } catch (error) {
          console.error('Error fetching erroneas:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (isAuthenticated && user?.id) {
      fetchErroneas();
    }
  }, [isAuthenticated, user?.id]);

  // Calculations
  const stats = useMemo(() => {
    const totalErrors = erroneas.length;
    const uniqueQuestions = new Set(erroneas.map((e) => e.preguntaId)).size;
    // Assuming 1.5 points per error as seen in the mockup, or we can adjust if there's a real field
    const pointsLost = (totalErrors * 1.5).toFixed(1);

    return { totalErrors, uniqueQuestions, pointsLost };
  }, [erroneas]);

  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: RespuestaErronea[] } = {};

    erroneas.forEach((item) => {
      const date = new Date(item.fechaCreacion);
      const options: any = { day: 'numeric', month: 'long', year: 'numeric' };
      const dateString = date.toLocaleDateString('es-ES', options);

      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      groups[dateString].push(item);
    });

    return Object.entries(groups)
      .map(([date, items]) => ({
        date,
        errors: items.length,
        points: items.length * 1.5,
        rawDate: items[0]?.fechaCreacion || '',
      }))
      .sort(
        (a, b) =>
          new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
      );
  }, [erroneas]);

  if (authLoading || (isAuthenticated && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0a192f]"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <PremiumLayout
      title="Respuestas Erróneas Ascenso"
      breadcrumb="Pages / Respuestas Erróneas Ascenso"
    >
      <Head>
        <title>Respuestas Erróneas Ascenso - Avendocente</title>
      </Head>

      <div className="w-full space-y-6">
        {/* Top Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Configuration (Green) */}
          <div className="bg-[#E6F4EA] rounded-xl p-6 border border-green-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-[#004d40]">
              <BookOpenIcon className="h-5 w-5" />
              <h2 className="font-bold text-lg">
                Perfecciona tu rendimiento corrigiendo tus errores
              </h2>
            </div>

            <p className="text-center font-medium text-gray-700 mb-4">
              Selecciona las preguntas a practicar.
              <span className="ml-1">👇</span>
            </p>

            <div className="space-y-4">
              {/* Modalidad Dropdown */}
              <div>
                <label className="text-xs font-semibold text-gray-600 ml-1">
                  Modalidad/Nivel/Especialidad
                </label>
                <div className="relative mt-1">
                  <select
                    value={modalidad}
                    onChange={(e) => setModalidad(e.target.value)}
                    className="w-full appearance-none border border-gray-300 rounded-md p-2 pr-8 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm shadow-sm"
                  >
                    <option>
                      Educación Básica Alternativa - Inicial - Intermedio
                    </option>
                    <option>Educación Básica Regular - Inicial</option>
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Fuente de Preguntas */}
              <div>
                <label className="text-xs font-semibold text-gray-600 ml-1">
                  Fuente de Preguntas
                </label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-gray-200 shadow-sm flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="text-red-500 focus:ring-red-500 rounded"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      MINEDU
                    </span>
                  </label>
                  <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-gray-200 shadow-sm flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="text-red-500 focus:ring-red-500 rounded"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Escala Docente
                    </span>
                  </label>
                </div>
              </div>

              {/* Numero de Preguntas */}
              <div>
                <label className="text-xs font-semibold text-gray-600 ml-1">
                  Número de Preguntas
                </label>
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
              <button className="w-full bg-[#00C853] hover:bg-green-600 text-white font-bold py-3 px-4 rounded-md shadow-md flex items-center justify-center gap-2 mt-4 transition-colors">
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
                <p className="text-3xl font-bold text-red-500">
                  {stats.totalErrors}
                </p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                  Errores Totales
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-500">
                  {stats.uniqueQuestions}
                </p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                  Preguntas Equivocadas
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-500">
                  {stats.pointsLost}
                </p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                  Puntos Perdidos
                </p>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-gray-600">
                    Categoría
                  </span>
                </div>
                <span className="text-sm font-bold text-red-500">
                  {user?.especialidad || 'No especificada'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-sm font-medium text-gray-600">Año</span>
                </div>
                <span className="text-sm font-bold text-orange-500">
                  {new Date().getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: History */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-[#002B6B]">
            <ClockIcon className="h-5 w-5" />
            <h2 className="font-bold text-lg">
              Historial de Preguntas Erróneas
            </h2>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Revisa las {groupedByDate.length} fechas y las preguntas que has
            respondido incorrectamente. Las más recientes aparecen primero.
          </p>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-semibold text-gray-600 ml-1">
                Filtrar por Categoría
              </label>
              <select className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm bg-gray-50">
                <option>Todas las categorías</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 ml-1">
                Filtrar por Fuente
              </label>
              <select className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm bg-gray-50">
                <option>Todas las fuentes</option>
              </select>
            </div>
          </div>

          {/* History List */}
          <div className="space-y-3">
            {groupedByDate.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                No tienes preguntas erróneas registradas.
              </div>
            ) : (
              groupedByDate.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <span className="font-bold text-gray-700 text-sm">
                    Errores - {item.date}
                  </span>

                  <div className="flex items-center gap-4">
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">
                      {item.errors} {item.errors === 1 ? 'error' : 'errores'}
                    </span>
                    <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-xs font-bold">
                      {item.points.toFixed(1)} pts
                    </span>
                    <ChevronDownIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PremiumLayout>
  );
};

export default RespuestasErroneasAscensoPage;
