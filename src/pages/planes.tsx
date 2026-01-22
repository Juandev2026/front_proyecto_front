import React from 'react';
import { Disclosure } from '@headlessui/react';
import { CheckIcon } from '@heroicons/react/outline';
import { ChevronUpIcon } from '@heroicons/react/solid';
import MainLayout from '../components/MainLayout';
import { open } from 'fs';

interface Plan {
  id: string;
  name: string;
  type: 'mensual' | 'semestral' | 'anual';
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  highlighted?: boolean;
  discount?: string;
}

const planes: Plan[] = [
  {
    id: 'mensual',
    name: 'Plan Mensual',
    type: 'mensual',
    price: 59,
    originalPrice: 99,
    description: 'Acceso completo para potenciar tu enseñanza mes a mes',
    discount: '40% OFF',
    features: [
      'Acceso ilimitado a todos los cursos',
      'Material descargable premium',
      'Certificados oficiales',
      'Soporte prioritario',
      'Acceso a webinars en vivo',
    ],
  },
  {
    id: 'semestral',
    name: 'Plan Semestral',
    type: 'semestral',
    price: 299,
    originalPrice: 594,
    description: '6 meses de aprendizaje continuo con ahorro significativo',
    highlighted: true,
    discount: '50% OFF',
    features: [
      'Todo lo del Plan Mensual',
      'Ahorra 2 meses de suscripción',
      'Acceso anticipado a nuevos cursos',
      '3 sesiones de mentoría grupales',
      'Certificación semestral',
      'Acceso de por vida a cursos completados',
    ],
  },
  {
    id: 'anual',
    name: 'Plan Anual',
    type: 'anual',
    price: 499,
    originalPrice: 1188,
    description: 'La máxima inversión en tu carrera docente',
    highlighted: true,
    discount: '58% OFF',
    features: [
      'Todo lo del Plan Semestral',
      'Ahorra 7 meses de suscripción',
      'Acceso VIP a eventos presenciales',
      '6 sesiones de mentoría personalizadas',
      'Certificación anual avanzada',
      'Material físico exclusivo (envío incluido)',
      'Networking con expertos del sector',
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
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                
                {/* Description */}
                <p className="text-gray-600 mb-6">
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
                  <p className="text-gray-500 mt-1">
                    {plan.type === 'mensual' && 'por mes'}
                    {plan.type === 'semestral' && 'por 6 meses'}
                    {plan.type === 'anual' && 'por año'}
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
                  Comenzar Ahora
                </a>

                {/* Features */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    Incluye:
                  </p>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
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
                    <span>¿Los cursos tienen certificación oficial?</span>
                    <ChevronUpIcon
                      className={`${
                        open ? 'transform rotate-180' : ''
                      } w-6 h-6 text-blue-500`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-6 pt-4 pb-6 text-gray-600 bg-white rounded-b-lg -mt-2 shadow-sm border-t border-gray-100">
                    Sí, todos nuestros cursos y especializaciones incluyen certificación válida para el escalafón docente. Dependiendo de tu plan (Semestral o Anual), puedes acceder a certificaciones avanzadas con mayor carga horaria.
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
