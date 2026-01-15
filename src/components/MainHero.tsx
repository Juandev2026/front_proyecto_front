import React, { useState, useRef, useEffect } from 'react';
import config from '../config/index.json';

const MainHero = ({
  title,
  description,
  celular,
  ruta,
  precio,
}: {
  title?: string;
  description?: string;
  celular?: string;
  ruta?: string;
  precio?: number;
}) => {
  const { mainHero } = config;

  const [isExpanded, setIsExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (textRef.current) {
      // Check if the scrollHeight is greater than the clientHeight
      // This indicates that the text is strictly clamped
      const isOverflowing = textRef.current.scrollHeight > textRef.current.clientHeight;
      setShowButton(isOverflowing);
    }
  }, [title, description, mainHero.description]);

  return (
    <main
      id="main-hero"
      className="w-full flex flex-col justify-center bg-gradient-to-br from-white to-gray-50 h-full p-6 md:p-12"
    >
      <div className="text-left relative z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-600 leading-tight">
            <span className="block xl:inline">{title || mainHero.title}</span>{' '}
            {!title && (
              <span className={`block text-primary xl:inline uppercase`}>
                {mainHero.subtitle}
              </span>
            )}
          </h1>
          <p
            ref={textRef}
            className={`mt-4 text-black text-xl leading-relaxed font-bold whitespace-pre-wrap transition-all duration-300 ${
              !isExpanded ? 'line-clamp-[10]' : ''
            }`}
             style={{
                display: '-webkit-box',
                WebkitLineClamp: !isExpanded ? 10 : 'unset',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
            }}
          >
            {description || mainHero.description}
          </p>
          {showButton && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-primary font-bold hover:underline focus:outline-none"
            >
              {isExpanded ? 'Ver menos' : 'Ver todo'}
            </button>
          )}
          {precio !== undefined && precio > 0 && (
             <p className="mt-4 text-2xl font-bold text-green-600">
               S/ {precio.toFixed(2)}
             </p>
          )}
           {precio !== undefined && precio === 0 && title && (
             <p className="mt-4 text-2xl font-bold text-green-600">
               Gratis
             </p>
          )}
        </div>

        <div className="mt-8 flex gap-4">
          {celular ? (
              <a
                href={`https://wa.me/${celular}?text=${encodeURIComponent(
                  'Me interesa este anuncio'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-full text-white bg-green-600 hover:bg-green-700 md:text-lg md:px-8 transition-all duration-300 transform hover:scale-105 shadow-lg uppercase tracking-wider`}
              >
                WhatsApp
              </a>
          ) : (
            !title && (
                <a
                  href={mainHero.primaryAction.href}
                  className={`flex items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-full text-white bg-primary hover:bg-primary-dark md:text-lg md:px-8 transition-all duration-300 transform hover:scale-105 shadow-lg uppercase tracking-wider`}
                >
                  {mainHero.primaryAction.text}
                </a>
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
        </div>
      </div>
    </main>
  );
};

export default MainHero;
