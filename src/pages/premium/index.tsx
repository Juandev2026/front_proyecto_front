import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon, DocumentTextIcon, FolderIcon } from '@heroicons/react/outline';

import PremiumLayout from '../../layouts/PremiumLayout';
import { useAuth } from '../../hooks/useAuth';

const exams = [
  { id: 1, title: 'MINEDU 2023 (1 examen)', items: ['Examen General'] },
  { id: 2, title: 'MINEDU 2025 (1 examen)', items: ['Examen Previo'] },
  { id: 3, title: 'MINEDU 2021 (1 examen)', items: ['Examen Nombramiento'] },
  { id: 4, title: 'MINEDU 2018 (2 exámenes)', items: ['Fase 1', 'Fase 2'] },
  { id: 5, title: 'MINEDU- 2016 DIRECTIVOS (1 examen)', items: ['Directivos'] },
  { id: 6, title: 'MINEDU 2016 - ESPECIALISTA (5 exámenes)', items: ['Esp. 1', 'Esp. 2', 'Esp. 3', 'Esp. 4', 'Esp. 5'] },
  { id: 7, title: 'MINEDU - 2014 (1 examen)', items: ['Examen'] },
];

const PremiumPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0a192f]"></div>
      </div>
    );
  }

  return (
    <PremiumLayout title="Banco de preguntas" breadcrumb="Pages / Banco de preguntas">
      <Head>
        <title>Aula Virtual - AVENDOCENTE</title>
      </Head>

      <div className="space-y-6">
        {/* Filters / Preferences Header */}
        <div className="text-center py-8">
           <h2 className="text-3xl md:text-4xl font-extrabold text-[#2B3674] mb-3">Selecciona tus preferencias</h2>
           <p className="text-[#A3AED0] text-lg font-medium">Selecciona el/los exámenes que deseas resolver ahora</p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4 w-full">
          {exams.map((exam) => (
            <Disclosure key={exam.id} as="div" className="border border-blue-200 rounded-lg bg-white shadow-sm overflow-hidden">
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex justify-between w-full px-4 py-4 text-sm font-medium text-left text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 transition-colors">
                    <div className="flex items-center gap-3">
                      <FolderIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-base font-semibold text-[#0a192f]">{exam.title}</span>
                    </div>
                    <ChevronDownIcon
                      className={`${open ? 'transform rotate-180' : ''} w-5 h-5 text-gray-500 transition-transform duration-200`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-4 pt-2 pb-4 text-sm text-gray-500 bg-gray-50 border-t border-gray-100">
                    <ul className="space-y-2 mt-2">
                      {exam.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                           <DocumentTextIcon className="w-4 h-4 text-blue-500" />
                           <span>{item}</span>
                           <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Disponible</span>
                        </li>
                      ))}
                    </ul>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          ))}
        </div>
      </div>
    </PremiumLayout>
  );
};

export default PremiumPage;
