import React, { useState, useEffect, useRef } from 'react';

import {
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  MenuIcon,
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
  BellIcon,
} from '@heroicons/react/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useAuth } from '../hooks/useAuth';
import { examenService } from '../services/examenService';
import LogoutModal from '../components/LogoutModal';
import ExitModal from '../components/ExitModal';

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
  const sidebarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();

  // State for sidebar collapse
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // State for ED availability
  const [availableEdContexts, setAvailableEdContexts] = useState<{
    nombramiento: boolean;
    ascenso: boolean;
  }>({
    nombramiento: false,
    ascenso: false,
  });

  const daysRemaining = React.useMemo(() => {
    if (!user?.fechaExpiracion) return null;
    try {
      // Expecting ISO or standard date format from backend
      const expDate = new Date(user.fechaExpiracion);
      if (isNaN(expDate.getTime())) return null;
      
      const today = new Date();
      // Set both to midnight to compare just days
      const d1 = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
      const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const diffTime = d1.getTime() - d2.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      return null;
    }
  }, [user?.fechaExpiracion]);

  // Redirection logic for non-premium users
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        const role = user?.role?.toUpperCase();
        if (role !== 'PREMIUM' && role !== 'ADMIN' && role !== 'SUBADMIN' && role !== 'INVITADO' && role !== 'PRUEBA_GRATIS_7' && role !== 'PRUEBA_GRATIS_15') {
          router.push('/');
        }
      }
    }
  }, [loading, isAuthenticated, user, router]);

  // Check ED availability
  useEffect(() => {
    // Check cache first
    const cached = localStorage.getItem('edAvailability');
    if (cached) {
      try {
        setAvailableEdContexts(JSON.parse(cached));
      } catch (e) {}
    }

    const fetchEdAvailability = async () => {
      if (isAuthenticated && user?.id) {
        try {
          // Use getPropiosByUser with the actual user ID for accurate per-user availability
          const [dataNombramiento, dataAscenso] = await Promise.all([
            examenService.getPropiosByUser(2, user.id).catch(() => []),
            examenService.getPropiosByUser(1, user.id).catch(() => []),
          ]);
          const newState = {
            nombramiento: Array.isArray(dataNombramiento) && dataNombramiento.length > 0,
            ascenso: Array.isArray(dataAscenso) && dataAscenso.length > 0,
          };
          setAvailableEdContexts(newState);
          localStorage.setItem('edAvailability', JSON.stringify(newState));
        } catch (error) {
          console.error('Error checking ED availability', error);
        }
      }
    };
    fetchEdAvailability();
  }, [isAuthenticated, user?.id]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  // Intercept back navigation 
  useEffect(() => {
    router.beforePopState(({ as }) => {
      // Determine if destination is outside the premium layout area
      const isPremiumPath = as.startsWith('/avendescala') || 
                            as.startsWith('/bancoPreguntas') ||
                            as.startsWith('/simulacroExamen') ||
                            as.startsWith('/respuestasErroneas') ||
                            as.startsWith('/recursos') ||
                            as.startsWith('/examen');
                            
      if (!isPremiumPath) {
        setShowExitModal(true);
        // Push state to prevent actual URL change in the browser bar
        window.history.pushState(null, '', router.asPath);
        return false;
      }
      return true;
    });

    return () => {
      router.beforePopState(() => true);
    };
  }, [router, router.asPath]);

  // State for expanded menu items
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const toggleSubMenu = (name: string) => {
    setExpandedMenu(expandedMenu === name ? null : name);
  };

  // Handle click outside to close/collapse sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // If clicking inside the sidebar, do nothing
      if (sidebarRef.current && sidebarRef.current.contains(target)) {
        return;
      }

      // Ignore if clicking on toggle buttons
      const desktopToggle = document.getElementById('sidebar-toggle-btn');
      const mobileToggle = document.getElementById('mobile-sidebar-toggle-btn');
      
      if (desktopToggle && desktopToggle.contains(target)) return;
      if (mobileToggle && mobileToggle.contains(target)) return;

      // Click is outside: close mobile sidebar, collapse desktop sidebar
      if (sidebarOpen) {
        setSidebarOpen(false);
      }
      if (!isCollapsed && window.innerWidth >= 768) {
        setIsCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [sidebarOpen, isCollapsed]);

  // Auto-expand menu based on active route
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child: any) => {
          // Normal matching
          if (child.href === router.pathname || child.href === router.asPath) return true;
          // Matching during an exam
          if (router.pathname === '/examen' && router.query.from === child.href) return true;
          return false;
        });

        if (hasActiveChild) {
          setExpandedMenu(item.name);
        }
      }
    });
  }, [router.pathname, router.asPath, router.query.from]);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [router.asPath]);

  const allMenuItems = [
    {
      name: 'Nombramiento',
      href: '/avendescala/bancoPreguntas',
      icon: AcademicCapIcon,
      children: [
        {
          name: 'Banco de Preguntas',
          href: '/avendescala/bancoPreguntas',
          icon: CollectionIcon,
        },
        {
          name: 'Banco de Preguntas Avend Escala',
          href: '/avendescala/bancoPreguntasEd?context=nombramiento',
          icon: CollectionIcon,
        },
        {
          name: 'Simulacro de Examen',
          href: '/avendescala/simulacroExamen',
          icon: ClipboardListIcon,
        },
        {
          name: 'Respuestas Erróneas',
          href: '/avendescala/respuestasErroneas',
          icon: ExclamationCircleIcon,
        },
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
          href: '/avendescala/bancoPreguntasAscenso',
          icon: CollectionIcon,
        },
        {
          name: 'Banco de Preguntas Avend Escala',
          href: '/avendescala/bancoPreguntasEd?context=ascenso',
          icon: CollectionIcon,
        },
        {
          name: 'Simulacro de Examen',
          href: '/avendescala/simulacroExamenAscenso',
          icon: ClipboardListIcon,
        },
        {
          name: 'Respuestas Erróneas',
          href: '/avendescala/respuestasErroneasAscenso',
          icon: ExclamationCircleIcon,
        },
        { name: 'Recursos', href: '/avendescala/recursosAscenso', icon: ArchiveIcon },
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
          href: '/avendescala/examenesDirectivos',
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
    // Helper to filter children based on availability
    // 'Banco de Preguntas' is always shown if the parent section is visible (access is controlled by accesoNombres)
    // 'Banco de Preguntas Avend Escala' is only shown if Avend Escala exams are available for that context
    const filterChildren = (items: any[], context: 'nombramiento' | 'ascenso') => {
      return items.filter(child => {
        if (child.name === 'Banco de Preguntas Avend Escala') {
          return availableEdContexts[context];
        }
        return true;
      });
    };

    const baseFiltered = !user?.accesoNombres || user.accesoNombres.length === 0
      ? allMenuItems
      : allMenuItems.filter((item) => {
          if (item.name === 'Próximamente') return true;
          return user.accesoNombres!.some((access) => {
            const normalizedAccess = access.toLowerCase().trim();
            const normalizedItemName = item.name.toLowerCase().trim();
            return (
              normalizedItemName.includes(normalizedAccess) ||
              normalizedAccess.includes(normalizedItemName)
            );
          });
        });

    // Second pass: filter child items specifically for ED and official exams
    return baseFiltered.map(item => {
      if (item.name === 'Nombramiento' && item.children) {
        return { ...item, children: filterChildren(item.children, 'nombramiento') };
      }
      if (item.name === 'Ascenso' && item.children) {
        return { ...item, children: filterChildren(item.children, 'ascenso') };
      }
      return item;
    });
  }, [user?.accesoNombres, availableEdContexts]);

  return (
    <div className="h-screen bg-[#F4F7FE] flex font-sans overflow-hidden">
      {loading && !user && (
        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#4790FD] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#707EAE] font-medium">Verificando acceso...</p>
          </div>
        </div>
      )}
      {/* Mobile sidebar backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-all duration-300 md:hidden cursor-pointer ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`
        fixed inset-y-0 left-0 z-40 flex flex-col bg-white text-gray-700 transition-all duration-300 ease-in-out transform border-r border-gray-100 shadow-sm
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        ${isCollapsed ? 'w-20' : 'w-72'}
        md:translate-x-0 md:static md:inset-auto md:flex md:flex-col
      `}
      >
        {/* Logo Area */}
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } h-24 md:h-48 px-6 mb-0 transition-all duration-300`}
        >
          {!isCollapsed && (
            <Link href="/premium">
              <a className="flex items-center gap-2 group">
                <img
                  src="/assets/images/avendEscala.jpeg"
                  alt="Avendo"
                  className="h-32 w-auto object-contain hidden md:block"
                />
                <img
                  src="/assets/images/avendEscala.jpeg"
                  alt="Avendo"
                  className="h-20 w-auto object-contain md:hidden"
                />
              </a>
            </Link>
          )}
          <button
            id="sidebar-toggle-btn"
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
            className="md:hidden text-gray-400 hover:text-[#4790FD] focus:outline-none"
            onClick={() => setSidebarOpen(false)}
          >
            <ChevronDoubleLeftIcon className="h-6 w-6" />
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
                          : 'text-gray-600 hover:bg-gray-50 hover:text-[#4790FD]'
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
                              : 'text-gray-600 group-hover:text-[#4790FD]'
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
                            ? 'bg-[#4790FD] text-white hover:text-white shadow-[#4790FD]/30 shadow-lg'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-[#4790FD]'
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
                              : 'text-gray-600 group-hover:text-[#4790FD]'
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
                        const isChildActive =
                          router.asPath === child.href ||
                          (router.pathname === '/examen' &&
                            router.query.from === child.href);

                        return (
                          <Link key={child.name} href={child.href}>
                            <a
                              className={`
                                flex items-center justify-between px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200
                                ${
                                  child.locked
                                    ? 'text-gray-400 cursor-not-allowed opacity-75'
                                    : isChildActive
                                    ? 'bg-[#4790FD] text-white hover:text-white shadow-md'
                                    : 'text-gray-600 hover:text-[#4790FD] hover:bg-gray-50'
                                }
                             `}
                            >
                            <div className="flex items-center">
                              {child.icon && (
                                <child.icon
                                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                                    isChildActive
                                      ? 'text-white'
                                      : 'text-gray-600'
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
        <div className="p-4 mt-auto border-t border-gray-50 space-y-2 mb-4">
          {!isCollapsed ? (
            <>
              <button
                onClick={() => setShowExitModal(true)}
                className="w-full group flex items-center px-4 py-3 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 hover:text-[#4790FD] transition-colors"
              >
                <HomeIcon className="mr-4 h-5 w-5 text-gray-600 group-hover:text-[#4790FD]" />
                Volver a Inicio
              </button>
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
              <button
                onClick={() => setShowExitModal(true)}
                className="p-2 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-[#4790FD]"
                title="Volver a Inicio"
              >
                <HomeIcon className="h-6 w-6" />
              </button>
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
              id="mobile-sidebar-toggle-btn"
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(true);
              }}
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

          <div className="md:hidden flex items-center justify-center">
            <Link href="/premium">
              <a className="block">
                <img 
                  src="/assets/images/avendEscala.jpeg" 
                  alt="Escala" 
                  className="h-20 w-auto object-contain"
                />
              </a>
            </Link>
          </div>

          {/* Right Side: Profile & Actions */}
          <div className="flex items-center gap-4 bg-white p-2 rounded-full shadow-sm">
            {daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0 && (
              <div className="flex items-center px-4 py-1.5 bg-red-50 border border-red-100 rounded-full animate-pulse shadow-sm mr-2 cursor-help" title="Tu suscripción premium está por vencer">
                <BellIcon className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-[11px] font-extrabold text-red-600 uppercase tracking-tight whitespace-nowrap">
                   {daysRemaining === 0 ? 'VENCE HOY' : `VENCE EN ${daysRemaining} DÍA${daysRemaining > 1 ? 'S' : ''}`}
                </span>
              </div>
            )}
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-[#4790FD] leading-tight">
                {user?.fullName || (user as any)?.nombreCompleto || user?.email || 'Usuario'}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold tracking-wide">
                {user?.role?.toUpperCase()}
              </span>
            </div>
            <div className="h-10 w-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold shadow-md cursor-pointer hover:bg-[#3B82F6] transition-colors">
              {(user?.fullName || (user as any)?.nombreCompleto || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Main Scrollable Content - Reduced padding to enlarge space for content */}
        <main className="flex-1 overflow-y-auto focus:outline-none p-0 md:p-2">
          {children}
        </main>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
      <ExitModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => {
          setShowExitModal(false);
          router.push('/');
        }}
      />
    </div>
  );
};

export default PremiumLayout;
