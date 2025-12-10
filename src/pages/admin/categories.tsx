import React, { useState, useEffect, useCallback } from 'react';

import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XIcon,
} from '@heroicons/react/outline';

import AdminLayout from '../../components/AdminLayout';
import { categoriaService } from '../../services/categoriaService';
import { cursoCategoriaService } from '../../services/cursoCategoriaService';
import { materialCategoriaService } from '../../services/materialCategoriaService';

// Unified Interface for UI handling
interface CategoryItem {
  id: number;
  nombre: string;
}

type CategoryType = 'news' | 'courses' | 'materials';

const AdminCategories = () => {
  const [activeTab, setActiveTab] = useState<CategoryType>('news');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nombre: '' });

  // Fetch logic based on active tab
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      let data: CategoryItem[] = [];
      switch (activeTab) {
        case 'news':
          data = await categoriaService.getAll();
          break;
        case 'courses':
          data = await cursoCategoriaService.getAll();
          break;
        case 'materials':
          data = await materialCategoriaService.getAll();
          break;
        default:
          break;
      }
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async () => {
    try {
      switch (activeTab) {
        case 'news':
          await categoriaService.create({ nombre: formData.nombre });
          break;
        case 'courses':
          await cursoCategoriaService.create({ nombre: formData.nombre });
          break;
        case 'materials':
          await materialCategoriaService.create({ nombre: formData.nombre });
          break;
        default:
          break;
      }
      setIsModalOpen(false);
      setFormData({ nombre: '' });
      fetchCategories();
    } catch (error) {
      alert('Error creating category');
      console.error(error);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      switch (activeTab) {
        case 'news':
          await categoriaService.update(editingId, {
            nombre: formData.nombre,
          });
          break;
        case 'courses':
          await cursoCategoriaService.update(editingId, {
            id: editingId,
            nombre: formData.nombre,
          });
          break;
        case 'materials':
          await materialCategoriaService.update(editingId, {
            id: editingId,
            nombre: formData.nombre,
          });
          break;
        default:
          break;
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ nombre: '' });
      fetchCategories();
    } catch (error) {
      alert('Error updating category');
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;
    try {
      switch (activeTab) {
        case 'news':
          await categoriaService.delete(id);
          break;
        case 'courses':
          await cursoCategoriaService.delete(id);
          break;
        case 'materials':
          await materialCategoriaService.delete(id);
          break;
        default:
          break;
      }
      fetchCategories();
    } catch (error) {
      alert('Error deleting category');
      console.error(error);
    }
  };

  const openModal = (category?: CategoryItem) => {
    if (category) {
      setEditingId(category.id);
      setFormData({ nombre: category.nombre });
    } else {
      setEditingId(null);
      setFormData({ nombre: '' });
    }
    setIsModalOpen(true);
  };

  const TabButton = ({
    type,
    label,
  }: {
    type: CategoryType;
    label: string;
  }) => (
    <button
      onClick={() => setActiveTab(type)}
      className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
        activeTab === type
          ? 'border-primary text-primary'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Categorías
        </h1>
        <button
          onClick={() => openModal()}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nueva Categoría
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-4">
          <TabButton type="news" label="Noticias" />
          <TabButton type="courses" label="Cursos" />
          <TabButton type="materials" label="Materiales" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  No hay categorías registradas.
                </td>
              </tr>
            )}
            {!loading &&
              categories.length > 0 &&
              categories.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(item)}
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
              ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
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
              <div className="mb-6">
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

export default AdminCategories;
