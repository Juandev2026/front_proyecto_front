import React, { useState, useMemo, useEffect } from 'react';

import Link from 'next/link';

import About from '../components/About';
import FadeIn from '../components/FadeIn';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { categoriaService, Categoria } from '../services/categoriaService';
import { materialService, Material } from '../services/materialService';

const ITEMS_PER_PAGE = 6;

const Materials = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>(
    'all'
  );
  const [filterMode, setFilterMode] = useState<'all' | 'level'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        let mats;
        
        if (filterMode === 'level' && user?.nivelId) {
             mats = await materialService.getByNivel(user.nivelId);
        } else {
             mats = await materialService.getAll();
        }

        const [cats] = await Promise.all([
          categoriaService.getAll(),
        ]);
        setCategories(cats);
        setMaterials(mats);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(
          'No se pudieron cargar los materiales. Por favor intenta de nuevo más tarde.'
        );
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [filterMode, user?.nivelId]);

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    let items = materials;

    if (selectedCategory !== 'all') {
      items = items.filter((item) => item.categoriaId === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.titulo.toLowerCase().includes(query) ||
          item.descripcion.toLowerCase().includes(query)
      );
    }
    return items;
  }, [selectedCategory, searchQuery, materials]);

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    if (!isAuthenticated) {
      return filteredItems.slice(0, 3);
    }
    return filteredItems.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredItems, currentPage, isAuthenticated]);

  const handleCategoryChange = (categoryId: number | 'all') => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const getFileFormat = (url: string) => {
    if (!url) return 'FILE';
    const extension = url.split('.').pop()?.toUpperCase();
    return extension && extension.length <= 4 ? extension : 'FILE';
  };

  return (
    <div className="bg-background overflow-hidden min-h-screen flex flex-col">
      <div className="relative bg-background">
        <div className="max-w-7xl mx-auto">
          <Header />
        </div>
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Page Title */}
        <div className="text-center mb-12">
          <FadeIn direction="up">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              <span className="block xl:inline">Centro de</span>{' '}
              <span className="text-primary">Materiales</span>
            </h1>
            <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
              Accede a nuestra biblioteca exclusiva de recursos educativos.
            </p>
          </FadeIn>
        </div>

        {/* Controls Section */}
        <div className="mb-12 space-y-6">
            {isAuthenticated && user?.nivelId && (
              <div className="flex justify-center space-x-4">
                 <button
                  onClick={() => setFilterMode('all')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    filterMode === 'all'
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Ver todos los materiales
                </button>
                <button
                  onClick={() => setFilterMode('level')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    filterMode === 'level'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Ver materiales por mi nivel
                </button>
              </div>
            )}
          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar materiales..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-5 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm text-gray-700"
              />
              <div className="absolute right-4 top-3.5 text-gray-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        <div className="min-h-[400px]">
          {(() => {
            if (loadingData) {
              return (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              );
            }
            if (error) {
              return (
                <div className="text-center py-20">
                  <p className="text-xl text-red-500">{error}</p>
                </div>
              );
            }
            if (paginatedItems.length === 0) {
              return (
                <div className="text-center py-20">
                  <p className="text-xl text-gray-500">
                    No se encontraron materiales que coincidan con tu búsqueda.
                  </p>
                </div>
              );
            }
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedItems.map((item, index) => (
                  <FadeIn
                    key={`${item.id}-${index}`}
                    direction="up"
                    delay={index * 0.05}
                  >
                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group flex flex-col h-full">
                      <div className="p-6 flex-grow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-blue-50 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <svg
                              className="w-8 h-8"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase tracking-wide">
                            {getFileFormat(item.url)}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                          {item.titulo}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                          {item.descripcion}
                        </p>
                      </div>
                      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-sm text-gray-500 font-medium">
                          {/* Size not available in API */}
                        </span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary font-bold text-sm hover:text-secondary transition-colors"
                        >
                          Descargar
                          <svg
                            className="w-4 h-4 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Pagination Controls */}
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

        {/* Call to Action */}
        {isAuthenticated ? (
          <div className="mt-24 mb-12">
            <FadeIn direction="up">
              <div className="bg-primary rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-4">
                    ¿Necesitas algún material específico?
                  </h2>
                  <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                    Si no encuentras lo que buscas, escríbenos y haremos lo
                    posible por conseguirlo y compartirlo con la comunidad.
                  </p>
                  <button className="bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-lg">
                    Solicitar Material
                  </button>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                  <div className="absolute -top-24 -left-24 w-64 h-64 bg-white rounded-full mix-blend-overlay"></div>
                  <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white rounded-full mix-blend-overlay"></div>
                </div>
              </div>
            </FadeIn>
          </div>
        ) : (
          !authLoading && (
            <div className="mt-12 text-center">
              <div className="bg-blue-50 rounded-2xl p-8 md:p-12 shadow-lg border border-blue-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  ¿Quieres acceder a todos los materiales?
                </h3>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Regístrate ahora para descargar todos los recursos educativos
                  disponibles en nuestra plataforma.
                </p>
                <Link href="/register">
                  <a className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-secondary transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    Regístrate Gratis
                  </a>
                </Link>
                <p className="mt-4 text-sm text-gray-500">
                  ¿Ya tienes cuenta?{' '}
                  <Link href="/login">
                    <a className="text-primary font-medium hover:underline">
                      Inicia sesión aquí
                    </a>
                  </Link>
                </p>
              </div>
            </div>
          )
        )}
      </main>

      <About />
      <Footer />
    </div>
  );
};

export default Materials;
