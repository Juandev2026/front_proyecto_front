import React, { useEffect, useState } from 'react';

import { SearchIcon } from '@heroicons/react/solid';
import Head from 'next/head';
import Link from 'next/link';

import Footer from '../components/Footer';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { categoriaService, Categoria } from '../services/categoriaService';
import { noticiaService, Noticia } from '../services/noticiaService';

const News = () => {
  const { user, isAuthenticated } = useAuth();
  const [filterMode, setFilterMode] = useState<'all' | 'level'>('all');
  const [news, setNews] = useState<Noticia[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        let newsData: Noticia[] = [];
        if (filterMode === 'level' && user?.nivelId) {
             newsData = await noticiaService.getByNivel(user.nivelId);
        } else {
             newsData = await noticiaService.getAll();
        }

        const categoriesData = await categoriaService.getAll();
        
        setNews(newsData);
        setCategories(categoriesData);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [filterMode, user?.nivelId]);

  // Filter logic
  const filteredNews = news.filter((item) => {
    const matchesCategory = selectedCategoryId
      ? item.categoriaId === selectedCategoryId
      : true;
    const matchesSearch =
      item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
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

  return (
    <div className="bg-white min-h-screen font-sans">
      <Head>
        <title>Portal de Noticias</title>
      </Head>

      <div className="relative bg-background">
        <div className="max-w-7xl mx-auto">
          <Header />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
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
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <p className="text-sm text-blue-900">
                        <span className="font-bold block text-base">¿Buscas contenido personalizado?</span>
                        Inicia sesión para ver noticias exclusivas para tu nivel educativo.
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
          <div className="col-span-12 lg:col-span-6 space-y-10">
            {featuredArticle ? (
              <div className="group cursor-pointer">
                <Link href={`/news/${featuredArticle.id}`}>
                  <a>
                    <div className="relative overflow-hidden rounded-xl mb-4 aspect-video shadow-lg">
                      <img
                        src={
                          featuredArticle.imageUrl ||
                          'https://via.placeholder.com/800x450'
                        }
                        alt={featuredArticle.titulo}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-primary text-white text-xs px-2 py-1 rounded font-bold uppercase">
                        {getCategoryName(featuredArticle.categoriaId)}
                      </span>
                      <span className="text-gray-500 text-xs font-semibold">
                        {new Date(featuredArticle.fecha).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 leading-tight mb-3 group-hover:text-primary transition-colors">
                      {featuredArticle.titulo}
                    </h2>
                    <p className="text-gray-600 leading-relaxed text-lg line-clamp-3">
                      {featuredArticle.descripcion}
                    </p>
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
                <Link key={item.id} href={`/news/${item.id}`}>
                  <a className="group flex flex-col h-full">
                    <div className="relative overflow-hidden rounded-lg mb-3 aspect-[4/3] shadow-sm">
                      <img
                        src={
                          item.imageUrl || 'https://via.placeholder.com/400x300'
                        }
                        alt={item.titulo}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold text-primary uppercase mb-1 block">
                        {getCategoryName(item.categoriaId)}
                      </span>
                      <h3 className="font-bold text-gray-900 leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-3">
                        {item.titulo}
                      </h3>
                    </div>
                  </a>
                </Link>
              ))}
            </div>

            {/* List for remainder */}
            {otherNews.length > 0 && (
              <div className="space-y-6 pt-8 border-t border-gray-100">
                {otherNews.map((item) => (
                  <Link key={item.id} href={`/news/${item.id}`}>
                    <a className="flex gap-4 group items-start p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="w-1/3 aspect-video relative overflow-hidden rounded-md shadow-sm">
                        <img
                          src={
                            item.imageUrl ||
                            'https://via.placeholder.com/200x112'
                          }
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="w-2/3">
                        <h4 className="font-bold text-gray-900 group-hover:text-primary mb-1 line-clamp-2">
                          {item.titulo}
                        </h4>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {item.descripcion}
                        </p>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* MIDDLE COLUMN: Destacados (Updated to White/Light Theme) */}
          <div className="col-span-12 lg:col-span-3 border-l border-gray-100 pl-0 lg:pl-8 space-y-6">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-primary pb-2 mb-4 inline-block">
              Destacados
            </h3>

            <div className="space-y-4">
              {displayHighlights.map((item) => (
                <Link key={item.id} href={`/news/${item.id}`}>
                  <a className="group block bg-white border border-gray-200 p-4 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-1">
                    <div className="flex flex-col h-full relative z-10">
                      <div className="mb-3">
                        <span className="text-xs font-bold uppercase tracking-wide text-primary mb-2 block">
                          {getCategoryName(item.categoriaId)}
                        </span>
                        <h3 className="font-bold text-base text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-3">
                          {item.titulo}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 mt-auto pt-3 border-t border-gray-50">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <img
                            src={
                              item.imageUrl || 'https://via.placeholder.com/100'
                            }
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          <p className="font-semibold">
                            {new Date(item.fecha).toLocaleDateString()}
                          </p>
                          <p className="flex items-center gap-1 mt-0.5 text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Popular
                          </p>
                        </div>
                      </div>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: Banners */}
          <div className="col-span-12 lg:col-span-3 space-y-8">
            <div className="sticky top-4 space-y-6">
              {/* Banner 1 */}
              <div className="border border-gray-100 rounded-xl bg-gray-50 p-4 flex flex-col items-center justify-center h-64 text-center">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
                  Publicidad
                </span>
                <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-400">
                  Banner 300x250
                </div>
              </div>

              {/* Banner 2 */}
              <div className="border border-gray-100 rounded-xl bg-gray-50 p-4 flex flex-col items-center justify-center h-96 text-center">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
                  Publicidad
                </span>
                <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-400">
                  Banner Vertical
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default News;
