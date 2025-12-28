import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, EyeIcon, XIcon, PlusIcon } from '@heroicons/react/outline';

import AdminLayout from '../../components/AdminLayout';
import { categoriaSimpleService, CategoriaSimple } from '../../services/categoriaSimpleService';
import { materialService, Material } from '../../services/materialService';
import { modalidadService, Modalidad } from '../../services/modalidadService';
import { nivelService, Nivel } from '../../services/nivelService';

const AdminMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<CategoriaSimple[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<Material | null>(null);

  const [newMaterial, setNewMaterial] = useState({
    titulo: '',
    descripcion: '',
    url: '',
    categoriaId: 0,
    modalidadId: 0,
    nivelId: 0,
    usuarioEdicionId: typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || 0) : 0,
    precio: 0,
    telefono: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [materialsData, categoriesData, modalidadesData, nivelesData] = await Promise.all([
        materialService.getAll(),
        categoriaSimpleService.getAll(),
        modalidadService.getAll(),
        nivelService.getAll(),
      ]);
      setMaterials(materialsData);
      setCategories(categoriesData);
      setModalidades(modalidadesData);
      setNiveles(nivelesData);
    } catch (err) {
      setError('Error loading data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  // Create a filtered list for the form, but keep all levels for display if needed
  // Or just rely on the fact we fetched all levels above.
  const [formNiveles, setFormNiveles] = useState<Nivel[]>([]);

  useEffect(() => {
    if (newMaterial.modalidadId) {
      // client side filter since we fetched all, or fetch from API?
      // existing code used getByModalidadId. Let's stick to that for the form.
      nivelService.getByModalidadId(newMaterial.modalidadId).then(setFormNiveles).catch(console.error);
    } else {
      setFormNiveles([]);
    }
  }, [newMaterial.modalidadId]);

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este material?')) {
      try {
        await materialService.delete(id);
        fetchData();
      } catch (err) {
        alert('Error deleting material');
        console.error(err);
      }
    }
  };

  const handleEdit = (item: Material) => {
    setEditingId(item.id);
    setNewMaterial({
      titulo: item.titulo,
      descripcion: item.descripcion,
      url: item.url,
      categoriaId: item.categoriaId,
      modalidadId: item.modalidadId,
      nivelId: item.nivelId,
      usuarioEdicionId: typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || 0) : 0,
      precio: item.precio || 0,
      telefono: item.telefono || '',
    });
    setFile(null);
    setIsModalOpen(true);
    // Trigger nivel fetch for form
    if (item.modalidadId) {
        nivelService.getByModalidadId(item.modalidadId).then(setFormNiveles).catch(console.error);
    }
  };

  const handleView = (item: Material) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMaterial.usuarioEdicionId || Number(newMaterial.usuarioEdicionId) <= 0) {
        const storedId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || 0) : 0;
        if (storedId <= 0) {
           alert('Error: No se ha identificado al usuario editor. Por favor, cierre sesión e inicie sesión nuevamente.');
           return;
        }
        newMaterial.usuarioEdicionId = storedId;
    }

    try {
      if (file) {
        const formData = new FormData();
        formData.append('titulo', newMaterial.titulo);
        formData.append('descripcion', newMaterial.descripcion);
        formData.append('categoriaId', String(newMaterial.categoriaId));
        formData.append('modalidadId', String(newMaterial.modalidadId));
        formData.append('nivelId', String(newMaterial.nivelId));
        formData.append('usuarioEdicionId', String(newMaterial.usuarioEdicionId));
        formData.append('precio', String(newMaterial.precio));
        formData.append('telefono', newMaterial.telefono);
        formData.append('file', file);
        if (newMaterial.url) formData.append('url', newMaterial.url);

        if (editingId) {
          formData.append('id', String(editingId));
          await materialService.update(editingId, formData);
        } else {
          await materialService.create(formData);
        }
      } else {
        const materialData = {
          ...newMaterial,
          id: editingId || 0,
        };
        if (editingId) {
          await materialService.update(editingId, materialData);
        } else {
          await materialService.create(newMaterial);
        }
      }

      setIsModalOpen(false);
      setNewMaterial({
        titulo: '',
        descripcion: '',
        url: '',
        categoriaId: 0,
        modalidadId: 0,
        nivelId: 0,
        usuarioEdicionId: typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || 0) : 0,
        precio: 0,
        telefono: '',
      });
      setFile(null);
      setEditingId(null);
      fetchData();
    } catch (err) {
      alert('Error saving material');
      console.error(err);
    }
  };

  const getCategoryName = (id: number) => {
    const category = categories.find((c) => c.id === id);
    return category ? category.nombre : 'Unknown';
  };

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
          Gestión de Recursos
        </h1>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setEditingId(null);
            setFile(null);
            setNewMaterial({
              titulo: '',
              descripcion: '',
              url: '',
              categoriaId: 0,
              modalidadId: 0,
              nivelId: 0,
              usuarioEdicionId: typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || 0) : 0,
              precio: 0,
              telefono: '',
            });
            setFormNiveles([]);
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Recurso
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Título
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materials.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.titulo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                  {item.descripcion}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Ver enlace
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {getCategoryName(item.categoriaId)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleView(item)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                    title="Ver Detalles"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
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

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold">
                  {editingId ? 'Editar Recurso' : 'Agregar Nuevo Recurso'}
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
                  value={newMaterial.titulo}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, titulo: e.target.value })
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Descripción
                </label>
                <textarea
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={newMaterial.descripcion}
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
                      descripcion: e.target.value,
                    })
                  }
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  URL (Opcional si sube archivo)
                </label>
                <input
                  type="url"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={newMaterial.url}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, url: e.target.value })
                  }
                  placeholder="https://ejemplo.com"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  O Subir Archivo (PDF, Imagen)
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Categoría
                </label>
                <select
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={newMaterial.categoriaId}
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
                      categoriaId: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>Seleccionar...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Modalidad
                </label>
                <select
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={newMaterial.modalidadId}
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
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

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nivel
                </label>
                <select
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={newMaterial.nivelId}
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
                      nivelId: Number(e.target.value),
                    })
                  }
                  disabled={!newMaterial.modalidadId}
                >
                  <option value={0}>Seleccionar...</option>
                  {formNiveles.map((nivel) => (
                    <option key={nivel.id} value={nivel.id}>
                      {nivel.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Precio (S/ - deje en 0 si es gratis)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={newMaterial.precio || 0}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, precio: parseFloat(e.target.value) })
                  }
                />
              </div>

               <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                   Teléfono (WhatsApp - opcional)
                </label>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={newMaterial.telefono || ''}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, telefono: e.target.value })
                  }
                  placeholder="51999999999"
                />
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
              <h2 className="text-xl font-bold">Detalles del Recurso</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{viewingItem.titulo}</h3>
                  <p className="text-gray-500 text-sm mt-1">{viewingItem.categoria?.nombre || getCategoryName(viewingItem.categoriaId)}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Descripción</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{viewingItem.descripcion}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Modalidad</label>
                        <p className="text-gray-900 font-medium">
                            {viewingItem.modalidad?.nombre || modalidades.find(m => m.id === viewingItem.modalidadId)?.nombre || 'N/A'}
                        </p>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-500">Nivel</label>
                        <p className="text-gray-900 font-medium">
                            {viewingItem.nivel?.nombre || niveles.find(n => n.id === viewingItem.nivelId)?.nombre || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Precio</label>
                        <p className="text-gray-900 font-medium">
                            {viewingItem.precio > 0 ? `S/ ${viewingItem.precio}` : 'Gratis'}
                        </p>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-500">Contacto</label>
                        <p className="text-gray-900 font-medium">{viewingItem.telefono || 'No especificado'}</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Enlace / Recurso</label>
                     <a
                        href={viewingItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                      >
                         <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        Abrir Recurso
                      </a>
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

export default AdminMaterials;
