import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { userService, User } from '../../services/userService';
import { regionService, Region } from '../../services/regionService';
import { modalidadService, Modalidad } from '../../services/modalidadService';
import { nivelService, Nivel } from '../../services/nivelService';

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    nombreCompleto: '',
    email: '',
    password: '',
    role: 'Client',
    celular: '',
    regionId: 0,
    modalidadId: 0,
    nivelId: 0,
    especialidadId: 0,
    passwordHash: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, regionsData, modalidadesData, nivelesData] = await Promise.all([
        userService.getAll(),
        regionService.getAll(),
        modalidadService.getAll(),
        nivelService.getAll()
      ]);
      
      setUsers(usersData);
      setRegions(regionsData);
      setModalidades(modalidadesData);
      setNiveles(nivelesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Reconstruct nested objects (some backends require them even if ID is present)
        const selectedRegion = regions.find(r => r.id === formData.regionId);
        const selectedModalidad = modalidades.find(m => m.id === formData.modalidadId);
        const selectedNivel = niveles.find(n => n.id === formData.nivelId);
        // Note: especialidades list is not currently fetched in loadData for the main table, 
        // but we assume we might need it or backend handles null. 
        // If especialidadId is updated to 0/null, we send null? 
        // Let's adhere to the structure:
        
        const payload: any = { ...formData };
        
        if (selectedRegion) {
             payload.region = { id: selectedRegion.id, nombre: selectedRegion.nombre };
        }
        if (selectedModalidad) {
             payload.modalidad = { id: selectedModalidad.id, nombre: selectedModalidad.nombre };
        }
        // Nesting logic based on schema provided by user (Nivel contains Modalidad?)
        if (selectedNivel) {
             payload.nivel = { 
                 id: selectedNivel.id, 
                 nombre: selectedNivel.nombre,
                 modalidadId: selectedNivel.modalidadId,
                 modalidad: { id: selectedNivel.modalidadId, nombre: 'string' } // Mocking if we don't have full object ref handy without lookup, or lookup again
             };
             // Better lookup for nested
             const modalForNivel = modalidades.find(m => m.id === selectedNivel.modalidadId);
             if (modalForNivel) {
                 payload.nivel.modalidad = { id: modalForNivel.id, nombre: modalForNivel.nombre };
             }
        }
        
        // For Especialidad, we need to know if we have that list. 
        // We are NOT fetching especialidades in loadData currently except for `nivelService.getAll()`? 
        // Wait, loadData does NOT fetch especialidades. 
        // So we can only send ID or we need to fetch them if we want to send the object.
        // Let's try sending just the properties we can resolve.
        
        await userService.update(editingUser.id, payload);
      } else {
        await userService.create(formData as User);
      }
      setIsModalOpen(false);
      setEditingUser(null);
      resetForm();
      loadUsersOnly();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  const loadUsersOnly = async () => {
     try {
         const data = await userService.getAll();
         setUsers(data);
     } catch(e) { console.error(e); }
  }

  const resetForm = () => {
      setFormData({
        nombreCompleto: '',
        email: '',
        password: '',
        role: 'Client',
        celular: '',
        regionId: 0,
        modalidadId: 0,
        nivelId: 0,
        especialidadId: 0,
        passwordHash: ''
      });
  }

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      nombreCompleto: user.nombreCompleto,
      email: user.email,
      role: user.role,
      celular: user.celular,
      password: '', 
      regionId: user.regionId || 0,
      modalidadId: user.modalidadId || 0,
      nivelId: user.nivelId || 0,
      especialidadId: user.especialidadId || 0,
      passwordHash: user.passwordHash || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
      try {
        await userService.delete(id);
        loadUsersOnly();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600">Gestión de usuarios del sistema</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
            Crear Usuario
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
                Nombre Completo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Región
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  Cargando...
                </td>
              </tr>
            ) : users.length === 0 ? (
               <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.nombreCompleto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.role}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                     {user.region?.nombre || user.regionId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-primary hover:text-primary-dark mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-md rounded-lg bg-white shadow-lg my-8">
            <div className="flex items-center justify-between rounded-t border-b p-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingUser ? 'Editar Usuario' : 'Crear Usuario'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombreCompleto}
                    onChange={(e) =>
                      setFormData({ ...formData, nombreCompleto: e.target.value })
                    }
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                 <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                      required
                    />
                  </div>
                )}
                 <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Celular
                  </label>
                  <input
                    type="text"
                    value={formData.celular}
                    onChange={(e) =>
                      setFormData({ ...formData, celular: e.target.value })
                    }
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Rol
                  </label>
                   <select
                    value={formData.role ?? 'User'}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                  >

                    <option value="Admin">Admin</option>
                    <option value="Client">Client</option>
                  </select>
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Región
                  </label>
                   <select
                    value={formData.regionId ?? 0}
                    onChange={(e) =>
                      setFormData({ ...formData, regionId: Number(e.target.value) })
                    }
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                  >
                    <option value={0}>Seleccionar Región</option>
                    {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Modalidad
                  </label>
                   <select
                    value={formData.modalidadId ?? 0}
                    onChange={(e) =>
                      setFormData({ ...formData, modalidadId: Number(e.target.value) })
                    }
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                  >
                    <option value={0}>Seleccionar Modalidad</option>
                    {modalidades.map(m => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Nivel
                  </label>
                   <select
                    value={formData.nivelId ?? 0}
                    onChange={(e) =>
                      setFormData({ ...formData, nivelId: Number(e.target.value) })
                    }
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                  >
                    <option value={0}>Seleccionar Nivel</option>
                    {niveles.map(n => (
                        <option key={n.id} value={n.id}>{n.nombre}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  type="submit"
                  className="w-full rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-blue-300"
                >
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default UsersPage;
