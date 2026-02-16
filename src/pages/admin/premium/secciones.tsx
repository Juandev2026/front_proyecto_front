import React, { useState } from 'react';

import {
  PlusIcon,
  SearchIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  EyeOffIcon,
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

  // --- MODAL STATE ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSection, setNewSection] = useState({
      nombre: '',
      descripcion: '',
      tipoExamen: '',
      isDefault: false,
      isVisible: true
  });

  // --- EDIT MODAL STATE ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Seccion | null>(null);

  // --- VIEW MODAL STATE ---
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSection, setViewingSection] = useState<Seccion | null>(null);

  const handleCreateSection = () => {
      // Basic validation
      if (!newSection.nombre || !newSection.descripcion || !newSection.tipoExamen) {
          alert("Por favor complete todos los campos obligatorios.");
          return;
      }

      const newId = secciones.length > 0 ? Math.max(...secciones.map(s => s.id)) + 1 : 1;
      const sectionToAdd: Seccion = {
          id: newId,
          nombre: newSection.nombre,
          descripcion: newSection.descripcion,
          tipoExamen: newSection.tipoExamen,
          estado: newSection.isVisible ? 'Visible' : 'Oculta',
          categoriasCount: 0 // Default
      };

      setSecciones([...secciones, sectionToAdd]);
      setShowAddModal(false);
      setNewSection({
          nombre: '',
          descripcion: '',
          tipoExamen: '',
          isDefault: false,
          isVisible: true
      });
  };

  const handleUpdateSection = () => {
     if (!editingSection || !editingSection.nombre || !editingSection.descripcion) {
         alert("Por favor complete todos los campos obligatorios.");
         return;
     }
     setSecciones(prev => prev.map(s => s.id === editingSection.id ? editingSection : s));
     setShowEditModal(false);
     setEditingSection(null);
  };

  // --- LÓGICA DE FILTRADO ---
  const filteredSecciones = secciones.filter((item) => {
    const matchesSearch = item.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === '' || item.tipoExamen === filterType;
    return matchesSearch && matchesFilter;
  });

  // --- HANDLERS (Simulados) ---
  const handleEdit = (id: number) => {
    const sectionToEdit = secciones.find(s => s.id === id);
    if (sectionToEdit) {
      setEditingSection(sectionToEdit);
      setShowEditModal(true);
    }
  };

  const handleView = (id: number) => {
    const sectionToView = secciones.find(s => s.id === id);
    if (sectionToView) {
      setViewingSection(sectionToView);
      setShowViewModal(true);
    }
  };
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
      <div className="bg-[#002B6B] text-white p-4 rounded-t-lg mb-6 flex flex-col justify-center items-center shadow-lg">
        <h1 className="text-xl font-bold">Administrar Secciones</h1>
        <p className="text-sm opacity-90">Exámenes Propios ED</p>
      </div>

      {/* --- FILTERS & ACTIONS --- */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search */}
          <div className="flex-1 w-full md:max-w-xs relative">
             <input
                type="text"
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                placeholder="Buscar sección"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-gray-400" />
              </div>
          </div>

          {/* Filter */}
          <div className="w-full md:w-64">
              <select
                  className="w-full border border-gray-300 rounded-lg text-sm py-2 px-3 text-gray-600 focus:outline-none focus:border-primary"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
              >
                  <option value="">Filtrar por tipo de examen</option>
                  <option value="Ascenso">Ascenso</option>
                  <option value="Nombramiento">Nombramiento</option>
                  <option value="Directivos">Directivos</option>
              </select>
          </div>

          {/* Add Button */}
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#002B6B] hover:bg-blue-800 text-white text-sm font-medium py-2 px-4 rounded-lg flex items-center shadow-md transition-colors whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Agregar sección
          </button>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#E0F7FA]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Descripción
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Tipo de Examen
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Categorías
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSecciones.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-6 py-10 text-center text-gray-500 text-sm">
                     No se encontraron secciones.
                   </td>
                 </tr>
              ) : (
                filteredSecciones.map((seccion) => (
                  <tr key={seccion.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {seccion.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {seccion.descripcion.length > 30 ? seccion.descripcion.substring(0, 30) + '...' : seccion.descripcion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getExamTypeStyles(seccion.tipoExamen)}`}>
                        {seccion.tipoExamen}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                       <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                          seccion.estado === 'Oculta' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                       }`}>
                          {seccion.estado === 'Oculta' && <EyeOffIcon className="w-3 h-3 mr-1" />}
                          {seccion.estado}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                          {seccion.categoriasCount} categorías
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(seccion.id)} className="text-gray-600 hover:text-blue-600 transition-colors">
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleView(seccion.id)} className="text-gray-600 hover:text-green-600 transition-colors">
                            <EyeIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(seccion.id)} className="text-gray-600 hover:text-red-600 transition-colors">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
           <div className="flex-1 flex justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                   <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-l-md text-gray-700 bg-white hover:bg-gray-50">
                     Anterior
                   </button>
                   <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                     de
                   </span>
                   <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-white hover:bg-gray-50">
                     Siguiente
                   </button>
              </nav>
           </div>
        </div>
      </div>

      {/* --- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN --- */}
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

      {/* --- ADD SECTION MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-spawn">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Crear Sección</h2>
                    <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nombre *</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ingrese el nombre de la sección"
                            value={newSection.nombre}
                            onChange={(e) => setNewSection({...newSection, nombre: e.target.value})}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Descripción *</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                            placeholder="Ingrese la descripción de la sección"
                            value={newSection.descripcion}
                            onChange={(e) => setNewSection({...newSection, descripcion: e.target.value})}
                        />
                    </div>

                    {/* Exam Type */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Examen *</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            value={newSection.tipoExamen}
                            onChange={(e) => setNewSection({...newSection, tipoExamen: e.target.value})}
                        >
                            <option value="">Seleccione un tipo de examen</option>
                            <option value="Ascenso">Ascenso</option>
                            <option value="Nombramiento">Nombramiento</option>
                            <option value="Directivos">Directivos</option>
                        </select>
                    </div>

                    {/* Options */}
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                checked={newSection.isDefault}
                                onChange={(e) => setNewSection({...newSection, isDefault: e.target.checked})}
                            />
                            <span className="text-sm text-gray-700">Marcar como sección por defecto</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 text-red-500 rounded border-gray-300 focus:ring-red-500"
                                checked={newSection.isVisible}
                                onChange={(e) => setNewSection({...newSection, isVisible: e.target.checked})}
                            />
                            <span className="text-sm text-gray-700">Sección visible</span>
                        </label>
                    </div>

                    {/* Categories */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Categorías *</label>
                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                             <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo</label>
                             <div className="bg-white border border-blue-200 rounded-lg flex items-center p-1">
                                <select className="flex-1 bg-transparent border-none text-sm px-2 focus:ring-0 text-gray-600">
                                    <option>Selecciona tipo</option>
                                    <option>General</option>
                                    <option>Específico</option>
                                </select>
                                <span className="text-gray-400 mr-2 text-xs">▼</span>
                             </div>

                             <button className="mt-3 bg-blue-400 text-white text-sm px-4 py-2 rounded-lg flex items-center hover:bg-blue-500 transition-colors">
                                <PlusIcon className="w-4 h-4 mr-1" />
                                Agregar Categoría
                             </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    <button 
                        onClick={() => setShowAddModal(false)}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-white hover:border-gray-400 transition-all font-medium text-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleCreateSection}
                        className="px-6 py-2 bg-[#002B6B] text-white rounded-lg hover:bg-blue-900 transition-all font-medium text-sm shadow-lg shadow-blue-900/20"
                    >
                        Crear Sección
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- EDIT SECTION MODAL --- */}
      {showEditModal && editingSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-spawn">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Editar Sección</h2>
                    <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nombre *</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ingrese el nombre de la sección"
                            value={editingSection.nombre}
                            onChange={(e) => setEditingSection({...editingSection, nombre: e.target.value})}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Descripción *</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                            placeholder="Ingrese la descripción de la sección"
                            value={editingSection.descripcion}
                            onChange={(e) => setEditingSection({...editingSection, descripcion: e.target.value})}
                        />
                    </div>

                    {/* Exam Type */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Examen *</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            value={editingSection.tipoExamen}
                            onChange={(e) => setEditingSection({...editingSection, tipoExamen: e.target.value})}
                        >
                            <option value="">Seleccione un tipo de examen</option>
                            <option value="Ascenso">Ascenso</option>
                            <option value="Nombramiento">Nombramiento</option>
                            <option value="Directivos">Directivos</option>
                        </select>
                    </div>

                    {/* Options */}
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                checked={false} // Mock state for now
                                onChange={() => {}}
                            />
                            <span className="text-sm text-gray-700">Marcar como sección por defecto</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 text-red-500 rounded border-gray-300 focus:ring-red-500"
                                checked={editingSection.estado === 'Visible'}
                                onChange={(e) => setEditingSection({...editingSection, estado: e.target.checked ? 'Visible' : 'Oculta'})}
                            />
                            <span className="text-sm text-gray-700">Sección visible</span>
                        </label>
                    </div>

                    {/* Categories */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Categorías *</label>
                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-4">
                             <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo</label>
                             <div className="bg-white border border-blue-200 rounded-lg flex items-center p-1">
                                <select className="flex-1 bg-transparent border-none text-sm px-2 focus:ring-0 text-gray-600">
                                    <option>Selecciona tipo</option>
                                </select>
                                <span className="text-gray-400 mr-2 text-xs">▼</span>
                             </div>

                             <button className="mt-3 bg-blue-400 text-white text-sm px-4 py-2 rounded-lg flex items-center hover:bg-blue-500 transition-colors">
                                <PlusIcon className="w-4 h-4 mr-1" />
                                Agregar Categoría
                             </button>
                        </div>
                        
                        <label className="block text-sm font-bold text-gray-700 mb-2">Categorías agregadas:</label>
                        <div className="bg-gray-50 p-2 rounded-lg flex justify-between items-center">
                             <span className="text-sm text-gray-800">Educación Básica Regular - Inicial</span>
                             <button className="text-red-500 hover:text-red-700">
                                <TrashIcon className="w-4 h-4" />
                             </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    <button 
                        onClick={() => setShowEditModal(false)}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-white hover:border-gray-400 transition-all font-medium text-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleUpdateSection}
                        className="px-6 py-2 bg-[#002B6B] text-white rounded-lg hover:bg-blue-900 transition-all font-medium text-sm shadow-lg shadow-blue-900/20"
                    >
                        Actualizar Sección
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- VIEW SECTION MODAL --- */}
      {showViewModal && viewingSection && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-spawn">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Información Básica</h2>
                    <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                 {/* Body */}
                 <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-bold text-gray-700">ID</p>
                            <div className="bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-800 mt-1">
                                {viewingSection.id}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-700">Nombre</p>
                            <div className="bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-800 mt-1">
                                {viewingSection.nombre}
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-bold text-gray-700">Descripción</p>
                        <div className="bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-800 mt-1 min-h-[3rem]">
                            {viewingSection.descripcion}
                        </div>
                    </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-bold text-gray-700 mb-1">Tipo de Examen</p>
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                                {viewingSection.tipoExamen}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-700 mb-1">Estado</p>
                            <div className="flex items-center gap-2">
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs">No</span>
                                <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                                    viewingSection.estado === 'Oculta' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                    {viewingSection.estado === 'Oculta' && <EyeOffIcon className="w-3 h-3 mr-1" />}
                                    {viewingSection.estado}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                         <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3">Categorías Asociadas</h3>
                         <div className="flex flex-wrap gap-2">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                                C0003 - Educación Básica Regular - Inicial
                            </span>
                         </div>
                    </div>
                </div>
                 
                 {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
                     <button 
                        onClick={() => setShowViewModal(false)}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-white hover:border-gray-400 transition-all font-medium text-sm"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
         </div>
      )}
    </AdminLayout>
  );
};

export default AdminPremiumSecciones;
