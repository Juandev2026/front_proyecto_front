import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XIcon,
} from '@heroicons/react/outline';
import AdminLayout from '../../components/AdminLayout';
import {
  anunciosGeneralesService,
  AnuncioGeneral,
} from '../../services/anunciosGeneralesService';
import { uploadService } from '../../services/uploadService';

const AdminAnunciosGenerales = () => {
  const [anuncios, setAnuncios] = useState<AnuncioGeneral[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const initialFormState = {
    titulo: '',
    descripcion: '',
    celular: '',
    imagenUrl: '',
    ruta: '',
    precio: 0,
    telefono: '',
  };

  const [currentAnuncio, setCurrentAnuncio] = useState(initialFormState);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await anunciosGeneralesService.getAll();
      setAnuncios(data);
    } catch (error) {
      console.error('Error fetching anuncios:', error);
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
        await anunciosGeneralesService.delete(id);
        setAnuncios(anuncios.filter((a) => a.id !== id));
      } catch (error) {
        alert('Error al eliminar el anuncio');
      }
    }
  };

  const handleEdit = (anuncio: AnuncioGeneral) => {
    setCurrentAnuncio({
      titulo: anuncio.titulo,
      descripcion: anuncio.descripcion,
      celular: anuncio.celular,
      imagenUrl: anuncio.imagenUrl,
      ruta: anuncio.ruta,
      precio: anuncio.precio,
      telefono: anuncio.telefono,
    });
    setEditingId(anuncio.id);
    setPreviewUrl(anuncio.imagenUrl || '');
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setCurrentAnuncio(initialFormState);
    setEditingId(null);
    setSelectedImage(null);
    setPreviewUrl('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalUrl = currentAnuncio.imagenUrl;

      if (selectedImage) {
        try {
          finalUrl = await uploadService.uploadImage(selectedImage);
        } catch (error) {
          alert('Error al subir la imagen.');
          return;
        }
      }

      const dataToSend = {
        ...currentAnuncio,
        imagenUrl: finalUrl,
      };

      if (editingId) {
        await anunciosGeneralesService.update(editingId, {
          id: editingId,
          ...dataToSend,
        } as AnuncioGeneral);
      } else {
        await anunciosGeneralesService.create(dataToSend);
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      alert('Error al guardar el anuncio');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Anuncios Generales
        </h1>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Anuncio
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
                Celular/Tel
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  Cargando...
                </td>
              </tr>
            ) : (
              anuncios.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.imagenUrl && (
                      <img
                        src={item.imagenUrl}
                        alt={item.titulo}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.titulo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    S/ {item.precio}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.celular} / {item.telefono}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
            {!loading && anuncios.length === 0 && (
                 <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay anuncios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-8 py-4 border-b border-gray-200 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Anuncio' : 'Nuevo Anuncio'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={currentAnuncio.titulo}
                  onChange={(e) =>
                    setCurrentAnuncio({
                      ...currentAnuncio,
                      titulo: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={currentAnuncio.descripcion}
                  onChange={(e) =>
                    setCurrentAnuncio({
                      ...currentAnuncio,
                      descripcion: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={currentAnuncio.precio}
                    onChange={(e) =>
                      setCurrentAnuncio({
                        ...currentAnuncio,
                        precio: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ruta (URL destino)
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={currentAnuncio.ruta}
                    onChange={(e) =>
                      setCurrentAnuncio({
                        ...currentAnuncio,
                        ruta: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Celular
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={currentAnuncio.celular}
                    onChange={(e) =>
                      setCurrentAnuncio({
                        ...currentAnuncio,
                        celular: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={currentAnuncio.telefono}
                    onChange={(e) =>
                      setCurrentAnuncio({
                        ...currentAnuncio,
                        telefono: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagen
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setSelectedImage(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                />
                 <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent mt-2"
                      value={currentAnuncio.imagenUrl}
                      onChange={(e) => {
                        setCurrentAnuncio({
                          ...currentAnuncio,
                          imagenUrl: e.target.value,
                        });
                        setPreviewUrl(e.target.value);
                      }}
                      placeholder="O ingresa una URL de imagen"
                    />
                {previewUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Vista previa
                    </p>
                    <img
                      src={previewUrl}
                      alt="Vista previa"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mr-3 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
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

export default AdminAnunciosGenerales;
