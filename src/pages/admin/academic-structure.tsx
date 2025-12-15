import React, { useState, useEffect, useCallback } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, XIcon } from '@heroicons/react/outline';
import AdminLayout from '../../components/AdminLayout';
import { modalidadService, Modalidad } from '../../services/modalidadService';
import { nivelService, Nivel } from '../../services/nivelService';
import { especialidadesService, Especialidad } from '../../services/especialidadesService';

type TabType = 'modalidades' | 'niveles' | 'especialidades';

const AcademicStructure = () => {
  const [activeTab, setActiveTab] = useState<TabType>('modalidades');
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    modalidadId: 0,
    nivelId: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch related data if needed for dropdowns (modalidades for niveles, niveles for especialidades)
      // Optimally we fetch what we need.
      const [modalidadesData, nivelesData, especialidadesData] = await Promise.all([
        modalidadService.getAll(),
        nivelService.getAll(),
        (activeTab === 'especialidades') ? especialidadesService.getAll() : Promise.resolve([]),
      ]);
      
      setModalidades(modalidadesData);
      setNiveles(nivelesData);
      if (activeTab === 'especialidades') {
        setEspecialidades(especialidadesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    try {
      if (activeTab === 'modalidades') {
        await modalidadService.create({ nombre: formData.nombre });
      } else if (activeTab === 'niveles') {
        await nivelService.create({
          nombre: formData.nombre,
          modalidadId: formData.modalidadId,
        });
      } else {
        await especialidadesService.create({
            nombre: formData.nombre,
            nivelId: formData.nivelId,
        });
      }
      closeModal();
      fetchData();
    } catch (error) {
      alert('Error creating item');
      console.error(error);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      if (activeTab === 'modalidades') {
        await modalidadService.update(editingId, { nombre: formData.nombre });
      } else if (activeTab === 'niveles') {
        await nivelService.update(editingId, {
          nombre: formData.nombre,
          modalidadId: formData.modalidadId,
        });
      } else {
         await especialidadesService.update(editingId, {
            nombre: formData.nombre,
            nivelId: formData.nivelId,
         });
      }
      closeModal();
      fetchData();
    } catch (error) {
      alert('Error updating item');
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este elemento?')) return;
    try {
      if (activeTab === 'modalidades') {
        await modalidadService.delete(id);
      } else if (activeTab === 'niveles') {
        await nivelService.delete(id);
      } else {
        await especialidadesService.delete(id);
      }
      fetchData();
    } catch (error) {
      alert('Error deleting item');
      console.error(error);
    }
  };

  const openModal = (item?: Modalidad | Nivel | Especialidad) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        nombre: item.nombre,
        modalidadId: (item as Nivel).modalidadId || 0,
        nivelId: (item as Especialidad).nivelId || 0,
      });
    } else {
      setEditingId(null);
      setFormData({ nombre: '', modalidadId: 0, nivelId: 0 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ nombre: '', modalidadId: 0, nivelId: 0 });
  };

  const TabButton = ({ type, label }: { type: TabType; label: string }) => (
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

  const currentData = activeTab === 'modalidades' ? modalidades : (activeTab === 'niveles' ? niveles : especialidades);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Estructura Académica
        </h1>
        <button
          onClick={() => openModal()}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          {activeTab === 'modalidades' ? 'Nueva Modalidad' : (activeTab === 'niveles' ? 'Nuevo Nivel' : 'Nueva Especialidad')}
        </button>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-4">
          <TabButton type="modalidades" label="Modalidades" />
          <TabButton type="niveles" label="Niveles" />
          <TabButton type="especialidades" label="Especialidades" />
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
              {activeTab === 'niveles' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modalidad
                </th>
              )}
               {activeTab === 'especialidades' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nivel
                </th>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading &&
              currentData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No hay registros.
                  </td>
                </tr>
              )}
            {!loading &&
              currentData.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.nombre}
                  </td>
                  {activeTab === 'niveles' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {modalidades.find((m) => m.id === (item as Nivel).modalidadId)?.nombre || (item as Nivel).modalidad?.nombre || '-'}
                    </td>
                  )}
                  {activeTab === 'especialidades' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {niveles.find((n) => n.id === (item as Especialidad).nivelId)?.nombre || (item as Especialidad).nivel?.nombre || '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(item as any)}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar' : 'Crear'}{' '}
                {activeTab === 'modalidades' ? 'Modalidad' : (activeTab === 'niveles' ? 'Nivel' : 'Especialidad')}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                editingId ? handleUpdate() : handleCreate();
              }}
            >
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

              {activeTab === 'niveles' && (
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Modalidad
                  </label>
                  <select
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={formData.modalidadId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
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
              )}

             {activeTab === 'especialidades' && (
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Nivel
                  </label>
                  <select
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={formData.nivelId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nivelId: Number(e.target.value),
                      })
                    }
                  >
                    <option value={0}>Seleccionar...</option>
                    {niveles.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeModal}
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

export default AcademicStructure;
