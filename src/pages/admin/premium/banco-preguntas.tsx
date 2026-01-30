import React, { useState, useEffect, useMemo } from 'react';

import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XIcon,
  PlusIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/outline';
import dynamic from 'next/dynamic';

import AdminLayout from '../../../components/AdminLayout';
import { estadoService, Estado } from '../../../services/estadoService';
import {
  premiumService,
  PremiumContent,
} from '../../../services/premiumService';
import { uploadService } from '../../../services/uploadService';
import 'react-quill/dist/quill.snow.css';

// Dynamic import for ReactQuill
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const Recursos = () => {
  // --- ESTADOS LOGICOS (CRUD) ---
  const [items, setItems] = useState<PremiumContent[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(true);

  // CORRECCIÓN 1: Ahora usamos la variable 'error' para mostrar una alerta visual
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<PremiumContent | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // --- ESTADOS VISUALES (FILTROS UI) ---
  const [filtroTipoExamen, setFiltroTipoExamen] = useState('');
  const [filtroSeccionFuente, setFiltroSeccionFuente] = useState('');

  // Form State
  const [newItem, setNewItem] = useState({
    titulo: '',
    descripcion: '',
    url: '',
    imageUrl: '',
    archivoUrl: '',
    videoUrl: '',
    estadoId: 0,
    usuarioEdicionId:
      typeof window !== 'undefined'
        ? Number(localStorage.getItem('userId') || 0)
        : 0,
    precio: 0,
    telefono: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // --- UTILS ---
  const stripHtml = (html: string) => {
    if (!html) return '';
    if (typeof window === 'undefined') return html;
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    let text = tmp.textContent || tmp.innerText || '';
    if (text.trim().startsWith('<') && text.includes('>')) {
      const tmp2 = document.createElement('DIV');
      tmp2.innerHTML = text;
      text = tmp2.textContent || tmp2.innerText || '';
    }
    return text;
  };

  const getFileFormat = (url: string) => {
    if (!url) return 'FILE';
    const extension = url.split('.').pop()?.toUpperCase();
    return extension && extension.length <= 4 ? extension : 'FILE';
  };

  // --- DATA FETCHING ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null); // Limpiamos errores previos
      const [data, estadosData] = await Promise.all([
        premiumService.getAll(),
        estadoService.getAll(),
      ]);
      setItems(data.sort((a, b) => b.id - a.id));
      setEstados(estadosData);
    } catch (err) {
      setError('Error al cargar datos. Por favor intente nuevamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FILTRADO DE ITEMS (CORRECCIÓN 2: useMemo) ---
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filtramos solo si hay una sección seleccionada
      const matchesSeccion =
        !filtroSeccionFuente || item.id === Number(filtroSeccionFuente);
      return matchesSeccion;
    });
  }, [items, filtroSeccionFuente]); // Se eliminó 'filtroTipoExamen' porque no se usaba dentro del filtro

  // --- PAGINATION LÓGICA ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // --- HANDLERS (CRUD) ---
  const handleDelete = async (id: number) => {
    // CORRECCIÓN 3: Deshabilitar regla no-alert para window.confirm
    // eslint-disable-next-line no-alert
    if (window.confirm('¿Estás seguro de eliminar este recurso?')) {
      try {
        await premiumService.delete(id);
        fetchData();
      } catch (err) {
        alert('Error eliminando contenido');
      }
    }
  };

  const handleEdit = (item: PremiumContent) => {
    setEditingId(item.id);
    setNewItem({
      titulo: item.titulo,
      descripcion: item.descripcion,
      url: item.url,
      imageUrl: item.imageUrl || '',
      archivoUrl: item.archivoUrl || '',
      videoUrl: item.videoUrl || '',
      estadoId: item.estadoId || 0,
      usuarioEdicionId: Number(localStorage.getItem('userId') || 0),
      precio: item.precio || 0,
      telefono: item.telefono || '',
    });
    setFile(null);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleView = (item: PremiumContent) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFile(null);
    setImageFile(null);
    const estadoPublicado = estados.find(
      (e) => e.nombre.toLowerCase() === 'publicado'
    );
    setNewItem({
      titulo: '',
      descripcion: '',
      url: '',
      imageUrl: '',
      archivoUrl: '',
      videoUrl: '',
      estadoId: estadoPublicado ? estadoPublicado.id : 0,
      usuarioEdicionId: Number(localStorage.getItem('userId') || 0),
      precio: 0,
      telefono: '',
    });
  };

  const handleAddNew = () => {
    setIsModalOpen(true);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItem.titulo.trim()) {
      // eslint-disable-next-line no-alert
      alert('El título es obligatorio');
      return;
    }
    if (newItem.estadoId === 0) {
      // eslint-disable-next-line no-alert
      alert('Debe seleccionar un estado');
      return;
    }

    if (!newItem.usuarioEdicionId || Number(newItem.usuarioEdicionId) <= 0) {
      const storedId = Number(localStorage.getItem('userId') || 0);
      if (storedId <= 0) {
        // eslint-disable-next-line no-alert
        alert('Error de sesión. Vuelva a ingresar.');
        return;
      }
      newItem.usuarioEdicionId = storedId;
    }

    try {
      let finalUrl = newItem.url;
      if (file) {
        finalUrl = await uploadService.uploadImage(file);
      }
      let finalImageUrl = newItem.imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadService.uploadImage(imageFile);
      }

      const itemData = {
        ...newItem,
        id: editingId || 0,
        url: finalUrl,
        imageUrl: finalImageUrl,
        estadoId: Number(newItem.estadoId),
        usuarioEdicionId: Number(newItem.usuarioEdicionId),
        precio: Number(newItem.precio),
      };

      if (editingId) {
        await premiumService.update(
          editingId,
          itemData as unknown as PremiumContent
        );
      } else {
        await premiumService.create(itemData as unknown as PremiumContent);
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Error guardando recurso');
    }
  };

  // --- EDITOR CONFIG ---
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'clean'],
      ],
    }),
    []
  );

  // --- RENDER ---
  if (loading)
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      {/* SECCIÓN 1: HEADER */}
      <div className="w-full bg-primary py-4 px-6 rounded-t-lg shadow-sm mb-4">
        <h1 className="text-xl font-bold text-white text-center">
          Gestión de banco de preguntas / Recursos
        </h1>
      </div>

      {/* CORRECCIÓN 1: Mostrar el error visualmente si existe */}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">¡Atención! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* SECCIÓN 2: FILTROS */}
        <div className="bg-white rounded-lg shadow-sm border border-primary p-6">
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                Tipo Exámen <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={filtroTipoExamen}
                onChange={(e) => {
                  setFiltroTipoExamen(e.target.value);
                  setFiltroSeccionFuente('');
                  setCurrentPage(1);
                }}
              >
                <option value="">Seleccionar Tipo Exámen</option>
                <option value="Ascenso">Ascenso</option>
                <option value="Nombramiento">Nombramiento</option>
                <option value="Directivos">Directivos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                Sección Fuente <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={filtroSeccionFuente}
                onChange={(e) => {
                  setFiltroSeccionFuente(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={!filtroTipoExamen}
              >
                <option value="">
                  {filtroTipoExamen
                    ? 'Selecciona una sección'
                    : 'Primero selecciona el tipo de examen'}
                </option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {stripHtml(i.titulo).substring(0, 60)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 mt-4">
            <button
              onClick={handleAddNew}
              className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-800 transition-colors text-sm font-medium shadow-md"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Añadir preguntas
            </button>

            <button
              onClick={() => {
                // eslint-disable-next-line no-alert
                alert('Funcionalidad IA en desarrollo');
              }}
              className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-800 transition-colors text-sm font-medium shadow-md"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Añadir preguntas con IA
            </button>

            <button
              onClick={() => {
                // eslint-disable-next-line no-alert
                alert('Funcionalidad IA en desarrollo');
              }}
              className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-800 transition-colors text-sm font-medium shadow-md"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Añadir respuestas con IA
            </button>

            <button
              onClick={() =>
                document
                  .getElementById('tabla-resultados')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="bg-white border border-primary text-primary px-4 py-2 rounded-lg flex items-center hover:bg-blue-50 transition-colors text-sm font-medium"
            >
              <EyeIcon className="w-4 h-4 mr-2" />
              Visualizar preguntas
            </button>
          </div>
        </div>

        {/* SECCIÓN 3: INSTRUCCIONES */}
        <div className="bg-white rounded-lg shadow-sm border border-cyan-400 p-6 relative">
          <h3 className="text-primary font-bold text-lg mb-4">Instrucciones</h3>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            <li>
              <strong>Paso 1:</strong> Selecciona primero el tipo de examen
              (Ascenso, Nombramiento o Directivos)
            </li>
            <li>
              <strong>Paso 2:</strong> Selecciona la sección fuente
              correspondiente (se filtra automáticamente según el tipo de
              examen)
            </li>
            <li>
              <strong>Paso 3:</strong> Los campos adicionales solo aparecen si
              seleccionas una sección fuente que contenga &quot;MINEDU&quot; en
              su nombre
            </li>
            <li>
              <strong>Para Directivos:</strong>
              <ul className="list-circle pl-5 mt-1 text-gray-600">
                <li>
                  Gestiona secciones: puedes crear nuevas secciones o editar
                  existentes
                </li>
                <li>Selecciona la sección específica</li>
                <li>Selecciona el examen de esa sección</li>
                <li>
                  Gestiona exámenes: puedes crear nuevos exámenes o editar
                  existentes
                </li>
              </ul>
            </li>
            <li>
              <strong>Para secciones MINEDU:</strong>
              <ul className="list-circle pl-5 mt-1 text-gray-600">
                <li>Selecciona la modalidad educativa correspondiente</li>
                <li>Para EBR, debes seleccionar el nivel correspondiente</li>
                <li>Solo en Secundaria de EBR puedes elegir especialidad</li>
                <li>Selecciona el año correspondiente</li>
              </ul>
            </li>
            <li className="text-gray-500 italic mt-2 list-none">
              * Todos los campos marcados con * son obligatorios
            </li>
          </ul>
        </div>

        {/* SECCIÓN 4: TABLA */}
        <div
          id="tabla-resultados"
          className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mt-8"
        >
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-gray-700 font-bold">
              Listado de Recursos / Preguntas
            </h3>
            <span className="text-xs text-gray-500 bg-white border px-2 py-1 rounded">
              Total: {filteredItems.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Archivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      {filtroTipoExamen
                        ? 'No se encontraron recursos para los filtros seleccionados.'
                        : 'Selecciona filtros o usa el botón "Añadir" para crear contenido.'}
                    </td>
                  </tr>
                ) : (
                  currentItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stripHtml(item.titulo).substring(0, 40)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{
                            backgroundColor: item.estado?.colorHex
                              ? `${item.estado.colorHex}20`
                              : '#e5e7eb',
                            color: item.estado?.colorHex || '#374151',
                          }}
                        >
                          {item.estado?.nombre || 'Sin Estado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.precio > 0 ? (
                          `S/ ${item.precio}`
                        ) : (
                          <span className="text-green-600 font-bold">
                            Gratis
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center"
                          >
                            <DocumentTextIcon className="w-4 h-4 mr-1" /> Ver
                          </a>
                        ) : (
                          <span className="text-gray-400">Sin archivo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded bg-gray-100 text-gray-600 uppercase border border-gray-200">
                          {getFileFormat(item.url)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleView(item)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Ver Detalles"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() =>
                    paginate(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando{' '}
                    <span className="font-medium">{indexOfFirstItem + 1}</span>{' '}
                    a{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, filteredItems.length)}
                    </span>{' '}
                    de{' '}
                    <span className="font-medium">{filteredItems.length}</span>{' '}
                    resultados
                  </p>
                </div>
                <div>
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => paginate(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Anterior</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => paginate(page)}
                          aria-current={
                            currentPage === page ? 'page' : undefined
                          }
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === page
                              ? 'bg-primary text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        paginate(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Siguiente</span>
                      <ChevronRightIcon
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingId ? 'Editar Recurso' : 'Nuevo Recurso'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <XIcon className="w-8 h-8" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna Izquierda */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Título *
                    </label>
                    <div className="mb-6">
                      <ReactQuill
                        theme="snow"
                        value={newItem.titulo}
                        onChange={(value) =>
                          setNewItem({ ...newItem, titulo: value })
                        }
                        className="h-auto bg-white"
                        modules={modules}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Imagen de Portada
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
                      onChange={(e) =>
                        setImageFile(e.target.files?.[0] || null)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Estado *
                    </label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                      value={newItem.estadoId}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          estadoId: Number(e.target.value),
                        })
                      }
                    >
                      <option value={0}>Seleccionar Estado...</option>
                      {estados.map((est) => (
                        <option key={est.id} value={est.id}>
                          {est.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Precio (S/)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                        value={newItem.precio}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            precio: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                        value={newItem.telefono}
                        onChange={(e) =>
                          setNewItem({ ...newItem, telefono: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Columna Derecha */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      URL Principal
                    </label>
                    <input
                      type="url"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                      value={newItem.url}
                      onChange={(e) =>
                        setNewItem({ ...newItem, url: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Archivo URL (o subir abajo)
                    </label>
                    <input
                      type="url"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                      value={newItem.archivoUrl}
                      onChange={(e) =>
                        setNewItem({ ...newItem, archivoUrl: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Subir Archivo
                    </label>
                    <input
                      type="file"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Video URL
                    </label>
                    <input
                      type="url"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                      value={newItem.videoUrl}
                      onChange={(e) =>
                        setNewItem({ ...newItem, videoUrl: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Descripción
                    </label>
                    <div className="h-64 mb-12">
                      <ReactQuill
                        theme="snow"
                        value={newItem.descripcion}
                        onChange={(value) =>
                          setNewItem({ ...newItem, descripcion: value })
                        }
                        className="h-full bg-white"
                        modules={modules}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-blue-800 font-medium transition-colors shadow-lg"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Recurso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {isViewModalOpen && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0">
              <h3 className="text-xl font-bold text-gray-900">
                Detalles del Recurso
              </h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Imagen */}
              {viewingItem.imageUrl && (
                <div className="w-full h-48 rounded-lg overflow-hidden mb-4 border border-gray-200">
                  <img
                    src={viewingItem.imageUrl}
                    alt="Portada"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Título */}
              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                  Título
                </h4>
                <div
                  className="mt-1 text-lg text-gray-900"
                  dangerouslySetInnerHTML={{ __html: viewingItem.titulo }}
                />
              </div>

              {/* Grid info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase">
                    Estado
                  </h4>
                  <span
                    className="inline-flex mt-1 px-2 py-1 text-xs font-semibold rounded-full"
                    style={{
                      backgroundColor: viewingItem.estado?.colorHex
                        ? `${viewingItem.estado.colorHex}20`
                        : '#e5e7eb',
                      color: viewingItem.estado?.colorHex || '#374151',
                    }}
                  >
                    {viewingItem.estado?.nombre}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase">
                    Precio
                  </h4>
                  <p className="font-semibold text-gray-900">
                    {viewingItem.precio > 0
                      ? `S/ ${viewingItem.precio}`
                      : 'Gratis'}
                  </p>
                </div>
              </div>

              {/* Enlaces */}
              <div className="space-y-2">
                {viewingItem.url && (
                  <p className="text-sm">
                    <span className="font-bold">URL Principal:</span>{' '}
                    <a
                      href={viewingItem.url}
                      target="_blank"
                      className="text-primary hover:underline truncate block"
                      rel="noreferrer"
                    >
                      {viewingItem.url}
                    </a>
                  </p>
                )}
                {viewingItem.archivoUrl && (
                  <p className="text-sm">
                    <span className="font-bold">Archivo:</span>{' '}
                    <a
                      href={viewingItem.archivoUrl}
                      target="_blank"
                      className="text-primary hover:underline truncate block"
                      rel="noreferrer"
                    >
                      {viewingItem.archivoUrl}
                    </a>
                  </p>
                )}
                {viewingItem.videoUrl && (
                  <p className="text-sm">
                    <span className="font-bold">Video:</span>{' '}
                    <a
                      href={viewingItem.videoUrl}
                      target="_blank"
                      className="text-primary hover:underline truncate block"
                      rel="noreferrer"
                    >
                      {viewingItem.videoUrl}
                    </a>
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Descripción
                </h4>
                <div
                  className="text-gray-600 prose prose-sm max-w-none bg-gray-50 p-3 rounded"
                  dangerouslySetInnerHTML={{ __html: viewingItem.descripcion }}
                />
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end sticky bottom-0">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Recursos;
