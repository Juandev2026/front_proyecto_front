import React from 'react';

import Slider from './Slider';

interface MainHeroImageProps {
  slides: { image: string; title?: string; description?: string }[];
  currentIndex: number;
}

const MainHeroImage: React.FC<MainHeroImageProps> = ({
  slides,
  currentIndex,
}) => {
  return (
    <div className="relative w-full h-[400px] lg:h-[500px] z-0 rounded-2xl overflow-hidden shadow-2xl">
      <Slider slides={slides} currentIndex={currentIndex} />
    </div>
  );
};

export default MainHeroImage;
