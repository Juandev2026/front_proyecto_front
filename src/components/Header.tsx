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
  const { navigation, company, callToAction } = config;
  const { name: companyName, logo } = company;

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
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`text-base font-medium transition-colors hover:text-primary ${
                      router.pathname === item.href
                        ? 'text-primary'
                        : 'text-gray-500'
                    }`}
                  >
                    {item.name}
                  </a>
                </Link>
              ))}
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
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
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                      {item.name}
                    </a>
                  </Link>
                ))}
              </div>

              
              {!isAuthenticated ? null : (
                <div className="mt-6 px-5 space-y-4">
                  <div className="text-center font-medium text-gray-900 border-b border-gray-100 pb-2">
                    Hola, {user?.name?.split(' ')[0]}
                  </div>
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
