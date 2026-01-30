import React, { useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { 
  SearchIcon, 
  PlusIcon, 
  DownloadIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  DotsVerticalIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/outline';

// Mock data type
interface Docente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  modalidad: string;
  nivel: string;
  estado: 'Activo' | 'Por vencer' | 'Expirado';
  fechaExpiracion: string;
  avatarUrl?: string;
}



const AdminPremiumDocentes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('');
  const [docentes, setDocentes] = useState<Docente[]>([]);
  
  // Status stats - Calculated from actual state
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
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <DownloadIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
                    Exportar excel
                </button>

                 {/* Add Button */}
                <button
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
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-900 uppercase tracking-wider font-bold">
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {docentes.length === 0 ? (
                         <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                No hay docentes registrados.
                            </td>
                        </tr>
                    ) : (
                        docentes.map((docente) => (
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
                                {docente.fechaExpiracion}
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <div className="flex justify-center space-x-2">
                                     <button className="text-blue-600 hover:text-blue-900">
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
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Anterior
            </button>
             <span className="text-sm text-gray-700">de</span>
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Siguiente
            </button>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminPremiumDocentes;
