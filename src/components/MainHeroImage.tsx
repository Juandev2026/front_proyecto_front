import React, { useEffect, useState } from 'react';

import config from '../config/index.json';
import { noticiaService } from '../services/noticiaService';
import Slider from './Slider';

const MainHeroImage = () => {
  const { mainHero } = config;
  const [images, setImages] = useState<string[]>(
    mainHero.images || [mainHero.img]
  );

  useEffect(() => {
    const fetchFeaturedNews = async () => {
      try {
        const news = await noticiaService.getAll(true);
        if (news.length > 0) {
          const featuredImages = news
            .map((n) => n.imageUrl)
            .filter(Boolean) as string[];
          if (featuredImages.length > 0) {
            setImages(featuredImages);
          }
        }
      } catch (error) {
        console.error('Error loading featured news:', error);
      }
    };

    fetchFeaturedNews();
  }, []);

  return (
    <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 h-56 sm:h-72 md:h-96 lg:h-full">
      <Slider images={images} />
    </div>
  );
};

export default MainHeroImage;
