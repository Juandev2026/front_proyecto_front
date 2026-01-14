import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';

import { EyeIcon } from '@heroicons/react/outline';
import { SearchIcon } from '@heroicons/react/solid';
import Head from 'next/head';
import Link from 'next/link';

import AdSidebar from '../components/AdSidebar';
import CommunitySection from '../components/CommunitySection';
import RelevantInfoCarousel from '../components/RelevantInfoCarousel';
import FadeIn from '../components/FadeIn';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuth } from '../hooks/useAuth';
import {
  categoriaSimpleService,
  CategoriaSimple,
} from '../services/categoriaSimpleService';
import { createSlug } from '../utils/urlUtils';
import { materialService, Material } from '../services/materialService';


const ITEMS_PER_PAGE = 9;

import AuthModal from '../components/AuthModal';

const Materials = () => {
  const router = useRouter();
  const { track } = useAnalytics();
  const { isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<CategoriaSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleCardClick = (material: Material) => {
    if ((material.precio && material.precio > 0) || isAuthenticated) {
       router.push(`/materials/${createSlug(material.titulo, material.id)}`);
    } else {
       setIsAuthModalOpen(true);
    }
  };
  // Removed viewingPdf state as it is no longer needed

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [mats, cats] = await Promise.all([
          materialService.getAll(),
          categoriaSimpleService.getAll(),
        ]);
        // Filter by state "PUBLICADO"
        const publishedMats = mats.filter(
          (m) => m.estado?.nombre?.toUpperCase() === 'PUBLICADO'
        );
        // Sort by ID desc (assuming newer first) since we don't have date
        setMaterials(publishedMats.sort((a, b) => b.id - a.id));
        setCategories(cats);
      } catch (err) {
        // console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryName = (id: number) => {
    const category = categories.find((c) => c.id === id);
    return category ? category.nombre : 'General';
  };

  const getFileFormat = (url: string) => {
    if (!url) return 'FILE';
    const extension = url.split('.').pop()?.toUpperCase();
    return extension && extension.length <= 4 ? extension : 'FILE';
  };

  // Helper to strip HTML tags for preview
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    
    // Track search event
    if (query.trim()) {
      track('busqueda', {
        termino_busqueda: query.trim(),
        cantidad_resultados: filteredItems.length,
      });
    }
  };

  const handleMaterialDownload = (material: Material) => {
    track('descargar_material', {
      id_material: String(material.id),
      nombre_material: material.titulo,
      tipo_archivo: getFileFormat(material.url).toLowerCase(),
    });
  };

  const filteredItems = useMemo(() => {
    let items = materials;

    if (selectedCategoryId) {
      items = items.filter((item) => item.categoriaId === selectedCategoryId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.titulo.toLowerCase().includes(query) ||
          stripHtml(item.descripcion).toLowerCase().includes(query)
      );
    }
    return items;
  }, [selectedCategoryId, searchQuery, materials]);

  const paginatedItems = useMemo(() => {
    const sorted = [...filteredItems]; // Already sorted by ID desc fetch
    return sorted.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  return (
    <div className="bg-white min-h-screen font-sans">
      <Head>
        <title>Centro de Recursos</title>
      </Head>

      <div className="relative bg-background">
        <div className="w-full">
          <Header />
        </div>
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-32 py-12">
        {/* Title Section */}
        <div className="text-center mb-10">
          <FadeIn direction="up">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Centro de <span className="text-primary">Recursos</span>
            </h1>
            <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
              Accede a nuestra biblioteca exclusiva de recursos educativos.
            </p>
          </FadeIn>
        </div>

        {/* Search Bar */}
        <div className="mb-10 max-w-3xl mx-auto">
          <div className="relative group">
            <input
              type="text"
              placeholder="Buscar recursos..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
            />
            <SearchIcon className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-primary" />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 border-b pb-8">
          <button
            onClick={() => {
              setSelectedCategoryId(null);
              setCurrentPage(1);
            }}
            className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
              selectedCategoryId === null
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategoryId(cat.id);
                setCurrentPage(1);
              }}
              className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                selectedCategoryId === cat.id
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Content (9 cols) */}
          <div className="col-span-12 lg:col-span-9">
            {loading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}

            {!loading && paginatedItems.length === 0 && (
              <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xl text-gray-500">
                  No se encontraron recursos.
                </p>
              </div>
            )}

            {!loading && paginatedItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedItems.map((item, index) => (
                  <FadeIn key={item.id} direction="up" delay={index * 0.05}>
                    <div 
                      onClick={() => handleCardClick(item)}
                      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group flex flex-col h-full relative cursor-pointer"
                    >
                      {/* Decorative Header - mimicking an image since we don't have one */}
                      {/* Content Preview Header - Show imageUrl as thumbnail */}
                      <div className="h-56 relative bg-gray-100 overflow-hidden group-hover:opacity-90 transition-opacity">
                        {(() => {
                          // Priority: imageUrl > url (if image) > placeholder
                          const thumbnailImage = item.imageUrl || 
                            (item.url && /\.(jpeg|jpg|gif|png|webp)$/i.test(item.url) ? item.url : null);
                          
                          if (thumbnailImage) {
                            return (
                              <img
                                src={thumbnailImage}
                                alt={item.titulo}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // If image fails to load, hide it
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            );
                          } else {
                            // Placeholder for resources without images
                            return (
                              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center relative p-4">
                                {/* Center Icon */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                                  <svg
                                    className="w-20 h-20 text-primary"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                                  </svg>
                                </div>
                              </div>
                            );
                          }
                        })()}

                        {/* Badges Overlay */}
                        <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none z-20">
                          <span className="bg-white/90 backdrop-blur text-primary text-xs px-2 py-1 rounded font-bold uppercase shadow-sm border border-white/50">
                            {getCategoryName(item.categoriaId)}
                          </span>
                          <span className="bg-white/80 backdrop-blur text-gray-700 text-xs px-2 py-1 rounded font-bold uppercase shadow-sm border border-gray-200">
                            {getFileFormat(item.url)}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 flex-grow flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {stripHtml(item.titulo)}
                        </h3>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                          {stripHtml(item.descripcion)}
                        </p>

                        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                          <div className="flex flex-col">
                            {item.precio && item.precio > 0 ? (
                              <span className="text-primary font-bold text-lg">
                                S/ {item.precio.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-green-600 font-bold text-lg">
                                Gratis
                              </span>
                            )}
                          </div>

                          {item.precio && item.precio > 0 ? (
                              <span className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center shadow-sm hover:shadow-md cursor-pointer">
                                Comprar
                              </span>
                          ) : isAuthenticated ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCardClick(item); }}
                                className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center shadow-sm hover:shadow-md"
                              >
                                <EyeIcon className="w-4 h-4 mr-1.5" />
                                Ver
                              </button>
                          ) : (
                             <button 
                               onClick={(e) => { e.stopPropagation(); setIsAuthModalOpen(true); }}
                               className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors flex items-center shadow-sm hover:shadow-md whitespace-nowrap"
                             >
                               <EyeIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                               <span className="hidden sm:inline">Ingresa para ver</span>
                               <span className="sm:hidden">Ingresar</span>
                             </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            )}
            
            <AuthModal 
              isOpen={isAuthModalOpen} 
              onClose={() => setIsAuthModalOpen(false)} 
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-gray-600 font-medium flex items-center">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>

          {/* Sidebar (3 cols) */}
          <div className="col-span-12 lg:col-span-3 space-y-8">
            <AdSidebar />

            {/* CTA Box (Optional, similar to News login prompt if we want, or just generic info) */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 text-center">
              <h3 className="text-lg font-bold text-primary mb-2">
                ¿Buscas algo más?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Explora nuestras otras secciones o contáctanos si necesitas
                material específico.
              </p>
            </div>
          </div>
        </div>
      </main>

      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-32 pb-12 mt-16">
        <CommunitySection />
        <div className="mt-16">
          <RelevantInfoCarousel />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Materials;
