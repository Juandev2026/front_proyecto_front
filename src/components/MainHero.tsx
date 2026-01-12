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
      className="w-full flex flex-col justify-center bg-gradient-to-br from-white to-gray-50 h-full p-8 md:p-12"
    >
      <div className="text-left relative z-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
            <span className="block xl:inline">{title || mainHero.title}</span>{' '}
            <span className={`block text-primary xl:inline uppercase`}>
              {mainHero.subtitle}
            </span>
          </h1>
          <p className="mt-4 text-gray-600 text-base leading-relaxed font-medium">
            {description || mainHero.description}
          </p>
        </div>

        <div className="mt-8 flex gap-4">
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
        </div>
      </div>
    </main>
  );
};

export default MainHero;
