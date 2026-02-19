import React, { Fragment } from 'react';

import { Popover, Transition } from '@headlessui/react';
import { MenuIcon, XIcon } from '@heroicons/react/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';

import config from '../config/index.json';
import { useAuth } from '../hooks/useAuth';


const Menu = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { navigation, company } = config;
  const { name: companyName } = company;

  return (
    <>
      <Popover className="bg-white/90 backdrop-filter backdrop-blur-md shadow-sm sticky top-0 z-50 transition-all duration-300 border-b border-gray-100">
        <div className="relative py-1 px-4 sm:px-6 lg:px-8">
          <nav
            className="relative flex items-center justify-between sm:h-auto"
            aria-label="Global"
          >
            <div className="flex items-center flex-grow flex-shrink-0 lg:flex-grow-0">
              <div className="flex items-center justify-between w-full md:w-auto">
                {/* Mobile: Hamburger + Logo on Left */}
                <div className="flex items-center gap-2">
                  <div className="-mr-2 flex items-center md:hidden">
                    <Popover.Button
                      className={`bg-background rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary`}
                    >
                      <span className="sr-only">Open main menu</span>
                      <MenuIcon className="h-9 w-9" aria-hidden="true" />
                    </Popover.Button>
                  </div>
                  <Link href="/">
                    <a>
                      <span className="sr-only">{companyName}</span>
                      <img alt="logo" className="h-20 sm:h-28 w-auto" src="/assets/images/logo_principal1.png" />
                    </a>
                  </Link>
                </div>

                {/* Mobile: Login / Register on Right (Only if NOT authenticated) */}
                <div className="flex md:hidden items-center gap-2 ml-auto">
                  {!isAuthenticated && (
                    <>
                      <Link href="/login">
                        <a className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md text-sm font-bold shadow-sm transition-colors whitespace-nowrap">
                          Login
                        </a>
                      </Link>
                      <Link href="/register">
                        <a className="text-white bg-gray-600 hover:bg-gray-700 px-3 py-1.5 rounded-md text-sm font-bold shadow-sm transition-colors whitespace-nowrap">
                          Register
                        </a>
                      </Link>
                    </>
                  )}
                  {/* If authenticated, show greeting */}
                  {isAuthenticated && (
                    <span className="text-gray-700 font-medium text-sm whitespace-nowrap">
                      Hola, {user?.name?.split(' ')[0]}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item: any) => {
                // Check if item has dropdown
                if (item.dropdown && item.dropdown.length > 0) {
                  return (
                    <Popover key={item.name} className="relative">
                      {({ open }) => (
                        <>
                          <Popover.Button
                            className={`text-base font-medium transition-colors hover:text-primary focus:outline-none ${router.pathname === item.href || router.pathname.startsWith(item.href)
                                ? 'text-primary'
                                : 'text-gray-500'
                              }`}
                          >
                            <span className="flex items-center gap-1">
                              {item.name}
                              <svg
                                className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </span>
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
                            <Popover.Panel className="absolute z-10 left-1/2 transform -translate-x-1/2 mt-3 px-2 w-screen max-w-xs sm:px-0">
                              <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
                                <div className="relative bg-white py-2">
                                  {item.dropdown.map((subItem: any) => (
                                    <Link key={subItem.name} href={subItem.href}>
                                      <a className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors">
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

                // Regular navigation item without dropdown
                return (
                  <Link key={item.name} href={item.href}>
                    <a
                      className={`text-base font-medium transition-colors hover:text-primary ${router.pathname === item.href
                          ? 'text-primary'
                          : 'text-gray-500'
                        }`}
                    >
                      {item.name}
                    </a>
                  </Link>
                );
              })}
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link href="/bancoPreguntas">
                    <a className="text-xs lg:text-sm font-bold bg-primary text-white px-2 lg:px-3 py-1.5 lg:py-2 rounded-full hover:bg-blue-700 transition-colors shadow-md whitespace-nowrap">
                      Aula Virtual
                    </a>
                  </Link>
                  {(user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'SUBADMIN') && (
                    <Link href="/admin">
                      <a className="text-xs lg:text-sm font-bold bg-gray-800 text-white px-2 lg:px-3 py-1.5 lg:py-2 rounded-full hover:bg-gray-900 transition-colors shadow-md whitespace-nowrap">
                        Panel Admin
                      </a>
                    </Link>
                  )}
                  <span className="text-gray-700 font-medium">
                    Hola, {user?.name?.split(' ')[0]}
                  </span>
                  <button
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('fullName');
                      window.location.reload();
                    }}
                    className="text-sm text-red-500 hover:text-red-700 font-medium"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href="/login">
                    <a className="text-base font-medium text-gray-500 hover:text-primary transition-colors">
                      Iniciar Sesión
                    </a>
                  </Link>
                  <Link href="/register">
                    <a className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-secondary transition-colors">
                      Registrarse
                    </a>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>

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
              className={`rounded-lg shadow-md bg-background ring-1 ring-black ring-opacity-5 overflow-hidden`}
            >
              <div className="px-5 pt-4 flex items-center justify-between">
                <div>
                  <Link href="/">
                    <a>
                      <img className="h-16 w-auto" src="/assets/images/logo_principal1.png" alt="logo" />
                    </a>
                  </Link>
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
                  // Check if item has dropdown
                  if (item.dropdown && item.dropdown.length > 0) {
                    return (
                      <div key={item.name}>
                        <Link href={item.href}>
                          <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
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

                  // Regular navigation item without dropdown
                  return (
                    <Link key={item.name} href={item.href}>
                      <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                        {item.name}
                      </a>
                    </Link>
                  );
                })}
              </div>


              {!isAuthenticated ? null : (
                <div className="mt-6 px-5 space-y-4">
                  <div className="text-center font-medium text-gray-900 border-b border-gray-100 pb-2">
                    Hola, {user?.name?.split(' ')[0]}
                  </div>
                  <Link href="/bancoPreguntas">
                    <a className="block w-full px-5 py-3 text-center font-bold text-white bg-primary hover:bg-blue-700 rounded-full transition-colors shadow-md">
                      Aula Virtual
                    </a>
                  </Link>
                  {(user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'SUBADMIN') && (
                    <Link href="/admin">
                      <a className="block w-full px-5 py-3 text-center font-bold text-white bg-gray-800 hover:bg-gray-900 rounded-full transition-colors shadow-md">
                        Panel Admin
                      </a>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('fullName');
                      window.location.reload();
                    }}
                    className="block w-full px-5 py-3 text-center font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
              <div className="mt-4 text-center"></div>
            </div>
          </Popover.Panel>
        </Transition>
      </Popover>
    </>
  );
};

export default Menu;
