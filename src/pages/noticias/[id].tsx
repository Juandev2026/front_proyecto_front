import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';

import AdSidebar from '../../components/AdSidebar';
import CommentsSection from '../../components/CommentsSection';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import CommunitySection from '../../components/CommunitySection';
import { useAuth } from '../../hooks/useAuth';
import AuthModal from '../../components/AuthModal';
import ShareButton from '../../components/ShareButton';

import { categoriaService } from '../../services/categoriaService';
import { noticiaService, Noticia } from '../../services/noticiaService';
import { createSlug, getIdFromSlug, cleanSlug, stripHtml, linkifyHtml } from '../../utils/urlUtils';

interface NewsDetailProps {
  newsItem: Noticia | null;
  categoryName: string;
  featuredNews: Noticia[];
  error?: string;
  url: string;
}

const NewsDetail = ({ newsItem, categoryName, featuredNews, error, url }: NewsDetailProps) => {
  const { isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  if (error || !newsItem) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
          <Head>
            <title>Noticia no encontrada</title>
          </Head>
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">¡Ups!</h1>
          <p className="text-xl text-gray-600 mb-8">
            {error || 'Noticia no encontrada'}
          </p>
          <Link href="/noticias">
            <a className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary transition-colors">
              Volver a Noticias
            </a>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }



  const plainDescription = newsItem.descripcion ? stripHtml(newsItem.descripcion) : '';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Head>
        <title>{stripHtml(newsItem.titulo)}</title>
        <meta name="description" content={plainDescription.substring(0, 160)} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={stripHtml(newsItem.titulo)} />
        <meta property="og:description" content={plainDescription.substring(0, 160)} />
        {newsItem.imageUrl && <meta property="og:image" content={newsItem.imageUrl} />}

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={url} />
        <meta property="twitter:title" content={stripHtml(newsItem.titulo)} />
        <meta property="twitter:description" content={plainDescription.substring(0, 160)} />
        {newsItem.imageUrl && <meta property="twitter:image" content={newsItem.imageUrl} />}
      </Head>

      <div className="relative bg-background">
        <div className="w-full">
          <Header />
        </div>
      </div>

      <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/noticias">
            <a className="text-primary hover:underline flex items-center gap-2 font-medium">
              ← Volver a Noticias
            </a>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Main Content (8/12) */}
          <div className="lg:col-span-8 mx-auto w-full max-w-4xl lg:max-w-none lg:mx-0">
            <article className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
              {/* Thumbnail Image at Top */}
              {newsItem.imageUrl && (
                <div className="w-full relative group cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
                  <img
                    src={newsItem.imageUrl}
                    alt={newsItem.titulo}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                    <div className="bg-white/80 rounded-full p-3 shadow-lg backdrop-blur-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    Ver imagen completa
                  </div>
                </div>
              )}
              
              {/* Title and Description */}
              <div className="p-6 md:p-8 border-b border-gray-100">
                <div className="flex flex-col gap-4 mb-4">
                    <h1
                    className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight w-full"
                    dangerouslySetInnerHTML={{ __html: newsItem.titulo }}
                    />
                    <div className="flex-shrink-0">
                        <ShareButton 
                          title={stripHtml(newsItem.titulo)} 
                          url={url} 
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {categoryName || 'General'}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {new Date(newsItem.fecha).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  {newsItem.autor && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Por: {newsItem.autor}
                    </span>
                  )}
                </div>
                <div 
                  dangerouslySetInnerHTML={{ __html: linkifyHtml(newsItem.descripcion) }}
                  className="prose prose-xl md:prose-2xl max-w-none text-gray-700 leading-relaxed text-xl md:text-2xl"
                />
              </div>

              {/* Document Viewer at Bottom (PDF or Office) */}
              {(() => {
                if (!newsItem.archivoUrl) return null;
                
                const url = newsItem.archivoUrl;
                const lowerUrl = url.toLowerCase();
                let viewerUrl = null;
                let isOffice = false;

                if (lowerUrl.endsWith('.pdf')) {
                  viewerUrl = url;
                } else if (
                  lowerUrl.endsWith('.doc') ||
                  lowerUrl.endsWith('.docx') ||
                  lowerUrl.endsWith('.xls') ||
                  lowerUrl.endsWith('.xlsx') ||
                  lowerUrl.endsWith('.ppt') ||
                  lowerUrl.endsWith('.pptx')
                ) {
                  viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
                  isOffice = true;
                }

                if (!viewerUrl) return null;

                return (
                  <div className="p-6 md:p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Documento Adjunto</h2>
                    <div className="w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden relative">
                      {isOffice && (
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                           <div className="animate-pulse text-gray-400">Cargando visor...</div>
                         </div>
                      )}
                      <iframe
                        src={viewerUrl}
                        className="w-full h-full relative z-10"
                        title="Visor de Documento"
                        frameBorder="0"
                      />
                    </div>
                    <div className="mt-4 flex justify-end">
                      {isAuthenticated ? (
                        <a 
                          href={newsItem.archivoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-primary text-white px-6 py-3 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Descargar Archivo
                        </a>
                      ) : (
                        <button 
                          onClick={() => setIsAuthModalOpen(true)}
                          className="bg-gray-600 text-white px-6 py-3 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-700 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Descargar Archivo
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            
            <AuthModal 
              isOpen={isAuthModalOpen} 
              onClose={() => setIsAuthModalOpen(false)} 
            />

              {/* YouTube Video Section */}
              {newsItem.videoUrl && (
                <div className="p-6 md:p-8 border-t border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Video Destacado</h2>
                  <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${
                        newsItem.videoUrl.includes('v=') 
                          ? newsItem.videoUrl.split('v=')[1]?.split('&')[0] 
                          : newsItem.videoUrl.split('/').pop()
                      }`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}
            </article>

            {newsItem && <CommentsSection noticiaId={newsItem.id} />}
            
            <div className="mt-12">
              <CommunitySection />
            </div>
          </div>

          {/* Middle Column: Últimas Noticias (2/12) */}
          <aside className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h3 className="text-xl font-bold text-white">Últimas Noticias</h3>
              </div>
              <div className="p-4 space-y-4">
                {featuredNews.slice(0, 5).map((featured) => (
                  <Link key={featured.id} href={`/noticias/${createSlug(featured.titulo)}`}>
                    <a className="block group">
                      <div className="relative overflow-hidden rounded-lg mb-2">
                        <img
                          src={featured.imageUrl || '/assets/images/placeholder.png'}
                          alt={featured.titulo}
                          className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                          Nuevo
                        </div>
                      </div>
                      <h4
                        className="font-semibold text-base text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1"
                        dangerouslySetInnerHTML={{ __html: featured.titulo }}
                      />
                      <p className="text-sm text-gray-500">
                        {new Date(featured.fecha).toLocaleDateString('es-ES')}
                      </p>
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Column: Ads (2/12) */}
          <aside className="lg:col-span-2">
            <div className="sticky top-8">
              <AdSidebar />
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      {/* Image Modal */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 transition-opacity duration-300"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-7xl max-h-screen w-full h-full flex items-center justify-center">
             <img 
               src={
                 newsItem.archivoUrl && 
                 !newsItem.archivoUrl.toLowerCase().endsWith('.pdf') &&
                 !newsItem.archivoUrl.toLowerCase().endsWith('.doc') &&
                 !newsItem.archivoUrl.toLowerCase().endsWith('.docx') &&
                 !newsItem.archivoUrl.toLowerCase().endsWith('.xls') &&
                 !newsItem.archivoUrl.toLowerCase().endsWith('.xlsx') &&
                 !newsItem.archivoUrl.toLowerCase().endsWith('.ppt') &&
                 !newsItem.archivoUrl.toLowerCase().endsWith('.pptx')
                   ? newsItem.archivoUrl 
                   : (newsItem.imageUrl || '')
               } 
               alt={newsItem.titulo} 
               className="max-w-full max-h-full object-contain rounded-sm shadow-2xl"
               onClick={(e) => e.stopPropagation()} 
             />
             <button 
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors z-50"
                onClick={() => setIsImageModalOpen(false)}
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  const protocol = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;
  const url = `${protocol}://${host}/noticias/${id}`;

  try {
    const slug = id;
    const newsId = getIdFromSlug(slug);
    let data: Noticia | null = null;
    let categoryName = 'General';

    // 1. Try fetching by ID
    if (newsId) {
      try {
        data = await noticiaService.getById(newsId);
      } catch (err) {
        // Fallback
      }
    }

    // 2. Fallback to matching by slug in all news
    if (!data) {
      const allNews = await noticiaService.getAll();
      data = allNews.find((n) => cleanSlug(n.titulo) === slug) || null;
    }

    if (!data) {
      return {
        props: {
          newsItem: null,
          categoryName: '',
          featuredNews: [],
          error: 'Noticia no encontrada.',
          url,
        },
      };
    }

    // Fetch Category Name
    if (data.categoriaId) {
        try {
            const categories = await categoriaService.getAll();
            const category = categories.find((c) => c.id === data!.categoriaId);
            if (category) categoryName = category.nombre;
        } catch (e) {
            console.error(e);
        }
    }

    // Fetch Featured News (Latest 5, excluding current)
    let featuredNews: Noticia[] = [];
    try {
        const allNews = await noticiaService.getAll();
        featuredNews = allNews
          .filter((news) => news.id !== data!.id)
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
          .slice(0, 5);
    } catch (e) {
        console.error(e);
    }

    return {
      props: {
        newsItem: data,
        categoryName,
        featuredNews,
        url,
      },
    };

  } catch (error) {
    console.error('SSR Error:', error);
    return {
      props: {
        newsItem: null,
        error: 'Ocurrió un error al cargar la noticia.',
        url,
      },
    };
  }
};

export default NewsDetail;
