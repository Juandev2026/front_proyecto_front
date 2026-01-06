import React from 'react';

import Footer from '../components/Footer';
import Header from '../components/Header';
import SocialMediaFrames from '../components/SocialMediaFrames';
import FadeIn from '../components/FadeIn';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="relative bg-white shadow-sm z-20">
        <div className="w-full">
          <Header />
        </div>
      </div>

      <main className="flex-grow w-full px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-32 py-12">
        <div className="space-y-20">
          {/* Intro Section: Image + Text */}
          <FadeIn direction="up" fullWidth>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transform transition-all hover:shadow-2xl duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Image */}
                <div className="relative h-[400px] md:h-full min-h-[400px] group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-transparent z-10 pointer-events-none"></div>
                  <img
                    src="https://images.unsplash.com/photo-1544717305-2782549b5136?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80" // Education classroom image
                    alt="Educación"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>

                {/* Text Content */}
                <div className="p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-white to-gray-50">
                  <FadeIn delay={0.2}>
                      <div className="mb-6">
                          <span className="text-primary font-bold tracking-wider text-sm uppercase mb-2 block">Nuestra Historia</span>
                          <h2 className="text-4xl font-extrabold text-gray-900 leading-tight">
                          Quiénes <span className="text-primary">Somos</span>
                          </h2>
                      </div>
                  </FadeIn>
                  
                  <div className="space-y-6 text-gray-600 text-base leading-relaxed text-justify">
                    <FadeIn delay={0.3}>
                        <p className="border-l-4 border-primary pl-4 italic bg-blue-50/50 py-2 rounded-r-lg">
                        Somos un espacio creado para acompañar el crecimiento profesional de los docentes a través de contenido claro y herramientas que facilitan su labor diaria.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.4}>
                        <p>
                        Nacido desde la experiencia en el aula y el compromiso con una educación más sólida, este proyecto busca brindar orientación confiable, soluciones prácticas y un entorno donde los maestros encuentren recursos que impulsen su trabajo y sus metas.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.5}>
                        <p>
                        Creemos que, cuando se ofrece claridad, apoyo y herramientas útiles en un mismo lugar, los docentes avanzan con confianza y fortalecen su impacto en la educación.
                        </p>
                    </FadeIn>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Nuestros Pilares */}
          <FadeIn direction="up" fullWidth>
            <div>
              <div className="text-center mb-12">
                  <span className="text-primary font-bold tracking-wider text-sm uppercase">Fundamentos</span>
                  <h2 className="text-3xl font-extrabold text-gray-900 mt-2">
                  Nuestros Pilares
                  </h2>
                  <div className="w-24 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Actualización Permanente',
                    desc: 'Información relevante presentada de forma clara y oportuna, para que cada docente pueda tomar decisiones con seguridad.',
                    icon: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    ),
                    color: 'border-blue-200',
                    iconClass: 'text-blue-600',
                    bgClass: 'bg-blue-100',
                  },
                  {
                    title: 'Herramientas Útiles',
                    desc: 'Recursos prácticos que facilitan la planificación, el trabajo diario y el desarrollo profesional.',
                    icon: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    ),
                    color: 'border-orange-200',
                    iconClass: 'text-orange-600',
                    bgClass: 'bg-orange-100',
                  },
                  {
                    title: 'Experiencia en Aula',
                    desc: 'Conocimiento construido desde la práctica real, entendiendo los desafíos y necesidades del docente peruano.',
                    icon: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    ),
                    color: 'border-green-200',
                    iconClass: 'text-green-600',
                    bgClass: 'bg-green-100',
                  },
                  {
                    title: 'Acompañamiento Cercano',
                    desc: 'Atención directa y accesible para orientar, resolver dudas y brindar soporte cuando más se necesita.',
                    icon: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    ),
                    color: 'border-purple-200',
                    iconClass: 'text-purple-600',
                    bgClass: 'bg-purple-100',
                  },
                ].map((item, idx) => (
                    <FadeIn key={idx} delay={idx * 0.1}>
                        <div className={`p-6 rounded-xl shadow-sm border ${item.color} border-opacity-50 hover:shadow-lg transition-all hover:-translate-y-1 bg-white h-full group`}>
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${item.bgClass} ${item.iconClass} shadow-inner group-hover:scale-110 transition-transform`}>
                            {item.icon}
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">
                            {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed text-justify">
                            {item.desc}
                        </p>
                        </div>
                    </FadeIn>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Valores */}
          <FadeIn direction="up" fullWidth>
            <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-gray-50 px-4 text-2xl font-bold text-gray-500 uppercase tracking-widest">Valores</span>
                </div>
            </div>

            <div className="mt-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Claridad y transparencia */}
                <FadeIn delay={0.1}>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all relative overflow-hidden group h-full">
                        <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 group-hover:w-full transition-all duration-500 opacity-10"></div>
                        <h3 className="font-bold text-xl text-blue-900 mb-4 relative z-10">
                        Claridad y transparencia
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed text-justify relative z-10">
                        Compartimos contenido confiable y explicado de forma sencilla, para que cada docente comprenda los cambios y actualizaciones sin confusiones. Creemos que la información clara es una herramienta poderosa para tomar mejores decisiones.
                        </p>
                    </div>
                </FadeIn>

                {/* Utilidad práctica */}
                <FadeIn delay={0.2}>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all relative overflow-hidden group h-full">
                        <div className="absolute top-0 left-0 w-2 h-full bg-orange-500 group-hover:w-full transition-all duration-500 opacity-10"></div>
                        <h3 className="font-bold text-xl text-orange-900 mb-4 relative z-10">
                        Utilidad práctica
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed text-justify relative z-10">
                        Cada recurso, herramienta o guía está pensado para resolver necesidades reales del trabajo docente. Priorizamos materiales que ahorren tiempo, faciliten la planificación y aporten soluciones concretas al día a día en aula.
                        </p>
                    </div>
                </FadeIn>

                {/* Crecimiento profesional */}
                <FadeIn delay={0.3}>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all relative overflow-hidden group h-full">
                        <div className="absolute top-0 left-0 w-2 h-full bg-green-500 group-hover:w-full transition-all duration-500 opacity-10"></div>
                        <h3 className="font-bold text-xl text-green-900 mb-4 relative z-10">
                        Crecimiento profesional
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed text-justify relative z-10">
                        Impulsamos el desarrollo continuo del docente, brindando orientaciones y herramientas que fortalecen su desempeño y abren nuevas oportunidades en su trayectoria educativa. Apostamos por el aprendizaje constante como base de una educación de calidad.
                        </p>
                    </div>
                </FadeIn>
                </div>
            </div>
            
             {/* Social Media Frames */}
             <div className="mt-16 -mx-4 sm:-mx-6 lg:-mx-12 xl:-mx-20 2xl:-mx-32">
               <SocialMediaFrames />
             </div>
          </FadeIn>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
