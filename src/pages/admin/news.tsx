import React, { useState, useEffect, useCallback } from 'react';
import { PencilIcon, TrashIcon, EyeIcon, XIcon, PlusIcon, CalendarIcon, StarIcon, CurrencyDollarIcon, BriefcaseIcon, AcademicCapIcon, TagIcon } from '@heroicons/react/outline';

import AdminLayout from '../../components/AdminLayout';
import { categoriaGeneralService, CategoriaGeneral } from '../../services/categoriaGeneralService';
import { noticiaService, Noticia } from '../../services/noticiaService';
import { uploadService } from '../../services/uploadService';
import { modalidadService, Modalidad } from '../../services/modalidadService';
import { nivelService, Nivel } from '../../services/nivelService';

const AdminNews = () => {
  const [news, setNews] = useState<Noticia[]>([]);
  const [categories, setCategories] = useState<CategoriaGeneral[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [filteredNiveles, setFilteredNiveles] = useState<Nivel[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
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
    esDestacado: false,
    usuarioEdicionId: typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || 0) : 0,
    precio: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      const data = await noticiaService.getAll();
      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoriaGeneralService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchModalidades = useCallback(async () => {
    try {
      const data = await modalidadService.getAll();
      setModalidades(data);
    } catch (error) {
      console.error('Error fetching modalities:', error);
    }
  }, []);

  const fetchNiveles = useCallback(async () => {
    try {
      const data = await nivelService.getAll();
      setNiveles(data);
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  }, []);


  useEffect(() => {
    fetchNews();
    fetchCategories();
    fetchModalidades();
    fetchNiveles();
  }, [fetchNews, fetchCategories, fetchModalidades, fetchNiveles]);

  // Filter levels when modality changes or modal opens with data
  useEffect(() => {
    if (formData.modalidadId) {
      const filtered = niveles.filter(n => n.modalidadId === Number(formData.modalidadId));
      setFilteredNiveles(filtered);
    } else {
      setFilteredNiveles([]);
    }
  }, [formData.modalidadId, niveles]);

  const handleDelete = async (item: Noticia) => {
    // Check again for safety
    if ((new Date().getTime() - new Date(item.fecha).getTime()) > 7 * 24 * 60 * 60 * 1000) {
      alert("No puedes eliminar noticias con más de 7 días de antigüedad.");
      return;
    }

    // eslint-disable-next-line no-alert
    if (window.confirm('¿Estás seguro de eliminar esta noticia?')) {
      try {
        await noticiaService.delete(item.id);
        fetchNews();
      } catch (error) {
        console.error('Error deleting news:', error);
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
      esDestacado: item.esDestacado,
      usuarioEdicionId: typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || 0) : 0,
      precio: item.precio || 0,
    });
    setImageFile(null);
    setIsModalOpen(true);
  };
  
  const handleView = (item: Noticia) => {
      setViewingItem(item);
      setIsViewModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      titulo: '',
      descripcion: '',
      categoriaId: categories.length > 0 ? categories[0]?.id : 0,
      modalidadId: 0,
      nivelId: 0,
      fecha: new Date().toISOString(),
      imageUrl: '',
      esDestacado: false,
      usuarioEdicionId: typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || 0) : 0,
      precio: 0,
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoriaId || formData.categoriaId <= 0) {
      alert(
        `Por favor, seleccione una categoría válida.`
      );
      return;
    }
    
    if (!formData.usuarioEdicionId || Number(formData.usuarioEdicionId) <= 0) {
       const storedId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || 0) : 0;
       if (storedId <= 0) {
          alert('Error: No se ha identificado al usuario editor.');
          return;
       }
       formData.usuarioEdicionId = storedId;
    }

    try {
      let imageUrl = formData.imageUrl;

      if (imageFile) {
        try {
          imageUrl = await uploadService.uploadImage(imageFile);
        } catch (uploadError) {
          alert('Error al subir la imagen. Por favor intente nuevamente.');
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
          imageUrl: imageUrl || null,
          esDestacado: formData.esDestacado || false,
          usuarioEdicionId: formData.usuarioEdicionId || 0,
          precio: formData.precio || 0,
      };

      if (editingId) {
        await noticiaService.update(editingId, dataToSend as Noticia);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...createData } = dataToSend;
        await noticiaService.create(createData);
      }
      
      setIsModalOpen(false);
      fetchNews();
    } catch (error) {
      console.error('Error saving news:', error);
    }
  };

  const getCategoryName = (id: number) => {
    const category = categories.find((c) => c.id === id);
    return category ? category.nombre : 'Desconocida';
  };

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
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {news.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.titulo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {getCategoryName(item.categoriaId)}
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
                      (new Date().getTime() - new Date(item.fecha).getTime()) > 7 * 24 * 60 * 60 * 1000
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-red-600 hover:text-red-900'
                    }`}
                    title={
                      (new Date().getTime() - new Date(item.fecha).getTime()) > 7 * 24 * 60 * 60 * 1000
                        ? "No se puede eliminar después de 7 días"
                        : "Eliminar"
                    }
                    disabled={(new Date().getTime() - new Date(item.fecha).getTime()) > 7 * 24 * 60 * 60 * 1000}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full my-8">
             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold">
                  {editingId ? 'Editar Noticia' : 'Agregar Nueva Noticia'}
                </h2>
                <button
                    onClick={() => setIsModalOpen(false)}
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
                  <input
                    type="text"
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Descripción
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                  />
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
                          nivelId: 0 // Reset nivel when modalidad changes
                        })
                      }
                    >
                      <option value={0}>
                        Todas / N/A
                      </option>
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
                      disabled={!formData.modalidadId || Number(formData.modalidadId) === 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nivelId: Number(e.target.value),
                        })
                      }
                    >
                      <option value={0}>
                        Todos / N/A
                      </option>
                      {filteredNiveles.map((niv) => (
                        <option key={niv.id} value={niv.id}>
                          {niv.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                  
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
                    URL de Imagen (Opcional)
                  </label>
                  <input
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                    value={formData.imageUrl || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    O subir imagen
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
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
                        setFormData({ ...formData, precio: parseFloat(e.target.value) })
                      }
                    />
                  </div>

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
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                    {viewingItem.titulo}
                  </h3>
                  
                  <div className="flex flex-wrap justify-center items-center gap-3">
                     {viewingItem.esDestacado && (
                        <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-yellow-700 bg-yellow-100 rounded-full border border-yellow-200 shadow-sm">
                          <StarIcon className="w-3.5 h-3.5 text-yellow-600" />
                          Destacado
                        </span>
                     )}
                     <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full shadow-sm">
                        <TagIcon className="w-3.5 h-3.5 text-blue-100" />
                        {viewingItem.categoria as string || getCategoryName(viewingItem.categoriaId)}
                     </span>
                     <span className="flex items-center gap-1.5 text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                       <CalendarIcon className="w-4 h-4 text-gray-400" />
                       {new Date(viewingItem.fecha).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                     </span>
                  </div>
              </div>

              {/* Image Section (Centered & Controlled Size) */}
              <div className="w-full max-w-lg mx-auto">
                 {viewingItem.imageUrl ? (
                    <div className="w-full relative shadow-xl border border-gray-200 bg-gray-50 rounded-2xl overflow-hidden group" style={{ paddingBottom: '56.25%' }}>
                      <img 
                        src={viewingItem.imageUrl} 
                        alt={viewingItem.titulo} 
                        className="absolute top-0 left-0 w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-200">
                      <span className="text-lg font-medium">Sin imagen disponible</span>
                    </div>
                  )}
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
                       {viewingItem.precio && viewingItem.precio > 0 ? `S/ ${viewingItem.precio}` : 'Gratis'}
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
                        {viewingItem.modalidad?.nombre || modalidades.find(m => m.id === viewingItem.modalidadId)?.nombre || 'Todas'}
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
                        {viewingItem.nivel?.nombre || niveles.find(n => n.id === viewingItem.nivelId)?.nombre || 'Todos'}
                     </span>
                 </div>
              </div>

              {/* Description Section */}
              <div className="max-w-3xl mx-auto text-left py-4">
                  <h4 className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest text-center">
                    Descripción
                  </h4>
                  <div className="prose prose-blue max-w-none text-gray-700">
                     <p className="whitespace-pre-wrap leading-relaxed text-base text-justify">
                       {viewingItem.descripcion}
                     </p>
                  </div>
              </div>

            </div>

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
