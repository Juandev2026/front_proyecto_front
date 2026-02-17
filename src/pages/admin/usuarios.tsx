import React, { useState, useEffect } from 'react';

import AdminLayout from '../../components/AdminLayout';
import { modalidadService, Modalidad } from '../../services/modalidadService';

import { nivelService, Nivel } from '../../services/nivelService';
import { especialidadesService, Especialidad } from '../../services/especialidadesService';
import { regionService, Region } from '../../services/regionService';
import { userService, User } from '../../services/userService';
import { tipoAccesoService, TipoAcceso } from '../../services/tipoAccesoService';

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);

  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [tiposAcceso, setTiposAcceso] = useState<TipoAcceso[]>([]);
  const [filteredNiveles, setFilteredNiveles] = useState<Nivel[]>([]);
  const [filteredEspecialidades, setFilteredEspecialidades] = useState<Especialidad[]>([]);
  const [showPassword, setShowPassword] = useState(false);

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
    passwordHash: '',
    fechaExpiracion: undefined,
    accesoIds: [],
  });

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  const [expirationMode, setExpirationMode] = useState<'1year' | '5months' | '10months' | 'custom'>('custom');

  const handleExpirationChange = (mode: '1year' | '5months' | '10months' | 'custom') => {
    setExpirationMode(mode);
    
    if (mode === 'custom') {
       // Keep existing or empty if switching to custom
       return;
    }

    const today = new Date();
    let newDate = new Date(today);

    if (mode === '1year') {
      newDate.setFullYear(today.getFullYear() + 1);
    } else if (mode === '5months') {
      newDate.setMonth(today.getMonth() + 5);
    } else if (mode === '10months') {
      newDate.setMonth(today.getMonth() + 10);
    }

    setFormData(prev => ({ ...prev, fechaExpiracion: newDate.toISOString() }));
  };

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
      passwordHash: '',
      fechaExpiracion: undefined,
      accesoIds: [],
    });
    setExpirationMode('custom');
  };

  const loadUsersOnly = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (e) {
      // Error loading users
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, regionsData, modalidadesData, nivelesData, especialidadesData, tiposAccesoData] =
        await Promise.all([
          userService.getAll(),
          regionService.getAll(),
          modalidadService.getAll(),
          nivelService.getAll(),
          especialidadesService.getAll(),
          tipoAccesoService.getAll(),
        ]);

      setUsers(usersData);
      setRegions(regionsData);
      setModalidades(modalidadesData);
      setNiveles(nivelesData);
      setEspecialidades(especialidadesData);
      setTiposAcceso(tiposAccesoData);
    } catch (error) {
      // Error loading data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.modalidadId) {
      const filtered = niveles.filter((n) => {
        if (Array.isArray(n.modalidadIds)) {
          return n.modalidadIds.includes(Number(formData.modalidadId));
        }
        return n.modalidadIds === Number(formData.modalidadId);
      });
      setFilteredNiveles(filtered);
    } else {
      setFilteredNiveles([]);
    }
  }, [formData.modalidadId, niveles]);

  useEffect(() => {
    if (formData.nivelId) {
      const filtered = especialidades.filter((e) => {
        if (Array.isArray(e.nivelId)) {
          return e.nivelId.includes(Number(formData.nivelId));
        }
        return e.nivelId === Number(formData.nivelId);
      });
      setFilteredEspecialidades(filtered);
    } else {
      setFilteredEspecialidades([]);
    }
  }, [formData.nivelId, especialidades]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...formData };
      
      // Ensure accesoIds is an array of numbers
      if (!Array.isArray(payload.accesoIds)) {
          payload.accesoIds = [];
      }
      
      // Sanitize Foreign Keys (send null if 0 or undefined)
      if (!payload.regionId) payload.regionId = null;
      if (!payload.modalidadId) payload.modalidadId = null;
      if (!payload.nivelId) payload.nivelId = null;
      if (!payload.especialidadId) payload.especialidadId = null;

      // Clear Premium fields if not Premium
      if (payload.role !== 'Premium') {
        delete payload.ie;
        delete payload.observaciones;
        delete payload.fechaExpiracion;
      }

      console.log('Sending payload:', payload); // Debug payload

      if (editingUser) {
        // ... existing edit logic ...
        // Reconstruct nested objects (some backends require them even if ID is present)
        const selectedRegion = regions.find((r) => r.id === formData.regionId);
        const selectedModalidad = modalidades.find(
          (m) => m.id === formData.modalidadId
        );
        const selectedNivel = niveles.find((n) => n.id === formData.nivelId);

        if (selectedRegion) {
          payload.region = {
            id: selectedRegion.id,
            nombre: selectedRegion.nombre,
          };
        }
        if (selectedModalidad) {
          payload.modalidad = {
            id: selectedModalidad.id,
            nombre: selectedModalidad.nombre,
          };
        }
        // Nesting logic based on schema provided by user (Nivel contains Modalidad?)
        if (selectedNivel) {
          payload.nivel = {
            id: selectedNivel.id,
            nombre: selectedNivel.nombre,
            modalidadId: selectedNivel.modalidadId,
            modalidad: { id: selectedNivel.modalidadId, nombre: 'string' }, // Mocking if we don't have full object ref handy without lookup, or lookup again
          };
          // Better lookup for nested
          const modalForNivel = modalidades.find(
            (m) => m.id === selectedNivel.modalidadId
          );
          if (modalForNivel) {
            payload.nivel.modalidad = {
              id: modalForNivel.id,
              nombre: modalForNivel.nombre,
            };
          }
        }

        await userService.update(editingUser.id, payload);
      } else {
        await userService.create(payload as User);
      }
      setIsModalOpen(false);
      setEditingUser(null);
      resetForm();
      loadUsersOnly();
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert(`Error al guardar usuario: ${error.message}`);
    }
  };

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
      passwordHash: user.passwordHash || '',
      fechaExpiracion: user.fechaExpiracion,
      accesoIds: user.accesoIds || [],
    });
    setExpirationMode('custom'); // Default to custom when editing, or we could check if it matches a preset
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      try {
        await userService.delete(id);
        await loadUsersOnly();
      } catch (error) {
        // Error deleting user
      }
    }
  };

  const handleView = async (id: number) => {
    try {
      const user = await userService.getById(id);
      setViewingUser(user);
      setIsViewModalOpen(true);
    } catch (error) {
      // Error fetching user details
    }
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Show ONLY 'Admin' and 'Client' roles as requested
    const isAllowedRole = ['Admin', 'Client'].includes(user.role);
    
    return matchesSearch && isAllowedRole;
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600">Gestión de usuarios del sistema</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar usuarios..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary block w-full sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors whitespace-nowrap"
          >
            Crear Usuario
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
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
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  No hay usuarios encontrados
                </td>
              </tr>
            ) : (
              currentItems.map((user) => {
                const regionName = user.region?.nombre || user.regionId?.toString() || '-';
                return (
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
                      {regionName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => handleView(user.id)}
                          className="text-blue-600 hover:text-blue-900 focus:outline-none"
                          title="Ver Detalles"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-green-600 hover:text-green-900 focus:outline-none"
                          title="Editar"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900 focus:outline-none"
                          title="Eliminar"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
        
        {/* Pagination */}
        <div className="py-4 flex items-center justify-center space-x-4 border-t border-gray-200 bg-gray-50">
            <button 
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                Anterior
            </button>
             <span className="text-sm text-gray-700">Page {currentPage} de {totalPages}</span>
            <button 
                onClick={nextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage === totalPages || totalPages === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                Siguiente
            </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 sm:p-6">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg bg-white shadow-lg my-8">
            <div className="flex items-center justify-between rounded-t border-b p-4 shrink-0">
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

            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombreCompleto}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nombreCompleto: e.target.value,
                      })
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
                  <div className="col-span-1 md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pr-10 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
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
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setFormData({ ...formData, role: newRole });
                      // Reset expiration if not Premium (optional, or keep it)
                      if (newRole !== 'Premium') {
                         setExpirationMode('custom'); // or reset logic
                      }
                    }}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Client">Client</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>

                {formData.role === 'Premium' && (
                  <div className="col-span-1 md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      Accesos
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border border-gray-300 rounded-lg p-3 bg-gray-50">
                      {tiposAcceso.map((tipo) => (
                        <label key={tipo.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.accesoIds?.includes(tipo.id) || false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => {
                                const current = prev.accesoIds || [];
                                if (checked) return { ...prev, accesoIds: [...current, tipo.id] };
                                else return { ...prev, accesoIds: current.filter(id => id !== tipo.id) };
                              });
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                          />
                          <span className="text-sm text-gray-700">{tipo.descripcion}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formData.role === 'Premium' && (
                  <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-900">
                        Institución Educativa (IE)
                      </label>
                      <input
                        type="text"
                        value={formData.ie || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, ie: e.target.value })
                        }
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-900">
                        Observaciones
                      </label>
                      <input
                        type="text"
                        value={formData.observaciones || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, observaciones: e.target.value })
                        }
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                      />
                    </div>
                  </div>
                )}

                {formData.role === 'Premium' && (
                  <div className="col-span-1 md:col-span-2 rounded-lg border border-gray-200 p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-medium text-gray-900">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Fecha de expiración
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {/* 1 Año */}
                      <label className="flex items-center space-x-3 rounded-md border border-gray-100 p-2 hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="expirationMode"
                          value="1year"
                          checked={expirationMode === '1year'}
                          onChange={() => handleExpirationChange('1year')}
                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">1 año desde hoy</span>
                      </label>

                       {/* 5 Meses */}
                      <label className="flex items-center space-x-3 rounded-md border border-gray-100 p-2 hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="expirationMode"
                          value="5months"
                          checked={expirationMode === '5months'}
                          onChange={() => handleExpirationChange('5months')}
                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">5 meses desde hoy</span>
                      </label>

                       {/* 10 Meses */}
                      <label className="flex items-center space-x-3 rounded-md border border-gray-100 p-2 hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="expirationMode"
                          value="10months"
                          checked={expirationMode === '10months'}
                          onChange={() => handleExpirationChange('10months')}
                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">10 meses desde hoy</span>
                      </label>

                       {/* Custom */}
                      <label className="flex items-center space-x-3 rounded-md border border-gray-100 p-2 hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="expirationMode"
                          value="custom"
                          checked={expirationMode === 'custom'}
                          onChange={() => handleExpirationChange('custom')}
                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">Elegir fecha específica</span>
                      </label>
                    </div>

                    {/* Date Picker for Custom or Display for others */}
                    <div className="mt-3">
                       <input
                          type="datetime-local"
                          value={formData.fechaExpiracion ? new Date(formData.fechaExpiracion).toISOString().slice(0, 16) : ''}
                          onChange={(e) => {
                             setExpirationMode('custom');
                             setFormData({ ...formData, fechaExpiracion: new Date(e.target.value).toISOString() });
                          }}
                          disabled={expirationMode !== 'custom'}
                          className={`block w-full rounded-lg border p-2.5 text-sm ${
                            expirationMode !== 'custom'
                              ? 'bg-gray-100 text-gray-500 border-gray-200'
                              : 'bg-gray-50 text-gray-900 border-gray-300 focus:border-primary focus:ring-primary'
                          }`}
                        />
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Región
                  </label>
                  <select
                    value={formData.regionId ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        regionId: Number(e.target.value),
                      })
                    }
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                  >
                    <option value={0}>Seleccionar Región</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
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
                      setFormData({
                        ...formData,
                        modalidadId: Number(e.target.value),

                        nivelId: 0, // Reset nivel
                        especialidadId: 0, // Reset especialidad
                      })
                    }
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                  >
                    <option value={0}>Seleccionar Modalidad</option>
                    {modalidades.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Nivel
                  </label>
                  <select
                    value={formData.nivelId ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nivelId: Number(e.target.value),
                        especialidadId: 0, // Reset especialidad
                      })
                    }
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                  >
                    <option value={0}>Seleccionar Nivel</option>
                    {filteredNiveles.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Especialidad
                  </label>
                  <select
                    value={formData.especialidadId ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        especialidadId: Number(e.target.value),
                      })
                    }
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                  >
                    <option value={0}>Seleccionar Especialidad</option>
                    {filteredEspecialidades.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="col-span-1 md:col-span-2 w-full rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-blue-300"
                >
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-lg my-8">
            <div className="flex items-center justify-between rounded-t border-b p-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Detalles del Usuario
              </h3>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingUser(null);
                }}
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
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">ID</h4>
                  <p className="mt-1 text-sm text-gray-900">{viewingUser.id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Rol</h4>
                  <p className="mt-1 text-sm text-gray-900 font-semibold">
                    {viewingUser.role}
                  </p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">
                    Nombre Completo
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingUser.nombreCompleto}
                  </p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">Email</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingUser.email}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Celular</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingUser.celular || '-'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Región</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingUser.region?.nombre || '-'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Modalidad
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingUser.modalidad?.nombre || '-'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Nivel</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingUser.nivel?.nombre || '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">
                    Especialidad
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingUser.especialidad?.nombre || '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">Accesos</h4>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {viewingUser.accesoIds && viewingUser.accesoIds.length > 0 ? (
                      viewingUser.accesoIds.map(id => {
                        const tipo = tiposAcceso.find(t => t.id === id);
                        return (
                          <span key={id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {tipo ? tipo.descripcion : `ID: ${id}`}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingUser(null);
                }}
                type="button"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
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

export default UsersPage;
