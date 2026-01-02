import React, { useState } from 'react';

import Link from 'next/link';

import Footer from '../components/Footer';
import Header from '../components/Header';
import { authService } from '../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await authService.forgotPassword(email);
      setMessage({
        type: 'success',
        text: 'Si el correo existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Ocurrió un error al procesar tu solicitud.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <div className="relative z-50 bg-background w-full">
        <div className="w-full">
          <Header />
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 pb-16">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                Recuperar Contraseña
              </h1>
              <p className="text-sm text-gray-600">
                Ingresa tu correo electrónico y te enviaremos un enlace para
                restablecer tu contraseña.
              </p>
            </div>

            {message && (
              <div
                className={`mb-4 border-l-4 p-4 ${
                  message.type === 'success'
                    ? 'bg-green-50 border-green-400'
                    : 'bg-red-50 border-red-400'
                }`}
              >
                <div className="flex">
                  <div className="ml-3">
                    <p
                      className={`text-sm ${
                        message.type === 'success'
                          ? 'text-green-700'
                          : 'text-red-700'
                      }`}
                    >
                      {message.text}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Correo electrónico
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200"
                    placeholder="juan@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary hover:bg-secondary'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 shadow-lg`}
                >
                  {loading ? 'Procesando...' : 'Enviar enlace'}
                </button>
              </div>

              <div className="text-center mt-4">
                <Link href="/login">
                  <a className="font-medium text-primary hover:text-secondary">
                    Volver al inicio de sesión
                  </a>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
