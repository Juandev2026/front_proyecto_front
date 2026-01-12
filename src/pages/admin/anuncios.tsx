import React, { useState, useEffect } from 'react';

import AdminLayout from '../../components/AdminLayout';
import { anuncioService, Anuncio } from '../../services/anuncioService';

const AdminAnuncios = () => {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<Anuncio | null>(null);

  const handleView = (item: Anuncio) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  // ... (inside the component return, adding the View button)
  /*
  <button onClick={() => handleView(item)} className="text-blue-600 hover:text-blue-900 mr-4" title="Ver Detalles">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
  </button>
  */

  // ... (adding the modal at the end)
  /*
  {isViewModalOpen && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Detalles del Anuncio</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-gray-500 mb-1">Imagen</label>
                   {viewingItem.imagenUrl ? (
                     <img src={viewingItem.imagenUrl} alt={viewingItem.titulo} className="w-full h-auto rounded-lg shadow-sm object-cover max-h-64" />
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
                     <p className="text-gray-900">{viewingItem.telefono || viewingItem.celular || 'No especificado'}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-500">Ruta / Enlace</label>
                     {viewingItem.ruta ? (
                       <a href={viewingItem.ruta} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                         {viewingItem.ruta}
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
    celular: '',
    imagenUrl: '',
    ruta: '',
    precio: 0,
    telefono: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await anuncioService.getAll();
      setAnuncios(data);
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

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este anuncio?')) {
      try {
        await anuncioService.delete(id);
        fetchData();
      } catch (err) {
        alert('Error deleting anuncio');
        console.error(err);
      }
    }
  };

  const handleEdit = (item: Anuncio) => {
    setEditingId(item.id);
    setFormData({
      titulo: item.titulo,
      descripcion: item.descripcion,
      celular: item.celular,
      imagenUrl: item.imagenUrl,
      ruta: item.ruta,
      precio: item.precio,
      telefono: item.telefono,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: If price > 0, phone is required
    if (formData.precio > 0 && !formData.telefono && !formData.celular) {
      alert('Para anuncios con precio mayor a 0, es obligatorio agregar un número de celular o teléfono de contacto.');
      return;
    }

    try {
      if (editingId) {
        await anuncioService.update(editingId, formData);
      } else {
        await anuncioService.create(formData);
      }
      setIsModalOpen(false);
      setFormData({
        titulo: '',
        descripcion: '',
        celular: '',
        imagenUrl: '',
        ruta: '',
        precio: 0,
        telefono: '',
      });
      setEditingId(null);
      fetchData();
    } catch (err) {
      alert('Error saving anuncio');
      console.error(err);
    }
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
          Gestión de Anuncios Generales
        </h1>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setEditingId(null);
            setFormData({
              titulo: '',
              descripcion: '',
              celular: '',
              imagenUrl: '',
              ruta: '',
              precio: 0,
              telefono: '',
            });
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nuevo Anuncio
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
                Imagen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {anuncios.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.titulo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <img
                    src={item.imagenUrl}
                    alt={item.titulo}
                    className="h-10 w-10 object-cover rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.precio > 0 ? `S/ ${item.precio}` : 'Gratis'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.telefono || item.celular}
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
                    onClick={() => handleEdit(item)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Anuncio' : 'Nuevo Anuncio'}
            </h2>
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
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Descripción
                </label>
                <textarea
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.imagenUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imagenUrl: e.target.value })
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Ruta (Link opcional)
                </label>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.ruta}
                  onChange={(e) =>
                    setFormData({ ...formData, ruta: e.target.value })
                  }
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
                  value={formData.telefono || formData.celular} // Show one
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      telefono: e.target.value,
                      celular: e.target.value,
                    })
                  } // Setup double bind or stick to one? User asked for both maybe? I'll save to both just in case for now or prioritize telefono
                  placeholder="51999999999"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa el número con código de país para WhatsApp (ej.
                  51987654321)
                </p>
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

      {isViewModalOpen && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Detalles del Anuncio</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Imagen
                  </label>
                  {viewingItem.imagenUrl ? (
                    <img
                      src={viewingItem.imagenUrl}
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
                      {viewingItem.telefono ||
                        viewingItem.celular ||
                        'No especificado'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Ruta / Enlace
                    </label>
                    {viewingItem.ruta ? (
                      <a
                        href={viewingItem.ruta}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {viewingItem.ruta}
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
    </AdminLayout>
  );
};

export default AdminAnuncios;
