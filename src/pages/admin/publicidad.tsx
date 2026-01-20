import React, { useState, useEffect } from 'react';

import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/outline';

import AdminLayout from '../../components/AdminLayout';
import { modalidadService, Modalidad } from '../../services/modalidadService';
import { nivelService, Nivel } from '../../services/nivelService';
import {
  publicidadService,
  Publicidad,
} from '../../services/publicidadService';
import { uploadService } from '../../services/uploadService';
import { estadoService, Estado } from '../../services/estadoService';

const AdminPublicidad = () => {
  const [publicidades, setPublicidades] = useState<Publicidad[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<Publicidad | null>(null);
  
  // Filter State
  const [selectedNivelFilter, setSelectedNivelFilter] = useState<number>(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [formData, setFormData] = useState({
    titulo: '',
    imageUrl: '',
    enlace: '',
    modalidadId: 0,
    nivelId: 0,
    precio: 0,
    telefono: '',
    estadoId: 0,
    orden: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pubData, modData, nivData, estadosData] = await Promise.all([
        publicidadService.getAll(),
        modalidadService.getAll(),
        nivelService.getAll(), 
        estadoService.getAll(),
      ]);
      setPublicidades(pubData);
      setModalidades(modData);
      setNiveles(nivData);
      setEstados(estadosData);
    } catch (err) {
      setError('Error loading data');
      // console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (item: Publicidad) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ... (existing useEffect for formData.modalidadId driven nivel fetching might conflict? no, it just filters for the form dropdown)
  // Actually, the original code had:
  /*
  useEffect(() => {
    if (formData.modalidadId) {
      nivelService.getByModalidadId(formData.modalidadId).then(setNiveles).catch(console.error);
    } else {
      setNiveles([]);
    }
  }, [formData.modalidadId]);
  */
  // If I overwrite `niveles` with `getAll` in `fetchData`, this effect might overwrite it again with a filtered list when `formData` changes.
  // We should separate "all levels" for display vs "form levels" for dropdown.
  // Let's call the `getAll` result `allNiveles`? or just use `filteredNiveles` for the form?
  // I will introduce `filteredNiveles` for the form dropdown.

  const [filteredNiveles, setFilteredNiveles] = useState<Nivel[]>([]);

  useEffect(() => {
    if (formData.modalidadId) {
      // filter locally if we have all levels, or fetch?
      // existing code used `getByModalidadId`. I'll stick to that pattern for the dropdown but populate `filteredNiveles`.
      nivelService
        .getByModalidadId(formData.modalidadId)
        .then(setFilteredNiveles);
      // .catch(console.error);
    } else {
      setFilteredNiveles([]);
    }
  }, [formData.modalidadId]);

  const handleDelete = async (id: number) => {
    // eslint-disable-next-line no-alert
    if (window.confirm('¿Estás seguro de eliminar esta publicidad?')) {
      try {
        await publicidadService.delete(id);
        fetchData();
      } catch (err) {
        // eslint-disable-next-line no-alert
        alert('Error deleting publicidad');
        // console.error(err);
      }
    }
  };

  const handleEdit = (item: Publicidad) => {
    setEditingId(item.id);
    setFormData({
      titulo: item.titulo,
      imageUrl: item.imageUrl,
      enlace: item.enlace,
      modalidadId: item.modalidadId,
      nivelId: item.nivelId,
      precio: item.precio || 0,
      telefono: item.telefono || '',
      estadoId: item.estadoId || 0,
      orden: item.orden || 0,
    });
    setIsModalOpen(true);
  };

  // ... rest of handle submit ...
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Modalidad and Nivel are selected
    if (!formData.modalidadId || formData.modalidadId === 0) {
      // eslint-disable-next-line no-alert
      alert('Por favor seleccione una Modalidad');
      return;
    }
    
    if (!formData.nivelId || formData.nivelId === 0) {
      // eslint-disable-next-line no-alert
      alert('Por favor seleccione un Nivel');
      return;
    }
    
    try {
      // Validate: Max 5 publicidades PUBLICADAS per nivel 
      // Need to find which ID corresponds to 'Publicado' - assuming based on name, or logic
      // Ideally we'd have a constant, but we'll find it from 'estados'
      const estadoPublicado = estados.find(e => e.nombre.toLowerCase() === 'publicado');
      const publicadoId = estadoPublicado ? estadoPublicado.id : 0; // Fallback or handle error?

      // Only check limit if we are trying to save as "Publicado"
      if (Number(formData.estadoId) === Number(publicadoId)) {
          // Count how many ACTIVE (Publicado) ads exist for this level, EXCLUDING the current one if editing
          const existingPublicadosCount = publicidades.filter(
            (p) => 
              Number(p.nivelId) === Number(formData.nivelId) && 
              Number(p.estadoId) === Number(publicadoId) &&
              (editingId ? Number(p.id) !== Number(editingId) : true)
          ).length;

          if (existingPublicadosCount >= 5) {
             // eslint-disable-next-line no-alert
             alert(
               `Ya existen 5 publicidades PUBLICADAS para este nivel. Solo se permiten 5 publicidades activas por nivel. Puede guardar esta publicidad como "Borrador" o eliminar/desactivar otra.`
             );
             return;
          }
      }

      let finalUrl = formData.imageUrl;
      if (file) {
        try {
          finalUrl = await uploadService.uploadImage(file);
        } catch (uploadError) {
          // eslint-disable-next-line no-alert
          alert('Error al subir la imagen');
          return;
        }
      }

      const payload = {
        ...formData,
        imageUrl: finalUrl,
      };

      if (editingId) {
        await publicidadService.update(editingId, payload);
      } else {
        await publicidadService.create(payload);
      }
      setIsModalOpen(false);
      setFormData({
        titulo: '',
        imageUrl: '',
        enlace: '',
        modalidadId: 0,
        nivelId: 0,
        precio: 0,
        telefono: '',
        estadoId: 0,
        orden: 0,
      });
      setFile(null);
      setEditingId(null);
      fetchData();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Error saving publicidad');
      // console.error(err);
    }
  };

  // Pagination Logic
  const filteredItems = selectedNivelFilter === 0 
    ? publicidades 
    : publicidades.filter(p => p.nivelId === selectedNivelFilter);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading)
    return (
      <AdminLayout>
        <div>Loading...</div>
      </AdminLayout>
    );
  if (error)
    return (
      <AdminLayout>
        <div>Error: {error}</div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Publicidad
        </h1>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setEditingId(null);
            setFile(null);
            const estadoPublicado = estados.find(e => e.nombre.toLowerCase() === 'publicado');
            setFormData({
              titulo: '',
              imageUrl: '',
              enlace: '',
              modalidadId: 0,
              nivelId: 0,
              precio: 0,
              telefono: '',
              estadoId: estadoPublicado ? estadoPublicado.id : 0, // Default to Publicado
              orden: 0,
            });
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          nueva Publicidad
        </button>
      </div>

      <div className="flex justify-end mb-4">
         <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filtrar por Nivel:</label>
            <select
              className="border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border"
              value={selectedNivelFilter}
              onChange={(e) => {
                setSelectedNivelFilter(Number(e.target.value));
                setCurrentPage(1); // Reset pagination when filter changes
              }}
            >
              <option value={0}>Todos los Niveles</option>
              {niveles.map((nivel) => (
                <option key={nivel.id} value={nivel.id}>
                  {nivel.nombre}
                </option>
              ))}
            </select>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orden
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Posición
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Título
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Imagen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enlace
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((item, index) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.orden || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {indexOfFirstItem + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.titulo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <img
                    src={item.imageUrl}
                    alt={item.titulo}
                    className="h-10 w-10 object-cover rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <a
                    href={item.enlace}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Link
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                    style={{
                      backgroundColor: item.estado?.colorHex
                        ? item.estado.colorHex + '20'
                        : '#e5e7eb',
                      color: item.estado?.colorHex || '#374151',
                    }}
                  >
                    {item.estado?.nombre || 'Sin Estado'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleView(item)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                    title="Ver Detalles"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      handleEdit(item);
                      setFile(null);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                    title="Editar"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Eliminar"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${
                currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Anterior
            </button>
            <button
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${
                currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{filteredItems.length > 0 ? indexOfFirstItem + 1 : 0}</span> a{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredItems.length)}
                </span>{' '}
                de <span className="font-medium">{filteredItems.length}</span> resultados
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first, last, current, and adjacent pages
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const showEllipsis = index > 0 && prevPage !== undefined && page - prevPage > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => paginate(page)}
                          aria-current={currentPage === page ? 'page' : undefined}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === page
                              ? 'bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="sr-only">Siguiente</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Publicidad' : 'Nueva Publicidad'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Título
                </label>
                <input
                  type="text"
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    URL de Imagen
                  </label>
                  <input
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Elegir Archivo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Enlace (Destino)
                  </label>
                  <input
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={formData.enlace}
                    onChange={(e) =>
                      setFormData({ ...formData, enlace: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Modalidad
                  </label>
                  <select
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={formData.modalidadId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        modalidadId: Number(e.target.value),
                      })
                    }
                  >
                    <option value={0}>Seleccionar...</option>
                    {modalidades.map((mod) => (
                      <option key={mod.id} value={mod.id}>
                        {mod.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Precio (S/ - deje en 0 si es gratis)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={formData.precio || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        precio: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Nivel
                  </label>
                  <select
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={formData.nivelId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nivelId: Number(e.target.value),
                      })
                    }
                    disabled={!formData.modalidadId}
                  >
                    <option value={0}>Seleccionar...</option>
                    {filteredNiveles.map((nivel) => (
                      <option key={nivel.id} value={nivel.id}>
                        {nivel.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Teléfono (WhatsApp - opcional)
                </label>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.telefono || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  placeholder="51999999999"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Orden de Visualización (Menor va primero)
                </label>
                <input
                  type="number"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.orden}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      orden: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Estado
                </label>
                <select
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.estadoId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estadoId: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>Seleccionar Estado...</option>
                  {estados.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mr-4 text-gray-500 hover:text-gray-700 font-bold py-2 px-4 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Detalles de Publicidad</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Imagen
                  </label>
                  {viewingItem.imageUrl ? (
                    <img
                      src={viewingItem.imageUrl}
                      alt={viewingItem.titulo}
                      className="w-full h-auto rounded-lg shadow-sm object-cover max-h-64"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Título
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {viewingItem.titulo}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Enlace
                    </label>
                    <a
                      href={viewingItem.enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {viewingItem.enlace}
                    </a>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Modalidad
                    </label>
                    <p className="text-gray-900">
                      {modalidades.find((m) => m.id === viewingItem.modalidadId)
                        ?.nombre || 'Desconocido'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Nivel
                    </label>
                    <p className="text-gray-900">
                      {niveles.find((n) => n.id === viewingItem.nivelId)
                        ?.nombre || 'Desconocido'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Precio
                    </label>
                    <p className="text-gray-900">
                      {viewingItem.precio > 0
                        ? `S/ ${viewingItem.precio}`
                        : 'Gratis'}
                    </p>
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Orden
                    </label>
                    <p className="text-gray-900">
                      {viewingItem.orden || 0}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Contacto (WhatsApp)
                    </label>
                    <p className="text-gray-900">
                      {viewingItem.telefono || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="bg-gray-100 text-gray-700 font-semibold py-2 px-6 rounded-lg hover:bg-gray-200 transition-colors"
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

export default AdminPublicidad;
