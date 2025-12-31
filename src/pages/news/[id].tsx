import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/router';

import AdSidebar from '../../components/AdSidebar';
import CommentsSection from '../../components/CommentsSection';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import { categoriaService } from '../../services/categoriaService';
import { noticiaService, Noticia } from '../../services/noticiaService';

const NewsDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [newsItem, setNewsItem] = useState<Noticia | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="max-w-7xl mx-auto">
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
              <div className="relative h-64 md:h-96 w-full">
                <img
                  src={newsItem.imageUrl || ''}
                  alt={newsItem.titulo}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 md:p-10 text-white">
                  {categoryName && (
                    <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full mb-3">
                      {categoryName}
                    </span>
                  )}
                  <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-2">
                    {newsItem.titulo}
                  </h1>
                  <div className="flex items-center text-sm md:text-base text-gray-200">
                    <span>{new Date(newsItem.fecha).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-10">
                <div className="prose prose-lg max-w-none text-gray-700">
                  {/* Render description with line breaks if needed, or just as text */}
                  {newsItem.descripcion.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </article>

            {newsItem && <CommentsSection noticiaId={newsItem.id} />}
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
    </div>
  );
};

export default NewsDetail;
