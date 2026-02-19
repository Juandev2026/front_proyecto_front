import React from 'react';
import { Disclosure } from '@headlessui/react';
import { CheckIcon } from '@heroicons/react/outline';
import { ChevronUpIcon } from '@heroicons/react/solid';
import MainLayout from '../components/MainLayout';


interface Plan {
  id: string;
  name: string;
  subtitle?: string;
  type: 'gratuito' | 'mensual' | 'semestral' | 'anual';
  price: number;
  originalPrice?: number;
  duration: string;
  description: string;
  features: string[];
  extraBenefits?: string[];
  highlighted?: boolean;
  discount?: string;
  ctaText: string;
}

const planes: Plan[] = [
  {
    id: 'gratuito',
    name: 'PLAN GRATUITO',
    subtitle: 'Explora AVEND ESCALA',
    type: 'gratuito',
    price: 0,
    duration: 'por 7 días',
    description: 'Acceso inicial para conocer la plataforma y empezar a practicar.',
    ctaText: 'Comenzar Gratis',
    features: [
      'Banco de preguntas MINEDU (acceso limitado)',
      'Simulacros con exámenes de MINEDU',
      'Práctica con tus respuestas erradas',
      'Visualización básica de resultados',
    ],
  },
  {
    id: 'semestral',
    name: 'PLAN SEMESTRAL',
    subtitle: 'Impulsa tu Nombramiento y Ascenso',
    type: 'semestral',
    price: 35,
    duration: 'por 6 meses',
    description: 'Preparación estratégica durante 6 meses para avanzar con enfoque.',
    ctaText: 'Comenzar Ahora',
    features: [
      'Nombramiento',
      'Ascenso',
      'Banco de preguntas MINEDU',
      'Simulacros MINEDU',
      'Práctica con tus respuestas erradas',
      'Estadísticas de rendimiento',
      'Seguimiento de progreso',
    ],
  },
  {
    id: 'anual',
    name: 'PLAN ANUAL',
    subtitle: 'Acceso Total AVEND ESCALA',
    type: 'anual',
    price: 49,
    originalPrice: 499,
    duration: 'por 12 meses',
    description: 'Preparación integral durante todo el año en todos los procesos.',
    highlighted: true,
    discount: '🔥 Más elegido',
    ctaText: 'Acceso Total Ahora',
    features: [
      'Nombramiento',
      'Ascenso',
      'Directivos',
      'Banco de preguntas MINEDU',
      'Simulacros tipo MINEDU completos',
      'Práctica con tus respuestas erradas',
      'Estadísticas avanzadas de rendimiento',
      'Seguimiento y progreso acumulado',
    ],
    extraBenefits: [
      'Resolución en video de cada pregunta para Nombramiento y Ascenso, iniciando con Inicial y Primaria y contenido completo en abril, con explicación estratégica paso a paso para comprender cómo llegar a la respuesta correcta',
      'Simulacros mensuales de Ascenso (Inicial y Primaria) desde mayo hasta un mes antes del examen',
      'Herramientas avanzadas',
    ],
  },
];

const Planes = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            Elige el Plan Perfecto para Ti
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Invierte en tu desarrollo profesional con nuestros planes diseñados para docentes comprometidos
          </p>
        </div>

        {/* Plans Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {planes.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                plan.highlighted ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
              }`}
            >
              {/* Discount Badge */}
              {plan.discount && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                  {plan.discount}
                </div>
              )}

              <div className="p-8">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {plan.name}
                </h3>
                {plan.subtitle && (
                  <p className="text-sm font-bold text-blue-600 mb-2 uppercase tracking-wide">
                    {plan.subtitle}
                  </p>
                )}
                
                {/* Description */}
                <p className="text-gray-600 mb-6 text-sm">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold text-gray-900">
                      S/ {plan.price}
                    </span>
                    {plan.originalPrice && (
                      <span className="text-2xl text-gray-400 line-through">
                        S/ {plan.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 mt-1 font-medium">
                    {plan.duration}
                  </p>
                </div>

                {/* CTA Button */}
                <a
                  href={`https://wa.me/51947282682?text=Hola,%20me%20interesa%20el%20${encodeURIComponent(plan.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 mb-6 text-white shadow-lg hover:shadow-xl hover:-translate-y-1"
                  style={{ backgroundColor: '#2b7fff' }}
                >
                  {plan.ctaText}
                </a>

                {/* Features */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    Incluye acceso a:
                  </p>
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckIcon className="h-4 w-4 text-green-500 flex-shrink-0 mt-1" />
                        <span className="text-gray-700 text-sm leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extra Benefits */}
                {plan.extraBenefits && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 mb-3">
                      Beneficios exclusivos del Plan Anual:
                    </p>
                    <div className="space-y-3">
                      {plan.extraBenefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckIcon className="h-4 w-4 text-blue-500 flex-shrink-0 mt-1" />
                          <span className="text-gray-700 text-xs leading-normal">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-4xl font-extrabold text-gray-900 text-center mb-12">
            Preguntas Frecuentes
          </h2>
          <div className="space-y-4">
            <Disclosure as="div" className="mt-2">
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex justify-between w-full px-6 py-4 text-left text-lg font-medium text-gray-900 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 shadow-sm">
                    <span>¿Cuáles son los métodos de pago aceptados?</span>
                    <ChevronUpIcon
                      className={`${
                        open ? 'transform rotate-180' : ''
                      } w-6 h-6 text-blue-500`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-6 pt-4 pb-6 text-gray-600 bg-white rounded-b-lg -mt-2 shadow-sm border-t border-gray-100">
                    Aceptamos todas las tarjetas de crédito y débito, transferencias bancarias (BCP, Interbank, BBVA) y billeteras digitales como Yape y Plin. El acceso es inmediato tras confirmar tu pago.
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>



            <Disclosure as="div" className="mt-2">
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex justify-between w-full px-6 py-4 text-left text-lg font-medium text-gray-900 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 shadow-sm">
                    <span>¿Puedo acceder desde mi celular?</span>
                    <ChevronUpIcon
                      className={`${
                        open ? 'transform rotate-180' : ''
                      } w-6 h-6 text-blue-500`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-6 pt-4 pb-6 text-gray-600 bg-white rounded-b-lg -mt-2 shadow-sm border-t border-gray-100">
                    ¡Por supuesto! Nuestra plataforma es 100% responsiva y podrás estudiar cómodamente desde tu computadora, tablet o teléfono móvil en cualquier momento.
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>

            <Disclosure as="div" className="mt-2">
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex justify-between w-full px-6 py-4 text-left text-lg font-medium text-gray-900 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 shadow-sm">
                    <span>¿Qué incluye la mentoría personalizada?</span>
                    <ChevronUpIcon
                      className={`${
                        open ? 'transform rotate-180' : ''
                      } w-6 h-6 text-blue-500`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-6 pt-4 pb-6 text-gray-600 bg-white rounded-b-lg -mt-2 shadow-sm border-t border-gray-100">
                    En los planes Semestral y Anual, tendrás sesiones en vivo con expertos para resolver dudas específicas sobre tu práctica pedagógica, preparación para nombramientos o gestión escolar.
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>

            <Disclosure as="div" className="mt-2">
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex justify-between w-full px-6 py-4 text-left text-lg font-medium text-gray-900 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 shadow-sm">
                    <span>¿Tengo garantía si no estoy satisfecho?</span>
                    <ChevronUpIcon
                      className={`${
                        open ? 'transform rotate-180' : ''
                      } w-6 h-6 text-blue-500`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-6 pt-4 pb-6 text-gray-600 bg-white rounded-b-lg -mt-2 shadow-sm border-t border-gray-100">
                    Estamos seguros de la calidad de nuestro contenido. Si sientes que no es lo que buscabas, ofrecemos una garantía de devolución del 100% de tu dinero durante los primeros 7 días.
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Planes;
