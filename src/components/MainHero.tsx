import { motion } from 'framer-motion';

import config from '../config/index.json';

const MainHero = ({
  title,
  description,
  celular,
  ruta,
}: {
  title?: string;
  description?: string;
  celular?: string;
  ruta?: string;
}) => {
  const { mainHero } = config;
  return (
    <main
      id="main-hero"
      className="w-full px-4 sm:px-6 lg:pl-32 lg:pr-8 relative"
    >
      {/* Background Decor - Removed for clean overlay look */}

      <div className="sm:text-center lg:text-left relative z-10 pt-32 lg:pt-48 pb-16 lg:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="text-5xl tracking-tight font-extrabold text-white sm:text-6xl md:text-7xl drop-shadow-lg leading-tight">
            <span className="block xl:inline">{title || mainHero.title}</span>{' '}
            <span className={`block text-cyan-400 xl:inline uppercase`}>
              {mainHero.subtitle}
            </span>
          </h1>
          <p className="mt-6 text-lg text-gray-100 sm:mt-8 sm:text-xl sm:max-w-xl sm:mx-auto md:mt-8 md:text-2xl lg:mx-0 leading-relaxed font-medium drop-shadow">
            {description || mainHero.description}
          </p>
        </motion.div>

        <motion.div
          className="mt-10 sm:mt-12 sm:flex sm:justify-center lg:justify-start gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          {celular ? (
            <div className="rounded-full shadow-xl">
              <a
                href={`https://wa.me/${celular}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-full text-white bg-teal-600 hover:bg-teal-700 md:text-xl md:px-12 transition-all duration-300 transform hover:scale-105 shadow-2xl uppercase tracking-wider`}
              >
                WhatsApp
              </a>
            </div>
          ) : (
            !title && (
              <div className="rounded-full shadow-xl">
                <a
                  href={mainHero.primaryAction.href}
                  className={`w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-full text-white bg-teal-600 hover:bg-teal-700 md:text-xl md:px-12 transition-all duration-300 transform hover:scale-105 shadow-2xl uppercase tracking-wider`}
                >
                  {mainHero.primaryAction.text}
                </a>
              </div>
            )
          )}

          {ruta ? (
            <div className="mt-4 sm:mt-0">
              <a
                href={ruta}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-center px-8 py-4 border-2 border-white text-lg font-bold rounded-full text-white bg-transparent hover:bg-white/10 md:text-xl md:px-12 transition-all duration-300 transform hover:scale-105 uppercase tracking-wider`}
              >
                Ver más
              </a>
            </div>
          ) : (
            !title && (
              <div className="mt-4 sm:mt-0">
                <a
                  href={mainHero.secondaryAction.href}
                  className={`w-full flex items-center justify-center px-8 py-4 border-2 border-white text-lg font-bold rounded-full text-white bg-transparent hover:bg-white/10 md:text-xl md:px-12 transition-all duration-300 transform hover:scale-105 uppercase tracking-wider`}
                >
                  {mainHero.secondaryAction.text}
                </a>
              </div>
            )
          )}
        </motion.div>
      </div>
    </main>
  );
};

export default MainHero;
