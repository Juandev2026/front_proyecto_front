import React, { useState } from 'react';

import { useRouter } from 'next/router';

import Footer from '../components/Footer';
import Header from '../components/Header';
import CommunitySection from '../components/CommunitySection';
import { authService } from '../services/authService';

const ResetPassword = () => {
  const router = useRouter();
  const { token } = router.query;

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // If we wanted to validate token presence immediately, we could do it here,
  // but typically we let the user fill the form and API will reject if token is invalid/missing.

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }

    if (!token || typeof token !== 'string') {
      setMessage({ type: 'error', text: 'Token inválido o faltante.' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'La contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await authService.resetPassword({
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      setMessage({
        type: 'success',
        text: 'Tu contraseña ha sido restablecida exitosamente.',
      });
      // Optionally redirect after a few seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      // Intentar extraer mensaje de error amigable si es un objeto JSON plano
      let errorMessage = 'Ocurrió un error al restablecer la contraseña.';
      
      if (err.message) {
        // A veces el mensaje es un JSON stringificado como en la captura
        if (typeof err.message === 'string' && err.message.includes('{')) {
          try {
             // Intentar limpiar si empieza con texto raro
             // En la captura se ve: {"type":... "errors":{"NewPassword":...}}
             // A veces axios devuelve el mensaje dentro de response.data
             // Si el err.message es literalmente el JSON
             const parsed = JSON.parse(err.message);
             if (parsed.errors && parsed.errors.NewPassword) {
                 errorMessage = parsed.errors.NewPassword[0];
                 // Traducir mensaje común de Identity
                 if (errorMessage.includes("must be a string or array type with a minimum length of '6'")) {
                     errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
                 }
                 else if (errorMessage.includes("Passwords must have at least one non alphanumeric character")) {
                     errorMessage = 'La contraseña debe tener al menos un carácter no alfanumérico (símbolo).';
                 }
                 else if (errorMessage.includes("Passwords must have at least one digit")) {
                     errorMessage = 'La contraseña debe tener al menos un número.';
                 }
                 else if (errorMessage.includes("Passwords must have at least one uppercase")) {
                     errorMessage = 'La contraseña debe tener al menos una mayúscula.';
                 }
             } else if (parsed.title) {
                 errorMessage = parsed.title;
             }
          } catch (e) {
             errorMessage = err.message;
          }
        } else {
             errorMessage = err.message;
        }
      }

      setMessage({
        type: 'error',
        text: errorMessage,
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
                Restablecer Contraseña
              </h1>
              <p className="text-sm text-gray-600">
                Ingresa tu nueva contraseña.
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
                    {message.type === 'success' && (
                      <p className="text-sm mt-2">Redirigiendo al login...</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nueva Contraseña
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="block w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirmar Contraseña
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200"
                    placeholder="••••••••"
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
                  {loading ? 'Procesando...' : 'Restablecer Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="w-full px-4 sm:px-6 lg:px-8 pb-8 mt-8">
        <CommunitySection />
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
