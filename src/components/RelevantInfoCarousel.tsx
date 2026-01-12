import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline';
import {
  informacionRelevanteService,
  InformacionRelevante,
} from '../services/informacionRelevanteService';

const RelevantInfoCarousel = () => {
  const [items, setItems] = useState<InformacionRelevante[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
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
        if (scrollRef.current) {
           const container = scrollRef.current;
           const scrollAmount = 532; // Card width (500) + gap/margin (approx 32)
           
           // If close to end, reset to 0 (or start) to loop
           // Simple loop check: if scrollLeft + clientWidth >= scrollWidth - small_buffer
           // specific check for duplicated list loop:
           if (container.scrollLeft >= container.scrollWidth / 2) {
              container.scrollLeft = 0;
           }

           container.scrollTo({
              left: container.scrollLeft + scrollAmount,
              behavior: 'smooth'
           });
        }
      }, 3000); // 3 seconds
    }

    return () => clearInterval(intervalId);
  }, [items, isHovered]);

  const scrollManual = (direction: 'left' | 'right') => {
      if (scrollRef.current) {
          const container = scrollRef.current;
          const scrollAmount = 532; 
          const targetScroll = container.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
          
          container.scrollTo({
              left: targetScroll,
              behavior: 'smooth'
          });
      }
  };

  if (loading || items.length === 0) {
    return null;
  }

  // Duplicate items enough times to ensure smooth scrolling
  // 10 times to be safe for really wide screens
  const duplicatedItems = [...items, ...items, ...items, ...items, ...items, ...items]; 

  return (
    <div className="w-full bg-gray-50 py-8 relative group"
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-[1920px] mx-auto px-4 md:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Información Relevante
        </h2>
        
        <div className="relative">
            {/* Buttons */}
            <button 
                onClick={() => scrollManual('left')}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg text-gray-800 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 focus:outline-none"
                aria-label="Anterior"
            >
                <ChevronLeftIcon className="w-8 h-8" />
            </button>
            
            <button 
                onClick={() => scrollManual('right')}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg text-gray-800 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 focus:outline-none"
                aria-label="Siguiente"
            >
                <ChevronRightIcon className="w-8 h-8" />
            </button>

            {/* Carousel Container */}
            <div 
                ref={scrollRef}
                className="flex overflow-x-hidden gap-8 pb-4"
                style={{ scrollBehavior: 'smooth' }} 
            >
            {duplicatedItems.map((item, index) => (
                <div
                key={`${item.id}-${index}`}
                className="flex-shrink-0 w-[500px] group/card bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col snap-start"
                >
                <div className="aspect-video w-full overflow-hidden relative">
                    <img
                    src={item.urlImagen || 'https://via.placeholder.com/300x169'}
                    alt={item.titulo}
                    className="w-full h-full object-cover transform group-hover/card:scale-110 transition-transform duration-500"
                    />
                </div>
                <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-2 mb-2">
                    {item.titulo}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-grow">
                    {item.descripcion}
                    </p>
                    
                    <div className="space-y-3 mt-auto">
                        {(item.precio > 0 || item.telefono) && (
                            <div className="flex items-center justify-between text-sm font-semibold">
                            {item.precio > 0 && <span className="text-green-600 text-lg">S/ {item.precio}</span>}
                            </div>
                        )}

                        <div className="flex gap-2">
                            {item.telefono && (
                                <a 
                                    href={`https://wa.me/${item.telefono.replace(/\D/g, '')}?text=Hola, me interesa: ${item.titulo}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <span>Comprar</span>
                                </a>
                            )}
                            {item.url && (
                                <a 
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                                >
                                    Ver más
                                </a>
                            )}
                        </div>
                    </div>
                </div>
                </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default RelevantInfoCarousel;
