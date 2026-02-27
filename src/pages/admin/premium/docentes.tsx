import React, { useState, useEffect } from 'react';

import {
  SearchIcon,
  PlusIcon,
  DownloadIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/outline';
import {
  UserIcon,
  AcademicCapIcon,
  LockClosedIcon,
  CalendarIcon,
} from '@heroicons/react/solid';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import AdminLayout from '../../../components/AdminLayout';
import { examenService } from '../../../services/examenService';
import { regionService, Region } from '../../../services/regionService';
import {
  tipoAccesoService,
  TipoAcceso,
} from '../../../services/tipoAccesoService';
import { userService, User } from '../../../services/userService';
import {
  formatDateForInput,
  parseInputDateToISO,
} from '../../../utils/dateUtils';

// Mock data type for view (adapted to match User from API partially)
interface Docente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  userExamenes: Array<{
    modalidadNombre: string | null;
    nivelNombre: string | null;
    especialidadNombre: string | null;
  }>;
  estado: 'Activo' | 'Por vencer' | 'Expirado' | 'Sin Estado';
  fechaExpiracion: string;
  avatarUrl?: string;
}

const AdminPremiumDocentes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('');
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(
    null
  );
  const [formData, setFormData] = useState<Partial<User>>({
    nombreCompleto: '',
    email: '',
    password: '',
    role: 'Premium', // Default role
    celular: '',
    ie: '',
    estado: 'Activo', // Default state
    observaciones: '',
    tiempo: 0,
    regionId: 0,
    modalidadId: 0,
    nivelId: 0,
    especialidadId: 0,
    accesoIds: [],
  });

  const [regions, setRegions] = useState<Region[]>([]);
  const [modalidades, setModalidades] = useState<
    { id: number; nombre: string; base?: number }[]
  >([]);
  const [niveles, setNiveles] = useState<
    { id: number; nombre: string; modalidadIds: number[] }[]
  >([]);
  const [especialidades, setEspecialidades] = useState<
    { id: number; nombre: string; nivelId: number }[]
  >([]);
  const [tiposAcceso, setTiposAcceso] = useState<TipoAcceso[]>([]);

  const [filteredNiveles, setFilteredNiveles] = useState<typeof niveles>([]);
  const [filteredEspecialidades, setFilteredEspecialidades] = useState<
    typeof especialidades
  >([]);

  // Expiration Logic
  const [expirationMode, setExpirationMode] = useState<
    '1year' | '5months' | '10months' | 'custom'
  >('custom');

  // Academic accesses (userExamenes)
  interface AcademicAccess {
    modalidadId: number;
    nivelId: number;
    especialidadId: number;
  }
  const [userExamenes, setUserExamenes] = useState<AcademicAccess[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const calculateExpirationDate = (mode: '1year' | '5months' | '10months') => {
    const date = new Date();
    if (mode === '1year') {
      date.setFullYear(date.getFullYear() + 1);
    } else if (mode === '5months') {
      date.setMonth(date.getMonth() + 5);
    } else if (mode === '10months') {
      date.setMonth(date.getMonth() + 10);
    }
    return date.toISOString();
  };

  const handleExpirationPresetChange = (
    mode: '1year' | '5months' | '10months'
  ) => {
    setExpirationMode(mode);
    const newDate = calculateExpirationDate(mode);
    setFormData((prev: any) => ({ ...prev, fechaExpiracion: newDate }));
  };

  const calculateUserStatus = (
    fechaExpiracion: string | null | undefined
  ): Docente['estado'] => {
    if (!fechaExpiracion || fechaExpiracion === '-') return 'Expirado';
    const expirationDate = new Date(fechaExpiracion);
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expirado';
    if (diffDays <= 7) return 'Por vencer';
    return 'Activo';
  };

  const fetchCatalogs = async () => {
    try {
      const [r, t, hierarchy] = await Promise.all([
        regionService.getAll(),
        tipoAccesoService.getAll(),
        examenService.getSimplifiedHierarchy(),
      ]);
      setRegions(r);
      setTiposAcceso(t);
      setModalidades(hierarchy.modalidades.reverse() as any);
      setNiveles(hierarchy.niveles);
      setEspecialidades(hierarchy.especialidades);
    } catch (error) {
      console.error('Error fetching catalogs', error);
    }
  };

  useEffect(() => {
    // Reset expiration when modal opens if needed, or default to something?
    // For now, let's keep it clean or default to custom
  }, [isModalOpen]);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  useEffect(() => {
    if (formData.modalidadId) {
      const filtered = niveles.filter((n) =>
        n.modalidadIds.includes(Number(formData.modalidadId))
      );
      setFilteredNiveles(filtered);
    } else {
      setFilteredNiveles([]);
    }
  }, [formData.modalidadId, niveles]);

  useEffect(() => {
    if (formData.nivelId) {
      const filtered = especialidades.filter((e) => {
        if (Array.isArray(e.nivelId))
          return e.nivelId.includes(Number(formData.nivelId));
        return e.nivelId === Number(formData.nivelId);
      });
      setFilteredEspecialidades(filtered);
    } else {
      setFilteredEspecialidades([]);
    }
  }, [formData.nivelId, especialidades]);

  const handleViewDetails = async (docenteId: number) => {
    try {
      const user = await userService.getById(docenteId);
      setSelectedUserDetail(user);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error fetching user details', error);
      alert('Error al cargar detalles del docente');
    }
  };

  const handleEdit = async (docenteId: number) => {
    try {
      const user = await userService.getById(docenteId);
      setEditingUser(docenteId);

      // Populate userExamenes from API response
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
        password: '',
        role: user.role || 'Premium',
        celular: user.celular,
        estado: user.estado || 'Activo',
        ie: user.ie || '',
        observaciones: user.observaciones || '',
        tiempo: user.tiempo || 0,
        regionId: user.regionId || 0,
        modalidadId: firstExamen?.modalidadId || user.modalidadId || 0,
        nivelId: firstExamen?.nivelId || user.nivelId || 0,
        especialidadId: firstExamen?.especialidadId || user.especialidadId || 0,
        fechaExpiracion: user.fechaExpiracion,
        accesoIds:
          user.accesoIds && user.accesoIds.length > 0
            ? Array.isArray(user.accesoIds)
              ? user.accesoIds.map(Number)
              : []
            : tiposAcceso.map((t) => Number(t.id)),
      });
      setExpirationMode('custom');
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching user details', error);
      alert('Error al cargar datos del docente');
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setUserExamenes([]);
    setShowPassword(false);
    setFormData({
      nombreCompleto: '',
      email: '',
      password: '',
      role: 'Premium',
      celular: '',
      ie: '',
      estado: 'Activo',
      observaciones: '',
      tiempo: 0,
      regionId: 0,
      modalidadId: 0,
      nivelId: 0,
      especialidadId: 0,
      accesoIds: tiposAcceso.map((t) => Number(t.id)),
    });
    setExpirationMode('custom');
  };

  const handleDelete = async (docenteId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este docente?')) return;
    try {
      await userService.delete(docenteId);
      alert('Docente eliminado con éxito');
      fetchDocentes();
    } catch (error: any) {
      console.error('Error deleting docente', error);
      alert(`Error al eliminar docente: ${error.message || ''}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Confirmación al asignar rol Admin
      if (formData.role === 'Admin') {
        const confirmed = window.confirm(
          '¿Estás seguro que quieres hacer Administrador a este usuario?'
        );
        if (!confirmed) return;
      }
      // Si hay selección en los dropdowns que no fue añadida manualmente, incluirla automáticamente
      const finalUserExamenes = [...userExamenes];
      if (formData.modalidadId) {
        const alreadyAdded = finalUserExamenes.some(
          (ex) =>
            ex.modalidadId === Number(formData.modalidadId) &&
            ex.nivelId === Number(formData.nivelId || 0) &&
            ex.especialidadId === Number(formData.especialidadId || 0)
        );
        if (!alreadyAdded) {
          finalUserExamenes.push({
            modalidadId: Number(formData.modalidadId),
            nivelId: Number(formData.nivelId) || 0,
            especialidadId: Number(formData.especialidadId) || 0,
          });
        }
      }

      const payload: any = {
        nombreCompleto: formData.nombreCompleto,
        email: formData.email,
        role: formData.role || 'Premium',
        celular: formData.celular || '',
        estado: formData.estado || 'Activo',
        ie: formData.ie || '',
        observaciones: formData.observaciones || '',
        tiempo: Number(formData.tiempo) || 0,
        regionId: Number(formData.regionId) || 0,
        fechaCreacion: new Date().toISOString(),
        accesoIds: formData.accesoIds || [],
        userExamenes: finalUserExamenes,
      };

      // Solo incluir fechaExpiracion si tiene valor válido
      if (formData.fechaExpiracion && formData.fechaExpiracion.trim() !== '') {
        payload.fechaExpiracion = formData.fechaExpiracion;
      }

      // Siempre incluir password si fue ingresada
      if (formData.password) {
        payload.password = formData.password;
      }

      console.log('Payload enviado:', JSON.stringify(payload, null, 2));

      if (editingUser) {
        await userService.update(editingUser, payload);
        alert('Docente actualizado con éxito');
      } else {
        if (!formData.password) {
          alert('La contraseña es obligatoria para nuevos usuarios');
          return;
        }
        await userService.create(payload);
        alert('Docente creado con éxito');
      }

      setIsModalOpen(false);
      resetForm();
      fetchDocentes();
    } catch (error: any) {
      console.error('Error saving docente', error);
      alert(`Error al guardar docente: ${error.message || ''}`);
    }
  };

  const fetchDocentes = async () => {
    setLoading(true);
    try {
      const users = await userService.getAll();
      // Filter by role 'Premium' AND NOT expired
      const premiumUsers = users.filter(
        (u) =>
          u.role === 'Premium' ||
          (u.role === 'Client' &&
            u.fechaExpiracion &&
            u.fechaExpiracion !== '-')
      );

      // Map to Docente interface
      const mappedDocentes: Docente[] = premiumUsers.map((u) => {
        const estado = calculateUserStatus(u.fechaExpiracion);

        return {
          id: u.id,
          nombre: u.nombreCompleto,
          email: u.email,
          telefono: u.celular || '-',
          userExamenes: ((u as any).userExamenes || []).map((ex: any) => ({
            modalidadNombre: ex.modalidadNombre || null,
            nivelNombre: ex.nivelNombre || null,
            especialidadNombre: ex.especialidadNombre || null,
          })),
          estado,
          fechaExpiracion: u.fechaExpiracion || '-',
          avatarUrl: '',
        };
      });

      setDocentes(mappedDocentes);
    } catch (error) {
      console.error('Error fetching docentes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocentes();
  }, []);

  const handleExportExcel = async () => {
    try {
      setLoading(true);

      const allUsers = await userService.getAll();
      let premiumUsers = allUsers.filter(
        (u) =>
          u.role === 'Premium' ||
          (u.role === 'Client' &&
            u.fechaExpiracion &&
            u.fechaExpiracion !== '-')
      );

      // --- FILTROS ---
      if (filterOption) {
        premiumUsers = premiumUsers.filter((u) => {
          const estado = calculateUserStatus(u.fechaExpiracion);
          return estado.toLowerCase() === filterOption.toLowerCase();
        });
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        premiumUsers = premiumUsers.filter(
          (u) =>
            (u.nombreCompleto || '').toLowerCase().includes(term) ||
            (u.email || '').toLowerCase().includes(term)
        );
      }

      if (premiumUsers.length === 0) {
        alert('No hay datos para exportar con los filtros actuales.');
        setLoading(false);
        return;
      }

      // --- CREAR EXCEL ---
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte Docentes');

      const headerColor = 'FF002B6B'; // Dark Blue from reference
      const rowActiveColor = 'FFC6EFCE';
      const rowInactiveColor = 'FFFFC7CE';

      // Fila 1: Título
      worksheet.mergeCells('A1:M1');
      const titleCell = worksheet.getCell('A1');
      const nowFormatted = new Date()
        .toLocaleString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
        .replace(',', '');
      titleCell.value = `Reporte de Docentes - ${nowFormatted}`;
      titleCell.font = { name: 'Arial', size: 16, bold: true };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // Fila 3: Filtros
      let filtrosTexto = 'Filtros aplicados: ';
      const filtrosActivos = [];
      if (searchTerm) filtrosActivos.push(`Búsqueda: "${searchTerm}"`);
      if (filterOption) filtrosActivos.push(`Estado: "${filterOption}"`);
      filtrosTexto +=
        filtrosActivos.length > 0
          ? filtrosActivos.join(', ')
          : 'Sin filtros aplicados';

      worksheet.mergeCells('A3:M3');
      const filterCell = worksheet.getCell('A3');
      filterCell.value = filtrosTexto;
      filterCell.font = { italic: true, color: { argb: 'FF555555' } };

      // Fila 5: Cabeceras
      const headerRow = worksheet.getRow(5);
      headerRow.values = [
        'ID',
        'Nombre Completo',
        'Teléfono',
        'Email',
        'Estado',
        'Fecha Registro',
        'Suscripciones Activas',
        'Modalidades',
        'Niveles',
        'Especialidades', // plural
        'Región',
        'IE', // NUEVO
        'Observaciones',
      ];

      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: headerColor },
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // Llenado de filas
      premiumUsers.forEach((u) => {
        const estado = calculateUserStatus(u.fechaExpiracion);

        // Map ACTIVE subscriptions using names from API if available
        const subActivas =
          u.accesoNombres && u.accesoNombres.length > 0
            ? u.accesoNombres.join(', ')
            : u.accesoIds && u.accesoIds.length > 0
            ? u.accesoIds
                .map((id) => {
                  const tipo = tiposAcceso.find(
                    (t) => Number(t.id) === Number(id)
                  );
                  const expDate = u.fechaExpiracion
                    ? new Date(u.fechaExpiracion).toLocaleDateString()
                    : '-';
                  return tipo ? `${tipo.descripcion}: ${expDate}` : '';
                })
                .filter(Boolean)
                .join('; ')
            : 'Todas expiradas';

        const rowValues = [
          u.id,
          u.nombreCompleto,
          u.celular || '-',
          u.email,
          estado,
          u.fechaCreacion || u.fecha_creacion
            ? new Date(
                u.fechaCreacion || u.fecha_creacion!
              ).toLocaleDateString()
            : '-',
          subActivas,
          u.modalidadNombres && u.modalidadNombres.length > 0
            ? u.modalidadNombres.join(', ')
            : u.modalidad?.nombre || '-',
          u.nivelNombres && u.nivelNombres.length > 0
            ? u.nivelNombres.join(', ')
            : u.nivel?.nombre || '-',
          u.especialidadNombres && u.especialidadNombres.length > 0
            ? u.especialidadNombres.join(', ')
            : u.especialidad?.nombre || '-',
          u.region?.nombre || '-',
          u.ie || '-',
          u.observaciones || '-',
        ];

        const newRow = worksheet.addRow(rowValues);
        const elColor = estado === 'Activo' ? rowActiveColor : rowInactiveColor;

        newRow.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: elColor },
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });

      // AutoFit Columnas
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const rowNumber = Number(cell.row);
          if (rowNumber <= 5) return;
          const cellValue = cell.value ? cell.value.toString() : '';
          if (cellValue.length > maxLength) maxLength = cellValue.length;
        });
        column.width = maxLength < 12 ? 12 : maxLength + 2;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const today = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `Reporte_Docentes_${today}.xlsx`);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error al exportar a Excel');
    } finally {
      setLoading(false);
    }
  };
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Filtering logic for the search bar and dropdown
  const filteredDocentes = docentes.filter((d) => {
    const matchesSearch =
      d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterOption
      ? d.estado.toLowerCase() === filterOption.toLowerCase()
      : true;

    return matchesSearch && matchesFilter;
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDocentes.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredDocentes.length / itemsPerPage);

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
  }, [searchTerm, filterOption]);

  // Status stats - Calculated from filtered or total? Usually total.
  const stats = {
    total: docentes.length,
    activos: docentes.filter((d) => d.estado === 'Activo').length,
    porVencer: docentes.filter((d) => d.estado === 'Por vencer').length,
    expirados: docentes.filter((d) => d.estado === 'Expirado').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activo':
        return 'bg-green-100 text-green-800';
      case 'Por vencer':
        return 'bg-yellow-100 text-yellow-800';
      case 'Expirado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      {/* Header Banner */}
      <div className="bg-primary text-white p-6 rounded-t-lg mb-6 flex justify-center items-center">
        <h1 className="text-2xl font-bold">Administrar docentes</h1>
      </div>

      {/* Sticky Filters & Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 sticky top-[-24px] z-30 mb-6">
        {/* Controls Row */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Buscar docente"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Dropdown Filter */}
            <div className="relative w-full md:w-48">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                value={filterOption}
                onChange={(e) => setFilterOption(e.target.value)}
              >
                <option value="">Seleccionar opción</option>
                <option value="activo">Activos</option>
                <option value="por vencer">Por vencer</option>
                <option value="expirado">Expirados</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            {/* Export Button */}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DownloadIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
              Exportar excel
            </button>

            {/* Add Button */}
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Agregar docente
            </button>
          </div>
        </div>
      </div>

      {/* Stats and Table Container */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg border-2 border-blue-100 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-1 bg-blue-600 mb-2 rounded-full"></div>
            <div className="text-gray-500 text-sm font-medium">
              Total docentes
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {stats.total}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border-2 border-green-100 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-1 bg-green-500 mb-2 rounded-full"></div>
            <div className="text-gray-500 text-sm font-medium">Activos</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {stats.activos}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border-2 border-yellow-100 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-1 bg-yellow-500 mb-2 rounded-full"></div>
            <div className="text-gray-500 text-sm font-medium">Por vencer</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {stats.porVencer}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border-2 border-red-100 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-1 bg-red-500 mb-2 rounded-full"></div>
            <div className="text-gray-500 text-sm font-medium">Expirados</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {stats.expirados}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50/50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs text-gray-900 uppercase tracking-wider font-bold"
                >
                  Nombre
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs text-gray-900 uppercase tracking-wider font-bold"
                >
                  Contacto
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs text-gray-900 uppercase tracking-wider font-bold"
                >
                  Modalidad/Nivel
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs text-gray-900 uppercase tracking-wider font-bold"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs text-gray-900 uppercase tracking-wider font-bold"
                >
                  Expiración
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs text-gray-900 uppercase tracking-wider font-bold"
                >
                  Tiempo Restante
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs text-gray-900 uppercase tracking-wider font-bold"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Cargando docentes...
                  </td>
                </tr>
              ) : filteredDocentes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No hay docentes registrados con rol Premium.
                  </td>
                </tr>
              ) : (
                currentItems.map((docente) => (
                  <tr key={docente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">
                          {docente.nombre.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {docente.nombre}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* ... remaining columns same ... */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {docente.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {docente.telefono}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {docente.userExamenes.length === 0 ? (
                        <span className="text-gray-400">-</span>
                      ) : (
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenPopoverId(
                                openPopoverId === docente.id ? null : docente.id
                              )
                            }
                            className="text-blue-600 hover:text-blue-800 underline text-sm font-semibold"
                          >
                            Ver accesos ({docente.userExamenes.length})
                          </button>
                          {openPopoverId === docente.id && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
                              <div
                                className="absolute inset-0"
                                onClick={() => setOpenPopoverId(null)}
                              ></div>
                              <div className="relative bg-white border border-gray-100 rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                                {/* Modal Header */}
                                <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                                  <div>
                                    <h4 className="text-lg font-bold text-[#002B6B]">
                                      Accesos del Docente
                                    </h4>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                                      {docente.nombre}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => setOpenPopoverId(null)}
                                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors flex items-center justify-center shadow-sm"
                                  >
                                    <svg
                                      className="h-6 w-6"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>

                                {/* Modal Body (Scrollable) */}
                                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 py-1">
                                  {docente.userExamenes.map((ex, i) => (
                                    <div
                                      key={i}
                                      className="flex items-start gap-4 p-4 bg-blue-50/40 rounded-2xl border border-blue-100 transition-all hover:bg-blue-50/80 hover:shadow-sm"
                                    >
                                      <div className="bg-blue-600 p-2.5 rounded-xl shadow-md text-white mt-1 group-hover:scale-110 transition-transform">
                                        <svg
                                          className="w-5 h-5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                          />
                                        </svg>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-1 opacity-70">
                                          {ex.modalidadNombre || 'MODALIDAD'}
                                        </div>
                                        <div className="text-base font-bold text-gray-800 truncate">
                                          {ex.nivelNombre
                                            ? ex.nivelNombre.trim()
                                            : 'NIVEL NO ASIGNADO'}
                                        </div>
                                        {ex.especialidadNombre && (
                                          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-100 rounded-lg text-xs font-semibold text-gray-600 shadow-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                            {ex.especialidadNombre}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Modal Footer */}
                                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
                                    Total: {docente.userExamenes.length} accesos
                                  </span>
                                  <button
                                    onClick={() => setOpenPopoverId(null)}
                                    className="px-6 py-2 bg-[#002B6B] text-white text-xs font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/10"
                                  >
                                    Cerrar
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(
                          docente.estado
                        )}`}
                      >
                        {docente.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {docente.fechaExpiracion !== '-' ? (
                        <span className="font-medium text-gray-900">
                          {new Date(
                            docente.fechaExpiracion
                          ).toLocaleDateString()}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {docente.fechaExpiracion !== '-' ? (
                        <span
                          className={`text-sm px-2 py-1 rounded-full font-semibold ${
                            new Date(docente.fechaExpiracion) < new Date()
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          } `}
                        >
                          {(() => {
                            const expirationDate = new Date(
                              docente.fechaExpiracion
                            );
                            const now = new Date();
                            const diffTime =
                              expirationDate.getTime() - now.getTime();
                            const diffDays = Math.ceil(
                              diffTime / (1000 * 60 * 60 * 24)
                            );

                            if (diffDays < 0) return 'Expirado';
                            if (diffDays === 0) return 'Vence hoy';
                            return `Falta ${diffDays} días`;
                          })()}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(docente.id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Ver detalles"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(docente.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(docente.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar docente"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="py-4 flex items-center justify-center space-x-4 border-t border-gray-200 mt-4">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
              currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
            } `}
          >
            Anterior
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} de {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
              currentPage === totalPages || totalPages === 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
            } `}
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
                {editingUser ? 'Editar Docente' : 'Crear Docente'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1 transition-colors"
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
                  />
                </svg>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto p-5 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol*
                  </label>
                  <select
                    value={formData.role ?? 'Premium'}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
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
                    <svg
                      className="w-5 h-5 text-[#002B6B]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h4 className="font-bold text-[#002B6B]">
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B]"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Celular*
                      </label>
                      <input
                        type="text"
                        placeholder="Teléfono"
                        value={formData.celular}
                        onChange={(e) =>
                          setFormData({ ...formData, celular: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B]"
                      />
                    </div>
                  </div>

<<<<<<< Updated upstream
                  {/* Contraseña (solo en crear) */}
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
                          {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          )}
                        </button>
                      </div>
=======
                  {/* Contraseña (solo en crear, o siempre editable) */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-700 mb-1">
                      Contraseña{!editingUser && '*'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Contraseña"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B] pr-10"
                        required={!editingUser}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
>>>>>>> Stashed changes
                    </div>
                  )}

                  {/* Región */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-700 mb-1">
                      Región
                    </label>
                    <div className="relative">
                      <select
                        value={formData.regionId ?? 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            regionId: Number(e.target.value),
                          })
                        }
                        className="w-full border border-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B] appearance-none bg-white"
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
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                        ▼
                      </span>
                    </div>
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B]"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B] resize-none"
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
                      <svg
                        className="w-5 h-5 text-[#002B6B]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l9-5-9-5-9 5 9 5z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                        />
                      </svg>
                      <h4 className="font-bold text-[#002B6B]">
                        Información Académica
                      </h4>
                    </div>

                    {/* Modalidad */}
                    <div className="mb-3">
                      <label className="block text-sm text-gray-700 mb-1">
                        Modalidad
                      </label>
                      <div className="relative">
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
                          className="w-full border border-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B] appearance-none bg-white"
                        >
                          <option value={0} disabled hidden>
                            Seleccionar modalidad
                          </option>
                          {modalidades.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nombre}
                            </option>
                          ))}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                          ▼
                        </span>
                      </div>
                    </div>

                    {/* Nivel */}
                    {!!formData.modalidadId && filteredNiveles.length > 0 && (
                      <div className="mb-3">
                        <label className="block text-sm text-gray-700 mb-1">
                          Nivel
                        </label>
                        <div className="relative">
                          <select
                            value={formData.nivelId ?? 0}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nivelId: Number(e.target.value),
                                especialidadId: 0,
                              })
                            }
                            className="w-full border border-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B] appearance-none bg-white"
                          >
                            <option value={0} disabled hidden>
                              Seleccionar nivel
                            </option>
                            {filteredNiveles.map((n) => (
                              <option key={n.id} value={n.id}>
                                {n.nombre}
                              </option>
                            ))}
                          </select>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                            ▼
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Especialidad */}
                    {!!formData.nivelId &&
                      filteredEspecialidades.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm text-gray-700 mb-1">
                            Especialidad
                          </label>
                          <div className="relative">
                            <select
                              value={formData.especialidadId ?? 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  especialidadId: Number(e.target.value),
                                })
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B] appearance-none bg-white"
                            >
                              <option value={0} disabled hidden>
                                Seleccionar especialidad
                              </option>
                              {filteredEspecialidades.map((e) => (
                                <option key={e.id} value={e.id}>
                                  {e.nombre}
                                </option>
                              ))}
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                              ▼
                            </span>
                          </div>
                        </div>
                      )}

                    {/* Botones académicos */}
                    <div className="space-y-2">
                      {filteredEspecialidades.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!formData.modalidadId || !formData.nivelId)
                              return;
                            const espsToAdd = filteredEspecialidades.map(
                              (e) => ({
                                modalidadId: Number(formData.modalidadId),
                                nivelId: Number(formData.nivelId),
                                especialidadId: e.id,
                              })
                            );
                            setUserExamenes((prev) => [...prev, ...espsToAdd]);
                          }}
                          style={{ backgroundColor: '#f59e0b' }}
                          className="w-full text-white font-semibold rounded-lg py-2.5 text-sm transition-colors hover:opacity-90"
                        >
                          Añadir todas las especialidades
                        </button>
                      )}
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
                          setUserExamenes((prev) => [...prev, acceso]);
                        }}
                        style={{ backgroundColor: '#10b981' }}
                        className="w-full text-white font-semibold rounded-lg py-2.5 text-sm transition-colors hover:opacity-90"
                      >
                        Agregar acceso
                      </button>
                    </div>

                    {/* Lista de accesos configurados - DEBAJO */}
                    {userExamenes.length > 0 && (
                      <div className="mt-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-[#002B6B] flex items-center gap-2">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path
                                fillRule="evenodd"
                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                clipRule="evenodd"
                              />
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
                                  {(niv?.nombre || esp) && (
                                    <span className="text-xs font-medium text-gray-700">
                                      {niv?.nombre || ''}
                                      {esp ? ` - ${esp.nombre}` : ''}
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setUserExamenes((prev) =>
                                      prev.filter((_, i) => i !== idx)
                                    )
                                  }
                                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                  title="Eliminar"
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

                {/* === SECCIÓN 3: TIPO DE ACCESO (Solo Premium o Admin) === */}
                {(formData.role === 'Premium' || formData.role === 'Admin') && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg
                        className="w-5 h-5 text-[#002B6B]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <h4 className="font-bold text-[#002B6B]">
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
                                    .filter((cid: number) => cid !== id),
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
                    <p className="text-xs text-gray-500 mt-2">
                      * Selecciona al menos un tipo de acceso
                    </p>
                  </div>
                )}

                {/* === SECCIÓN 4: FECHA EXPIRACIÓN (Solo Premium o Admin) === */}
                {(formData.role === 'Premium' || formData.role === 'Admin') && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg
                        className="w-5 h-5 text-[#002B6B]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <h4 className="font-bold text-[#002B6B]">
                        Fecha de expiración
                      </h4>
                    </div>
                    <div className="space-y-2">
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
                            onChange={() => {
                              if (key === 'custom') {
                                setExpirationMode('custom');
                              } else {
                                handleExpirationPresetChange(key as any);
                              }
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
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fechaExpiracion: parseInputDateToISO(
                              e.target.value
                            ),
                          })
                        }
                        className="mt-3 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#002B6B]"
                      />
                    )}
                  </div>
                )}

                {/* === GUARDAR === */}
                <button
                  type="submit"
                  className="w-full bg-[#002B6B] hover:bg-[#001d4a] text-white font-bold rounded-xl py-3 text-sm transition-colors shadow-lg"
                >
                  {editingUser ? 'Actualizar docente' : 'Guardar docente'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white shadow-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 w-full text-center">
                Detalle de docente
              </h3>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="absolute right-4 top-4 text-white bg-red-500 hover:bg-red-600 rounded-full p-1 transition-colors shadow-sm"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content Container */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Sección 1: Información Personal */}
              <div className="border border-gray-200 rounded-xl p-6 relative">
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <UserIcon className="w-5 h-5 text-gray-700" />
                  </div>
                  <h4 className="font-bold text-[#002B6B] text-lg">
                    Información personal
                  </h4>
                  {(() => {
                    const status = calculateUserStatus(
                      selectedUserDetail.fechaExpiracion
                    );
                    return (
                      <span
                        className={`absolute right-6 top-6 px-3 py-1 rounded-lg text-sm font-bold ${getStatusColor(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-y-6">
                  <div className="text-center border-r border-gray-100">
                    <p className="text-[#002B6B] font-bold text-sm mb-1">
                      Nombre
                    </p>
                    <p className="text-gray-700 font-medium">
                      {selectedUserDetail.nombreCompleto}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#002B6B] font-bold text-sm mb-1">
                      Correo:
                    </p>
                    <p className="text-gray-700 font-medium break-all">
                      {selectedUserDetail.email}
                    </p>
                  </div>
                  <div className="col-span-2 text-center mt-2">
                    <p className="text-[#002B6B] font-bold text-sm mb-1">
                      Teléfono:
                    </p>
                    <p className="text-gray-700 font-medium text-lg tracking-wider">
                      {selectedUserDetail.celular || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex justify-center gap-12 text-center">
                  <div>
                    <p className="text-[#002B6B] font-bold text-sm mb-1">
                      Region
                    </p>
                    <p className="text-gray-800 font-bold uppercase">
                      {selectedUserDetail.region?.nombre || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#002B6B] font-bold text-sm mb-1">
                      Institución:
                    </p>
                    <p className="text-gray-800 font-bold">
                      {selectedUserDetail.ie || '-'}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-[#002B6B] font-bold text-sm mb-2">
                    Observaciones:
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg text-center text-gray-500 italic text-sm">
                    {selectedUserDetail.observaciones || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Sección 2: Información Académica */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <AcademicCapIcon className="w-5 h-5 text-gray-700" />
                  </div>
                  <h4 className="font-bold text-[#002B6B] text-lg">
                    Información académica
                  </h4>
                </div>

                <div className="flex justify-between px-8 text-center">
                  <div>
                    <p className="text-[#002B6B] font-bold text-sm mb-1">
                      Modalidad
                    </p>
                    <p className="text-blue-600 font-bold">
                      {selectedUserDetail.modalidad?.nombre ||
                        (selectedUserDetail as any).userExamenes?.[0]
                          ?.modalidadNombre ||
                        modalidades.find(
                          (m) => m.id === selectedUserDetail.modalidadId
                        )?.nombre ||
                        '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#002B6B] font-bold text-sm mb-1">
                      Nivel
                    </p>
                    <p className="text-blue-600 font-bold">
                      {selectedUserDetail.nivel?.nombre ||
                        (selectedUserDetail as any).userExamenes?.[0]
                          ?.nivelNombre ||
                        niveles.find((n) => n.id === selectedUserDetail.nivelId)
                          ?.nombre ||
                        '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sección 3: Subscripciones */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <LockClosedIcon className="w-5 h-5 text-gray-700" />
                  </div>
                  <h4 className="font-bold text-[#002B6B] text-lg">
                    Subscripciones
                  </h4>
                </div>

                <div className="space-y-4">
                  {tiposAcceso.map((acceso) => {
                    const hasAccess = selectedUserDetail.accesoIds?.includes(
                      Number(acceso.id)
                    );
                    if (!hasAccess) return null;
                    return (
                      <div
                        key={acceso.id}
                        className="border border-gray-200 rounded-xl p-4 flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase">
                            {acceso.descripcion}
                          </span>
                          {(() => {
                            const status = calculateUserStatus(
                              selectedUserDetail.fechaExpiracion
                            );
                            return (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(
                                  status
                                )}`}
                              >
                                {status}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-[10px] font-medium uppercase">
                            Fecha de expiración:
                          </p>
                          <p className="text-gray-700 font-bold text-sm">
                            {selectedUserDetail.fechaExpiracion
                              ? new Date(selectedUserDetail.fechaExpiracion)
                                  .toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })
                                  .replace(/\//g, '-')
                              : '-'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {(!selectedUserDetail.accesoIds ||
                    selectedUserDetail.accesoIds.length === 0) && (
                    <p className="text-center text-gray-400 italic py-2">
                      No tiene suscripciones activas
                    </p>
                  )}
                </div>
              </div>

              {/* Sección 4: Fechas importantes */}
              <div className="border border-gray-200 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-gray-700" />
                  </div>
                  <h4 className="font-bold text-[#002B6B] text-lg">
                    Fechas importantes
                  </h4>
                </div>

                <p className="text-[#002B6B] font-bold text-sm mb-1">
                  Fecha de creación:
                </p>
                <p className="text-gray-700 font-medium text-lg">
                  {selectedUserDetail.fechaCreacion
                    ? selectedUserDetail.fechaCreacion.split('T')[0]
                    : selectedUserDetail.fecha_creacion
                    ? selectedUserDetail.fecha_creacion.split('T')[0]
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPremiumDocentes;
