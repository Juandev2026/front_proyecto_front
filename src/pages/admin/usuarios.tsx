import React, { useState, useEffect } from 'react';

import AdminLayout from '../../components/AdminLayout';
import { modalidadService, Modalidad } from '../../services/modalidadService';

import { nivelService, Nivel } from '../../services/nivelService';
import { especialidadesService, Especialidad } from '../../services/especialidadesService';
import { regionService, Region } from '../../services/regionService';
import { userService, User } from '../../services/userService';
import { tipoAccesoService, TipoAcceso } from '../../services/tipoAccesoService';
import { exportToExcel } from '../../utils/excelUtils';
import {
  TrashIcon,
  EyeIcon,
  XIcon
} from '@heroicons/react/outline';
import {
  UserIcon,
  AcademicCapIcon,
  LockClosedIcon,
  CalendarIcon
} from '@heroicons/react/solid';
import { formatDateForInput, parseInputDateToISO } from '../../utils/dateUtils';

interface AcademicAccess { modalidadId: number; nivelId: number; especialidadId: number; }

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
    estado: 'Activo',
    tiempo: 0,
    ie: '',
    observaciones: '',
  });

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  const [expirationMode, setExpirationMode] = useState<'1year' | '5months' | '10months' | 'custom'>('custom');
  const [userExamenes, setUserExamenes] = useState<AcademicAccess[]>([]);

  const handleExpirationPresetChange = (mode: '1year' | '5months' | '10months') => {
    setExpirationMode(mode);
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
      estado: 'Activo',
      tiempo: 0,
      ie: '',
      observaciones: '',
    });
    setExpirationMode('custom');
    setUserExamenes([]);
  };

  const loadUsersOnly = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (e) {
      console.error('Error loading users:', e);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, regionsData, modalidadesData, nivelesData, tiposAccesoData, especialidadesData] =
        await Promise.all([
          userService.getAll(),
          regionService.getAll(),
          modalidadService.getAll(),
          nivelService.getAll(),
          tipoAccesoService.getAll(),
          especialidadesService.getAll(),
        ]);

      setUsers(usersData);
      setRegions(regionsData);
      setModalidades(modalidadesData);
      setNiveles(nivelesData);
      setEspecialidades(especialidadesData);
      setTiposAcceso(tiposAccesoData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("UsersPage mounted");
    loadData();
  }, []);

  useEffect(() => {
    if (formData.modalidadId) {
      const filtered = niveles.filter((n) => {
        if (Array.isArray(n.modalidadIds)) {
          return n.modalidadIds.includes(Number(formData.modalidadId));
        }
        return Number(n.modalidadIds) === Number(formData.modalidadId);
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
        return Number(e.nivelId) === Number(formData.nivelId);
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
      console.log("Payload original (pre-sanitización):", payload);
      
      // Ensure IDs are numbers
      payload.regionId = Number(payload.regionId || 0);
      payload.modalidadId = Number(payload.modalidadId || 0);
      payload.nivelId = Number(payload.nivelId || 0);
      payload.especialidadId = Number(payload.especialidadId || 0);

      // Default values
      if (!payload.estado) payload.estado = 'Activo';
      if (!payload.tiempo) payload.tiempo = 1;

      // Handle Role constraints
      if (payload.role !== 'Premium') {
        payload.ie = "";
        payload.observaciones = "";
        payload.accesoIds = [];
      } else if (!Array.isArray(payload.accesoIds)) {
        payload.accesoIds = [];
      }

      if (payload.role === 'Premium') {
        payload.userExamenes = userExamenes;
      }

      // Cleanup payload for backend
      delete payload.passwordHash;
      delete payload.region;
      delete payload.modalidad;
      delete payload.nivel;
      delete payload.especialidad;

      if (editingUser) {
        delete payload.password;
        console.log("Modo edición: Removiendo campo password del payload");
      }

      console.log("Payload final que se enviará al Backend:", payload);

      if (editingUser) {
        await userService.update(editingUser.id, payload);
      } else {
        delete payload.id;
        await userService.create(payload as User);
      }
      
      setIsModalOpen(false);
      setEditingUser(null);
      resetForm();
      await loadUsersOnly();
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      alert(`Error al guardar usuario: ${error.message || error}`);
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

    // Populate userExamenes
    if (user.role === 'Premium') {
      const apiExamenes = (user as any).userExamenes || [];
      setUserExamenes(apiExamenes.map((e: any) => ({
        modalidadId: e.modalidadId || 0,
        nivelId: e.nivelId || 0,
        especialidadId: e.especialidadId || 0,
      })));
    } else {
      setUserExamenes([]);
    }

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

  const getEffectiveRole = (user: User) => {
    if (user.role?.toUpperCase() === 'PREMIUM') {
      if (!user.fechaExpiracion || user.fechaExpiracion === '-') return 'Client';
      const expDate = new Date(user.fechaExpiracion);
      if (expDate < new Date()) {
        return 'Client';
      }
    }
    return user.role;
  };

  const filteredUsers = users.filter((user) => {
    const effectiveRole = getEffectiveRole(user);
    const matchesSearch = 
      user.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (effectiveRole || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Show ONLY 'Admin' and 'Client' roles as requested
    const isAllowedRole = ['Admin', 'Client'].includes(effectiveRole || '');
    
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

  const handleExportExcel = async () => {
    try {
      const allUsers = await userService.getAll();
      // On this page we show Admin and Client, but maybe the export should include all or follow the same filter?
      // Usually export should match what's visible or all. I'll export all and let them filter in Excel.
      
      const dataToExport = allUsers.map(u => ({
        'ID': u.id,
        'Nombre Completo': u.nombreCompleto,
        'Teléfono': u.celular || '-',
        'Email': u.email,
        'Rol': getEffectiveRole(u),
        'Estado': u.estado || 'Activo',
        'Fecha Registro': u.fechaCreacion || u.fecha_creacion ? new Date(u.fechaCreacion || u.fecha_creacion!).toLocaleDateString() : '-',
        'Suscripciones Activas': u.accesoNombres && u.accesoNombres.length > 0 ? u.accesoNombres.join(', ') : '-',
        'Modalidades': u.modalidadNombres && u.modalidadNombres.length > 0 ? u.modalidadNombres.join(', ') : (u.modalidad?.nombre || '-'),
        'Niveles': u.nivelNombres && u.nivelNombres.length > 0 ? u.nivelNombres.join(', ') : (u.nivel?.nombre || '-'),
        'Especialidades': u.especialidadNombres && u.especialidadNombres.length > 0 ? u.especialidadNombres.join(', ') : (u.especialidad?.nombre || '-'),
        'Región': u.region?.nombre || '-',
        'IE': u.ie || '-',
        'Observaciones': u.observaciones || '-'
      }));

      const today = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
      exportToExcel(dataToExport, `Reporte_Usuarios_${today}`, 'Usuarios');
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error al exportar a Excel");
    }
  };

  const handleCreateUser = () => {
      setEditingUser(null);
      resetForm();
      setIsModalOpen(true);
  };

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
            onClick={handleExportExcel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mr-2"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar Excel
          </button>
          <button
            onClick={handleCreateUser}
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
                      {getEffectiveRole(user)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
          <div className="relative w-full max-w-lg max-h-[95vh] flex flex-col rounded-2xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingUser ? 'Editar Usuario' : 'Crear Usuario'}
              </h3>
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1 transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Role Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol*</label>
                  <select
                    value={formData.role ?? 'Client'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B]"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Client">Client</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>

                {/* === SECCIÓN 1: INFORMACIÓN PERSONAL === */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <UserIcon className="w-5 h-5 text-[#002B6B]" />
                    <h4 className="font-bold text-[#002B6B]">Información personal</h4>
                  </div>

                  {/* Nombre completo */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-700 mb-1">Nombre completo*</label>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={formData.nombreCompleto}
                      onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B]"
                      required
                    />
                  </div>
                  {/* Correo + Celular */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Correo*</label>
                      <input
                        type="email"
                        placeholder="Correo"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Celular</label>
                      <input
                        type="text"
                        placeholder="Teléfono"
                        value={formData.celular}
                        onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B]"
                      />
                    </div>
                  </div>

                  {/* Contraseña (Solo para creación) */}
                  {!editingUser && (
                    <div className="mb-3">
                      <label className="block text-sm text-gray-700 mb-1">
                        Contraseña*
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Contraseña"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B] pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                           {showPassword ? <EyeIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5 opacity-50" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Región */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-700 mb-1">Región</label>
                    <select
                      value={formData.regionId ?? 0}
                      onChange={(e) => setFormData({ ...formData, regionId: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B] bg-white"
                    >
                      <option value={0}>Seleccionar región</option>
                      {regions.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </div>

                  {/* IE (Solo Premium) */}
                  {formData.role === 'Premium' && (
                    <div className="mb-3">
                      <label className="block text-sm text-gray-700 mb-1">Institución Educativa</label>
                      <input
                        type="text"
                        placeholder="Institución Educativa"
                        value={formData.ie}
                        onChange={(e) => setFormData({ ...formData, ie: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B]"
                      />
                    </div>
                  )}

                  {/* Observaciones (Solo Premium) */}
                  {formData.role === 'Premium' && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Observaciones</label>
                      <textarea
                        placeholder="Observaciones"
                        value={formData.observaciones}
                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B] resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* === SECCIÓN 2: INFORMACIÓN ACADÉMICA (Solo Premium) === */}
                {formData.role === 'Premium' && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <AcademicCapIcon className="w-5 h-5 text-[#002B6B]" />
                      <h4 className="font-bold text-[#002B6B]">Información Académica</h4>
                    </div>

                    {/* Modalidad */}
                    <div className="mb-3">
                      <label className="block text-sm text-gray-700 mb-1">Modalidad</label>
                      <select
                        value={formData.modalidadId ?? 0}
                        onChange={(e) => setFormData({ ...formData, modalidadId: Number(e.target.value), nivelId: 0, especialidadId: 0 })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B] bg-white"
                      >
                        <option value={0}>Seleccionar Modalidad</option>
                        {modalidades.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                      </select>
                    </div>

                    {/* Nivel */}
                    <div className="mb-3">
                      <label className="block text-sm text-gray-700 mb-1">Nivel</label>
                      <select
                        value={formData.nivelId ?? 0}
                        onChange={(e) => setFormData({ ...formData, nivelId: Number(e.target.value), especialidadId: 0 })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B] bg-white"
                        disabled={!formData.modalidadId}
                      >
                        <option value={0}>Seleccionar Nivel</option>
                        {filteredNiveles.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                      </select>
                    </div>

                    {/* Especialidad */}
                    <div className="mb-4">
                      <label className="block text-sm text-gray-700 mb-1">Especialidad</label>
                      <select
                        value={formData.especialidadId ?? 0}
                        onChange={(e) => setFormData({ ...formData, especialidadId: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B] bg-white"
                        disabled={!formData.nivelId}
                      >
                        <option value={0}>Seleccionar especialidad</option>
                        {filteredEspecialidades.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      </select>
                    </div>

                    {/* Botones académicos */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!formData.modalidadId || !formData.nivelId) return;
                          const espsToAdd = filteredEspecialidades.length > 0
                            ? filteredEspecialidades.map(e => ({ modalidadId: Number(formData.modalidadId), nivelId: Number(formData.nivelId), especialidadId: e.id }))
                            : [{ modalidadId: Number(formData.modalidadId), nivelId: Number(formData.nivelId), especialidadId: 0 }];
                          
                          // Evitar duplicados
                          setUserExamenes(prev => {
                            const newAccesos = [...prev];
                            espsToAdd.forEach(acc => {
                              if (!newAccesos.some(a => a.modalidadId === acc.modalidadId && a.nivelId === acc.nivelId && a.especialidadId === acc.especialidadId)) {
                                newAccesos.push(acc);
                              }
                            });
                            return newAccesos;
                          });
                        }}
                        className="w-full text-white font-semibold rounded-lg py-2.5 text-sm transition-colors bg-[#f59e0b] hover:bg-amber-600"
                      >
                        Añadir todas las especialidades
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!formData.modalidadId) return;
                          const acceso = {
                            modalidadId: Number(formData.modalidadId),
                            nivelId: Number(formData.nivelId) || 0,
                            especialidadId: Number(formData.especialidadId) || 0,
                          };
                          // Evitar duplicados
                          setUserExamenes(prev => {
                            if (prev.some(a => a.modalidadId === acceso.modalidadId && a.nivelId === acceso.nivelId && a.especialidadId === acceso.especialidadId)) {
                              return prev;
                            }
                            return [...prev, acceso];
                          });
                        }}
                        className="w-full text-white font-semibold rounded-lg py-2.5 text-sm transition-colors bg-[#10b981] hover:bg-emerald-600"
                      >
                        Agregar acceso
                      </button>
                    </div>

                    {/* Lista de accesos añadidos */}
                    {userExamenes.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">Accesos agregados:</span>
                          <button
                            type="button"
                            onClick={() => setUserExamenes([])}
                            className="text-xs text-red-500 hover:text-red-700 underline"
                          >
                            Limpiar todo
                          </button>
                        </div>
                        <div className="space-y-2">
                          {userExamenes.map((ex, idx) => {
                            const mod = modalidades.find(m => m.id === ex.modalidadId);
                            const niv = niveles.find(n => n.id === ex.nivelId);
                            const esp = especialidades.find(e => e.id === ex.especialidadId);
                            return (
                              <div key={idx} className="flex items-start justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                                <span className="text-gray-700">
                                  {mod?.nombre || '?'} | {niv?.nombre || '?'} | {esp?.nombre || 'General'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setUserExamenes(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-red-400 hover:text-red-600 ml-3"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* === SECCIÓN 3: TIPO DE ACCESO (Solo Premium) === */}
                {formData.role === 'Premium' && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <LockClosedIcon className="w-5 h-5 text-[#002B6B]" />
                      <h4 className="font-bold text-[#002B6B]">Tipo de Acceso*</h4>
                    </div>
                    <div className="space-y-2">
                      {tiposAcceso.map((tipo) => (
                        <label key={tipo.id} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.accesoIds?.map(Number).includes(Number(tipo.id))}
                            onChange={(e) => {
                              const currentIds = formData.accesoIds || [];
                              const id = Number(tipo.id);
                              if (e.target.checked) {
                                setFormData({ ...formData, accesoIds: [...currentIds.map(Number), id] });
                              } else {
                                setFormData({ ...formData, accesoIds: currentIds.map(Number).filter(cid => cid !== id) });
                              }
                            }}
                            className="w-4 h-4 accent-red-500 rounded"
                          />
                          <span className="text-sm text-gray-800">{tipo.descripcion}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">* Selecciona al menos un tipo de acceso</p>
                  </div>
                )}

                {/* === SECCIÓN 4: FECHA EXPIRACIÓN (Solo Premium) === */}
                {formData.role === 'Premium' && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarIcon className="w-5 h-5 text-[#002B6B]" />
                      <h4 className="font-bold text-[#002B6B]">Fecha de expiración</h4>
                    </div>
                    <div className="space-y-2">
                       {[
                        { key: '1year', label: '1 año desde hoy' },
                        { key: '5months', label: '5 meses desde hoy' },
                        { key: '10months', label: '10 meses desde hoy' },
                        { key: 'custom', label: 'Elegir fecha específica' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="expiration-preset"
                            checked={expirationMode === key}
                            onChange={() => {
                              if (key === 'custom') { setExpirationMode('custom'); }
                              else { handleExpirationPresetChange(key as any); }
                            }}
                            className="w-4 h-4 accent-[#002B6B]"
                          />
                          <span className="text-sm text-gray-800">{label}</span>
                        </label>
                      ))}
                    </div>
                    {expirationMode === 'custom' && (
                      <input
                        type="datetime-local"
                        value={formatDateForInput(formData.fechaExpiracion)}
                        onChange={(e) => setFormData({ ...formData, fechaExpiracion: parseInputDateToISO(e.target.value) })}
                        className="mt-3 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B]"
                      />
                    )}
                  </div>
                )}

                {/* === BOTÓN GUARDAR === */}
                <button
                  type="submit"
                  className="w-full bg-[#002B6B] hover:bg-[#001d4a] text-white font-bold rounded-xl py-3 text-sm transition-colors shadow-lg"
                >
                  {editingUser ? 'Actualizar usuario' : 'Guardar usuario'}
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
