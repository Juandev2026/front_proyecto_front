import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { ArrowLeftIcon, LockClosedIcon, DownloadIcon, DocumentTextIcon, PhotographIcon } from '@heroicons/react/outline';

import Footer from '../../components/Footer';
import Header from '../../components/Header';
import AdSidebar from '../../components/AdSidebar';
import ExpandableDescription from '../../components/ExpandableDescription';
import CommunitySection from '../../components/CommunitySection';
import ShareButton from '../../components/ShareButton'; // Import ShareButton
import { materialService, Material } from '../../services/materialService';
import { createSlug, getIdFromSlug } from '../../utils/urlUtils';

interface MaterialDetailProps {
  material: Material | null;
  featuredMaterials: Material[];
  error?: string;
  url: string;
}

const MaterialPreview = ({ material, featuredMaterials, error, url }: MaterialDetailProps) => {
  const router = useRouter();

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
        <Footer />
      </div>
    );
  }

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '');
  };

  const plainDescription = stripHtml(material.descripcion);
  const isPdf = material.url?.toLowerCase().endsWith('.pdf');
  
  // Logic to determine display image for OG tags and thumbnail
  const displayImage = material.imageUrl || 
                       (material.url && /\.(jpeg|jpg|gif|png|webp)$/i.test(material.url) ? material.url : null);


  const getWhatsAppUrl = () => {
    if (!material) return '#';
    const message = encodeURIComponent(
      `Hola, me interesa comprar el recurso: "${stripHtml(material.titulo)}" - Precio: S/ ${material.precio?.toFixed(2)}`
    );
    return `https://wa.me/${material.telefono || ''}?text=${message}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Head>
        <title>{stripHtml(material.titulo)} | Centro de Recursos</title>
        <meta name="description" content={plainDescription.substring(0, 160)} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${stripHtml(material.titulo)} | Centro de Recursos`} />
        <meta property="og:description" content={plainDescription.substring(0, 160)} />
        {displayImage && <meta property="og:image" content={displayImage} />}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${stripHtml(material.titulo)} | Centro de Recursos`} />
        <meta name="twitter:description" content={plainDescription.substring(0, 160)} />
        {displayImage && <meta name="twitter:image" content={displayImage} />}
      </Head>

      <div className="relative bg-background">
        <div className="w-full">
          <Header />
        </div>
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
            <Link href="/materials">
            <span className="inline-flex items-center text-gray-600 hover:text-primary transition-colors group cursor-pointer">
                <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Volver a Recursos
            </span>
            </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Main Content (8/12) */}
            <div className="lg:col-span-8 mx-auto w-full max-w-4xl lg:max-w-none lg:mx-0">
                {/* Thumbnail Section - Always Visible */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                    <div className="relative h-auto">
                        {(() => {
                            if (displayImage) {
                                return (
                                    <img 
                                        src={displayImage} 
                                        alt={material.titulo} 
                                        className="w-full h-auto object-contain"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                );
                            } else {
                                return (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <PhotographIcon className="w-20 h-20 text-gray-400" />
                                    </div>
                                );
                            }
                        })()}
                         {/* Price Tag Overlay */}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full px-6 py-2 shadow-lg z-10">
                             <span className="text-xl font-bold text-primary">
                                {material.precio && material.precio > 0 ? `S/ ${material.precio.toFixed(2)}` : 'Gratis'}
                            </span>
                        </div>
                </div>
                </div>

                {/* Title and Description Section - Right after thumbnail */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                <div className="p-6 md:p-8 border-b border-gray-100">
                    <div className="flex justify-between items-start gap-4 mb-4">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900" dangerouslySetInnerHTML={{ __html: stripHtml(material.titulo) }}></h1>
                        <div className="flex-shrink-0 pt-1">
                            <ShareButton title={stripHtml(material.titulo)} url={url} />
                        </div>
                    </div>
                    
                    {/* Category Badge */}
                    {material.categoria && (
                        <div className="mb-4">
                            <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1 rounded-full">
                                {material.categoria.nombre}
                            </span>
                        </div>
                    )}
                    
                    <ExpandableDescription
                      htmlContent={material.descripcion}
                      className="text-gray-600 text-base md:text-lg leading-relaxed prose prose-lg max-w-none"
                      maxLines={5}
                    />
                    
                    {/* Price and Action Button */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 mt-6 pt-6 border-t border-gray-100">
                        {material.precio && material.precio > 0 ? (
                            <>
                                <div className="bg-primary/10 rounded-lg px-4 py-2">
                                    <span className="text-2xl font-bold text-primary">
                                        S/ {material.precio.toFixed(2)}
                                    </span>
                                </div>
                                <a
                                    href={getWhatsAppUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    Comprar por WhatsApp
                                </a>
                            </>
                        ) : (
                            <>
                                <div className="bg-primary/10 rounded-lg px-4 py-2">
                                    <span className="text-2xl font-bold text-primary">
                                        Gratis
                                    </span>
                                </div>
                                <a
                                    href={material.url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center bg-primary hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
                                >
                                    <DownloadIcon className="w-5 h-5 mr-2" />
                                    Descargar
                                </a>
                            </>
                        )}
                    </div>
                </div>
                </div>

                {/* PDF Viewer Section - After Description */}
                {isPdf && (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                        <div className="p-6 md:p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Documento Adjunto</h2>
                            <div className="relative h-[600px] bg-gray-100 rounded-lg overflow-hidden">
                                <iframe
                                    src={`${material.url}#toolbar=${material.precio && material.precio > 0 ? '0' : '1'}&navpanes=0&scrollbar=${material.precio && material.precio > 0 ? '0' : '1'}&view=FitH${material.precio && material.precio > 0 ? '&page=1' : ''}`}
                                    className="w-full h-full border-none"
                                    title="Vista previa del documento"
                                />
                                {/* Premium Overlay for PDF */}
                                {material.precio && material.precio > 0 && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent z-10 flex flex-col items-center justify-center p-8 text-center">
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-md shadow-2xl">
                                            <LockClosedIcon className="w-16 h-16 text-white mx-auto mb-4 opacity-80" />
                                            <h3 className="text-2xl font-bold text-white mb-2">Vista Previa Limitada</h3>
                                            <p className="text-white/80 mb-6">
                                                Adquiere este material para visualizar el contenido completo y descargar los archivos adjuntos.
                                            </p>
                                            <a
                                                href={getWhatsAppUrl()}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3 rounded-full transition-transform transform hover:scale-105"
                                            >
                                                Comprar ahora
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Attachments Section (Anexos) */}
                {(material.archivoUrl || (isPdf && (!material.precio || material.precio === 0))) && (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Anexos y Descargas</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {material.archivoUrl && (
                                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-red-50 p-2 rounded-lg group-hover:bg-red-100 transition-colors">
                                            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Material Principal</h4>
                                            <p className="text-sm text-gray-500">Documento completo</p>
                                        </div>
                                    </div>
                                    <a 
                                        href={material.archivoUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        download
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                    >
                                        Descargar
                                    </a>
                                </div>
                            )}

                            {!material.archivoUrl && isPdf && (!material.precio || material.precio === 0) && (
                                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-red-50 p-2 rounded-lg group-hover:bg-red-100 transition-colors">
                                            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Documento PDF</h4>
                                            <p className="text-sm text-gray-500">Visualizar / Descargar</p>
                                        </div>
                                    </div>
                                    <a 
                                        href={material.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        download
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                    >
                                        Ver Archivo
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            {/* Video Section - If videoUrl exists */}
            {material.videoUrl && (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                    <div className="p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-red-100 p-2 rounded-lg">
                                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Video Explicativo</h2>
                        </div>
                        <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${
                                    material.videoUrl.includes('v=') 
                                        ? material.videoUrl.split('v=')[1]?.split('&')[0] 
                                        : material.videoUrl.split('/').pop()
                                }`}
                                title="Video del recurso"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}

            {/* Community Section outside the card but in the main column */}
            <div className="mt-12">
                <CommunitySection />
            </div>
            </div>

            {/* Middle Column: Últimos Recursos (2/12) */}
            <aside className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h3 className="text-xl font-bold text-white">Últimos Recursos</h3>
                </div>
                <div className="p-4 space-y-4">
                {featuredMaterials.map((featured) => (
                    <Link key={featured.id} href={`/materials/${createSlug(featured.titulo, featured.id)}`}>
                    <a className="block group">
                        <div className="relative overflow-hidden rounded-lg mb-2 bg-gray-100 h-32 flex items-center justify-center">
                         {/* Thumbnail for Sidebar Items */}
                         {featured.imageUrl ? (
                             <img src={featured.imageUrl} alt={featured.titulo} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300" />
                         ) : 
                        featured.url && /\.(jpeg|jpg|gif|png|webp)$/i.test(featured.url) ? (
                            <img
                            src={featured.url}
                            alt={featured.titulo}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                            />
                        ) : (
                            <DocumentTextIcon className="w-12 h-12 text-gray-400" />
                        )}
                        </div>
                        <h4
                        className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1"
                        dangerouslySetInnerHTML={{ __html: stripHtml(featured.titulo) }}
                        />
                        <p className="text-xs text-primary font-bold">
                        {featured.precio && featured.precio > 0 ? `S/ ${featured.precio}` : 'Gratis'}
                        </p>
                    </a>
                    </Link>
                ))}
                 {featuredMaterials.length === 0 && (
                     <p className="text-sm text-gray-500 text-center py-4">No hay otros recursos recientes.</p>
                 )}
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
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { id } = context.params as { id: string };
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers.host;
    const url = `${protocol}://${host}/materials/${id}`;
    
    // Parse ID from slug
    const materialId = getIdFromSlug(id);

    if (!materialId) {
        return {
            props: {
                material: null,
                featuredMaterials: [],
                error: 'Material no encontrado',
                url
            }
        };
    }

    try {
        const material = await materialService.getById(materialId);
        
        // Fetch featured (latest) materials
        let featuredMaterials: Material[] = [];
        try {
             const allMaterials = await materialService.getAll();
             featuredMaterials = allMaterials
                .filter((m) => m.id !== materialId)
                .sort((a, b) => b.id - a.id)
                .slice(0, 5);
        } catch(e) {
            console.error('Error fetching latest materials:', e);
        }

        return {
            props: {
                material,
                featuredMaterials,
                url
            }
        };

    } catch (error) {
        console.error('Error fetching material:', error);
        return {
            props: {
                material: null,
                featuredMaterials: [],
                error: 'No se pudo cargar el material',
                url
            }
        };
    }
}

export default MaterialPreview;
