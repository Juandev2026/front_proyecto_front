import React, { useState, useEffect } from 'react';

import { CreditCardIcon, EyeIcon, XIcon } from '@heroicons/react/outline';
import {
  UserIcon,
  AcademicCapIcon,
  LockClosedIcon,
  CalendarIcon,
} from '@heroicons/react/solid';

import AdminLayout from '../../components/AdminLayout';
import { examenService } from '../../services/examenService';
import { premiumService, PremiumContent } from '../../services/premiumService';
import { regionService, Region } from '../../services/regionService';
import {
  tipoAccesoService,
  TipoAcceso,
} from '../../services/tipoAccesoService';
import { userService, User } from '../../services/userService';
import { formatDateForInput, parseInputDateToISO } from '../../utils/dateUtils';
import { exportToExcel } from '../../utils/excelUtils';

interface AcademicAccess {
  modalidadId: number;
  nivelId: number;
  especialidadId: number;
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  const PAGE_SIZE = 20;
  const [regions, setRegions] = useState<Region[]>([]);
  const [modalidades, setModalidades] = useState<any[]>([]);

  const [niveles, setNiveles] = useState<any[]>([]);
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [tiposAcceso, setTiposAcceso] = useState<TipoAcceso[]>([]);

  const [filteredNiveles, setFilteredNiveles] = useState<any[]>([]);
  const [filteredEspecialidades, setFilteredEspecialidades] = useState<any[]>(
    []
  );
  const [showPassword, setShowPassword] = useState(false);
  const [plans, setPlans] = useState<PremiumContent[]>([]);

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
    planId: 0,
    fechaInicio: '',
    fechaFin: '',
    estadoPago: '',
  } as any);

  const [expirationMode, setExpirationMode] = useState<
    '1year' | '5months' | '10months' | 'custom'
  >('custom');
  const [userExamenes, setUserExamenes] = useState<AcademicAccess[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleExpirationPresetChange = (
    mode: '1year' | '5months' | '10months'
  ) => {
    setExpirationMode(mode);
    const today = new Date();
    const newDate = new Date(today);

    if (mode === '1year') {
      newDate.setFullYear(today.getFullYear() + 1);
    } else if (mode === '5months') {
      newDate.setMonth(today.getMonth() + 5);
    } else if (mode === '10months') {
      newDate.setMonth(today.getMonth() + 10);
    }

    setFormData((prev) => ({
      ...prev,
      fechaExpiracion: newDate.toISOString(),
    }));
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
      accesoIds: tiposAcceso.map((t) => Number(t.id)),
    });
    setExpirationMode('custom');
    setUserExamenes([]);
  };

  const getEffectiveRole = (user: User) => {
    if (user.role?.toUpperCase() === 'PREMIUM') {
      if (!user.fechaExpiracion || user.fechaExpiracion === '-')
        return 'Client';
      const expDate = new Date(user.fechaExpiracion);
      if (expDate < new Date()) {
        return 'Client';
      }
    }
    return user.role;
  };

  const loadUsersOnly = async () => {
    try {
      setLoading(true);
      console.log('Loading users...');
      const data = await userService.getAll();
      console.log('Users loaded:', data.length);
      setUsers(data);
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load users first and independently to ensure they show up even if catalogs fail
      try {
        const usersData = await userService.getAll();
        setUsers(usersData);
      } catch (e) {
        console.error('Error loading users:', e);
      }

      // Load other catalogs
      try {
        const [
          regionsData,
          tiposAccesoData,
          hierarchyData,
          plansData,
        ] = await Promise.all([
          regionService.getAll().catch(err => { console.error('Error loading regions:', err); return []; }),
          tipoAccesoService.getAll().catch(err => { console.error('Error loading access types:', err); return []; }),
          examenService.getSimplifiedHierarchy().catch(err => { console.error('Error loading hierarchy:', err); return { modalidades: [], niveles: [], especialidades: [] }; }),
          premiumService.getAll().catch(err => { console.error('Error loading plans:', err); return []; }),
        ]);

        setRegions(regionsData);
        if (hierarchyData.modalidades && hierarchyData.modalidades.length > 0) {
          setModalidades([...hierarchyData.modalidades].reverse() as any);
        }
        setNiveles(hierarchyData.niveles || []);
        setEspecialidades(hierarchyData.especialidades || []);
        setTiposAcceso(tiposAccesoData);
        setPlans(plansData);
      } catch (error) {
        console.error('Error loading catalog data:', error);
      }
    } catch (error) {
      console.error('General error in loadData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (formData.role === 'Admin') {
        const confirmed = window.confirm(
          '¿Estás seguro que quieres hacer Administrador a este usuario?'
        );
        if (!confirmed) return;
      }
      const payload: any = { ...formData };
      console.log('Payload original (pre-sanitización):', payload);

      payload.regionId = Number(payload.regionId || 0);
      payload.modalidadId = Number(payload.modalidadId || 0);
      payload.nivelId = Number(payload.nivelId || 0);
      payload.especialidadId = Number(payload.especialidadId || 0);

      if (!payload.estado) payload.estado = 'Activo';
      if (!payload.tiempo) payload.tiempo = 1;

      if (payload.role !== 'Premium' && payload.role !== 'Admin') {
        payload.ie = '';
        payload.observaciones = '';
        payload.accesoIds = [];
      } else if (!Array.isArray(payload.accesoIds)) {
        payload.accesoIds = [];
      }

      if (
        payload.role === 'Premium' ||
        payload.role === 'Admin' ||
        payload.role === 'Client'
      ) {
        payload.userExamenes = userExamenes;
      }

      delete payload.passwordHash;
      delete payload.region;
      delete payload.modalidad;
      delete payload.nivel;
      delete payload.especialidad;

      if (editingUser) {
        delete payload.password;
        console.log('Modo edición: Removiendo campo password del payload');
      }

      console.log('Payload final que se enviará al Backend:', payload);

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
    const apiExamenes = (user as any).userExamenes || [];
    const firstExamen = apiExamenes[0];

    setUserExamenes(
      apiExamenes.map((e: any) => ({
        modalidadId: e.modalidadId || 0,
        nivelId: e.nivelId || 0,
        especialidadId: e.especialidadId || 0,
      }))
    );

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
      accesoIds:
        user.accesoIds && user.accesoIds.length > 0
          ? user.accesoIds.map(Number)
          : tiposAcceso.map((t) => Number(t.id)),
    });

    setExpirationMode('custom');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      try {
        await userService.delete(id);
        await loadUsersOnly();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const filteredUsers = users.filter((user) => {
    const effectiveRole = getEffectiveRole(user);

    // REGLA: Los Administradores SIEMPRE se muestran.
    if (user.role?.toUpperCase() === 'ADMIN' || effectiveRole?.toUpperCase() === 'ADMIN') {
      // Continuar con filtros de búsqueda
    } else {
      // REGLA: En esta página NO se muestran los Docentes/Premium (van a la página de Docentes).
      const isDocente =
        user.role?.toUpperCase() === 'PREMIUM' ||
        user.role?.toUpperCase() === 'DOCENTE' ||
        (user.fechaExpiracion && user.fechaExpiracion !== '-');
      
      if (isDocente) return false;
    }

    // Filtro por Rol (Dropdown opcional para Admin/Client)
    if (selectedRole && effectiveRole !== selectedRole) return false;

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (user.nombreCompleto || '').toLowerCase().includes(term) ||
      (user.email || '').toLowerCase().includes(term) ||
      (effectiveRole || '').toLowerCase().includes(term);

    return matchesSearch;
  });

  const currentItems = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole]);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleExportExcel = async () => {
    try {
      const allUsers = await userService.getAll();

      const dataToExport = allUsers.map((u) => ({
        ID: u.id,
        'Nombre Completo': u.nombreCompleto,
        Teléfono: u.celular || '-',
        Email: u.email,
        Rol:
          u.role +
          (getEffectiveRole(u) === 'Client' &&
          u.role?.toUpperCase() === 'PREMIUM'
            ? ' (Expirado)'
            : ''),
        Estado: u.estado || 'Activo',
        'Fecha Registro':
          u.fechaCreacion || u.fecha_creacion
            ? new Date(
                u.fechaCreacion || u.fecha_creacion!
              ).toLocaleDateString()
            : '-',
        'Suscripciones Activas':
          u.accesoNombres && u.accesoNombres.length > 0
            ? u.accesoNombres.join(', ')
            : '-',
        Modalidades:
          u.modalidadNombres && u.modalidadNombres.length > 0
            ? u.modalidadNombres.join(', ')
            : u.modalidad?.nombre || '-',
        Niveles:
          u.nivelNombres && u.nivelNombres.length > 0
            ? u.nivelNombres.join(', ')
            : u.nivel?.nombre || '-',
        Especialidades:
          u.especialidadNombres && u.especialidadNombres.length > 0
            ? u.especialidadNombres.join(', ')
            : u.especialidad?.nombre || '-',
        Región: u.region?.nombre || '-',
        IE: u.ie || '-',
        Observaciones: u.observaciones || '-',
      }));

      const today = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
      exportToExcel(dataToExport, `Reporte_Usuarios_${today}`, 'Usuarios');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error al exportar a Excel');
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
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar usuarios..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary block w-full text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary focus:border-primary text-base bg-white"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">Todos los roles</option>
            <option value="Admin">Admin</option>
            <option value="Client">Client</option>
            <option value="Premium">Premium</option>
          </select>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mr-2"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Exportar Excel
          </button>
          <button
            onClick={handleCreateUser}
            className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors whitespace-nowrap text-base font-bold shadow-md"
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
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Nombre Completo
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Región
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">
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
                  const regionName =
                    user.region?.nombre || user.regionId?.toString() || '-';
                  return (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900 font-medium">
                        {user.nombreCompleto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                        {user.role}
                        {getEffectiveRole(user) === 'Client' &&
                          user.role?.toUpperCase() === 'PREMIUM' && (
                            <span className="text-red-600 font-bold text-[10px] ml-2 px-1.5 py-0.5 bg-red-50 border border-red-200 rounded uppercase">
                              Expirado
                            </span>
                          )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                        {regionName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
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
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
              currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Anterior
          </button>
          <span className="text-sm text-gray-700">
            Página {currentPage} de {totalPages} &bull; {filteredUsers.length}{' '}
            encontrados
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
              currentPage === totalPages || totalPages === 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
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
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1 transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol*
                  </label>
                  <select
                    value={formData.role ?? 'Client'}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4a90f9]"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Client">Client</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>

                {/* === SECCIÓN 1: INFORMACIÓN PERSONAL === */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <UserIcon className="w-5 h-5 text-[#4a90f9]" />
                    <h4 className="font-bold text-[#4a90f9]">
                      Información personal
                    </h4>
                  </div>

                  {/* Nombre completo */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-700 mb-1">
                      Nombre completo*
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={formData.nombreCompleto}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nombreCompleto: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4a90f9]"
                      required
                    />
                  </div>
                  {/* Correo + Celular */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Correo*
                      </label>
                      <input
                        type="email"
                        placeholder="Correo"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4a90f9]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Celular
                      </label>
                      <input
                        type="text"
                        placeholder="Teléfono"
                        value={formData.celular}
                        onChange={(e) =>
                          setFormData({ ...formData, celular: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4a90f9]"
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
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4a90f9] pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Región */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-700 mb-1">
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
                      className="w-full border border-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4a90f9] bg-white"
                    >
                      <option value={0} disabled hidden>
                        Seleccionar región
                      </option>
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* IE (Solo Premium o Admin) */}
                  {(formData.role === 'Premium' ||
                    formData.role === 'Admin') && (
                    <div className="mb-3">
                      <label className="block text-sm text-gray-700 mb-1">
                        Institución Educativa
                      </label>
                      <input
                        type="text"
                        placeholder="Institución Educativa"
                        value={formData.ie}
                        onChange={(e) =>
                          setFormData({ ...formData, ie: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4a90f9]"
                      />
                    </div>
                  )}

                  {/* Observaciones (Solo Premium o Admin) */}
                  {(formData.role === 'Premium' ||
                    formData.role === 'Admin') && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Observaciones
                      </label>
                      <textarea
                        placeholder="Observaciones"
                        value={formData.observaciones}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            observaciones: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4a90f9] resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* === SECCIÓN 2: INFORMACIÓN ACADÉMICA (Premium, Admin o Client) === */}
                {(formData.role === 'Premium' ||
                  formData.role === 'Admin' ||
                  formData.role === 'Client') && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <AcademicCapIcon className="w-5 h-5 text-[#4a90f9]" />
                      <h4 className="font-bold text-[#4a90f9]">
                        Información Académica
                      </h4>
                    </div>

                    {/* Modalidad */}
                    <div className="mb-3">
                      <label className="block text-sm text-gray-700 mb-1">
                        Modalidad
                      </label>
                      <select
                        value={formData.modalidadId ?? 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            modalidadId: Number(e.target.value),
                            nivelId: 0,
                            especialidadId: 0,
                          })
                        }
                        className="w-full border border-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4a90f9] bg-white"
                      >
                        <option value={0}>Seleccionar Modalidad</option>
                        {modalidades.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Nivel */}
                    {!!formData.modalidadId && filteredNiveles.length > 0 && (
                      <div className="mb-3">
                        <label className="block text-sm text-gray-700 mb-1">
                          Nivel
                        </label>
                        <select
                          value={formData.nivelId ?? 0}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nivelId: Number(e.target.value),
                              especialidadId: 0,
                            })
                          }
                          className="w-full border border-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4a90f9] bg-white"
                          disabled={!formData.modalidadId}
                        >
                          <option value={0}>Seleccionar Nivel</option>
                          {filteredNiveles.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Especialidad */}
                    {!!formData.nivelId &&
                      filteredEspecialidades.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm text-gray-700 mb-1">
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
                            className="w-full border border-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4a90f9] bg-white"
                            disabled={!formData.nivelId}
                          >
                            <option value={0}>Seleccionar especialidad</option>
                            {filteredEspecialidades.map((e) => (
                              <option key={e.id} value={e.id}>
                                {e.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                    {/* Botones académicos */}
                    <div className="mt-3 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!formData.modalidadId || !formData.nivelId)
                            return;
                          const espsToAdd =
                            filteredEspecialidades.length > 0
                              ? filteredEspecialidades.map((e) => ({
                                  modalidadId: Number(formData.modalidadId),
                                  nivelId: Number(formData.nivelId),
                                  especialidadId: e.id,
                                }))
                              : [
                                  {
                                    modalidadId: Number(formData.modalidadId),
                                    nivelId: Number(formData.nivelId),
                                    especialidadId: 0,
                                  },
                                ];

                          setUserExamenes((prev) => {
                            const newAccesos = [...prev];
                            espsToAdd.forEach((acc) => {
                              if (
                                !newAccesos.some(
                                  (a) =>
                                    a.modalidadId === acc.modalidadId &&
                                    a.nivelId === acc.nivelId &&
                                    a.especialidadId === acc.especialidadId
                                )
                              ) {
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
                            especialidadId:
                              Number(formData.especialidadId) || 0,
                          };
                          setUserExamenes((prev) => {
                            if (
                              prev.some(
                                (a) =>
                                  a.modalidadId === acceso.modalidadId &&
                                  a.nivelId === acceso.nivelId &&
                                  a.especialidadId === acceso.especialidadId
                              )
                            ) {
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

                    {/* Lista de accesos configurados */}
                    {userExamenes.length > 0 && (
                      <div className="mt-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-[#4a90f9] flex items-center gap-2">
                            Accesos configurados ({userExamenes.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => setUserExamenes([])}
                            className="text-xs text-red-500 hover:text-red-700 font-bold bg-white px-2 py-1 rounded border border-red-100 shadow-sm"
                          >
                            Limpiar todo
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-2">
                          {userExamenes.map((ex, idx) => {
                            const mod = modalidades.find(
                              (m) => m.id === ex.modalidadId
                            );
                            const niv = niveles.find(
                              (n) => n.id === ex.nivelId
                            );
                            const esp = especialidades.find(
                              (e) => e.id === ex.especialidadId
                            );
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm group"
                              >
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-blue-600 uppercase leading-none mb-1">
                                    {mod?.nombre || 'Sin modalidad'}
                                  </span>
                                  <span className="text-xs font-medium text-gray-700">
                                    {niv?.nombre || 'General'}
                                    {esp ? ` - ${esp.nombre}` : ''}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setUserExamenes((prev) =>
                                      prev.filter((_, i) => i !== idx)
                                    )
                                  }
                                  className="text-gray-300 hover:text-red-500 transition-colors"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
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

                {/* === SECCIÓN 3: INFORMACIÓN DE PAGO (Premium o Admin) === */}
                {(formData.role === 'Premium' || formData.role === 'Admin') && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCardIcon className="w-5 h-5 text-[#4a90f9]" />
                      <h4 className="font-bold text-[#4a90f9]">
                        Información de Pago
                      </h4>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm text-gray-700 mb-1">
                        Plan
                      </label>
                      <select
                        value={(formData as any).planId ?? 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [e.target.name || 'planId']: Number(e.target.value),
                          } as any)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4a90f9]"
                      >
                        <option value={0}>Seleccionar Plan</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.titulo} - ${p.precio}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          F. Inicio
                        </label>
                        <input
                          type="date"
                          value={(formData as any).fechaInicio ?? ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fechaInicio: e.target.value,
                            } as any)
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4a90f9]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          F. Fin
                        </label>
                        <input
                          type="date"
                          value={(formData as any).fechaFin ?? ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fechaFin: e.target.value,
                            } as any)
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4a90f9]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* === SECCIÓN 5: TIPO DE ACCESO (Solo Premium o Admin) === */}
                {(formData.role === 'Premium' || formData.role === 'Admin') && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <LockClosedIcon className="w-5 h-5 text-[#4a90f9]" />
                      <h4 className="font-bold text-[#4a90f9]">
                        Tipo de Acceso*
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {tiposAcceso.map((tipo) => (
                        <label
                          key={tipo.id}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.accesoIds
                              ?.map(Number)
                              .includes(Number(tipo.id))}
                            onChange={(e) => {
                              const currentIds = formData.accesoIds || [];
                              const id = Number(tipo.id);
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  accesoIds: [...currentIds.map(Number), id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  accesoIds: currentIds
                                    .map(Number)
                                    .filter((cid) => cid !== id),
                                });
                              }
                            }}
                            className="w-4 h-4 accent-red-500 rounded"
                          />
                          <span className="text-sm text-gray-800">
                            {tipo.descripcion}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* === SECCIÓN 6: FECHA EXPIRACIÓN (Solo Premium o Admin) === */}
                {(formData.role === 'Premium' || formData.role === 'Admin') && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarIcon className="w-5 h-5 text-[#4a90f9]" />
                      <h4 className="font-bold text-[#4a90f9]">
                        Fecha de expiración
                      </h4>
                    </div>
                    <div className="space-y-2 mb-3">
                      {[
                        { key: '1year', label: '1 año desde hoy' },
                        { key: '5months', label: '5 meses desde hoy' },
                        { key: '10months', label: '10 meses desde hoy' },
                        { key: 'custom', label: 'Elegir fecha específica' },
                      ].map(({ key, label }) => (
                        <label
                          key={key}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="expiration-preset"
                            checked={expirationMode === key}
                            onChange={() =>
                              key !== 'custom'
                                ? handleExpirationPresetChange(key as any)
                                : setExpirationMode('custom')
                            }
                            className="w-4 h-4 accent-[#4a90f9]"
                          />
                          <span className="text-sm text-gray-800">{label}</span>
                        </label>
                      ))}
                    </div>
                    {expirationMode === 'custom' && (
                      <input
                        type="datetime-local"
                        value={formatDateForInput(formData.fechaExpiracion)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fechaExpiracion: parseInputDateToISO(
                              e.target.value
                            ),
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4a90f9]"
                      />
                    )}
                  </div>
                )}

                {/* Botón Guardar */}
                <button
                  type="submit"
                  className="w-full bg-[#4a90f9] hover:bg-[#001d4a] text-white font-bold rounded-xl py-3 text-sm transition-colors shadow-lg"
                >
                  {editingUser ? 'Actualizar usuario' : 'Guardar usuario'}
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
