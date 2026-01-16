import React from 'react';

import Slider from './Slider';

interface MainHeroImageProps {
  slides: {
    image: string;
    title?: string;
    description?: string;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  }[];
  currentIndex: number;
}

const MainHeroImage: React.FC<MainHeroImageProps> = ({
  slides,
  currentIndex,
}) => {
  return (
    <div className="relative w-full h-auto min-h-0 lg:min-h-[600px] z-0 overflow-hidden">
      <Slider slides={slides} currentIndex={currentIndex} />
    </div>
  );
};

export default MainHeroImage;
