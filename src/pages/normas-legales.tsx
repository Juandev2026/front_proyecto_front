
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { normasLegalesService, NormaLegal } from '../services/normasLegalesService';
import { DocumentTextIcon, SearchIcon } from '@heroicons/react/outline';
import CommunitySection from '../components/CommunitySection';
import RelevantInfoCarousel from '../components/RelevantInfoCarousel';
import { useAuth } from '../hooks/useAuth';
import AuthModal from '../components/AuthModal';
import AdSidebar from '../components/AdSidebar';

const NormasLegalesPage = () => {
  const { isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [normas, setNormas] = useState<NormaLegal[]>([]);
  const [filteredNormas, setFilteredNormas] = useState<NormaLegal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNormas = async () => {
      try {
        const data = await normasLegalesService.getAll();
        // Sort by id descending (assuming newer IDs are newer norms) or creation date if available and reliable
        const sorted = data.sort((a, b) => b.id - a.id);
        setNormas(sorted);
        setFilteredNormas(sorted);
      } catch (error) {
        console.error('Error fetching normas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNormas();
  }, []);

  useEffect(() => {
    const results = normas.filter(
      (norma) =>
        norma.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        norma.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredNormas(results);
  }, [searchTerm, normas]);

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Normas Legales
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Consulta y descarga la normativa vigente del sector educación.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-10">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3"
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
             <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
             </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content - 3 columns */}
              <div className="lg:col-span-3">
                 <div className="grid gap-6 md:grid-cols-2">
                  {filteredNormas.map((norma) => (
                    <div
                      key={norma.id}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
                    >
                      <div className="flex-1">
                        {norma.imagenUrl ? (
                          <div className="h-48 w-full relative">
                            <img 
                              src={norma.imagenUrl} 
                              alt={norma.nombre}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-48 w-full bg-blue-100 flex items-center justify-center">
                             <DocumentTextIcon className="h-16 w-16 text-blue-600" />
                          </div>
                        )}
                        
                        <div className="p-6">
                           <h3 
                             className="text-lg font-bold text-gray-900 leading-tight mb-2"
                             dangerouslySetInnerHTML={{ __html: norma.nombre }}
                           />
                           <div 
                             className="text-gray-500 text-sm line-clamp-3 prose prose-sm max-w-none"
                             dangerouslySetInnerHTML={{ __html: norma.descripcion }}
                           />
                        </div>
                      </div>
                      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 mt-auto">
                        {isAuthenticated ? (
                          <a
                            href={norma.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                          >
                            <DocumentTextIcon className="h-4 w-4 mr-2" />
                            Ver Información
                          </a>
                        ) : (
                          <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                          >
                            <DocumentTextIcon className="h-4 w-4 mr-2" />
                            Ingresa para ver
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredNormas.length === 0 && (
                      <div className="col-span-full text-center py-12 text-gray-500">
                          No se encontraron resultados para "{searchTerm}"
                      </div>
                  )}
                 </div>
              </div>

              {/* Sidebar - 1 column */}
              <div className="lg:col-span-1">
                 <div className="sticky top-8">
                    <AdSidebar />
                 </div>
              </div>
            </div>
          )}

          <div className="mt-16">
            <CommunitySection />
            <div className="mt-16">
              <RelevantInfoCarousel />
            </div>
          </div>
          
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
          />
      </div>
      </div>
    </MainLayout>
  );
};

export default NormasLegalesPage;
