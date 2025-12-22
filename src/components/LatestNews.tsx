import React, { useEffect, useState } from 'react';


import { useAuth } from '../hooks/useAuth';
import { noticiaService, Noticia } from '../services/noticiaService';
import AdSidebar from './AdSidebar';

const LatestNews = () => {
  const { user, isAuthenticated } = useAuth();
  const [latestNews, setLatestNews] = useState<Noticia[]>([]);
  const [featuredNews, setFeaturedNews] = useState<Noticia | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'level'>('all');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        let news: Noticia[] = [];
        if (filterMode === 'level' && user?.nivelId) {
            news = await noticiaService.getByNivel(user.nivelId);
        } else {
            news = await noticiaService.getAll();
        }
        // Sort by date descending if not already sorted by API, but assuming API returns latest or I should sort?
        // The user asked for "latest 5 news". I'll assume API returns them or I sort them.
        // Let's sort by ID desc or Date desc just in case.
        const sortedNews = news.sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );

        // Take first for featured if marked, else just first
        const featured = sortedNews.find((n) => n.esDestacado) || sortedNews[0];
        setFeaturedNews(featured || null);

        // Remaining for list
        setLatestNews(
          sortedNews.filter((n) => n.id !== featured?.id).slice(0, 5)
        );
      } catch (error) {
        console.error('Error loading news:', error);
      }
    };

    fetchNews();
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

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Latest News (approx 40% -> col-span-5) */}
          <div className="lg:col-span-5 space-y-8">
            <h2 className="text-3xl font-extrabold text-gray-900 border-b-2 border-primary pb-2 inline-block uppercase tracking-wide">
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
                    <span className="font-bold">¿Quieres ver noticias personalizadas?</span> Inicia sesión para ver contenido de tu nivel.
                  </p>
                  <a 
                    href="/login" 
                    className="whitespace-nowrap px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Iniciar Sesión
                  </a>
               </div>
            )}
            <div className="space-y-6">
              {latestNews.map((news) => (
                <div
                  key={news.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-row border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="w-1/3 relative">
                    <img
                      className="w-full h-full object-cover absolute inset-0"
                      src={news.imageUrl || '/assets/images/placeholder.png'}
                      alt={news.titulo}
                    />
                  </div>
                  <div className="w-2/3 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                        {news.titulo}
                      </h3>
                      <div className="w-full border-t border-gray-100 my-2"></div>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {news.descripcion}
                      </p>
                    </div>
                    <div className="mt-3">
                      <a
                        href={`/news/${news.id}`}
                        className="inline-block px-4 py-1.5 border border-gray-300 rounded-full text-xs font-semibold text-gray-600 hover:bg-primary hover:text-white hover:border-primary transition-colors uppercase"
                      >
                        Ver más
                      </a>
                    </div>
                  </div>
                </div>
              ))}
              {latestNews.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No hay noticias recientes.
                </p>
              )}
            </div>
          </div>

          {/* MIDDLE COLUMN: Socials + Featured (approx 33% -> col-span-4) */}
          <div className="lg:col-span-4 space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
              Síguenos en:
            </h2>

            {/* YouTube */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
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
                            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                </a>
                </div>
              </div>
            </div>

            {/* Facebook */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="bg-[#1877F2] px-4 py-2 text-white font-bold flex items-center justify-between">
                <span>Facebook</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div className="p-3 text-center overflow-hidden">
                <iframe
                    src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fjuanavendocente%3Frdid%3DzjANupcVQeTnGgXL%23&tabs=timeline&width=500&height=400&small_header=false&adapt_container_width=false&hide_cover=false&show_facepile=false&appId"
                    width="500" 
                    height="400" 
                    style={{border:'none', overflow:'hidden'}} 
                    scrolling="no" 
                    frameBorder="0" 
                    allowFullScreen={true}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                ></iframe>
              </div>
            </div>

            {/* TikTok */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
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
                        <a target="_blank" href="https://www.tiktok.com/@juan_avend?refer=creator_embed" rel="noreferrer">@juan_avend</a> 
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
                        {featuredNews.titulo}
                      </h3>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-900">
                    <p className="text-xs text-gray-300 line-clamp-3 mb-3">
                      {featuredNews.descripcion}
                    </p>
                    <a
                      href={`/news/${featuredNews.id}`}
                      className="text-primary text-sm font-semibold hover:underline"
                    >
                      Leer artículo completo &rarr;
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 p-8 text-center rounded text-gray-500 text-sm">
                  No hay noticia destacada
                </div>
              )}
            </div>


          </div>

          {/* RIGHT COLUMN: Banners (approx 25% -> col-span-3) */}
          <div className="lg:col-span-3">
             <AdSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestNews;
