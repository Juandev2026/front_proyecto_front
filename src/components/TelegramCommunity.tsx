import React from 'react';
import FadeIn from './FadeIn';

const TelegramCommunity = () => {
  return (
    <FadeIn delay={0.4} fullWidth>
      <div className="mt-16 bg-gradient-to-br from-blue-50 to-white rounded-2xl overflow-hidden shadow-xl border border-blue-100 relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-blue-100 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-purple-100 rounded-full opacity-50 blur-3xl"></div>

        <div className="relative z-10 p-8 md:p-12 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Explora nuestra comunidad
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
          Canales informativos donde compartimos novedades, recursos y enlaces a grupos según los distintos procesos del magisterio.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://t.me/+w1G0nssmiTRiZTcx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              <svg
                className="w-6 h-6 mr-2 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Únete a nuestro Telegram
            </a>
          </div>
        </div>
      </div>
    </FadeIn>
  );
};

export default TelegramCommunity;
