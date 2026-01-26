import React, { useState, useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/router';

import Footer from '../components/Footer';
import Header from '../components/Header';

import { authService } from '../services/authService';
import { EyeIcon, EyeOffIcon } from '@heroicons/react/outline';
import {
  especialidadesService,
  Especialidad,
} from '../services/especialidadesService';
import { modalidadService, Modalidad } from '../services/modalidadService';
import { nivelService, Nivel } from '../services/nivelService';
import { regionService, Region } from '../services/regionService';

const Register = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    celular: '',
    region: '',
    regionId: 0,
    modalidadId: 0,
    nivelId: 0,
    especialidadId: 0,
  });

  const [regiones, setRegiones] = useState<Region[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  // Removed 'niveles' state as we fetch specific to modality
  const [filteredNiveles, setFilteredNiveles] = useState<Nivel[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regionsData, modalitiesData] = await Promise.all([
          regionService.getAll(),
          modalidadService.getAll(),
        ]);
        setRegiones(regionsData);
        setModalidades(modalitiesData);
      } catch (err) {
        // console.error('Error loading registration data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchNiveles = async () => {
      if (formData.modalidadId) {
        try {
          const nivelesData = await nivelService.getByModalidadId(
            Number(formData.modalidadId)
          );
          setFilteredNiveles(nivelesData);

          // Reset level if current level is not in the new list (simplified check)
          // or just always reset level on modality change if strictly hierarchical.
          // Checking if current level ID exists in new list:
          const currentLevelExists = nivelesData.some(
            (n) => n.id === Number(formData.nivelId)
          );
          if (!currentLevelExists) {
            setFormData((prev) => ({ ...prev, nivelId: 0, especialidadId: 0 }));
          }
        } catch (err) {
          // console.error('Error loading levels:', err);
          setFilteredNiveles([]);
        }
      } else {
        setFilteredNiveles([]);
        setFormData((prev) => ({ ...prev, nivelId: 0, especialidadId: 0 }));
      }
    };
    fetchNiveles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.modalidadId]); // Removed formData.nivelId dependency to avoid cycles, just fetching on modality change.

  useEffect(() => {
    const fetchEspecialidades = async () => {
      if (formData.nivelId) {
        try {
          const data = await especialidadesService.getByNivel(
            Number(formData.nivelId)
          );
          setEspecialidades(data);

          const currentExists = data.some(
            (n) => n.id === Number(formData.especialidadId)
          );
          if (!currentExists) {
            setFormData((prev) => ({ ...prev, especialidadId: 0 }));
          }
        } catch (err) {
          // console.error('Error loading especialidades:', err);
          setEspecialidades([]);
        }
      } else {
        setEspecialidades([]);
        setFormData((prev) => ({ ...prev, especialidadId: 0 }));
      }
    };
    fetchEspecialidades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.nivelId]);

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    };
    setPasswordRequirements(requirements);
    return Object.values(requirements).every(req => req);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Validate password in real-time
    if (name === 'password') {
      validatePassword(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoading(true);
    setError('');

    // Validate password complexity
    if (!validatePassword(formData.password)) {
      setError('La contraseña no cumple con todos los requisitos de seguridad.');
      setLoading(false);
      return;
    }

    try {
      // Removed mandatory check for especialidadId
      // if (!formData.especialidadId) {
      //    throw new Error("Por favor seleccione una especialidad");
      // }

      await authService.register({
        nombreCompleto: formData.name,
        email: formData.email,
        password: formData.password,
        celular: formData.celular,
        regionId: Number(formData.regionId),
        modalidadId: Number(formData.modalidadId),
        nivelId: Number(formData.nivelId),
        especialidadId: Number(formData.especialidadId),
      });
      router.push('/login');
    } catch (err: any) {
      setError(
        err.message || 'Error al registrarse. Por favor intente de nuevo.'
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
        <div className="w-full max-w-lg bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                Crea tu cuenta
              </h1>
              <p className="text-sm text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/login">
                  <a className="font-medium text-primary hover:text-secondary transition-colors duration-200">
                    Inicia sesión aquí
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
                {/* Nombre Completo */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nombre completo
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                </div>

                {/* Email */}
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
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="juan@ejemplo.com"
                    />
                  </div>
                </div>

                {/* Celular */}
                <div>
                  <label
                    htmlFor="celular"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Celular
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      id="celular"
                      name="celular"
                      type="tel"
                      required
                      value={formData.celular}
                      onChange={handleChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="999888777"
                    />
                  </div>
                </div>

                {/* Región */}
                <div>
                  <label
                    htmlFor="regionId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Región
                  </label>
                  <select
                    id="regionId"
                    name="regionId"
                    required
                    value={formData.regionId}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  >
                    <option value={0}>Seleccione una región</option>
                    {regiones.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Modalidad */}
                <div>
                  <label
                    htmlFor="modalidadId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Modalidad
                  </label>
                  <select
                    id="modalidadId"
                    name="modalidadId"
                    required
                    value={formData.modalidadId}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  >
                    <option value={0}>Seleccione una modalidad</option>
                    {modalidades.map((mod) => (
                      <option key={mod.id} value={mod.id}>
                        {mod.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nivel */}
                <div>
                  <label
                    htmlFor="nivelId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nivel
                  </label>
                  <select
                    id="nivelId"
                    name="nivelId"
                    required
                    disabled={!formData.modalidadId}
                    value={formData.nivelId}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md disabled:bg-gray-100"
                  >
                    <option value={0}>Seleccione un nivel</option>
                    {filteredNiveles.map((nivel) => (
                      <option key={nivel.id} value={nivel.id}>
                        {nivel.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Especialidad */}
                <div>
                  <label
                    htmlFor="especialidadId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Especialidad{' '}
                    <span className="text-gray-400 font-normal">
                      (Opcional)
                    </span>
                  </label>
                  <select
                    id="especialidadId"
                    name="especialidadId"
                    disabled={!formData.nivelId || especialidades.length === 0}
                    value={formData.especialidadId}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md disabled:bg-gray-100"
                  >
                    <option value={0}>
                      Seleccione una especialidad (Opcional)
                    </option>
                    {especialidades.map((esp) => (
                      <option key={esp.id} value={esp.id}>
                        {esp.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Contraseña
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-700">La contraseña debe contener:</p>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs">
                        {passwordRequirements.length ? (
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className={passwordRequirements.length ? 'text-green-700' : 'text-gray-600'}>
                          Mínimo 8 caracteres
                        </span>
                      </div>
                      <div className="flex items-center text-xs">
                        {passwordRequirements.uppercase ? (
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className={passwordRequirements.uppercase ? 'text-green-700' : 'text-gray-600'}>
                          Al menos una letra mayúscula (A-Z)
                        </span>
                      </div>
                      <div className="flex items-center text-xs">
                        {passwordRequirements.number ? (
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className={passwordRequirements.number ? 'text-green-700' : 'text-gray-600'}>
                          Al menos un número (0-9)
                        </span>
                      </div>
                      <div className="flex items-center text-xs">
                        {passwordRequirements.special ? (
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className={passwordRequirements.special ? 'text-green-700' : 'text-gray-600'}>
                          Al menos un símbolo (!@#$%^&*)
                        </span>
                      </div>
                    </div>
                  </div>
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
                  {loading ? 'Registrando...' : 'Crear cuenta'}
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

export default Register;
