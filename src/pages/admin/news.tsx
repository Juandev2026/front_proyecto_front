import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';

import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XIcon,
  PlusIcon,
  CalendarIcon,
  StarIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  TagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/outline';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

import AdminLayout from '../../components/AdminLayout';
import {
  categoriaGeneralService,
  CategoriaGeneral,
} from '../../services/categoriaGeneralService';
import { modalidadService, Modalidad } from '../../services/modalidadService';
import { nivelService, Nivel } from '../../services/nivelService';
import { noticiaService, Noticia } from '../../services/noticiaService';
import { uploadService } from '../../services/uploadService';
import { estadoService, Estado } from '../../services/estadoService';


const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const AdminNews = () => {
  const [news, setNews] = useState<Noticia[]>([]);
  const [categories, setCategories] = useState<CategoriaGeneral[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [filteredNiveles, setFilteredNiveles] = useState<Nivel[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<Noticia | null>(null);

  const [formData, setFormData] = useState<Partial<Noticia>>({
    titulo: '',
    descripcion: '',
    categoriaId: 0,
    modalidadId: 0,
    nivelId: 0,
    fecha: new Date().toISOString(),
    imageUrl: '',
    archivoUrl: '',
    videoUrl: '',
    esDestacado: false,
    esNormaLegal: false,
    usuarioEdicionId:
      typeof window !== 'undefined'
        ? Number(localStorage.getItem('userId') || 0)
        : 0,
    precio: 0,
    autor: 'AVEND',
    estadoId: 0,
    textoBotonDescarga: 'CLICK AQUÍ',
    linkDescarga: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [archivoFile, setArchivoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewArchivoUrl, setPreviewArchivoUrl] = useState<string | null>(null);

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'link',
    'image',
  ];

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

  const fetchNews = useCallback(async () => {
    try {
      const data = await noticiaService.getAll();
      setNews(data.sort((a, b) => b.id - a.id));
    } catch (error) {
      // Error ignored
    }
  }, []);

  // Removed duplicate fetchNews declaration

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoriaGeneralService.getAll();
      setCategories(data);
    } catch (error) {
      // Error ignored
    }
  }, []);

  const fetchModalidades = useCallback(async () => {
    try {
      const data = await modalidadService.getAll();
      setModalidades(data);
    } catch (error) {
      // Error ignored
    }
  }, []);

  const fetchNiveles = useCallback(async () => {
    try {
      const data = await nivelService.getAll();
      setNiveles(data);
    } catch (error) {
      // Error ignored
    }
  }, []);

  const fetchEstados = useCallback(async () => {
    try {
      const data = await estadoService.getAll();
      setEstados(data);
    } catch (error) {
      // Error ignored
    }
  }, []);

  useEffect(() => {
    fetchNews();
    fetchCategories();
    fetchModalidades();
    fetchNiveles();
    fetchEstados();
  }, [fetchNews, fetchCategories, fetchModalidades, fetchNiveles, fetchEstados]);

  // Filter levels when modality changes or modal opens with data
  // Filter levels when modality changes or modal opens with data
  useEffect(() => {
    if (formData.modalidadId) {
      const filtered = niveles.filter((n) => {
        if (Array.isArray(n.modalidadIds)) {
          return n.modalidadIds.includes(Number(formData.modalidadId));
        }
        return n.modalidadIds === Number(formData.modalidadId);
      });
      setFilteredNiveles(filtered);
    } else {
      setFilteredNiveles([]);
    }
  }, [formData.modalidadId, niveles]);

  // Cleanup blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (previewArchivoUrl) URL.revokeObjectURL(previewArchivoUrl);
    };
  }, [previewUrl, previewArchivoUrl]);

  const { user } = useAuth(); // Get user from hook

  const handleDelete = async (item: Noticia) => {
    // Check if user is NOT admin to enforce the 7-day rule
    // Ensure case-insensitive check just in case, though usually roles are uppercase
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

    if (
      !isAdmin &&
      new Date().getTime() - new Date(item.fecha).getTime() >
      7 * 24 * 60 * 60 * 1000
    ) {
      // eslint-disable-next-line no-alert
      alert('No puedes eliminar noticias con más de 7 días de antigüedad.');
      return;
    }

    // eslint-disable-next-line no-alert
    if (window.confirm('¿Estás seguro de eliminar esta noticia?')) {
      try {
        await noticiaService.delete(item.id);
        fetchNews();
      } catch (error) {
        // Error ignored
      }
    }
  };

  const handleEdit = (item: Noticia) => {
    setEditingId(item.id);
    setFormData({
      titulo: item.titulo,
      descripcion: item.descripcion,
      categoriaId: item.categoriaId || 0,
      modalidadId: item.modalidadId || 0,
      nivelId: item.nivelId || 0,
      fecha: item.fecha,
      imageUrl: item.imageUrl,
      archivoUrl: item.archivoUrl,
      videoUrl: item.videoUrl,
      esDestacado: item.esDestacado,
      esNormaLegal: item.esNormaLegal || false,
      usuarioEdicionId:
        typeof window !== 'undefined'
          ? Number(localStorage.getItem('userId') || 0)
          : 0,
      precio: item.precio || 0,
      autor: item.autor || 'AVEND',
      estadoId: item.estadoId ?? 0,
      textoBotonDescarga: item.textoBotonDescarga || 'CLICK AQUÍ',
      linkDescarga: item.linkDescarga || '',
    });
    setImageFile(null);
    setArchivoFile(null);
    setPreviewUrl(item.imageUrl || null);
    setPreviewArchivoUrl(item.archivoUrl || null);
    setIsModalOpen(true);
  };

  const handleView = (item: Noticia) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    // Revoke blob URLs to prevent memory leak
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (previewArchivoUrl) URL.revokeObjectURL(previewArchivoUrl);
    
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      titulo: '',
      descripcion: '',
      categoriaId: 0,
      modalidadId: 0,
      nivelId: 0,
      fecha: new Date().toISOString(),
      imageUrl: '',
      archivoUrl: '',
      videoUrl: '',
      esDestacado: false,
      esNormaLegal: false,
      usuarioEdicionId:
        typeof window !== 'undefined'
          ? Number(localStorage.getItem('userId') || 0)
          : 0,
      precio: 0,
      autor: 'AVEND',
      estadoId: 0,
      textoBotonDescarga: 'CLICK AQUÍ',
      linkDescarga: '',
    });
    setImageFile(null);
    setArchivoFile(null);
    setPreviewUrl(null);
    setPreviewArchivoUrl(null);
  };

  const handleAddNew = () => {
    setEditingId(null);
    const estadoPublicado = estados.find(e => e.nombre.toLowerCase() === 'publicado');
    setFormData({
      titulo: '',
      descripcion: '',
      categoriaId: categories.length > 0 ? categories[0]?.id : 0,
      modalidadId: 0,
      nivelId: 0,
      fecha: new Date().toISOString(),
      imageUrl: '',
      archivoUrl: '',
      videoUrl: '',
      esDestacado: false,
      esNormaLegal: false,
      usuarioEdicionId:
        typeof window !== 'undefined'
          ? Number(localStorage.getItem('userId') || 0)
          : 0,
      precio: 0,
      autor: 'AVEND',
      estadoId: estadoPublicado ? estadoPublicado.id : 0,
      textoBotonDescarga: 'CLICK AQUÍ',
      linkDescarga: '',
    });
    setImageFile(null);
    setArchivoFile(null);
    setPreviewUrl(null);
    setPreviewArchivoUrl(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoriaId || formData.categoriaId <= 0) {
      // eslint-disable-next-line no-alert
      alert(`Por favor, seleccione una categoría válida.`);
      return;
    }

    const descriptionText = stripHtml(formData.descripcion || '');
    if (descriptionText.length > 800) {
      // eslint-disable-next-line no-alert
      alert(`La descripción no puede exceder los 800 caracteres. Actual: ${descriptionText.length} caracteres.`);
      return;
    }

    if (!formData.usuarioEdicionId || Number(formData.usuarioEdicionId) <= 0) {
      const storedId =
        typeof window !== 'undefined'
          ? Number(localStorage.getItem('userId') || 0)
          : 0;
      if (storedId <= 0) {
        // eslint-disable-next-line no-alert
        alert('Error: No se ha identificado al usuario editor.');
        return;
      }
      formData.usuarioEdicionId = storedId;
    }

    try {
      let { imageUrl, archivoUrl } = formData;

      if (imageFile) {
        try {
          imageUrl = await uploadService.uploadImage(imageFile);
        } catch (uploadError) {
          // eslint-disable-next-line no-alert
          alert('Error al subir la imagen. Por favor intente nuevamente.');
          return;
        }
      }

      if (archivoFile) {
        try {
          archivoUrl = await uploadService.uploadImage(archivoFile);
        } catch (uploadError) {
          // eslint-disable-next-line no-alert
          alert('Error al subir el archivo. Por favor intente nuevamente.');
          return;
        }
      }

      const dataToSend = {
        id: editingId || 0,
        titulo: formData.titulo || '',
        descripcion: formData.descripcion || '',
        categoriaId: formData.categoriaId || 0,
        modalidadId: formData.modalidadId || 0,
        nivelId: formData.nivelId || 0,
        fecha: new Date(formData.fecha || new Date()).toISOString(),
        imageUrl: imageUrl || '',
        archivoUrl: archivoUrl || '',
        videoUrl: formData.videoUrl || '',
        esDestacado: formData.esDestacado || false,
        esNormaLegal: formData.esNormaLegal || false,
        usuarioEdicionId: formData.usuarioEdicionId || 0,
        precio: formData.precio || 0,
        autor: formData.autor || 'AVEND',
        estadoId: formData.estadoId || 0,
        textoBotonDescarga: formData.textoBotonDescarga || 'CLICK AQUÍ',
        linkDescarga: formData.linkDescarga || '',
      };

      if (editingId) {
        await noticiaService.update(editingId, dataToSend as Noticia);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: unusedId, ...createData } = dataToSend;
        await noticiaService.create(createData);
      }

      handleCloseModal();
      fetchNews();
    } catch (error) {
      // console.error('Error saving news:', error);
    }
  };

  const getCategoryName = (id: number) => {
    const category = categories.find((c) => c.id === id);
    return category ? category.nombre : 'Desconocida';
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = news.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(news.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Noticias
        </h1>
        <button
          onClick={handleAddNew}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nueva Noticia
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Título
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Destacado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Autor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {stripHtml(item.titulo)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {stripHtml(getCategoryName(item.categoriaId))}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(item.fecha).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.esDestacado ? (
                    <span className="text-green-600 font-bold">Sí</span>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.autor || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                    style={{
                      backgroundColor: item.estado?.colorHex
                        ? item.estado.colorHex + '20'
                        : '#e5e7eb',
                      color: item.estado?.colorHex || '#374151',
                    }}
                  >
                    {item.estado?.nombre || 'Sin Estado'}
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
                    onClick={() => handleDelete(item)}
                    className={`mr-4 ${
                      user?.role?.toUpperCase() !== 'ADMIN' &&
                      new Date().getTime() - new Date(item.fecha).getTime() >
                        7 * 24 * 60 * 60 * 1000
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-red-600 hover:text-red-900'
                    }`}
                    title={
                      user?.role?.toUpperCase() !== 'ADMIN' &&
                      new Date().getTime() - new Date(item.fecha).getTime() >
                        7 * 24 * 60 * 60 * 1000
                        ? 'No se puede eliminar después de 7 días'
                        : 'Eliminar'
                    }
                    disabled={
                      user?.role?.toUpperCase() !== 'ADMIN' &&
                      new Date().getTime() - new Date(item.fecha).getTime() >
                        7 * 24 * 60 * 60 * 1000
                    }
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
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
                  {Math.min(indexOfLastItem, news.length)}
                </span>{' '}
                de <span className="font-medium">{news.length}</span> resultados
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
                     // Add ellipsis if there are gaps
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Noticia' : 'Agregar Nueva Noticia'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Título
                  </label>
                  <div className="mb-4">
                    <ReactQuill
                      key={`titulo-${editingId || 'new'}`}
                      theme="snow"
                      value={formData.titulo || ''}
                      onChange={(content) =>
                        setFormData({ ...formData, titulo: content })
                      }
                      modules={modules}
                      formats={formats}
                      className="h-16"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Descripción
                  </label>
                  <div className="h-56 mb-8">
                    <ReactQuill
                      key={`descripcion-${editingId || 'new'}`}
                      theme="snow"
                      value={formData.descripcion || ''}
                      onChange={(content) =>
                        setFormData({ ...formData, descripcion: content })
                      }
                      modules={modules}
                      formats={formats}
                      className="h-44"
                    />
                  </div>
                  <div className="flex justify-end mb-4 -mt-6 mr-1">
                    <span
                      className={`text-sm font-medium ${
                        stripHtml(formData.descripcion || '').length > 800
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {stripHtml(formData.descripcion || '').length} / 800 caracteres
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Categoría
                    </label>
                    <select
                      required
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={formData.categoriaId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          categoriaId: Number(e.target.value),
                        })
                      }
                    >
                      <option value={0} disabled>
                        Seleccione
                      </option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Modalidad
                    </label>
                    <select
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={formData.modalidadId || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          modalidadId: Number(e.target.value),
                          nivelId: 0, // Reset nivel when modalidad changes
                        })
                      }
                    >
                      <option value={0}>Todas / N/A</option>
                      {modalidades.map((mod) => (
                        <option key={mod.id} value={mod.id}>
                          {mod.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Nivel
                    </label>
                    <select
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={formData.nivelId || 0}
                      disabled={
                        !formData.modalidadId ||
                        Number(formData.modalidadId) === 0
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nivelId: Number(e.target.value),
                        })
                      }
                    >
                      <option value={0}>Todos / N/A</option>
                      {filteredNiveles.map((niv) => (
                        <option key={niv.id} value={niv.id}>
                          {niv.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Fecha
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={
                        formData.fecha
                          ? new Date(formData.fecha).toISOString().slice(0, 16)
                          : ''
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fecha: new Date(e.target.value).toISOString(),
                        })
                      }
                    />
                  </div>

                  <div>
                     <label className="block text-gray-700 text-sm font-bold mb-2">
                       Precio (S/ - deje en 0 si es gratis)
                     </label>
                     <input
                       type="number"
                       step="0.01"
                       className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                       value={formData.precio || 0}
                       onChange={(e) =>
                         setFormData({
                           ...formData,
                           precio: parseFloat(e.target.value),
                         })
                       }
                     />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                       URL de Video (YouTube - Opcional)
                    </label>
                    <input
                      type="text"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={formData.videoUrl || ''}
                       onChange={(e) =>
                        setFormData({ ...formData, videoUrl: e.target.value })
                      }
                       placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      URL de Archivo (Imagen/PDF - Opcional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={formData.imageUrl || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, imageUrl: e.target.value })
                        }
                        placeholder="https://ejemplo.com/archivo.pdf"
                      />
                      {formData.imageUrl && (
                        <a
                          href={formData.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2 px-3 rounded inline-flex items-center"
                          title="Ver archivo"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Subir Imagen Principal
                    </label>
                    <div className="flex gap-2 items-start">
                      <input
                        type="file"
                        accept="image/*"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            // Revoke old URL to prevent memory leak
                            if (previewUrl) URL.revokeObjectURL(previewUrl);
                            setImageFile(file);
                            setPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                      {previewUrl && (
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center h-[42px] shrink-0"
                          title="Visualizar imagen"
                        >
                          <EyeIcon className="w-5 h-5 mr-2" />
                          Ver
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Subir Archivo Adjunto (PDF, Word, Excel, etc.)
                    </label>
                    <div className="flex gap-2 items-start">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            // Revoke old URL to prevent memory leak
                            if (previewArchivoUrl) URL.revokeObjectURL(previewArchivoUrl);
                            setArchivoFile(file);
                            setPreviewArchivoUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                      {(previewArchivoUrl || formData.archivoUrl) && (
                        <a
                          href={previewArchivoUrl || formData.archivoUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-flex items-center h-[42px] shrink-0"
                          title="Visualizar archivo"
                        >
                          <EyeIcon className="w-5 h-5 mr-2" />
                          Ver
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Link de Descarga (Opcional)
                  </label>
                  <input
                    type="url"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={formData.linkDescarga || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, linkDescarga: e.target.value })
                    }
                    placeholder="https://drive.google.com/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enlace externo para descargar el contenido (ej: Google Drive)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Autor
                    </label>
                    <input
                      type="text"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={formData.autor || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, autor: e.target.value })
                      }
                      placeholder="Nombre del autor"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Estado
                    </label>
                    <select
                      required
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={formData.estadoId ?? 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
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

                <div className="flex flex-wrap items-center gap-6 mt-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="esDestacado"
                      className="mr-2 leading-tight"
                      checked={formData.esDestacado}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          esDestacado: e.target.checked,
                        })
                      }
                    />
                    <label
                      className="block text-gray-700 text-sm font-bold"
                      htmlFor="esDestacado"
                    >
                      ¿Es Destacado?
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="esNormaLegal"
                      className="mr-2 leading-tight"
                      checked={formData.esNormaLegal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          esNormaLegal: e.target.checked,
                        })
                      }
                    />
                    <label
                      className="block text-gray-700 text-sm font-bold"
                      htmlFor="esNormaLegal"
                    >
                      ¿Es Norma Legal?
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="mr-4 text-gray-500 hover:text-gray-700 font-bold py-2 px-4 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-10">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Detalles de la Noticia</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5 text-center">
              {/* Layout Centrado - Actualizado */}

              {/* Header Section (Centered) */}
              <div className="max-w-3xl mx-auto space-y-3">
                <div
                  className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight"
                  dangerouslySetInnerHTML={{ __html: viewingItem.titulo }}
                />

                <div className="flex flex-wrap justify-center items-center gap-3">
                  {viewingItem.esDestacado && (
                    <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-yellow-700 bg-yellow-100 rounded-full border border-yellow-200 shadow-sm">
                      <StarIcon className="w-3.5 h-3.5 text-yellow-600" />
                      Destacado
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full shadow-sm">
                    <TagIcon className="w-3.5 h-3.5 text-blue-100" />
                    {(viewingItem.categoria as string) ||
                      getCategoryName(viewingItem.categoriaId)}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    {new Date(viewingItem.fecha).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Image Section (Centered & Controlled Size) */}
              <div className="w-full max-w-lg mx-auto">
                {(() => {
                  if (!viewingItem.imageUrl) {
                    return (
                      <div className="w-full h-64 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-200">
                        <span className="text-lg font-medium">
                          Sin archivo disponible
                        </span>
                      </div>
                    );
                  }
                  return viewingItem.imageUrl.toLowerCase().endsWith('.pdf') ? (
                    <div className="w-full h-96 border border-gray-200 bg-gray-50 rounded-2xl overflow-hidden">
                      <iframe
                        src={viewingItem.imageUrl}
                        className="w-full h-full"
                        title="Visor de PDF"
                      ></iframe>
                    </div>
                  ) : (
                    <div
                      className="w-full relative shadow-xl border border-gray-200 bg-gray-50 rounded-2xl overflow-hidden group"
                      style={{ paddingBottom: '56.25%' }}
                    >
                      <img
                        src={viewingItem.imageUrl}
                        alt={stripHtml(viewingItem.titulo)}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Metadata Minimalist Row */}
              <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 text-gray-600 border-t border-b border-gray-100 py-6 max-w-2xl mx-auto mt-6">
                {/* Precio */}
                <div className="flex flex-col items-center gap-1">
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">
                    <CurrencyDollarIcon className="w-3.5 h-3.5" />
                    Precio
                  </span>
                  <span className="font-semibold text-gray-900 text-lg">
                    {viewingItem.precio && viewingItem.precio > 0
                      ? `S/ ${viewingItem.precio}`
                      : 'Gratis'}
                  </span>
                </div>

                <div className="w-px h-10 bg-gray-200 hidden sm:block"></div>

                {/* Modalidad */}
                <div className="flex flex-col items-center gap-1">
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">
                    <BriefcaseIcon className="w-3.5 h-3.5" />
                    Modalidad
                  </span>
                  <span className="font-medium text-gray-900">
                    {viewingItem.modalidad?.nombre ||
                      modalidades.find((m) => m.id === viewingItem.modalidadId)
                        ?.nombre ||
                      'Todas'}
                  </span>
                </div>

                <div className="w-px h-10 bg-gray-200 hidden sm:block"></div>

                {/* Nivel */}
                <div className="flex flex-col items-center gap-1">
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">
                    <AcademicCapIcon className="w-3.5 h-3.5" />
                    Nivel
                  </span>
                  <span className="font-medium text-gray-900">
                    {viewingItem.nivel?.nombre ||
                      niveles.find((n) => n.id === viewingItem.nivelId)
                        ?.nombre ||
                      'Todos'}
                  </span>
                </div>
              </div>

              {/* Description Section */}
              <div className="max-w-3xl mx-auto text-left py-4">
                <h4 className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest text-center">
                  Descripción
                </h4>
                <div className="prose prose-blue max-w-none text-gray-700">
                  <div
                    className="whitespace-pre-wrap leading-relaxed text-base text-justify"
                    dangerouslySetInnerHTML={{
                      __html: viewingItem.descripcion,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Download Button Section */}
            {viewingItem.linkDescarga && (
              <div className="mt-6 flex justify-center">
                <a
                  href={viewingItem.linkDescarga}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {viewingItem.textoBotonDescarga || 'CLICK AQUÍ'}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="bg-gray-100 text-gray-700 font-semibold py-2 px-6 rounded-lg hover:bg-gray-200 transition-colors"
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

export default AdminNews;
