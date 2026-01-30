import React, { useState } from 'react';

import {
  PlusIcon,
  SearchIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  EyeOffIcon,
  MenuIcon,
} from '@heroicons/react/outline';

import AdminLayout from '../../../components/AdminLayout';

// Interfaz para definir la estructura de datos
interface Seccion {
  id: number;
  nombre: string;
  descripcion: string;
  tipoExamen: 'Ascenso' | 'Nombramiento' | 'Directivos' | string;
  estado: 'Visible' | 'Oculta';
  categoriasCount: number;
}

// Add this helper function before the component
const getExamTypeStyles = (tipoExamen: string): string => {
  const styleMap: Record<string, string> = {
    Ascenso: 'bg-green-100 text-green-800',
    Nombramiento: 'bg-blue-100 text-blue-800',
  };
  return styleMap[tipoExamen] || 'bg-purple-100 text-purple-800';
};

const AdminPremiumSecciones = () => {
  // --- ESTADOS ---
  // Mock Data (Datos de prueba basados en tu imagen)
  const [secciones, setSecciones] = useState<Seccion[]>([
    {
      id: 1,
      nombre: 'Seccion de prueba',
      descripcion: 'asdasdas',
      tipoExamen: 'Ascenso',
      estado: 'Oculta',
      categoriasCount: 1,
    },
    {
      id: 2,
      nombre: 'examen alfa 1',
      descripcion: 'Seccion de prueba...',
      tipoExamen: 'Nombramiento',
      estado: 'Oculta',
      categoriasCount: 1,
    },
    {
      id: 3,
      nombre: 'prueba examen beta',
      descripcion: 'nuevo examen',
      tipoExamen: 'Nombramiento',
      estado: 'Oculta',
      categoriasCount: 1,
    },
    // Puedes agregar más datos aquí para probar la paginación
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [seccionToDelete, setSeccionToDelete] = useState<number | null>(null);

  // --- LÓGICA DE FILTRADO ---
  const filteredSecciones = secciones.filter((item) => {
    const matchesSearch = item.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === '' || item.tipoExamen === filterType;
    return matchesSearch && matchesFilter;
  });

  // --- HANDLERS (Simulados) ---
  const handleEdit = (id: number) => console.log('Editar', id);
  const handleView = (id: number) => console.log('Ver', id);
  const handleDelete = (id: number) => {
    setSeccionToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (seccionToDelete !== null) {
      setSecciones((prev) => prev.filter((s) => s.id !== seccionToDelete));
    }
    setShowDeleteConfirm(false);
    setSeccionToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setSeccionToDelete(null);
  };

  return (
    <AdminLayout>
      {/* --- HEADER --- */}
      <div className="bg-primary text-white p-6 rounded-t-lg mb-6 flex justify-center items-center shadow-lg">
        <h1 className="text-2xl font-bold">Administrar Secciones</h1>
      </div>

      {/* --- INFO BOX --- */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
        <span className="text-yellow-500 mr-2 text-lg">💡</span>
        <p className="text-blue-800 text-sm">
          <span className="font-bold">Consejo:</span> Puedes reordenar las
          secciones arrastrándolas con el ícono de líneas paralelas.
        </p>
      </div>

      {/* --- ACTIONS HEADER --- */}
      <div className="flex gap-4 mb-8">
        <button className="bg-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-md transition-colors">
          <PlusIcon className="w-5 h-5 mr-2" />
          Nueva sección
        </button>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-800 mb-1">
            {secciones.length}
          </span>
          <span className="text-gray-500 font-medium">Secciones Total</span>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-800 mb-1">
            {secciones.filter((s) => s.estado === 'Visible').length}
          </span>
          <span className="text-gray-500 font-medium">Secciones Visibles</span>
        </div>
      </div>

      {/* --- FILTROS Y BUSQUEDA --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Buscador */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Buscar Sección
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filtro */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filtrar por Tipo
            </label>
            <select
              className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="Ascenso">Ascenso</option>
              <option value="Nombramiento">Nombramiento</option>
              <option value="Directivos">Directivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- TABLA DE SECCIONES --- */}
      <div className="space-y-4">
        {filteredSecciones.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">
                No se encontraron secciones con esos criterios.
              </p>
            </div>
          </div>
        ) : (
          filteredSecciones.map((seccion) => (
            <div
              key={seccion.id}
              className="bg-white rounded-lg border border-primary/30 shadow-sm overflow-hidden"
            >
              {/* Sección Header */}
              <div className="p-4 flex items-center justify-between bg-white">
                <div className="flex items-center flex-1">
                  <MenuIcon className="w-5 h-5 text-gray-400 mr-4 cursor-move" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {seccion.nombre}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {seccion.descripcion}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mr-4">
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full mr-2 ${getExamTypeStyles(
                        seccion.tipoExamen
                      )}`}
                    >
                      {seccion.tipoExamen}
                    </span>
                    <span
                      className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                        seccion.estado === 'Oculta'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {seccion.estado === 'Oculta' && (
                        <EyeOffIcon className="w-3 h-3 mr-1" />
                      )}
                      {seccion.estado}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Información */}
              <div className="bg-gray-50/50 p-4 border-t border-gray-100 grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Categorías</p>
                  <p className="text-xl font-bold text-gray-800">
                    {seccion.categoriasCount}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Estado</p>
                  <p className="text-sm font-bold text-gray-800">
                    {seccion.estado}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100 flex flex-col gap-2">
                  <p className="text-xs text-gray-500">Acciones</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(seccion.id)}
                      className="bg-primary hover:bg-blue-600 text-white text-xs font-medium py-1.5 px-2 rounded flex items-center transition-colors flex-1"
                      title="Ver"
                    >
                      <EyeIcon className="w-3 h-3 mr-1" /> Ver
                    </button>
                    <button
                      onClick={() => handleEdit(seccion.id)}
                      className="text-gray-500 hover:text-blue-600 p-1.5 border border-gray-200 rounded bg-white transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(seccion.id)}
                      className="text-gray-500 hover:text-red-500 p-1.5 border border-gray-200 rounded bg-white transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- MODAL DE CONFIRMACIÓN --- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Confirmar eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar esta sección? Esta acción no
              se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPremiumSecciones;
