import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { regionService, Region } from '../../services/regionService';

const AdminRegions = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newRegion, setNewRegion] = useState({
    nombre: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await regionService.getAll();
      setRegions(data);
    } catch (err) {
      setError('Error al cargar regiones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta región?')) {
      try {
        await regionService.delete(id);
        fetchData();
      } catch (err) {
        alert('Error al eliminar región');
        console.error(err);
      }
    }
  };

  const handleEdit = (item: Region) => {
    setEditingId(item.id);
    setNewRegion({
      nombre: item.nombre,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await regionService.update(editingId, newRegion);
      } else {
        await regionService.create(newRegion);
      }
      setIsModalOpen(false);
      setNewRegion({ nombre: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      alert('Error al guardar región');
      console.error(err);
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );

  if (error)
    return (
      <AdminLayout>
        <div className="text-red-500 text-center mt-10">Error: {error}</div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Regiones</h1>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setEditingId(null);
            setNewRegion({ nombre: '' });
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Nueva Región
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
                Nombre
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {regions.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900 font-semibold"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {regions.length === 0 && (
                <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                        No hay regiones registradas.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-gray-800">
              {editingId ? 'Editar Región' : 'Nueva Región'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nombre de la Región
                </label>
                <input
                  type="text"
                  required
                  className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newRegion.nombre}
                  onChange={(e) =>
                    setNewRegion({ ...newRegion, nombre: e.target.value })
                  }
                  placeholder="Ej: Región Central"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-600 hover:text-gray-800 font-medium py-2 px-4 rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow-md transition-all transform hover:scale-105"
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

export default AdminRegions;
