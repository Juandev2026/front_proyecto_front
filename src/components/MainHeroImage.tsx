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
    <div className="absolute inset-0 w-full h-full z-0">
      <Slider slides={slides} currentIndex={currentIndex} />
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ backgroundColor: 'rgba(55, 90, 100, 0.75)' }}
      ></div>
    </div>
  );
};

export default MainHeroImage;
