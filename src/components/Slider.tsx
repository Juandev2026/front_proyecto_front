import React from 'react';

import { motion, AnimatePresence } from 'framer-motion';

interface Slide {
  image: string;
  title?: string;
  description?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

interface SliderProps {
  slides: Slide[];
  currentIndex: number;
}

const Slider: React.FC<SliderProps> = ({ slides, currentIndex }) => {
  if (!slides || slides.length === 0) {
    return null;
  }

  const currentSlide = slides[currentIndex];
  if (!currentSlide) return null;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg shadow-xl group">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <img
            src={currentSlide.image}
            alt={currentSlide.title || `Slide ${currentIndex}`}
            className={`w-full h-full ${
              currentSlide.objectFit === 'contain'
                ? 'object-contain bg-gray-50'
                : 'object-cover'
            }`}
          />
        </motion.div>
      </AnimatePresence>

      {/* Indicators (dots) need to be handled by parent or removed/kept read-only? 
           If kept, they need an onChange handler. For now, removing interactive dots or keeping them read-only visual.
           Let's keep them purely visual for now since the prompt didn't ask for interactive dots, just sync. 
           Actually, let's remove them to simplify if not requested, or keep them as visual indicators.
       */}
    </div>
  );
};

export default Slider;
