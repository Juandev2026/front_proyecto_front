import React, { useState, useEffect } from 'react';

import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XIcon,
} from '@heroicons/react/outline';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

import AdminLayout from '../../components/AdminLayout';
import { categoriaService, Categoria } from '../../services/categoriaService';
import { cursoService, Curso } from '../../services/cursoService';
import { modalidadService, Modalidad } from '../../services/modalidadService';
import { nivelService, Nivel } from '../../services/nivelService';
import { temaService } from '../../services/temaService';
import { estadoService, Estado } from '../../services/estadoService';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const AdminVideos = () => {
  const [courses, setCourses] = useState<Curso[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [filteredNiveles, setFilteredNiveles] = useState<Nivel[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const initialCourseState: Omit<Curso, 'id'> = {
    nombre: '',
    descripcion: '',
    categoriaId: 0,
    modalidadId: 0,
    nivelId: 0,
    estadoId: 0,
    usuarioEdicionId:
      typeof window !== 'undefined'
        ? Number(localStorage.getItem('userId') || 0)
        : 0,
    duracion: '',
    idioma: '',
    loQueAprenderas: '',
    precio: 0,
    precioOferta: 0,
    imagenUrl: '',
    numero: '',
    temas: [],
  };

  const [currentCourse, setCurrentCourse] =
    useState<Omit<Curso, 'id'>>(initialCourseState);

  const [deletedTopicIds, setDeletedTopicIds] = useState<number[]>([]);

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

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesData, categoriesData, modalidadesData, nivelesData, estadosData] =
        await Promise.all([
          cursoService.getAll(),
          categoriaService.getAll(),
          modalidadService.getAll(),
          nivelService.getAll(),
          estadoService.getAll(),
        ]);
      setCourses(coursesData);
      setCategories(categoriesData);
      setModalidades(modalidadesData);
      setNiveles(nivelesData);
      setEstados(estadosData);
    } catch (error) {
      // console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (currentCourse.modalidadId) {
      setFilteredNiveles(
        niveles.filter(
          (n) => n.modalidadId === Number(currentCourse.modalidadId)
        )
      );
    } else {
      setFilteredNiveles([]);
    }
  }, [currentCourse.modalidadId, niveles]);

  const handleDelete = async (id: number) => {
    // eslint-disable-next-line no-alert
    if (window.confirm('¿Estás seguro de eliminar este curso?')) {
      try {
        await cursoService.delete(id);
        setCourses(courses.filter((c) => c.id !== id));
      } catch (error) {
        // console.error(error);
        // eslint-disable-next-line no-alert
        alert('Error al eliminar el curso');
      }
    }
  };

  const handleEdit = (course: Curso) => {
    setCurrentCourse({
      nombre: course.nombre,
      descripcion: course.descripcion,
      categoriaId: course.categoriaId,
      modalidadId: course.modalidadId || 0,
      nivelId: course.nivelId || 0,
      estadoId: course.estadoId || 0,
      usuarioEdicionId:
        typeof window !== 'undefined'
          ? Number(localStorage.getItem('userId') || 0)
          : 0,
      duracion: course.duracion,
      idioma: course.idioma,
      loQueAprenderas: course.loQueAprenderas,
      precio: course.precio,
      precioOferta: course.precioOferta,
      imagenUrl: course.imagenUrl,
      numero: course.numero || '',
      temas: course.temas || [],
    });
    setEditingId(course.id);
    setPreviewUrl(course.imagenUrl || '');
    setDeletedTopicIds([]); // Reset deleted topics
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setCurrentCourse(initialCourseState);
    setEditingId(null);
    setSelectedImage(null);
    setPreviewUrl('');
    setDeletedTopicIds([]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate usuarioEdicionId
      if (
        !currentCourse.usuarioEdicionId ||
        currentCourse.usuarioEdicionId <= 0
      ) {
        const storedId =
          typeof window !== 'undefined'
            ? Number(localStorage.getItem('userId') || 0)
            : 0;
        if (storedId <= 0) {
          // eslint-disable-next-line no-alert
          alert('Error: No se ha identificado al usuario editor.');
          return;
        }
        currentCourse.usuarioEdicionId = storedId;
      }

      // 1. Save Course First
      let savedCourse: Curso;

      // Prepare course data (excluding topics for the main update)
      const courseData = { ...currentCourse };
      // We don't send topics to course service anymore as it ignores them
      // But we keep them in state to manage them separately

      let dataToSend: Curso | Omit<Curso, 'id'> | FormData = courseData;

      if (selectedImage) {
        const formData = new FormData();
        if (editingId) {
          formData.append('id', String(editingId));
        }
        formData.append('nombre', courseData.nombre);
        formData.append('descripcion', courseData.descripcion);
        formData.append('categoriaId', String(courseData.categoriaId));
        formData.append('modalidadId', String(courseData.modalidadId || 0));
        formData.append('nivelId', String(courseData.nivelId || 0));
        formData.append('estadoId', String(courseData.estadoId || 0));
        formData.append(
          'usuarioEdicionId',
          String(courseData.usuarioEdicionId || 0)
        );
        formData.append('duracion', courseData.duracion);
        formData.append('idioma', courseData.idioma);
        formData.append('loQueAprenderas', courseData.loQueAprenderas);
        formData.append('precio', String(courseData.precio));
        formData.append('precioOferta', String(courseData.precioOferta));
        formData.append('numero', courseData.numero);
        formData.append('image', selectedImage);
        // We don't append topics here anymore

        dataToSend = formData;
      } else if (editingId) {
        dataToSend = { ...courseData, id: editingId };
      }

      if (editingId) {
        savedCourse = await cursoService.update(editingId, dataToSend as any);
      } else {
        savedCourse = await cursoService.create(dataToSend);
      }

      const courseId = savedCourse.id || editingId;

      if (courseId) {
        // 2. Manage Topics

        // Create/Update existing topics
        await Promise.all(
          currentCourse.temas.map((tema) => {
            const temaData = { ...tema, cursoId: courseId };
            if (tema.id === 0) {
              return temaService.create(temaData);
            }
            return temaService.update(tema.id, temaData);
          })
        );

        // Delete removed topics
        await Promise.all(deletedTopicIds.map((id) => temaService.delete(id)));
      }

      setIsModalOpen(false);
      fetchData();
      resetForm();
    } catch (error) {
      // console.error(error);
      // eslint-disable-next-line no-alert
      alert('Error al guardar el curso');
    }
  };

  // Helper for topics
  const addTopic = () => {
    setCurrentCourse({
      ...currentCourse,
      temas: [
        ...currentCourse.temas,
        { id: 0, nombre: '', descripcion: '', cursoId: 0 },
      ],
    });
  };

  const removeTopic = (index: number) => {
    const newTemas = [...currentCourse.temas];
    const temaToRemove = newTemas[index];

    // If it's an existing topic (has ID), track it for deletion
    if (temaToRemove && temaToRemove.id !== 0) {
      setDeletedTopicIds([...deletedTopicIds, temaToRemove.id]);
    }

    newTemas.splice(index, 1);
    setCurrentCourse({ ...currentCourse, temas: newTemas });
  };

  const updateTopic = (
    index: number,
    field: 'nombre' | 'descripcion',
    value: string
  ) => {
    const newTemas = [...currentCourse.temas];
    const tema = newTemas[index];
    if (tema) {
      newTemas[index] = { ...tema, [field]: value };
      setCurrentCourse({ ...currentCourse, temas: newTemas });
    }
  };

  const getCategoryName = (id: number) => {
    return categories.find((c) => c.id === id)?.nombre || 'Sin categoría';
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Cursos</h1>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Curso
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
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duración
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  Cargando...
                </td>
              </tr>
            ) : (
              courses.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {stripHtml(item.nombre)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getCategoryName(item.categoriaId)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" style={{ backgroundColor: item.estado?.colorHex ? item.estado.colorHex + '20' : '#e5e7eb', color: item.estado?.colorHex || '#374151' }}>
                      {item.estado?.nombre || 'Sin Estado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    S/ {item.precio}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.duracion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-8 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Curso' : 'Agregar Nuevo Curso'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              {/* Basic Info */}
              <div className="space-y-6">
                {/* Name - Full Width */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <div className="mb-12">
                    <ReactQuill
                      theme="snow"
                      value={currentCourse.nombre}
                      onChange={(value) =>
                        setCurrentCourse({ ...currentCourse, nombre: value })
                      }
                      className="h-16"
                      modules={modules}
                    />
                  </div>
                </div>

                {/* Description - Full Width */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <div className="mb-16">
                    <ReactQuill
                      theme="snow"
                      value={currentCourse.descripcion}
                      onChange={(value) =>
                        setCurrentCourse({
                          ...currentCourse,
                          descripcion: value,
                        })
                      }
                      className="h-32"
                      modules={modules}
                    />
                  </div>
                </div>

                {/* 4 Columns: Category / Modality / Level / State */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={currentCourse.categoriaId}
                      onChange={(e) =>
                        setCurrentCourse({
                          ...currentCourse,
                          categoriaId: Number(e.target.value),
                        })
                      }
                    >
                      <option value={0}>Seleccionar categoría</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modalidad
                    </label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={currentCourse.modalidadId || 0}
                      onChange={(e) =>
                        setCurrentCourse({
                          ...currentCourse,
                          modalidadId: Number(e.target.value),
                          nivelId: 0, // Reset nivel
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nivel
                    </label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={currentCourse.nivelId || 0}
                      onChange={(e) =>
                        setCurrentCourse({
                          ...currentCourse,
                          nivelId: Number(e.target.value),
                        })
                      }
                      disabled={
                        !currentCourse.modalidadId ||
                        currentCourse.modalidadId === 0
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={currentCourse.estadoId || 0}
                      onChange={(e) =>
                        setCurrentCourse({
                          ...currentCourse,
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

                {/* Open Grid for the rest of the fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Imagen del Curso
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setSelectedImage(file);
                          setPreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Deja vacío para mantener la imagen actual (si estás
                      editando) o usar URL.
                    </p>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent mt-2"
                      value={currentCourse.imagenUrl}
                      onChange={(e) => {
                        setCurrentCourse({
                          ...currentCourse,
                          imagenUrl: e.target.value,
                        });
                        setPreviewUrl(e.target.value);
                      }}
                      placeholder="O ingresa una URL de imagen"
                    />
                    {previewUrl && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Vista Previa:
                        </p>
                        <img
                          src={previewUrl}
                          alt="Vista previa del curso"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número WhatsApp
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={currentCourse.numero}
                      onChange={(e) =>
                        setCurrentCourse({
                          ...currentCourse,
                          numero: e.target.value,
                        })
                      }
                      placeholder="Ej: 51987654321"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio (S/)
                      </label>
                      <input
                        type="number"
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={currentCourse.precio}
                        onChange={(e) =>
                          setCurrentCourse({
                            ...currentCourse,
                            precio: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio Oferta (S/)
                      </label>
                      <input
                        type="number"
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={currentCourse.precioOferta}
                        onChange={(e) =>
                          setCurrentCourse({
                            ...currentCourse,
                            precioOferta: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duración
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={currentCourse.duracion}
                        onChange={(e) =>
                          setCurrentCourse({
                            ...currentCourse,
                            duracion: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Idioma
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={currentCourse.idioma}
                        onChange={(e) =>
                          setCurrentCourse({
                            ...currentCourse,
                            idioma: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lo que aprenderás (separar por saltos de línea)
                </label>
                <textarea
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={currentCourse.loQueAprenderas}
                  onChange={(e) =>
                    setCurrentCourse({
                      ...currentCourse,
                      loQueAprenderas: e.target.value,
                    })
                  }
                  placeholder="- Punto 1&#10;- Punto 2&#10;- Punto 3"
                />
              </div>

              {/* Topics (Temas) */}
              <div>
                <label className="block text-lg font-medium text-gray-900 mb-4">
                  Temario
                </label>
                <div className="space-y-4">
                  {currentCourse.temas.map((tema, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex gap-4 items-start"
                    >
                      <div className="flex-grow space-y-2">
                        <input
                          type="text"
                          className="w-full border rounded px-2 py-1 font-medium"
                          value={tema.nombre}
                          onChange={(e) =>
                            updateTopic(index, 'nombre', e.target.value)
                          }
                          placeholder="Nombre del tema"
                        />
                        <textarea
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={tema.descripcion}
                          onChange={(e) =>
                            updateTopic(index, 'descripcion', e.target.value)
                          }
                          placeholder="Descripción del tema"
                          rows={2}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTopic(index)}
                        className="text-red-500 hover:text-red-700 mt-1"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTopic}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors flex justify-center items-center"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" /> Agregar Tema
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mr-4 text-gray-500 hover:text-gray-700 font-bold py-2 px-4 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors"
                >
                  Guardar Curso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminVideos;
