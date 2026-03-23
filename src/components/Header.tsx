import React, { Fragment } from 'react';

import { Popover, Transition } from '@headlessui/react';
import { MenuIcon, XIcon } from '@heroicons/react/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';

import LogoutModal from './LogoutModal';
import config from '../config/index.json';
import { useAuth } from '../hooks/useAuth';

const Menu = () => {
  const router = useRouter();
  const { isAuthenticated, user, loading, logout } = useAuth();
  const { navigation, company } = config;
  const { name: companyName } = company;
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  return (
    <>
      <Popover className="bg-white/90 backdrop-filter backdrop-blur-md shadow-sm sticky top-0 z-50 transition-all duration-300 border-b border-gray-100">
        <div className="relative px-4 sm:px-6 lg:px-8">
          {/* Top Row: Logo, Product Buttons, Auth */}
          <div className="flex md:grid md:grid-cols-3 items-center justify-between py-1 md:py-2 border-b border-gray-50">
            <div className="flex items-center flex-shrink-0 lg:flex-grow-0 justify-self-start">
              <div className="flex items-center justify-between w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <div className="-mr-2 flex items-center md:hidden gap-2">
                    <Popover.Button
                      className={`bg-background rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary`}
                    >
                      <span className="sr-only">Open main menu</span>
                      <MenuIcon className="h-8 w-8" aria-hidden="true" />
                    </Popover.Button>
                    <Link href="/">
                      <a className="block">
                        <img
                          src="/assets/images/logo_principal1.png"
                          alt="logo"
                          className="h-14 sm:h-20 w-auto"
                        />
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
              <Link href="/">
                <a className="hidden md:block">
                  <span className="sr-only">{companyName}</span>
                  <img
                    alt="logo"
                    className="h-20 sm:h-24 lg:h-32 w-auto"
                    src="/assets/images/logo_principal1.png"
                  />
                </a>
              </Link>
            </div>

            {/* Center Column: Mobile Buttons / Desktop Buttons + Nav */}
            <div className="flex-grow flex flex-col items-center justify-center gap-2 justify-self-center">
              {/* Mobile: Product Buttons (ONLY MOBILE) */}
              <div className="flex md:hidden items-center justify-center gap-2 px-1">
                <Link
                  href={
                    isAuthenticated &&
                    (user?.role?.toUpperCase() === 'PREMIUM' ||
                      user?.role?.toUpperCase() === 'ADMIN' ||
                      user?.role?.toUpperCase() === 'SUBADMIN' ||
                      user?.role?.toUpperCase() === 'INVITADO' ||
                      user?.role?.toUpperCase() === 'PRUEBA_GRATIS_7' ||
                      user?.role?.toUpperCase() === 'PRUEBA_GRATIS_15')
                      ? '/avendescala/bancoPreguntas'
                      : '/planes?showVideo=true'
                  }
                >
                  <a className="bg-[#4a90f9] !text-white hover:text-white active:text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-[10px] sm:text-xs font-extrabold shadow-md hover:bg-blue-600 transition-all active:scale-110 whitespace-nowrap">
                    AVEND ESCALA
                  </a>
                </Link>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block z-[60]">
                  <div className="bg-gray-900 text-white text-[10px] lg:text-xs py-1.5 px-3 rounded shadow-xl whitespace-nowrap border border-gray-700">
                    {isAuthenticated &&
                    (user?.role?.toUpperCase() === 'PREMIUM' ||
                      user?.role?.toUpperCase() === 'ADMIN' ||
                      user?.role?.toUpperCase() === 'SUBADMIN' ||
                      user?.role?.toUpperCase() === 'INVITADO' ||
                      user?.role?.toUpperCase() === 'PRUEBA_GRATIS_7' ||
                      user?.role?.toUpperCase() === 'PRUEBA_GRATIS_15')
                      ? '👉 Acceder al AVEND ESCALA'
                      : '👉 Practica con simulacros y preguntas tipo examen MINEDU'}
                  </div>
                </div>
              </div>

              {/* Desktop Row 1: Product Buttons */}
              <div className="hidden md:flex items-center justify-center gap-4 lg:gap-8">
                {/* AVEND ESCALA */}
                <div className="relative group">
                  <Link
                    href={
                      isAuthenticated &&
                      (user?.role?.toUpperCase() === 'PREMIUM' ||
                        user?.role?.toUpperCase() === 'ADMIN' ||
                        user?.role?.toUpperCase() === 'SUBADMIN' ||
                        user?.role?.toUpperCase() === 'INVITADO' ||
                        user?.role?.toUpperCase() === 'PRUEBA_GRATIS_7' ||
                        user?.role?.toUpperCase() === 'PRUEBA_GRATIS_15')
                        ? '/avendescala/bancoPreguntas'
                        : '/planes?showVideo=true'
                    }
                  >
                    <a className="bg-[#4a90f9] !text-white hover:text-white active:text-white px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg text-xs lg:text-base font-extrabold shadow-lg hover:bg-blue-600 transition-all hover:scale-110 hover:shadow-xl active:scale-105 whitespace-nowrap inline-flex items-center justify-center min-w-[120px] lg:min-w-[160px]">
                      AVEND ESCALA
                    </a>
                  </Link>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block z-[60]">
                    <div className="bg-gray-900 text-white text-[10px] lg:text-xs py-1.5 px-3 rounded shadow-xl whitespace-nowrap border border-gray-700">
                      {isAuthenticated &&
                      (user?.role?.toUpperCase() === 'PREMIUM' ||
                        user?.role?.toUpperCase() === 'ADMIN' ||
                        user?.role?.toUpperCase() === 'SUBADMIN' ||
                        user?.role?.toUpperCase() === 'INVITADO' ||
                        user?.role?.toUpperCase() === 'PRUEBA_GRATIS_7' ||
                        user?.role?.toUpperCase() === 'PRUEBA_GRATIS_15')
                        ? '👉 Acceder al AVEND ESCALA'
                        : '👉 Practica con simulacros y preguntas tipo examen MINEDU'}
                    </div>
                  </div>
                </div>

                {/* AVEND PLANIFICA */}
                <div className="relative group">
                  <div className="bg-purple-600 !text-white hover:text-white active:text-white px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg text-xs lg:text-base font-extrabold shadow-lg hover:bg-purple-700 transition-all hover:scale-110 hover:shadow-xl active:scale-105 cursor-default whitespace-nowrap inline-flex items-center justify-center min-w-[120px] lg:min-w-[160px]">
                    AVEND PLANIFICA
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block z-[60]">
                    <div className="bg-gray-900 text-white text-[10px] lg:text-xs py-1.5 px-3 rounded shadow-xl whitespace-nowrap border border-gray-700">
                      👉 &quot;Muy pronto: planifica con IA&quot;
                    </div>
                  </div>
                </div>

                {/* AVEND IUS */}
                <div className="relative group">
                  <div className="bg-[#004c7a] !text-white hover:text-white active:text-white px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg text-xs lg:text-base font-extrabold shadow-lg hover:bg-[#003d62] transition-all hover:scale-110 hover:shadow-xl active:scale-105 cursor-default whitespace-nowrap inline-flex items-center justify-center min-w-[120px] lg:min-w-[160px]">
                    AVEND IUS
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block z-[60]">
                    <div className="bg-gray-900 text-white text-[10px] lg:text-xs py-1.5 px-3 rounded shadow-xl whitespace-nowrap border border-gray-700">
                      👉 &quot;Muy pronto: normas, procesos y defensa
                      docente&quot;
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Auth Buttons (Desktop & Mobile Greeting) */}
            <div className="flex items-center justify-end space-x-2 md:space-x-4 justify-self-end">
              {isAuthenticated ? (
                <div className="flex items-center space-x-2 md:space-x-4">
                  <div className="hidden md:block">
                    {!loading &&
                      (user?.role?.toUpperCase() === 'ADMIN' ||
                        user?.role?.toUpperCase() === 'SUBADMIN') && (
                        <Link href="/admin">
                          <a className="text-xs lg:text-sm font-bold bg-gray-800 !text-white hover:text-white active:text-white px-2 lg:px-3 py-1.5 lg:py-2 rounded-full hover:bg-gray-900 transition-all active:scale-110 shadow-md whitespace-nowrap">
                            Panel Admin
                          </a>
                        </Link>
                      )}
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="flex flex-col items-end min-w-0">
                      <span className="hidden lg:block text-gray-700 font-bold md:font-semibold text-sm md:text-base lg:text-lg truncate max-w-[100px] lg:max-w-none">
                        <span className="hidden md:inline">Hola, </span>
                        {
                          (
                            user?.fullName ||
                            (user as any)?.nombreCompleto ||
                            user?.email ||
                            'Usuario'
                          ).split(' ')[0]
                        }
                      </span>
                      <button
                        onClick={handleLogout}
                        className="hidden md:block text-[11px] md:text-xs text-red-500 hover:text-red-700 font-bold"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                    <div className="h-9 w-9 md:h-12 md:w-12 rounded-full bg-[#4a90f9] text-white flex items-center justify-center font-bold text-base md:text-xl shadow-md">
                      {(
                        user?.fullName ||
                        (user as any)?.nombreCompleto ||
                        user?.email ||
                        'U'
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2 md:space-x-4">
                  <Link href="/login">
                    <a className="text-xs md:text-sm font-bold text-gray-700 hover:text-primary transition-all active:scale-110 whitespace-nowrap">
                      Iniciar Sesión
                    </a>
                  </Link>
                  <Link href="/register">
                    <a className="inline-flex items-center justify-center px-4 md:px-6 py-2 border border-transparent rounded-full shadow-md text-xs md:text-sm font-bold !text-white hover:text-white active:text-white bg-primary hover:bg-blue-600 transition-all transform active:scale-110 whitespace-nowrap">
                      Regístrese
                    </a>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Navigation Links */}
          <nav
            className="hidden md:flex items-center justify-center py-2 space-x-6 lg:space-x-10"
            aria-label="Global"
          >
            {navigation.map((item: any) => {
              if (item.dropdown && item.dropdown.length > 0) {
                return (
                  <Popover key={item.name} className="relative">
                    {({ open }) => (
                      <>
                        <Popover.Button
                          className={`text-base lg:text-xl font-extrabold transition-colors hover:text-primary focus:outline-none flex items-center gap-1 ${
                            router.pathname === item.href ||
                            router.pathname.startsWith(item.href)
                              ? 'text-primary'
                              : 'text-gray-500'
                          }`}
                        >
                          {item.name}
                          <svg
                            className={`w-3 h-3 transition-transform ${
                              open ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </Popover.Button>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-200"
                          enterFrom="opacity-0 translate-y-1"
                          enterTo="opacity-100 translate-y-0"
                          leave="transition ease-in duration-150"
                          leaveFrom="opacity-100 translate-y-0"
                          leaveTo="opacity-0 translate-y-1"
                        >
                          <Popover.Panel className="absolute z-50 left-1/2 transform -translate-x-1/2 mt-2 px-2 w-screen max-w-[200px] sm:px-0">
                            <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
                              <div className="relative bg-white py-1">
                                {item.dropdown.map((subItem: any) => (
                                  <Link key={subItem.name} href={subItem.href}>
                                    <a className="block px-4 py-2 text-sm lg:text-base font-bold text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors">
                                      {subItem.name}
                                    </a>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </Popover.Panel>
                        </Transition>
                      </>
                    )}
                  </Popover>
                );
              }

              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`text-base lg:text-xl font-extrabold transition-colors hover:text-primary whitespace-nowrap ${
                      router.pathname === item.href
                        ? 'text-primary'
                        : 'text-gray-500'
                    }`}
                  >
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile menu */}
        <Transition
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="duration-100 ease-in"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Popover.Panel
            focus
            className="absolute z-50 top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden"
          >
            <div
              className={`rounded-lg shadow-md bg-background ring-1 ring-black ring-opacity-5 overflow-hidden pb-4`}
            >
              <div className="px-5 pt-4 flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src="/assets/images/logo_principal1.png"
                    alt="logo"
                    className="h-24 w-auto"
                  />
                </div>
                <div className="-mr-2">
                  <Popover.Button
                    className={`bg-background rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary`}
                  >
                    <span className="sr-only">Close main menu</span>
                    <XIcon className="h-6 w-6" aria-hidden="true" />
                  </Popover.Button>
                </div>
              </div>
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item: any) => {
                  if (item.dropdown && item.dropdown.length > 0) {
                    return (
                      <div key={item.name}>
                        <Link href={item.href}>
                          <a className="block px-3 py-1.5 rounded-md text-sm font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                            {item.name}
                          </a>
                        </Link>
                        <div className="pl-4 space-y-1">
                          {item.dropdown.map((subItem: any) => (
                            <Link key={subItem.name} href={subItem.href}>
                              <a className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                                → {subItem.name}
                              </a>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link key={item.name} href={item.href}>
                      <a className="block px-3 py-1.5 rounded-md text-sm font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                        {item.name}
                      </a>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-2 px-5 pb-4 space-y-3">
                {/* Greeting if Authenticated */}
                {isAuthenticated && (
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="font-bold text-gray-800 text-lg">
                      Hola,{' '}
                      {
                        (
                          user?.fullName ||
                          (user as any)?.nombreCompleto ||
                          user?.email ||
                          'Usuario'
                        ).split(' ')[0]
                      }
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 shadow-sm active:bg-red-100"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}

                {/* Vertical Product Buttons */}
                <div className="flex flex-col gap-2">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    PRONTO
                  </div>
                  <div className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-center font-extrabold shadow-md text-xs cursor-default">
                    AVEND PLANIFICA
                  </div>
                  <div className="bg-[#004c7a] text-white px-5 py-2.5 rounded-xl text-center font-extrabold shadow-md text-xs cursor-default">
                    AVEND IUS
                  </div>
                </div>

                {/* Linea Separadora Visible */}
                {!isAuthenticated && (
                  <>
                    <div className="py-2">
                      <div className="border-t-2 border-gray-200 shadow-sm"></div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Link href="/login">
                        <a className="block w-full px-5 py-3.5 text-center font-extrabold !text-white hover:text-white bg-primary hover:bg-blue-600 rounded-xl transition-all shadow-md text-sm active:scale-110">
                          INICIAR SESIÓN
                        </a>
                      </Link>
                      <Link href="/register">
                        <a className="block w-full px-5 py-3.5 text-center font-extrabold !text-white hover:text-white bg-gray-600 hover:bg-gray-700 rounded-xl transition-all shadow-md text-sm active:scale-110">
                          REGÍSTRESE
                        </a>
                      </Link>
                    </div>
                  </>
                )}

                {isAuthenticated && (
                  <div className="space-y-3">
                    {!loading &&
                      (user?.role?.toUpperCase() === 'ADMIN' ||
                        user?.role?.toUpperCase() === 'SUBADMIN') && (
                        <Link href="/admin">
                          <a className="block w-full px-5 py-2.5 text-center font-bold !text-white hover:text-white bg-gray-800 hover:bg-gray-900 rounded-xl transition-all shadow-md text-sm active:scale-110">
                            Panel Admin
                          </a>
                        </Link>
                      )}
                  </div>
                )}
              </div>
            </div>
          </Popover.Panel>
        </Transition>
      </Popover>
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
};

export default Menu;
