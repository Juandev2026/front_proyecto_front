import React from 'react';

import AboutSection from '../components/About';
import FadeIn from '../components/FadeIn';
import Footer from '../components/Footer';
import Header from '../components/Header';

const About = () => {
  return (
    <div className="bg-background overflow-hidden">
      <div className="relative bg-background">
        <div className="max-w-7xl mx-auto">
          <Header />
        </div>
        <div className="relative">
          <div className="max-w-7xl mx-auto relative">
            <div className="relative z-10 pb-8 bg-background sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
              <FadeIn direction="right" padding={false}>
                <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                  <div className="sm:text-center lg:text-left">
                    <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                      <span className="block xl:inline">Nosotros</span>{' '}
                      <span className="block text-primary xl:inline">
                        ¿Quiénes somos?
                      </span>
                    </h1>
                    <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                      Somos un espacio educativo dedicado a la enseñanza y
                      difusión de conocimientos en diversas áreas. A través de
                      cursos especializados y artículos en nuestro blog,
                      brindamos contenido de calidad para el aprendizaje
                      continuo. Nuestro docente, con amplia experiencia en su
                      campo, comparte su conocimiento para ayudar a estudiantes
                      y profesionales a fortalecer sus habilidades y alcanzar
                      sus objetivos.
                    </p>
                  </div>
                </main>
              </FadeIn>
            </div>
            <FadeIn direction="left" delay={0.2} padding={false}>
              <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
                <img
                  className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
                  src="/assets/images/happyTeam.jpeg"
                  alt="Equipo educativo"
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Nuestros Pilares
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {[
                {
                  name: 'Cursos Especializados',
                  description:
                    'Formación de alto nivel adaptada a las necesidades actuales.',
                },
                {
                  name: 'Blog Educativo',
                  description:
                    'Artículos y recursos para complementar tu aprendizaje.',
                },
                {
                  name: 'Experiencia Docente',
                  description:
                    'Profesionales con trayectoria compartiendo su saber.',
                },
                {
                  name: 'Contacto Directo',
                  description:
                    'Atención personalizada para resolver tus dudas.',
                },
              ].map((feature) => (
                <div key={feature.name} className="relative">
                  <dt>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                      {feature.name}
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Ponte en{' '}
            <span className="text-primary relative inline-block">
              Contacto
              <svg
                className="absolute w-full h-3 -bottom-1 left-0 text-primary opacity-60"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 5 Q 50 10 100 5"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                />
              </svg>
            </span>
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombres
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder="Nombre ..."
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Apellidos
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder="Apellidos ..."
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Email ..."
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Celular
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="Celular ..."
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700"
              >
                Mensaje
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                placeholder="Mensaje ..."
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
      <AboutSection />
      <Footer />
    </div>
  );
};

export default About;
