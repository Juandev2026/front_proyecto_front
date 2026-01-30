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
} from '@heroicons/react/outline';
import dynamic from 'next/dynamic';

import AdminLayout from '../../components/AdminLayout';
import { premiumService, PremiumContent } from '../../services/premiumService';
import { uploadService } from '../../services/uploadService';
import { estadoService, Estado } from '../../services/estadoService';
import 'react-quill/dist/quill.snow.css';

// Dynamic import for ReactQuill
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const AdminPremium = () => {
  const [items, setItems] = useState<PremiumContent[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<PremiumContent | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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

  // strip html for table view
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [premiumData, estadosData] = await Promise.all([
        premiumService.getAll(),
        estadoService.getAll(),
      ]);
      setItems(premiumData.sort((a, b) => b.id - a.id));
      setEstados(estadosData);
    } catch (err) {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este contenido?')) {
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
      usuarioEdicionId:
        typeof window !== 'undefined'
          ? Number(localStorage.getItem('userId') || 0)
          : 0,
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

    const estadoPublicado = estados.find(e => e.nombre.toLowerCase() === 'publicado');
    setNewItem({
      titulo: '',
      descripcion: '',
      url: '',
      imageUrl: '',
      archivoUrl: '',
      videoUrl: '',
      estadoId: estadoPublicado ? estadoPublicado.id : 0,
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
      !newItem.usuarioEdicionId ||
      Number(newItem.usuarioEdicionId) <= 0
    ) {
      const storedId =
        typeof window !== 'undefined'
          ? Number(localStorage.getItem('userId') || 0)
          : 0;
      if (storedId <= 0) {
        alert(
          'Error: No se ha identificado al usuario editor. Por favor, cierre sesión e inicie sesión nuevamente.'
        );
        return;
      }
      newItem.usuarioEdicionId = storedId;
    }

    try {
      let finalUrl = newItem.url;

      if (file) {
        try {
          finalUrl = await uploadService.uploadImage(file);
        } catch (uploadError) {
          alert('Error al subir el archivo. Por favor intente nuevamente.');
          return;
        }
      }

      let finalImageUrl = newItem.imageUrl;

      if (imageFile) {
        try {
            finalImageUrl = await uploadService.uploadImage(imageFile);
        } catch (uploadError) {
             alert('Error al subir la imagen de portada.');
             return;
        }
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
      alert('Error guardando contenido premium');
    }
  };

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
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(items.length / itemsPerPage);

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
          Gestión de Contenido Premium
        </h1>
        <button
          onClick={handleAddNew}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Premium
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
                    No hay contenido premium disponible.
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
                  {Math.min(indexOfLastItem, items.length)}
                </span>{' '}
                de <span className="font-medium">{items.length}</span> resultados
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
                {editingId ? 'Editar Contenido Premium' : 'Nuevo Contenido Premium'}
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
                      Título
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

                  {/* Image URL */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Imagen de Portada (URL) (Dimensiones recomendadas: 3:2, ej. 1200x800px)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                      value={newItem.imageUrl}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          imageUrl: e.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                    {newItem.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={newItem.imageUrl}
                          alt="Vista previa"
                          className="h-32 rounded-lg object-cover border border-gray-200"
                        />
                      </div>
                    )}
                    
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-2 w-full text-sm text-gray-500
                                file:mr-4 file:py-2.5 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-bold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                            "
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setImageFile(file);
                          const tempUrl = URL.createObjectURL(file);
                          setNewItem({ ...newItem, imageUrl: tempUrl });
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        O selecciona un archivo para subir (reemplazará la URL al guardar).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Estado
                      </label>
                      <select
                        required
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
                      value={newItem.telefono}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
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
                        value={newItem.url}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            url: e.target.value,
                          })
                        }
                        placeholder="https://..."
                      />
                      {newItem.url && (
                        <a
                          href={newItem.url}
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
                      value={newItem.archivoUrl}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
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
                      value={newItem.videoUrl}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
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
                          // Auto fill file url field to indicate selection, though not real url yet
                          setNewItem({ ...newItem, archivoUrl: 'Archivo seleccionado para subir' });
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Descripción Detallada
                    </label>
                    <div className="h-64 mb-12">
                      <ReactQuill
                        theme="snow"
                        value={newItem.descripcion}
                        onChange={(value) =>
                          setNewItem({
                            ...newItem,
                            descripcion: value,
                          })
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
                  className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-500/30"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Contenido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Detalles del Contenido
              </h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {viewingItem.imageUrl && (
                <div className="w-full h-48 rounded-lg overflow-hidden mb-4">
                  <img
                    src={viewingItem.imageUrl}
                    alt={viewingItem.titulo}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                  Título
                </h4>
                <div
                  className="mt-1 text-lg text-gray-900"
                  dangerouslySetInnerHTML={{ __html: viewingItem.titulo }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                    Precio
                  </h4>
                  <p className="mt-1 text-gray-900">
                    {viewingItem.precio > 0
                      ? `S/ ${viewingItem.precio}`
                      : 'Gratis'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                    Estado
                  </h4>
                  <span className="mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: viewingItem.estado?.colorHex ? viewingItem.estado.colorHex + '20' : '#e5e7eb', color: viewingItem.estado?.colorHex || '#374151' }}>
                    {viewingItem.estado?.nombre || 'Sin Estado'}
                  </span>
                </div>
              </div>
              
               <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                  URLs
                </h4>
                <div className="mt-1 space-y-1">
                   {viewingItem.url && <p className="text-sm"><span className="font-semibold">Principal:</span> <a href={viewingItem.url} target="_blank" className="text-blue-600 hover:underline">{viewingItem.url}</a></p>}
                   {viewingItem.archivoUrl && <p className="text-sm"><span className="font-semibold">Archivo:</span> <a href={viewingItem.archivoUrl} target="_blank" className="text-blue-600 hover:underline">{viewingItem.archivoUrl}</a></p>}
                   {viewingItem.videoUrl && <p className="text-sm"><span className="font-semibold">Video:</span> <a href={viewingItem.videoUrl} target="_blank" className="text-blue-600 hover:underline">{viewingItem.videoUrl}</a></p>}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                  Descripción
                </h4>
                <div
                  className="mt-2 text-gray-600 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: viewingItem.descripcion }}
                />
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
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

export default AdminPremium;
