import React, { useState, useEffect } from 'react';

import AdminLayout from '../../components/AdminLayout';
import { categoriaSimpleService, CategoriaSimple } from '../../services/categoriaSimpleService';
import { materialService, Material } from '../../services/materialService';
import { modalidadService, Modalidad } from '../../services/modalidadService';
import { nivelService, Nivel } from '../../services/nivelService';
// Line 8 removed
const AdminMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<CategoriaSimple[]>([]);
  // Line 13 removed
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newMaterial, setNewMaterial] = useState({
    titulo: '',
    descripcion: '',
    url: '',
    categoriaId: 0,
    modalidadId: 0,
    nivelId: 0,
    usuarioEdicionId: typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || 0) : 0,
  });
  const [file, setFile] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [materialsData, categoriesData, modalidadesData] = await Promise.all([
        materialService.getAll(),
        categoriaSimpleService.getAll(),
        modalidadService.getAll(),
      ]);
      setMaterials(materialsData);
      setCategories(categoriesData);
      setModalidades(modalidadesData);
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

  useEffect(() => {
    if (newMaterial.modalidadId) {
      nivelService.getByModalidadId(newMaterial.modalidadId).then(setNiveles).catch(console.error);
    } else {
      setNiveles([]);
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
    });
    setFile(null);
    setIsModalOpen(true);
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
            });
          }}
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Recurso' : 'Agregar Nuevo Recurso'}
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
                  {niveles.map((nivel) => (
                    <option key={nivel.id} value={nivel.id}>
                      {nivel.nombre}
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
    </AdminLayout>
  );
};

export default AdminMaterials;
