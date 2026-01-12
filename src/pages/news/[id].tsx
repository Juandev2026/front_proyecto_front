import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/router';

import AdSidebar from '../../components/AdSidebar';
import CommentsSection from '../../components/CommentsSection';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import { categoriaService } from '../../services/categoriaService';
import { noticiaService, Noticia } from '../../services/noticiaService';
import CommunitySection from '../../components/CommunitySection';

const NewsDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [newsItem, setNewsItem] = useState<Noticia | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchNewsItem = async () => {
        try {
          setLoading(true);
          const data = await noticiaService.getById(Number(id));
          setNewsItem(data);

          // Fetch category name
          if (data.categoriaId) {
            const categories = await categoriaService.getAll();
            const category = categories.find((c) => c.id === data.categoriaId);
            if (category) {
              setCategoryName(category.nombre);
            }
          }
        } catch (err) {
          // console.error('Error fetching news detail:', err);
          setError('No se pudo cargar la noticia.');
        } finally {
          setLoading(false);
        }
      };

      fetchNewsItem();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !newsItem) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">¡Ups!</h1>
          <p className="text-xl text-gray-600 mb-8">
            {error || 'Noticia no encontrada'}
          </p>
          <Link href="/news">
            <a className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary transition-colors">
              Volver a Noticias
            </a>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="relative bg-background">
        <div className="w-full">
          <Header />
        </div>
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-8">
          <Link href="/news">
            <a className="text-primary hover:underline flex items-center gap-2 font-medium">
              ← Volver a Noticias
            </a>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-8">
            <article className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
              <div className="w-full relative group">
                {newsItem.archivoUrl && newsItem.archivoUrl.toLowerCase().endsWith('.pdf') ? (
                  <div className="w-full h-[800px] bg-gray-100">
                    <iframe
                      src={newsItem.archivoUrl}
                      className="w-full h-full"
                      title="Visor de Documento"
                    />
                     <div className="absolute bottom-4 right-4 z-10">
                        <a 
                          href={newsItem.archivoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-primary text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                           </svg>
                           Descargar PDF
                        </a>
                     </div>
                  </div>
                ) : (
                  <div className="cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
                    <img
                      src={newsItem.archivoUrl || newsItem.imageUrl || ''}
                      alt={newsItem.titulo}
                      className="w-full h-auto object-contain max-h-[800px] bg-gray-100"
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
              </div>
              
              <div className="p-6 md:p-10 border-b border-gray-100">
                {categoryName && (
                  <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full mb-4">
                    {categoryName}
                  </span>
                )}
                <h1
                  className="text-3xl md:text-5xl font-bold leading-tight mb-4 text-gray-900"
                  dangerouslySetInnerHTML={{ __html: newsItem.titulo }}
                />
                <div className="flex flex-col md:flex-row md:items-center text-sm md:text-base text-gray-500 gap-2 md:gap-4 font-medium">
                  <span>{new Date(newsItem.fecha).toLocaleDateString()}</span>
                  {newsItem.autor && (
                    <>
                      <span className="hidden md:inline">•</span>
                      <span>Por: {newsItem.autor}</span>
                    </>
                  )}
                </div>
              </div>
            </article>

            {newsItem && <CommentsSection noticiaId={newsItem.id} />}
            
            <div className="mt-12">
              <CommunitySection />
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-8">
              <AdSidebar />
            </div>
          </div>
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
               src={newsItem.archivoUrl && !newsItem.archivoUrl.toLowerCase().endsWith('.pdf') ? newsItem.archivoUrl : (newsItem.imageUrl || '')} 
               alt={newsItem.titulo} 
               className="max-w-full max-h-full object-contain rounded-sm shadow-2xl"
               onClick={(e) => e.stopPropagation()} // Prevent close when clicking image
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

export default NewsDetail;
