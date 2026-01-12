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

    if (!isHovered && items.length > 0) {
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

  if (loading || items.length === 0) {
    return null; // Or a loading spinner/placeholder
  }

  const currentItem = items[currentIndex];

  if (!currentItem) return null;

  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      {/* General Title */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center uppercase tracking-wide">
        INFORMACIÓN RELEVANTE
      </h2>
      
      <div
        className="relative w-full bg-white rounded-lg shadow-md overflow-hidden group flex flex-col md:flex-row h-auto min-h-[500px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Left: Image Section */}
      <div className="w-full md:w-1/2 h-64 md:h-auto relative">
        <div 
          className="w-full h-full bg-cover bg-center transition-all duration-500 ease-in-out"
          style={{ backgroundImage: `url(${currentItem.urlImagen})` }}
        />
        {/* Optional: Navigation Arrows on Image (Mobile or Style Choice) */}
      </div>

      {/* Right: Content Section */}
      <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center items-start text-left bg-white relative">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-cyan-500">
          {currentItem.titulo}
        </h2>
        <p className="text-lg md:text-xl mb-8 text-gray-600">
          {currentItem.descripcion}
        </p>

        {/* Buttons / Actions */}
        <div className="flex flex-wrap gap-4 items-center mb-6">
            {currentItem.url && (
                <a 
                href={currentItem.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300 font-bold text-lg shadow-md"
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
                 className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-300 font-bold text-lg shadow-md flex items-center gap-2"
                 >
                   <span>Comprar</span>
                 </a>
            )}

            {/* Price Display */}
            {currentItem.precio > 0 && (
                <span className="text-xl font-semibold text-gray-800 bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                    S/. {currentItem.precio}
                </span>
            )}
        </div>

        {/* Navigation Arrows (Absolute to the whole container, or just styled here) */}
        {/* Let's put arrows floating on the center vertical axis of the WHOLE card for strict carousel feel, 
            OR play it safe and put them bottom-right or similar.
            The user wants "uno por uno". Standard carousel arrows usually sit on the edges. 
            I'll put them absolute on the container.
        */}
      </div>
      
       {/* Global Arrows */}
      <button
        onClick={(e) => {
            e.stopPropagation();
            handlePrev();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-3 rounded-full shadow-md z-10 hover:scale-110 transition-all duration-200 focus:outline-none hidden md:block" // Hidden on mobile to avoid covering image? or keep? Block is fine.
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>

      <button
        onClick={(e) => {
            e.stopPropagation();
            handleNext();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-3 rounded-full shadow-md z-10 hover:scale-110 transition-all duration-200 focus:outline-none hidden md:block"
      >
        <ChevronRightIcon className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 shadow-sm ${
              index === currentIndex ? 'bg-blue-600 w-6' : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

    </div>
    </div>
  );
};

export default RelevantInfoCarousel;
