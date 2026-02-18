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
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      // Handle potential case sensitivity or missing property
      const fullName =
        response.fullName ||
        (response as any).FullName ||
        (response as any).fullname ||
        response.email;

      localStorage.setItem('token', response.token);
      if (fullName) {
        localStorage.setItem('fullName', fullName);
      }
      if (response.id) {
        localStorage.setItem('userId', String(response.id));
      }
      if (response.nivelId) {
        localStorage.setItem('nivelId', String(response.nivelId));
      }
      // Save role safely handling null/undefined
      if (response.role) {
        localStorage.setItem('role', response.role);
      }
      
      if (response.accesoNombres) {
        localStorage.setItem('accesoNombres', JSON.stringify(response.accesoNombres));
      }


      if (
        response.role?.toUpperCase() === 'ADMIN' ||
        response.role?.toUpperCase() === 'SUBADMIN'
      ) {
        router.push('/admin/');
      } else {
        router.push('/'); // Redirect to home or dashboard
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
        <div className="w-full">
          <Header />
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 pb-16">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                Bienvenido de nuevo
              </h1>
              <p className="text-sm text-gray-600">
                ¿Aún no tienes una cuenta?{' '}
                <Link href="/register">
                  <a className="font-medium text-primary hover:text-secondary transition-colors duration-200">
                    Regístrate gratis aquí
                  </a>
                </Link>
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
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
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        ></path>
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200 ease-in-out hover:border-gray-400"
                      placeholder="juan@ejemplo.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Contraseña
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        ></path>
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm transition-all duration-200 ease-in-out hover:border-gray-400"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
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
