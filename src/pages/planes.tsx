import React from 'react';

import { Disclosure } from '@headlessui/react';
import { XIcon } from '@heroicons/react/outline';
import {
  ChevronUpIcon,
  CheckCircleIcon,
  StarIcon,
} from '@heroicons/react/solid';
import Link from 'next/link';
import { useRouter } from 'next/router';

import MainLayout from '../components/MainLayout';
import { useAuth } from '../hooks/useAuth';

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
    description:
      'Acceso inicial para conocer la plataforma y empezar a practicar.',
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
    subtitle: 'IMPULSA TU NOMBRAMIENTO Y ASCENSO',
    type: 'semestral',
    price: 35,
    duration: 'por 6 meses',
    description:
      'Preparación estratégica durante 6 meses para avanzar con enfoque.',
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
    originalPrice: 70,
    duration: 'por 12 meses',
    description:
      'Preparación integral durante todo el año en todos los procesos.',
    highlighted: true,
    discount: '🔥 Más elegido',
    ctaText: 'Solicitar acceso ahora',
    features: [
      'Nombramiento',
      'Ascenso',
      'Directivos',
      'Banco de preguntas MINEDU',
      'Simulacros tipo MINEDU completos',
      'Práctica con tus respuestas erradas',
      'Estadísticas avanzadas de rendimiento',
      'Seguimiento y progreso acumulado',
      'Cronómetro integrado',
      'Lector automático de preguntas',
    ],
    extraBenefits: [
      'Resolución de los 3 últimos exámenes (Inicial) desde mayo.',
      'Micro simulacros tipo MINEDU (Inicial, Primaria, CCSS y DPCC) desde mayo.',
      'Recursos alineados al temario MINEDU.',
      'Herramientas exclusivas desde mayo.',
      'Atención a consultas sobre procesos MINEDU.',
      'Actualizaciones sobre Nombramiento, Ascenso y Directivos.',
    ],
  },
];

const faqs = [
  {
    question: '¿El pago es mensual o es un solo pago?',
    answer: (
      <div className="space-y-3">
        <p>
          <strong>El pago no es mensual.</strong> Es un{' '}
          <strong>único pago</strong> por el periodo que elijas.
        </p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>
              <strong>Plan 5 meses</strong> → Un solo pago por los 5 meses
              completos.
            </span>
          </li>
          <li className="flex items-center gap-2">
            <StarIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <span>
              <strong>Plan 12 meses (Más elegido)</strong> → Un solo pago por
              todo el año, más tiempo, más beneficios y mejor inversión en tu
              preparación.
            </span>
          </li>
        </ul>
        <p>
          No existen cobros automáticos ni pagos recurrentes. El pago se realiza
          mediante{' '}
          <strong>Yape, Plin, BCP, Banco de la Nación o Interbank</strong>,
          enviando su voucher al WhatsApp <strong>954 562 938</strong>, único
          número autorizado para pagos.
        </p>
      </div>
    ),
  },
  {
    question: '¿Puedo acceder desde cualquier dispositivo y a cualquier hora?',
    answer: (
      <div className="space-y-3">
        <p>
          <strong>Sí. Puedes ingresar desde cualquier dispositivo</strong>{' '}
          (celular, laptop, PC, tablet).
        </p>
        <p>
          Disponible las 24 horas del día, los 7 días de la semana, para que
          practiques cuando tú lo decidas.
        </p>
      </div>
    ),
  },
  {
    question: '¿La plataforma está según mi nivel o especialidad MINEDU?',
    answer: (
      <div className="space-y-3">
        <p>
          Sí. AVEND ESCALA está organizada según las modalidades y niveles
          oficiales.
        </p>
        <p>
          <strong>Incluye:</strong>
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p>
                <strong>EBR (Educación Básica Regular)</strong>
              </p>
              <ul className="list-disc pl-5 mt-1 text-sm text-gray-500">
                <li>Inicial</li>
                <li>Primaria</li>
                <li>Secundaria</li>
              </ul>
            </div>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>
              <strong>EBA</strong>
            </span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>
              <strong>EBE</strong>
            </span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>
              <strong>Especialidades según convocatoria</strong>
            </span>
          </li>
        </ul>
        <p>
          El contenido se proporciona de acuerdo con tu{' '}
          <strong>nivel y/o especialidad</strong>, permitiéndote practicar
          exactamente lo que necesitas para tu proceso.
        </p>
      </div>
    ),
  },
  {
    question: '¿Habrá simulacros para mejorar mi preparación?',
    answer: (
      <div className="space-y-3">
        <p>
          <strong>Sí.</strong> Contarás con{' '}
          <strong>simulacros de Ascenso</strong> diseñados para fortalecer tu
          rendimiento, con desarrollo específico en:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Inicial</li>
          <li>Primaria</li>
          <li>Ciencias Sociales</li>
        </ul>
        <p>
          Los simulacros de Ascenso se activarán a partir de mayo. En los demás
          niveles y áreas, se habilitarán progresivamente conforme más docentes
          se integren a la comunidad.
        </p>
        <p>
          Replican el formato oficial para que practiques de manera estratégica
          y alineada al proceso.
        </p>
      </div>
    ),
  },
  {
    question: '¿Qué otros desarrollos tendrá la plataforma?',
    answer: (
      <div className="space-y-3">
        <p>
          AVEND ESCALA continuará incorporando herramientas avanzadas de
          estudio, mejoras en la práctica continua y nuevas funcionalidades
          estratégicas que fortalecerán tu preparación.
        </p>
        <p>
          Las actualizaciones serán comunicadas oportunamente a los suscriptores
          mediante el grupo oficial de WhatsApp.
        </p>
      </div>
    ),
  },
  {
    question: '¿Cuentan con soporte o acompañamiento?',
    answer: (
      <div className="space-y-3">
        <p>
          <strong>Sí.</strong> Si tienes alguna duda sobre el funcionamiento o
          uso de la plataforma, recibirás acompañamiento y orientación
          personalizada.
        </p>
        <p>
          El docente <strong>Juan Avend</strong> te guiará para absolver
          cualquier consulta o inconveniente, garantizando que puedas aprovechar
          correctamente todas las herramientas disponibles.
        </p>
        <p>
          El soporte se brinda a través del canal oficial y el grupo de WhatsApp
          de suscriptores.
        </p>
      </div>
    ),
  },
];

const Planes = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const showVideo = router.query.showVideo === 'true';

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto text-center mb-8">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            Elige el Plan Perfecto para Ti
          </h1>
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Invierte en tu desarrollo profesional con nuestros planes diseñados
            para docentes comprometidos
          </p>
        </div>

        {/* Video Section (Conditional) */}
        {showVideo && (
          <div className="max-w-4xl mx-auto mb-12 animate-fade-in-down">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-blue-100">
              <div className="bg-blue-600 py-3 px-6 flex items-center justify-between">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Recorrido por la Plataforma AVEND ESCALA
                </h2>
                <button
                  onClick={() =>
                    router.push('/planes', undefined, { shallow: true })
                  }
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
              <div
                className="relative w-full"
                style={{ paddingBottom: '56.25%' }}
              >
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <p className="text-sm text-gray-600 font-medium text-center">
                  Descubre todo lo que puedes lograr con AVEND ESCALA. Prepárate
                  con simulacros reales y banco de preguntas actualizado.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {planes.map((plan: Plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 h-full flex flex-col ${
                plan.highlighted ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
              }`}
            >
              {/* Decorative top gradient bar for highlighted plan */}
              {plan.highlighted && (
                <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />
              )}

              {/* Discount Badge */}
              {plan.discount && (
                <div className="absolute top-7 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg z-10">
                  {plan.discount}
                </div>
              )}

              <div className={`p-8 flex-grow flex flex-col ${plan.highlighted ? 'pt-11' : ''}`}>
                {/* Header content container to align buttons */}
                <div className="min-h-[190px] sm:min-h-[210px] flex flex-col">
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
                  <p className="text-gray-600 mb-6 text-sm flex-grow">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6 h-16 flex flex-col justify-end">
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
                </div>

                {/* CTA Button */}
                {isAuthenticated ? (
                  <a
                    href={`https://wa.me/51947282682?text=Hola,%20me%20interesa%20el%20${encodeURIComponent(
                      plan.name
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block w-full text-center py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 mb-6 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 ${
                      plan.highlighted ? 'animate-shine' : ''
                    }`}
                    style={{
                      backgroundColor: plan.highlighted ? '#1e40af' : '#2b7fff',
                      boxShadow: plan.highlighted
                        ? '0 10px 15px -3px rgba(30, 64, 175, 0.3)'
                        : undefined,
                    }}
                  >
                    {plan.ctaText}
                  </a>
                ) : (
                  <Link
                    href={`/login?planId=${
                      plan.id
                    }&planName=${encodeURIComponent(plan.name)}`}
                  >
                    <a
                      className={`block w-full text-center py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 mb-6 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 ${
                        plan.highlighted ? 'animate-shine' : ''
                      }`}
                      style={{
                        backgroundColor: plan.highlighted
                          ? '#1e40af'
                          : '#2b7fff',
                        boxShadow: plan.highlighted
                          ? '0 10px 15px -3px rgba(30, 64, 175, 0.3)'
                          : undefined,
                      }}
                    >
                      {plan.ctaText}
                    </a>
                  </Link>
                )}

                {/* Features */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    Incluye acceso a:
                  </p>
                  <div className="space-y-2">
                    {plan.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0 mt-1" />
                        <span className="text-gray-700 text-sm leading-tight">
                          {feature}
                        </span>
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
                      {plan.extraBenefits.map(
                        (benefit: string, index: number) => (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircleIcon className="h-4 w-4 text-blue-500 flex-shrink-0 mt-1" />
                            <span className="text-gray-700 text-xs leading-normal">
                              {benefit}
                            </span>
                          </div>
                        )
                      )}
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
            {faqs.map((faq, index) => (
              <Disclosure as="div" key={index} className="mt-2">
                {({ open }: { open: boolean }) => (
                  <>
                    <Disclosure.Button className="flex justify-between w-full px-6 py-4 text-left text-lg font-medium text-gray-900 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 shadow-sm">
                      <span>{faq.question}</span>
                      <ChevronUpIcon
                        className={`${
                          open ? 'transform rotate-180' : ''
                        } w-6 h-6 text-blue-500`}
                      />
                    </Disclosure.Button>
                    <Disclosure.Panel className="px-6 pt-4 pb-6 text-gray-600 bg-white rounded-b-lg -mt-2 shadow-sm border-t border-gray-100">
                      {faq.answer}
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Planes;
