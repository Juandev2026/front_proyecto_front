import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  HomeIcon, 
  AcademicCapIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  MenuIcon, 
  XIcon, 
  LogoutIcon 
} from '@heroicons/react/outline';
import { useAuth } from '../hooks/useAuth';

interface PremiumLayoutProps {
  children: React.ReactNode;
}

const PremiumLayout: React.FC<PremiumLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('fullName');
    localStorage.removeItem('userId');
    localStorage.removeItem('nivelId');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  const menuItems = [
    { name: 'Nombramiento', href: '/premium', icon: AcademicCapIcon },
    { name: 'Ascenso', href: '#', icon: ChartBarIcon, current: false },
    { name: 'Directivos', href: '#', icon: UserGroupIcon, current: false },
    { name: 'Próximamente', href: '#', icon:  HomeIcon, current: false }, // Placeholder icon
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0a192f] text-white transition-transform duration-300 ease-in-out transform 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:inset-auto md:flex md:flex-col
      `}>
        {/* Logo Area */}
        <div className="flex items-center justify-between h-16 px-4 bg-[#0a192f] border-b border-gray-700">
           <div className="flex items-center gap-2">
              <AcademicCapIcon className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold tracking-wider">AVENDOCENTE</span>
           </div>
           <button 
             className="md:hidden text-gray-300 hover:text-white"
             onClick={() => setSidebarOpen(false)}
           >
             <XIcon className="h-6 w-6" />
           </button>
        </div>

        {/* User Info (Mini) */}
        <div className="px-4 py-4 border-b border-gray-700 bg-[#0d213a]">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-lg font-bold">
               {user?.name?.charAt(0).toUpperCase() || 'U'}
             </div>
             <div>
                <p className="text-sm font-medium text-white truncate w-40">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-blue-300">Premium</p>
             </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <a 
                className={`
                  group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors
                  ${router.pathname === item.href 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-[#112240] hover:text-white'}
                `}
              >
                <item.icon 
                  className={`
                    mr-3 h-5 w-5 flex-shrink-0 
                    ${router.pathname === item.href ? 'text-white' : 'text-gray-400 group-hover:text-white'}
                  `} 
                />
                {item.name}
              </a>
            </Link>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-700 space-y-2">
           <Link href="/">
             <a className="group flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-[#112240] hover:text-white transition-colors">
               <HomeIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white" />
               Volver a Inicio
             </a>
           </Link>
           <button 
             onClick={handleLogout}
             className="w-full group flex items-center px-3 py-2 text-sm font-medium text-red-400 rounded-md hover:bg-red-900/20 hover:text-red-300 transition-colors"
           >
             <LogoutIcon className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-300" />
             Cerrar Sesión
           </button>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between bg-[#0a192f] text-white p-4 shadow-md">
           <button 
             onClick={() => setSidebarOpen(true)}
             className="text-gray-300 hover:text-white focus:outline-none"
           >
              <MenuIcon className="h-6 w-6" />
           </button>
           <span className="font-bold text-lg">AVENDOCENTE</span>
           <div className="w-6" /> {/* Spacer for centering */}
        </div>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
               {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PremiumLayout;
