import React, { useState, useEffect, useCallback } from 'react';

import AdminLayout from '../../components/AdminLayout';
import { categoriaGeneralService, CategoriaGeneral } from '../../services/categoriaGeneralService';
import { noticiaService, Noticia } from '../../services/noticiaService';

const AdminNews = () => {
  const [news, setNews] = useState<Noticia[]>([]);
  const [categories, setCategories] = useState<CategoriaGeneral[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Noticia>>({
    titulo: '',
    descripcion: '',
    categoriaId: 0,
    fecha: new Date().toISOString(),
    imageUrl: '',
    esDestacado: false,
    usuarioEdicionId: typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || 0) : 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      const data = await noticiaService.getAll();
      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoriaGeneralService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    fetchCategories();
  }, [fetchNews, fetchCategories]);

  const handleDelete = async (id: number) => {
    // eslint-disable-next-line no-alert
    if (window.confirm('¿Estás seguro de eliminar esta noticia?')) {
      try {
        await noticiaService.delete(id);
        fetchNews();
      } catch (error) {
        console.error('Error deleting news:', error);
      }
    }
  };

  const handleEdit = (item: Noticia) => {
    setEditingId(item.id);
    setFormData({
      titulo: item.titulo,
      descripcion: item.descripcion,
      categoriaId: item.categoriaId || 0,
      fecha: item.fecha,
      imageUrl: item.imageUrl,
      esDestacado: item.esDestacado,
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      titulo: '',
      descripcion: '',
      categoriaId: categories.length > 0 ? categories[0]?.id : 0,
      fecha: new Date().toISOString(),
      imageUrl: '',
      esDestacado: false,
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoriaId || formData.categoriaId <= 0) {
      alert(
        `Por favor, seleccione una categoría válida. (ID actual: ${formData.categoriaId}, Categorías disponibles: ${categories.length})`
      );
      return;
    }

    if (!formData.usuarioEdicionId || Number(formData.usuarioEdicionId) <= 0) {
      // Try to recover from localStorage again just in case
       const storedId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || 0) : 0;
       if (storedId <= 0) {
          alert('Error: No se ha identificado al usuario editor. Por favor, cierre sesión e inicie sesión nuevamente para actualizar sus credenciales.');
          return;
       }
       formData.usuarioEdicionId = storedId;
    }

    try {
      if (imageFile) {
        const dataToSend = new FormData();
        dataToSend.append('titulo', formData.titulo || '');
        dataToSend.append('descripcion', formData.descripcion || '');
        dataToSend.append('categoriaId', String(formData.categoriaId || 0));
        dataToSend.append(
          'fecha',
          new Date(formData.fecha || new Date()).toISOString()
        );
        dataToSend.append('esDestacado', String(formData.esDestacado || false));
        dataToSend.append('usuarioEdicionId', String(formData.usuarioEdicionId || 0));
        dataToSend.append('image', imageFile);

        if (editingId) {
          dataToSend.append('id', String(editingId));
          await noticiaService.update(editingId, dataToSend);
        } else {
          await noticiaService.create(dataToSend);
        }
      } else {
        const dataToSend = {
          id: editingId || 0,
          titulo: formData.titulo || '',
          descripcion: formData.descripcion || '',
          categoriaId: formData.categoriaId || 0,
          fecha: new Date(formData.fecha || new Date()).toISOString(),
          imageUrl: formData.imageUrl || null, // Send null if empty string
          esDestacado: formData.esDestacado || false,
          usuarioEdicionId: formData.usuarioEdicionId || 0,
        };

        if (editingId) {
          await noticiaService.update(editingId, dataToSend as Noticia);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
          const { id, ...createData } = dataToSend;
          await noticiaService.create(createData);
        }
      }
      setIsModalOpen(false);
      fetchNews();
    } catch (error) {
      console.error('Error saving news:', error);
    }
  };

  const getCategoryName = (id: number) => {
    const category = categories.find((c) => c.id === id);
    return category ? category.nombre : 'Desconocida';
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Noticias
        </h1>
        <button
          onClick={handleAddNew}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
          Nueva Noticia
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
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Destacado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {news.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.titulo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {getCategoryName(item.categoriaId)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(item.fecha).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.esDestacado ? (
                    <span className="text-green-600 font-bold">Sí</span>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full my-8">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Noticia' : 'Agregar Nueva Noticia'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
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

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Descripción
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Categoría
                    </label>
                    <select
                      required
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={formData.categoriaId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          categoriaId: Number(e.target.value),
                        })
                      }
                    >
                      <option value={0} disabled>
                        Seleccione una categoría
                      </option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Fecha
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={
                        formData.fecha
                          ? new Date(formData.fecha).toISOString().slice(0, 16)
                          : ''
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fecha: new Date(e.target.value).toISOString(),
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    URL de Imagen (Opcional)
                  </label>
                  <input
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                    value={formData.imageUrl || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    O subir imagen
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="esDestacado"
                    className="mr-2 leading-tight"
                    checked={formData.esDestacado}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        esDestacado: e.target.checked,
                      })
                    }
                  />
                  <label
                    className="block text-gray-700 text-sm font-bold"
                    htmlFor="esDestacado"
                  >
                    ¿Es Destacado?
                  </label>
                </div>
              </div>

              <div className="flex justify-end mt-6">
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

export default AdminNews;
