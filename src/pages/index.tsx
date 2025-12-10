import React from 'react';

import About from '../components/About';
import Analytics from '../components/Analytics';
import ChannelsFooter from '../components/ChannelsFooter';
import FadeIn from '../components/FadeIn';
import Footer from '../components/Footer';
import Header from '../components/Header';
import LatestNews from '../components/LatestNews';
import LazyShow from '../components/LazyShow';
import MainHero from '../components/MainHero';
import MainHeroImage from '../components/MainHeroImage';

const App = () => {
  return (
    <div className={`bg-background grid gap-y-16 overflow-hidden`}>
      <div className={`relative bg-background`}>
        <div className="max-w-7xl mx-auto">
          <Header />
        </div>
        <div className="relative">
          <div className="max-w-7xl mx-auto relative">
            <div
              className={`relative z-10 pb-8 bg-background sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32`}
            >
              <FadeIn direction="right" padding={false}>
                <MainHero />
              </FadeIn>
            </div>
            <FadeIn direction="left" delay={0.2} padding={false}>
              <MainHeroImage />
            </FadeIn>
          </div>
        </div>
      </div>
      <FadeIn direction="up">
        <LatestNews />
      </FadeIn>
      <LazyShow>
        <>
          <About />
        </>
      </LazyShow>
      <Analytics />
      <ChannelsFooter />
      <Footer />
    </div>
  );
};

export default App;
