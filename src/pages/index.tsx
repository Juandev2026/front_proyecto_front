import React, { useState, useEffect } from 'react';

import About from '../components/About';
import Analytics from '../components/Analytics';
// import ChannelsFooter from '../components/ChannelsFooter';
import FadeIn from '../components/FadeIn';
import Footer from '../components/Footer';
import Header from '../components/Header';
import LatestNews from '../components/LatestNews';
import LazyShow from '../components/LazyShow';
import MainHero from '../components/MainHero';
import MainHeroImage from '../components/MainHeroImage';
import RelevantInfoCarousel from '../components/RelevantInfoCarousel';
import SocialMediaFrames from '../components/SocialMediaFrames';
import config from '../config/index.json';
import { anuncioService } from '../services/anuncioService';


const App = () => {
  const { mainHero } = config;
  const [slides, setSlides] = useState<
    {
      image: string;
      title?: string;
      description?: string;
      celular?: string;
      ruta?: string;
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

  if (slides.length === 0) {
    return (
        <div className="bg-background min-h-screen flex flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-pulse flex flex-col space-y-4 w-full max-w-7xl mx-auto px-4">
                   <div className="h-64 sm:h-96 bg-gray-200 rounded-xl w-full"></div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className={`bg-background grid gap-y-16 overflow-hidden`}>
      <div className={`relative bg-background`}>
        <div className="w-full">
          <Header />
        </div>
        <div className="relative">
          <div className="w-full mx-auto relative">
            <MainHeroImage slides={slides} currentIndex={currentIndex} />

            <div
              className={`relative z-10 pb-8 bg-transparent sm:pb-16 md:pb-20 lg:w-full lg:max-w-none lg:pb-28 xl:pb-32 pointer-events-none`}
            >
              <div className="pointer-events-auto max-w-7xl">
                <FadeIn direction="right" padding={false}>
                  <MainHero
                    title={slides[currentIndex]?.title}
                    description={slides[currentIndex]?.description}
                    celular={slides[currentIndex]?.celular}
                    ruta={slides[currentIndex]?.ruta}
                  />
                </FadeIn>
              </div>
            </div>

            {slides.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      prev === 0 ? slides.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 p-3 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-all shadow-lg border border-white/20 group hover:scale-110"
                  aria-label="Anterior"
                >
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8"
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
                    setCurrentIndex((prev) => (prev + 1) % slides.length)
                  }
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 p-3 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-all shadow-lg border border-white/20 group hover:scale-110"
                  aria-label="Siguiente"
                >
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8"
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
      <SocialMediaFrames />
      <Footer />
    </div>
  );
};

export default App;
