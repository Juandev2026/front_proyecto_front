import React from 'react';

import Slider from './Slider';

interface MainHeroImageProps {
  slides: { image: string; title?: string; description?: string }[];
  currentIndex: number;
}

const MainHeroImage: React.FC<MainHeroImageProps> = ({ slides, currentIndex }) => {
  return (
    <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 h-56 sm:h-72 md:h-96 lg:h-full">
      <Slider slides={slides} currentIndex={currentIndex} />
    </div>
  );
};

export default MainHeroImage;
