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
      {/* Gradient overlay for text readability */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 40%, rgba(0, 0, 0, 0) 70%)',
        }}
      ></div>
    </div>
  );
};

export default MainHeroImage;
