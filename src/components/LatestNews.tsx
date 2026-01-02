import React, { useEffect, useState } from 'react';

import Link from 'next/link';

import AdSidebar from './AdSidebar';
import { useAuth } from '../hooks/useAuth';
import { noticiaService, Noticia } from '../services/noticiaService';

const LatestNews = () => {
  const { user, isAuthenticated } = useAuth();
  const [subFeaturedNews, setSubFeaturedNews] = useState<Noticia[]>([]);
  const [paginatedNews, setPaginatedNews] = useState<Noticia[]>([]);
  const [featuredNews, setFeaturedNews] = useState<Noticia | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'level'>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        let news: Noticia[] = [];
        if (filterMode === 'level' && user?.nivelId) {
          news = await noticiaService.getByNivel(user.nivelId);
        } else {
          news = await noticiaService.getAll();
        }
        
        // Filter by PUBLICADO
        news = news.filter((n) => n.estado?.nombre?.toUpperCase() === 'PUBLICADO');
        // Sort by ID desc (newest first)
        const sortedNews = news.sort((a, b) => b.id - a.id);

        // Take first for featured if marked, else just first
        const featured = sortedNews.find((n) => n.esDestacado) || sortedNews[0];
        setFeaturedNews(featured || null);

        // Filter out the featured one
        const remaining = sortedNews.filter((n) => n.id !== featured?.id);

        // Split into Sub-Featured (4 items) and Pagination List (rest)
        setSubFeaturedNews(remaining.slice(0, 4));
        setPaginatedNews(remaining.slice(4));

      } catch (error) {
        // console.error('Error loading news:', error);
      }
    };

    fetchNews();
    setCurrentPage(1); // Reset to page 1 on filter change
  }, [filterMode, user?.nivelId]);

  useEffect(() => {
    // Load TikTok Script
    const tiktokScript = document.createElement('script');
    tiktokScript.src = 'https://www.tiktok.com/embed.js';
    tiktokScript.async = true;
    document.body.appendChild(tiktokScript);

    return () => {
      if (document.body.contains(tiktokScript)) {
        document.body.removeChild(tiktokScript);
      }
    };
  }, []);

  // Helper to strip HTML tags for preview and handle entities
  const stripHtml = (html: string) => {
    if (!html) return '';
    if (typeof window === 'undefined') return html; // SSR safety
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNews = paginatedNews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(paginatedNews.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Optional: Scroll to start of paginated section (or top of news)
    document.getElementById('paginated-news-header')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="py-12 bg-white">
      {/* Changed max-w-7xl to w-full and added px-4 for basic padding */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
      
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Latest News (approx 58% -> col-span-7) */}
          <div className="lg:col-span-7 space-y-8">
            <h2 
              id="latest-news-header"
              className="text-3xl font-extrabold text-gray-900 border-b-2 border-primary pb-2 inline-block uppercase tracking-wide"
            >
              Últimas Noticias
            </h2>

            {isAuthenticated && user?.nivelId ? (
              <div className="flex space-x-4 mt-2 mb-4">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    filterMode === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  Ver todas
                </button>
                <button
                  onClick={() => setFilterMode('level')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    filterMode === 'level'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  Ver noticias por mi nivel
                </button>
              </div>
            ) : (
              <div className="mt-2 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-blue-800">
                  <span className="font-bold">
                    ¿Quieres ver noticias personalizadas?
                  </span>{' '}
                  Inicia sesión para ver contenido de tu nivel.
                </p>
                <Link href="/login">
                  <a className="whitespace-nowrap px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-blue-700 transition-colors">
                    Iniciar Sesión
                  </a>
                </Link>
              </div>
            )}
            
            <div className="space-y-6">
              {/* Render Sub-Featured News (Top 4) */}
              {subFeaturedNews.map((news) => (
                <div
                  key={news.id}
                  className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-row border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 transform group"
                >
                  <div className="w-1/3 relative overflow-hidden">
                    <img
                      className="w-full h-full object-cover absolute inset-0 transform group-hover:scale-110 transition-transform duration-500"
                      src={news.imageUrl || '/assets/images/placeholder.png'}
                      alt={stripHtml(news.titulo)}
                    />
                  </div>
                  <div className="w-2/3 p-4 sm:p-8 flex flex-col justify-between">
                    <div>
                      <h3
                        className="text-2xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight"
                        dangerouslySetInnerHTML={{ __html: news.titulo }}
                      />
                      {news.autor && (
                        <p className="text-xs text-gray-500 font-medium mb-3">
                          Por: {news.autor}
                        </p>
                      )}
                      <div className="w-full border-t border-gray-100 my-4"></div>
                      <p className="text-lg text-gray-600 line-clamp-3">
                        {stripHtml(news.descripcion)}
                      </p>
                    </div>
                    <div className="mt-6">
                      <Link href={`/news/${news.id}`}>
                        <a className="inline-block px-7 py-2.5 border border-gray-300 rounded-full text-base font-semibold text-gray-600 hover:bg-primary hover:text-white hover:border-primary transition-colors uppercase">
                          Ver más
                        </a>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Render Paginated News (The Rest) */}
               {paginatedNews.length > 0 && (
                <div id="paginated-news-header" className="pt-4">
                  
                  <div className="space-y-6">
                    {currentNews.map((news) => (
                      <div
                        key={news.id}
                        className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-row border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 transform group"
                      >
                        <div className="w-1/3 relative overflow-hidden">
                          <img
                            className="w-full h-full object-cover absolute inset-0 transform group-hover:scale-110 transition-transform duration-500"
                            src={news.imageUrl || '/assets/images/placeholder.png'}
                            alt={stripHtml(news.titulo)}
                          />
                        </div>
                        <div className="w-2/3 p-4 sm:p-8 flex flex-col justify-between">
                          <div>
                            <h3
                              className="text-2xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight"
                              dangerouslySetInnerHTML={{ __html: news.titulo }}
                            />
                            {news.autor && (
                              <p className="text-xs text-gray-500 font-medium mb-3">
                                Por: {news.autor}
                              </p>
                            )}
                            <div className="w-full border-t border-gray-100 my-4"></div>
                            <p className="text-lg text-gray-600 line-clamp-3">
                              {stripHtml(news.descripcion)}
                            </p>
                          </div>
                          <div className="mt-6">
                            <Link href={`/news/${news.id}`}>
                              <a className="inline-block px-7 py-2.5 border border-gray-300 rounded-full text-base font-semibold text-gray-600 hover:bg-primary hover:text-white hover:border-primary transition-colors uppercase">
                                Ver más
                              </a>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
               )}

              {subFeaturedNews.length === 0 && paginatedNews.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No hay noticias recientes.
                </p>
              )}
            </div>

            {/* Pagination Controls */}
            {paginatedNews.length > itemsPerPage && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                {/* Previous Button */}
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentPage === number
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    {number}
                  </button>
                ))}

                {/* Next Button */}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* MIDDLE COLUMN: Socials + Featured (approx 25% -> col-span-3) */}
          <div className="lg:col-span-3 space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
              Síguenos en:
            </h2>

            {/* YouTube */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="bg-red-600 px-4 py-2 text-white font-bold flex items-center justify-between">
                <span>Youtube</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <div className="p-4">
                <div className="w-full aspect-w-16 aspect-h-9">
                  <a
                    href="https://www.youtube.com/@JuanCarlosAvend/videos"
                    target="_blank"
                    rel="noreferrer"
                    className="block relative w-full h-[315px] group"
                  >
                    {/* Thumbnail Image */}
                    <img
                      src="/assets/images/youtube.jpeg"
                      alt="YouTube Channel"
                      className="w-full h-full object-cover rounded shadow-sm opacity-90 group-hover:opacity-100 transition-opacity"
                    />

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg
                          className="w-8 h-8 text-white ml-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Facebook */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="bg-[#1877F2] px-4 py-2 text-white font-bold flex items-center justify-between">
                <span>Facebook</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.954 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div className="p-3 text-center overflow-hidden">
                <iframe
                  src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fjuanavendocente%3Frdid%3DzjANupcVQeTnGgXL%23&tabs=timeline&width=500&height=400&small_header=false&adapt_container_width=false&hide_cover=false&show_facepile=false&appId"
                  width="500"
                  height="400"
                  style={{ border: 'none', overflow: 'hidden' }}
                  scrolling="no"
                  frameBorder="0"
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                ></iframe>
              </div>
            </div>

            {/* TikTok */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="bg-black px-4 py-2 text-white font-bold flex items-center justify-between">
                <span>TikTok</span>
                <span className="font-bold flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                  TikTok
                </span>
              </div>
              <div className="p-0 text-center">
                <blockquote
                  className="tiktok-embed"
                  cite="https://www.tiktok.com/@juan_avend"
                  data-unique-id="juan_avend"
                  data-embed-type="creator"
                  style={{ maxWidth: '100%', minWidth: '100%' }}
                >
                  <section>
                    <a
                      target="_blank"
                      href="https://www.tiktok.com/@juan_avend?refer=creator_embed"
                      rel="noreferrer"
                    >
                      @juan_avend
                    </a>
                  </section>
                </blockquote>
              </div>
            </div>

            {/* Noticia Destacada */}
            <div className="pt-8">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4 uppercase">
                Noticia Destacada
              </h2>
              {featuredNews ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden group cursor-pointer relative">
                  <div className="aspect-video relative">
                    <img
                      src={
                        featuredNews.imageUrl ||
                        '/assets/images/placeholder.png'
                      }
                      className="w-full h-full object-cover"
                      alt="Featured"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">
                        {stripHtml(featuredNews.titulo)}
                      </h3>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-900">
                    <p className="text-xs text-gray-300 line-clamp-3 mb-3">
                      {stripHtml(featuredNews.descripcion)}
                    </p>
                    <Link href={`/news/${featuredNews.id}`}>
                      <a className="text-primary text-sm font-semibold hover:underline">
                        Leer artículo completo &rarr;
                      </a>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 p-8 text-center rounded text-gray-500 text-sm">
                  No hay noticia destacada
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Banners (approx 16% -> col-span-2) */}
          <div className="lg:col-span-2">
            <AdSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestNews;
