import React, { useState, useEffect } from 'react';

import About from '../components/About';
import Analytics from '../components/Analytics';
import ChannelsFooter from '../components/ChannelsFooter';
import FadeIn from '../components/FadeIn';
import Footer from '../components/Footer';
import Header from '../components/Header';
import LatestNews from '../components/LatestNews';
import LazyShow from '../components/LazyShow';
import MainHero from '../components/MainHero';
import MainHeroImage from '../components/MainHeroImage';
import config from '../config/index.json';
import { anuncioService } from '../services/anuncioService';

const App = () => {
    const { mainHero } = config;
    const [slides, setSlides] = useState<{ image: string; title?: string; description?: string; celular?: string; ruta?: string }[]>(
        mainHero.images ? mainHero.images.map((img: string) => ({ image: img })) : [{ image: mainHero.img }]
    );
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
                console.error('Error loading anuncios:', error);
            }
        };

        fetchAnuncios();
    }, []);

    useEffect(() => {
        if (slides.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [slides.length]);


  return (
    <div className={`bg-background grid gap-y-16 overflow-hidden`}>
      <div className={`relative bg-background`}>
        <div className="max-w-7xl mx-auto">
          <Header />
        </div>
        <div className="relative">
          <div className="max-w-7xl mx-auto relative">
            <div
              className={`relative z-10 pb-8 bg-background sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32`}
            >
              <FadeIn direction="right" padding={false}>
                <MainHero 
                    title={slides[currentIndex]?.title} 
                    description={slides[currentIndex]?.description} 
                    celular={slides[currentIndex]?.celular}
                    ruta={slides[currentIndex]?.ruta}
                />
              </FadeIn>
            </div>
            <FadeIn direction="left" delay={0.2} padding={false}>
              <MainHeroImage slides={slides} currentIndex={currentIndex} />
            </FadeIn>
          </div>
        </div>
      </div>
      <FadeIn direction="up">
        <LatestNews />
      </FadeIn>
      <LazyShow>
        <>
          <About />
        </>
      </LazyShow>
      <Analytics />
      <ChannelsFooter />
      <Footer />
    </div>
  );
};

export default App;
