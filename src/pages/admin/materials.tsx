import React, { useState, useEffect, useMemo } from 'react';

import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XIcon,
  PlusIcon,
  DocumentTextIcon,
  PhotographIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/outline';
import dynamic from 'next/dynamic';

import AdminLayout from '../../components/AdminLayout';
import {
  categoriaSimpleService,
  CategoriaSimple,
} from '../../services/categoriaSimpleService';
import { materialService, Material } from '../../services/materialService';
import { uploadService } from '../../services/uploadService';
import { estadoService, Estado } from '../../services/estadoService';
import 'react-quill/dist/quill.snow.css';

// Dynamic import for ReactQuill
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const AdminMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<CategoriaSimple[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<Material | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [newMaterial, setNewMaterial] = useState({
    titulo: '',
    descripcion: '',
    url: '',
    imageUrl: '',
    archivoUrl: '',
    videoUrl: '',
    categoriaId: 0,
    estadoId: 0,
    usuarioEdicionId:
      typeof window !== 'undefined'
        ? Number(localStorage.getItem('userId') || 0)
        : 0,
    precio: 0,
    telefono: '',
  });
  const [file, setFile] = useState<File | null>(null);

  // strip html for table view
  const stripHtml = (html: string) => {
    if (!html) return '';
    if (typeof window === 'undefined') return html;

    // First pass
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    let text = tmp.textContent || tmp.innerText || '';

    // Check if result looks like it still has tags (double escaped case)
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [materialsData, categoriesData, estadosData] = await Promise.all([
        materialService.getAll(),
        categoriaSimpleService.getAll(),
        estadoService.getAll(),
      ]);
      // Sort by ID descending (newest first)
      setMaterials(materialsData.sort((a, b) => b.id - a.id));
      setCategories(categoriesData);
      setEstados(estadosData);
    } catch (err) {
      setError('Error loading data');
      // console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    // eslint-disable-next-line no-alert
    if (window.confirm('¿Estás seguro de eliminar este material?')) {
      try {
        await materialService.delete(id);
        fetchData();
      } catch (err) {
        // eslint-disable-next-line no-alert
        alert('Error deleting material');
        // console.error(err);
      }
    }
  };

  const handleEdit = (item: Material) => {
    setEditingId(item.id);
    setNewMaterial({
      titulo: item.titulo,
      descripcion: item.descripcion, // HTML content
      url: item.url,
      imageUrl: item.imageUrl || '',
      archivoUrl: item.archivoUrl || '',
      videoUrl: item.videoUrl || '',
      categoriaId: item.categoriaId,
      estadoId: item.estadoId || 0,
      usuarioEdicionId:
        typeof window !== 'undefined'
          ? Number(localStorage.getItem('userId') || 0)
          : 0,
      precio: item.precio || 0,
      telefono: item.telefono || '',
    });
    setFile(null);

    setIsModalOpen(true);
  };

  const handleView = (item: Material) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFile(null);

    setNewMaterial({
      titulo: '',
      descripcion: '',
      url: '',
      imageUrl: '',
      archivoUrl: '',
      videoUrl: '',
      categoriaId: 0,
      estadoId: 0,
      usuarioEdicionId:
        typeof window !== 'undefined'
          ? Number(localStorage.getItem('userId') || 0)
          : 0,
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

    if (
      !newMaterial.usuarioEdicionId ||
      Number(newMaterial.usuarioEdicionId) <= 0
    ) {
      const storedId =
        typeof window !== 'undefined'
          ? Number(localStorage.getItem('userId') || 0)
          : 0;
      if (storedId <= 0) {
        // eslint-disable-next-line no-alert
        alert(
          'Error: No se ha identificado al usuario editor. Por favor, cierre sesión e inicie sesión nuevamente.'
        );
        return;
      }
      newMaterial.usuarioEdicionId = storedId;
    }

    try {
      let finalUrl = newMaterial.url;

      if (file) {
        try {
          finalUrl = await uploadService.uploadImage(file);
        } catch (uploadError) {
          // eslint-disable-next-line no-alert
          alert('Error al subir el archivo. Por favor intente nuevamente.');
          return;
        }
      }

      const materialData = {
        ...newMaterial,
        id: editingId || 0,
        url: finalUrl,
        categoriaId: Number(newMaterial.categoriaId),
        estadoId: Number(newMaterial.estadoId),
        // Send 0 or null for removed fields if API requires them, service handles it
        modalidadId: 0,
        nivelId: 0,
        usuarioEdicionId: Number(newMaterial.usuarioEdicionId),
        precio: Number(newMaterial.precio),
      };

      if (editingId) {
        await materialService.update(
          editingId,
          materialData as unknown as Material
        );
      } else {
        await materialService.create(materialData as unknown as Material);
      }

      setIsModalOpen(false);
      resetForm(); // Reset form
      fetchData();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Error saving material');
      // console.error(err);
    }
  };

  const getCategoryName = (id: number) => {
    const category = categories.find((c) => c.id === id);
    return category ? category.nombre : 'General';
  };

  // Quill Toolbar Modules
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

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = materials.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(materials.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading)
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );

  if (error)
    return (
      <AdminLayout>
        <div className="text-red-500">Error: {error}</div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Recursos
        </h1>
        <button
          onClick={handleAddNew}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Recurso
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Categoría
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
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No hay recursos disponibles.
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stripHtml(item.titulo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {stripHtml(getCategoryName(item.categoriaId))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full" style={{ backgroundColor: item.estado?.colorHex ? item.estado.colorHex + '20' : '#e5e7eb', color: item.estado?.colorHex || '#374151' }}>
                        {item.estado?.nombre || 'Sin Estado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.precio > 0 ? (
                        `S/ ${item.precio}`
                      ) : (
                        <span className="text-green-600 font-bold">Gratis</span>
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
                          <DocumentTextIcon className="w-4 h-4 mr-1" />
                          Ver
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
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${
                currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Anterior
            </button>
            <button
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${
                currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, materials.length)}
                </span>{' '}
                de <span className="font-medium">{materials.length}</span> resultados
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
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first, last, current, and adjacent pages
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const showEllipsis = index > 0 && prevPage !== undefined && page - prevPage > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => paginate(page)}
                          aria-current={currentPage === page ? 'page' : undefined}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === page
                              ? 'bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="sr-only">Siguiente</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
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
                {/* Left Col */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Título del Recurso
                    </label>
                    <div className="mb-6">
                      <ReactQuill
                        theme="snow"
                        value={newMaterial.titulo}
                        onChange={(value) =>
                          setNewMaterial({ ...newMaterial, titulo: value })
                        }
                        className="h-auto bg-white"
                        modules={modules}
                      />
                    </div>
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Imagen de Portada (URL) (Dimensiones recomendadas: 3:2, ej. 1200x800px)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                      value={newMaterial.imageUrl}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          imageUrl: e.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                    {newMaterial.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={newMaterial.imageUrl}
                          alt="Vista previa"
                          className="h-32 rounded-lg object-cover border border-gray-200"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Categoría
                      </label>
                      <select
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                        value={newMaterial.categoriaId}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
                            categoriaId: Number(e.target.value),
                          })
                        }
                      >
                        <option value={0}>Seleccionar...</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                      <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Estado
                      </label>
                      <select
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                        value={newMaterial.estadoId}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
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
                        value={newMaterial.precio}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
                            precio: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Teléfono de Contacto (Opcional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                      value={newMaterial.telefono}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          telefono: e.target.value,
                        })
                      }
                      placeholder="Ej. 51999999999"
                    />
                  </div>
                </div>

                {/* Right Col */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      URL Principal (Link de acceso)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                        value={newMaterial.url}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
                            url: e.target.value,
                          })
                        }
                        placeholder="https://..."
                      />
                      {newMaterial.url && (
                        <a
                          href={newMaterial.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg flex items-center transition-colors"
                          title="Visualizar en nueva pestaña"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Archivo URL (Opcional - Link directo al archivo)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                      value={newMaterial.archivoUrl}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          archivoUrl: e.target.value,
                        })
                      }
                      placeholder="https://... (Ej. PDF, Doc)"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Video URL (Opcional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                      value={newMaterial.videoUrl}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          videoUrl: e.target.value,
                        })
                      }
                      placeholder="https://youtube.com/..."
                    />
                  </div>

                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <label className="block text-gray-700 text-sm font-bold mb-4">
                      O subir nuevo archivo (PDF / Imagen)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="w-full text-sm text-gray-500
                                file:mr-4 file:py-2.5 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-bold
                                file:bg-primary file:text-white
                                hover:file:bg-blue-700
                            "
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFile(e.target.files[0]);
                          // Create a preview URL right away (logic moved to button onClick to avoid state)
                        }
                      }}
                    />
                     {file && (
                        <button
                          type="button"
                          onClick={() => {
                              const url = URL.createObjectURL(file);
                              window.open(url, '_blank');
                          }}
                          className="mt-3 bg-white text-primary border border-primary hover:bg-blue-50 font-bold py-2 px-4 rounded-lg flex items-center shadow-sm text-sm"
                        >
                          <EyeIcon className="w-4 h-4 mr-2" />
                          Visualizar Archivo Seleccionado
                        </button>
                     )}
                    <p className="text-xs text-gray-500 mt-2">
                      * Al subir un archivo, se generará una URL automática que
                      reemplazará la actual.
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Width Desc */}
              <div className="mt-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Descripción (Detallada)
                </label>
                <div className="bg-white rounded-lg border border-gray-200">
                  <ReactQuill
                    theme="snow"
                    value={newMaterial.descripcion}
                    onChange={(value) =>
                      setNewMaterial({ ...newMaterial, descripcion: value })
                    }
                    className="h-64 mb-12"
                    modules={modules}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-100 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mr-4 text-gray-500 hover:text-gray-700 font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Recurso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 bg-gray-50 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                Detalles del Recurso
              </h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon className="w-8 h-8" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Content Info */}
                <div className="space-y-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-primary rounded-full text-xs font-bold uppercase mb-2">
                      {getCategoryName(viewingItem.categoriaId)}
                    </span>
                    <div
                      className="text-3xl font-bold text-gray-900 leading-tight mb-4"
                      dangerouslySetInnerHTML={{ __html: viewingItem.titulo }}
                    />
                    <div className="prose prose-blue max-w-none text-gray-600">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: viewingItem.descripcion,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase">
                        Precio
                      </label>
                      <p className="text-xl font-bold text-gray-900">
                        {viewingItem.precio > 0
                          ? `S/ ${viewingItem.precio}`
                          : 'Gratis'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase">
                        Teléfono
                      </label>
                      <p className="text-lg font-medium text-gray-900">
                        {viewingItem.telefono || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gray-100 rounded-xl overflow-hidden shadow-inner flex items-center justify-center min-h-[400px] border border-gray-200">
                  {(() => {
                    if (!viewingItem.url) {
                      return (
                        <div className="text-center text-gray-500">
                          <PhotographIcon className="w-16 h-16 mx-auto mb-2 text-gray-300" />
                          <p>Este recurso no tiene archivo adjunto.</p>
                        </div>
                      );
                    }

                    return viewingItem.url.toLowerCase().endsWith('.pdf') ? (
                      <iframe
                        src={viewingItem.url}
                        className="w-full h-[500px]"
                        title="Vista previa PDF"
                      ></iframe>
                    ) : (
                      <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                        <img
                          src={viewingItem.url}
                          alt={viewingItem.titulo}
                          className="max-w-full max-h-[500px] object-contain shadow-sm rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              'none';
                            (
                              e.target as HTMLImageElement
                            ).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden text-center text-gray-500">
                          <DocumentTextIcon className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                          <p>No se puede previsualizar este archivo.</p>
                          <a
                            href={viewingItem.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline mt-2 inline-block"
                          >
                            Descargar
                          </a>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="bg-white text-gray-700 font-bold py-2 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
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

export default AdminMaterials;
