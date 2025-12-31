import React, { useState, useEffect, useCallback } from 'react';

import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XIcon,
} from '@heroicons/react/outline';

import AdminLayout from '../../components/AdminLayout';
import {
  informacionRelevanteService,
  InformacionRelevante,
} from '../../services/informacionRelevanteService';

const AdminInformacionRelevante = () => {
  const [data, setData] = useState<InformacionRelevante[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<InformacionRelevante | null>(
    null
  );

  const handleView = (item: InformacionRelevante) => {
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
      onClick={() => openModal(item)}
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
              <h2 className="text-xl font-bold">Detalles de Información Relevante</h2>
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
                   <label className="block text-sm font-medium text-gray-500 mb-1">Imagen</label>
                   {viewingItem.urlImagen ? (
                     <img src={viewingItem.urlImagen} alt={viewingItem.titulo} className="w-full h-auto rounded-lg shadow-sm object-cover max-h-64" />
                   ) : (
                     <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">Sin imagen</div>
                   )}
                </div>
                <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-500">Título</label>
                     <p className="text-lg font-semibold text-gray-900">{viewingItem.titulo}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-500">Precio</label>
                     <p className="text-gray-900">{viewingItem.precio > 0 ? `S/ ${viewingItem.precio}` : 'Gratis'}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-500">Contacto (WhatsApp)</label>
                     <p className="text-gray-900">{viewingItem.telefono || 'No especificado'}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-500">URL / Enlace</label>
                     {viewingItem.url ? (
                       <a href={viewingItem.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                         {viewingItem.url}
                       </a>
                     ) : (
                       <p className="text-gray-500 italic">Sin enlace</p>
                     )}
                   </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-500 mb-2">Descripción</label>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap">
                  {viewingItem.descripcion || 'Sin descripción'}
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
  */
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    urlImagen: '',
    url: '',
    precio: 0,
    telefono: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await informacionRelevanteService.getAll();
      setData(result);
    } catch (error) {
      console.error('Error fetching informacion relevante:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    try {
      await informacionRelevanteService.create(formData);
      setIsModalOpen(false);
      setFormData({
        titulo: '',
        descripcion: '',
        urlImagen: '',
        url: '',
        precio: 0,
        telefono: '',
      });
      fetchData();
    } catch (error) {
      alert('Error creating item');
      console.error(error);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await informacionRelevanteService.update(editingId, formData);
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        titulo: '',
        descripcion: '',
        urlImagen: '',
        url: '',
        precio: 0,
        telefono: '',
      });
      fetchData();
    } catch (error) {
      alert('Error updating item');
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este elemento?')) return;
    try {
      await informacionRelevanteService.delete(id);
      fetchData();
    } catch (error) {
      alert('Error deleting item');
      console.error(error);
    }
  };

  const openModal = (item?: InformacionRelevante) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        titulo: item.titulo,
        descripcion: item.descripcion,
        urlImagen: item.urlImagen,
        url: item.url,
        precio: item.precio || 0,
        telefono: item.telefono || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        titulo: '',
        descripcion: '',
        urlImagen: '',
        url: '',
        precio: 0,
        telefono: '',
      });
    }
    setIsModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Información Relevante
        </h1>
        <button
          onClick={() => openModal()}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Elemento
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Imagen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Título
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                URL
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No hay elementos registrados.
                </td>
              </tr>
            )}
            {!loading &&
              data.length > 0 &&
              data.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.urlImagen ? (
                      <img
                        src={item.urlImagen}
                        alt={item.titulo}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.titulo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.precio > 0 ? `S/ ${item.precio}` : 'Gratis'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.telefono || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-blue-500 max-w-xs truncate">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.url}
                    </a>
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
                      onClick={() => openModal(item)}
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

      {/* View Modal */}
      {isViewModalOpen && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                Detalles de Información Relevante
              </h2>
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
                  {viewingItem.urlImagen ? (
                    <img
                      src={viewingItem.urlImagen}
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
                      Contacto (WhatsApp)
                    </label>
                    <p className="text-gray-900">
                      {viewingItem.telefono || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      URL / Enlace
                    </label>
                    {viewingItem.url ? (
                      <a
                        href={viewingItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {viewingItem.url}
                      </a>
                    ) : (
                      <p className="text-gray-500 italic">Sin enlace</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Descripción
                </label>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap">
                  {viewingItem.descripcion || 'Sin descripción'}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Elemento' : 'Nuevo Elemento'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingId) {
                  handleUpdate();
                } else {
                  handleCreate();
                }
              }}
            >
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

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Descripción
                </label>
                <textarea
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  URL Imagen
                </label>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.urlImagen}
                  onChange={(e) =>
                    setFormData({ ...formData, urlImagen: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  URL Enlace
                </label>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Precio (S/)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.precio}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      precio: parseFloat(e.target.value),
                    })
                  }
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Teléfono / Celular (WhatsApp)
                </label>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
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
    </AdminLayout>
  );
};
export default AdminInformacionRelevante;
