import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import {
  CheckIcon,
  PlayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/solid';

import Footer from '../../components/Footer';
import Header from '../../components/Header';
import ExpandableDescription from '../../components/ExpandableDescription';
import CommunitySection from '../../components/CommunitySection';
import { cursoService, Curso } from '../../services/cursoService';
import { getIdFromSlug, stripHtml } from '../../utils/urlUtils';
import { useAnalytics } from '../../hooks/useAnalytics'; // Keep analytics hook
import ShareButton from '../../components/ShareButton'; // Import ShareButton

interface CourseDetailProps {
  course: Curso | null;
  error?: string;
  url: string;
}

const CourseDetail = ({ course, error, url }: CourseDetailProps) => {
  const router = useRouter(); // Keep router if needed for fallback or navigation
  const { track } = useAnalytics();
  const [openSection, setOpenSection] = useState<number | null>(0);

  // Analytics tracking on mount
  useEffect(() => {
    if (course) {
      track('view_course', {
        course_id: String(course.id),
        course_name: course.nombre,
        category: course.categoriaId ? String(course.categoriaId) : 'sin_categoria',
      });
    }
  }, [course, track]);

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center">
            <p className="text-xl text-gray-600 mb-4">{error || 'Curso no encontrado'}</p>
            <button 
                onClick={() => router.push('/cursos')}
                className="text-primary font-bold hover:underline"
            >
                Volver a Cursos
            </button>
        </div>
        <Footer />
      </div>
    );
  }

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index);
  };

  const handleCTAClick = (ctaType: 'comprar' | 'inscribirse') => {
    if (course) {
      track('clic_accion_curso', {
        id_curso: String(course.id),
        nombre_curso: course.nombre,
        tipo_accion: ctaType,
        precio: course.precio,
      });
    }
  };

  // Helper to strip html for meta tags


  const learningPoints = course.loQueAprenderas
    ? course.loQueAprenderas.split('\n').filter((point) => point.trim() !== '')
    : [];

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Head>
        <title>{stripHtml(course.nombre)} | AVEND DOCENTE</title>
        <meta name="description" content={stripHtml(course.descripcion).substring(0, 160)} />
        <meta name="keywords" content={`${stripHtml(course.nombre)}, curso online, capacitación docente, educación`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${stripHtml(course.nombre)} | AVEND DOCENTE`} />
        <meta property="og:description" content={stripHtml(course.descripcion).substring(0, 160)} />
        <meta property="og:image" content={course.imagenUrl || '/assets/images/product1.jpg'} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={url} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${stripHtml(course.nombre)} | AVEND DOCENTE`} />
        <meta name="twitter:description" content={stripHtml(course.descripcion).substring(0, 160)} />
        <meta name="twitter:image" content={course.imagenUrl || '/assets/images/product1.jpg'} />
        
        {/* JSON-LD Structured Data for Course */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Course',
              name: stripHtml(course.nombre),
              description: stripHtml(course.descripcion),
              provider: {
                '@type': 'Organization',
                name: 'AVEND DOCENTE',
              },
              image: course.imagenUrl || '/assets/images/product1.jpg',
              offers: {
                '@type': 'Offer',
                price: course.precio,
                priceCurrency: 'PEN',
                availability: 'https://schema.org/InStock',
              },
              inLanguage: course.idioma || 'es',
              courseMode: 'online',
            }),
          }}
        />
      </Head>

      <div className="bg-white">
        <div className="w-full">
          <Header />
        </div>
      </div>

      <div className="bg-gray-900 text-white">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6">
            {/* Left side - Text Content */}
            <div className="lg:w-1/2 mb-8 lg:mb-0">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
                dangerouslySetInnerHTML={{ __html: course.nombre }}
              />
              <ExpandableDescription
                htmlContent={course.descripcion}
                className="text-lg text-gray-300 mb-6 leading-relaxed"
                maxLines={5}
              />

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300 mb-6">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Duración: {course.duracion}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  {course.idioma}
                </div>
              </div>
              
               {/* Share Button in Hero for visibility */}
               <div className="mt-4">
                  <ShareButton title={stripHtml(course.nombre)} url={url} className="text-black" />
               </div>

            </div>

            {/* Right side - Course Image */}
            <div className="lg:w-1/2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={course.imagenUrl || '/assets/images/product1.jpg'}
                  alt={stripHtml(course.nombre)}
                  className="w-full h-64 lg:h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-32 py-12">
        <div className="lg:grid lg:grid-cols-3 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Mobile CTA Card - Only visible on mobile */}
            <div className="lg:hidden bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-end mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    S/ {course.precio}.00
                  </span>
                  {course.precioOferta > 0 && (
                    <span className="ml-3 text-gray-500 line-through mb-1">
                      S/ {course.precioOferta}.00
                    </span>
                  )}
                  {course.precioOferta > 0 && (
                    <span className="ml-auto text-red-600 font-semibold text-sm">
                      {Math.round(
                        ((course.precio - course.precioOferta) /
                          course.precio) *
                          100
                      )}
                      % OFF
                    </span>
                  )}
                </div>

                <div className="text-red-600 text-sm font-medium mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  ¡Esta oferta termina pronto!
                </div>

                <a
                  href={`https://wa.me/${
                    course.numero
                  }?text=${encodeURIComponent(
                    `Hola! estoy interesado en ${stripHtml(course.nombre)}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors mb-3 shadow-md block text-center"
                >
                  Comprar ahora
                </a>

                <a
                  href={`https://wa.me/${course.numero}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center shadow-md mb-3"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  Chatea con nosotros
                </a>

                {/* Mobile share */}
                <div className="flex justify-center">
                    <ShareButton title={stripHtml(course.nombre)} url={url} />
                </div>
              </div>
            </div>

            {/* What you'll learn */}
            {learningPoints.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Lo que aprenderás
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {learningPoints.map((point, index) => (
                    <div key={index} className="flex items-start">
                      <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Content (Syllabus) */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Contenido del curso
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 last:border-0">
                  <button
                    onClick={() => toggleSection(0)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      {openSection === 0 ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-500 mr-3" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-500 mr-3" />
                      )}
                      <span className="font-semibold text-gray-900">
                        Temario
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {course.temas?.length || 0} clases
                    </span>
                  </button>
                  {openSection === 0 && (
                    <div className="px-6 py-2 bg-white">
                      <ul className="space-y-3 py-3">
                        {course.temas?.map((tema) => (
                          <li
                            key={tema.id}
                            className="flex items-center text-sm text-gray-600"
                          >
                            <PlayIcon className="w-4 h-4 text-gray-400 mr-3" />
                            <div className="flex flex-col">
                              <span className="font-medium">{tema.nombre}</span>
                              <span className="text-xs text-gray-400">
                                {tema.descripcion}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Descripción
              </h2>
              <ExpandableDescription
                htmlContent={course.descripcion}
                className="prose max-w-none text-gray-600"
                maxLines={5}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Video Preview */}
                {course.videoUrl ? (
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${
                        course.videoUrl.includes('v=') 
                          ? course.videoUrl.split('v=')[1]?.split('&')[0] 
                          : course.videoUrl.split('/').pop()
                      }`}
                      title={course.nombre}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="relative h-48 bg-black group cursor-default">
                    <img
                      src={course.imagenUrl || '/assets/images/product1.jpg'}
                      alt={course.nombre}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg opacity-50">
                        <PlayIcon className="w-8 h-8 text-black ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 text-center text-white font-semibold text-sm">
                      Vista previa del curso
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-end mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      S/ {course.precio}.00
                    </span>
                    {course.precioOferta > 0 && (
                      <span className="ml-3 text-gray-500 line-through mb-1">
                        S/ {course.precioOferta}.00
                      </span>
                    )}
                    {course.precioOferta > 0 && (
                      <span className="ml-auto text-red-600 font-semibold text-sm">
                        {Math.round(
                          ((course.precio - course.precioOferta) /
                            course.precio) *
                            100
                        )}
                        % OFF
                      </span>
                    )}
                  </div>

                  <div className="text-red-600 text-sm font-medium mb-6 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    ¡Esta oferta termina pronto!
                  </div>

                  <a
                    href={`https://wa.me/${
                      course.numero
                    }?text=${encodeURIComponent(
                      `Hola! estoy interesado en ${stripHtml(course.nombre)}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleCTAClick('comprar')}
                    className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors mb-3 shadow-md block text-center"
                  >
                    Comprar ahora
                  </a>

                  <a
                    href={`https://wa.me/${course.numero}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleCTAClick('inscribirse')}
                    className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center shadow-md mb-4"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                    Chatea con nosotros
                  </a>

                  {/* Sidebar share */}
                  <div className="flex justify-center">
                    <ShareButton title={stripHtml(course.nombre)} url={url} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-20">
          <CommunitySection />
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
  const url = `${protocol}://${host}/cursos/${id}`;
  
  const courseId = getIdFromSlug(id);
  
  if (!courseId) {
     return {
         props: {
             course: null,
             error: 'Curso no encontrado',
             url
         }
     };
  }

  try {
     const course = await cursoService.getById(courseId);
     return {
      props: {
        course,
        url,
      },
    };
  } catch (error) {
    console.error('Error fetching course:', error);
    return {
      props: {
        course: null,
        error: 'No se pudo cargar el curso',
        url,
      },
    };
  }
};

export default CourseDetail;
