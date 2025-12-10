import React, { useEffect, useState } from 'react';

import config from '../config/index.json';
import { noticiaService, Noticia } from '../services/noticiaService';

const LatestNews = () => {
  const { socials } = config;
  const [latestNews, setLatestNews] = useState<Noticia[]>([]);
  const [featuredNews, setFeaturedNews] = useState<Noticia | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const news = await noticiaService.getAll();
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
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                    <img
                      src="/assets/images/product2.jpg"
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Juan Avend</div>
                    <div className="text-xs text-gray-500">
                      355 suscriptores
                    </div>
                  </div>
                  <button className="ml-auto bg-red-600 text-white text-xs px-3 py-1 rounded font-bold uppercase hover:bg-red-700">
                    Suscribirse
                  </button>
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
              <div className="h-32 bg-gray-100 relative">
                <img
                  src="/assets/images/happyTeam.jpeg"
                  className="w-full h-full object-cover opacity-90"
                  alt="FB Cover"
                />
              </div>
              <div className="p-3 text-center">
                <a
                  href={socials?.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full bg-[#e7f3ff] text-[#1877F2] font-bold text-sm py-2 rounded hover:bg-blue-100"
                >
                  Ver Página
                </a>
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
              <div className="p-4 text-center">
                <div className="text-sm font-bold mb-2">@juan_avend</div>
                <a
                  href="https://www.tiktok.com/@juan_avend"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-6 py-2 bg-black text-white text-sm font-bold rounded shadow hover:opacity-80"
                >
                  Ver Perfil
                </a>
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

            {/* Recurso Destacado */}
            <div className="pt-4">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4 uppercase">
                Recurso Destacado
              </h2>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 text-white shadow-lg text-center transform hover:scale-[1.02] transition-transform">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-blue-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <h3 className="font-bold text-lg mb-2">
                  Guía Exclusiva para Docentes
                </h3>
                <p className="text-blue-100 text-xs mb-4">
                  Descarga nuestra guía actualizada con las últimas normativas.
                </p>
                <button className="bg-white text-blue-700 px-4 py-2 rounded-full font-bold text-xs uppercase hover:bg-blue-50">
                  Descargar PDF
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Banners (approx 25% -> col-span-3) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center border-b border-gray-200 pb-2 mb-4">
              Publicidad
            </div>
            {/* Banner 1 */}
            <a
              href="#"
              className="block h-64 bg-gray-100 relative group-hover:opacity-95 transition-opacity rounded-lg overflow-hidden border border-gray-200"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <span className="text-xs uppercase font-bold mb-1">
                  Espacio Publicitario
                </span>
                <span className="text-[10px]">300x250</span>
              </div>
            </a>

            {/* Banner 2 */}
            <div className="relative">
              <div className="absolute top-2 right-2 bg-gray-100 text-[10px] px-2 py-0.5 rounded text-gray-500 font-bold uppercase tracking-wider z-10">
                Publicidad
              </div>
              <a
                href="#"
                className="block h-96 bg-gray-100 relative group-hover:opacity-95 transition-opacity rounded-lg overflow-hidden border border-gray-200"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <span className="text-xs uppercase font-bold mb-1">
                    Vertical Banner
                  </span>
                  <span className="text-[10px]">300x600</span>
                </div>
              </a>
            </div>

            {/* Banner 3 */}
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center border-b border-gray-200 pb-2 mb-4 mt-8">
              Publicidad
            </div>
            <a
              href="#"
              className="block h-64 bg-gray-100 relative group-hover:opacity-95 transition-opacity rounded-lg overflow-hidden border border-gray-200"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <span className="text-xs uppercase font-bold mb-1">
                  Espacio Publicitario
                </span>
                <span className="text-[10px]">300x250</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestNews;
