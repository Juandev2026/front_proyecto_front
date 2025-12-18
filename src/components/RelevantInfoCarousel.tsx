import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  informacionRelevanteService,
  InformacionRelevante,
} from '../services/informacionRelevanteService';

const RelevantInfoCarousel = () => {
  const [items, setItems] = useState<InformacionRelevante[]>([]);
  const [width, setWidth] = useState(0);
  const carousel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await informacionRelevanteService.getAll();
        if (data.length > 0) {
          setItems(data);
        }
      } catch (error) {
        console.error('Error fetching relevant info:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (carousel.current) {
      setWidth(carousel.current.scrollWidth - carousel.current.offsetWidth);
    }
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="pb-12 pt-0 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Información Relevante
          </h2>
          <p className="mt-4 text-xl text-gray-500">
            Descubre las últimas novedades y enlaces de interés
          </p>
        </div>

        <motion.div
          ref={carousel}
          className="cursor-grab overflow-hidden"
          whileTap={{ cursor: 'grabbing' }}
        >
          <motion.div
            drag="x"
            dragConstraints={{ right: 0, left: -width }}
            className="flex space-x-6 pb-8"
          >
            {items.map((item) => (
              <motion.div
                key={item.id}
                className="min-w-[300px] w-[300px] md:min-w-[350px] md:w-[350px] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 flex-shrink-0 relative group"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={item.urlImagen || '/assets/images/placeholder.jpg'}
                    alt={item.titulo}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                    {item.titulo}
                  </h3>
                  <p className="text-base text-gray-500 mb-4 line-clamp-3 h-[4.5em]">
                    {item.descripcion}
                  </p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary font-semibold hover:text-blue-700 transition-colors group-hover:underline"
                  >
                    Ver más
                    <svg
                      className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default RelevantInfoCarousel;
