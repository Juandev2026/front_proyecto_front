import React, { useState, useEffect, useRef } from 'react';

import AdminLayout from '../../components/AdminLayout';
import { regionService, Region } from '../../services/regionService';
import { userService, User } from '../../services/userService';
import { tipoAccesoService, TipoAcceso } from '../../services/tipoAccesoService';
import { exportToExcel } from '../../utils/excelUtils';
import { examenService } from '../../services/examenService';
import {
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
  const [totalUsers, setTotalUsers] = useState(0);
  const [serverPage, setServerPage] = useState(1);
  const PAGE_SIZE = 20;
  const [regions, setRegions] = useState<Region[]>([]);
  const [modalidades, setModalidades] = useState<any[]>([]);

  const [niveles, setNiveles] = useState<any[]>([]);
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [tiposAcceso, setTiposAcceso] = useState<TipoAcceso[]>([]);

  const [filteredNiveles, setFilteredNiveles] = useState<any[]>([]);
  const [filteredEspecialidades, setFilteredEspecialidades] = useState<any[]>([]);
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
      estado: 'Activo',
      tiempo: 0,
      ie: '',
      observaciones: '',
      accesoIds: tiposAcceso.map(t => Number(t.id)),
    });
    setExpirationMode('custom');
    setUserExamenes([]);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // Debounce del buscador: espera 800ms antes de disparar la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchTerm);
      setServerPage(1); // volver a página 1 al buscar
    }, 800);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadUsersOnly = async (page = serverPage, search = searchDebounced) => {
    // Cancelar petición previa si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Crear nuevo controlador para esta petición
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      const result = await userService.getPaginated(page, PAGE_SIZE, search, controller.signal);
      setUsers(result.data);
      setTotalUsers(result.total);
    } catch (e: any) {
      if (e.name === 'AbortError') {
        // La petición fue cancelada, no hacer nada
        return;
      }
      console.error('Error loading users:', e);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResult, regionsData, tiposAccesoData, hierarchyData] =
        await Promise.all([
          userService.getPaginated(1, PAGE_SIZE, ''),
          regionService.getAll(),
          tipoAccesoService.getAll(),
          examenService.getSimplifiedHierarchy(),
        ]);

      setUsers(usersResult.data);
      setTotalUsers(usersResult.total);
      setRegions(regionsData);
      setModalidades(hierarchyData.modalidades.reverse() as any);
      setNiveles(hierarchyData.niveles as any);
      setEspecialidades(hierarchyData.especialidades as any);
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
      // Confirmación al asignar rol Admin
      if (formData.role === 'Admin') {
        const confirmed = window.confirm('¿Estás seguro que quieres hacer Administrador a este usuario?');
        if (!confirmed) return;
      }
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
      if (payload.role !== 'Premium' && payload.role !== 'Admin') {
        payload.ie = "";
        payload.observaciones = "";
        payload.accesoIds = [];
      } else if (!Array.isArray(payload.accesoIds)) {
        payload.accesoIds = [];
      }

      if (payload.role === 'Premium' || payload.role === 'Admin' || payload.role === 'Client') {
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
      await loadUsersOnly(serverPage, searchDebounced);
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      alert(`Error al guardar usuario: ${error.message || error}`);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    const apiExamenes = (user as any).userExamenes || [];
    const firstExamen = apiExamenes[0];

    // Populate userExamenes uniformly so if switched to Premium, past accesses are retained
    setUserExamenes(apiExamenes.map((e: any) => ({
      modalidadId: e.modalidadId || 0,
      nivelId: e.nivelId || 0,
      especialidadId: e.especialidadId || 0,
    })));

    setFormData({
      nombreCompleto: user.nombreCompleto,
      email: user.email,
      role: user.role,
      celular: user.celular,
      password: '',
      regionId: user.regionId || 0,
      ie: user.ie || '',
      observaciones: user.observaciones || '',
      modalidadId: firstExamen?.modalidadId || user.modalidadId || 0,
      nivelId: firstExamen?.nivelId || user.nivelId || 0,
      especialidadId: firstExamen?.especialidadId || user.especialidadId || 0,
      passwordHash: user.passwordHash || '',
      fechaExpiracion: user.fechaExpiracion,
      accesoIds: user.accesoIds && user.accesoIds.length > 0 
        ? user.accesoIds.map(Number) 
        : tiposAcceso.map(t => Number(t.id)),
    });

    setExpirationMode('custom'); // Default to custom when editing, or we could check if it matches a preset
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      try {
        await userService.delete(id);
        await loadUsersOnly(serverPage, searchDebounced);
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

  // Recargar cuando cambia la página o el buscador (debounced)
  useEffect(() => {
    loadUsersOnly(serverPage, searchDebounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverPage, searchDebounced]);

  // Paginación del servidor
  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

  const nextPage = () => {
    if (serverPage < totalPages) setServerPage(serverPage + 1);
  };

  const prevPage = () => {
    if (serverPage > 1) setServerPage(serverPage - 1);
  };

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
        'Rol': u.role,
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

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    No hay usuarios encontrados
                  </td>
                </tr>
              ) : (
                users.map((user: User) => {
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
            disabled={serverPage === 1}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${serverPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Anterior
          </button>
          <span className="text-sm text-gray-700">Página {serverPage} de {totalPages || 1} &bull; {totalUsers} usuarios</span>
          <button
            onClick={nextPage}
            disabled={serverPage === totalPages || totalPages === 0}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${serverPage === totalPages || totalPages === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      className="w-full border border-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B] bg-white"
                    >
                      <option value={0} disabled hidden>Seleccionar región</option>
                      {regions.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </div>

                  {/* IE (Solo Premium o Admin) */}
                  {(formData.role === 'Premium' || formData.role === 'Admin') && (
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

                  {/* Observaciones (Solo Premium o Admin) */}
                  {(formData.role === 'Premium' || formData.role === 'Admin') && (
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

                {/* === SECCIÓN 2: INFORMACIÓN ACADÉMICA (Premium, Admin o Client) === */}
                {(formData.role === 'Premium' || formData.role === 'Admin' || formData.role === 'Client') && (
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
                        className="w-full border border-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B] bg-white"
                      >
                        <option value={0}>Seleccionar Modalidad</option>
                        {modalidades.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                      </select>
                    </div>

                    {/* Nivel */}
                    {!!formData.modalidadId && filteredNiveles.length > 0 && (
                    <div className="mb-3">
                      <label className="block text-sm text-gray-700 mb-1">Nivel</label>
                      <select
                        value={formData.nivelId ?? 0}
                        onChange={(e) => setFormData({ ...formData, nivelId: Number(e.target.value), especialidadId: 0 })}
                        className="w-full border border-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B] bg-white"
                        disabled={!formData.modalidadId}
                      >
                        <option value={0}>Seleccionar Nivel</option>
                        {filteredNiveles.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                      </select>
                    </div>
                    )}

                    {/* Especialidad */}
                    {!!formData.nivelId && filteredEspecialidades.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm text-gray-700 mb-1">Especialidad</label>
                      <select
                        value={formData.especialidadId ?? 0}
                        onChange={(e) => setFormData({ ...formData, especialidadId: Number(e.target.value) })}
                        className="w-full border border-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B] bg-white"
                        disabled={!formData.nivelId}
                      >
                        <option value={0}>Seleccionar especialidad</option>
                        {filteredEspecialidades.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      </select>
                    </div>
                    )}

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

                    {/* Lista de accesos configurados - DEBAJO */}
                    {userExamenes.length > 0 && (
                      <div className="mt-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-[#002B6B] flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            Accesos configurados ({userExamenes.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => setUserExamenes([])}
                            className="text-xs text-red-500 hover:text-red-700 font-bold bg-white px-2 py-1 rounded border border-red-100 shadow-sm transition-colors"
                          >
                            Limpiar todo
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2">
                          {userExamenes.map((ex, idx) => {
                            const mod = modalidades.find(m => m.id === ex.modalidadId);
                            const niv = niveles.find(n => n.id === ex.nivelId);
                            const esp = especialidades.find(e => e.id === ex.especialidadId);
                            return (
                              <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm group">
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-bold text-blue-600 uppercase leading-none mb-1">
                                     {mod?.nombre || 'Sin modalidad'}
                                   </span>
                                   {(niv?.nombre || esp) && (
                                     <span className="text-xs font-medium text-gray-700">
                                       {niv?.nombre || ''}{esp ? ` - ${esp.nombre}` : ''}
                                     </span>
                                   )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setUserExamenes(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                  title="Eliminar"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* === SECCIÓN 3: TIPO DE ACCESO (Solo Premium o Admin) === */}
                {(formData.role === 'Premium' || formData.role === 'Admin') && (
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

                {/* === SECCIÓN 4: FECHA EXPIRACIÓN (Solo Premium o Admin) === */}
                {(formData.role === 'Premium' || formData.role === 'Admin') && (
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
