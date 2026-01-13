import React, { useState, useEffect } from 'react';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XIcon,
  DocumentTextIcon,
} from '@heroicons/react/outline';
import AdminLayout from '../../components/AdminLayout';
import {
  normasLegalesService,
  NormaLegal,
} from '../../services/normasLegalesService';
import { uploadService } from '../../services/uploadService';

const AdminNormasLegales = () => {
  const [normas, setNormas] = useState<NormaLegal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    url: '',
    imagenUrl: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await normasLegalesService.getAll();
      setNormas(data);
    } catch (err) {
      setError('Error cargando normas legales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta norma legal?')) {
      try {
        await normasLegalesService.delete(id);
        fetchData();
      } catch (err) {
        alert('Error al eliminar');
      }
    }
  };

  const handleEdit = (item: NormaLegal) => {
    setEditingId(item.id);
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion,
      url: item.url,
      imagenUrl: item.imagenUrl || '',
    });
    setFile(null); // Reset file input when editing
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalUrl = formData.url;

      if (file) {
        try {
          finalUrl = await uploadService.uploadImage(file);
        } catch (uploadError) {
          alert('Error al subir el archivo PDF');
          return;
        }
      }

      let finalImageUrl = formData.imagenUrl;
      if (imageFile) {
        try {
          finalImageUrl = await uploadService.uploadImage(imageFile);
        } catch (uploadError) {
          alert('Error al subir la imagen');
          return;
        }
      }

      if (!finalUrl) {
         alert('Por favor, suba un PDF o ingrese una URL.');
         return;
      }

      const payload = {
        ...formData,
        url: finalUrl,
        imagenUrl: finalImageUrl,
      };

      if (editingId) {
        await normasLegalesService.update(editingId, payload);
      } else {
        await normasLegalesService.create(payload);
      }
      setIsModalOpen(false);
      setFormData({
        nombre: '',
        descripcion: '',
        url: '',
        imagenUrl: '',
      });
      setFile(null);
      setImageFile(null);
      setEditingId(null);
      fetchData();
    } catch (err) {
      alert('Error guardando la norma legal');
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div>Cargando...</div>
      </AdminLayout>
    );

  if (error)
    return (
        <AdminLayout>
            <div className="text-red-500">Error: {error}</div>
        </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Normas Legales
        </h1>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setEditingId(null);
            setFormData({ nombre: '', descripcion: '', url: '', imagenUrl: '' });
            setFile(null);
            setImageFile(null);
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nueva Norma
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Archivo
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {normas.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {item.nombre}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {item.descripcion}
                </td>
                <td className="px-6 py-4 text-sm text-blue-600">
                   <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                      <DocumentTextIcon className="w-4 h-4"/> Ver PDF
                   </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Norma' : 'Nueva Norma'}
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
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Descripción
                </label>
                <textarea
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                   Imagen de Portada
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="text-xs text-gray-500 mb-1">O ingrese URL de imagen:</div>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.imagenUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imagenUrl: e.target.value })
                  }
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                   Subir PDF (o Imagen)
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="text-xs text-gray-500 mb-1">O ingrese URL directa:</div>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://ejemplo.com/documento.pdf"
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

export default AdminNormasLegales;
