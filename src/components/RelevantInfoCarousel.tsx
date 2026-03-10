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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth / 2 
        : scrollLeft + clientWidth / 2;
      
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50 rounded-3xl">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#002B6B] tracking-tight">
          Información Relevante
        </h2>
        <div className="mt-2 h-1.5 w-24 bg-primary mx-auto rounded-full opacity-20"></div>
      </div>

      <div className="relative group">
        {/* Navigation Buttons */}
        <button
          onClick={() => scroll('left')}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white shadow-xl border border-gray-100 text-gray-400 hover:text-primary transition-all opacity-0 group-hover:opacity-100 hidden md:flex active:scale-90"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white shadow-xl border border-gray-100 text-gray-400 hover:text-primary transition-all opacity-0 group-hover:opacity-100 hidden md:flex active:scale-90"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>

        {/* Horizontal Scrollable Container */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-6 pb-8 px-4 no-scrollbar snap-x snap-mandatory touch-pan-x md:justify-center"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item) => (
            <div 
              key={item.id}
              className="min-w-[280px] md:min-w-[320px] max-w-[320px] bg-white rounded-[2.5rem] shadow-lg border border-gray-100/50 overflow-hidden flex flex-col snap-start transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group/card"
            >
              <div className="relative h-56 w-full overflow-hidden bg-gray-50 flex items-center justify-center p-4">
                <img 
                  src={item.urlImagen} 
                  alt={item.titulo}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover/card:scale-105"
                />
              </div>

              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-lg md:text-xl font-bold text-gray-800 leading-tight mb-3 line-clamp-2 h-14">
                  {item.titulo}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1">
                  {item.descripcion}
                </p>

                <div className="flex flex-col gap-2">
                  <a 
                    href={item.url || '#'} 
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-gray-400 hover:text-gray-600 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    + Información
                  </a>
                  {item.telefono && (
                    <a 
                      href={`https://wa.me/${item.telefono.replace(/\D/g, '')}`} 
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-bold text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      Solicitar S/ {item.precio || 0}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <a 
          href="/informacion-relevante" 
          className="px-8 py-3 bg-white border-2 border-primary text-primary font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-primary/5 transition-all shadow-sm active:scale-95"
        >
          Ver todo
        </a>
      </div>
      
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default RelevantInfoCarousel;
