import React, { useState, useEffect, useRef } from 'react';

import {
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/outline';
import dynamic from 'next/dynamic';

import {
  clasificacionService,
  Clasificacion,
} from '../../services/clasificacionService';
import { preguntaService } from '../../services/preguntaService';
import { uploadService } from '../../services/uploadService';

// Dynamic import for Tiptap Editor
const TiptapEditor = dynamic(() => import('../editor/TiptapEditor'), {
  ssr: false,
});

interface ContentBlock {
  id: string;
  type: 'text' | 'image';
  content: string; // HTML or Image URL
  isGray?: boolean;
}

interface SubPregunta {
  tempId: string;
  clasificacionId: number;
  specificStatement: ContentBlock[];
  alternatives: { id: string; contenido: string; esCorrecta: boolean }[];
  sustento: string;
  isExpanded: boolean;
}

interface PreguntaComunFormProps {
  initialParent?: any;
  initialSubQuestions?: any[];
  resolveExamenId: () => Promise<number | null>;
  defaultClasificacionId: number;
  selectedYear: string;
  onSuccess: () => void;
  onCancel: () => void;
  numero?: string;
  selectedTipo: number;
}

const PreguntaComunForm: React.FC<PreguntaComunFormProps> = ({
  initialParent,
  initialSubQuestions,
  resolveExamenId,
  defaultClasificacionId,
  selectedYear,
  onSuccess,
  onCancel,
  numero,
  selectedTipo,
}) => {
  // --- HELPERS ---
  const parseHtmlToBlocks = (html: string): ContentBlock[] => {
    if (!html) return [];
    const div = document.createElement('div');
    div.innerHTML = html;

    const blocks: ContentBlock[] = [];
    const children = Array.from(div.childNodes);

    children.forEach((node) => {
      if (node.nodeName === 'IMG') {
        blocks.push({
          id: Math.random().toString(36).substr(2, 9),
          type: 'image',
          content: (node as HTMLImageElement).src,
        });
      } else if (
        node.nodeName === 'DIV' &&
        (node as HTMLElement).classList.contains('bg-gray-100')
      ) {
        blocks.push({
          id: Math.random().toString(36).substr(2, 9),
          type: 'text',
          content: (node as HTMLElement).innerHTML,
          isGray: true,
        });
      } else if (
        node.nodeType === Node.TEXT_NODE ||
        node.nodeType === Node.ELEMENT_NODE
      ) {
        const content =
          (node as HTMLElement).outerHTML || node.textContent || '';
        if (content.trim()) {
          blocks.push({
            id: Math.random().toString(36).substr(2, 9),
            type: 'text',
            content,
            isGray: false,
          });
        }
      }
    });
    return blocks;
  };

  // --- STATE ---
  const [commonStatement, setCommonStatement] = useState<ContentBlock[]>(
    initialParent ? parseHtmlToBlocks(initialParent.enunciado) : []
  );
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([]);
  const [subQuestions, setSubQuestions] = useState<SubPregunta[]>(
    initialSubQuestions && initialSubQuestions.length > 0
      ? initialSubQuestions.map((s) => ({
          tempId: s.id?.toString() || Math.random().toString(36).substr(2, 9),
          id: s.id, // Keep the real ID
          clasificacionId: s.clasificacionId,
          specificStatement: parseHtmlToBlocks(s.enunciado),
          alternatives: [
            {
              id: 'A',
              contenido: s.alternativaA,
              esCorrecta: s.respuestaCorrecta === 'A' || s.respuestaCorrecta === 1,
            },
            {
              id: 'B',
              contenido: s.alternativaB,
              esCorrecta: s.respuestaCorrecta === 'B' || s.respuestaCorrecta === 2,
            },
            {
              id: 'C',
              contenido: s.alternativaC,
              esCorrecta: s.respuestaCorrecta === 'C' || s.respuestaCorrecta === 3,
            },
          ],
          sustento: s.sustento || '',
          isExpanded: false,
        }))
      : [
          {
            tempId: Math.random().toString(36).substr(2, 9),
            clasificacionId: defaultClasificacionId || 0,
            specificStatement: [],
            alternatives: [
              {
                id: Math.random().toString(36),
                contenido: '',
                esCorrecta: false,
              },
              {
                id: Math.random().toString(36),
                contenido: '',
                esCorrecta: false,
              },
              {
                id: Math.random().toString(36),
                contenido: '',
                esCorrecta: false,
              },
            ],
            sustento: '',
            isExpanded: true,
          },
        ]
  );
  const [saving, setSaving] = useState(false);

  // --- ASIGNACION DE EXAMENES ---
  const [isMultiAssign, setIsMultiAssign] = useState(false);
  const [assignmentInfo, setAssignmentInfo] = useState<{
    todosLosExamenes: { id: number; descripcion: string }[];
    examenesAsignadosIds: number[];
  } | null>(null);

  const fetchAssignmentInfo = async (preguntaId: number, year: string) => {
    if (selectedTipo !== 2) return;
    try {
      const info = await preguntaService.getAsignacionExamenInfo(
        preguntaId,
        Number(year) || 0
      );
      
      // Auto-selección por defecto si es nueva
      if (preguntaId === 0 || info.examenesAsignadosIds.length === 0) {
        const currentId = await resolveExamenId();
        if (currentId && !info.examenesAsignadosIds.includes(currentId)) {
          info.examenesAsignadosIds.push(currentId);
        }
      }

      setAssignmentInfo(info);
      setIsMultiAssign(info.examenesAsignadosIds.length > 0);
    } catch (err) {
      console.error('Error fetching assignment info:', err);
    }
  };

  useEffect(() => {
    if (selectedTipo === 2) {
      fetchAssignmentInfo(initialParent?.id || 0, selectedYear || '0');
    }
  }, [selectedTipo, selectedYear, initialParent]);

  const handleToggleMultiAssign = (checked: boolean) => {
    setIsMultiAssign(checked);
    if (checked && !assignmentInfo) {
      fetchAssignmentInfo(initialParent?.id || 0, selectedYear);
    }
  };

  const handleSelectAllExams = () => {
    if (!assignmentInfo) return;
    setAssignmentInfo({
      ...assignmentInfo,
      examenesAsignadosIds: assignmentInfo.todosLosExamenes.map((e) => e.id),
    });
  };

  const handleDeselectAllExams = () => {
    if (!assignmentInfo) return;
    setAssignmentInfo({
      ...assignmentInfo,
      examenesAsignadosIds: [],
    });
  };

  const handleToggleSingleExam = (id: number) => {
    if (!assignmentInfo) return;
    const current = assignmentInfo.examenesAsignadosIds;
    if (current.includes(id)) {
      setAssignmentInfo({
        ...assignmentInfo,
        examenesAsignadosIds: current.filter((x) => x !== id),
      });
    } else {
      setAssignmentInfo({
        ...assignmentInfo,
        examenesAsignadosIds: [...current, id],
      });
    }
  };

  // Hidden file input for images
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploadContextRef = useRef<{
    type: 'common' | 'specific';
    subQId?: string;
  } | null>(null);

  // Load classifications
  useEffect(() => {
    const loadClasificaciones = async () => {
      try {
        const data = await clasificacionService.getAll();
        setClasificaciones(data);
      } catch (error) {
        console.error('Error loading classifications:', error);
      }
    };
    loadClasificaciones();
  }, []);

  const getClasificacionFullName = (nombre: string) => {
    switch (nombre) {
      case 'CCP':
        return 'CONOCIMIENTO CURRICULAR Y PEDAGÓGICO';
      case 'CG':
        return 'CONOCIMIENTOS GENERALES';
      case 'CL':
        return 'COMPRENSIÓN LECTORA';
      case 'RL':
        return 'RAZONAMIENTO LÓGICO';
      default:
        return nombre;
    }
  };

  // --- ACTIONS: BLOCKS ---

  const addBlock = (
    type: 'text' | 'image',
    context: 'common' | 'specific',
    subQId?: string,
    imageUrl?: string
  ) => {
    const newBlock: ContentBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: imageUrl || '',
      isGray: false,
    };

    if (context === 'common') {
      setCommonStatement((prev) => [...prev, newBlock]);
    } else if (subQId) {
      setSubQuestions((prev) =>
        prev.map((q) =>
          q.tempId === subQId
            ? { ...q, specificStatement: [...q.specificStatement, newBlock] }
            : q
        )
      );
    }
  };

  const updateBlock = (
    val: string,
    blockId: string,
    context: 'common' | 'specific',
    subQId?: string
  ) => {
    if (context === 'common') {
      setCommonStatement((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, content: val } : b))
      );
    } else if (subQId) {
      setSubQuestions((prev) =>
        prev.map((q) =>
          q.tempId === subQId
            ? {
                ...q,
                specificStatement: q.specificStatement.map((b) =>
                  b.id === blockId ? { ...b, content: val } : b
                ),
              }
            : q
        )
      );
    }
  };
  
  const toggleBlockGray = (
    blockId: string,
    context: 'common' | 'specific',
    subQId?: string
  ) => {
    if (context === 'common') {
      setCommonStatement((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, isGray: !b.isGray } : b))
      );
    } else if (subQId) {
      setSubQuestions((prev) =>
        prev.map((q) =>
          q.tempId === subQId
            ? {
                ...q,
                specificStatement: q.specificStatement.map((b) =>
                  b.id === blockId ? { ...b, isGray: !b.isGray } : b
                ),
              }
            : q
        )
      );
    }
  };

  const removeBlock = (
    blockId: string,
    context: 'common' | 'specific',
    subQId?: string
  ) => {
    if (context === 'common') {
      setCommonStatement((prev) => prev.filter((b) => b.id !== blockId));
    } else if (subQId) {
      setSubQuestions((prev) =>
        prev.map((q) =>
          q.tempId === subQId
            ? {
                ...q,
                specificStatement: q.specificStatement.filter(
                  (b) => b.id !== blockId
                ),
              }
            : q
        )
      );
    }
  };

  // --- ACTIONS: IMAGE UPLOAD ---

  const triggerImageUpload = (
    context: 'common' | 'specific',
    subQId?: string
  ) => {
    activeUploadContextRef.current = { type: context, subQId };
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadContextRef.current) return;

    try {
      // Upload logic
      const url = await uploadService.uploadImage(file);

      addBlock(
        'image',
        activeUploadContextRef.current.type,
        activeUploadContextRef.current.subQId,
        url
      );
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error al subir la imagen');
    } finally {
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
      activeUploadContextRef.current = null;
    }
  };

  // --- ACTIONS: SUB QUESTIONS ---

  const addSubQuestion = () => {
    setSubQuestions((prev) => [
      ...prev.map((q) => ({ ...q, isExpanded: false })),
      {
        tempId: Math.random().toString(36).substr(2, 9),
        clasificacionId: defaultClasificacionId || 0,
        specificStatement: [],
        alternatives: [
          { id: Math.random().toString(36), contenido: '', esCorrecta: false },
          { id: Math.random().toString(36), contenido: '', esCorrecta: false },
          { id: Math.random().toString(36), contenido: '', esCorrecta: false },
        ],
        sustento: '',
        isExpanded: true,
      },
    ]);
  };

  const removeSubQuestion = (tempId: string) => {
    if (subQuestions.length <= 1) {
      alert('Debe haber al menos una pregunta.');
      return;
    }
    setSubQuestions((prev) => prev.filter((q) => q.tempId !== tempId));
  };

  const toggleExpand = (tempId: string) => {
    setSubQuestions((prev) =>
      prev.map((q) =>
        q.tempId === tempId ? { ...q, isExpanded: !q.isExpanded } : q
      )
    );
  };

  const updateSubQuestionField = (
    tempId: string,
    field: keyof SubPregunta,
    value: any
  ) => {
    setSubQuestions((prev) =>
      prev.map((q) => (q.tempId === tempId ? { ...q, [field]: value } : q))
    );
  };

  // --- ACTIONS: ALTERNATIVES ---

  const updateAlternative = (
    tempId: string,
    altIndex: number,
    field: string,
    value: any
  ) => {
    setSubQuestions((prev) =>
      prev.map((q) => {
        if (q.tempId !== tempId) return q;
        const newAlts = [...q.alternatives];
        const alt = newAlts[altIndex];
        if (!alt) return q;

        if (field === 'esCorrecta') {
          if (value === true) {
            newAlts.forEach((a) => (a.esCorrecta = false));
          }
          newAlts[altIndex] = { ...alt, esCorrecta: value };
        } else {
          newAlts[altIndex] = { ...alt, [field]: value };
        }
        return { ...q, alternatives: newAlts };
      })
    );
  };

  // --- SAVE LOGIC ---

  const serializeBlocks = (blocks: ContentBlock[]) => {
    if (blocks.length === 0) return '';
    return blocks
      .map((b) => {
        if (b.type === 'image') return `<img src="${b.content}" alt="Image" />`;
        if (b.isGray) {
            return `<div class="bg-gray-100 p-4 rounded-lg my-2">${b.content}</div>`;
        }
        return b.content;
      })
      .join('<br/>');
  };

  const handleSaveAll = async () => {
    // --- VALIDACIÓN ---
    if (commonStatement.length === 0) {
      alert('El enunciado común está vacío. Añade texto o imagen.');
      return;
    }

    for (let i = 0; i < subQuestions.length; i++) {
      const q = subQuestions[i];
      if (!q) continue;

      const correctIndex = q.alternatives.findIndex((a) => a.esCorrecta);
      if (correctIndex === -1) {
        alert(`La pregunta #${i + 1} no tiene respuesta marcada.`);
        return;
      }

      if (!q.clasificacionId) {
        alert(`La pregunta #${i + 1} no tiene clasificación seleccionada.`);
        return;
      }
    }

    // RESOLVER EXAMEN ID
    const examenId = await resolveExamenId();
    if (!examenId) {
      alert(
        'No se pudo determinar el examen. Asegúrate de tener todos los filtros (incluido Año) seleccionados.'
      );
      return;
    }

    const commonHtml = serializeBlocks(commonStatement);

    console.log('=== GUARDANDO PREGUNTA AGRUPADA (ATÓMICA) ===');
    setSaving(true);

    try {
      const firstSubClasificacionId = subQuestions[0]?.clasificacionId || defaultClasificacionId || 0;
      const numPadre = initialParent?.numero || (numero ? parseInt(numero, 10) : 1);

      const payload = {
        id: initialParent ? initialParent.id : 0,
        examenId,
        year: initialParent?.year || selectedYear || '0',
        tipoPreguntaId: 2,
        numero: numPadre,
        clasificacionId: firstSubClasificacionId,
        respuesta: 1, // Defaulting to 1 as per example
        enunciados: [
          {
            id: initialParent?.enunciados?.[0]?.id || 1,
            contenido: commonHtml,
          },
        ],
        alternativas: [
          {
            id: initialParent?.alternativas?.[0]?.id || 1,
            contenido: 'n',
          },
        ],
        justificaciones: [
          {
            id: initialParent?.justificaciones?.[0]?.id || 1,
            contenido: 'n',
          },
        ],
        subPreguntas: subQuestions.map((q, index) => {
          const correctIndex = q.alternatives.findIndex((a) => a.esCorrecta);
          const respuestaInt = correctIndex !== -1 ? correctIndex + 1 : 1;

          return {
            examenId,
            year: initialParent?.year || selectedYear || '0',
            preguntaId: initialParent ? initialParent.id : 0,
            id: (q as any).id || 0,
            clasificacionId: q.clasificacionId,
            enunciados: [
              {
                id: (q as any).enunciados?.[0]?.id || 1,
                contenido: serializeBlocks(q.specificStatement),
              },
            ],
            alternativas: q.alternatives.map((alt, altIdx) => ({
              id: altIdx + 1,
              contenido: alt.contenido || '',
            })),
            justificaciones: [
              {
                id: (q as any).justificaciones?.[0]?.id || 1,
                contenido: q.sustento || '',
              },
            ],
            respuestaCorrecta: respuestaInt,
            numero: numPadre + index + 1,
          };
        }),
      };

      console.log('Payload Atómico (User Requirement):', payload);

      let finalIdForAssignment = initialParent?.id;

      if (initialParent) {
        await preguntaService.update(examenId, initialParent.id, payload);
        alert('Pregunta común actualizada con éxito');
      } else {
        const created = await preguntaService.create(payload as any);
        if (created) {
          finalIdForAssignment = created.id;
        }
        alert('Pregunta común creada con éxito (Padre e Hijos)');
      }

      // Asignación multi-examen
      if (selectedTipo === 2 && isMultiAssign && assignmentInfo) {
        await preguntaService.asignarExamenes({
          preguntaId: finalIdForAssignment || 0,
          year: selectedYear || '0',
          examenIds: assignmentInfo.examenesAsignadosIds,
        });
        console.log('Asignación de exámenes completada para pregunta grupo');
      }

      onSuccess();
    } catch (saveError) {
      console.error('Error al guardar pregunta común atómica:', saveError);
      alert(
        'Error técnico al guardar la pregunta agrupada. Revisa la consola para más detalles.'
      );
    } finally {
      setSaving(false);
    }
  };

  // --- RENDER HELPERS ---
  const renderContentManager = (
    blocks: ContentBlock[],
    label: string,
    context: 'common' | 'specific',
    subQId?: string
  ) => {
    const isEmpty = blocks.length === 0;

    return (
      <div className="border border-primary rounded-lg p-6 bg-white shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
          <label className="text-gray-700 font-medium text-sm">{label}</label>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => addBlock('text', context, subQId)}
              className="flex items-center gap-2 text-primary border border-primary px-3 md:px-4 py-1.5 rounded hover:bg-blue-50 text-xs md:text-sm font-medium transition-colors"
            >
              <DocumentTextIcon className="w-4 h-4" /> Añadir Texto
            </button>
            <button
              onClick={() => triggerImageUpload(context, subQId)}
              className="flex items-center gap-2 text-gray-600 border border-gray-300 px-3 md:px-4 py-1.5 rounded hover:bg-gray-50 text-xs md:text-sm font-medium transition-colors"
            >
              <span className="font-bold text-lg leading-none">+</span> Añadir
              Imagen
            </button>
          </div>
        </div>

        {isEmpty ? (
          <div className="border-2 border-dashed border-gray-200 rounded-lg h-32 flex flex-col items-center justify-center text-center bg-gray-50/50">
            <p className="text-gray-500 text-sm font-medium mb-1">
              No hay elementos en {label.toLowerCase()}
            </p>
            <p className="text-xs text-gray-400">
              Usa los botones de arriba para añadir texto o imágenes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {blocks.map((block) => (
              <div key={block.id} className="relative group w-full">
                <button
                  onClick={() => removeBlock(block.id, context, subQId)}
                  className="absolute -right-2 -top-2 p-1 bg-red-100 text-red-500 rounded-full shadow-sm hover:bg-red-200 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar bloque"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
                {block.type === 'text' ? (
                  <div
                    className={`p-4 rounded-lg border border-gray-100 shadow-sm ${
                      block.isGray ? 'bg-gray-100' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3 text-gray-500">
                        <span className="cursor-move">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 100 4 2 2 0 000-4zm3 0a2 2 0 100 4 2 2 0 000-4zM7 9a2 2 0 100 4 2 2 0 000-4zm3 0a2 2 0 100 4 2 2 0 000-4zM7 16a2 2 0 100 4 2 2 0 000-4zm3 0a2 2 0 100 4 2 2 0 000-4zM10 2a2 2 0 100 4 2 2 0 000-4zm3 0a2 2 0 100 4 2 2 0 000-4zM10 9a2 2 0 100 4 2 2 0 000-4zm3 0a2 2 0 100 4 2 2 0 000-4zM10 16a2 2 0 100 4 2 2 0 000-4zm3 0a2 2 0 100 4 2 2 0 000-4z" /></svg>
                        </span>
                        <DocumentTextIcon className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Texto</span>
                    </div>
                    <div className="quill-editor-container border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <TiptapEditor
                          value={block.content}
                          onChange={(val) =>
                            updateBlock(val, block.id, context, subQId)
                          }
                          placeholder={`Escribe aquí...`}
                          borderColor="border-gray-200"
                        />
                    </div>
                    <div className="mt-3 flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer group">
                             <div className="relative flex items-center">
                                <input 
                                    type="checkbox" 
                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:bg-primary checked:border-primary transition-all"
                                    checked={block.isGray}
                                    onChange={() => toggleBlockGray(block.id, context, subQId)}
                                />
                                <svg 
                                    className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-0.5" 
                                    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                             </div>
                             <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Texto en gris</span>
                        </label>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-gray-50 flex justify-center items-center">
                    <img
                      src={block.content}
                      alt="Content"
                      className="max-h-64 rounded shadow-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* --- ASIGNACIÓN DE CATEGORÍAS (Solo para Nombramiento) --- */}
      {selectedTipo === 2 && (
        <div className="border border-[#4790FD] rounded-lg p-6 bg-[#F8FAFF] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 uppercase text-sm tracking-wider">
                  Asignación de Categorías
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Panel de Gestión Multi-Examen</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-blue-50 shadow-sm">
              <input
                type="checkbox"
                id="multiAssignMode"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                checked={isMultiAssign}
                onChange={(e) => handleToggleMultiAssign(e.target.checked)}
              />
              <label
                htmlFor="multiAssignMode"
                className="text-xs font-bold text-blue-700 cursor-pointer"
              >
                ¿Activar guardado múltiple?
              </label>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                {isMultiAssign ? 'Modo Selección Múltiple Activo' : 'Previsualización de Categorías'}
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAllExams}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-tight flex items-center gap-1"
                >
                  <SparklesIcon className="w-3 h-3" /> Seleccionar Todo
                </button>
                <button
                  onClick={handleDeselectAllExams}
                  className="text-[11px] text-gray-400 hover:text-red-400 font-bold uppercase tracking-tight"
                >
                  Limpiar
                </button>
              </div>
            </div>

              {/* Contenedor de Checkboxes con Scroll */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-gray-200 rounded-lg p-6 max-h-[400px] overflow-y-auto custom-scrollbar shadow-inner">
                {assignmentInfo?.todosLosExamenes.map((exam) => {
                  const isChecked = assignmentInfo.examenesAsignadosIds.includes(exam.id);
                  
                  // Detectar jerarquía: Soporta "A > B" o simplemente el texto completo
                  let main = exam.descripcion;
                  let sub = '';

                  if (exam.descripcion.includes(' > ')) {
                    const parts = exam.descripcion.split(' > ');
                    main = parts[0] || '';
                    sub = parts.slice(1).join(' > ');
                  } else {
                    const keywords = ['INICIAL', 'PRIMARIA', 'SECUNDARIA', 'AVANZADO'];
                    for (const kw of keywords) {
                      if (exam.descripcion.includes(kw)) {
                        const idx = exam.descripcion.indexOf(kw);
                        main = exam.descripcion.substring(idx);
                        sub = exam.descripcion.substring(0, idx).trim();
                        break;
                      }
                    }
                  }

                  return (
                    <div
                      key={exam.id}
                      className={`flex items-start gap-3 p-2 rounded-md transition-all duration-200 group border ${
                        isChecked 
                          ? 'bg-blue-50/50 border-blue-100' 
                          : 'bg-white border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="mt-0.5">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-[#4790FD] border-gray-300 rounded focus:ring-[#4790FD] cursor-pointer"
                          checked={isChecked}
                          onChange={() => handleToggleSingleExam(exam.id)}
                        />
                      </div>
                      <div
                        className="cursor-pointer flex-1"
                        onClick={() => handleToggleSingleExam(exam.id)}
                      >
                        <p className={`text-sm font-bold leading-tight ${isChecked ? 'text-blue-800' : 'text-gray-700'}`}>
                          {main}
                        </p>
                        {sub && (
                          <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">
                            {sub}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {(!assignmentInfo || assignmentInfo.todosLosExamenes.length === 0) && (
                  <div className="col-span-full py-10 flex flex-col items-center justify-center text-gray-400">
                    <SparklesIcon className="w-8 h-8 mb-2 animate-pulse" />
                    <p className="text-sm font-medium">Cargando lista de categorías...</p>
                  </div>
                )}
              </div>

              {/* Resumen de Seleccionados */}
              <div className="mt-6 bg-[#EDF3FF] p-4 rounded-lg border border-blue-100">
                <p className="text-xs font-bold text-blue-800 mb-3 flex items-center gap-2">
                  Categorías seleccionadas ({assignmentInfo?.examenesAsignadosIds.length || 0}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {assignmentInfo?.todosLosExamenes
                    .filter((e) => assignmentInfo.examenesAsignadosIds.includes(e.id))
                    .map((e) => (
                      <span
                        key={e.id}
                        className="inline-flex items-center gap-1 bg-white border border-blue-200 text-[#4790FD] px-2 py-1 rounded text-[11px] font-bold shadow-sm"
                      >
                        {e.descripcion.split(' > ').pop()}
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggleSingleExam(e.id);
                          }}
                          className="hover:bg-red-50 hover:text-red-500 rounded p-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION A: COMMON STATEMENT */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2 text-indigo-800">
          <DocumentTextIcon className="w-6 h-6" />
          <h3 className="text-lg font-bold">
            Enunciado Común (Contexto Compartido)
          </h3>
        </div>
        {renderContentManager(commonStatement, 'Enunciado Común', 'common')}
      </div>

      {/* SECTION B: SUB QUESTIONS LIST */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-gray-700 font-bold text-lg">
            Preguntas Asociadas ({subQuestions.length})
          </h3>
        </div>

        {subQuestions.map((q, index) => (
          <div
            key={q.tempId}
            className={`border rounded-xl bg-white shadow-sm transition-all ${
              q.isExpanded
                ? 'border-primary ring-1 ring-blue-100'
                : 'border-gray-200'
            }`}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-t-xl"
              onClick={() => toggleExpand(q.tempId)}
            >
              <div className="flex items-center gap-3">
                <span className="bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="font-medium text-gray-700 truncate max-w-md">
                  {q.specificStatement.length > 0 ? (
                    <span className="text-green-600 font-bold">
                      Con contenido ({q.specificStatement.length} bloques)
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">
                      Nueva pregunta...
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSubQuestion(q.tempId);
                  }}
                  className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
                {q.isExpanded ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Body */}
            {q.isExpanded && (
              <div className="p-6 border-t border-gray-100 space-y-6">
                {/* Meta Fields */}
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/4">
                      <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                        Número
                      </label>
                      <div className="w-full border border-gray-300 rounded px-3 py-2 text-gray-500 bg-gray-100 cursor-not-allowed">
                        {index + 1}
                      </div>
                    </div>
                    <div className="w-full md:w-3/4">
                      <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                        Clasificación
                      </label>
                      <div className="relative">
                        <select
                          className="w-full border border-gray-300 rounded px-3 py-2 text-gray-700 appearance-none focus:border-primary outline-none transition-all bg-white"
                          value={q.clasificacionId}
                          onChange={(e) =>
                            updateSubQuestionField(
                              q.tempId,
                              'clasificacionId',
                              Number(e.target.value)
                            )
                          }
                        >
                          <option value={0}>Seleccionar...</option>
                          {clasificaciones.map((c) => (
                            <option key={c.id} value={c.id}>
                              {getClasificacionFullName(c.clasificacionNombre)}
                            </option>
                          ))}
                        </select>
                        <ChevronDownIcon className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specific Statement Blocks */}
                {renderContentManager(
                  q.specificStatement,
                  'Enunciado Específico',
                  'specific',
                  q.tempId
                )}

                {/* Alternatives */}
                <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                  <label className="block text-xs font-bold text-gray-600 mb-4 uppercase">
                    Alternativas
                  </label>
                  <div className="space-y-4">
                    {q.alternatives.map((alt, i) => (
                      <div
                        key={alt.id}
                        className="flex flex-col md:flex-row gap-2 md:gap-4 md:items-center"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-400 w-6">
                            {['A', 'B', 'C', 'D', 'E', 'F'][i]})
                          </span>
                        </div>
                        <div className="flex-1 w-full overflow-hidden">
                          <TiptapEditor
                            value={alt.contenido}
                            onChange={(val) =>
                              updateAlternative(q.tempId, i, 'contenido', val)
                            }
                            placeholder={`Opción...`}
                            borderColor={
                              alt.esCorrecta
                                ? 'border-green-400'
                                : 'border-gray-200'
                            }
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            updateAlternative(q.tempId, i, 'esCorrecta', true)
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm shrink-0 uppercase self-end md:self-center
                                                    ${
                                                      alt.esCorrecta
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                        >
                          {alt.esCorrecta ? 'Correcta' : 'Marcar'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sustento */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">
                    Sustento (Opcional)
                  </label>
                  <TiptapEditor
                    value={q.sustento}
                    onChange={(val) =>
                      updateSubQuestionField(q.tempId, 'sustento', val)
                    }
                    placeholder="Explicación de la respuesta..."
                    borderColor="border-gray-200"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Button */}
        <button
          onClick={addSubQuestion}
          className="w-full py-3 border-2 border-dashed border-primary text-primary rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Añadir otra sub-pregunta
        </button>
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-lg z-20 flex flex-col sm:flex-row justify-end gap-3 md:px-10">
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-800 font-medium px-4 text-sm md:text-base py-2 w-full sm:w-auto text-center order-2 sm:order-1"
        >
          Cancelar
        </button>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className={`bg-primary text-white px-8 py-2 rounded shadow hover:bg-secondary font-medium transition-colors flex items-center justify-center text-sm md:text-base w-full sm:w-auto order-1 sm:order-2 ${
            saving ? 'opacity-70 cursor-wait' : ''
          }`}
        >
          {saving ? 'Guardando...' : 'Guardar Todo'}
        </button>
      </div>
    </div>
  );
};

export default PreguntaComunForm;
