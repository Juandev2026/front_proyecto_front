import React from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { UsersIcon, PlusIcon } from '@heroicons/react/outline';

const AdminPremiumDocentes = () => {
  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Docentes
        </h1>
        <button
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Docente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
        <div className="bg-blue-50 p-4 rounded-full mb-4">
            <UsersIcon className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Sección de Docentes</h3>
        <p className="text-gray-500 max-w-md">
            Aquí podrás gestionar la lista de docentes premium. Esta funcionalidad estará disponible pronto.
        </p>
      </div>
    </AdminLayout>
  );
};

export default AdminPremiumDocentes;
