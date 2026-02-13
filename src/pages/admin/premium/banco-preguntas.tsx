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
  examenService,
  ExamenGrouped
} from '../../../services/examenService';
import {
  preguntaService,
  Pregunta,
} from '../../../services/preguntaService';
import { uploadService } from '../../../services/uploadService';
import 'react-quill/dist/quill.snow.css';
import { premiumService, PremiumContent } from '../../../services/premiumService';

// Dynamic import for ReactQuill
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const Recursos = () => {
  // --- ESTADOS LOGICOS (CRUD) ---
  const [items, setItems] = useState<Pregunta[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [groupedData, setGroupedData] = useState<ExamenGrouped[]>([]);
  const [loading, setLoading] = useState(true);



  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<Pregunta | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // --- ESTADOS VISUALES (FILTROS UI) ---
  const [selectedTipo, setSelectedTipo] = useState<number | ''>('');
  const [selectedFuente, setSelectedFuente] = useState<number | ''>('');
  const [selectedModalidad, setSelectedModalidad] = useState<number | ''>('');
  const [selectedNivel, setSelectedNivel] = useState<number | ''>('');
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<number | ''>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Form State
  const [newItem, setNewItem] = useState({
    enunciado: '',
    alternativaA: '',
    alternativaB: '',
    alternativaC: '',
    alternativaD: '',
    respuesta: '',
    sustento: '',
    examenId: 0,
    clasificacionId: 0,
    imagen: '',
    tipoPreguntaId: 0
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

      // 1. Load Examen/Grouped Data (Filters)
      try {
        const grouped = await examenService.getGrouped();
        setGroupedData(grouped);
      } catch (err: any) {
        console.error('Examen Service Error:', err);
      }

      // 2. Load Estados (Dropdowns)
      try {
        const estadosData = await estadoService.getAll();
        setEstados(estadosData);
      } catch (err: any) {
        console.error('Estado Service Error:', err);
      }

      // 3. Load Preguntas (Table)
      try {
        const data = await preguntaService.getAll();
        setItems(data.sort((a, b) => b.id - a.id));
      } catch (err: any) {
        console.error('Preguntas Service Error:', err);
        setItems([]);
      }

    } catch (err: any) {
      console.error('Unexpected Error:', err);
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
      // Adjusted logic: Filter by examenId if selected, or other properties if available
      // For now, if no filters map directly to 'Pregunta' properties intuitively without more backend context, 
      // we might just list them all or filter by 'examenId' if 'selectedFuente' represents it.
      // Assuming 'selectedFuente' might map to 'examenId' in previous logic or similar.
      // Let's keep it simple: Show all if no filter, or filter if we can identify the field.
      // The original code was `item.id === Number(selectedFuente)` which suggests 'Fuente' was the parent ID? 
      // Let's return all items for now to ensure data visibility, then refine.
      return true; 
    });
  }, [items, selectedFuente]);

  // --- CASCADING LOGIC ---
  const availableFuentes = useMemo(() => {
    if (!selectedTipo) return [];
    return groupedData.find(t => t.tipoExamenId === Number(selectedTipo))?.fuentes || [];
  }, [groupedData, selectedTipo]);

  const availableModalidades = useMemo(() => {
    if (!selectedFuente) return [];
    return availableFuentes.find(f => f.fuenteId === Number(selectedFuente))?.modalidades || [];
  }, [availableFuentes, selectedFuente]);

  const availableNiveles = useMemo(() => {
    if (!selectedModalidad) return [];
    return availableModalidades.find(m => m.modalidadId === Number(selectedModalidad))?.niveles || [];
  }, [availableModalidades, selectedModalidad]);

  const availableEspecialidades = useMemo(() => {
    if (!selectedNivel) return [];
    return availableNiveles.find(n => n.nivelId === Number(selectedNivel))?.especialidades || [];
  }, [availableNiveles, selectedNivel]);

  const availableYears = useMemo(() => {
    // 1. If explicit specialty selected, use it
    if (selectedEspecialidad) {
      return availableEspecialidades.find(e => e.especialidadId === Number(selectedEspecialidad))?.years || [];
    }
    // 2. If single "null" specialty exists (no explicit ID), auto-select it for years
    if (availableEspecialidades.length === 1) {
      const onlySpec = availableEspecialidades[0];
      if (onlySpec && (!onlySpec.especialidadId || onlySpec.especialidadId === 0)) {
        return onlySpec.years || [];
      }
    }
    return [];
  }, [availableEspecialidades, selectedEspecialidad]);

  // --- PAGINATION LÓGICA ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // --- HANDLERS (CRUD) ---
  const handleDelete = async (id: number) => {
    // eslint-disable-next-line no-alert
    if (window.confirm('¿Estás seguro de eliminar esta pregunta?')) {
      try {
        // await preguntaService.delete(id);
        alert("Eliminar no implementado aún");
        fetchData();
      } catch (err) {
        alert('Error eliminando contenido');
      }
    }
  };

  const handleEdit = (item: Pregunta) => {
    setEditingId(item.id);
    setNewItem({
      enunciado: item.enunciado,
      alternativaA: item.alternativaA,
      alternativaB: item.alternativaB,
      alternativaC: item.alternativaC,
      alternativaD: item.alternativaD,
      respuesta: item.respuesta,
      sustento: item.sustento,
      examenId: item.examenId,
      clasificacionId: item.clasificacionId,
      imagen: item.imagen,
      tipoPreguntaId: item.tipoPreguntaId
    });
    setFile(null);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleView = (item: Pregunta) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFile(null);
    setImageFile(null);
    setNewItem({
      enunciado: '',
      alternativaA: '',
      alternativaB: '',
      alternativaC: '',
      alternativaD: '',
      respuesta: '',
      sustento: '',
      examenId: 0,
      clasificacionId: 0,
      imagen: '',
      tipoPreguntaId: 0
    });
  };

  const handleAddNew = () => {
    setIsModalOpen(true);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItem.enunciado.trim()) {
      // eslint-disable-next-line no-alert
      alert('El enunciado es obligatorio');
      return;
    }

    try {
      /*
      // TODO: Implement Create/Update in preguntaService
      let finalUrl = newItem.imagen;
      if (imageFile) {
        finalUrl = await uploadService.uploadImage(imageFile);
      }

      const itemData = {
        ...newItem,
        id: editingId || 0,
        imagen: finalUrl,
      };

      if (editingId) {
        await preguntaService.update(editingId, itemData);
      } else {
        await preguntaService.create(itemData);
      }
      */
      alert("Guardar no implementado aún");
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Error guardando pregunta');
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
     
        </h1>
      </div>



      {/* CORRECCIÓN 1: Mostrar el error visualmente si existe */}


      <div className="space-y-6">
        {/* SECCIÓN 2: FILTROS */}
        <div className="bg-white rounded-lg shadow-sm border border-primary p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* 1. Tipo Examen */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                Tipo Exámen <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={selectedTipo}
                onChange={(e) => {
                  setSelectedTipo(e.target.value ? Number(e.target.value) : '');
                  setSelectedFuente('');
                  setSelectedModalidad('');
                  setSelectedNivel('');
                  setSelectedEspecialidad('');
                  setSelectedYear('');
                  setCurrentPage(1);
                }}
              >
                <option value="">Seleccionar Tipo Exámen</option>
                {groupedData.map((t) => (
                  <option key={t.tipoExamenId} value={t.tipoExamenId}>
                    {t.tipoExamenNombre}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Sección Fuente */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                Sección Fuente <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={selectedFuente}
                onChange={(e) => {
                  setSelectedFuente(e.target.value ? Number(e.target.value) : '');
                  setSelectedModalidad('');
                  setSelectedNivel('');
                  setSelectedEspecialidad('');
                  setSelectedYear('');
                  setCurrentPage(1);
                }}
                disabled={!selectedTipo}
              >
                <option value="">
                  {selectedTipo
                    ? 'Selecciona una sección'
                    : 'Primero selecciona el tipo de examen'}
                </option>
                {availableFuentes.map((f) => (
                  <option key={f.fuenteId} value={f.fuenteId}>
                    {f.fuenteNombre}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Modalidad */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                Modalidad
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={selectedModalidad}
                onChange={(e) => {
                  setSelectedModalidad(e.target.value ? Number(e.target.value) : '');
                  setSelectedNivel('');
                  setSelectedEspecialidad('');
                  setSelectedYear('');
                }}
                disabled={!selectedFuente || availableModalidades.length === 0}
              >
                <option value="">Seleccionar Modalidad</option>
                {availableModalidades.map((m) => (
                  <option key={m.modalidadId} value={m.modalidadId}>
                    {m.modalidadNombre}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Nivel */}
            {availableNiveles.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Nivel
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={selectedNivel}
                  onChange={(e) => {
                    setSelectedNivel(e.target.value ? Number(e.target.value) : '');
                    setSelectedEspecialidad('');
                    setSelectedYear('');
                  }}
                  disabled={!selectedModalidad}
                >
                  <option value="">Seleccionar Nivel</option>
                  {availableNiveles.map((n) => (
                    <option key={n.nivelId} value={n.nivelId}>
                      {n.nivelNombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 5. Especialidad */}
            {availableEspecialidades.length > 0 &&
             // Hide if it's the "null" single option
             !(availableEspecialidades.length === 1 && (!availableEspecialidades[0]?.especialidadId)) && (
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Especialidad
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={selectedEspecialidad}
                  onChange={(e) => {
                    setSelectedEspecialidad(e.target.value ? Number(e.target.value) : '');
                    setSelectedYear('');
                  }}
                  disabled={!selectedNivel}
                >
                  <option value="">Seleccionar Especialidad</option>
                  {availableEspecialidades.map((e) => (
                    <option key={e.especialidadId} value={e.especialidadId}>
                      {e.especialidadNombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 6. Año */}
            {availableYears.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Año
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  disabled={!selectedEspecialidad}
                >
                  <option value="">Seleccionar Año</option>
                  {availableYears.map((y) => (
                    <option key={y.year} value={y.year}>
                      {y.year} ({y.count})
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                    Enunciado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Respuesta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Imagen
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
                      No se encontraron preguntas.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stripHtml(item.enunciado).substring(0, 40)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-bold text-green-600">{item.respuesta}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.tipoPreguntaId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.imagen ? (
                          <a
                            href={item.imagen}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center"
                          >
                            <DocumentTextIcon className="w-4 h-4 mr-1" /> Ver Imagen
                          </a>
                        ) : (
                          <span className="text-gray-400">Sin imagen</span>
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
                         {/* TODO: Implement Edit/Delete for Preguntas
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
                        */}
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
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingId ? 'Editar Pregunta' : 'Nueva Pregunta'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-6">
                {/* Enunciado */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Enunciado *
                  </label>
                  <div className="mb-6">
                    <ReactQuill
                      theme="snow"
                      value={newItem.enunciado}
                      onChange={(value) =>
                        setNewItem({ ...newItem, enunciado: value })
                      }
                      className="h-auto bg-white"
                      modules={modules}
                    />
                  </div>
                </div>

                {/* Alternativas Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Alternativa A</label>
                        <textarea 
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            rows={2}
                            value={newItem.alternativaA}
                            onChange={e => setNewItem({...newItem, alternativaA: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Alternativa B</label>
                        <textarea 
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            rows={2}
                            value={newItem.alternativaB}
                            onChange={e => setNewItem({...newItem, alternativaB: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Alternativa C</label>
                        <textarea 
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            rows={2}
                            value={newItem.alternativaC}
                            onChange={e => setNewItem({...newItem, alternativaC: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Alternativa D</label>
                        <textarea 
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            rows={2}
                            value={newItem.alternativaD}
                            onChange={e => setNewItem({...newItem, alternativaD: e.target.value})}
                        />
                    </div>
                </div>

                {/* Respuesta Correcta */}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Respuesta Correcta</label>
                    <select
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                        value={newItem.respuesta}
                        onChange={(e) => setNewItem({ ...newItem, respuesta: e.target.value })}
                    >
                        <option value="">Seleccionar Respuesta...</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                    </select>
                </div>

                {/* Sustento */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Sustento (Opcional)
                  </label>
                  <div className="h-48 mb-8">
                    <ReactQuill
                      theme="snow"
                      value={newItem.sustento}
                      onChange={(value) =>
                        setNewItem({ ...newItem, sustento: value })
                      }
                      className="h-full bg-white"
                      modules={modules}
                    />
                  </div>
                </div>

                {/* Imagen */}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Imagen de Referencia
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
                      onChange={(e) =>
                        setImageFile(e.target.files?.[0] || null)
                      }
                    />
                     <input
                      type="text"
                      placeholder="O URL de la imagen..."
                      className="w-full mt-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                      value={newItem.imagen || ''}
                       onChange={(e) =>
                        setNewItem({ ...newItem, imagen: e.target.value })
                      }
                    />
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
                  {editingId ? 'Guardar Cambios' : 'Crear Pregunta'}
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
                Detalles de la Pregunta
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
              {viewingItem.imagen && (
                <div className="w-full h-48 rounded-lg overflow-hidden mb-4 border border-gray-200">
                  <img
                    src={viewingItem.imagen}
                    alt="Referencia"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Enunciado */}
              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                  Enunciado
                </h4>
                <div
                  className="mt-1 text-gray-900 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: viewingItem.enunciado }}
                />
              </div>

              {/* Alternativas */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                 <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Alternativas
                </h4>
                <div className={`p-2 rounded border ${viewingItem.respuesta === 'A' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <span className="font-bold mr-2">A:</span> {viewingItem.alternativaA}
                </div>
                <div className={`p-2 rounded border ${viewingItem.respuesta === 'B' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <span className="font-bold mr-2">B:</span> {viewingItem.alternativaB}
                </div>
                <div className={`p-2 rounded border ${viewingItem.respuesta === 'C' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <span className="font-bold mr-2">C:</span> {viewingItem.alternativaC}
                </div>
                <div className={`p-2 rounded border ${viewingItem.respuesta === 'D' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <span className="font-bold mr-2">D:</span> {viewingItem.alternativaD}
                </div>
              </div>

               {/* Respuesta Correcta */}
              <div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                    Respuesta Correcta
                  </h4>
                  <p className="text-lg font-bold text-green-600">{viewingItem.respuesta}</p>
              </div>

              {/* Sustento */}
              {viewingItem.sustento && (
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Sustento
                </h4>
                <div
                  className="text-gray-600 prose prose-sm max-w-none bg-blue-50 p-3 rounded"
                  dangerouslySetInnerHTML={{ __html: viewingItem.sustento }}
                />
              </div>
              )}
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
