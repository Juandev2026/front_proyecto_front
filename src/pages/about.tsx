import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="relative bg-white shadow-sm z-20">
        <div className="max-w-7xl mx-auto">
          <Header />
        </div>
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="space-y-12">
            
            {/* Intro Section: Video + Text */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Video Placeholder */}
                <div className="rounded-xl overflow-hidden shadow-lg h-[300px] md:h-full relative bg-gray-900 group">
                    {/* Since we don't have the exact video URL, we'll use a placeholder styled like the image */}
                    <img 
                        src="/assets/images/happyTeam.jpeg" 
                        alt="Carpeta Digital Team" 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <h3 className="text-white font-black text-2xl md:text-3xl tracking-wider mb-4 drop-shadow-lg uppercase">
                            Bienvenido a <br/>
                            <span className="text-4xl md:text-5xl block mt-2">Carpeta Digital</span>
                            <span className="text-4xl md:text-5xl block">Education</span>
                        </h3>
                        {/* Play Button Icon */}
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-white ml-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Text Content */}
                <div className="flex flex-col justify-center">
                  <h2 className="text-3xl font-extrabold text-blue-900 mb-6">Quiénes Somos</h2>
                  <div className="space-y-4 text-gray-600 text-sm leading-relaxed text-justify">
                    <p>
                      <span className="font-bold text-primary">Carpeta Digital</span> es una empresa peruana especializada en el
                      desarrollo de soluciones innovadoras para el fortalecimiento
                      de la educación. Nos enfocamos en la creación de recursos
                      pedagógicos digitales, la realización de talleres formativos y la
                      prestación de servicios de asesoría y acompañamiento
                      docente.
                    </p>
                    <p>
                      Con más de cinco años de trayectoria, hemos contribuido
                      significativamente a mejorar la calidad de la enseñanza en el
                      Perú, impactando positivamente en miles de docentes a nivel
                      nacional. Nuestra propuesta integra creatividad, tecnología y
                      un enfoque humano, permitiendo que las clases sean más
                      efectivas, dinámicas y centradas en el aprendizaje significativo.
                    </p>
                    
                    <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-400 mt-2">
                        <p className="text-xs text-orange-800">
                        <span className="font-bold text-orange-600 block mb-1">Misión:</span> 
                        Brindar recursos pedagógicos innovadores y asesoría a docentes, impactando en la calidad educativa.
                        </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                        <p className="text-xs text-blue-800">
                        <span className="font-bold text-blue-600 block mb-1">Visión:</span> 
                        Ser el aliado confiable para docentes de toda Latinoamérica, conectando calidad e innovación con corazón.
                        </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Values Section */}
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b-2 border-gray-200 pb-2">Valores</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1: Compromiso Educativo */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-500">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                  </div>
                  <h3 className="font-bold text-blue-900 mb-3 text-sm">Compromiso Educativo</h3>
                  <p className="text-xs text-gray-500 leading-relaxed text-justify">
                    Creemos que la educación transforma vidas y
                    comunidades. Por eso, creamos soluciones prácticas y de
                    calidad, pensando siempre en el bienestar y el
                    aprendizaje real de docentes y estudiantes.
                  </p>
                </div>

                {/* Card 2: Relacionales */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-500">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                     </svg>
                  </div>
                  <h3 className="font-bold text-blue-900 mb-3 text-sm">Relacionales</h3>
                  <p className="text-xs text-gray-500 leading-relaxed text-justify">
                    Cada material, cada taller y cada asesoría están
                    diseñados para impulsar clases más creativas, humanas y
                    efectivas. Innovamos con sentido, escuchando a los
                    maestros y respondiendo a sus verdaderos desafíos.
                  </p>
                </div>

                {/* Card 3: Comunidad y colaboración */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-500">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                     </svg>
                  </div>
                  <h3 className="font-bold text-blue-900 mb-3 text-sm">Comunidad y colaboración</h3>
                  <p className="text-xs text-gray-500 leading-relaxed text-justify">
                    No caminamos solos: construimos redes de apoyo entre
                    maestros, aliados y profesionales comprometidos con la
                    educación. Juntos llegamos más lejos y logramos un
                    impacto real y sostenible.
                  </p>
                </div>

              </div>
            </div>

          </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
