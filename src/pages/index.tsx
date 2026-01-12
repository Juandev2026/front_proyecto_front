import React, { useState, useEffect } from 'react';

import About from '../components/About';
import Analytics from '../components/Analytics';

import FadeIn from '../components/FadeIn';
import Footer from '../components/Footer';
import Header from '../components/Header';
import LatestNews from '../components/LatestNews';
import LazyShow from '../components/LazyShow';
import MainHero from '../components/MainHero';
import MainHeroImage from '../components/MainHeroImage';
import RelevantInfoCarousel from '../components/RelevantInfoCarousel';
import SEO from '../components/SEO';

import { anuncioService } from '../services/anuncioService';




const App = () => {
  // const { mainHero } = config; // Removed unused variable
  const [slides, setSlides] = useState<
    {
      image: string;
      title?: string;
      description?: string;
      celular?: string;
      ruta?: string;
      precio?: number;
    }[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchAnuncios = async () => {
      try {
        const anuncios = await anuncioService.getAll();
        if (anuncios.length > 0) {
          const formattedSlides = anuncios
            .filter((a) => a.imagenUrl)
            .map((a) => ({
              image: a.imagenUrl,
              title: a.titulo,
              description: a.descripcion,
              celular: a.celular,
              ruta: a.ruta,
              precio: a.precio,
            }));

          if (formattedSlides.length > 0) {
            setSlides(formattedSlides);
          }
        }
      } catch (error) {
        // console.error('Error loading anuncios:', error);
      }
    };

    fetchAnuncios();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length, currentIndex]);

  // Determine content to display: if no slides, show fallback.
  const displaySlides = slides.length > 0 ? slides : [{
    image: '/assets/images/no_ads_character.png', // Updated with the new generated character
    title: 'No hay anuncios el día de hoy',
    description: 'Mantente atento a nuestras próximas novedades y comunicados.',
    celular: '',
    ruta: '',
    precio: 0,
    objectFit: 'contain' as const
  }];

  // If we are using the fallback, we effectively have 1 slide, so currentIndex 0 is correct.

  return (
    <div className={`bg-background grid gap-y-16 overflow-hidden`}>
      <SEO
        title="Academia - Educación de Calidad para Docentes y Estudiantes"
        description="Plataforma educativa con cursos de preparación para nombramiento docente, ascenso y contrato. Noticias educativas, recursos y capacitación para docentes del MINEDU."
        keywords="nombramiento docente, ascenso docente, contrato docente, MINEDU, capacitación, cursos para docentes, educación Perú"
      />
      <div className={`relative bg-background overflow-hidden`}>
        <div className="w-full">
          <Header />
        </div>
        
        <div className="w-full px-4 md:px-8">
          <LazyShow>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transform transition-all hover:shadow-2xl duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Image Column (Left) */}
                <div className="relative h-[600px] lg:h-auto min-h-[600px] group overflow-hidden">
                  <MainHeroImage slides={displaySlides} currentIndex={currentIndex} />
                  
                  {/* Navigation Arrows - Overlaying the image */}
                  {displaySlides.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setCurrentIndex((prev) =>
                            prev === 0 ? displaySlides.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 p-2 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-white/50 transition-all shadow-lg border border-white/20 opacity-0 group-hover:opacity-100"
                        aria-label="Anterior"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          setCurrentIndex((prev) => (prev + 1) % displaySlides.length)
                        }
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 p-2 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-white/50 transition-all shadow-lg border border-white/20 opacity-0 group-hover:opacity-100"
                        aria-label="Siguiente"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Text Column (Right) */}
                <div className="flex flex-col justify-center">
                  <MainHero
                    title={displaySlides[currentIndex]?.title}
                    description={displaySlides[currentIndex]?.description}
                    celular={displaySlides[currentIndex]?.celular}
                    ruta={displaySlides[currentIndex]?.ruta}
                    precio={displaySlides[currentIndex]?.precio}
                  />
                </div>
              </div>
            </div>
          </LazyShow>
        </div>
      </div>
      <FadeIn direction="up">
        <LatestNews />
      </FadeIn>
      <RelevantInfoCarousel />
      <LazyShow>
        <>
          <About />
        </>
      </LazyShow>
      
      

      <Analytics />
      <Footer />
    </div>
  );
};

export default App;