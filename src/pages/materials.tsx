import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import About from '../components/About';
import FadeIn from '../components/FadeIn';
import Footer from '../components/Footer';
import Header from '../components/Header';
import AdSidebar from '../components/AdSidebar';
import { useAuth } from '../hooks/useAuth';
import { categoriaService, Categoria } from '../services/categoriaService';
import { materialService, Material } from '../services/materialService';
import { nivelService, Nivel } from '../services/nivelService';
import { ArrowLeftIcon } from '@heroicons/react/outline';

const ITEMS_PER_PAGE = 6;

const Materials = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  
  // New States for Level Selection
  const [selectedLevel, setSelectedLevel] = useState<Nivel | null>(null);
  const [showLevelSelection, setShowLevelSelection] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [cats, nivs] = await Promise.all([
          categoriaService.getAll(),
          nivelService.getAll(),
        ]);
        setCategories(cats);
        setNiveles(nivs);
        
        // If user has a level assigned, we might want to auto-select it or just show all
        // But the requirement is to show selection cards first usually. 
        // If user is logged in restricted to a level, maybe pre-select? 
        // For now, let's stick to the explicit selection for "browse by level" flow.
        
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('No se pudieron cargar los datos iniciales.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Fetch materials when selectedLevel changes
  useEffect(() => {
      const fetchMaterials = async () => {
          if (selectedLevel) {
              setLoadingData(true);
              try {
                  const data = await materialService.getByNivel(selectedLevel.id);
                  setMaterials(data);
              } catch (err) {
                  console.error("Error fetching materials for level", err);
                  setMaterials([]);
              } finally {
                  setLoadingData(false);
              }
          } else if (!showLevelSelection) {
             // Fetch all if not showing level selection (e.g. "Ver todos")
              setLoadingData(true);
              try {
                  const data = await materialService.getAll();
                  setMaterials(data);
              } catch (err) {
                 setMaterials([]);
              } finally {
                  setLoadingData(false);
              }
          }
      };
      
      // Only fetch if we are not in selection mode OR if we have a selected level
      if (selectedLevel || !showLevelSelection) {
          fetchMaterials();
      }
  }, [selectedLevel, showLevelSelection]);


  // Filter items based on search and category (and level is handled by fetch)
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
      // Show limit for non-authenticated, or just show all? The original code logic:
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
  
  const handleLevelSelect = (level: Nivel) => {
      setSelectedLevel(level);
      setShowLevelSelection(false);
      setCurrentPage(1);
  };
  
  const handleBackToLevels = () => {
      setSelectedLevel(null);
      setShowLevelSelection(true);
      setMaterials([]); // Clear materials while navigating back
      setSearchQuery('');
      setSelectedCategory('all');
  };

  const handleViewAll = () => {
      setSelectedLevel(null);
      setShowLevelSelection(false); // Disable level selection to show ALL
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
              <span className="text-primary">Recursos</span>
            </h1>
            <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
              Accede a nuestra biblioteca exclusiva de recursos educativos.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-9">
            
            {/* Level Selection View */}
            {showLevelSelection && !selectedLevel ? (
                <div>
                     <div className="flex justify-center mb-8">
                        <button
                          onClick={handleViewAll}
                          className="text-primary hover:text-blue-700 font-medium underline underline-offset-4"
                        >
                          O ver todos los recursos disponibles
                        </button>
                     </div>
                    
                    {loadingData ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {niveles.map((level, index) => (
                                <FadeIn key={level.id} direction="up" delay={index * 0.1}>
                                    <button
                                        onClick={() => handleLevelSelect(level)}
                                        className="w-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group text-left border border-gray-100 flex flex-col h-64"
                                    >
                                        <div className="h-2 bg-gradient-to-r from-blue-400 to-indigo-500 group-hover:h-3 transition-all duration-300"></div>
                                        <div className="p-8 flex flex-col justify-between h-full bg-gradient-to-br from-white to-blue-50/30">
                                            <div>
                                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                                                    Nivel
                                                </span>
                                                <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors">
                                                    {level.nombre}
                                                </h3>
                                                <p className="text-gray-500 text-sm">
                                                    Explora recursos educativos para {level.nombre}.
                                                </p>
                                            </div>
                                            <div className="flex items-center text-primary font-bold mt-4 group-hover:translate-x-2 transition-transform duration-300">
                                                Ver Recursos 
                                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                            </div>
                                        </div>
                                    </button>
                                </FadeIn>
                            ))}
                             {niveles.length === 0 && (
                                <div className="col-span-full text-center py-12 text-gray-500">
                                    No hay niveles disponibles.
                                </div>
                             )}
                        </div>
                    )}
                </div>
            ) : (
                /* Materials List View */
                <div>
                     {/* Controls Section */}
                    <div className="mb-8 space-y-6">
                         <div className="flex items-center justify-between">
                            <button 
                                onClick={handleBackToLevels}
                                className="flex items-center text-gray-600 hover:text-primary transition-colors font-medium"
                            >
                                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                                Volver a Selección de Niveles
                            </button>
                             {selectedLevel && (
                                <span className="text-lg font-bold text-gray-800 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                                    Nivel: <span className="text-primary">{selectedLevel.nombre}</span>
                                </span>
                            )}
                         </div>

                        {/* Search Bar */}
                        <div className="max-w-xl mx-auto">
                            <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar recursos..."
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
                                No se encontraron recursos que coincidan con tu búsqueda.
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
                                    {item.precio && item.precio > 0 ? (
                                        <span className="text-primary font-bold">S/ {item.precio.toFixed(2)}</span>
                                    ) : (
                                        <span className="text-green-600 font-bold">Gratis</span>
                                    )}
                                    </span>
                                    {item.precio && item.precio > 0 ? (
                                    <a
                                        href={`https://wa.me/${item.telefono || ''}?text=${encodeURIComponent(
                                        `Hola, estoy interesado en adquirir el material: ${item.titulo}`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded-full font-bold text-sm transition-colors"
                                    >
                                        Comprar
                                        <svg
                                            className="w-4 h-4 ml-1"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                        </svg>
                                    </a>
                                    ) : (
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
                                    )}
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
          </div>
          
          <div className="col-span-12 lg:col-span-3">
             <AdSidebar />
          </div>
        </div>
      </main>

      <About />
      <Footer />
    </div>
  );
};

export default Materials;
