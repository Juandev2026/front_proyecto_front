import React, { useState, useEffect, useCallback } from 'react';

import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XIcon,
} from '@heroicons/react/outline';

import AdminLayout from '../../components/AdminLayout';
import {
  especialidadesService,
  Especialidad,
} from '../../services/especialidadesService';
import { modalidadService, Modalidad } from '../../services/modalidadService';
import { nivelService, Nivel } from '../../services/nivelService';
import { uploadService } from '../../services/uploadService';

type TabType = 'modalidades' | 'niveles' | 'especialidades';

const AcademicStructure = () => {
  const [activeTab, setActiveTab] = useState<TabType>('modalidades');
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  
  // Filter State
  const [selectedModalidadFilter, setSelectedModalidadFilter] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<
    Modalidad | Nivel | Especialidad | null
  >(null);

  const handleView = (item: Modalidad | Nivel | Especialidad) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  // ... Update table actions
  /*
  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
    <button
      onClick={() => handleView(item)}
      className="text-blue-600 hover:text-blue-900 mr-4"
      title="Ver Detalles"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
      </svg>
    </button>
    <button
      onClick={() => openModal(item as any)}
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
  */

  // ... Add View Modal jsx
  /*
  {isViewModalOpen && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                Detalles de {activeTab === 'modalidades' ? 'la Modalidad' : (activeTab === 'niveles' ? 'el Nivel' : 'la Especialidad')}
              </h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">ID</label>
                <p className="mt-1 text-gray-900">{viewingItem.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Nombre</label>
                <p className="mt-1 text-xl font-semibold text-gray-900">{viewingItem.nombre}</p>
              </div>
              
              {activeTab === 'niveles' && (
                <div>
                   <label className="block text-sm font-medium text-gray-500">Modalidad</label>
                   <p className="mt-1 text-gray-900">
                     {modalidades.find((m) => m.id === (viewingItem as Nivel).modalidadId)?.nombre || (viewingItem as Nivel).modalidad?.nombre || '-'}
                   </p>
                </div>
              )}
              
              {activeTab === 'especialidades' && (
                <div>
                   <label className="block text-sm font-medium text-gray-500">Nivel</label>
                   <p className="mt-1 text-gray-900">
                     {niveles.find((n) => n.id === (viewingItem as Especialidad).nivelId)?.nombre || (viewingItem as Especialidad).nivel?.nombre || '-'}
                   </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
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
  */

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    imageUrl: '',
    modalidadId: 0,
    nivelId: 0,
  });
  const [file, setFile] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch Modalidades
    try {
      const modalidesResponse = await modalidadService.getAll();
      const filteredModalities = modalidesResponse.filter(m => m.base === 1);
      setModalidades(filteredModalities);
    } catch (error) {
      console.error('Error fetching modalidades:', error);
    }

    // Fetch Niveles
    try {
      const nivelesResponse = await nivelService.getAll();
      setNiveles(nivelesResponse);
    } catch (error) {
      console.error('Error fetching niveles:', error);
    }

    // Fetch Especialidades (if active tab)
    if (activeTab === 'especialidades') {
      try {
        const especialidadesResponse = await especialidadesService.getAll();
        setEspecialidades(especialidadesResponse);
      } catch (error) {
        console.error('Error fetching especialidades:', error);
      }
    }

    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    try {
      if (activeTab === 'modalidades') {
        await modalidadService.create({ nombre: formData.nombre });
      } else if (activeTab === 'niveles') {
        let { imageUrl } = formData;
        if (file) {
          try {
            imageUrl = await uploadService.uploadImage(file);
          } catch (e: any) {
            console.error('Upload Error:', e);
            alert(`Error al subir imagen: ${e.message}`);
            return;
          }
        }
        await nivelService.create({
          nombre: formData.nombre,
          imageUrl,
          modalidadId: formData.modalidadId,
        });
      } else {
        await especialidadesService.create({
          nombre: formData.nombre,
          nivelId: formData.nivelId,
        });
      }
      closeModal();
      fetchData();
    } catch (error) {
      // Error creating item
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      if (activeTab === 'modalidades') {
        await modalidadService.update(editingId, { nombre: formData.nombre });
      } else if (activeTab === 'niveles') {
        let { imageUrl } = formData;
        if (file) {
          try {
            imageUrl = await uploadService.uploadImage(file);
          } catch (e: any) {
            console.error('Upload Error:', e);
            alert(`Error al subir imagen: ${e.message}`);
            return;
          }
        }
        await nivelService.update(editingId, {
          nombre: formData.nombre,
          imageUrl,
          modalidadId: formData.modalidadId,
        });
      } else {
        await especialidadesService.update(editingId, {
          nombre: formData.nombre,
          nivelId: formData.nivelId,
        });
      }
      closeModal();
      fetchData();
    } catch (error) {
      // Error updating item
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este elemento?')) return;
    try {
      if (activeTab === 'modalidades') {
        await modalidadService.delete(id);
      } else if (activeTab === 'niveles') {
        await nivelService.delete(id);
      } else {
        await especialidadesService.delete(id);
      }
      fetchData();
    } catch (error: any) {
      // console.error('Error deleting item:', error);
      alert(error.message || 'Error al eliminar el elemento. Asegúrese de que no tenga dependencias.');
    }
  };

  const openModal = (item?: Modalidad | Nivel | Especialidad) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        nombre: item.nombre,
        imageUrl: (item as Nivel).imageUrl || '',
        modalidadId: (item as Nivel).modalidadId || 0,
        nivelId: (item as Especialidad).nivelId || 0,
      });
      setFile(null);
    } else {
      setEditingId(null);
      setFormData({ nombre: '', imageUrl: '', modalidadId: 0, nivelId: 0 });
      setFile(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ nombre: '', imageUrl: '', modalidadId: 0, nivelId: 0 });
    setFile(null);
  };

  const TabButton = ({ type, label }: { type: TabType; label: string }) => (
    <button
      onClick={() => {
        setActiveTab(type);
        setSelectedModalidadFilter(0); // Reset filter when changing tabs
      }}
      className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
        activeTab === type
          ? 'border-primary text-primary'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );

  let currentData: Array<Modalidad | Nivel | Especialidad>;
  if (activeTab === 'modalidades') {
    currentData = modalidades;
  } else if (activeTab === 'niveles') {
    if (selectedModalidadFilter !== 0) {
      currentData = niveles.filter(n => n.modalidadId === selectedModalidadFilter);
    } else {
      currentData = niveles;
    }
  } else {
    currentData = especialidades;
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Estructura Académica
        </h1>
        <button
          onClick={() => openModal()}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          {(() => {
            if (activeTab === 'modalidades') return 'Nueva Modalidad';
            if (activeTab === 'niveles') return 'Nuevo Nivel';
            return 'Nueva Especialidad';
          })()}
        </button>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-4">
          <TabButton type="modalidades" label="Modalidades" />
          <TabButton type="niveles" label="Niveles" />
          <TabButton type="especialidades" label="Especialidades" />
        </div>
        
        {activeTab === 'niveles' && (
          <div className="flex justify-end p-2">
             <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Filtrar por Modalidad:</label>
                <select
                  className="border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border"
                  value={selectedModalidadFilter}
                  onChange={(e) => setSelectedModalidadFilter(Number(e.target.value))}
                >
                  <option value={0}>Todas las Modalidades</option>
                  {modalidades.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.nombre}
                    </option>
                  ))}
                </select>
             </div>
          </div>
        )}
      </div>

      {/* Contextual Help for Tabs */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-md">
        <div className="flex">
          <div className="flex-shrink-0">
            {/* Info Icon */}
            <svg
              className="h-5 w-5 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              {activeTab === 'modalidades' &&
                'Las **Modalidades** son el nivel más alto de organización (ej. Educación Básica, Educación Superior).'}
              {activeTab === 'niveles' &&
                'Los **Niveles** pertenecen a una modalidad específica (ej. 1ro Grado, Semestre I).'}
              {activeTab === 'especialidades' &&
                'Las **Especialidades** (o materias) se asignan a un nivel concreto.'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              {activeTab === 'niveles' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imagen
                </th>
              )}
              {activeTab === 'niveles' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modalidad
                </th>
              )}
              {activeTab === 'especialidades' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nivel
                </th>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && currentData.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No hay registros.
                </td>
              </tr>
            )}
            {!loading &&
              currentData.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.nombre}
                  </td>
                  {activeTab === 'niveles' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(item as Nivel).imageUrl ? (
                        <img
                          src={(item as Nivel).imageUrl}
                          alt={(item as Nivel).nombre}
                          className="h-10 w-16 object-cover rounded shadow-sm"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          Sin imagen
                        </span>
                      )}
                    </td>
                  )}
                  {activeTab === 'niveles' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {modalidades.find(
                        (m) => m.id === (item as Nivel).modalidadId
                      )?.nombre ||
                        (item as Nivel).modalidad?.nombre ||
                        '-'}
                    </td>
                  )}
                  {activeTab === 'especialidades' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {niveles.find(
                        (n) => n.id === (item as Especialidad).nivelId
                      )?.nombre ||
                        (item as Especialidad).nivel?.nombre ||
                        '-'}
                    </td>
                  )}
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
                      onClick={() => openModal(item as any)}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {(() => {
                  if (editingId) return 'Editar';
                  return 'Crear';
                })()}{' '}
                {(() => {
                  if (activeTab === 'modalidades') return 'Modalidad';
                  if (activeTab === 'niveles') return 'Nivel';
                  return 'Especialidad';
                })()}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                editingId ? handleUpdate() : handleCreate();
              }}
            >
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder={`Nombre de ${
                    activeTab === 'modalidades'
                      ? 'la modalidad'
                      : activeTab === 'niveles'
                      ? 'del nivel'
                      : 'la especialidad'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Nombre descriptivo para identificar este elemento en la
                  plataforma.
                </p>
              </div>

              {activeTab === 'niveles' && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Imagen del Nivel
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Opción 1: Subir Archivo
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
                      <div className="text-center text-xs text-gray-400 font-medium">
                        - O -
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Opción 2: URL de Imagen
                        </label>
                        <input
                          type="text"
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          value={formData.imageUrl || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              imageUrl: e.target.value,
                            })
                          }
                          placeholder="https://ejemplo.com/imagen.jpg"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-6">
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
                      {modalidades
                        .filter((mod) => mod.nombre.toLowerCase() !== 'string')
                        .map((mod) => (
                          <option key={mod.id} value={mod.id}>
                            {mod.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'especialidades' && (
                <div className="mb-6">
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
                  >
                    <option value={0}>Seleccionar...</option>
                    {niveles.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeModal}
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
              <h2 className="text-xl font-bold">
                Detalles de{' '}
                {activeTab === 'modalidades'
                  ? 'la Modalidad'
                  : activeTab === 'niveles'
                  ? 'el Nivel'
                  : 'la Especialidad'}
              </h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  ID
                </label>
                <p className="mt-1 text-gray-900">{viewingItem.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Nombre
                </label>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {viewingItem.nombre}
                </p>
              </div>

              {activeTab === 'niveles' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Imagen
                    </label>
                    <div className="mt-1">
                      {(viewingItem as Nivel).imageUrl ? (
                        <img
                          src={(viewingItem as Nivel).imageUrl}
                          alt={(viewingItem as Nivel).nombre}
                          className="h-48 w-auto object-cover rounded shadow-md"
                        />
                      ) : (
                        <span className="text-gray-400 italic">
                          Sin imagen asignada
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Modalidad
                    </label>
                    <p className="mt-1 text-gray-900">
                      {modalidades.find(
                        (m) => m.id === (viewingItem as Nivel).modalidadId
                      )?.nombre ||
                        (viewingItem as Nivel).modalidad?.nombre ||
                        '-'}
                    </p>
                  </div>
                </>
              )}

              {activeTab === 'especialidades' && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Nivel
                  </label>
                  <p className="mt-1 text-gray-900">
                    {niveles.find(
                      (n) => n.id === (viewingItem as Especialidad).nivelId
                    )?.nombre ||
                      (viewingItem as Especialidad).nivel?.nombre ||
                      '-'}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
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

export default AcademicStructure;
