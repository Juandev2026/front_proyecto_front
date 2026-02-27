import React, { useState, useEffect, useMemo } from 'react';

import { SearchIcon } from '@heroicons/react/solid';
import Link from 'next/link';

import AdSidebar from '../components/AdSidebar';
import CommunitySection from '../components/CommunitySection';
import FadeIn from '../components/FadeIn';
import Footer from '../components/Footer';
import Header from '../components/Header';
import RelevantInfoCarousel from '../components/RelevantInfoCarousel';
import { useAuth } from '../hooks/useAuth';
import { categoriaService, Categoria } from '../services/categoriaService';
import { cursoService, Curso } from '../services/cursoService';
import { createSlug } from '../utils/urlUtils';

const Cursos = () => {
  const [courses, setCourses] = useState<Curso[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'level'>('all');
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoading(true);
        let coursesData;
        if (filterMode === 'level' && user?.nivelId) {
          coursesData = await cursoService.getByNivel(user.nivelId);
        } else {
          coursesData = await cursoService.getAll();
        }

        const [categoriesData] = await Promise.all([categoriaService.getAll()]);

        // Filter by state "PUBLICADO"
        const publishedCourses = coursesData.filter(
          (c) => c.estado?.nombre?.toUpperCase() === 'PUBLICADO'
        );

        // Sort by ID descending (newest first)
        setCourses(publishedCourses.sort((a, b) => b.id - a.id));
        setCategories(categoriesData);
      } catch (error) {
        // console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterMode, user?.nivelId]);

  const categoryNames = useMemo(() => {
    return ['Todos', ...categories.map((c) => c.nombre)];
  }, [categories]);

  const filteredCourses = useMemo(() => {
    let result = courses;

    // Filter by Category
    if (selectedCategory !== 'Todos') {
      const category = categories.find((c) => c.nombre === selectedCategory);
      if (category) {
        result = result.filter((course) => course.categoriaId === category.id);
      } else {
        result = []; // Category selected but not found (edge case)
      }
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (course) =>
          course.nombre.toLowerCase().includes(query) ||
          (course.descripcion &&
            course.descripcion.toLowerCase().includes(query))
      );
    }

    return result;
  }, [selectedCategory, courses, categories, searchQuery]);

  const displayedCourses = useMemo(() => {
    if (!isAuthenticated) {
      return filteredCourses.slice(0, 3);
    }
    return filteredCourses;
  }, [filteredCourses, isAuthenticated]);

  const getCategoryName = (id: number) => {
    const category = categories.find((c) => c.id === id);
    return category ? category.nombre : 'General';
  };

  // Helper to strip HTML tags
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '');
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
      <div className="w-full">
        <Header />
      </div>

      <main className="flex-grow py-12">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-32">
          <FadeIn>
            <div className="text-center mb-10">
              <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                Nuestros <span className="text-primary">Cursos</span>
              </h1>
              <p className="max-w-2xl mx-auto text-xl text-gray-500">
                Aprende con los mejores expertos
              </p>
            </div>
          </FadeIn>

          {/* Search Bar */}
          <div className="mb-10 max-w-3xl mx-auto">
            <div className="relative group">
              <input
                type="text"
                placeholder="Buscar cursos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
              />
              <SearchIcon className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-primary" />
            </div>
          </div>

          {/* Category Tabs */}
          {/* Categories (Desktop) */}
          <div className="hidden md:flex flex-wrap justify-center gap-2 mb-10 border-b pb-8">
            {categoryNames.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Categories (Mobile) */}
          <div className="flex md:hidden flex-wrap justify-center gap-2 mb-10 border-b pb-8">
            {categoryNames.slice(0, 6).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}

            {/* Dropdown for the rest */}
            {categoryNames.length > 6 && (
              <div className="relative">
                <select
                  className={`appearance-none pl-4 pr-8 py-2 rounded-full text-sm font-semibold border transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-primary ${
                    categoryNames.slice(6).includes(selectedCategory)
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                  value={
                    categoryNames.slice(6).includes(selectedCategory)
                      ? selectedCategory
                      : ''
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedCategory(e.target.value);
                    }
                  }}
                >
                  <option value="" disabled className="text-gray-500 bg-white">
                    {categoryNames.slice(6).includes(selectedCategory)
                      ? selectedCategory
                      : 'Más...'}
                  </option>
                  {categoryNames.slice(6).map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                      className="text-gray-900 bg-white"
                    >
                      {cat}
                    </option>
                  ))}
                </select>
                <div
                  className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${
                    categoryNames.slice(6).includes(selectedCategory)
                      ? 'text-white'
                      : 'text-gray-600'
                  }`}
                >
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-9">
              {loading ? (
                <div className="text-center py-20">
                  <p className="text-xl text-gray-500">Cargando cursos...</p>
                </div>
              ) : (
                <>
                  {/* Courses Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
                    {displayedCourses.map((course, index) => (
                      <FadeIn key={course.id} delay={index * 0.1}>
                        <Link
                          href={`/cursos/${createSlug(
                            course.nombre,
                            course.id
                          )}`}
                        >
                          <a className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col h-full border border-gray-100 overflow-hidden transform hover:-translate-y-2">
                            <div className="relative h-64 overflow-hidden">
                              <img
                                src={
                                  course.imagenUrl ||
                                  '/assets/images/product1.jpg'
                                }
                                alt={course.nombre}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute top-4 left-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-primary backdrop-blur-sm shadow-sm">
                                  {getCategoryName(course.categoriaId)}
                                </span>
                              </div>
                            </div>

                            <div className="p-8 flex flex-col flex-grow">
                              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors duration-300">
                                {stripHtml(course.nombre)}
                              </h3>
                              <p className="text-gray-600 text-base leading-relaxed mb-6 flex-grow line-clamp-3">
                                {stripHtml(course.descripcion)}
                              </p>

                              {/* Content Preview */}
                              {course.temas && course.temas.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                    Contenido:
                                  </h4>
                                  <ul className="text-sm text-gray-500 space-y-1">
                                    {course.temas.slice(0, 3).map((tema) => (
                                      <li
                                        key={tema.id}
                                        className="flex items-center"
                                      >
                                        <svg
                                          className="w-3 h-3 mr-2 text-green-500"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M5 13l4 4L19 7"
                                          ></path>
                                        </svg>
                                        <span className="truncate">
                                          {tema.nombre}
                                        </span>
                                      </li>
                                    ))}
                                    {course.temas.length > 3 && (
                                      <li className="text-xs text-primary pl-5">
                                        + {course.temas.length - 3} temas más
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}

                              <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg font-bold text-gray-900">
                                    S/{' '}
                                    {course.precioOferta > 0
                                      ? course.precioOferta
                                      : course.precio}
                                  </span>
                                  {course.precioOferta > 0 && (
                                    <span className="text-sm text-gray-500 line-through">
                                      S/ {course.precio}
                                    </span>
                                  )}
                                </div>
                                <div className="inline-flex items-center text-primary font-semibold hover:text-blue-700 transition-colors justify-center">
                                  Ver Curso
                                  <svg
                                    className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </a>
                        </Link>
                      </FadeIn>
                    ))}
                  </div>

                  {!isAuthenticated && !authLoading && (
                    <div className="mt-12 text-center">
                      <div className="bg-blue-50 rounded-2xl p-8 md:p-12 shadow-lg border border-blue-100">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          ¿Quieres descargar recursos personalizados?
                        </h3>

                        <Link href="/register">
                          <a className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-secondary transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                            Regístrate Gratis
                          </a>
                        </Link>
                        <p className="mt-4 text-sm text-gray-500">
                          ¿Ya tienes cuenta?{' '}
                          <Link href="/login">
                            <a className="text-primary font-medium hover:underline">
                              Inicia sesión aquí
                            </a>
                          </Link>
                        </p>
                      </div>
                    </div>
                  )}
                  {filteredCourses.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        No se encontraron cursos
                      </h3>
                      <p className="mt-2 text-gray-500">
                        Intenta seleccionar otra categoría.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="col-span-12 lg:col-span-3">
              <AdSidebar />
            </div>
          </div>
        </div>
      </main>

      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-32 pb-12">
        <CommunitySection />
        <div className="mt-16">
          <RelevantInfoCarousel />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cursos;
