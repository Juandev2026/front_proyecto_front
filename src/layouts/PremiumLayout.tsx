import React, { useState, useEffect } from 'react';

import {
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  MenuIcon,
  XIcon,
  LogoutIcon,
  ClipboardListIcon,
  ExclamationCircleIcon,
  CollectionIcon,
  ArchiveIcon,
  FolderIcon,
  LockClosedIcon,
  ChipIcon,
  ViewBoardsIcon,
  UserIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useAuth } from '../hooks/useAuth';

interface PremiumLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumb?: string;
}

const PremiumLayout: React.FC<PremiumLayoutProps> = ({
  children,
  title = 'Dashboard',
  breadcrumb = 'Pages / Dashboard',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  // State for sidebar collapse
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Redirection logic for non-premium users
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        const role = user?.role?.toUpperCase();
        if (role !== 'PREMIUM' && role !== 'ADMIN' && role !== 'SUBADMIN') {
          router.push('/');
        }
      }
    }
  }, [loading, isAuthenticated, user, router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('fullName');
    localStorage.removeItem('userId');
    localStorage.removeItem('nivelId');
    localStorage.removeItem('role');
    localStorage.removeItem('accesoNombres');
    window.location.href = '/login';
  };

  // State for expanded menu items
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const toggleSubMenu = (name: string) => {
    setExpandedMenu(expandedMenu === name ? null : name);
  };

  // Auto-expand menu based on active route
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child: any) => child.href === router.pathname
        );
        if (hasActiveChild) {
          setExpandedMenu(item.name);
        }
      }
    });
  }, [router.pathname]);

  const allMenuItems = [
    {
      name: 'Nombramiento',
      href: '/bancoPreguntas',
      icon: AcademicCapIcon,
      children: [
        {
          name: 'Banco de Preguntas',
          href: '/bancoPreguntas',
          icon: CollectionIcon,
        },
        {
          name: 'Banco de Preguntas ED',
          href: '/bancoPreguntasEd?context=nombramiento',
          icon: CollectionIcon,
        },
        {
          name: 'Simulacro de Examen',
          href: '/simulacroExamen',
          icon: ClipboardListIcon,
        },
        {
          name: 'Respuestas Erróneas',
          href: '/respuestasErroneas',
          icon: ExclamationCircleIcon,
        },
        { name: 'Recursos', href: '/recursos', icon: ArchiveIcon },
      ],
    },
    {
      name: 'Ascenso',
      href: '#',
      icon: ChartBarIcon,
      current: false,
      children: [
        {
          name: 'Banco de Preguntas',
          href: '/bancoPreguntasAscenso',
          icon: CollectionIcon,
        },
        {
          name: 'Banco de Preguntas ED',
          href: '/bancoPreguntasEd?context=ascenso',
          icon: CollectionIcon,
        },
        {
          name: 'Simulacro de Examen',
          href: '/simulacroExamenAscenso',
          icon: ClipboardListIcon,
        },
        {
          name: 'Respuestas Erróneas',
          href: '/respuestasErroneasAscenso',
          icon: ExclamationCircleIcon,
        },
        { name: 'Recursos', href: '/recursosAscenso', icon: ArchiveIcon },
      ],
    },
    {
      name: 'Directivos',
      href: '#',
      icon: UserGroupIcon,
      current: false,
      children: [
        {
          name: 'Exámenes MINEDU y Simulacros',
          href: '/examenesDirectivos',
          icon: FolderIcon,
        },
      ],
    },
    {
      name: 'Próximamente',
      href: '#',
      icon: HomeIcon,
      current: false,
      children: [
        { name: 'IA para maestros', href: '#', icon: ChipIcon, locked: true },
        {
          name: 'Generador de prompt',
          href: '#',
          icon: ViewBoardsIcon,
          locked: true,
        },
        { name: 'Comunidad VIP', href: '#', icon: UserIcon, locked: true },
      ],
    },
  ];

  const menuItems = React.useMemo(() => {
    if (!user?.accesoNombres || user.accesoNombres.length === 0)
      return allMenuItems;

    return allMenuItems.filter((item) => {
      // "Próximamente" is always visible
      if (item.name === 'Próximamente') return true;

      // Check if item name (e.g. "Nombramiento") is in user.accesoNombres
      // We use case-insensitive matching and handle "Directivo" vs "Directivos"
      return user.accesoNombres!.some((access) => {
        const normalizedAccess = access.toLowerCase().trim();
        const normalizedItemName = item.name.toLowerCase().trim();

        // Match exact or contains (for cases like "Directivo" matching "Directivos")
        return (
          normalizedItemName.includes(normalizedAccess) ||
          normalizedAccess.includes(normalizedItemName)
        );
      });
    });
  }, [user?.accesoNombres]);

  return (
    <div className="h-screen bg-[#F4F7FE] flex font-sans overflow-hidden">
      {loading && (
        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Verificando acceso...</p>
          </div>
        </div>
      )}
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 bg-white text-gray-700 transition-all duration-300 ease-in-out transform border-r border-gray-100 shadow-sm
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        ${isCollapsed ? 'w-20' : 'w-72'}
        md:translate-x-0 md:static md:inset-auto md:flex md:flex-col
      `}
      >
        {/* Logo Area */}
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } h-40 px-6 border-b border-gray-50 mb-4 transition-all duration-300`}
        >
          {!isCollapsed && (
            <Link href="/">
              <a className="flex items-center gap-2 group">
                <img
                  src="/assets/images/logo_principal1.png"
                  alt="Avendo"
                  className="h-32 w-auto object-contain"
                />
              </a>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:block text-gray-400 hover:text-[#4790FD] transition-colors focus:outline-none"
          >
            {isCollapsed ? (
              <ChevronDoubleRightIcon className="h-6 w-6" />
            ) : (
              <ChevronDoubleLeftIcon className="h-6 w-6" />
            )}
          </button>
          <button
            className="md:hidden text-gray-400 hover:text-gray-600"
            onClick={() => setSidebarOpen(false)}
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => {
            const isActive = router.pathname === item.href;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenu === item.name;

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <button
                    onClick={() => {
                      if (isCollapsed) setIsCollapsed(false);
                      toggleSubMenu(item.name);
                    }}
                    className={`
                      w-full group flex items-center justify-between px-3 py-3 text-sm font-semibold rounded-xl transition-all duration-200
                      ${
                        isExpanded
                          ? 'bg-[#4790FD] text-white shadow-[#4790FD]/30 shadow-lg'
                          : 'text-[#A3AED0] hover:bg-gray-50 hover:text-[#4790FD]'
                      }
                    `}
                    title={isCollapsed ? item.name : ''}
                  >
                    <div
                      className={`flex items-center ${
                        isCollapsed ? 'justify-center w-full' : ''
                      }`}
                    >
                      <item.icon
                        className={`
                          h-6 w-6 flex-shrink-0 transition-colors
                          ${
                            isExpanded
                              ? 'text-white'
                              : 'text-[#A3AED0] group-hover:text-[#4790FD]'
                          }
                          ${!isCollapsed ? 'mr-4 h-5 w-5' : ''}
                        `}
                      />
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>
                    {/* Arrow Icon */}
                    {!isCollapsed && (
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </button>
                ) : (
                  <Link href={item.href}>
                    <a
                      className={`
                        group flex items-center px-3 py-3 text-sm font-semibold rounded-xl transition-all duration-200
                        ${
                          isActive
                            ? 'bg-[#4790FD] text-white shadow-[#4790FD]/30 shadow-lg'
                            : 'text-[#A3AED0] hover:bg-gray-50 hover:text-[#4790FD]'
                        }
                         ${isCollapsed ? 'justify-center' : ''} 
                      `}
                      title={isCollapsed ? item.name : ''}
                    >
                      <item.icon
                        className={`
                           flex-shrink-0 transition-colors
                          ${
                            isActive
                              ? 'text-white'
                              : 'text-[#A3AED0] group-hover:text-[#4790FD]'
                          }
                          ${!isCollapsed ? 'mr-4 h-5 w-5' : 'h-6 w-6'}
                        `}
                      />
                      {!isCollapsed && item.name}
                    </a>
                  </Link>
                )}

                {/* Sub-menu Items */}
                {hasChildren && isExpanded && !isCollapsed && (
                  <div className="mt-2 space-y-1 pl-4 pr-2">
                    {item.children.map((child: any) => {
                      const isChildActive = router.pathname === child.href;
                      return (
                        <Link key={child.name} href={child.href}>
                          <a
                            className={`
                              flex items-center justify-between px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200
                              ${
                                child.locked
                                  ? 'text-gray-400 cursor-not-allowed opacity-75'
                                  : isChildActive
                                  ? 'bg-blue-50 text-[#4790FD] shadow-sm'
                                  : 'text-[#A3AED0] hover:text-[#4790FD] hover:bg-gray-50'
                              }
                           `}
                          >
                            <div className="flex items-center">
                              {child.icon && (
                                <child.icon
                                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                                    isChildActive
                                      ? 'text-[#4790FD]'
                                      : 'text-[#A3AED0]'
                                  }`}
                                />
                              )}
                              {child.name}
                            </div>
                            {child.locked && (
                              <LockClosedIcon className="h-4 w-4 ml-2" />
                            )}
                          </a>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 mt-auto border-t border-gray-50 space-y-2 mb-4">
          {!isCollapsed ? (
            <>
              <Link href="/">
                <a className="group flex items-center px-4 py-3 text-sm font-semibold text-[#A3AED0] rounded-xl hover:bg-gray-50 hover:text-[#4790FD] transition-colors">
                  <HomeIcon className="mr-4 h-5 w-5 text-[#A3AED0] group-hover:text-[#4790FD]" />
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
            </>
          ) : (
            <div className="flex flex-col gap-2 items-center">
              <Link href="/">
                <a
                  className="p-2 rounded-xl text-[#A3AED0] hover:bg-gray-50 hover:text-[#4790FD]"
                  title="Volver a Inicio"
                >
                  <HomeIcon className="h-6 w-6" />
                </a>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600"
                title="Cerrar Sesión"
              >
                <LogoutIcon className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F4F7FE]">
        {/* Top Header (Desktop & Mobile) */}
        <header className="bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100 md:bg-transparent md:border-none md:shadow-none">
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
              <h1 className="text-2xl font-bold text-[#4790FD] mt-1">
                {title}
              </h1>
            </div>
          </div>

          {/* Right Side: Profile & Actions */}
          <div className="flex items-center gap-4 bg-white p-2 rounded-full shadow-sm">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-[#4790FD] leading-tight">
                {user?.name || 'Usuario'}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold tracking-wide">
                {user?.role?.toUpperCase()}
              </span>
            </div>
            <div className="h-10 w-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold shadow-md cursor-pointer hover:bg-[#3B82F6] transition-colors">
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
