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
  title?: string;
  breadcrumb?: string;
}

const PremiumLayout: React.FC<PremiumLayoutProps> = ({ children, title = 'Dashboard', breadcrumb = 'Pages / Dashboard' }) => {
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
    <div className="min-h-screen bg-[#F4F7FE] flex font-sans">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white text-gray-700 transition-transform duration-300 ease-in-out transform border-r border-gray-100 shadow-sm
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:inset-auto md:flex md:flex-col
      `}>
        {/* Logo Area */}
        <div className="flex items-center justify-center h-24 px-6 border-b border-gray-50 mb-4">
           <Link href="/">
             <a className="flex items-center gap-2 group">
                <span className="text-2xl font-extrabold text-[#2B3674] tracking-tight">AVENDOCENTE</span>
             </a>
           </Link>
           <button 
             className="md:hidden ml-auto text-gray-400 hover:text-gray-600"
             onClick={() => setSidebarOpen(false)}
           >
             <XIcon className="h-6 w-6" />
           </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
             const isActive = router.pathname === item.href;
             return (
              <Link key={item.name} href={item.href}>
                <a 
                  className={`
                    group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-[#3B82F6] text-white shadow-blue-200 shadow-lg' 
                      : 'text-[#A3AED0] hover:bg-gray-50 hover:text-[#2B3674]'}
                  `}
                >
                  <item.icon 
                    className={`
                      mr-4 h-5 w-5 flex-shrink-0 transition-colors
                      ${isActive ? 'text-white' : 'text-[#A3AED0] group-hover:text-[#2B3674]'}
                    `} 
                  />
                  {item.name}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 mt-auto border-t border-gray-50 space-y-2 mb-4">
           <Link href="/">
             <a className="group flex items-center px-4 py-3 text-sm font-semibold text-[#A3AED0] rounded-xl hover:bg-gray-50 hover:text-[#2B3674] transition-colors">
               <HomeIcon className="mr-4 h-5 w-5 text-[#A3AED0] group-hover:text-[#2B3674]" />
               Volver a Inicio
             </a>
           </Link>
           <button 
             onClick={handleLogout}
             className="w-full group flex items-center px-4 py-3 text-sm font-semibold text-red-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
           >
             <LogoutIcon className="mr-4 h-5 w-5 text-red-400 group-hover:text-red-500" />
             Cerrar Sesión
           </button>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F4F7FE]">
        
        {/* Top Header (Desktop & Mobile) */}
        <header className="bg-white/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 py-4 shadow-sm md:shadow-none md:bg-transparent">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                  <MenuIcon className="h-6 w-6" />
              </button>
              
              {/* Breadcrumb / Page Title Placeholder */}
              <div className="hidden md:block">
                 <p className="text-sm text-[#707EAE] font-medium">{breadcrumb}</p>
                 <h1 className="text-2xl font-bold text-[#2B3674] mt-1">{title}</h1>
              </div>
           </div>

           {/* Right Side: Profile & Actions */}
           <div className="flex items-center gap-4 bg-white p-2 rounded-full shadow-sm">
              <div className="hidden md:flex flex-col items-end mr-2">
                 <span className="text-sm font-bold text-[#2B3674] leading-tight">{user?.name || 'Usuario'}</span>
                 <span className="text-[10px] text-gray-400 font-semibold tracking-wide">PREMIUM</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold shadow-md cursor-pointer hover:bg-blue-700 transition-colors">
                 {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
           </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto focus:outline-none p-4 md:p-8">
            {children}
        </main>
      </div>
    </div>
  );
};

export default PremiumLayout;
