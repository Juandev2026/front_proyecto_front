import React from 'react';

import { DocumentTextIcon } from '@heroicons/react/outline';
import { GetServerSideProps } from 'next';
import Head from 'next/head';

import AdSidebar from '../../components/AdSidebar';
import MainLayout from '../../components/MainLayout';
import ShareButton from '../../components/ShareButton';
import {
  NormaLegal,
  normasLegalesService,
} from '../../services/normasLegalesService';
import { stripHtml } from '../../utils/urlUtils';

interface NormaLegalDetailProps {
  norma: NormaLegal | null;
  error?: string;
  url: string;
}

const NormaLegalDetail = ({ norma, error, url }: NormaLegalDetailProps) => {
  if (error || !norma) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Norma no encontrada
            </h1>
            <p className="text-gray-500 mb-6">
              {error || 'La norma que buscas no existe o ha sido eliminada.'}
            </p>
            <a href="/normas-legales" className="text-primary hover:underline">
              Volver a Normas Legales
            </a>
          </div>
        </div>
      </MainLayout>
    );
  }

  const plainDescription = stripHtml(norma.descripcion);
  // Ensure image URL is absolute for OG tags if possible, or use a default
  // Ideally, the backend gives a full URL. If not, we might need to prepend base URL.
  // Assuming norma.imagenUrl is full or relative to public.
  // If it's a relative path starting with /, we need to prepend the domain.
  // For safety, we can rely on what's provided or add a fallback.

  return (
    <MainLayout>
      <Head>
        <title>{stripHtml(norma.nombre)} | Normas Legales</title>
        <meta name="description" content={plainDescription.substring(0, 160)} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={stripHtml(norma.nombre)} />
        <meta
          property="og:description"
          content={plainDescription.substring(0, 160)}
        />
        {norma.imagenUrl && (
          <meta property="og:image" content={norma.imagenUrl} />
        )}

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={url} />
        <meta property="twitter:title" content={stripHtml(norma.nombre)} />
        <meta
          property="twitter:description"
          content={plainDescription.substring(0, 160)}
        />
        {norma.imagenUrl && (
          <meta property="twitter:image" content={norma.imagenUrl} />
        )}
      </Head>

      <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header Image */}
              <div className="relative h-64 sm:h-80 w-full bg-gray-200">
                {norma.imagenUrl ? (
                  <img
                    src={norma.imagenUrl}
                    alt={norma.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50">
                    <DocumentTextIcon className="h-24 w-24 text-blue-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                  <h1
                    className="text-3xl sm:text-4xl font-extrabold text-white leading-tight shadow-sm"
                    dangerouslySetInnerHTML={{ __html: norma.nombre }}
                  />
                </div>
              </div>

              <div className="p-8 sm:p-12">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 border-b border-gray-100 pb-8 gap-4">
                  <div className="flex space-x-4">
                    <a
                      href={norma.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:scale-105"
                    >
                      <DocumentTextIcon className="h-5 w-5 mr-2" />
                      Descargar PDF
                    </a>
                  </div>
                  <ShareButton
                    title={stripHtml(norma.nombre)}
                    url={url}
                    className="w-full sm:w-auto"
                  />
                </div>

                <div className="prose prose-lg max-w-none text-gray-600">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Descripción
                  </h3>
                  <div
                    dangerouslySetInnerHTML={{ __html: norma.descripcion }}
                  />
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100">
                  <a
                    href="/normas-legales"
                    className="text-primary font-semibold hover:text-blue-700 inline-flex items-center"
                  >
                    &larr; Volver a la lista de normas
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <AdSidebar />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  // Construct absolute URL for OG tags
  // host includes port in dev, domain in prod
  const protocol = context.req.headers['x-forwarded-proto'] || 'http';
  const { host } = context.req.headers;
  const url = `${protocol}://${host}/normas-legales/${id}`;

  try {
    const norma = await normasLegalesService.getById(Number(id));
    return {
      props: {
        norma,
        url,
      },
    };
  } catch (error) {
    console.error('Error fetching norma detail:', error);
    return {
      props: {
        norma: null,
        error: 'No se pudo cargar la información de la norma.',
        url,
      },
    };
  }
};

export default NormaLegalDetail;
