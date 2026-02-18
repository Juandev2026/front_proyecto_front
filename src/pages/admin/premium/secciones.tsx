import React, { useState, useEffect } from 'react';

import {
  PlusIcon,
  SearchIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  EyeOffIcon,
} from '@heroicons/react/outline';

import AdminLayout from '../../../components/AdminLayout';
import { seccionesService } from '../../../services/seccionesService';
import { tipoAccesoService, TipoAcceso } from '../../../services/tipoAccesoService';
import { estructuraAcademicaService, Modalidad } from '../../../services/estructuraAcademicaService';

// Interfaz para definir la estructura de datos
interface Seccion {
  id: number;
  nombre: string;
  descripcion: string;
  tipoExamenId: number;
  modalidadId: number;
  nivelId: number;
  especialidadId: number;
  tipoExamenNombre: string;
  modalidadNombre: string;
  nivelNombre: string;
  especialidadNombre: string;
  esVisible: boolean;
  esDefault: boolean;
  categorias: { id: number; descripcion: string }[];
  cantidadCategorias: number;
}

// Add this helper function before the component
const getExamTypeStyles = (tipoExamen?: string): string => {
  if (!tipoExamen) return 'bg-gray-100 text-gray-800';
  const styleMap: Record<string, string> = {
    Ascenso: 'bg-green-100 text-green-800',
    Nombramiento: 'bg-blue-100 text-blue-800',
    Directivos: 'bg-orange-100 text-orange-800',
  };
  return styleMap[tipoExamen] || 'bg-purple-100 text-purple-800';
};

const AdminPremiumSecciones = () => {
  // --- ESTADOS ---
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [seccionToDelete, setSeccionToDelete] = useState<number | null>(null);

  // --- API DATA ---
  const [tiposAcceso, setTiposAcceso] = useState<TipoAcceso[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);

  // --- MODAL STATE ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSection, setNewSection] = useState({
      nombre: '',
      descripcion: '',
      tipoExamenId: 0,
      modalidadId: 0,
      nivelId: 0,
      especialidadId: 0,
      esDefault: false,
      esVisible: true,
      categoriasIds: [] as number[],
      categoriasList: [] as { id: number; nombre: string }[]
  });

  // --- EDIT MODAL STATE ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Seccion | null>(null);

  // --- VIEW MODAL STATE ---
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSection, setViewingSection] = useState<Seccion | null>(null);

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      const data = await seccionesService.getAll();
      const transformed: Seccion[] = data.map(s => ({
        ...s,
        tipoExamenNombre: s.tipoExamenNombre || 'General',
        cantidadCategorias: s.cantidadCategorias || 0
      }));
      setSecciones(transformed);
    } catch (error) {
      console.error("Error loading sections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApiData = async () => {
    try {
      const [tipos, modular] = await Promise.all([
        tipoAccesoService.getAll(),
        estructuraAcademicaService.getAll()
      ]);
      setTiposAcceso(tipos);
      setModalidades(modular);
    } catch (error) {
      console.error("Error fetching supplemental API data:", error);
    }
  };

  useEffect(() => {
    fetchSections();
    fetchApiData();
  }, []);

  const handleCreateSection = async () => {
      // Basic validation
      if (!newSection.nombre || !newSection.descripcion || !newSection.tipoExamenId) {
          alert("Por favor complete los campos obligatorios (*).");
          return;
      }

      try {
          await seccionesService.create({
              nombre: newSection.nombre,
              descripcion: newSection.descripcion,
              tipoExamenId: newSection.tipoExamenId,
              modalidadId: newSection.modalidadId,
              nivelId: newSection.nivelId,
              especialidadId: newSection.especialidadId,
              esVisible: newSection.esVisible,
              esDefault: newSection.esDefault,
              categoriasIds: newSection.categoriasIds
          });
          
          await fetchSections();
          setShowAddModal(false);
          setNewSection({
              nombre: '',
              descripcion: '',
              tipoExamenId: 0,
              modalidadId: 0,
              nivelId: 0,
              especialidadId: 0,
              esDefault: false,
              esVisible: true,
              categoriasIds: [],
              categoriasList: []
          });
          alert("Sección creada con éxito.");
      } catch (error) {
          alert("Error al crear la sección.");
      }
  };

  const handleUpdateSection = async () => {
     if (!editingSection || !editingSection.nombre) {
         alert("Por favor complete todos los campos obligatorios.");
         return;
     }
     
      try {
        await seccionesService.update(editingSection.id, {
          nombre: editingSection.nombre,
          descripcion: editingSection.descripcion,
          tipoExamenId: Number(editingSection.tipoExamenId), // Ensure number type
          modalidadId: Number(editingSection.modalidadId),   // Ensure number type
          nivelId: Number(editingSection.nivelId),           // Ensure number type
          especialidadId: Number(editingSection.especialidadId), // Ensure number type
          esVisible: editingSection.esVisible,
          esDefault: editingSection.esDefault,
          categoriasIds: editingSection.categorias.map(c => c.id)
        });
        await fetchSections();
        setShowEditModal(false);
        setEditingSection(null);
        alert("Sección actualizada con éxito.");
      } catch (error) {
        alert("Error al actualizar la sección.");
      }
  };

  const confirmDelete = async () => {
    if (seccionToDelete !== null) {
      try {
        await seccionesService.delete(seccionToDelete);
        setSecciones((prev) => prev.filter((s) => s.id !== seccionToDelete));
      } catch (error) {
        alert("Error al eliminar la sección.");
      }
    }
    setShowDeleteConfirm(false);
    setSeccionToDelete(null);
  };

  // --- LÓGICA DE FILTRADO ---
  const filteredSecciones = secciones.filter((item) => {
    const matchesSearch = item.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === '' || item.tipoExamenNombre === filterType;
    return matchesSearch && matchesFilter;
  });

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

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setSeccionToDelete(null);
  };

  const handleAddCategory = (isEdit: boolean) => {
    if (isEdit) {
      if (!editingSection) return;
      if (!editingSection.modalidadId) {
        alert("Seleccione un tipo (modalidad).");
        return;
      }
      
      const mod = modalidades.find(m => m.id === editingSection.modalidadId);
      if (!mod) {
        console.error("Modalidad not found:", editingSection.modalidadId);
        return;
      }

      let categoryId = 0;
      let name = '';

      if (editingSection.especialidadId) {
        categoryId = editingSection.especialidadId;
        const niv = mod.niveles.find(n => n.id === editingSection.nivelId);
        const esp = niv?.especialidades.find(e => e.id === editingSection.especialidadId);
        name = `${mod.nombre} - ${niv?.nombre} - ${esp?.nombre}`;
      } else if (editingSection.nivelId) {
        categoryId = editingSection.nivelId;
        const niv = mod.niveles.find(n => n.id === editingSection.nivelId);
        name = `${mod.nombre} - ${niv?.nombre}`;
      } else {
        categoryId = editingSection.modalidadId;
        name = mod.nombre;
      }

      if (editingSection.categorias.some(c => c.id === categoryId)) {
        alert("Esta categoría ya ha sido agregada.");
        return;
      }

      setEditingSection(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          categorias: [...prev.categorias, { id: categoryId, descripcion: name }]
        };
      });
    } else {
      if (!newSection.modalidadId) {
        alert("Seleccione un tipo (modalidad).");
        return;
      }

      const mod = modalidades.find(m => m.id === newSection.modalidadId);
      if (!mod) {
        console.error("Modalidad not found:", newSection.modalidadId);
        return;
      }

      let categoryId = 0;
      let name = '';

      if (newSection.especialidadId) {
        categoryId = newSection.especialidadId;
        const niv = mod.niveles.find(n => n.id === newSection.nivelId);
        const esp = niv?.especialidades.find(e => e.id === newSection.especialidadId);
        name = `${mod.nombre} - ${niv?.nombre} - ${esp?.nombre}`;
      } else if (newSection.nivelId) {
        categoryId = newSection.nivelId;
        const niv = mod.niveles.find(n => n.id === newSection.nivelId);
        name = `${mod.nombre} - ${niv?.nombre}`;
      } else {
        categoryId = newSection.modalidadId;
        name = mod.nombre;
      }

      if (newSection.categoriasIds.includes(categoryId)) {
        alert("Esta categoría ya ha sido agregada.");
        return;
      }

      setNewSection(prev => ({
        ...prev,
        categoriasIds: [...prev.categoriasIds, categoryId],
        categoriasList: [...prev.categoriasList, { id: categoryId, nombre: name }]
      }));
    }
  };

  const handleRemoveCategory = (id: number, isEdit: boolean) => {
    if (isEdit) {
      setEditingSection(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          categorias: prev.categorias.filter(c => c.id !== id)
        };
      });
    } else {
      setNewSection(prev => ({
        ...prev,
        categoriasIds: prev.categoriasIds.filter(cid => cid !== id),
        categoriasList: prev.categoriasList.filter(c => c.id !== id)
      }));
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002B6B]"></div>
        </div>
      </AdminLayout>
    );
  }

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
                      {(seccion.descripcion || '').length > 30 ? seccion.descripcion.substring(0, 30) + '...' : seccion.descripcion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getExamTypeStyles(seccion.tipoExamenNombre)}`}>
                        {seccion.tipoExamenNombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                       <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                          !seccion.esVisible ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                       }`}>
                          {!seccion.esVisible && <EyeOffIcon className="w-3 h-3 mr-1" />}
                          {seccion.esVisible ? 'Visible' : 'Oculta'}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                          {seccion.cantidadCategorias} categorías
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-spawn">
                {/* Header */}
                <div className="flex justify-between items-center p-6 pb-0">
                    <h2 className="text-xl font-bold text-gray-900">Registrar Nueva Sección</h2>
                    <button onClick={() => setShowAddModal(false)} className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors">
                        <span className="text-lg">&times;</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-bold text-[#002B6B] mb-1">Nombre *</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                            placeholder="Ingrese el nombre de la sección"
                            value={newSection.nombre}
                            onChange={(e) => setNewSection({...newSection, nombre: e.target.value})}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-[#002B6B] mb-1">Descripción *</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-sm"
                            placeholder="Ingrese la descripción de la sección"
                            value={newSection.descripcion}
                            onChange={(e) => setNewSection({...newSection, descripcion: e.target.value})}
                        />
                    </div>

                    {/* Tipo de Examen */}
                    <div>
                        <label className="block text-sm font-bold text-[#002B6B] mb-1">Tipo de Examen *</label>
                        <select 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                            value={newSection.tipoExamenId || ''}
                            onChange={(e) => setNewSection({...newSection, tipoExamenId: Number(e.target.value) || 0})}
                        >
                            <option value="">Seleccione un tipo de examen</option>
                            {tiposAcceso.map(t => (
                                <option key={t.id} value={t.id}>{t.descripcion}</option>
                            ))}
                        </select>
                    </div>

                    {/* Checkboxes */}
                    <div className="flex items-center gap-6 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={newSection.esDefault}
                                onChange={(e) => setNewSection({...newSection, esDefault: e.target.checked})}
                            />
                            <span className="text-xs text-gray-700">Marcar como sección por defecto</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={newSection.esVisible}
                                onChange={(e) => setNewSection({...newSection, esVisible: e.target.checked})}
                            />
                            <span className="text-xs text-gray-700">Sección visible</span>
                        </label>
                    </div>

                    {/* Categorías Section */}
                    <div className="pt-2 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-[#002B6B] mb-3">Categorías *</h3>
                        
                        <div className="space-y-4">
                            {/* Tipo (Modalidad) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                                    value={newSection.modalidadId || ''}
                                    onChange={(e) => {
                                        const val = Number(e.target.value) || 0;
                                        setNewSection({...newSection, modalidadId: val, nivelId: 0, especialidadId: 0});
                                    }}
                                >
                                    <option value="">Selecciona tipo</option>
                                    {modalidades.map(m => (
                                        <option key={m.id} value={m.id}>{m.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Nivel (Depends on Modalidad) */}
                            {newSection.modalidadId && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Nivel</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                                        value={newSection.nivelId || ''}
                                        onChange={(e) => {
                                            const val = Number(e.target.value) || 0;
                                            setNewSection({...newSection, nivelId: val, especialidadId: 0});
                                        }}
                                    >
                                        <option value="">Selecciona nivel</option>
                                        {modalidades.find(m => m.id === newSection.modalidadId)?.niveles.map(n => (
                                            <option key={n.id} value={n.id}>{n.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Especialidad (Depends on Nivel) */}
                            {newSection.nivelId && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Especialidad</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                                        value={newSection.especialidadId || ''}
                                        onChange={(e) => setNewSection({...newSection, especialidadId: Number(e.target.value) || 0})}
                                    >
                                        <option value="">Selecciona especialidad</option>
                                        {modalidades.find(m => m.id === newSection.modalidadId)?.niveles.find(n => n.id === newSection.nivelId)?.especialidades.map(esp => (
                                            <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => handleAddCategory(false)}
                            className="mt-4 flex items-center gap-2 bg-[#4285F4] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors shadow-sm"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Agregar Categoría
                        </button>

                        {/* Categorías agregadas List (Inside Categorías section for better flow) */}
                        {newSection.categoriasList.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-700 mb-2">Categorías agregadas:</h4>
                                <div className="space-y-2">
                                    {newSection.categoriasList.map((cat) => (
                                        <div key={cat.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 group">
                                            <span className="text-xs text-gray-700 font-medium">{cat.nombre}</span>
                                            <button 
                                                onClick={() => handleRemoveCategory(cat.id, false)}
                                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                title="Eliminar categoría"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 flex gap-4 bg-gray-50 border-t border-gray-100">
                    <button 
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 py-2 border border-blue-400 rounded-lg text-[#002B6B] hover:bg-white transition-colors font-medium text-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleCreateSection}
                        className="flex-1 py-2 bg-[#002B6B] text-white rounded-lg hover:bg-blue-900 transition-colors font-medium text-sm"
                    >
                        Crear Sección
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- EDIT SECTION MODAL --- */}
      {showEditModal && editingSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-spawn">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Editar Sección</h2>
                    <button onClick={() => setShowEditModal(false)} className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors">
                        <span className="text-lg">&times;</span>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-[#002B6B] mb-1">Nombre *</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                            value={editingSection.nombre}
                            onChange={(e) => setEditingSection({...editingSection, nombre: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#002B6B] mb-1">Descripción *</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-sm"
                            value={editingSection.descripcion}
                            onChange={(e) => setEditingSection({...editingSection, descripcion: e.target.value})}
                        />
                    </div>

                    {/* Tipo de Examen */}
                    <div>
                        <label className="block text-sm font-bold text-[#002B6B] mb-1">Tipo de Examen *</label>
                        <select 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                            value={editingSection.tipoExamenId || ''}
                            onChange={(e) => setEditingSection({...editingSection, tipoExamenId: Number(e.target.value) || 0})}
                        >
                            <option value="">Seleccione un tipo de examen</option>
                            {tiposAcceso.map(t => (
                                <option key={t.id} value={t.id}>{t.descripcion}</option>
                            ))}
                        </select>
                    </div>

                    {/* Categorías Section */}
                    <div className="pt-2 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-[#002B6B] mb-3">Categorías *</h3>
                        
                        <div className="space-y-4">
                            {/* Tipo (Modalidad) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                                    value={editingSection.modalidadId || ''}
                                    onChange={(e) => {
                                        const val = Number(e.target.value) || 0;
                                        setEditingSection(prev => prev ? {...prev, modalidadId: val, nivelId: 0, especialidadId: 0} : null);
                                    }}
                                >
                                    <option value="">Selecciona tipo</option>
                                    {modalidades.map(m => (
                                        <option key={m.id} value={m.id}>{m.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Nivel */}
                            {editingSection.modalidadId && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Nivel</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                                        value={editingSection.nivelId || ''}
                                        onChange={(e) => {
                                            const val = Number(e.target.value) || 0;
                                            setEditingSection(prev => prev ? {...prev, nivelId: val, especialidadId: 0} : null);
                                        }}
                                    >
                                        <option value="">Selecciona nivel</option>
                                        {modalidades.find(m => m.id === editingSection.modalidadId)?.niveles.map(n => (
                                            <option key={n.id} value={n.id}>{n.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Especialidad */}
                            {editingSection.nivelId && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Especialidad</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                                        value={editingSection.especialidadId || ''}
                                        onChange={(e) => {
                                            const val = Number(e.target.value) || 0;
                                            setEditingSection(prev => prev ? {...prev, especialidadId: val} : null);
                                        }}
                                    >
                                        <option value="">Selecciona especialidad</option>
                                        {modalidades.find(m => m.id === editingSection.modalidadId)?.niveles.find(n => n.id === editingSection.nivelId)?.especialidades.map(esp => (
                                            <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => handleAddCategory(true)}
                            className="mt-4 flex items-center gap-2 bg-[#4285F4] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors shadow-sm"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Agregar Categoría
                        </button>

                        {/* Categorías agregadas List */}
                        {editingSection.categorias.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-700 mb-2">Categorías agregadas:</h4>
                                <div className="space-y-2">
                                    {editingSection.categorias.map((cat) => (
                                        <div key={cat.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 group">
                                            <span className="text-xs text-gray-700 font-medium">{cat.descripcion}</span>
                                            <button 
                                                onClick={() => handleRemoveCategory(cat.id, true)}
                                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                title="Eliminar categoría"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    <button 
                        onClick={() => setShowEditModal(false)}
                        className="px-4 py-2 border border-blue-400 rounded-lg text-gray-600 hover:bg-white font-medium text-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleUpdateSection}
                        className="px-4 py-2 bg-[#002B6B] text-white rounded-lg hover:bg-blue-900 font-medium text-sm"
                    >
                        Actualizar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- VIEW SECTION MODAL --- */}
      {showViewModal && viewingSection && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-spawn">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Información de Sección</h2>
                    <button onClick={() => setShowViewModal(false)} className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors">
                        <span className="text-lg">&times;</span>
                    </button>
                </div>

                 <div className="p-6 space-y-4">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">ID</p>
                        <p className="text-gray-800">{viewingSection.id}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Nombre</p>
                        <p className="text-gray-800">{viewingSection.nombre}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Descripción</p>
                        <p className="text-gray-800">{viewingSection.descripcion || 'Sin descripción'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Tipo de Examen</p>
                        <p className="text-gray-800">{viewingSection.tipoExamenNombre || 'General'}</p>
                    </div>
                </div>
                 
                <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
                     <button 
                        onClick={() => setShowViewModal(false)}
                        className="px-6 py-2 border border-blue-400 rounded-lg text-gray-600 hover:bg-white font-medium text-sm"
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
