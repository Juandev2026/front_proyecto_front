import React, { useState, useEffect } from 'react';

import { ArrowLeftIcon, LockClosedIcon } from '@heroicons/react/outline';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Footer from '../../components/Footer';
import Header from '../../components/Header';
import { materialService, Material } from '../../services/materialService';

const MaterialPreview = () => {
  const router = useRouter();
  const { id } = router.query;
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchMaterial = async () => {
      try {
        setLoading(true);
        const data = await materialService.getById(Number(id));
        setMaterial(data);
      } catch (err) {
        setError('No se pudo cargar el material');
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [id]);

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '');
  };

  const getWhatsAppUrl = () => {
    if (!material) return '#';
    const message = encodeURIComponent(
      `Hola, me interesa comprar el recurso: "${stripHtml(material.titulo)}" - Precio: S/ ${material.precio?.toFixed(2)}`
    );
    return `https://wa.me/${material.telefono || ''}?text=${message}`;
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen font-sans">
        <div className="relative bg-background">
          <div className="w-full">
            <Header />
          </div>
        </div>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="bg-white min-h-screen font-sans">
        <div className="relative bg-background">
          <div className="w-full">
            <Header />
          </div>
        </div>
        <div className="flex flex-col justify-center items-center h-96 text-center px-4">
          <p className="text-xl text-gray-500 mb-4">{error || 'Material no encontrado'}</p>
          <Link href="/materials">
            <span className="text-primary hover:underline cursor-pointer">← Volver a Recursos</span>
          </Link>
        </div>
      </div>
    );
  }

  const isPdf = material.url?.toLowerCase().endsWith('.pdf');

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Head>
        <title>{stripHtml(material.titulo)} | Centro de Recursos</title>
      </Head>

      <div className="relative bg-background">
        <div className="w-full">
          <Header />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/materials">
          <span className="inline-flex items-center text-gray-600 hover:text-primary transition-colors mb-6 group cursor-pointer">
            <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Volver a Recursos
          </span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Preview Section */}
          <div className="relative">
            {/* Document Preview */}
            <div className="relative h-[500px] md:h-[600px] bg-gray-100 overflow-hidden">
              {isPdf ? (
                <div className="w-full h-full relative">
                  {/* PDF Preview - First page only */}
                  <iframe
                    src={`${material.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&page=1`}
                    className="w-full h-full border-none"
                    title="Vista previa del documento"
                  />
                  {/* Overlay to prevent interaction */}
                  <div className="absolute inset-0 bg-transparent z-10"></div>
                </div>
              ) : material.url && /\.(jpeg|jpg|gif|png|webp)$/i.test(material.url) ? (
                <img
                  src={material.url}
                  alt={material.titulo}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <svg
                    className="w-32 h-32 text-primary/20"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                </div>
              )}

              {/* Lock Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 flex flex-col items-center justify-end pb-12">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mx-4 text-center border border-white/20 max-w-md">
                  <div className="bg-primary/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <LockClosedIcon className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Contenido Premium
                  </h2>
                  <p className="text-white/80 mb-6 text-sm md:text-base">
                    Debes comprar este recurso para poder visualizarlo completo.
                    Contáctanos por WhatsApp para adquirirlo.
                  </p>
                  <a
                    href={getWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 rounded-full text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto"
                  >
                    <svg
                      className="w-6 h-6 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Comprar por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Material Info */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  {stripHtml(material.titulo)}
                </h1>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                  {stripHtml(material.descripcion)}
                </p>
              </div>

              <div className="flex flex-col items-start md:items-end gap-3 md:ml-8">
                <div className="bg-primary/10 rounded-lg px-4 py-2">
                  <span className="text-3xl font-bold text-primary">
                    S/ {material.precio?.toFixed(2)}
                  </span>
                </div>
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Comprar ahora
                </a>
              </div>
            </div>

            {/* Category Badge */}
            {material.categoria && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1 rounded-full">
                  {material.categoria.nombre}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MaterialPreview;
