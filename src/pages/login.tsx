import React, { useState } from 'react';

import { EyeIcon, EyeOffIcon } from '@heroicons/react/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Footer from '../components/Footer';
import Header from '../components/Header';
import { authService } from '../services/authService';

const Login = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRedirectingToWsp, setIsRedirectingToWsp] = useState(false);

  const planName = router.query.planName as string;
  const planId = router.query.planId as string;
  const redirect = router.query.redirect as string;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginPayload = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      console.log('Login successful, payload:', loginPayload);

      // Extraer datos de manera resiliente (por si el backend devuelve plano o anidado)
      const loginUser = (loginPayload as any).user || loginPayload;
      const token = (loginPayload as any).token || loginUser.token;
      const userId = loginUser.id;

      if (!token) throw new Error('No se recibió el token de autenticación');
      if (!userId) throw new Error('No se recibió el ID de usuario');

      // Guardamos el token inmediatamente para que las siguientes peticiones lo tengan
      localStorage.setItem('token', token);

      // Ahora obtenemos los filtros/exámenes específicos del usuario
      console.log('Fetching user filters with ID:', userId);
      const fullResponse = await authService.getUserFilters(userId, token);
      const response = {
        ...fullResponse.user,
        token: token, // Aseguramos que el token de login se mantenga
      };
      const examenes = fullResponse.examenes || [];
      const fullName = response.fullName || response.email;

      if (fullName) localStorage.setItem('fullName', fullName);
      if (response.id) localStorage.setItem('userId', String(response.id));
      if (response.nivelId)
        localStorage.setItem('nivelId', String(response.nivelId));
      if (response.modalidadId)
        localStorage.setItem('modalidadId', String(response.modalidadId));

      let finalRole = response.role;
      if (
        response.fechaExpiracion &&
        response.fechaExpiracion !== '-' &&
        finalRole?.toUpperCase() === 'PREMIUM'
      ) {
        const expDate = new Date(response.fechaExpiracion);
        if (expDate < new Date()) {
          finalRole = 'Client';
        }
      }

      if (finalRole) localStorage.setItem('role', finalRole);
      if (response.fechaExpiracion)
        localStorage.setItem('fechaExpiracion', response.fechaExpiracion);
      if (response.accesoNombres) {
        localStorage.setItem(
          'accesoNombres',
          JSON.stringify(response.accesoNombres)
        );
      }
      if (response.accesoIds) {
        localStorage.setItem('accesoIds', JSON.stringify(response.accesoIds));
      }
      if (response.especialidad)
        localStorage.setItem('especialidad', response.especialidad);
      if (response.especialidadId)
        localStorage.setItem('especialidadId', String(response.especialidadId));

      if (examenes.length > 0) {
        localStorage.setItem('loginExamenes', JSON.stringify(examenes));
      } else {
        localStorage.removeItem('loginExamenes');
      }

      if (planName) {
        setIsRedirectingToWsp(true);
        setTimeout(() => {
          const wspUrl = `https://wa.me/51947282682?text=Hola,%20me%20interesa%20el%20${encodeURIComponent(
            planName
          )}`;
          window.location.href = wspUrl;
        }, 2500);
        return;
      }

      if (
        finalRole?.toUpperCase() === 'ADMIN' ||
        finalRole?.toUpperCase() === 'SUBADMIN'
      ) {
        router.push('/admin/');
      } else if (redirect) {
        router.push(redirect);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(
        err.message ||
          'Error al iniciar sesión. Por favor verifique sus credenciales.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <div className="relative z-50 bg-background w-full">
        <Header />
      </div>

      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 pb-16">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                Bienvenido de nuevo
              </h1>
              <p className="text-base sm:text-lg text-gray-600">
                ¿Aún no tienes una cuenta?{' '}
                <Link
                  href={`/register${
                    planName
                      ? `?planId=${planId}&planName=${encodeURIComponent(
                          planName
                        )}`
                      : ''
                  }${
                    !planName && redirect
                      ? `?redirect=${encodeURIComponent(redirect)}`
                      : ''
                  }`}
                >
                  <a className="font-bold text-primary hover:text-secondary transition-colors duration-200 underline decoration-2 underline-offset-4">
                    Regístrate gratis aquí
                  </a>
                </Link>
              </p>
            </div>

            {isRedirectingToWsp && (
              <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-xl text-center animate-pulse">
                <div className="flex justify-center mb-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  ¡Felicitaciones!
                </h3>
                <p className="text-green-700">
                  Acceso concedido. Estamos redirigiéndote al chat con Juan para
                  activar tu {planName}...
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="juan@ejemplo.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link href="/forgot-password">
                    <a className="font-medium text-primary hover:text-secondary">
                      ¿Olvidaste tu contraseña?
                    </a>
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary hover:bg-secondary'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
                  disabled={loading}
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg
                      className="h-5 w-5 text-blue-300 group-hover:text-blue-200 transition-colors duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      ></path>
                    </svg>
                  </span>
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
