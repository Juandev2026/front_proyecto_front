import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { 
  SearchIcon, 
  PlusIcon, 
  DownloadIcon, 
  PencilIcon,
  TrashIcon
} from '@heroicons/react/outline';
import { userService, User } from '../../../services/userService';
import { regionService, Region } from '../../../services/regionService';
import { modalidadService, Modalidad } from '../../../services/modalidadService';
import { nivelService, Nivel } from '../../../services/nivelService';
import { especialidadesService, Especialidad } from '../../../services/especialidadesService';
import { exportToExcel } from '../../../utils/excelUtils';

// Mock data type for view (adapted to match User from API partially)
interface Docente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  modalidad: string;
  nivel: string;
  estado: 'Activo' | 'Por vencer' | 'Expirado' | 'Sin Estado';
  fechaExpiracion: string;
  avatarUrl?: string;
}

const AdminPremiumDocentes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('');
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<number | null>(null);
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
  });

  // Catalogs
  const [regions, setRegions] = useState<Region[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  
  const [filteredNiveles, setFilteredNiveles] = useState<Nivel[]>([]);
  const [filteredEspecialidades, setFilteredEspecialidades] = useState<Especialidad[]>([]);

  // Expiration Logic
  const [expirationMode, setExpirationMode] = useState<'1year' | '5months' | '10months' | 'custom'>('custom');

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

  const handleExpirationPresetChange = (mode: '1year' | '5months' | '10months') => {
    setExpirationMode(mode);
    const newDate = calculateExpirationDate(mode);
    setFormData((prev) => ({ ...prev, fechaExpiracion: newDate }));
  };

  const fetchCatalogs = async () => {
    try {
        const [r, m, n, e] = await Promise.all([
            regionService.getAll(),
            modalidadService.getAll(),
            nivelService.getAll(),
            especialidadesService.getAll()
        ]);
        setRegions(r);
        setModalidades(m);
        setNiveles(n);
        setEspecialidades(e);
    } catch (error) {
        console.error("Error fetching catalogs", error);
    }
  };

  useEffect(() => {
    // Reset expiration when modal opens if needed, or default to something?
    // For now, let's keep it clean or default to custom
  }, [isModalOpen]);

  useEffect(() => {
      fetchCatalogs();
  }, []);

  // Cascading Logic
  useEffect(() => {
      if (formData.modalidadId) {
          const filtered = niveles.filter(n => {
             if (Array.isArray(n.modalidadIds)) return n.modalidadIds.includes(Number(formData.modalidadId));
             return n.modalidadId === Number(formData.modalidadId) || n.modalidadIds === Number(formData.modalidadId);
          });
          setFilteredNiveles(filtered);
      } else {
          setFilteredNiveles([]);
      }
  }, [formData.modalidadId, niveles]);

  useEffect(() => {
      if (formData.nivelId) {
          const filtered = especialidades.filter(e => {
             if (Array.isArray(e.nivelId)) return e.nivelId.includes(Number(formData.nivelId));
             return e.nivelId === Number(formData.nivelId);
          });
          setFilteredEspecialidades(filtered);
      } else {
          setFilteredEspecialidades([]);
      }
  }, [formData.nivelId, especialidades]);

  const handleEdit = async (docenteId: number) => {
    try {
      const user = await userService.getById(docenteId);
      setEditingUser(docenteId);
      setFormData({
        nombreCompleto: user.nombreCompleto,
        email: user.email,
        password: '', // Don't populate password
        role: 'Premium',
        celular: user.celular,
        estado: user.estado || 'Activo',
        ie: user.ie || '',
        observaciones: user.observaciones || '',
        tiempo: user.tiempo || 0,
        regionId: user.regionId,
        modalidadId: user.modalidadId,
        nivelId: user.nivelId,
        especialidadId: user.especialidadId,
        fechaExpiracion: user.fechaExpiracion
      });
      // Set expiration mode based on date? Or just Custom?
      setExpirationMode('custom');
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching user details", error);
      alert("Error al cargar datos del docente");
    }
  };

  const resetForm = () => {
    setEditingUser(null);
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
    });
    setExpirationMode('custom');
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          // Construct payload manually to ensure all fields are present and correct types
          const payload: any = {
              nombreCompleto: formData.nombreCompleto,
              email: formData.email,
              role: 'Premium',
              celular: formData.celular,
              estado: formData.estado,
              ie: formData.ie,
              observaciones: formData.observaciones,
              tiempo: Number(formData.tiempo),
              regionId: Number(formData.regionId),
              modalidadId: Number(formData.modalidadId),
              nivelId: Number(formData.nivelId),
              especialidadId: Number(formData.especialidadId),
              fechaExpiracion: formData.fechaExpiracion
          };

          // Only add password if it's set (for updates) or required (for create)
          if (formData.password) {
            payload.password = formData.password;
          }

          if (editingUser) {
             await userService.update(editingUser, payload);
          } else {
             if (!formData.password) {
               alert("La contraseña es obligatoria para nuevos usuarios");
               return;
             }
             payload.password = formData.password; // Ensure it's there for create
             await userService.create(payload);
          }
          
          setIsModalOpen(false);
          resetForm();
          fetchDocentes(); // Refresh list
      } catch (error) {
          console.error("Error saving docente", error);
          alert("Error al guardar docente");
      }
  };

  
  const fetchDocentes = async () => {
      setLoading(true);
      try {
          const users = await userService.getAll();
          // Filter by role 'Premium'
          const premiumUsers = users.filter(u => u.role === 'Premium');
          
          // Map to Docente interface
          const mappedDocentes: Docente[] = premiumUsers.map(u => {
              const expirationDate = u.fechaExpiracion ? new Date(u.fechaExpiracion) : null;
              let estado: Docente['estado'] = 'Sin Estado';

              if (expirationDate) {
                  const now = new Date();
                  const diffTime = expirationDate.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  if (diffDays < 0) {
                      estado = 'Expirado';
                  } else if (diffDays <= 7) {
                      estado = 'Por vencer';
                  } else {
                      estado = 'Activo';
                  }
              } else {
                  estado = 'Expirado'; // Default to expired if no date
              }

              return {
                  id: u.id,
                  nombre: u.nombreCompleto,
                  email: u.email,
                  telefono: u.celular || '-',
                  modalidad: u.modalidad?.nombre || '-',
                  nivel: u.nivel?.nombre || '-',
                  estado: estado,
                  fechaExpiracion: u.fechaExpiracion || '-',
                  avatarUrl: ''
              };
          });
          
          setDocentes(mappedDocentes);
      } catch (error) {
          console.error("Error fetching docentes:", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchDocentes();
  }, []);
  
  const handleExportExcel = async () => {
    try {
      const allUsers = await userService.getAll();
      const premiumUsers = allUsers.filter(u => u.role === 'Premium');
      
      const dataToExport = premiumUsers.map(u => {
        // Calculate status same as in list
        const expirationDate = u.fechaExpiracion ? new Date(u.fechaExpiracion) : null;
        let estado = 'Sin Estado';
        if (expirationDate) {
            const now = new Date();
            const diffTime = expirationDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 0) estado = 'Expirado';
            else if (diffDays <= 7) estado = 'Por vencer';
            else estado = 'Activo';
        } else {
            estado = 'Expirado';
        }

        return {
          'ID': u.id,
          'Nombre Completo': u.nombreCompleto,
          'Teléfono': u.celular || '-',
          'Email': u.email,
          'Estado': estado,
          'Fecha Registro': u.fechaCreacion || u.fecha_creacion ? new Date(u.fechaCreacion || u.fecha_creacion!).toLocaleDateString() : '-',
          'Suscripciones Activas': u.modalidad?.nombre ? `${u.modalidad.nombre}: ${u.fechaExpiracion ? new Date(u.fechaExpiracion).toLocaleDateString() : '-'}` : 'Todas expiradas',
          'Modalidades': u.modalidad?.nombre || '-',
          'Niveles': u.nivel?.nombre || '-',
          'Especialidades': u.especialidad?.nombre || '-',
          'Región': u.region?.nombre || '-',
          'IE': u.ie || '-',
          'Observaciones': u.observaciones || '-'
        };
      });

      const today = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
      exportToExcel(dataToExport, `Reporte_Docentes_${today}`, 'Docentes');
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error al exportar a Excel");
    }
  };
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Filtering logic for the search bar and dropdown
  const filteredDocentes = docentes.filter(d => {
      const matchesSearch = d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            d.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterOption ? d.estado.toLowerCase() === filterOption.toLowerCase() : true;
      
      return matchesSearch && matchesFilter;
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDocentes.slice(indexOfFirstItem, indexOfLastItem);
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
    activos: docentes.filter(d => d.estado === 'Activo').length,
    porVencer: docentes.filter(d => d.estado === 'Por vencer').length,
    expirados: docentes.filter(d => d.estado === 'Expirado').length,
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Activo': return 'bg-green-100 text-green-800';
          case 'Por vencer': return 'bg-yellow-100 text-yellow-800';
          case 'Expirado': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  };

  return (
    <AdminLayout>
      {/* Header Banner */}
      <div className="bg-primary text-white p-6 rounded-t-lg mb-6 flex justify-center items-center">
        <h1 className="text-2xl font-bold">Administrar docentes</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        {/* Controls Row */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center">
            <div className="flex gap-4 w-full md:w-auto flex-1">
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
                <div className="relative w-48">
                     <select
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={filterOption}
                        onChange={(e) => setFilterOption(e.target.value)}
                     >
                        <option value="">Seleccionar opción</option>
                        <option value="activo">Activos</option>
                        <option value="por_vencer">Por vencer</option>
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
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Agregar docente
                </button>
            </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg border-2 border-blue-100 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-1 bg-blue-600 mb-2 rounded-full"></div>
                <div className="text-gray-500 text-sm font-medium">Total docentes</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
            </div>
            <div className="bg-white p-6 rounded-lg border-2 border-green-100 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-1 bg-green-500 mb-2 rounded-full"></div>
                <div className="text-gray-500 text-sm font-medium">Activos</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{stats.activos}</div>
            </div>
             <div className="bg-white p-6 rounded-lg border-2 border-yellow-100 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-1 bg-yellow-500 mb-2 rounded-full"></div>
                <div className="text-gray-500 text-sm font-medium">Por vencer</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{stats.porVencer}</div>
            </div>
             <div className="bg-white p-6 rounded-lg border-2 border-red-100 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-1 bg-red-500 mb-2 rounded-full"></div>
                <div className="text-gray-500 text-sm font-medium">Expirados</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{stats.expirados}</div>
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50/50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider font-bold">
                            Nombre
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider font-bold">
                            Contacto
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider font-bold">
                            Modalidad/Nivel
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider font-bold">
                            Estado
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider font-bold">
                            Expiración
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider font-bold">
                            Tiempo Restante
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-900 uppercase tracking-wider font-bold">
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr>
                           <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                               Cargando docentes...
                           </td>
                       </tr>
                    ) : filteredDocentes.length === 0 ? (
                         <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
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
                                        <div className="text-sm font-medium text-gray-900">{docente.nombre}</div>
                                    </div>
                                </div>
                            </td>
                            {/* ... remaining columns same ... */}
                             <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{docente.email}</div>
                                <div className="text-sm text-gray-500">{docente.telefono}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{docente.modalidad}</div>
                                <div className="text-sm text-gray-500">{docente.nivel}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(docente.estado)}`}>
                                    {docente.estado}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {docente.fechaExpiracion !== '-' ? (
                                    <span className="font-medium text-gray-900">
                                        {new Date(docente.fechaExpiracion).toLocaleDateString()}
                                    </span>
                                ) : (
                                    '-'
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {docente.fechaExpiracion !== '-' ? (
                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                        new Date(docente.fechaExpiracion) < new Date() 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {(() => {
                                            const expirationDate = new Date(docente.fechaExpiracion);
                                            const now = new Date();
                                            const diffTime = expirationDate.getTime() - now.getTime();
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                            
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
                                        onClick={() => handleEdit(docente.id)}
                                        className="text-blue-600 hover:text-blue-900"
                                     >
                                        <PencilIcon className="w-5 h-5"/>
                                    </button>
                                    <button className="text-red-600 hover:text-red-900">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>

        {/* Pagination */}
        <div className="py-4 flex items-center justify-center space-x-4 border-t border-gray-200 mt-4">
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

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-lg my-8">
            <div className="flex items-center justify-between rounded-t border-b p-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingUser ? 'Editar Docente' : 'Agregar Nuevo Docente'}
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
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre y Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombreCompleto}
                    onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                    required
                  />
                </div>

                {/* Password y Celular */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                      required={!editingUser}
                      placeholder={editingUser ? "Dejar en blanco para mantener actual" : ""}
                    />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Celular
                  </label>
                  <input
                    type="text"
                    value={formData.celular}
                    onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                  />
                </div>

                {/* IE y Estado */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                        Institución Educativa (IE)
                    </label>
                    <input
                        type="text"
                        value={formData.ie}
                        onChange={(e) => setFormData({ ...formData, ie: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                    />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                        Estado
                    </label>
                    <select
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                    >
                        <option value="Activo">Activo</option>
                        <option value="Por vencer">Por vencer</option>
                        <option value="Expirado">Expirado</option>
                    </select>
                </div>

                {/* Expiration Date Section */}
                <div className="col-span-1 md:col-span-2 rounded-lg border border-gray-200 p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-medium text-gray-900">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-500"
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
                      <div className="flex items-center rounded border border-gray-200 pl-4 py-2 hover:bg-gray-50">
                        <input
                          id="exp-1year"
                          type="radio"
                          name="expiration-preset"
                          checked={expirationMode === '1year'}
                          onChange={() => handleExpirationPresetChange('1year')}
                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor="exp-1year"
                          className="ml-2 w-full cursor-pointer text-sm font-medium text-gray-900"
                        >
                          1 año desde hoy
                        </label>
                      </div>
                      <div className="flex items-center rounded border border-gray-200 pl-4 py-2 hover:bg-gray-50">
                        <input
                          id="exp-5months"
                          type="radio"
                          name="expiration-preset"
                          checked={expirationMode === '5months'}
                          onChange={() => handleExpirationPresetChange('5months')}
                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor="exp-5months"
                          className="ml-2 w-full cursor-pointer text-sm font-medium text-gray-900"
                        >
                          5 meses desde hoy
                        </label>
                      </div>
                      <div className="flex items-center rounded border border-gray-200 pl-4 py-2 hover:bg-gray-50">
                        <input
                          id="exp-10months"
                          type="radio"
                          name="expiration-preset"
                          checked={expirationMode === '10months'}
                          onChange={() => handleExpirationPresetChange('10months')}
                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor="exp-10months"
                          className="ml-2 w-full cursor-pointer text-sm font-medium text-gray-900"
                        >
                          10 meses desde hoy
                        </label>
                      </div>
                      <div className="flex items-center rounded border border-gray-200 pl-4 py-2 hover:bg-gray-50">
                        <input
                          id="exp-custom"
                          type="radio"
                          name="expiration-preset"
                          checked={expirationMode === 'custom'}
                          onChange={() => setExpirationMode('custom')}
                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor="exp-custom"
                          className="ml-2 w-full cursor-pointer text-sm font-medium text-gray-900"
                        >
                          Elegir fecha específica
                        </label>
                      </div>
                    </div>
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

                {/* Tiempo y Observable (Full width or split?) Split looks good */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                        Tiempo (días/meses?)
                    </label>
                    <input
                        type="number"
                        value={formData.tiempo}
                        onChange={(e) => setFormData({ ...formData, tiempo: Number(e.target.value) })}
                        placeholder="0"
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                    />
                </div>
                <div>
                     <label className="mb-2 block text-sm font-medium text-gray-900">
                        Observaciones
                    </label>
                    <input
                        type="text"
                        value={formData.observaciones}
                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                    />
                </div>
                
                {/* Academic Structure Cascading Selects */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Región
                  </label>
                  <select
                    value={formData.regionId ?? 0}
                    onChange={(e) => setFormData({ ...formData, regionId: Number(e.target.value) })}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                  >
                    <option value={0}>Seleccionar Región</option>
                    {regions.map((r) => (
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
                    onChange={(e) => setFormData({ 
                        ...formData, 
                        modalidadId: Number(e.target.value),
                        nivelId: 0, 
                        especialidadId: 0 
                    })}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                  >
                    <option value={0}>Seleccionar Modalidad</option>
                    {modalidades.map((m) => (
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
                    onChange={(e) => setFormData({ 
                        ...formData, 
                        nivelId: Number(e.target.value),
                        especialidadId: 0
                    })}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                    disabled={!formData.modalidadId}
                  >
                    <option value={0}>Seleccionar Nivel</option>
                    {filteredNiveles.map((n) => (
                      <option key={n.id} value={n.id}>{n.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Especialidad
                  </label>
                  <select
                    value={formData.especialidadId ?? 0}
                    onChange={(e) => setFormData({ ...formData, especialidadId: Number(e.target.value) })}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                    disabled={!formData.nivelId}
                  >
                    <option value={0}>Seleccionar Especialidad</option>
                    {filteredEspecialidades.map((e) => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Submit Action */}
                <div className="col-span-1 md:col-span-2 mt-4">
                    <button
                    type="submit"
                    className="w-full rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-blue-300"
                    >
                    Guardar Docente
                    </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminPremiumDocentes;
