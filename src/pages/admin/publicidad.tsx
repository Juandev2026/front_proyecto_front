import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { publicidadService, Publicidad } from '../../services/publicidadService';
import { modalidadService, Modalidad } from '../../services/modalidadService';
import { nivelService, Nivel } from '../../services/nivelService';

const AdminPublicidad = () => {
  const [publicidades, setPublicidades] = useState<Publicidad[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    titulo: '',
    imageUrl: '',
    enlace: '',
    modalidadId: 0,
    nivelId: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pubData, modData] = await Promise.all([
        publicidadService.getAll(),
        modalidadService.getAll(),
      ]);
      setPublicidades(pubData);
      setModalidades(modData);
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
    if (formData.modalidadId) {
      nivelService.getByModalidadId(formData.modalidadId).then(setNiveles).catch(console.error);
    } else {
      setNiveles([]);
    }
  }, [formData.modalidadId]);

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta publicidad?')) {
      try {
        await publicidadService.delete(id);
        fetchData();
      } catch (err) {
        alert('Error deleting publicidad');
        console.error(err);
      }
    }
  };

  const handleEdit = (item: Publicidad) => {
    setEditingId(item.id);
    setFormData({
      titulo: item.titulo,
      imageUrl: item.imageUrl,
      enlace: item.enlace,
      modalidadId: item.modalidadId,
      nivelId: item.nivelId,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await publicidadService.update(editingId, formData);
      } else {
        await publicidadService.create(formData);
      }
      setIsModalOpen(false);
      setFormData({
        titulo: '',
        imageUrl: '',
        enlace: '',
        modalidadId: 0,
        nivelId: 0,
      });
      setEditingId(null);
      fetchData();
    } catch (err) {
      alert('Error saving publicidad');
      console.error(err);
    }
  };

  if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;
  if (error) return <AdminLayout><div>Error: {error}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Publicidad</h1>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setEditingId(null);
            setFormData({
              titulo: '',
              imageUrl: '',
              enlace: '',
              modalidadId: 0,
              nivelId: 0,
            });
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nueva Publicidad
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imagen</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enlace</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {publicidades.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.titulo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <img src={item.imageUrl} alt={item.titulo} className="h-10 w-10 object-cover rounded" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a href={item.enlace} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link</a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Publicidad' : 'Nueva Publicidad'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Título</label>
                <input
                  type="text"
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">URL Imagen</label>
                <input
                  type="text"
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Enlace (Destino)</label>
                <input
                  type="text"
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.enlace}
                  onChange={(e) => setFormData({ ...formData, enlace: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Modalidad</label>
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
                  disabled={!formData.modalidadId}
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

export default AdminPublicidad;
