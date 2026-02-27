import React, { useState, useEffect, useRef } from 'react';

import {
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
} from '@heroicons/react/outline';
import dynamic from 'next/dynamic';

import {
  clasificacionService,
  Clasificacion,
} from '../../services/clasificacionService';
import { preguntaService } from '../../services/preguntaService';
import { subPreguntaService } from '../../services/subPreguntaService';
import { uploadService } from '../../services/uploadService';

// Dynamic import for Tiptap Editor
const TiptapEditor = dynamic(() => import('../editor/TiptapEditor'), {
  ssr: false,
});

interface ContentBlock {
  id: string;
  type: 'text' | 'image';
  content: string; // HTML or Image URL
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
  onSuccess: () => void;
  onCancel: () => void;
}

const PreguntaComunForm: React.FC<PreguntaComunFormProps> = ({
  initialParent,
  initialSubQuestions,
  resolveExamenId,
  defaultClasificacionId,
  onSuccess,
  onCancel,
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
              esCorrecta: s.respuestaCorrecta === 'A',
            },
            {
              id: 'B',
              contenido: s.alternativaB,
              esCorrecta: s.respuestaCorrecta === 'B',
            },
            {
              id: 'C',
              contenido: s.alternativaC,
              esCorrecta: s.respuestaCorrecta === 'C',
            },
            {
              id: 'D',
              contenido: s.alternativaD,
              esCorrecta: s.respuestaCorrecta === 'D',
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

    console.log('=== GUARDANDO PREGUNTA AGRUPADA (PADRE-HIJOS) ===');
    console.log('Examen ID resuelto:', examenId);

    setSaving(true);

    try {
      // === PASO 1: Crear PADRE ===
      const parentPayload = {
        enunciado: commonHtml,
        examenId,
        tipoPreguntaId: 2,
        clasificacionId: subQuestions[0]?.clasificacionId || 0,
        sustento: '',
        imagen: '',
        alternativaA: '',
        alternativaB: '',
        alternativaC: '',
        alternativaD: '',
        respuesta: '',
      };

      console.log(
        initialParent ? 'Editando Padre...' : 'Enviando Padre...',
        parentPayload
      );
      const parentResponse = initialParent
        ? await preguntaService.update(
            examenId,
            initialParent.id,
            parentPayload
          )
        : await preguntaService.createSingle(parentPayload);

      const parentId = initialParent ? initialParent.id : parentResponse.id;
      console.log(
        `Padre ${initialParent ? 'actualizado' : 'creado'} con ID: ${parentId}`
      );

      try {
        // === PASO 2: Crear HIJOS en paralelo ===
        const childPayloads = subQuestions.map((q, index) => {
          const correctIndex = q.alternatives.findIndex((a) => a.esCorrecta);
          const respuestaChar =
            correctIndex !== -1 ? ['A', 'B', 'C', 'D'][correctIndex] || '' : '';

          return {
            examenId,
            preguntaId: parentId,
            numero: index + 1,
            enunciado: serializeBlocks(q.specificStatement),
            alternativaA: q.alternatives[0]?.contenido || '',
            alternativaB: q.alternatives[1]?.contenido || '',
            alternativaC: q.alternatives[2]?.contenido || '',
            alternativaD: q.alternatives[3]?.contenido || '',
            respuestaCorrecta: respuestaChar,
            sustento: q.sustento || '',
            clasificacionId: q.clasificacionId,
            imagen: '',
          };
        });

        console.log(`Enviando ${childPayloads.length} Hijos...`, childPayloads);

        // If editing, we use update for existing ones and create for new ones
        const promises = childPayloads.map(async (payload, idx) => {
          const original = subQuestions[idx];
          // @ts-ignore - check if it has a real database ID
          if (original && original.id) {
            return subPreguntaService.update(
              payload.examenId,
              payload.preguntaId,
              payload.numero,
              payload
            );
          }
          return subPreguntaService.create(payload);
        });

        await Promise.all(promises);

        console.log('=== PREGUNTA AGRUPADA GUARDADA EXITOSAMENTE ===');
        console.log('Padre ID:', parentId, '| Hijos:', childPayloads.length);

        alert(
          `Pregunta agrupada ${
            initialParent ? 'actualizada' : 'guardada'
          } correctamente.\nPadre ID: ${parentId}\nSub-preguntas: ${
            subQuestions.length
          }`
        );
        onSuccess();
      } catch (childError) {
        // === ROLLBACK: Eliminar Padre si fallan los Hijos ===
        console.error(
          'Error creando hijos, ejecutando rollback del padre...',
          childError
        );
        try {
          await preguntaService.delete(parentId);
          console.log('Rollback exitoso: Padre eliminado.');
        } catch (rollbackError) {
          console.error(
            'Error en rollback (no se pudo eliminar el padre):',
            rollbackError
          );
        }
        alert(
          'Error al guardar las sub-preguntas. Se canceló la operación completa.'
        );
      }
    } catch (parentError) {
      console.error('Error creando pregunta padre:', parentError);
      alert('Error al guardar el enunciado principal. Intente nuevamente.');
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
        <div className="flex justify-between items-center mb-4">
          <label className="text-gray-700 font-medium text-sm">{label}</label>

          <div className="flex gap-3">
            <button
              onClick={() => addBlock('text', context, subQId)}
              className="flex items-center gap-2 text-primary border border-primary px-4 py-1.5 rounded hover:bg-blue-50 text-sm font-medium transition-colors"
            >
              <DocumentTextIcon className="w-4 h-4" /> Añadir Texto
            </button>
            <button
              onClick={() => triggerImageUpload(context, subQId)}
              className="flex items-center gap-2 text-gray-600 border border-gray-300 px-4 py-1.5 rounded hover:bg-gray-50 text-sm font-medium transition-colors"
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
                  <div className="quill-editor-container border border-gray-200 rounded-lg overflow-hidden">
                    <TiptapEditor
                      value={block.content}
                      onChange={(val) =>
                        updateBlock(val, block.id, context, subQId)
                      }
                      placeholder={`Escribe aquí...`}
                      borderColor="border-gray-200"
                    />
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
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-lg z-20 flex justify-end gap-4 md:px-10">
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-800 font-medium px-4"
        >
          Cancelar
        </button>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className={`bg-primary text-white px-8 py-2 rounded shadow hover:bg-secondary font-medium transition-colors flex items-center ${
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
