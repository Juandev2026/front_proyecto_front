import React, { useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline';
import {
  informacionRelevanteService,
  InformacionRelevante,
} from '../services/informacionRelevanteService';

const RelevantInfoCarousel = () => {
  const [items, setItems] = useState<InformacionRelevante[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await informacionRelevanteService.getAll();
        setItems(data);
      } catch (error) {
        console.error('Error fetching relevant info:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-scroll logic (Interval based)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (!isHovered && items.length > 1) {
      intervalId = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
      }, 3000);
    }

    return () => clearInterval(intervalId);
  }, [items, isHovered]);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Cargando...</div>; 
  }
  
  if (items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];

  if (!currentItem) return null;

  return (
    <div className="w-full max-w-7xl mx-auto mb-8 px-4 sm:px-6 lg:px-8">
      {/* General Title */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center uppercase tracking-wide">
        INFORMACIÓN RELEVANTE
      </h2>
      
      <div
        className="relative w-full bg-white rounded-2xl shadow-xl overflow-hidden group flex flex-col md:flex-row h-auto min-h-[500px] border border-gray-100"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
      >
        {/* Left: Image Section */}
        <div className="w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden">
          <div 
            className="w-full h-full bg-cover bg-center transition-transform duration-700 ease-in-out hover:scale-105"
            style={{ backgroundImage: `url(${currentItem.urlImagen})` }}
          />
        </div>

        {/* Right: Content Section */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center items-start text-left bg-white relative">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 text-cyan-500 leading-tight">
            {currentItem.titulo}
          </h2>
          <p className="text-base md:text-lg mb-6 md:mb-8 text-gray-600 leading-relaxed">
            {currentItem.descripcion}
          </p>

          {/* Buttons / Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6 w-full">
              <div className="flex gap-2 flex-1">
                {currentItem.url && (
                    <a 
                    href={currentItem.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center"
                    >
                    Ver más
                    </a>
                )}
                
                {/* WhatsApp / Buy Button */}
                {currentItem.telefono && (
                    <a 
                    href={`https://wa.me/${currentItem.telefono.replace(/\s+/g, '')}?text=Hola, estoy interesado en ${encodeURIComponent(currentItem.titulo)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-300 font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <span>Comprar</span>
                    </a>
                )}
              </div>

              {/* Price Display */}
              {currentItem.precio > 0 && (
                  <div className="flex justify-center sm:justify-start">
                    <span className="text-xl font-bold text-gray-800 bg-blue-50 px-5 py-2 rounded-lg border border-blue-100 shadow-sm whitespace-nowrap">
                        S/. {currentItem.precio.toFixed(2)}
                    </span>
                  </div>
              )}
          </div>
        </div>
        
        {/* Global Arrows - Visible on all screens now */ }
        {items.length > 1 && (
          <>
            <button
              onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
              }}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 md:p-3 rounded-full shadow-lg z-20 active:scale-95 transition-all duration-200 focus:outline-none flex items-center justify-center backdrop-blur-sm"
              aria-label="Anterior"
            >
              <ChevronLeftIcon className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <button
              onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
              }}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 md:p-3 rounded-full shadow-lg z-20 active:scale-95 transition-all duration-200 focus:outline-none flex items-center justify-center backdrop-blur-sm"
              aria-label="Siguiente"
            >
              <ChevronRightIcon className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {items.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`transition-all duration-300 shadow-sm ${
                  index === currentIndex 
                    ? 'bg-blue-600 w-8 h-2 rounded-full' 
                    : 'bg-gray-300 w-2 h-2 rounded-full hover:bg-gray-400'
                }`}
                aria-label={`Ir a diapositiva ${index + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default RelevantInfoCarousel;
