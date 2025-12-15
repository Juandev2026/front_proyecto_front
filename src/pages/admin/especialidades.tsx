import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { especialidadesService, Especialidad } from '../../services/especialidadesService';
import { nivelService, Nivel } from '../../services/nivelService';

const AdminEspecialidades = () => {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newEspecialidad, setNewEspecialidad] = useState({
    nombre: '',
    nivelId: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [especialidadesData, nivelesData] = await Promise.all([
        especialidadesService.getAll(),
        nivelService.getAll()
      ]);
      setEspecialidades(especialidadesData);
      setNiveles(nivelesData);
    } catch (err) {
      setError('Error al cargar datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta especialidad?')) {
      try {
        await especialidadesService.delete(id);
        fetchData(); // Reload list
      } catch (err) {
        alert('Error al eliminar especialidad');
        console.error(err);
      }
    }
  };

  const handleEdit = (item: Especialidad) => {
    setEditingId(item.id);
    setNewEspecialidad({
      nombre: item.nombre,
      nivelId: item.nivelId,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (newEspecialidad.nivelId === 0) {
        alert('Por favor seleccione un nivel');
        return;
      }

      if (editingId) {
        await especialidadesService.update(editingId, newEspecialidad);
      } else {
        await especialidadesService.create(newEspecialidad);
      }
      setIsModalOpen(false);
      setNewEspecialidad({ nombre: '', nivelId: 0 });
      setEditingId(null);
      fetchData();
    } catch (err) {
      alert('Error al guardar especialidad');
      console.error(err);
    }
  };

  const getNivelName = (nivelId: number) => {
    const nivel = niveles.find(n => n.id === nivelId);
    return nivel ? nivel.nombre : 'Desconocido';
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
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Especialidades</h1>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setEditingId(null);
            setNewEspecialidad({ nombre: '', nivelId: 0 });
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Nueva Especialidad
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nivel
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {especialidades.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getNivelName(item.nivelId)}
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
            {especialidades.length === 0 && (
                <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                        No hay especialidades registradas.
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
              {editingId ? 'Editar Especialidad' : 'Nueva Especialidad'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newEspecialidad.nombre}
                  onChange={(e) =>
                    setNewEspecialidad({ ...newEspecialidad, nombre: e.target.value })
                  }
                  placeholder="Ej: Matemáticas"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nivel
                </label>
                <select
                  required
                  className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newEspecialidad.nivelId}
                  onChange={(e) =>
                    setNewEspecialidad({ ...newEspecialidad, nivelId: Number(e.target.value) })
                  }
                >
                  <option value={0}>Seleccione un nivel</option>
                  {niveles.map((nivel) => (
                    <option key={nivel.id} value={nivel.id}>
                      {nivel.nombre}
                    </option>
                  ))}
                </select>
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

export default AdminEspecialidades;
