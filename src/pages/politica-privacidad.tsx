import React from 'react';
import MainLayout from '../components/MainLayout';
import SEO from '../components/SEO';
import { LockClosedIcon, DocumentTextIcon, ShieldCheckIcon, CreditCardIcon } from '@heroicons/react/solid';

const PoliticaPrivacidad = () => {
  return (
    <MainLayout>
      <SEO 
        title="Política de Privacidad y Términos y Condiciones - AVEND DOCENTE" 
        description="Conoce nuestras políticas de privacidad y términos de servicio para el uso de la plataforma AVEND DOCENTE."
      />
      <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden text-[13px] sm:text-base">
          <div className="bg-primary px-8 py-10 text-white">
            <h1 className="text-3xl font-extrabold text-center">
              Políticas y Condiciones AVEND DOCENTE
            </h1>
          </div>
          
          <div className="px-8 py-10 space-y-12 text-gray-800">
            {/* Política de Privacidad */}
            <section>
              <h2 className="text-2xl font-bold flex items-center gap-2 text-primary border-b-2 border-primary/20 pb-2 mb-6">
                <LockClosedIcon className="w-7 h-7" /> POLÍTICA DE PRIVACIDAD – AVEND DOCENTE
              </h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-3">1. Datos que recopilamos</h3>
                  <p className="mb-4">AVEND DOCENTE puede recopilar:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Nombre y apellidos</li>
                    <li>Número de celular</li>
                    <li>Correo electrónico</li>
                    <li>Institución educativa</li>
                    <li>Nivel, modalidad o especialidad docente</li>
                    <li>Información de uso de la plataforma (progreso, estadísticas, rendimiento)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3">2. Finalidad del tratamiento</h3>
                  <p className="mb-4">Los datos se utilizan para:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Gestionar el acceso a la plataforma</li>
                    <li>Brindar soporte y acompañamiento</li>
                    <li>Enviar información relevante sobre procesos MINEDU (Nombramiento, Ascenso y Directivos)</li>
                    <li>Mejorar herramientas y experiencia del usuario</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3">3. Protección de datos</h3>
                  <p>La información personal es confidencial y no será vendida, cedida ni compartida con terceros sin autorización del usuario.</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3">4. Actualizaciones</h3>
                  <p>La presente política puede modificarse para fortalecer la seguridad y el servicio.</p>
                </div>
              </div>
            </section>

            {/* Términos y Condiciones */}
            <section>
              <h2 className="text-2xl font-bold flex items-center gap-3 text-primary border-b-2 border-primary/20 pb-2 mb-6 uppercase tracking-tight">
                <DocumentTextIcon className="w-7 h-7 shrink-0" /> TÉRMINOS Y CONDICIONES – AVEND DOCENTE
              </h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-3">1. Acceso a la plataforma</h3>
                  <p className="mb-2">El acceso es personal e intransferible.</p>
                  <p>El usuario es responsable del uso adecuado de sus credenciales.</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3">2. Duración del acceso</h3>
                  <p>El acceso tendrá la duración del plan contratado (5 meses o 12 meses).</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3">3. Pagos</h3>
                  <p className="mb-2">El acceso se activa luego de la verificación del pago correspondiente al plan elegido.</p>
                  <p>No existen cobros automáticos ni renovaciones obligatorias.</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <ShieldCheckIcon className="w-7 h-7 text-primary" /> 4. Propiedad Intelectual
                  </h3>
                  <p className="mb-4">
                    Todo el contenido, estructura, diseño, simulacros, resoluciones en video, herramientas digitales, metodología de práctica, estadísticas, textos, materiales descargables, logotipos, nombre comercial y funcionalidades de la plataforma AVEND DOCENTE son propiedad exclusiva de su creador.
                  </p>
                  <p className="font-bold mb-2 uppercase text-red-600">Queda estrictamente prohibido:</p>
                  <ul className="list-disc pl-6 space-y-2 text-red-700/80">
                    <li>Copiar, reproducir o distribuir total o parcialmente el contenido.</li>
                    <li>Grabar pantalla, capturar preguntas o simulacros para redistribución.</li>
                    <li>Compartir accesos con terceros.</li>
                    <li>Comercializar, replicar o crear plataformas similares utilizando el contenido o estructura de AVEND DOCENTE.</li>
                  </ul>
                  <p className="mt-4 italic text-sm text-gray-600">
                    Cualquier uso no autorizado podrá dar lugar a acciones legales conforme a la normativa vigente sobre derechos de autor y propiedad intelectual en el Perú.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3">5. Suspensión de cuenta</h3>
                  <p>AVEND DOCENTE podrá suspender o cancelar el acceso en caso de incumplimiento de las normas de uso.</p>
                </div>
              </div>
            </section>

            {/* Aviso de Pagos */}
            <section className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-primary mb-6">
                <CreditCardIcon className="w-7 h-7" /> AVISO DE PAGOS SEGUROS
              </h2>
              
              <div className="space-y-4">
                <p className="font-bold">Los pagos oficiales se realizan únicamente mediante:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-center font-bold">Yape</div>
                  <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-center font-bold">Plin</div>
                  <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-center font-bold">BCP</div>
                  <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-center font-bold">Banco de la Nación</div>
                  <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-center font-bold">Interbank</div>
                </div>
                
                <div className="mt-6 p-4 bg-white rounded-lg border-2 border-primary/20">
                  <p className="text-center font-bold text-lg">
                    El voucher debe enviarse al WhatsApp oficial: <span className="text-primary">954 562 938</span>
                  </p>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p>AVEND DOCENTE no solicita códigos de verificación, claves personales ni información bancaria confidencial.</p>
                  <p>Cualquier comunicación fuera de los canales oficiales no es válida.</p>
                </div>
              </div>
            </section>
          </div>
          
          <div className="bg-gray-50 px-8 py-6 text-center text-gray-500 text-sm border-t border-gray-100">
            &copy; {new Date().getFullYear()} AVEND DOCENTE. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PoliticaPrivacidad;
