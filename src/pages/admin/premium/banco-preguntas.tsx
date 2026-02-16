import React, { useState, useEffect, useMemo } from 'react';

import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  FolderIcon,
  ChevronDownIcon,
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
import { aiService } from '../../../services/aiService';
import 'react-quill/dist/quill.snow.css';
import 'react-quill/dist/quill.snow.css';

// Dynamic import for ReactQuill
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const Recursos = () => {
  // --- ESTADOS LOGICOS (CRUD) ---
  const [items, setItems] = useState<Pregunta[]>([]);

  const [groupedData, setGroupedData] = useState<ExamenGrouped[]>([]);
  const [loading, setLoading] = useState(true);




  const [editingId, setEditingId] = useState<number | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [showResults, setShowResults] = useState(false);   // New state for toggling views

  // View Modal State (Keep for "Visualizar" if needed, or refactor to page too)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<Pregunta | null>(null);

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  // Ideally fetch this from env or context, but user provided it directly for now.
  const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

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
  const [newYearInput, setNewYearInput] = useState<string>(''); // State for input field

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
    return items.filter((_) => {
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
        await preguntaService.delete(id);
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

    setImageFile(null);
    setViewMode('edit');
  };

  const handleView = (item: Pregunta) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);

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
    resetForm();
    setViewMode('create');
  };





  const handleGenerateQuestionAI = async () => {
      if (!aiTopic.trim()) {
          alert('Por favor ingresa un tema.');
          return;
      }
      
      setIsGeneratingAi(true);
      try {
          const generated = await aiService.generateFullQuestion(aiTopic, OPENAI_API_KEY);
          
          setNewItem({
              ...newItem,
              enunciado: generated.enunciado,
              alternativaA: generated.alternativaA,
              alternativaB: generated.alternativaB,
              alternativaC: generated.alternativaC,
              alternativaD: generated.alternativaD,
              respuesta: generated.respuesta,
              sustento: generated.sustento,
              tipoPreguntaId: 1 // Default to CCP or ask user?
          });
          
          setIsAiModalOpen(false);
          setAiTopic('');
          setViewMode('create');
          alert('Pregunta generada con éxito. Revisa y guarda.');
      } catch (error) {
          alert('Error generando pregunta con IA. Verifica tu API Key o intenta de nuevo.');
          console.error(error);
      } finally {
          setIsGeneratingAi(false);
      }
  };

  const handleGenerateAnswersAI = async () => {
    // Must be in create/edit mode and have an enunciado
    if (!newItem.enunciado || newItem.enunciado === '<p><br></p>') {
        alert('Primero debes ingresar el enunciado de la pregunta.');
        return;
    }

    setIsGeneratingAi(true);
    try {
        const plainText = stripHtml(newItem.enunciado);
        const generated = await aiService.generateAnswers(plainText, OPENAI_API_KEY);

        setNewItem({
            ...newItem,
            alternativaA: generated.alternativaA,
            alternativaB: generated.alternativaB,
            alternativaC: generated.alternativaC,
            alternativaD: generated.alternativaD,
            respuesta: generated.respuesta,
            sustento: generated.sustento
        });
        alert('Respuestas generadas con éxito.');
    } catch (error) {
        alert('Error generando respuestas con IA.');
        console.error(error);
    } finally {
        setIsGeneratingAi(false);
    }
  };

  const handleAddYear = async () => {
    if (!selectedTipo || !selectedFuente || !selectedModalidad || !selectedNivel || !selectedEspecialidad) {
        alert("Por favor selecciona todos los filtros (Tipo, Fuente, Modalidad, Nivel, Especialidad) antes de añadir un año.");
        return;
    }

    const year = newYearInput.trim();
    if (!year) {
        alert("Por favor ingresa un año válido.");
        return;
    }

    try {
        setLoading(true);
        // We need to construct the exam object.
        await examenService.create({
            year: year,
            tipoExamenId: Number(selectedTipo),
            fuenteId: Number(selectedFuente),
            modalidadId: Number(selectedModalidad),
            nivelId: Number(selectedNivel),
            especialidadId: Number(selectedEspecialidad),
            nombre: `${year} - ${selectedEspecialidad}` // Optional name
        });
        alert("Año añadido con éxito.");
        setNewYearInput(''); // Clear input
        await fetchData(); // Reload filters
        setSelectedYear(year);
    } catch (e: any) {
        alert("Error creando el año/examen: " + e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteYear = async () => {
      if (!selectedYear) return;
      // eslint-disable-next-line no-alert
      if (!window.confirm(`¿Seguro que deseas eliminar el año ${selectedYear} y toda su configuración? Esto no se puede deshacer.`)) return;
      
      try {
          setLoading(true);
          // 1. Find the ID. We'll use getAll and find.
          const allExams = await examenService.getAll();
          const targetExam = allExams.find((e: any) => 
              e.year === selectedYear &&
              e.tipoExamenId === Number(selectedTipo) &&
              e.fuenteId === Number(selectedFuente) &&
              e.modalidadId === Number(selectedModalidad) &&
              e.nivelId === Number(selectedNivel) &&
              e.especialidadId === Number(selectedEspecialidad)
          );

          if (!targetExam) {
              alert("No se encontró el examen correspondiente para eliminar. (Asegúrate de que el endpoint getAll esté soportado)");
              return;
          }

          await examenService.delete(targetExam.id);
          alert("Año eliminado correctamente.");
          setSelectedYear('');
          await fetchData();
      } catch (e: any) {
          alert("Error eliminando: " + e.message);
      } finally {
          setLoading(false);
      }
  };




  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItem.enunciado.trim()) {
      // eslint-disable-next-line no-alert
      alert('El enunciado es obligatorio');
      return;
    }

    try {
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

      setViewMode('list');
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

  // --- RENDER FORM VIEW ---
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {/* HEADER FORM */}
          <div className="w-full bg-[#002B6B] py-4 px-6 rounded-t-lg shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setViewMode('list')}
                 className="text-white hover:text-gray-300 flex items-center"
               >
                 <ChevronLeftIcon className="w-5 h-5 mr-1" />
                 Volver
               </button>
            </div>
            <h1 className="text-xl font-bold text-white text-center flex-1">
              Añadir preguntas
            </h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>

          {/* MAIN FORM CONTAINER */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
            
            {/* 1. Basic Info Accordion/Card */}
            <div className="border border-cyan-400 rounded-lg overflow-hidden">
               <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center cursor-pointer">
                  <span className="text-[#002B6B] font-medium">Pregunta Individual</span>
                  <ChevronDownIcon className="w-5 h-5 text-gray-500" />
               </div>
               <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Numero de la pregunta */}
                  <div>
                    <label className="block text-xs font-bold text-[#002B6B] mb-1">
                      Número de la pregunta
                    </label>
                    <input 
                      type="number" 
                      className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                  
                  {/* Tipo de pregunta */}
                  <div>
                    <label className="block text-xs font-bold text-[#002B6B] mb-1">
                      Tipo de pregunta
                    </label>
                    <select 
                      className="w-full border border-blue-800 rounded-md p-2 text-sm text-[#002B6B] font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newItem.tipoPreguntaId}
                      onChange={(e) => setNewItem({...newItem, tipoPreguntaId: Number(e.target.value)})}
                    >
                       <option value={0}>Seleccionar Tipo...</option>
                       {/* Mock options or reuse existing logic if available */}
                       <option value={1}>Conocimientos Curriculares y Pedagógicos</option>
                       <option value={2}>Comprensión Lectora</option>
                    </select>
                  </div>
               </div>
            </div>

            {/* 2. Enunciado */}
            <div className="border border-cyan-400 rounded-lg p-6">
               <div className="flex justify-between items-center mb-4">
                  <label className="text-[#002B6B] font-medium text-sm">Enunciado de la pregunta</label>
                  <div className="flex gap-2">
                     <button className="flex items-center gap-1 text-blue-600 border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 text-xs">
                        <DocumentTextIcon className="w-4 h-4" /> Añadir Texto
                     </button>
                     <button className="flex items-center gap-1 text-gray-600 border border-gray-200 px-3 py-1 rounded hover:bg-gray-50 text-xs">
                        <span className="text-lg leading-none">+</span> Añadir Imagen
                     </button>
                  </div>
               </div>
               
               <div className="bg-white border border-gray-200 rounded-lg p-1">
                 {/* Text Header Mock */}
                 <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                    <div className="flex items-center gap-2">
                       <span className="text-gray-400">⋮⋮</span>
                       <span className="text-xs font-bold text-gray-600">Texto</span>
                    </div>
                    <button className="text-red-400 hover:text-red-600">
                       <TrashIcon className="w-4 h-4" />
                    </button>
                 </div>
                 
                 {/* Quill Editor */}
                 <div className="quill-editor-container">
                    <ReactQuill
                      theme="snow"
                      value={newItem.enunciado}
                      onChange={(val) => setNewItem({ ...newItem, enunciado: val })}
                      modules={modules}
                      className="bg-white"
                      placeholder="Ingresa el texto del enunciado..."
                    />
                 </div>
                 
                 <div className="px-4 py-2 flex items-center gap-2 mt-2">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span className="text-xs text-gray-500">Texto en gris</span>
                 </div>
               </div>
            </div>

            {/* 3. Alternativas */}
            <div className="space-y-4">
               <h3 className="text-[#002B6B] font-bold text-sm">Alternativas</h3>
               
               {/* Alternativa A */}
               <div className="border border-cyan-400 rounded-lg p-1 bg-white">
                  <div className="p-2">
                     <ReactQuill
                        theme="bubble"
                        value={newItem.alternativaA}
                        onChange={(val) => setNewItem({ ...newItem, alternativaA: val })}
                        className="bg-white border-none"
                        placeholder="Ingresa el texto de la alternativa A"
                     />
                  </div>
                  <div className="flex justify-end p-2 gap-2 border-t border-gray-100 bg-gray-50">
                     <button 
                        onClick={() => setNewItem({...newItem, respuesta: 'A'})}
                        className={`px-3 py-1 text-xs rounded transition-colors ${newItem.respuesta === 'A' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                     >
                        {newItem.respuesta === 'A' ? 'Correcta' : 'Marcar'}
                     </button>
                     <button className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                  </div>
               </div>

               {/* Alternativa B */}
               <div className="border border-cyan-400 rounded-lg p-1 bg-white">
                  <div className="p-2">
                     <ReactQuill
                        theme="bubble"
                        value={newItem.alternativaB}
                        onChange={(val) => setNewItem({ ...newItem, alternativaB: val })}
                        className="bg-white border-none"
                        placeholder="Ingresa el texto de la alternativa B"
                     />
                  </div>
                  <div className="flex justify-end p-2 gap-2 border-t border-gray-100 bg-gray-50">
                     <button 
                        onClick={() => setNewItem({...newItem, respuesta: 'B'})}
                        className={`px-3 py-1 text-xs rounded transition-colors ${newItem.respuesta === 'B' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                     >
                        {newItem.respuesta === 'B' ? 'Correcta' : 'Marcar'}
                     </button>
                     <button className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                  </div>
               </div>

               {/* Alternativa C */}
               <div className="border border-cyan-400 rounded-lg p-1 bg-white">
                  <div className="p-2">
                     <ReactQuill
                        theme="bubble"
                        value={newItem.alternativaC}
                        onChange={(val) => setNewItem({ ...newItem, alternativaC: val })}
                        className="bg-white border-none"
                        placeholder="Ingresa el texto de la alternativa C"
                     />
                  </div>
                  <div className="flex justify-end p-2 gap-2 border-t border-gray-100 bg-gray-50">
                     <button 
                        onClick={() => setNewItem({...newItem, respuesta: 'C'})}
                        className={`px-3 py-1 text-xs rounded transition-colors ${newItem.respuesta === 'C' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                     >
                        {newItem.respuesta === 'C' ? 'Correcta' : 'Marcar'}
                     </button>
                     <button className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                  </div>
               </div>

               {/* Alternativa D */}
               <div className="border border-cyan-400 rounded-lg p-1 bg-white">
                  <div className="p-2">
                     <ReactQuill
                        theme="bubble"
                        value={newItem.alternativaD}
                        onChange={(val) => setNewItem({ ...newItem, alternativaD: val })}
                        className="bg-white border-none"
                        placeholder="Ingresa el texto de la alternativa D"
                     />
                  </div>
                  <div className="flex justify-end p-2 gap-2 border-t border-gray-100 bg-gray-50">
                     <button 
                        onClick={() => setNewItem({...newItem, respuesta: 'D'})}
                        className={`px-3 py-1 text-xs rounded transition-colors ${newItem.respuesta === 'D' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                     >
                        {newItem.respuesta === 'D' ? 'Correcta' : 'Marcar'}
                     </button>
                     <button className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                  </div>
               </div>

               <button className="w-full py-2 border border-cyan-400 text-[#002B6B] rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                  Añadir Alternativa
               </button>
            </div>

            {/* 4. Justificación */}
            <div className="border border-cyan-400 rounded-lg p-4">
               <div className="flex justify-between items-center mb-4">
                  <label className="text-[#002B6B] font-bold text-sm">Justificación de la respuesta</label>
                  <div className="flex gap-2">
                     <button className="flex items-center gap-1 text-blue-600 border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 text-xs">
                        <DocumentTextIcon className="w-4 h-4" /> Añadir Texto
                     </button>
                     <button className="flex items-center gap-1 text-gray-600 border border-gray-200 px-3 py-1 rounded hover:bg-gray-50 text-xs">
                         <span className="text-lg leading-none">+</span> Añadir Imagen
                     </button>
                  </div>
               </div>
               
               <div className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50">
                   {newItem.sustento ? (
                        <div className="w-full">
                           <ReactQuill
                              theme="snow"
                              value={newItem.sustento}
                              onChange={(val) => setNewItem({ ...newItem, sustento: val })}
                              className="bg-white opacity-100"
                           />
                        </div>
                   ) : (
                      <>
                        <p className="text-gray-500 text-sm mb-1">No hay elementos en justificación de la respuesta</p>
                        <p className="text-xs text-gray-400">Usa los botones de arriba para añadir texto o imágenes.</p>
                        {/* Hidden input trigger for simplicity or toggle the state to show editor */}
                        <button 
                           onClick={() => setNewItem({...newItem, sustento: '<p></p>'})}
                           className="mt-4 text-blue-500 underline text-sm"
                        >
                           Activar Editor
                        </button>
                      </>
                   )}
               </div>
            </div>

          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex gap-4">
             <button 
                onClick={handleSubmit}
                className="flex-1 bg-[#002B6B] text-white py-3 rounded-md font-medium hover:bg-blue-900 transition-colors flex justify-center items-center gap-2"
             >
                <FolderIcon className="w-5 h-5" />
                Guardar Pregunta
             </button>
             <button 
                onClick={handleSubmit} // For now same action
                className="flex-1 bg-[#002B6B] text-white py-3 rounded-md font-medium hover:bg-blue-900 transition-colors flex justify-center items-center gap-2"
             >
                <FolderIcon className="w-5 h-5" />
                Guardar y Añadir otra pregunta
             </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // --- RENDER LIST VIEW ---
  return (
    <AdminLayout>
      {/* SECCIÓN 1: HEADER (Only show if NOT showing results) */}
      {!showResults && (
      <div className="w-full bg-primary py-4 px-6 rounded-t-lg shadow-sm mb-4">
        <h1 className="text-xl font-bold text-white text-center">
          Banco de Preguntas
        </h1>
      </div>
      )}

      <div className="space-y-6">
        {/* SECCIÓN 2: FILTROS (Show only if !showResults) */}
        {!showResults && (
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
            {selectedEspecialidad && (
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Año
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
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

          {/* New Row for Year Management */}
          {selectedEspecialidad && (
             <div className="flex items-end gap-2 mt-4">
                 <input 
                     type="text"
                     placeholder="Nuevo año (ej: 2025)"
                     className="w-40 border border-blue-900 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                     value={newYearInput}
                     onChange={(e) => setNewYearInput(e.target.value)}
                 />
                 <button
                     onClick={handleAddYear}
                     className="bg-[#002B6B] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium shadow-md whitespace-nowrap"
                 >
                     Agregar Año
                 </button>
                 <button
                     onClick={handleDeleteYear}
                     disabled={!selectedYear}
                     className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-md whitespace-nowrap ${
                         !selectedYear 
                             ? "bg-red-300 text-white cursor-not-allowed" 
                             : "bg-red-500 text-white hover:bg-red-600"
                     }`}
                 >
                     Eliminar
                 </button>
             </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 mt-4">
            <button
              onClick={handleAddNew}
              className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-800 transition-colors text-sm font-medium shadow-md"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Añadir preguntas
            </button>

            <button
              onClick={() => setIsAiModalOpen(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-800 transition-colors text-sm font-medium shadow-md"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Añadir preguntas con IA
            </button>

            <button
              onClick={handleGenerateAnswersAI}
              className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-800 transition-colors text-sm font-medium shadow-md"
              disabled={isGeneratingAi || viewMode === 'list'} 
              title={viewMode === 'list' ? "Entra a modo crear/editar primero" : "Generar respuestas para el enunciado actual"}
            >
              {isGeneratingAi ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              ) : (
                  <SparklesIcon className="w-4 h-4 mr-2" />
              )}
              Añadir respuestas con IA
            </button>

            <button
               disabled={!selectedTipo} 
               onClick={() => setShowResults(true)}
               className="bg-[#002B6B] text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-900 transition-colors text-sm font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
               <EyeIcon className="w-4 h-4 mr-2" />
               Visualizar Preguntas
            </button>


          </div>


          {/* Action Buttons for Filters */}

        </div>
        )}

        {/* SECCIÓN 3: INSTRUCCIONES (Show only if !showResults) */}
        {!showResults && (
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
        )}

        {/* SECCIÓN 4: LISTADO DE PREGUNTAS (CARD VIEW) - Show only if showResults */}
        {showResults && (
          <div>
            {/* RESULT HEADER & CRITERIA */}
            <div className="w-full bg-[#002B6B] py-4 px-6 rounded-t-lg shadow-sm flex items-center gap-4">
                 <button onClick={() => setShowResults(false)} className="text-white hover:text-gray-200 font-medium flex items-center gap-1">
                    <ChevronLeftIcon className="w-5 h-5" /> Volver
                 </button>
                 <h1 className="text-xl font-bold text-white flex-1 text-center">Ver preguntas</h1>
            </div>
            
            <div className="bg-white border border-gray-200 p-4 rounded-b-lg mb-6 shadow-sm">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                     <div className="flex flex-wrap gap-2 items-center">
                         <span className="font-bold text-gray-700 mr-2">Criterios de selección</span>
                         {/* Display Selected Criteria as Pills */}
                         {groupedData.find(t => t.tipoExamenId === selectedTipo) && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                                {groupedData.find(t => t.tipoExamenId === selectedTipo)?.tipoExamenNombre}
                            </span>
                         )}
                         {/* We could map other selected IDs to names here if available in state arrays or lookups */}
                         {selectedModalidad && (
                             <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-medium">Modalidad ID: {selectedModalidad}</span>
                         )}
                         {selectedYear && (
                             <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">{selectedYear}</span>
                         )}
                     </div>
                     <button
                        onClick={() => {
                            setNewItem({
                                ...newItem,
                                examenId: Number(selectedFuente) || 0, // Pre-fill if needed
                            });
                            setViewMode('create');
                        }}
                        className="bg-[#002B6B] text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-900 transition-colors flex items-center gap-2"
                     >
                        <PlusIcon className="w-5 h-5" />
                        Añadir preguntas
                     </button>
                 </div>
            </div>
        {currentItems.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center text-gray-500 border border-gray-200">
            No se encontraron preguntas.
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {currentItems.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 relative"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-bold text-gray-700">
                      {indexOfFirstItem + index + 1}
                    </span>
                    <h3 className="font-bold text-lg text-gray-900">
                      {item.tipoPreguntaId === 2 
                        ? 'Comprensión Lectora' 
                        : 'Pregunta Individual'
                      }
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Badge */}
                    {item.tipoPreguntaId === 2 ? (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold border border-blue-200">
                         Comprensión
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold border border-yellow-200">
                         CCP
                      </span>
                    )}

                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded border border-blue-200 flex items-center gap-1 text-sm font-medium transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded border border-red-200 flex items-center gap-1 text-sm font-medium transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" /> Eliminar
                    </button>
                  </div>
                </div>

                {/* Enunciado */}
                <div className="mb-6 text-gray-800 prose max-w-none">
                  <div
                    dangerouslySetInnerHTML={{ __html: item.enunciado }}
                  />
                </div>

                {/* Image if exists */}
                {item.imagen && (
                  <div className="mb-4">
                    <img
                      src={item.imagen}
                      alt="Pregunta"
                      className="max-w-full h-auto rounded border border-gray-200"
                    />
                    <a
                      href={item.imagen}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline mt-1 block"
                    >
                      Ver imagen original
                    </a>
                  </div>
                )}

                {/* Alternativas */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                  {['A', 'B', 'C', 'D'].map((opt) => {
                    const altText =
                      opt === 'A'
                        ? item.alternativaA
                        : opt === 'B'
                        ? item.alternativaB
                        : opt === 'C'
                        ? item.alternativaC
                        : item.alternativaD;

                    if (!altText) return null;
                    const isCorrect = item.respuesta === opt;

                    return (
                      <div
                        key={opt}
                        className={`p-4 rounded-lg border transition-all ${
                          isCorrect
                            ? 'bg-green-50 border-green-500 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`font-bold ${
                              isCorrect ? 'text-green-700' : 'text-gray-500'
                            }`}
                          >
                            {opt})
                          </span>
                          <div
                            className="text-gray-800"
                            dangerouslySetInnerHTML={{ __html: altText }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sustento */}
                <div className="text-sm text-gray-500 mt-4 border-t pt-4 border-gray-100">
                  <span className="font-bold text-gray-700 block mb-1">
                    Sustento :
                  </span>
                  <div className="italic">
                    {item.sustento ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: item.sustento,
                        }}
                      />
                    ) : (
                      'Sin sustento disponible'
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
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
                      <span className="font-medium">
                        {indexOfFirstItem + 1}
                      </span>{' '}
                      a{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, filteredItems.length)}
                      </span>{' '}
                      de{' '}
                      <span className="font-medium">
                        {filteredItems.length}
                      </span>{' '}
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
                        <ChevronLeftIcon
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
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
        )}
        </div>
      )} 
      </div>


      {/* VIEW MODAL (Optional if user still wants "View" as modal, or we can refactor this too later) */}
      {isViewModalOpen && viewingItem && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
           {/* Keep existing view modal logic or simplify */}
           <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <h3 className="text-xl font-bold mb-4">Visualizar Pregunta</h3>
              <div dangerouslySetInnerHTML={{ __html: viewingItem.enunciado }} className="mb-4" />
              <div className="grid grid-cols-2 gap-4">
                 <div className={`p-2 border rounded ${viewingItem.respuesta === 'A' ? 'bg-green-100 border-green-500' : ''}`}>A: <span dangerouslySetInnerHTML={{__html: viewingItem.alternativaA}} /></div>
                 <div className={`p-2 border rounded ${viewingItem.respuesta === 'B' ? 'bg-green-100 border-green-500' : ''}`}>B: <span dangerouslySetInnerHTML={{__html: viewingItem.alternativaB}} /></div>
                 <div className={`p-2 border rounded ${viewingItem.respuesta === 'C' ? 'bg-green-100 border-green-500' : ''}`}>C: <span dangerouslySetInnerHTML={{__html: viewingItem.alternativaC}} /></div>
                 <div className={`p-2 border rounded ${viewingItem.respuesta === 'D' ? 'bg-green-100 border-green-500' : ''}`}>D: <span dangerouslySetInnerHTML={{__html: viewingItem.alternativaD}} /></div>
              </div>
              <div className="mt-4 flex justify-end">
                 <button onClick={() => setIsViewModalOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Cerrar</button>
              </div>
           </div>
         </div>
       )}

       {/* AI MODAL */}
       {isAiModalOpen && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
               <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                   <h3 className="text-xl font-bold mb-4 text-[#002B6B]">Generar Pregunta con IA</h3>
                   <p className="text-gray-600 mb-4 text-sm">
                       Ingresa el tema o contexto sobre el cual deseas generar una pregunta.
                   </p>
                   <textarea
                       className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                       rows={4}
                       placeholder="Ej: Historia del Perú - Guerra con Chile, o Principios de la educación inclusiva..."
                       value={aiTopic}
                       onChange={(e) => setAiTopic(e.target.value)}
                   />
                   <div className="flex justify-end gap-3">
                       <button 
                           onClick={() => setIsAiModalOpen(false)}
                           className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                           disabled={isGeneratingAi}
                       >
                           Cancelar
                       </button>
                       <button 
                           onClick={handleGenerateQuestionAI}
                           className="px-4 py-2 bg-[#002B6B] text-white rounded-md hover:bg-blue-900 flex items-center gap-2"
                           disabled={isGeneratingAi}
                       >
                           {isGeneratingAi && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                           Generar
                       </button>
                   </div>
               </div>
           </div>
       )}
    </AdminLayout>
  );
};

export default Recursos;
