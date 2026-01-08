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
      className="w-full relative flex flex-col justify-center"
    >
      <div className="text-left relative z-10 py-8 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl leading-tight">
            <span className="block xl:inline">{title || mainHero.title}</span>{' '}
            <span className={`block text-primary xl:inline uppercase`}>
              {mainHero.subtitle}
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 sm:mt-6 sm:text-xl md:mt-6 md:text-xl leading-relaxed font-medium">
            {description || mainHero.description}
          </p>
        </motion.div>

        <motion.div
          className="mt-8 sm:mt-10 flex gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          {celular ? (
            <div className="rounded-full shadow-md">
              <a
                href={`https://wa.me/${celular}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-full text-white bg-green-600 hover:bg-green-700 md:text-lg md:px-8 transition-all duration-300 transform hover:scale-105 shadow-lg uppercase tracking-wider`}
              >
                WhatsApp
              </a>
            </div>
          ) : (
            !title && (
              <div className="rounded-full shadow-md">
                <a
                  href={mainHero.primaryAction.href}
                  className={`w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-full text-white bg-primary hover:bg-primary-dark md:text-lg md:px-8 transition-all duration-300 transform hover:scale-105 shadow-lg uppercase tracking-wider`}
                >
                  {mainHero.primaryAction.text}
                </a>
              </div>
            )
          )}

          {ruta ? (
            <div className="">
              <a
                href={ruta}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-center px-6 py-3 border-2 border-primary text-base font-bold rounded-full text-primary bg-transparent hover:bg-primary/10 md:text-lg md:px-8 transition-all duration-300 transform hover:scale-105 uppercase tracking-wider`}
              >
                Ver más
              </a>
            </div>
          ) : (
            !title && (
              <div className="">
                <a
                  href={mainHero.secondaryAction.href}
                  className={`w-full flex items-center justify-center px-6 py-3 border-2 border-primary text-base font-bold rounded-full text-primary bg-transparent hover:bg-primary/10 md:text-lg md:px-8 transition-all duration-300 transform hover:scale-105 uppercase tracking-wider`}
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
