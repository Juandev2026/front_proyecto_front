import React, { useEffect, useState } from 'react';

import { SearchIcon } from '@heroicons/react/solid';
import Head from 'next/head';
import Link from 'next/link';
import { createSlug } from '../utils/urlUtils';

import AdSidebar from '../components/AdSidebar';
import CommunitySection from '../components/CommunitySection';
import RelevantInfoCarousel from '../components/RelevantInfoCarousel';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import {
  categoriaGeneralService,
  CategoriaGeneral,
} from '../services/categoriaGeneralService';
import { noticiaService, Noticia } from '../services/noticiaService';

const News = () => {
  const { user, isAuthenticated } = useAuth();
  const [filterMode, setFilterMode] = useState<'all' | 'level'>('all');
  const [news, setNews] = useState<Noticia[]>([]);
  const [categories, setCategories] = useState<CategoriaGeneral[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let newsData: Noticia[] = [];
        if (filterMode === 'level' && user?.nivelId) {
          newsData = await noticiaService.getByNivel(user.nivelId);
        } else {
          newsData = await noticiaService.getAll();
        }

        const categoriesData = await categoriaGeneralService.getAll();
        
        // Filter by PUBLICADO
        const publishedNews = newsData.filter(
          (n) => n.estado?.nombre?.toUpperCase() === 'PUBLICADO'
        );

        setNews(publishedNews);
        setCategories(categoriesData);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    setCurrentPage(1); // Reset page on filter/fetch change
  }, [filterMode, user?.nivelId]);

  // Reset page when category or search changes
  useEffect(() => {
      setCurrentPage(1);
  }, [selectedCategoryId, searchTerm]);

  // Helper to strip HTML tags for preview and handle entities
  const stripHtml = (html: string) => {
    if (!html) return '';
    if (typeof window === 'undefined') return html; // SSR safety
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Filter logic
  const filteredNews = news.filter((item) => {
    const matchesCategory = selectedCategoryId
      ? item.categoriaId === selectedCategoryId
      : true;
    const matchesSearch =
      stripHtml(item.titulo).toLowerCase().includes(searchTerm.toLowerCase()) ||
      stripHtml(item.descripcion)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedNews = [...filteredNews].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  // Layout content separation
  const featuredArticle = sortedNews.length > 0 ? sortedNews[0] : null;
  const secondaryArticles = sortedNews.slice(1, 5); // Next 4 articles
  const otherNews = sortedNews.slice(5); // The rest

  // Destacados (Highlights)
  const highlights = news.filter((n) => n.esDestacado).slice(0, 5);
  const displayHighlights =
    highlights.length > 0 ? highlights : sortedNews.slice(0, 5);

  const getCategoryName = (id: number) => {
    const category = categories.find((c) => c.id === id);
    return category ? category.nombre : 'General';
  };
  
  // Pagination Helper Values
  const itemsPerPage = 5;
  const totalPages = Math.ceil(otherNews.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedItems = otherNews.slice(startIdx, endIdx);

  return (
    <div className="bg-white min-h-screen font-sans">
      <Head>
        <title>Portal de Noticias Educativas - MINEDU, Nombramiento, Ascenso</title>
        <meta name="description" content="Últimas noticias sobre educación en Perú: nombramiento docente, ascenso, contrato, MINEDU, sindicatos y tecnología educativa. Mantente informado con nuestro portal de noticias." />
        <meta name="keywords" content="noticias educación, MINEDU noticias, nombramiento docente 2024, ascenso docente, contrato docente, noticias SUTEP" />
      </Head>

      <div className="relative bg-background">
        <div className="w-full">
          <Header />
        </div>
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-32 py-8">
        {/* Restored Original Title Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Portal de <span className="text-primary">Noticias</span>
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Entérate de lo último en educación y tecnología.
          </p>
        </div>

        {isAuthenticated && user?.nivelId ? (
          <div className="flex justify-center space-x-4 mt-2 mb-8">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105 ${
                filterMode === 'all'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Ver todas
            </button>
            <button
              onClick={() => setFilterMode('level')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105 ${
                filterMode === 'level'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Ver noticias por mi nivel
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto mt-2 mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full text-primary">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <p className="text-sm text-blue-900">
                <span className="font-bold block text-base">
                  ¿Buscas contenido personalizado?
                </span>
                Inicia sesión para ver noticias exclusivas para tu nivel
                educativo.
              </p>
            </div>
            <Link href="/login">
              <a className="whitespace-nowrap px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-full hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">
                Iniciar Sesión
              </a>
            </Link>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-10 max-w-3xl mx-auto">
          <div className="relative group">
            <input
              type="text"
              placeholder="Buscar noticias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
            />
            <SearchIcon className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-primary" />
          </div>
        </div>

        {/* Categories (Pills) */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 border-b pb-8">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
              selectedCategoryId === null
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
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

        {/* Categories Fallback Visual (Hardcoded tags) only if no categories fetched approx */}
        {categories.length === 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10 border-b pb-8">
            {[
              'Docentes',
              'Auxiliares',
              'Nombramiento',
              'Ascenso',
              'Contrato',
              'Remuneración',
              'IA',
              'Tecnología',
              'Sindicato',
              'MINEDU',
            ].map((tag) => (
              <span
                key={tag}
                className="px-5 py-2 rounded-full text-sm font-semibold border border-gray-200 text-gray-500 bg-gray-50 cursor-pointer hover:bg-gray-100"
              >
                {tag}
              </span>
            ))}
          </div>
        )}



        <div className="grid grid-cols-12 gap-8">
          {/* LEFT COLUMN: Main Content */}
          <div className="col-span-12 lg:col-span-7 space-y-10">
            {isLoading ? (
              <div className="space-y-6">
                {/* Loading skeleton */}
                <div className="animate-pulse">
                  <div className="bg-gray-200 h-64 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ) : featuredArticle ? (
              <div className="group cursor-pointer">
                <Link href={`/news/${createSlug(featuredArticle.titulo)}`}>
                  <a>
                    <div className="relative overflow-hidden rounded-xl mb-4 aspect-video shadow-lg">
                      <img
                        src={
                          featuredArticle.imageUrl ||
                          'https://via.placeholder.com/800x450'
                        }
                        alt={stripHtml(featuredArticle.titulo)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex flex-col gap-1 mb-2">
                       <div className="flex items-center gap-2">
                          <span className="bg-primary text-white text-xs px-2 py-1 rounded font-bold uppercase">
                            {getCategoryName(featuredArticle.categoriaId)}
                          </span>
                          <span className="text-gray-500 text-xs font-semibold">
                            {new Date(featuredArticle.fecha).toLocaleDateString()}
                          </span>
                       </div>
                       {featuredArticle.autor && (
                          <span className="text-gray-500 text-xs font-medium">Por: {featuredArticle.autor}</span>
                       )}
                    </div>
                    <h2 
                      className="text-3xl font-bold text-gray-900 leading-tight mb-3 group-hover:text-primary transition-colors"
                      dangerouslySetInnerHTML={{ __html: featuredArticle.titulo }}
                    />
                    <div 
                      className="text-gray-600 leading-relaxed text-lg line-clamp-3 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: featuredArticle.descripcion }}
                    />
                  </a>
                </Link>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-lg">
                No hay noticias disponibles.
              </div>
            )}

            {/* Subgrid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8 pt-8 border-t border-gray-100">
              {secondaryArticles.map((item) => (
                <Link key={item.id} href={`/news/${createSlug(item.titulo)}`}>
                  <a className="group flex flex-col h-full">
                    <div className="relative overflow-hidden rounded-lg mb-3 aspect-[4/3] shadow-sm">
                      <img
                        src={
                          item.imageUrl || 'https://via.placeholder.com/400x300'
                        }
                        alt={stripHtml(item.titulo)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold text-primary uppercase mb-1 block">
                        {getCategoryName(item.categoriaId)}
                      </span>
                      <h3 
                        className="font-bold text-gray-900 leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: item.titulo }}
                      />
                      <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                        {item.autor && (
                           <span>Por: {item.autor}</span>
                        )}
                        <span>•</span>
                        <span>{new Date(item.fecha).toLocaleDateString()}</span>
                      </div>
                      <div 
                        className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: item.descripcion }}
                      />
                    </div>
                  </a>
                </Link>
              ))}
            </div>

            {/* List for remainder with PAGINATION */}
            {otherNews.length > 0 && (
              <div id="paginated-list-header" className="space-y-6 pt-8 border-t border-gray-100">
                {paginatedItems.map((item) => (
                  <Link key={item.id} href={`/news/${createSlug(item.titulo)}`}>
                    <a className="flex gap-4 group items-start p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="w-1/3 aspect-video relative overflow-hidden rounded-md shadow-sm">
                        <img
                          src={
                            item.imageUrl ||
                            'https://via.placeholder.com/200x112'
                          }
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>
                      <div className="w-2/3">
                        <h4 
                          className="font-bold text-gray-900 group-hover:text-primary mb-1 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: item.titulo }}
                        />
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                           {item.autor && (
                              <span className="mr-2">Por: {item.autor}</span>
                           )}
                           <span className={item.autor ? "before:content-['•'] before:mr-2" : ""}>
                             {new Date(item.fecha).toLocaleDateString()}
                           </span>
                        </div>
                        <div 
                          className="text-sm text-gray-500 line-clamp-2 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: item.descripcion }}
                        />
                      </div>
                    </a>
                  </Link>
                ))}

                {/* Pagination Controls */}
                {otherNews.length > itemsPerPage && (
                  <div className="flex justify-center items-center space-x-2 mt-8">
                    {/* Previous Button */}
                    <button
                      onClick={() => {
                         const prev = Math.max(currentPage - 1, 1);
                         setCurrentPage(prev);
                         document.getElementById('paginated-list-header')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      Anterior
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                      <button
                        key={number}
                        onClick={() => {
                          setCurrentPage(number);
                          document.getElementById('paginated-list-header')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                          currentPage === number
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {number}
                      </button>
                    ))}

                    {/* Next Button */}
                    <button
                      onClick={() => {
                         const next = Math.min(currentPage + 1, totalPages);
                         setCurrentPage(next);
                         document.getElementById('paginated-list-header')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      Siguiente
                    </button>
                  </div>
                )}


              </div>
            )}
          </div>

          {/* SIDEBAR: Destacados + Ads (Split into 2 columns on large screens) */}
          <div className="col-span-12 lg:col-span-5 border-l border-gray-100 pl-0 lg:pl-8 grid grid-cols-1 sm:grid-cols-2 gap-6 content-start">
            
            {/* Column 1: Destacados */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 border-b-2 border-primary pb-2 mb-4 inline-block">
                Destacados
              </h3>

              <div className="space-y-4">
                {displayHighlights.map((item) => (
                  <Link key={item.id} href={`/news/${createSlug(item.titulo)}`}>
                    <a className="group block bg-white border border-gray-200 rounded-xl hover:shadow-xl transition-all transform hover:-translate-y-1 overflow-hidden">
                      {/* Image at Top */}
                      <div className="aspect-video w-full relative overflow-hidden">
                        <img
                          src={
                            item.imageUrl || 'https://via.placeholder.com/400x225'
                          }
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute top-2 left-2">
                           <span className="bg-primary/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                            {getCategoryName(item.categoriaId)}
                           </span>
                        </div>
                      </div>

                      <div className="p-4 flex flex-col">
                        <h3 
                          className="font-bold text-base text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-3"
                          dangerouslySetInnerHTML={{ __html: item.titulo }}
                        />

                        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                          <p className="font-medium flex items-center">
                             <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                             </svg>
                             {new Date(item.fecha).toLocaleDateString()}
                          </p>
                          <p className="flex items-center gap-1 text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Popular
                          </p>
                        </div>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            </div>

            {/* Column 2: Ads */}
            <div className="pt-0">
              <AdSidebar />
            </div>
          </div>
        </div>
        
        <div className="mt-16">
          <CommunitySection />
          <div className="mt-16">
            <RelevantInfoCarousel />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default News;
