import React, { useState, useEffect, useCallback } from 'react';

import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XIcon,
} from '@heroicons/react/outline';

import AdminLayout from '../../components/AdminLayout';
import { categoriaService } from '../../services/categoriaService';
import { categoriaGeneralService } from '../../services/categoriaGeneralService';
import { categoriaSimpleService } from '../../services/categoriaSimpleService';

// Unified Interface for UI handling
interface CategoryItem {
  id: number;
  nombre: string;
}

type CategoryType = 'standard' | 'general' | 'simple';

const AdminCategories = () => {
  const [activeTab, setActiveTab] = useState<CategoryType>('standard');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<CategoryItem | null>(null);
  const [formData, setFormData] = useState({ nombre: '' });

  const handleView = (item: CategoryItem) => {
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
              <h2 className="text-xl font-bold">
                Detalles de Categoría
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
              <div>
                <label className="block text-sm font-medium text-gray-500">Tipo</label>
                <p className="mt-1 text-gray-900">
                  {activeTab === 'standard' && 'Categoría de Video'}
                  {activeTab === 'general' && 'Categoría de Noticia'}
                  {activeTab === 'simple' && 'Categoría de Material'}
                </p>
              </div>
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

  // Fetch logic based on active tab
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      let data: CategoryItem[] = [];
      switch (activeTab) {
        case 'standard':
          data = await categoriaService.getAll();
          break;
        case 'general':
          data = await categoriaGeneralService.getAll();
          break;
        case 'simple':
          data = await categoriaSimpleService.getAll();
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
        case 'standard':
          await categoriaService.create({ nombre: formData.nombre });
          break;
        case 'general':
          await categoriaGeneralService.create({ nombre: formData.nombre });
          break;
        case 'simple':
          await categoriaSimpleService.create({ nombre: formData.nombre });
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
        case 'standard':
          await categoriaService.update(editingId, {
            nombre: formData.nombre,
          });
          break;
        case 'general':
          await categoriaGeneralService.update(editingId, {
            // Some APIs might expect ID in body, passing it to be safe as per previous code
            // but the service interface I wrote takes { nombre } for update payload usually? 
            // Previous code passed ID. I'll adhere to service signature or previous pattern.
            // My new service signature for update is (id, {nombre}). 
            // Previous cursoCategoriaService.update took {id, nombre}.
            // My new services strictly take {nombre} in the body for update but URL has ID. 
            // Let's pass {nombre} only as my new service expects that.
             nombre: formData.nombre,
          });
          break;
        case 'simple':
          await categoriaSimpleService.update(editingId, {
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
        case 'standard':
          await categoriaService.delete(id);
          break;
        case 'general':
          await categoriaGeneralService.delete(id);
          break;
        case 'simple':
          await categoriaSimpleService.delete(id);
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
        <p className="mt-1 text-sm text-gray-500">
          Administra las clasificaciones para Cursos, Noticias y Materiales desde este panel.
        </p>
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
          <TabButton type="standard" label="Categoría de Cursos" />
          <TabButton type="general" label="Categoría de Noticias" />
          <TabButton type="simple" label="Categoría de Materiales" />
        </div>
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
              {activeTab === 'standard' &&
                'Estás gestionando las categorías para **Cursos**. Estas etiquetas permitirán filtrar y organizar el contenido de los cursos.'}
              {activeTab === 'general' &&
                'Estás gestionando las categorías para **Noticias**. Utilízalas para clasificar los anuncios y novedades.'}
              {activeTab === 'simple' &&
                'Estás gestionando las categorías para **Materiales**. Ayudan a organizar los documentos y recursos descargables.'}
            </p>
          </div>
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
                  placeholder="Ej. Matemáticas, Avisos Importantes, Guías..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Escribe un nombre corto y descriptivo para identificar esta
                  categoría en el sistema.
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

      {/* View Modal */}
      {isViewModalOpen && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                Detalles de Categoría
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
              <div>
                <label className="block text-sm font-medium text-gray-500">Tipo</label>
                <p className="mt-1 text-gray-900">
                  {activeTab === 'standard' && 'Categoría de Curso'}
                  {activeTab === 'general' && 'Categoría de Noticia'}
                  {activeTab === 'simple' && 'Categoría de Material'}
                </p>
              </div>
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

export default AdminCategories;
