import React, { useState, useEffect, useMemo } from 'react';

import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  SparklesIcon,
  ChevronDownIcon,
  PhotographIcon,
  MenuAlt2Icon,
  MenuIcon,
} from '@heroicons/react/outline';
import dynamic from 'next/dynamic';

import PreguntaComunForm from '../../../components/admin/PreguntaComunForm';
import AdminLayout from '../../../components/AdminLayout';
import HtmlMathRenderer from '../../../components/common/HtmlMathRenderer';
import { ADMIN_CATALOG } from '../../../data/adminCatalog';
import { aiService } from '../../../services/aiService';
import {
  clasificacionService,
  Clasificacion,
} from '../../../services/clasificacionService';
import {
  examenService,
  ExamenGrouped,
  Examen,
} from '../../../services/examenService';
import { preguntaService, Pregunta } from '../../../services/preguntaService';
import {
  subPreguntaService,
  SubPreguntaResponse,
} from '../../../services/subPreguntaService';
import {
  tipoPreguntaService,
  TipoPregunta,
} from '../../../services/tipoPreguntaService';
import { uploadService } from '../../../services/uploadService';
import 'katex/dist/katex.min.css';

// Dynamic import for TiptapEditor (Math Editor)
const TiptapEditor = dynamic(
  () => import('../../../components/editor/TiptapEditor'),
  { ssr: false }
);

interface ContentBlock {
  id: string;
  type: 'text' | 'image';
  content: string; // HTML or Image URL
  isGray?: boolean;
}

const Recursos = () => {
  // --- ESTADOS LOGICOS (CRUD) ---
  const [items, setItems] = useState<Pregunta[]>([]);

  const [rawGroupedData, setRawGroupedData] = useState<ExamenGrouped[]>([]);
  const [loginExamenes, setLoginExamenes] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const examenesStr = localStorage.getItem('loginExamenes');
      const role = localStorage.getItem('role');

      if (examenesStr) setLoginExamenes(JSON.parse(examenesStr));
      if (role) setUserRole(role);
    }
  }, []);

  const groupedData = useMemo(() => {
    // 1. Iniciamos con una copia del catálogo general
    const combined = JSON.parse(
      JSON.stringify(rawGroupedData)
    ) as ExamenGrouped[];

    // 2. Normalizamos la lista de exámenes del usuario (puede venir como array o como objeto con propiedad 'examenes')
    const userExamsList = Array.isArray(loginExamenes)
      ? loginExamenes
      : (loginExamenes as any)?.examenes || [];

    // 3. Fusionamos con la información de userExamsList para asegurar que no falte nada (como "Directivos")
    if (userExamsList && userExamsList.length > 0) {
      userExamsList.forEach((le: any) => {
        const tId = Number(le.tipoExamenId);
        if (!tId) return;

        let tipo = combined.find((t) => t.tipoExamenId === tId);
        if (!tipo) {
          tipo = {
            tipoExamenId: tId,
            tipoExamenNombre: le.tipoExamenNombre || 'Sin nombre',
            fuentes: [],
          };
          combined.push(tipo);
        }

        const fId = Number(le.fuenteId);
        let fuente = tipo.fuentes.find((f) => f.fuenteId === fId);
        if (!fuente) {
          fuente = {
            fuenteId: fId,
            fuenteNombre: le.fuenteNombre || 'Sin nombre',
            modalidades: [],
          };
          tipo.fuentes.push(fuente);
        }

        const mId = Number(le.modalidadId);
        let mod = fuente.modalidades.find((m) => m.modalidadId === mId);
        if (!mod) {
          mod = {
            modalidadId: mId,
            modalidadNombre: le.modalidadNombre || 'Sin nombre',
            niveles: [],
          };
          fuente.modalidades.push(mod);
        }

        const nId = Number(le.nivelId);
        let niv = mod.niveles.find((n) => n.nivelId === nId);
        if (!niv) {
          niv = {
            nivelId: nId,
            nivelNombre: le.nivelNombre || 'Sin nombre',
            especialidades: [],
          };
          mod.niveles.push(niv);
        }

        const eId =
          le.especialidadId === null || le.especialidadId === undefined
            ? null
            : Number(le.especialidadId);
        const hasEsp = niv.especialidades.some(
          (e) =>
            e.especialidadId === eId ||
            (eId === null && e.especialidadId === null)
        );
        if (!hasEsp) {
          niv.especialidades.push({
            especialidadId: eId,
            especialidadNombre: le.especialidadNombre || 'General',
          });
        }
      });
    }

    // 4. Si el usuario es ADMIN, mostramos TODO el catálogo propocionado por la API (rawGroupedData)
    // Usamos ADMIN_CATALOG solo como fallback inicial si la API aún no responde
    if (userRole === 'Admin')
      return rawGroupedData.length > 0 ? rawGroupedData : ADMIN_CATALOG;

    // 5. Si NO es Admin, filtramos para que solo vea lo que tiene asignado estrictamente (usa rawGroupedData como base)
    return combined
      .filter((tipo) =>
        userExamsList.some((le: any) => le.tipoExamenId === tipo.tipoExamenId)
      )
      .map((tipo) => ({
        ...tipo,
        fuentes: tipo.fuentes
          .filter((f) =>
            userExamsList.some(
              (le: any) =>
                le.tipoExamenId === tipo.tipoExamenId &&
                le.fuenteId === f.fuenteId
            )
          )
          .map((f) => ({
            ...f,
            modalidades: f.modalidades
              .filter((m) =>
                userExamsList.some(
                  (le: any) =>
                    le.tipoExamenId === tipo.tipoExamenId &&
                    le.fuenteId === f.fuenteId &&
                    le.modalidadId === m.modalidadId
                )
              )
              .map((m) => ({
                ...m,
                niveles: m.niveles
                  .filter((n) =>
                    userExamsList.some(
                      (le: any) =>
                        le.tipoExamenId === tipo.tipoExamenId &&
                        le.fuenteId === f.fuenteId &&
                        le.modalidadId === m.modalidadId &&
                        le.nivelId === n.nivelId
                    )
                  )
                  .map((n) => ({
                    ...n,
                    especialidades: n.especialidades.filter((e) =>
                      userExamsList.some(
                        (le: any) =>
                          le.tipoExamenId === tipo.tipoExamenId &&
                          le.fuenteId === f.fuenteId &&
                          le.modalidadId === m.modalidadId &&
                          le.nivelId === n.nivelId &&
                          (e.especialidadId === null
                            ? le.especialidadId === null
                            : le.especialidadId === e.especialidadId)
                      )
                    ),
                  })),
              })),
          })),
      }));
  }, [rawGroupedData, loginExamenes, userRole]);

  const [allExams, setAllExams] = useState<Examen[]>([]);
  const [tipoPreguntas, setTipoPreguntas] = useState<TipoPregunta[]>([]);
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const [editingId, setEditingId] = useState<number | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [showResults, setShowResults] = useState(false); // New state for toggling views

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Collision Modal State
  const [isCollisionModalOpen, setIsCollisionModalOpen] = useState(false);
  const [collisionTargetConfig, setCollisionTargetConfig] = useState<{
    toBump: Pregunta[];
    numStr: string;
    stayInCreateMode: boolean;
  } | null>(null);

  // Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successStayInCreate, setSuccessStayInCreate] = useState(false);
  const [successPrevState, setSuccessPrevState] = useState<{
    numParsed: number;
    clasificacionId: number;
    tipoPreguntaId: number;
    examenId: number;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Ideally fetch this from env or context, but user provided it directly for now.
  const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

  // Pagination State

  // --- ESTADOS VISUALES (FILTROS UI) ---
  const [selectedTipo, setSelectedTipo] = useState<number | ''>(2);
  const [selectedFuente, setSelectedFuente] = useState<number | ''>('');
  const [selectedModalidad, setSelectedModalidad] = useState<number | ''>('');
  const [selectedNivel, setSelectedNivel] = useState<number | ''>('');
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<number | ''>(
    ''
  );
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [newYearInput, setNewYearInput] = useState<string>(''); // State for input field
  const [numeroPregunta, setNumeroPregunta] = useState<string>(''); // Número de la pregunta

  // Form State
  const [newItem, setNewItem] = useState({
    enunciado: '',
    respuesta: '', // We will determine this from alternatives
    sustento: '',
    examenId: 0,
    clasificacionId: 0, // Not sure if used, keeping default
    imagen: '',
    tipoPreguntaId: 1, // Default to 1 (Individual)
  });

  // Alternatives State (Dynamic)
  interface AlternativeState {
    id: string;
    contenido: string;
    esCorrecta: boolean;
  }
  const [alternatives, setAlternatives] = useState<AlternativeState[]>([
    { id: '1', contenido: '', esCorrecta: false },
    { id: '2', contenido: '', esCorrecta: false },
    { id: '3', contenido: '', esCorrecta: false },
  ]);

  const [imageFile, setImageFile] = useState<File | null>(null);

  // --- ENUNCIADO STATE (BLOCKS) ---
  const [enunciadoBlocks, setEnunciadoBlocks] = useState<ContentBlock[]>([]);
  const [isUploadingEnunciadoImage, setIsUploadingEnunciadoImage] =
    useState(false);

  // Drag State for Enunciado Blocks
  const [draggedEnunciadoIndex, setDraggedEnunciadoIndex] = useState<
    number | null
  >(null);

  const handleDragStartEnunciado = (e: React.DragEvent, index: number) => {
    setDraggedEnunciadoIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to prevent the dragged image from instantly disappearing
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  };

  const handleDragOverEnunciado = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedEnunciadoIndex === null || draggedEnunciadoIndex === index)
      return;

    const newBlocks = [...enunciadoBlocks];
    const item = newBlocks.splice(draggedEnunciadoIndex, 1)[0];
    if (item) {
      newBlocks.splice(index, 0, item);
      setEnunciadoBlocks(newBlocks);
      setDraggedEnunciadoIndex(index);
    }
  };

  const handleDragEndEnunciado = () => {
    setDraggedEnunciadoIndex(null);
  };

  const addEnunciadoText = () => {
    setEnunciadoBlocks((prev) => [
      ...prev,
      { id: Date.now().toString(), type: 'text', content: '', isGray: false },
    ]);
  };

  const removeEnunciadoBlock = (id: string) => {
    setEnunciadoBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const updateEnunciadoBlock = (id: string, content: string) => {
    setEnunciadoBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content } : b))
    );
  };

  const toggleEnunciadoBlockGray = (id: string) => {
    setEnunciadoBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isGray: !b.isGray } : b))
    );
  };

  const handleEnunciadoImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingEnunciadoImage(true);
    try {
      const url = await uploadService.uploadImage(file);
      setEnunciadoBlocks((prev) => [
        ...prev,
        { id: Date.now().toString(), type: 'image', content: url },
      ]);
    } catch (err) {
      alert('Error subiendo imagen de enunciado');
    } finally {
      setIsUploadingEnunciadoImage(false);
      if (enunciadoImageInputRef.current)
        enunciadoImageInputRef.current.value = '';
    }
  };

  // --- JUSTIFICATION STATE ---
  interface JustificationBlock {
    id: string;
    type: 'text' | 'image';
    content: string;
  }
  const [justificationBlocks, setJustificationBlocks] = useState<
    JustificationBlock[]
  >([]);
  const justificationFileInputRef = React.useRef<HTMLInputElement>(null);
  const enunciadoImageInputRef = React.useRef<HTMLInputElement>(null);

  const selectedModalidadNombre = useMemo(() => {
    if (!selectedModalidad) return '';
    for (const tipo of groupedData) {
      for (const fuente of tipo.fuentes) {
        const mod = fuente.modalidades.find(
          (m) => m.modalidadId === Number(selectedModalidad)
        );
        if (mod) return mod.modalidadNombre;
      }
    }
    return '';
  }, [groupedData, selectedModalidad]);

  const selectedNivelNombre = useMemo(() => {
    if (!selectedNivel) return '';
    for (const tipo of groupedData) {
      for (const fuente of tipo.fuentes) {
        for (const mod of fuente.modalidades) {
          const niv = mod.niveles.find(
            (n) => n.nivelId === Number(selectedNivel)
          );
          if (niv) return niv.nivelNombre;
        }
      }
    }
    return '';
  }, [groupedData, selectedNivel]);

  const selectedEspecialidadNombre = useMemo(() => {
    if (!selectedEspecialidad) return '';
    for (const tipo of groupedData) {
      for (const fuente of tipo.fuentes) {
        for (const mod of fuente.modalidades) {
          for (const niv of mod.niveles) {
            const esp = niv.especialidades.find(
              (e) => e.especialidadId === Number(selectedEspecialidad)
            );
            if (esp) return esp.especialidadNombre;
          }
        }
      }
    }
    return '';
  }, [groupedData, selectedEspecialidad]);

  const addJustificationText = () => {
    setJustificationBlocks([
      ...justificationBlocks,
      { id: Date.now().toString(), type: 'text', content: '' },
    ]);
  };

  const removeJustificationBlock = (id: string) => {
    setJustificationBlocks(justificationBlocks.filter((b) => b.id !== id));
  };

  const updateJustificationBlock = (id: string, content: string) => {
    setJustificationBlocks(
      justificationBlocks.map((b) => (b.id === id ? { ...b, content } : b))
    );
  };

  const handleJustificationImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadService.uploadImage(file);
      setJustificationBlocks([
        ...justificationBlocks,
        { id: Date.now().toString(), type: 'image', content: url },
      ]);
    } catch (err) {
      alert('Error subiendo imagen');
    }
    if (justificationFileInputRef.current)
      justificationFileInputRef.current.value = '';
  };

  // --- ASIGNACION DE EXAMENES ---
  const [isMultiAssign, setIsMultiAssign] = useState(false);
  const [assignmentInfo, setAssignmentInfo] = useState<{
    todosLosExamenes: { id: number; descripcion: string }[];
    examenesAsignadosIds: number[];
  } | null>(null);

  const fetchAssignmentInfo = async (preguntaId: number, year: string) => {
    // Solo para Nombramiento (TipoExamen 2)
    if (Number(selectedTipo) !== 2) return;
    try {
      const info = await preguntaService.getAsignacionExamenInfo(
        preguntaId,
        Number(year) || 0
      );

      // --- AUTO-SELECCIÓN POR DEFECTO ---
      // Si es una pregunta nueva o no tiene asignaciones, marcamos el examen actual de los filtros
      if (preguntaId === 0 || info.examenesAsignadosIds.length === 0) {
        const currentId = await resolveCurrentExamenId();
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

  const handleToggleMultiAssign = (checked: boolean) => {
    setIsMultiAssign(checked);
    if (checked && !assignmentInfo) {
      fetchAssignmentInfo(editingId || 0, selectedYear);
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

  // --- UTILS ---
  useEffect(() => {
    if (viewMode !== 'list' && Number(selectedTipo) === 2) {
      fetchAssignmentInfo(editingId || 0, selectedYear || '0');
    }
  }, [
    viewMode,
    selectedTipo,
    selectedYear,
    editingId,
    selectedFuente,
    selectedModalidad,
    selectedNivel,
    selectedEspecialidad,
  ]);

  const selectedTipoNombre = useMemo(() => {
    return (
      groupedData.find((t) => t.tipoExamenId === Number(selectedTipo))
        ?.tipoExamenNombre || ''
    );
  }, [groupedData, selectedTipo]);

  const isDirectivo = useMemo(() => {
    return selectedTipoNombre.toLowerCase().includes('directivo');
  }, [selectedTipoNombre]);

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

  const getClasificacionFullName = (nombre: string) => {
    switch (nombre) {
      case 'CCP':
        return 'CONOCIMIENTO CURRICULAR Y PEDAGÓGICO';
      case 'CG':
        return 'CONOCIMIENTOS DE GESTIÓN EDUCATIVA Y DE GESTIÓN PÚBLICA';
      case 'CL':
        return 'COMPRENSIÓN LECTORA';
      case 'RL':
        return 'RAZONAMIENTO LÓGICO';
      default:
        return nombre;
    }
  };

  // --- DATA FETCHING (See below for implementation) ---

  // --- SUB-PREGUNTAS STATE (Lazy Loading) ---
  const [subQuestionsMap, setSubQuestionsMap] = useState<
    Record<number, SubPreguntaResponse[]>
  >({});
  const [loadingSubIds, setLoadingSubIds] = useState<Set<number>>(new Set());
  const [subCountsMap, setSubCountsMap] = useState<Record<number, number>>({});

  // Fetch sub-question counts and details for parent questions when items change
  useEffect(() => {
    const parentItems = items.filter((q) => isGroupedType(q.tipoPreguntaId));
    if (parentItems.length === 0) return;

    parentItems.forEach(async (parent) => {
      // Si el backend ya mandó las subPreguntas en el payload (nuevo formato):
      if (parent.subPreguntas && parent.subPreguntas.length > 0) {
        setSubCountsMap((prev) => ({
          ...prev,
          [parent.id]: parent.subPreguntas!.length,
        }));
        setSubQuestionsMap((prev) => ({
          ...prev,
          [parent.id]: parent.subPreguntas as any,
        }));
        return;
      }

      // 1. Fetch count
      try {
        const count = await subPreguntaService.getCount(
          parent.examenId,
          parent.id
        );
        setSubCountsMap((prev) => ({ ...prev, [parent.id]: count }));
      } catch {
        setSubCountsMap((prev) => ({ ...prev, [parent.id]: 0 }));
      }

      // 2. Fetch full details immediately for display
      if (!subQuestionsMap[parent.id]) {
        setLoadingSubIds((prev) => new Set(prev).add(parent.id));
        try {
          const subs = await subPreguntaService.getByPreguntaId(
            parent.examenId,
            parent.id
          );
          setSubQuestionsMap((prev) => ({ ...prev, [parent.id]: subs }));
        } catch (err) {
          console.error('Error fetching sub-preguntas automatically:', err);
          setSubQuestionsMap((prev) => ({ ...prev, [parent.id]: [] }));
        } finally {
          setLoadingSubIds((prev) => {
            const next = new Set(prev);
            next.delete(parent.id);
            return next;
          });
        }
      }
    });
  }, [items]);

  // --- FILTRADO DE ITEMS ---
  const filteredItems = useMemo(() => {
    return items.filter(() => true);
  }, [items, selectedFuente]);

  // --- CASCADING LOGIC ---
  const availableFuentes = useMemo(() => {
    if (!selectedTipo) return [];
    const fuentes =
      groupedData.find((t) => t.tipoExamenId === Number(selectedTipo))
        ?.fuentes || [];
    return fuentes.filter(
      (f: any) =>
        f.fuenteNombre &&
        f.fuenteNombre !== 'string' &&
        f.fuenteNombre.toLowerCase() !== 'null'
    );
  }, [groupedData, selectedTipo]);

  const availableModalidades = useMemo(() => {
    if (!selectedFuente) return [];
    const mods =
      availableFuentes.find((f: any) => f.fuenteId === Number(selectedFuente))
        ?.modalidades || [];
    return mods
      .filter(
        (m: any) =>
          m.modalidadNombre &&
          m.modalidadNombre !== 'string' &&
          m.modalidadNombre.toUpperCase() !== 'NINGUNO'
      )
      .sort((a, b) => {
        const orderValues = [
          'EDUCACIÓN BÁSICA REGULAR',
          'EDUCACIÓN BÁSICA ALTERNATIVA',
          'EDUCACIÓN BÁSICA ESPECIAL',
          'CETPRO',
        ];
        const nameA = (a.modalidadNombre || '').toUpperCase();
        const nameB = (b.modalidadNombre || '').toUpperCase();
        const idxA = orderValues.findIndex((o) => nameA.includes(o));
        const idxB = orderValues.findIndex((o) => nameB.includes(o));
        const valA = idxA === -1 ? 99 : idxA;
        const valB = idxB === -1 ? 99 : idxB;
        if (valA !== valB) return valA - valB;
        return nameA.localeCompare(nameB);
      });
  }, [availableFuentes, selectedFuente]);

  const availableNiveles = useMemo(() => {
    if (!selectedModalidad) return [];
    const nivs =
      availableModalidades.find(
        (m: any) => m.modalidadId === Number(selectedModalidad)
      )?.niveles || [];
    return nivs.filter(
      (n: any) =>
        n.nivelNombre &&
        n.nivelNombre.toUpperCase() !== 'NINGUNO' &&
        n.nivelNombre !== 'string'
    );
  }, [availableModalidades, selectedModalidad]);

  const availableEspecialidades = useMemo(() => {
    if (!selectedNivel) return [];
    const esps =
      availableNiveles.find((n: any) => n.nivelId === Number(selectedNivel))
        ?.especialidades || [];
    return esps.filter(
      (e: any) =>
        e.especialidadNombre &&
        e.especialidadNombre !== 'string' &&
        e.especialidadNombre.toLowerCase() !== 'null'
    );
  }, [availableNiveles, selectedNivel]);

  // Auto-select specialty if only one is available and it's null/empty (hidden)
  useEffect(() => {
    const firstEsp = availableEspecialidades[0];
    if (
      availableEspecialidades.length === 1 &&
      !firstEsp?.especialidadId &&
      selectedEspecialidad === ''
    ) {
      setSelectedEspecialidad(
        firstEsp?.especialidadId === null ? 0 : firstEsp?.especialidadId ?? ''
      );
    }
  }, [availableEspecialidades, selectedEspecialidad]);

  const availableYears = useMemo(() => {
    if (!selectedTipo || !selectedFuente) return [];

    // Prioridad 1: Si es Admin, usamos la jerarquía de groupedData (que ya viene de API o fallback)
    if (userRole === 'Admin') {
      const tipo = groupedData.find(
        (t) => t.tipoExamenId === Number(selectedTipo)
      );
      const fuente = tipo?.fuentes.find(
        (f) => f.fuenteId === Number(selectedFuente)
      );
      const modalidad = fuente?.modalidades.find(
        (m) => m.modalidadId === Number(selectedModalidad)
      );
      const nivel = modalidad?.niveles.find(
        (n) => n.nivelId === Number(selectedNivel)
      );
      const especialidad = nivel?.especialidades.find((e) => {
        const effSel =
          selectedEspecialidad === '' ? 0 : Number(selectedEspecialidad);
        const effId = e.especialidadId === null ? 0 : Number(e.especialidadId);
        return effSel === effId;
      });

      if (especialidad?.years) {
        return especialidad.years
          .map((y: any) => ({
            year: y.year,
            count: y.count,
            examenId: y.examenId || y.id, // Some APIs use id, others examenId in years array
          }))
          .sort((a: any, b: any) => Number(b.year) - Number(a.year));
      }

      // Fallback for NINGUNO level if no specialty selected
      if (!especialidad && nivel && !selectedEspecialidad) {
        const defaultEsp = nivel.especialidades[0];
        if (defaultEsp?.years)
          return defaultEsp.years
            .map((y: any) => ({
              year: y.year,
              examenId: y.examenId || y.id,
            }))
            .sort((a: any, b: any) => Number(b.year) - Number(a.year));
      }
    }

    // Prioridad 2: Lógica actual para usuarios no-admin o fallback
    const effEspecialidadId = selectedEspecialidad
      ? Number(selectedEspecialidad)
      : 0;
    const effNivelId = selectedNivel ? Number(selectedNivel) : 0;
    const effModalidadId = selectedModalidad ? Number(selectedModalidad) : 0;

    const filteredFromCatalog = allExams
      .filter(
        (e) =>
          e.tipoExamenId === Number(selectedTipo) &&
          e.fuenteId === Number(selectedFuente) &&
          (effModalidadId === 0
            ? !e.modalidadId || e.modalidadId === 0
            : e.modalidadId === effModalidadId) &&
          (effNivelId === 0
            ? !e.nivelId || e.nivelId === 0
            : e.nivelId === effNivelId) &&
          (effEspecialidadId === 0
            ? !e.especialidadId || e.especialidadId === 0
            : e.especialidadId === effEspecialidadId)
      )
      .flatMap((e) =>
        (e as any).years
          ? (e as any).years.map((y: any) => ({ year: y.year, examenId: e.id }))
          : [{ year: e.year, examenId: e.id }]
      );

    const userExamsList = Array.isArray(loginExamenes)
      ? loginExamenes
      : (loginExamenes as any)?.examenes || [];
    const filteredFromUser = userExamsList
      .filter(
        (le: any) =>
          Number(le.tipoExamenId) === Number(selectedTipo) &&
          Number(le.fuenteId) === Number(selectedFuente) &&
          (effModalidadId === 0 || Number(le.modalidadId) === effModalidadId) &&
          (effNivelId === 0 ||
            (le.nivelId !== null && Number(le.nivelId) === effNivelId)) &&
          (effEspecialidadId === 0 ||
            (le.especialidadId !== null &&
              Number(le.especialidadId) === effEspecialidadId))
      )
      .flatMap(
        (le: any) =>
          le.years?.map((y: any) => ({ year: y.year, examenId: le.id })) ||
          (le.year !== undefined ? [{ year: le.year, examenId: le.id }] : [])
      );

    const merged = [...filteredFromCatalog, ...filteredFromUser];
    const uniqueYearsMap = new Map<string, number>();

    merged.forEach((item) => {
      if (item.year && !uniqueYearsMap.has(String(item.year))) {
        uniqueYearsMap.set(String(item.year), item.examenId);
      }
    });

    return Array.from(uniqueYearsMap.entries())
      .map(([year, examenId]) => ({ year, examenId }))
      .sort((a, b) => Number(b.year) - Number(a.year));
  }, [
    selectedTipo,
    selectedFuente,
    selectedModalidad,
    selectedNivel,
    selectedEspecialidad,
    allExams,
    loginExamenes,
    userRole,
    groupedData,
  ]);

  const selectedFuenteNombre = useMemo(() => {
    if (!selectedFuente) return '';
    for (const tipo of groupedData) {
      const f = tipo.fuentes.find(
        (fu) => fu.fuenteId === Number(selectedFuente)
      );
      if (f) return f.fuenteNombre;
    }
    return '';
  }, [groupedData, selectedFuente]);

  const showYearFilter = useMemo(() => {
    if (!selectedFuente) return false;
    const isMinedu = selectedFuenteNombre.toUpperCase().includes('MINEDU');
    const isDirectivoLocal = selectedTipoNombre
      .toUpperCase()
      .includes('DIRECTIVO');
    return availableYears.length > 0 || isMinedu || isDirectivoLocal;
  }, [
    selectedFuente,
    selectedFuenteNombre,
    selectedTipoNombre,
    availableYears,
  ]);

  // --- SMART VISUAL RENUMBERING ---
  // Assigns sequential visual numbers to items sorted by (numero ASC, id ASC).
  //
  // Algorithm (cursor-based):
  //   - Walk items in order.
  //   - If item.numero >= cursor → use item.numero as visual (respects gaps naturally).
  //   - If item.numero < cursor → use cursor (item falls in the shifted zone due to a duplicate above).
  //   - cursor always advances to visual + 1.
  //
  // Examples:
  //   Real [1,1,2,3,8,9]   → Visual [1,2,3,4,8,9]  (gap at 5-7 preserved)
  //   Real [1,1,1,1]       → Visual [1,2,3,4]
  //   Real [1,1,2,3,8,8,9] → Visual [1,2,3,4,8,9,10]
  // --- SMART VISUAL RENUMBERING ---
  // Helper to determine if a question type is grouped (Pregunta Común)
  const isGroupedType = (tpId: number) => {
    const tp = tipoPreguntas.find((t) => t.id === tpId);
    if (!tp) return tpId === 2; // Fallback to ID 2
    const name = tp.tipoPreguntaNombre.toLowerCase();
    return (
      name.includes('común') ||
      name.includes('comun') ||
      name.includes('grupal') ||
      tpId === 2
    );
  };

  // --- SMART VISUAL RENUMBERING ---
  const computeVisualNums = (
    sorted: Pregunta[]
  ): {
    mainMap: Map<number, number>;
    subMap: Map<string, number>;
  } => {
    const mainMap = new Map<number, number>();
    const subMap = new Map<string, number>();

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i]!;
      const isParent = isGroupedType(item.tipoPreguntaId);

      if (!isParent) {
        // Individual Question: uses real number
        mainMap.set(item.id, item.numero || 0);
      } else {
        // Grouped Question: sub-questions use their real numbers
        const subs = item.subPreguntas || subQuestionsMap[item.id] || [];
        subs.forEach((sub) => {
          const key = `${sub.examenId}-${sub.preguntaId}-${sub.numero}`;
          subMap.set(key, sub.numero || 0);
        });
      }
    }

    return { mainMap, subMap };
  };

  // --- CONTINUOUS INDEXING LOGIC ---
  const itemsWithIndices = useMemo(() => {
    const sortedItems = [...filteredItems].sort((a, b) => {
      // Helper to get a stable number for sorting (even for groups)
      const getSortNum = (q: Pregunta) => {
        const isGroup = isGroupedType(q.tipoPreguntaId);

        // 1. If it's a group, sub-questions are the ABSOLUTE priority for sorting
        if (isGroup) {
          const subs = q.subPreguntas || subQuestionsMap[q.id] || [];
          if (subs.length > 0) {
            const minSub = Math.min(...subs.map((s) => s.numero || Infinity));
            if (minSub !== Infinity) return minSub;
          }
        }

        // 2. If it's an individual question or a group without loaded subs, use parent number
        if (q.numero && q.numero > 0) return q.numero;

        return Infinity;
      };

      const numA = getSortNum(a);
      const numB = getSortNum(b);
      return numA - numB || a.id - b.id;
    });

    // Compute visual numbers for main and sub questions (now just real numbers)
    const { mainMap, subMap } = computeVisualNums(sortedItems);

    let globalCounter = 0;
    return sortedItems.map((item) => {
      const isParent = isGroupedType(item.tipoPreguntaId);
      let mainIdx = null;

      if (!isParent) {
        globalCounter++;
        mainIdx = globalCounter;
      }

      const subPreguntas = item.subPreguntas || subQuestionsMap[item.id] || [];
      const sortedSubs = [...subPreguntas].sort(
        (a, b) => (a.numero || 0) - (b.numero || 0) || a.id - b.id
      );

      const subsWithIdx = sortedSubs.map((s) => {
        globalCounter++;
        const subKey = `${s.examenId}-${s.preguntaId}-${s.numero}`;
        return { 
          ...s, 
          displayIndex: globalCounter,
          visualNumero: subMap.get(subKey) ?? s.numero
        };
      });

      return {
        ...item,
        displayIndex: mainIdx,
        subsWithIdx,
        visualNumero: mainMap.get(item.id) ?? item.numero,
      };
    });
  }, [filteredItems, subQuestionsMap, tipoPreguntas]);

  const currentItems = itemsWithIndices;

  // Total real de preguntas (incluye sub-preguntas de preguntas agrupadas)
  const totalQuestionCount = useMemo(() => {
    let count = 0;
    for (const item of filteredItems) {
      if (isGroupedType(item.tipoPreguntaId)) {
        // Pregunta agrupada: cuenta sus sub-preguntas
        const subs = item.subPreguntas || subQuestionsMap[item.id] || [];
        count += subs.length;
      } else {
        count++;
      }
    }
    return count;
  }, [filteredItems, subQuestionsMap, tipoPreguntas]);

  // --- HANDLERS (CRUD) ---
  const handleDelete = async (id: number) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('¿Estás seguro de eliminar esta pregunta?')) return;

    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await preguntaService.delete(id);
      // Optimistic update for UI feel, followed by refresh
      setItems((prev) => prev.filter((item) => item.id !== id));
      alert('Pregunta eliminada con éxito');
      fetchData();
    } catch (err) {
      alert('Error eliminando la pregunta');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDeleteSub = async (
    examenId: number,
    parentId: number,
    numero: number
  ) => {
    if (!window.confirm('¿Estás seguro de eliminar esta sub-pregunta?')) return;

    const uniqueKey = `${examenId}-${parentId}-${numero}`;
    // @ts-ignore - use numero as temporary ID for the deleting set
    setDeletingIds((prev) => new Set(prev).add(uniqueKey));
    try {
      await subPreguntaService.delete(examenId, parentId, numero);
      // Update the sub-questions map locally
      setSubQuestionsMap((prev) => ({
        ...prev,
        [parentId]:
          prev[parentId]?.filter((s: any) => s.numero !== numero) || [],
      }));
      // Update count
      setSubCountsMap((prev) => ({
        ...prev,
        [parentId]: Math.max(0, (prev[parentId] || 0) - 1),
      }));
      alert('Sub-pregunta eliminada con éxito');
    } catch (err) {
      alert('Error eliminando la sub-pregunta');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        // @ts-ignore
        next.delete(uniqueKey);
        return next;
      });
    }
  };

  const handleEdit = async (item: Pregunta) => {
    setEditingId(item.id);
    setNumeroPregunta(item.numero?.toString() || '');

    // Updated check: using helper
    if (isGroupedType(item.tipoPreguntaId)) {
      let subs = subQuestionsMap[item.id];
      if (!subs) {
        setLoading(true);
        try {
          const loadedSubs = await subPreguntaService.getByPreguntaId(
            item.examenId,
            item.id
          );
          subs = loadedSubs;
          setSubQuestionsMap((prev) => ({ ...prev, [item.id]: loadedSubs }));
        } catch (err) {
          console.error('Error loading subs for edit:', err);
          subs = [];
        } finally {
          setLoading(false);
        }
      }
    }

    const rawEnunciado = item.enunciados
      ? item.enunciados.map((e: any) => e.contenido).join('')
      : item.enunciado || '';

    const enunciadoBlocksLocal: ContentBlock[] = [];

    if (typeof window !== 'undefined') {
      const div = document.createElement('div');
      div.innerHTML = rawEnunciado;

      const children = Array.from(div.childNodes);
      let currentTextHtml = '';

      const flushCurrentText = () => {
        const textContent = currentTextHtml.replace(/<[^>]*>?/gm, '').trim();
        // Allow if it contains an image like <img /> inside the text that wasn't a parsed block,
        // or actually has text content. Skip lonely `<br/>` elements.
        if (textContent !== '' || currentTextHtml.includes('<img')) {
          enunciadoBlocksLocal.push({
            id: Math.random().toString(36).substr(2, 9),
            type: 'text',
            content: currentTextHtml,
            isGray: false,
          });
        }
        currentTextHtml = '';
      };

      children.forEach((node) => {
        if (node.nodeName === 'IMG') {
          flushCurrentText();
          enunciadoBlocksLocal.push({
            id: Math.random().toString(36).substr(2, 9),
            type: 'image',
            content: (node as HTMLImageElement).src,
          });
        } else if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.nodeName === 'DIV' &&
          (node as HTMLElement).getAttribute('data-block-type') === 'image'
        ) {
          flushCurrentText();
          const img = (node as HTMLElement).querySelector('img');
          if (img) {
            enunciadoBlocksLocal.push({
              id: Math.random().toString(36).substr(2, 9),
              type: 'image',
              content: img.src,
            });
          }
        } else if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.nodeName === 'DIV' &&
          ((node as HTMLElement).classList.contains('bg-gray-100') ||
            (node as HTMLElement).classList.contains('bg-gray-50') ||
            (node as HTMLElement).classList.contains('bg-gray-block') ||
            (node as HTMLElement).classList.contains('bg-var-gray') ||
            (node as HTMLElement).className.includes('bg-[var(--color-bg-50)]'))
        ) {
          flushCurrentText();
          enunciadoBlocksLocal.push({
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
          // We optionally skip a standing <br> if we're at the start to avoid leading newlines
          // caused by our join('<br/>') strategy
          if (content.trim() === '<br>' || content.trim() === '<br/>') {
            if (currentTextHtml !== '') {
              currentTextHtml += content;
            }
          } else {
            currentTextHtml += content;
          }
        }
      });
      flushCurrentText();
    }

    setEnunciadoBlocks(enunciadoBlocksLocal);

    setNewItem({
      enunciado: '', // Now using blocks
      respuesta: item.respuesta?.toString() || '',
      sustento: item.sustento || '',
      examenId: item.examenId,
      clasificacionId: item.clasificacionId || 0,
      imagen: item.imagen || '',
      tipoPreguntaId: item.tipoPreguntaId,
    });

    // Populate alternatives intelligently
    if (item.alternativas && item.alternativas.length > 0) {
      const mappedAlts = item.alternativas.map((alt: any, idx: number) => ({
        id: (idx + 1).toString(),
        contenido: alt.contenido || '',
        esCorrecta:
          item.respuesta === String.fromCharCode(65 + idx) ||
          String(item.respuesta) === String(alt.id),
      }));
      setAlternatives(mappedAlts);
    } else {
      setAlternatives([
        {
          id: '1',
          contenido: item.alternativaA || '',
          esCorrecta: item.respuesta === 'A',
        },
        {
          id: '2',
          contenido: item.alternativaB || '',
          esCorrecta: item.respuesta === 'B',
        },
        {
          id: '3',
          contenido: item.alternativaC || '',
          esCorrecta: item.respuesta === 'C',
        },
        // Only add D if it has content or was previously there
        ...(item.alternativaD
          ? [
              {
                id: '4',
                contenido: item.alternativaD,
                esCorrecta: item.respuesta === 'D',
              },
            ]
          : []),
      ]);
    }

    setImageFile(null);

    // Parse Justification prioritising the array if it exists
    const justificationBlocksLocal: JustificationBlock[] = [];
    if (item.justificaciones && item.justificaciones.length > 0) {
      item.justificaciones.forEach((j: any) => {
        justificationBlocksLocal.push({
          id: j.id?.toString() || Math.random().toString(),
          type: 'text', // Backend usually sends text, improve if it supports images
          content: j.contenido || '',
        });
      });
    } else if (item.sustento) {
      if (typeof window !== 'undefined') {
        const div = document.createElement('div');
        div.innerHTML = item.sustento;
        const children = Array.from(div.children);
        const hasMarkers = children.some((c: any) =>
          c.getAttribute('data-block-type')
        );

        if (hasMarkers) {
          children.forEach((c: any) => {
            const type = c.getAttribute('data-block-type');
            if (type === 'image') {
              const imgTag = c.querySelector('img');
              justificationBlocksLocal.push({
                id: Math.random().toString(),
                type: 'image',
                content: imgTag?.src || '',
              });
            } else {
              justificationBlocksLocal.push({
                id: Math.random().toString(),
                type: 'text',
                content: c.innerHTML,
              });
            }
          });
        } else {
          justificationBlocksLocal.push({
            id: '1',
            type: 'text',
            content: item.sustento,
          });
        }
      } else {
        justificationBlocksLocal.push({
          id: '1',
          type: 'text',
          content: item.sustento,
        });
      }
    }
    setJustificationBlocks(justificationBlocksLocal);

    // Cargar info de asignación si es Nombramiento
    if (Number(selectedTipo) === 2) {
      fetchAssignmentInfo(item.id, item.year?.toString() || '0');
    }

    setViewMode('edit');
  };

  const resetForm = () => {
    setEditingId(null);
    setJustificationBlocks([]);
    setImageFile(null);
    setNumeroPregunta('');
    setEnunciadoBlocks([]);
    setNewItem({
      enunciado: '',
      respuesta: '',
      sustento: '',
      examenId: 0, // Will be set by resolvedExamenId if present
      clasificacionId: 0,
      imagen: '',
      tipoPreguntaId: 1,
    });
    setAlternatives([
      { id: '1', contenido: '', esCorrecta: false },
      { id: '2', contenido: '', esCorrecta: false },
      { id: '3', contenido: '', esCorrecta: false },
    ]);
  };

  const handleAddNew = () => {
    resetForm();
    setNewItem((prev) => ({
      ...prev,
      examenId: 0,
    }));
    setAssignmentInfo(null);
    setIsMultiAssign(false);

    // Si ya hay un año seleccionado, podemos precargar la lista de exámenes disponibles
    if (Number(selectedTipo) === 2 && selectedYear) {
      fetchAssignmentInfo(0, selectedYear);
    }

    setViewMode('create');
  };

  const handleGenerateQuestionAI = async () => {
    if (!aiTopic.trim()) {
      alert('Por favor ingresa un tema.');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const generated = await aiService.generateFullQuestion(
        aiTopic,
        OPENAI_API_KEY
      );

      setNewItem({
        ...newItem,
        enunciado: generated.enunciado,
        respuesta: generated.respuesta,
        sustento: generated.sustento,
        tipoPreguntaId: 1, // Default to CCP or ask user?
      });

      setAlternatives([
        {
          id: '1',
          contenido: generated.alternativaA,
          esCorrecta: generated.respuesta === 'A',
        },
        {
          id: '2',
          contenido: generated.alternativaB,
          esCorrecta: generated.respuesta === 'B',
        },
        {
          id: '3',
          contenido: generated.alternativaC,
          esCorrecta: generated.respuesta === 'C',
        },
      ]);

      // Si por alguna razón la IA devolvió una cuarta
      if (generated.alternativaD) {
        setAlternatives((prev) => [
          ...prev,
          {
            id: '4',
            contenido: generated.alternativaD!,
            esCorrecta: generated.respuesta === 'D',
          },
        ]);
      }

      setIsAiModalOpen(false);
      setAiTopic('');
      setViewMode('create');
      alert('Pregunta generada con éxito. Revisa y guarda.');
    } catch (error) {
      alert(
        'Error generando pregunta con IA. Verifica tu API Key o intenta de nuevo.'
      );
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
      const generated = await aiService.generateAnswers(
        plainText,
        OPENAI_API_KEY
      );

      setNewItem({
        ...newItem,
        respuesta: generated.respuesta,
        sustento: generated.sustento,
      });

      setAlternatives([
        {
          id: '1',
          contenido: generated.alternativaA,
          esCorrecta: generated.respuesta === 'A',
        },
        {
          id: '2',
          contenido: generated.alternativaB,
          esCorrecta: generated.respuesta === 'B',
        },
        {
          id: '3',
          contenido: generated.alternativaC,
          esCorrecta: generated.respuesta === 'C',
        },
      ]);

      if (generated.alternativaD) {
        setAlternatives((prev) => [
          ...prev,
          {
            id: '4',
            contenido: generated.alternativaD!,
            esCorrecta: generated.respuesta === 'D',
          },
        ]);
      }
      alert('Respuestas generadas con éxito.');
    } catch (error) {
      alert('Error generando respuestas con IA.');
      console.error(error);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAddYear = async () => {
    if (!selectedTipo || !selectedFuente || !selectedModalidad) {
      alert(
        'Por favor selecciona los filtros base (Tipo, Fuente, Modalidad) antes de añadir un año.'
      );
      return;
    }

    const year = newYearInput.trim();
    if (!year) {
      alert('Por favor ingresa un año válido.');
      return;
    }

    try {
      setLoading(true);
      await examenService.addYear({
        year,
        tipoExamenId: Number(selectedTipo),
        fuenteId: Number(selectedFuente),
        modalidadId: Number(selectedModalidad),
        nivelId: selectedNivel ? Number(selectedNivel) : 0,
        especialidadId: selectedEspecialidad ? Number(selectedEspecialidad) : 0,
      });
      alert('Año añadido con éxito.');
      setNewYearInput('');
      await fetchData(true);
      setSelectedYear(year);
    } catch (e: any) {
      alert(`Error creando el año/examen: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteYear = async () => {
    if (!selectedYear) return;
    // eslint-disable-next-line no-alert
    if (
      !window.confirm(
        `¿Seguro que deseas eliminar el año ${selectedYear} y toda su configuración? Esto no se puede deshacer.`
      )
    )
      return;

    try {
      setLoading(true);

      const payload = {
        tipoExamenId: Number(selectedTipo),
        fuenteId: Number(selectedFuente),
        modalidadId: Number(selectedModalidad),
        nivelId: selectedNivel ? Number(selectedNivel) : null,
        especialidadId: selectedEspecialidad
          ? Number(selectedEspecialidad)
          : null,
        year: isNaN(Number(selectedYear)) ? selectedYear : Number(selectedYear),
      };

      await examenService.removeYear(payload);
      alert('Año eliminado correctamente.');
      setSelectedYear('');
      await fetchData(true);
    } catch (e: any) {
      alert(`Error eliminando: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- DATA FETCHING ---
  const fetchData = async (forceRefreshMetadata = false) => {
    try {
      // 1. Load Filters (Examen Grouped & Tipos) - Only if not loaded?
      if (
        groupedData.length === 0 ||
        tipoPreguntas.length === 0 ||
        clasificaciones.length === 0
      ) {
        setLoading(true);
      }
      // Actually we need them to populate dropdowns.
      // Maybe we can split this? For now, keep loading controls.
      if (forceRefreshMetadata || rawGroupedData.length === 0) {
        try {
          const grouped = await examenService.getGrouped();
          setRawGroupedData(grouped);
        } catch (err: any) {
          console.error('Examen Service Error:', err);
        }
      }

      if (forceRefreshMetadata || allExams.length === 0) {
        try {
          const all = await examenService.getAll();
          setAllExams(all);
        } catch (e: any) {
          console.error('All Exams Error', e);
        }
      }

      if (tipoPreguntas.length === 0) {
        try {
          const tipos = await tipoPreguntaService.getAll();
          setTipoPreguntas(tipos);
        } catch (err: any) {
          console.error('TipoPregunta Service Error:', err);
        }
      }

      if (clasificaciones.length === 0) {
        try {
          const classData = await clasificacionService.getAll();
          setClasificaciones(classData);
        } catch (err: any) {
          console.error('Clasificacion Service Error:', err);
        }
      }

      // 2. Load Questions - Use the new filter API
      const hasFilter =
        selectedTipo ||
        selectedFuente ||
        selectedModalidad ||
        selectedNivel ||
        selectedEspecialidad ||
        selectedYear;

      try {
        setItemsLoading(true);
        let data: Pregunta[] = [];

        if (hasFilter) {
          const filterData = {
            tipoExamenId: selectedTipo ? Number(selectedTipo) : undefined,
            fuenteId: selectedFuente ? Number(selectedFuente) : undefined,
            modalidadId: selectedModalidad
              ? Number(selectedModalidad)
              : undefined,
            nivelId: selectedNivel ? Number(selectedNivel) : undefined,
            especialidadId: selectedEspecialidad
              ? Number(selectedEspecialidad)
              : undefined,
            year: selectedYear || undefined,
          };
          data = await preguntaService.examenFilter(filterData);
        } else {
          data = await preguntaService.getAll();
        }

        // Sort by ID descending (newest first)
        setItems(data.sort((a, b) => b.id - a.id));
      } catch (err) {
        console.error('Error fetching questions:', err);
        setItems([]);
      }
    } catch (err: any) {
      console.error('Unexpected Error:', err);
    } finally {
      setLoading(false);
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedTipo,
    selectedFuente,
    selectedModalidad,
    selectedNivel,
    selectedEspecialidad,
    selectedYear,
  ]);
  // Trigger fetch when filters change

  // --- HELPER TO RESOLVE EXAMEN ID ---
  const resolveCurrentExamenId = async (): Promise<number | null> => {
    // Minimum required: tipo and fuente
    if (!selectedTipo || !selectedFuente) {
      return null;
    }

    const effectiveYear = selectedYear || '';

    // Determine the effective especialidadId:
    // If user explicitly selected one, use it.
    // If there's only one specialty and it has no real ID (null/0), treat as 0.
    // Otherwise (specialties exist but none selected), we can't resolve.
    let effectiveEspecialidadId: number = 0;
    if (selectedEspecialidad) {
      effectiveEspecialidadId = Number(selectedEspecialidad);
    } else if (
      availableEspecialidades.length === 1 &&
      (!availableEspecialidades[0]?.especialidadId ||
        availableEspecialidades[0].especialidadId === 0)
    ) {
      effectiveEspecialidadId = 0; // single null specialty, auto-resolved
    } else if (availableEspecialidades.length === 0) {
      effectiveEspecialidadId = 0; // no specialties at all
    } else {
      // Multiple specialties but none chosen – cannot resolve
      return null;
    }

    // Determine effective nivelId (0 if none available/needed)
    const effectiveNivelId = selectedNivel ? Number(selectedNivel) : 0;

    // If levels exist but none chosen (and it's not EBR which usually needs them), this might be tricky.
    // However, user specifically asked for 0 instead of null.

    // Determine effective modalidadId (0 if none available/needed)
    const effectiveModalidadId = selectedModalidad
      ? Number(selectedModalidad)
      : 0;

    try {
      const allExams = await examenService.getAll();

      const matchesCoreFilters = (e: any) =>
        Number(e.tipoExamenId) === Number(selectedTipo) &&
        Number(e.fuenteId) === Number(selectedFuente) &&
        (effectiveModalidadId === 0
          ? !e.modalidadId || Number(e.modalidadId) === 0
          : Number(e.modalidadId) === effectiveModalidadId) &&
        (effectiveNivelId === 0
          ? !e.nivelId || Number(e.nivelId) === 0
          : Number(e.nivelId) === effectiveNivelId) &&
        (effectiveEspecialidadId === 0
          ? !e.especialidadId || Number(e.especialidadId) === 0
          : Number(e.especialidadId) === effectiveEspecialidadId);

      const matchesYear = (e: any) =>
        String(e.year) === effectiveYear ||
        (e.years &&
          Array.isArray(e.years) &&
          e.years.some(
            (y: any) =>
              String(y) === effectiveYear || String(y.year) === effectiveYear
          ));

      // Try exact match (with year) first, then fall back to any exam matching core filters
      let target = effectiveYear
        ? allExams.find((e: any) => matchesCoreFilters(e) && matchesYear(e))
        : undefined;

      // Fallback: if no year selected or year match failed, take first exam matching core filters
      if (!target) {
        target = allExams.find((e: any) => matchesCoreFilters(e));
      }

      console.log('resolveCurrentExamenId - Target Match:', target);
      return target ? target.id : null;
    } catch (error) {
      console.error('Error resolving examen ID', error);
      return null;
    }
  };

  const handleSubmit = async (
    e?: React.FormEvent,
    stayInCreateMode = false,
    forceSaveWithCollision = false
  ) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const showErr = (msg: string) => {
      setErrorMsg(msg);
      console.warn('[handleSubmit]', msg);
    };

    // Validar Tipo de Pregunta
    if (!newItem.tipoPreguntaId) {
      showErr('El tipo de pregunta es obligatorio');
      return;
    }

    // Validar Número de Pregunta
    const numPreguntaParsed = parseInt(numeroPregunta, 10);
    if (
      !numeroPregunta.trim() ||
      isNaN(numPreguntaParsed) ||
      numPreguntaParsed <= 0
    ) {
      showErr('El número de la pregunta es obligatorio y debe ser mayor a 0');
      return;
    }

    const hasEnunciadoContent = enunciadoBlocks.some(
      (b) => (b.type === 'text' && b.content.trim()) || b.type === 'image'
    );
    if (!hasEnunciadoContent) {
      showErr('El enunciado es obligatorio');
      return;
    }

    // Resolve Examen ID
    let targetExamenId = newItem.examenId;
    if (!editingId && (!targetExamenId || targetExamenId === 0)) {
      const resolvedId = await resolveCurrentExamenId();
      if (!resolvedId) {
        showErr(
          'No se pudo determinar el examen. Asegúrate de tener Año y demás filtros seleccionados.'
        );
        return;
      }
      targetExamenId = resolvedId;
    }

    // --- DETEKCIÓN DE NÚMERO DUPLICADO ---
    if (!forceSaveWithCollision) {
      const collisionQuestion = items.find(
        (q) =>
          q.numero === numPreguntaParsed &&
          q.examenId === targetExamenId &&
          q.id !== editingId
      );
      if (collisionQuestion) {
        setCollisionTargetConfig({
          toBump: [], // No longer used for shifting
          numStr: numPreguntaParsed.toString(),
          stayInCreateMode,
        });
        setIsCollisionModalOpen(true);
        return;
      }
    }

    try {
      setIsSaving(true);
      let finalUrl = newItem.imagen;
      if (imageFile) {
        finalUrl = await uploadService.uploadImage(imageFile);
      }

      const correctAlt = alternatives.find((a) => a.esCorrecta);
      if (newItem.tipoPreguntaId === 1 && !correctAlt) {
        showErr('Debes marcar una alternativa como correcta.');
        setIsSaving(false);
        return;
      }

      if (Number(newItem.clasificacionId) <= 0) {
        showErr('Por favor selecciona una Clasificación para la pregunta.');
        setIsSaving(false);
        return;
      }

      // Format alternatives with temporary IDs (1, 2, 3...)
      const safeAlts = alternatives.map((a) => ({ ...a }));
      const mappedAlternativas = safeAlts.map((alt, idx) => {
        let tempId = Number(alt.id);
        if (isNaN(tempId) || tempId < 1 || tempId > 2000000000) {
          tempId = idx + 1;
        }
        return { id: tempId, contenido: alt.contenido || '' };
      });

      let finalRespuesta: number = 0;
      const correctIdx = safeAlts.findIndex((a) => a.esCorrecta);
      if (correctIdx !== -1) {
        const matchedAlt = mappedAlternativas[correctIdx];
        if (matchedAlt) finalRespuesta = matchedAlt.id;
      }

      const payload = {
        id: editingId || 0,
        examenId: targetExamenId,
        year: String(selectedYear || '0'),
        numero: numPreguntaParsed,
        clasificacionId: Number(newItem.clasificacionId),
        tipoPreguntaId: Number(newItem.tipoPreguntaId),
        respuesta: finalRespuesta,
        enunciados: [
          {
            id: 1,
            contenido: enunciadoBlocks
              .map((b) => {
                if (b.type === 'image')
                  return `<div data-block-type="image"><img src="${b.content}" alt="imagen" /></div>`;
                if (b.isGray)
                  return `<div class="mb-2 p-4 bg-[var(--color-bg-50)] bg-gray-100 rounded-md text-justify">${b.content}</div>`;
                return b.content;
              })
              .join('<br/>'),
          },
        ],
        alternativas: mappedAlternativas,
        justificaciones: justificationBlocks.map((b, idx) => ({
          id: idx + 1,
          contenido: b.content,
        })),
        sustento: justificationBlocks
          .map((b) => {
            if (b.type === 'image')
              return `<div data-block-type="image"><img src="${b.content}" alt="justificacion" /></div>`;
            return b.content;
          })
          .join('<br/>'),
        subPreguntas: [],
        imagen: finalUrl || '',
      };

      let finalIdForAssignment = editingId;

      if (editingId) {
        const updated = await preguntaService.update(
          payload.examenId,
          editingId,
          payload
        );
        setItems((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      } else {
        try {
          let created = await preguntaService.create(payload as any);
          if (created) {
            if (created.numero !== numPreguntaParsed) {
              console.log(
                `Backend asignó ${created.numero}, forzando a ${numPreguntaParsed}...`
              );
              try {
                const corrected = await preguntaService.update(
                  targetExamenId,
                  created.id,
                  { ...payload, id: created.id, numero: numPreguntaParsed }
                );
                created = corrected;
              } catch (err) {
                console.error('No se pudo forzar el número correcto', err);
              }
            }
            setItems((prev) => [created, ...prev]);
            finalIdForAssignment = created.id;
          }
        } catch (error: any) {
          alert(error.message || 'Error al crear la pregunta');
          return;
        }
      }

      if (Number(selectedTipo) === 2 && isMultiAssign && assignmentInfo) {
        await preguntaService.asignarExamenes({
          preguntaId: finalIdForAssignment || 0,
          year: selectedYear || '0',
          examenIds: assignmentInfo.examenesAsignadosIds,
        });
      }

      const prevClasificacionId = newItem.clasificacionId;
      const prevTipoPreguntaId = newItem.tipoPreguntaId;

      // Show success modal instead of alert
      setSuccessStayInCreate(stayInCreateMode);
      if (stayInCreateMode) {
        setSuccessPrevState({
          numParsed: numPreguntaParsed,
          clasificacionId: prevClasificacionId,
          tipoPreguntaId: prevTipoPreguntaId,
          examenId: targetExamenId,
        });
      }
      setIsSuccessModalOpen(true);
      resetForm();

      if (stayInCreateMode) {
        setNumeroPregunta((numPreguntaParsed + 1).toString());
        setNewItem((prev) => ({
          ...prev,
          clasificacionId: prevClasificacionId,
          tipoPreguntaId: prevTipoPreguntaId,
          examenId: targetExamenId,
        }));
      }

      await fetchData();

      const targetIdToScroll = stayInCreateMode
        ? finalIdForAssignment
        : editingId || finalIdForAssignment;
      if (targetIdToScroll) {
        setTimeout(() => {
          const el = document.getElementById(
            `pregunta-row-${targetIdToScroll}`
          );
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add(
              'ring-[6px]',
              'ring-blue-300',
              'transition-shadow',
              'duration-500'
            );
            setTimeout(
              () => el.classList.remove('ring-[6px]', 'ring-blue-300'),
              3000
            );
          }
        }, 500);
      }
    } catch (err: any) {
      console.error(err);
      showErr(
        `Error guardando pregunta: ${err.message || 'Error desconocido'}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // --- RENDER ---
  if (loading && rawGroupedData.length === 0)
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );

  // ... (Tu lógica anterior se mantiene igual, solo cambia el render del formulario)

  // --- RENDER FORM VIEW (DISEÑO MEJORADO) ---
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <>
      <AdminLayout>
        <div className="space-y-6 pb-20 -m-6">
          {/* pb-20 para dar espacio al footer flotante si lo hubiera */}
          {/* 1. HEADER CELESTE (Como en la imagen) */}
          <div className="w-full bg-[#4a90f9] py-3 px-6 shadow-md flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode('list')}
                className="text-white hover:text-gray-100 flex items-center text-sm font-medium"
              >
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                Volver
              </button>
            </div>
            <h1 className="text-lg font-bold text-white text-center flex-1">
              {editingId ? 'Editar pregunta' : 'Añadir preguntas'}
            </h1>
            <div className="w-20"></div>{' '}
            {/* Espaciador para centrar el título */}
          </div>
          {/* MAIN FORM CONTAINER */}
          <div className="bg-white p-6 space-y-6 w-full">
            {/* 2. BARRA DE SELECCIÓN DE TIPO (Dropdown estilo acordeón) */}
            <div className="border border-gray-300 rounded-lg bg-white overflow-hidden shadow-sm">
              <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100 bg-white">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">
                    Tipo de Pregunta
                  </label>
                  <select
                    className="w-full bg-transparent font-medium text-gray-800 outline-none cursor-pointer"
                    value={newItem.tipoPreguntaId}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        tipoPreguntaId: Number(e.target.value),
                      })
                    }
                  >
                    {tipoPreguntas.map((tp) => (
                      <option key={tp.id} value={tp.id}>
                        {tp.tipoPreguntaNombre}
                      </option>
                    ))}
                  </select>
                </div>
                <ChevronDownIcon className="w-5 h-5 text-gray-500" />
              </div>
            </div>

            {/* 3. FILA: NÚMERO Y CLASIFICACIÓN (Visible para ambos modos) */}
            <div className="border border-[#4790FD] rounded-lg p-6 bg-white shadow-sm">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Número (Solo si no es Grupal) */}
                {!isGroupedType(newItem.tipoPreguntaId) && (
                  <div className="w-full md:w-1/4">
                    <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                      Número de la pregunta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className={`w-full border rounded px-3 py-2 text-gray-700 focus:ring-1 outline-none transition-all ${
                        !numeroPregunta.trim() ||
                        isNaN(parseInt(numeroPregunta, 10)) ||
                        parseInt(numeroPregunta, 10) <= 0
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
                          : 'border-[#4790FD] focus:border-[#4790FD] focus:ring-[#4790FD]'
                      }`}
                      placeholder="Requerido"
                      min="1"
                      value={numeroPregunta}
                      onChange={(e) => setNumeroPregunta(e.target.value)}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                )}

                {/* Clasificación */}
                <div className={isGroupedType(newItem.tipoPreguntaId) ? "w-full" : "w-full md:w-3/4"}>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                    Clasificación de la pregunta
                  </label>
                  <div className="relative">
                    <select
                      className="w-full border border-gray-300 rounded px-3 py-2 text-gray-700 appearance-none focus:border-[#4790FD] focus:ring-1 focus:ring-[#4790FD] outline-none transition-all bg-white"
                      value={newItem.clasificacionId}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          clasificacionId: Number(e.target.value),
                        })
                      }
                    >
                      <option value={0}>Seleccionar Clasificación...</option>
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

            {/* CONDITIONAL RENDER: INDIVIDUAL vs GROUP */}
            {isGroupedType(newItem.tipoPreguntaId) ? (
              /* --- FORMULARIO DE PREGUNTA COMÚN (Grupal) --- */
              <PreguntaComunForm
                initialParent={
                  editingId ? items.find((i) => i.id === editingId) : undefined
                }
                initialSubQuestions={
                  editingId ? subQuestionsMap[editingId] : undefined
                }
                resolveExamenId={resolveCurrentExamenId}
                defaultClasificacionId={Number(newItem.clasificacionId) || 0}
                selectedYear={selectedYear}
                onSuccess={(subInfo) => {
                  fetchData();
                  setViewMode('list');
                  if (subInfo) {
                    setTimeout(() => {
                      const el = document.getElementById(
                        `subpregunta-row-${subInfo.examenId}-${subInfo.parentId}-${subInfo.numero}`
                      );
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add(
                          'ring-[6px]',
                          'ring-indigo-300',
                          'transition-shadow',
                          'duration-500'
                        );
                        setTimeout(
                          () => el.classList.remove('ring-[6px]', 'ring-indigo-300'),
                          3000
                        );
                      }
                    }, 500);
                  }
                }}
                onCancel={() => setViewMode('list')}
                numero={numeroPregunta}
                selectedTipo={Number(selectedTipo)}
                existingItems={items}
              />
            ) : (
              /* --- FORMULARIO INDIVIDUAL (Estándar) --- */
              <>
                {/* --- ASIGNACIÓN DE CATEGORÍAS (Solo para Nombramiento) --- */}
                {Number(selectedTipo) === 2 && (
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
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                            Panel de Gestión Multi-Examen
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-blue-50 shadow-sm">
                        <input
                          type="checkbox"
                          id="multiAssignMode"
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          checked={isMultiAssign}
                          onChange={(e) =>
                            handleToggleMultiAssign(e.target.checked)
                          }
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
                          {isMultiAssign
                            ? 'Modo Selección Múltiple Activo'
                            : 'Previsualización de Categorías'}
                        </p>

                        <div className="flex items-center gap-4">
                          <button
                            onClick={handleSelectAllExams}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-tight flex items-center gap-1"
                          >
                            <SparklesIcon className="w-3 h-3" /> Seleccionar
                            Todo
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
                          const isChecked =
                            assignmentInfo.examenesAsignadosIds.includes(
                              exam.id
                            );

                          // Detectar jerarquía: Soporta "A > B" o simplemente el texto completo
                          let main = exam.descripcion;
                          let sub = '';

                          if (exam.descripcion.includes(' > ')) {
                            const parts = exam.descripcion.split(' > ');
                            main = parts[0] || '';
                            sub = parts.slice(1).join(' > ');
                          } else {
                            const keywords = [
                              'INICIAL',
                              'PRIMARIA',
                              'SECUNDARIA',
                              'AVANZADO',
                            ];
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
                                  onChange={() =>
                                    handleToggleSingleExam(exam.id)
                                  }
                                />
                              </div>
                              <div
                                className="cursor-pointer flex-1"
                                onClick={() => handleToggleSingleExam(exam.id)}
                              >
                                <p
                                  className={`text-sm font-bold leading-tight ${
                                    isChecked
                                      ? 'text-blue-800'
                                      : 'text-gray-700'
                                  }`}
                                >
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

                        {(!assignmentInfo ||
                          assignmentInfo.todosLosExamenes.length === 0) && (
                          <div className="col-span-full py-10 flex flex-col items-center justify-center text-gray-400">
                            <SparklesIcon className="w-8 h-8 mb-2 animate-pulse" />
                            <p className="text-sm font-medium">
                              Cargando lista de categorías...
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Resumen de Seleccionados */}
                      <div className="mt-6 bg-[#EDF3FF] p-4 rounded-lg border border-blue-100">
                        <p className="text-xs font-bold text-blue-800 mb-3 flex items-center gap-2">
                          Categorías seleccionadas (
                          {assignmentInfo?.examenesAsignadosIds.length || 0}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {assignmentInfo?.todosLosExamenes
                            .filter((e) =>
                              assignmentInfo.examenesAsignadosIds.includes(e.id)
                            )
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

                {/* 4. SECCIÓN ENUNCIADO (Estilo exacto a la imagen) */}
                <div className="border border-[#4790FD] rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <label className="text-gray-700 font-medium text-sm">
                      Enunciado de la pregunta
                    </label>

                    {/* Botones de Acción */}
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      <button
                        onClick={addEnunciadoText}
                        className="flex items-center gap-2 text-[#4790FD] border border-[#4790FD] px-3 md:px-4 py-1.5 rounded hover:bg-blue-50 text-xs md:text-sm font-medium transition-colors"
                      >
                        <DocumentTextIcon className="w-4 h-4" /> Añadir Texto
                      </button>
                      <button
                        onClick={() => enunciadoImageInputRef.current?.click()}
                        disabled={isUploadingEnunciadoImage}
                        className="flex items-center gap-2 text-gray-600 border border-gray-300 px-3 md:px-4 py-1.5 rounded hover:bg-gray-50 text-xs md:text-sm font-medium transition-colors disabled:opacity-60"
                      >
                        {isUploadingEnunciadoImage ? (
                          <span className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full inline-block" />
                        ) : (
                          <span className="font-bold text-lg leading-none">
                            +
                          </span>
                        )}{' '}
                        {isUploadingEnunciadoImage
                          ? 'Subiendo...'
                          : 'Añadir Imagen'}
                      </button>
                      <input
                        type="file"
                        ref={enunciadoImageInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleEnunciadoImageUpload}
                      />
                    </div>
                  </div>

                  {/* Lógica de Visualización: Editor o Placeholder */}
                  {enunciadoBlocks.length === 0 ? (
                    /* PLACEHOLDER PUNTEADO (Como la imagen) */
                    <div className="border-2 border-dashed border-gray-200 rounded-lg h-32 flex flex-col items-center justify-center text-center bg-gray-50/50">
                      <p className="text-gray-500 text-sm font-medium mb-1">
                        No hay elementos en enunciado de la pregunta
                      </p>
                      <p className="text-xs text-gray-400">
                        Usa los botones de arriba para añadir texto o imágenes.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {enunciadoBlocks.map((block, index) => (
                        <div
                          key={block.id}
                          className={`relative group w-full flex gap-3 transition-opacity ${
                            draggedEnunciadoIndex === index
                              ? 'opacity-50'
                              : 'opacity-100'
                          }`}
                          draggable
                          onDragStart={(e) =>
                            handleDragStartEnunciado(e, index)
                          }
                          onDragOver={(e) => handleDragOverEnunciado(e, index)}
                          onDragEnd={handleDragEndEnunciado}
                          style={{ cursor: 'default' }}
                        >
                          {/* Drag Handle */}
                          <div className="flex flex-col items-center justify-center text-gray-400 hover:text-[#4790FD] cursor-move transition-colors pt-4">
                            <MenuIcon className="w-6 h-6" />
                          </div>

                          <div className="flex-1 min-w-0 relative">
                            <button
                              onClick={() => removeEnunciadoBlock(block.id)}
                              className="absolute right-4 top-4 p-1.5 bg-red-50 text-red-500 rounded-md shadow-sm hover:bg-red-100 z-10 opacity-0 group-hover:opacity-100 transition-all"
                              title="Eliminar bloque"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                            {block.type === 'text' ? (
                              <div
                                className={`p-4 rounded-lg border shadow-sm ${
                                  block.isGray
                                    ? 'bg-gray-100 border-gray-200'
                                    : 'bg-white border-gray-100'
                                }`}
                                onDragStart={(e) => {
                                  // Prevent child inputs from triggering drag if user is just selecting text
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                draggable={false}
                              >
                                <div className="flex items-center gap-2 mb-3 text-gray-500">
                                  <DocumentTextIcon className="w-4 h-4" />
                                  <span className="text-xs font-bold uppercase tracking-wider">
                                    Texto
                                  </span>
                                </div>
                                <div className="quill-editor-container border border-gray-200 rounded-lg overflow-hidden bg-white">
                                  <TiptapEditor
                                    value={block.content}
                                    onChange={(val) =>
                                      updateEnunciadoBlock(block.id, val)
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
                                        onChange={() =>
                                          toggleEnunciadoBlockGray(block.id)
                                        }
                                      />
                                      <svg
                                        className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-0.5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                      </svg>
                                    </div>
                                    <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                                      Texto en gris
                                    </span>
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. SECCIÓN ALTERNATIVAS (Diseño Idéntico a la imagen) */}
                <div className="border border-[#4790FD] rounded-lg p-6 bg-white shadow-sm space-y-6">
                  <h3 className="text-gray-700 font-medium text-sm">
                    Alternativas
                  </h3>

                  <div className="space-y-6">
                    {alternatives.map((alt, index) => (
                      /* CONTENEDOR FLEX: Editor (Expandido) + Botones (Derecha/Abajo en móvil) */
                      <div
                        key={alt.id}
                        className="flex flex-col md:flex-row gap-4 md:items-center"
                      >
                        {/* IZQUIERDA: EDITOR (Tiptap Math Editor) */}
                        <div className="flex-1 w-full overflow-hidden">
                          <TiptapEditor
                            value={alt.contenido}
                            onChange={(val: string) => {
                              setAlternatives((prev) =>
                                prev.map((a, i) =>
                                  i === index ? { ...a, contenido: val } : a
                                )
                              );
                            }}
                            placeholder="Ingresa el texto de la alternativa"
                            borderColor={
                              alt.esCorrecta
                                ? 'border-green-500 ring-1 ring-green-500 shadow-sm'
                                : 'border-sky-400'
                            }
                          />
                        </div>

                        {/* DERECHA: BOTONES DE ACCIÓN (Centrados verticalmente en desktop, fila en móvil) */}
                        <div className="flex items-center gap-3 shrink-0 justify-end md:justify-start">
                          {/* Botón MARCAR (Estilo Píldora Gris/Verde) */}
                          <button
                            type="button"
                            onClick={() => {
                              const newAlts = alternatives.map((a) => ({
                                ...a,
                                esCorrecta: a.id === alt.id,
                              }));
                              setAlternatives(newAlts);
                            }}
                            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all shadow-sm
                            ${
                              alt.esCorrecta
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                            }`}
                          >
                            {alt.esCorrecta ? 'Correcta' : 'Marcar'}
                          </button>

                          {/* Botón ELIMINAR (Icono Rojo) */}
                          <button
                            type="button"
                            onClick={() => {
                              if (alternatives.length <= 2) {
                                alert('Mínimo 2 alternativas requeridas.');
                                return;
                              }
                              setAlternatives(
                                alternatives.filter((a) => a.id !== alt.id)
                              );
                            }}
                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                            title="Eliminar alternativa"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Botón para añadir más alternativas (Opcional, estilo link simple) */}
                  <button
                    onClick={() =>
                      setAlternatives([
                        ...alternatives,
                        {
                          id: Date.now().toString(),
                          contenido: '',
                          esCorrecta: false,
                        },
                      ])
                    }
                    className="text-[#4790FD] text-sm font-medium hover:underline flex items-center gap-1 mt-2"
                  >
                    <PlusIcon className="w-4 h-4" /> Añadir otra alternativa
                  </button>
                </div>

                {/* JUSTIFICATION SECTION */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
                  <h3 className="text-gray-700 font-medium text-sm mb-4">
                    Justificación de la respuesta
                  </h3>

                  {/* Controls */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      type="button"
                      onClick={addJustificationText}
                      className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white border border-sky-200 text-sky-600 rounded-lg hover:bg-sky-50 transition-colors text-xs md:text-sm font-medium"
                    >
                      <MenuAlt2Icon className="w-4 h-4" /> Añadir Texto
                    </button>
                    <button
                      type="button"
                      onClick={() => justificationFileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white border border-sky-200 text-sky-600 rounded-lg hover:bg-sky-50 transition-colors text-xs md:text-sm font-medium"
                    >
                      <PhotographIcon className="w-4 h-4" /> Añadir Imagen
                    </button>
                    <input
                      type="file"
                      ref={justificationFileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleJustificationImageUpload}
                    />
                  </div>

                  {/* Blocks */}
                  <div className="space-y-4 border border-dashed border-gray-300 rounded-lg p-4 min-h-[100px] flex flex-col justify-center">
                    {justificationBlocks.length === 0 && (
                      <div className="text-center text-gray-400 text-sm py-4">
                        No hay elementos en justificación de la respuesta
                        <br />
                        Usa los botones de arriba para añadir texto o imágenes.
                      </div>
                    )}

                    {justificationBlocks.map((block) => (
                      <div key={block.id} className="relative group w-full">
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeJustificationBlock(block.id)}
                          className="absolute right-4 top-4 p-1.5 bg-red-50 text-red-500 rounded-md shadow-sm hover:bg-red-100 z-10 opacity-0 group-hover:opacity-100 transition-all"
                          title="Eliminar bloque"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>

                        {block.type === 'text' ? (
                          <div className="w-full">
                            <TiptapEditor
                              value={block.content}
                              onChange={(val) =>
                                updateJustificationBlock(block.id, val)
                              }
                              placeholder="Escribe la justificación..."
                              borderColor="border-gray-300"
                            />
                          </div>
                        ) : (
                          <div className="border rounded-lg p-4 bg-gray-50 flex justify-center items-center">
                            <img
                              src={block.content}
                              alt="Justificación"
                              className="max-h-64 rounded shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. FOOTER ACTIONS */}
                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg z-20 md:px-10">
                  {errorMsg && (
                    <div className="w-full bg-red-600 text-white text-sm font-semibold px-6 py-3 flex items-center gap-2">
                      <span>&#9888;</span>
                      <span>{errorMsg}</span>
                      <button
                        className="ml-auto text-white opacity-70 hover:opacity-100"
                        onClick={() => setErrorMsg(null)}
                      >
                        &#x2715;
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row justify-end gap-3 p-4">
                    <button
                      onClick={() => handleSubmit(undefined, false)}
                      disabled={isSaving}
                      className="bg-[#4a90f9] text-white px-6 py-2 rounded shadow hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 text-sm md:text-base w-full sm:w-auto"
                    >
                      {isSaving
                        ? 'Guardando...'
                        : editingId
                        ? 'Actualizar Pregunta'
                        : 'Guardar Pregunta'}
                    </button>
                    {!editingId && (
                      <button
                        onClick={() => handleSubmit(undefined, true)}
                        disabled={isSaving}
                        className="bg-white text-[#4a90f9] border border-[#4a90f9] px-6 py-2 rounded shadow hover:bg-blue-50 font-medium transition-colors disabled:opacity-50 text-sm md:text-base w-full sm:w-auto"
                      >
                        {isSaving ? 'Guardando...' : 'Guardar y Añadir otra'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </AdminLayout>

      {/* SUCCESS MODAL */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 tracking-tight">
                ¡Guardado con éxito!
              </h3>
              <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                {successStayInCreate
                  ? "La pregunta fue guardada. Puedes continuar añadiendo la siguiente."
                  : "La pregunta ha sido guardada correctamente."}
              </p>
              <div className="flex justify-center gap-4 w-full">
                <button
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    if (successStayInCreate && successPrevState) {
                      setNumeroPregunta((successPrevState.numParsed + 1).toString());
                      setNewItem((prev) => ({
                        ...prev,
                        clasificacionId: successPrevState.clasificacionId,
                        tipoPreguntaId: successPrevState.tipoPreguntaId,
                        examenId: successPrevState.examenId,
                      }));
                      resetForm();
                    } else {
                      setViewMode("list");
                    }
                  }}
                  className="px-5 py-2.5 w-full bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 hover:shadow-lg transition-all flex justify-center items-center"
                >
                  {successStayInCreate ? "Continuar añadiendo" : "Aceptar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COLLISION MODAL */}
      {isCollisionModalOpen && collisionTargetConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <DocumentTextIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 tracking-tight">
                Número Duplicado
              </h3>
              <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                El número de pregunta{" "}
                <span className="font-bold text-gray-900 mx-1">
                  {collisionTargetConfig.numStr}
                </span>{" "}
                ya existe en este examen. Por favor, selecciona un número diferente para poder guardar la pregunta.
              </p>
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => {
                    setIsCollisionModalOpen(false);
                    handleSubmit(undefined, collisionTargetConfig.stayInCreateMode, true);
                  }}
                  className="px-5 py-2.5 w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all flex justify-center items-center shadow-md font-bold uppercase tracking-tight text-xs"
                >
                  Permitir Duplicado
                </button>
                <button
                  onClick={() => setIsCollisionModalOpen(false)}
                  className="px-5 py-2.5 w-full bg-gray-100 text-gray-400 font-bold uppercase tracking-tight text-xs rounded-lg hover:bg-gray-200 transition-all flex justify-center items-center"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
    );
  }
  // --- RENDER LIST VIEW ---
  return (
    <AdminLayout>
      {/* SECCIÓN 1: HEADER (Only show if NOT showing results) */}
      {!showResults && (
        <div className="w-full bg-primary py-4 px-6 rounded-t-lg shadow-sm mb-4">
          <h1 className="text-xl font-bold text-white text-center">
            Banco de Preguntas - Admin
          </h1>
        </div>
      )}

      <div className="space-y-6">
        {/* SECCIÓN 2: FILTROS (Show only if !showResults) */}
        {!showResults && (
          <div className="bg-white rounded-lg shadow-sm border border-primary p-6">
            <div className="flex flex-col gap-4 mb-6">
              {/* 1. Tipo Examen */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-primary">
                  Tipo Exámen <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  value={selectedTipo}
                  onChange={(e) => {
                    setSelectedTipo(
                      e.target.value ? Number(e.target.value) : ''
                    );
                    setSelectedFuente('');
                    setSelectedModalidad('');
                    setSelectedNivel('');
                    setSelectedEspecialidad('');
                    setSelectedYear('');
                  }}
                >
                  <option value="">Seleccionar Tipo Exámen</option>
                  {groupedData.map((t: any) => (
                    <option key={t.tipoExamenId} value={t.tipoExamenId}>
                      {t.tipoExamenNombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Sección Fuente */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-primary">
                  Sección Fuente <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                  value={selectedFuente}
                  onChange={(e) => {
                    setSelectedFuente(
                      e.target.value ? Number(e.target.value) : ''
                    );
                    setSelectedModalidad('');
                    setSelectedNivel('');
                    setSelectedEspecialidad('');
                    setSelectedYear('');
                  }}
                  disabled={!selectedTipo}
                >
                  <option value="">
                    {selectedTipo
                      ? 'Selecciona una sección'
                      : 'Primero selecciona tipo'}
                  </option>
                  {availableFuentes.map((f: any) => (
                    <option key={f.fuenteId} value={f.fuenteId}>
                      {f.fuenteNombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Modalidad */}
              {availableModalidades.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-primary">
                    {isDirectivo ? 'Sección Directiva' : 'Modalidad'}
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                    value={selectedModalidad}
                    onChange={(e) => {
                      setSelectedModalidad(
                        e.target.value ? Number(e.target.value) : ''
                      );
                      setSelectedNivel('');
                      setSelectedEspecialidad('');
                      setSelectedYear('');
                    }}
                    disabled={
                      !selectedFuente || availableModalidades.length === 0
                    }
                  >
                    <option value="" disabled hidden>
                      Seleccionar modalidad
                    </option>
                    {availableModalidades.map((m: any) => (
                      <option key={m.modalidadId} value={m.modalidadId}>
                        {m.modalidadNombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 4. Nivel */}
              {availableNiveles.length > 0 &&
                !(
                  availableNiveles.length === 1 &&
                  availableNiveles[0]?.nivelNombre?.toUpperCase() === 'NINGUNO'
                ) && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-primary">
                      Nivel
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                      value={selectedNivel}
                      onChange={(e) => {
                        setSelectedNivel(
                          e.target.value ? Number(e.target.value) : ''
                        );
                        setSelectedEspecialidad('');
                        setSelectedYear('');
                      }}
                      disabled={!selectedModalidad}
                    >
                      <option value="" disabled hidden>
                        Seleccionar nivel
                      </option>
                      {availableNiveles.map((n: any) => (
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
                !(
                  availableEspecialidades.length === 1 &&
                  !availableEspecialidades[0]?.especialidadId
                ) && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-primary">
                      Especialidad
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                      value={selectedEspecialidad}
                      onChange={(e) => {
                        setSelectedEspecialidad(
                          e.target.value ? Number(e.target.value) : ''
                        );
                        setSelectedYear('');
                      }}
                      disabled={!selectedNivel}
                    >
                      <option value="" disabled hidden>
                        Seleccionar especialidad
                      </option>
                      {availableEspecialidades.map((e: any, idx: any) => (
                        <option
                          key={
                            e.especialidadId !== null
                              ? e.especialidadId
                              : `null-${idx}`
                          }
                          value={
                            e.especialidadId !== null
                              ? e.especialidadId.toString()
                              : ''
                          }
                        >
                          {e.especialidadNombre ?? 'General'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              {/* 6. Año */}
              {(selectedModalidad ||
                (selectedFuente && availableModalidades.length === 0)) &&
                showYearFilter &&
                availableYears.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-primary">
                      Año
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      <option value="">Seleccionar Año</option>
                      {availableYears.map(
                        (y: { year: string; count?: number }) => (
                          <option key={y.year} value={y.year}>
                            {y.year}{' '}
                            {y.count !== undefined ? `(${y.count})` : ''}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}
            </div>

            {/* New Row for Year Management */}
            {(selectedModalidad ||
              (selectedFuente && availableModalidades.length === 0)) &&
              showYearFilter && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 mt-6 border-t border-gray-100 pt-6">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                      Gestión de Años
                    </label>
                    <input
                      type="text"
                      placeholder="Nuevo año (ej: 2025)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      value={newYearInput}
                      onChange={(e) => setNewYearInput(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddYear}
                      className="flex-1 sm:flex-none bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all text-sm font-bold shadow-md whitespace-nowrap"
                    >
                      Agregar
                    </button>
                    <button
                      onClick={handleDeleteYear}
                      disabled={!selectedYear}
                      className={`flex-1 sm:flex-none px-6 py-2 rounded-lg transition-all text-sm font-bold shadow-md whitespace-nowrap ${
                        !selectedYear
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}

            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <button
                onClick={handleAddNew}
                className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-primary transition-colors text-sm font-medium shadow-md"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Añadir preguntas
              </button>

              <button
                onClick={() => setIsAiModalOpen(true)}
                className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-primary transition-colors text-sm font-medium shadow-md"
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                Añadir preguntas con IA
              </button>

              <button
                onClick={handleGenerateAnswersAI}
                className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-primary transition-colors text-sm font-medium shadow-md"
                disabled={isGeneratingAi || viewMode === 'list'}
                title={
                  viewMode === 'list'
                    ? 'Entra a modo crear/editar primero'
                    : 'Generar respuestas para el enunciado actual'
                }
              >
                {isGeneratingAi ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : (
                  <SparklesIcon className="w-4 h-4 mr-2" />
                )}
                Añadir respuestas con IA
              </button>

              <button
                disabled={!selectedTipo || itemsLoading}
                onClick={() => {
                  if (filteredItems.length === 0) {
                    alert('No se encontraron preguntas para esta categoría.');
                  } else {
                    setShowResults(true);
                  }
                }}
                className="bg-white text-primary border border-primary px-4 py-2 rounded-lg flex items-center hover:bg-blue-50 transition-colors text-sm font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {itemsLoading ? (
                  <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : (
                  <EyeIcon className="w-4 h-4 mr-2" />
                )}
                Visualizar preguntas
              </button>
            </div>

            {/* Action Buttons for Filters */}
          </div>
        )}

        {/* SECCIÓN 3: INSTRUCCIONES (Show only if !showResults) */}
        {!showResults && (
          <div className="bg-white rounded-lg shadow-sm border border-primary p-6 relative">
            <h3 className="text-primary font-bold text-lg mb-4">
              Instrucciones
            </h3>
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
                seleccionas una sección fuente que contenga &quot;MINEDU&quot;
                en su nombre
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
          <div className="space-y-6">
            {/* RESULT HEADER & CRITERIA */}
            <div className="w-full bg-primary py-4 px-6 rounded-t-lg shadow-sm flex items-center gap-4">
              <button
                onClick={() => setShowResults(false)}
                className="text-white hover:text-gray-200 font-medium flex items-center gap-1"
              >
                <ChevronLeftIcon className="w-5 h-5" /> Volver
              </button>
              <h1 className="text-xl font-bold text-white flex-1 text-center">
                Ver preguntas
              </h1>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-b-lg mb-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col items-center md:items-start gap-4 flex-1">
                  {/* Etiqueta y Contador Principal */}
                  <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                    <span className="font-bold text-gray-800 text-base md:text-lg">
                      Criterios de selección
                    </span>
                    <span className="bg-gray-900 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-sm uppercase tracking-wider">
                      {totalQuestionCount}{' '}
                      {totalQuestionCount === 1 ? 'Pregunta' : 'Preguntas'}
                    </span>
                  </div>

                  {/* Listado de Pills (Categorías) */}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {/* Display Selected Criteria as Pills */}
                    {groupedData.find(
                      (t) => t.tipoExamenId === selectedTipo
                    ) && (
                      <span className="bg-blue-50 text-primary text-xs px-3 py-1.5 rounded-lg font-bold border border-blue-100 shadow-sm">
                        {
                          groupedData.find(
                            (t) => t.tipoExamenId === selectedTipo
                          )?.tipoExamenNombre
                        }
                      </span>
                    )}
                    {selectedModalidadNombre && (
                      <span className="bg-purple-50 text-purple-700 text-xs px-3 py-1.5 rounded-lg font-bold border border-purple-100 shadow-sm">
                        {selectedModalidadNombre}
                      </span>
                    )}
                    {selectedNivelNombre && (
                      <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-lg font-bold border border-indigo-100 shadow-sm">
                        {selectedNivelNombre}
                      </span>
                    )}
                    {selectedEspecialidadNombre && (
                      <span className="bg-pink-50 text-pink-700 text-xs px-3 py-1.5 rounded-lg font-bold border border-pink-100 shadow-sm">
                        {selectedEspecialidadNombre}
                      </span>
                    )}
                    {selectedYear && (
                      <span className="bg-green-50 text-green-700 text-xs px-3 py-1.5 rounded-lg font-bold border border-green-100 shadow-sm">
                        {selectedYear}
                      </span>
                    )}
                  </div>
                </div>

                {/* Buscador por Número */}
                <div className="w-full md:w-auto flex items-center gap-2">
                  <div className="relative flex-1 md:w-40">
                    <input
                      type="number"
                      placeholder="Ir a #..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if (val) {
                            // First try to find a sub-question with that visual number
                            const sub = currentItems.flatMap(i => i.subsWithIdx || []).find(s => s.visualNumero === Number(val));
                            if (sub) {
                              const el = document.getElementById(`subpregunta-row-${sub.examenId}-${sub.preguntaId}-${sub.numero}`);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                el.classList.add('ring-4', 'ring-indigo-300');
                                setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-300'), 2000);
                              }
                            } else {
                              // Try to find a main question
                              const main = currentItems.find(i => i.visualNumero === Number(val));
                              if (main) {
                                const el = document.getElementById(`pregunta-row-${main.id}`);
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  el.classList.add('ring-4', 'ring-blue-300');
                                  setTimeout(() => el.classList.remove('ring-4', 'ring-blue-300'), 2000);
                                }
                              }
                            }
                          }
                        }
                      }}
                    />
                    <div className="absolute right-3 top-2.5 text-gray-400">
                      <SparklesIcon className="w-4 h-4" />
                    </div>
                  </div>
                  <button
                    onClick={handleAddNew}
                    className="w-full md:w-auto bg-primary text-white px-8 py-3 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <PlusIcon className="w-5 h-5 pointer-events-none" />
                    Añadir preguntas
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6 -mx-6">
              {currentItems.map((item) => {
                const isParent = isGroupedType(item.tipoPreguntaId);
                const subCount = subCountsMap[item.id] || 0;
                const isLoadingSubs = loadingSubIds.has(item.id);
                const subs = item.subsWithIdx || [];

                return (
                  <div
                    key={item.id}
                    id={`pregunta-row-${item.id}`}
                    className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden hover:shadow-lg transition-all"
                  >
                    {/* --- TOP BAR (INDICADORES Y ACCIONES) --- */}
                    <div className="bg-gray-50 px-6 py-3 border-b flex justify-between items-center flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center font-bold text-sm relative"
                          title={
                            !isParent && (item as any).visualNumero !== item.numero
                              ? `Número real: ${item.numero}`
                              : undefined
                          }
                        >
                          {isParent ? (
                            <DocumentTextIcon className="w-5 h-5 text-indigo-500" />
                          ) : (
                            (item as any).visualNumero ?? item.numero ?? item.displayIndex ?? '-'
                          )}
                          {!isParent && (item as any).visualNumero !== item.numero && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border border-white" title={`Número real: ${item.numero}`} />
                          )}
                        </div>

                        <span className="text-sm font-bold text-gray-900">
                          {isParent ? 'Pregunta Grupal' : 'Pregunta Individual'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        {item.clasificacionNombre && (
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded-md ${
                              item.clasificacionNombre === 'CL'
                                ? 'bg-blue-100 text-blue-700'
                                : item.clasificacionNombre === 'RL'
                                ? 'bg-purple-100 text-purple-700'
                                : item.clasificacionNombre === 'CCP'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.clasificacionNombre}
                          </span>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-primary hover:text-white hover:bg-primary border border-primary bg-white px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <PencilIcon className="w-3 h-3" /> Editar
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingIds.has(item.id)}
                            className="text-red-600 hover:text-white hover:bg-red-600 border border-red-200 bg-red-50 px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                          >
                            {deletingIds.has(item.id) ? (
                              <span className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <TrashIcon className="w-3 h-3" />
                            )}
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* --- CONTENIDO PRINCIPAL --- */}
                    <div className="p-6">
                      {/* Enunciado */}
                      <div className="mb-6 prose max-w-none text-gray-800 bg-blue-50/30 p-4 rounded-lg border border-blue-100">
                        <div className="text-xs font-bold text-blue-800 uppercase mb-2 tracking-wider">
                          {isParent ? 'Lectura / Contexto' : 'Enunciado'}
                        </div>
                        {item.enunciados && item.enunciados.length > 0 ? (
                          item.enunciados.map((e: any) => (
                            <HtmlMathRenderer key={e.id} html={e.contenido} />
                          ))
                        ) : (
                          <HtmlMathRenderer html={item.enunciado || ''} />
                        )}

                        {item.imagen && (
                          <div className="mt-4">
                            <img
                              src={item.imagen}
                              alt="Imagen pregunta"
                              className="max-h-60 rounded border shadow-sm"
                            />
                          </div>
                        )}
                      </div>

                      {/* --- CASO 1: PREGUNTA AGRUPADA (Sub-Preguntas mostradas inmediatamente) --- */}
                      {isParent && (
                        <div>
                          <div className="flex items-center gap-2 mb-4 p-3 bg-indigo-50 text-indigo-800 rounded-lg border border-indigo-200 font-bold text-sm uppercase tracking-wide">
                            <DocumentTextIcon className="w-5 h-5" />
                            <span>Sub-Preguntas ({subCount})</span>
                          </div>

                          <div className="space-y-4 pl-4 border-l-2 border-indigo-200">
                            {isLoadingSubs ? (
                              <div className="flex items-center justify-center p-8 text-indigo-500">
                                <svg
                                  className="animate-spin h-6 w-6 mr-3"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                <span className="font-medium">
                                  Cargando sub-preguntas...
                                </span>
                              </div>
                            ) : subs.length === 0 ? (
                              <div className="text-center p-6 text-gray-400 italic">
                                No se encontraron sub-preguntas.
                              </div>
                            ) : (
                              subs.map((sub) => (
                                <div
                                  key={`${sub.examenId}-${sub.preguntaId}-${sub.numero}`}
                                  id={`subpregunta-row-${sub.examenId}-${sub.preguntaId}-${sub.numero}`}
                                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                                >
                                  {/* Header mini */}
                                  <div className="flex items-center gap-2 mb-3">
                                    <span 
                                      className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs relative"
                                      title={sub.visualNumero !== sub.numero ? `Número real: ${sub.numero}` : undefined}
                                    >
                                      {sub.visualNumero ?? sub.numero ?? sub.displayIndex}
                                      {sub.visualNumero !== sub.numero && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white" title={`Número real: ${sub.numero}`} />
                                      )}
                                    </span>
                                    <span className="text-xs font-bold text-gray-500 uppercase">
                                      Sub-Pregunta {sub.visualNumero ?? sub.numero ?? sub.displayIndex}
                                    </span>

                                    <div className="ml-auto flex gap-2">
                                      <button
                                        onClick={() =>
                                          handleDeleteSub(
                                            sub.examenId,
                                            sub.preguntaId,
                                            sub.numero
                                          )
                                        }
                                        disabled={deletingIds.has(
                                          `${sub.examenId}-${sub.preguntaId}-${sub.numero}` as any
                                        )}
                                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Enunciado */}
                                  <div className="mb-4 text-sm text-gray-800 prose max-w-none">
                                    {sub.enunciados &&
                                    sub.enunciados.length > 0 ? (
                                      sub.enunciados.map((e: any) => (
                                        <HtmlMathRenderer
                                          key={e.id}
                                          html={e.contenido}
                                        />
                                      ))
                                    ) : (
                                      <HtmlMathRenderer
                                        html={sub.enunciado || ''}
                                      />
                                    )}
                                  </div>

                                  {/* Imagen */}
                                  {sub.imagen && (
                                    <div className="mb-3">
                                      <img
                                        src={sub.imagen}
                                        alt="Pregunta"
                                        className="max-w-full h-auto rounded border border-gray-200 max-h-48"
                                      />
                                    </div>
                                  )}

                                  {/* Alternativas - mismo grid que individual pero un poco más chico */}
                                  <div className="grid grid-cols-1 gap-2 mb-4">
                                    {sub.alternativas &&
                                    sub.alternativas.length > 0
                                      ? sub.alternativas.map(
                                          (alt: any, altIdx: number) => {
                                            const respString = (
                                              sub.respuestaCorrecta ??
                                              sub.respuesta
                                            )?.toString();
                                            const isCorrect =
                                              alt.id.toString() === respString;
                                            return (
                                              <div
                                                key={alt.id}
                                                className={`p-3 rounded-lg border transition-all ${
                                                  isCorrect
                                                    ? 'bg-green-50 border-green-500 shadow-sm'
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                                }`}
                                              >
                                                <HtmlMathRenderer
                                                  html={alt.contenido || ''}
                                                  alternativeLabel={String.fromCharCode(
                                                    65 + altIdx
                                                  )}
                                                  className={`text-sm ${
                                                    isCorrect
                                                      ? 'text-green-800 font-medium'
                                                      : 'text-gray-800'
                                                  }`}
                                                />
                                              </div>
                                            );
                                          }
                                        )
                                      : ['A', 'B', 'C', 'D'].map((opt, i) => {
                                          const altText =
                                            opt === 'A'
                                              ? sub.alternativaA
                                              : opt === 'B'
                                              ? sub.alternativaB
                                              : opt === 'C'
                                              ? sub.alternativaC
                                              : sub.alternativaD;
                                          const respString =
                                            sub.respuestaCorrecta?.toString();
                                          const isCorrect =
                                            sub.respuestaCorrecta === opt ||
                                            respString === (i + 1).toString();

                                          // Only render if there's alternative text, since new format may omit it
                                          if (
                                            !altText &&
                                            !isCorrect &&
                                            sub.enunciados
                                          )
                                            return null;

                                          return (
                                            <div
                                              key={opt}
                                              className={`p-3 rounded-lg border transition-all ${
                                                isCorrect
                                                  ? 'bg-green-50 border-green-500 shadow-sm'
                                                  : 'bg-white border-gray-200 hover:border-gray-300'
                                              }`}
                                            >
                                              <div className="flex items-start gap-2">
                                                <span
                                                  className={`font-bold text-sm ${
                                                    isCorrect
                                                      ? 'text-green-700'
                                                      : 'text-gray-500'
                                                  }`}
                                                >
                                                  {opt})
                                                </span>
                                                <span className="text-sm">
                                                  <HtmlMathRenderer
                                                    html={altText || ''}
                                                    alternativeLabel={opt}
                                                  />
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                  </div>

                                  {/* Sustento */}
                                  <div className="text-xs text-gray-500 border-t pt-3 border-gray-100">
                                    <span className="font-bold text-gray-700 block mb-1 uppercase tracking-tight">
                                      Sustento:
                                    </span>
                                    <div className="text-gray-800 mt-2">
                                      {sub.sustento ? (
                                        <HtmlMathRenderer html={sub.sustento} />
                                      ) : (
                                        'Sin sustento disponible'
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* --- CASO 2: PREGUNTA INDIVIDUAL --- */}
                      {!isParent && (
                        <div>
                          <div className="grid grid-cols-1 gap-3 mb-4">
                            {item.alternativas && item.alternativas.length > 0
                              ? item.alternativas.map(
                                  (alt: any, altIdx: number) => {
                                    // Use the raw ID for comparison, same as sub-questions
                                    const isCorrect =
                                      alt.id.toString() ===
                                      (
                                        item.respuestaCorrecta ?? item.respuesta
                                      )?.toString();
                                    return (
                                      <div
                                        key={alt.id}
                                        className={`p-4 rounded-lg border transition-all ${
                                          isCorrect
                                            ? 'bg-green-50 border-green-500 shadow-sm'
                                            : 'bg-white border-gray-200 hover:border-gray-300'
                                        }`}
                                      >
                                        <HtmlMathRenderer
                                          html={alt.contenido || ''}
                                          alternativeLabel={String.fromCharCode(
                                            65 + altIdx
                                          )}
                                          className={`text-sm ${
                                            isCorrect
                                              ? 'text-green-800 font-medium'
                                              : 'text-gray-800'
                                          }`}
                                        />
                                      </div>
                                    );
                                  }
                                )
                              : ['A', 'B', 'C', 'D'].map((opt, i) => {
                                  const altText =
                                    opt === 'A'
                                      ? item.alternativaA
                                      : opt === 'B'
                                      ? item.alternativaB
                                      : opt === 'C'
                                      ? item.alternativaC
                                      : item.alternativaD;
                                  const respString = item.respuesta?.toString();
                                  const isCorrect =
                                    item.respuesta === opt ||
                                    respString === (i + 1).toString();

                                  // Skip empty alternatives to prevent rendering empty boxes if API didn't provide them
                                  if (!altText && !isCorrect && item.enunciados)
                                    return null;

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
                                            isCorrect
                                              ? 'text-green-700'
                                              : 'text-gray-500'
                                          }`}
                                        >
                                          {opt})
                                        </span>
                                        <HtmlMathRenderer
                                          html={altText || ''}
                                          alternativeLabel={opt}
                                          className="text-gray-800"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                          </div>

                          <div className="text-sm text-gray-500 mt-4 border-t pt-4 border-gray-100">
                            <span className="font-bold text-gray-700 block mb-1">
                              Sustento:
                            </span>
                            <div className="text-gray-800 mt-2">
                              {item.sustento ? (
                                <HtmlMathRenderer html={item.sustento} />
                              ) : (
                                'Sin sustento disponible'
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* AI MODAL */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4 text-primary">
              Generar Pregunta con IA
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Ingresa el tema o contexto sobre el cual deseas generar una
              pregunta.
            </p>
            <textarea
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              rows={4}
              placeholder="Ej: Historia del Perú - Guerra con Chile, o Principios de la educación inclusiva..."
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-blue-50"
                disabled={isGeneratingAi}
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateQuestionAI}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary flex items-center gap-2"
                disabled={isGeneratingAi}
              >
                {isGeneratingAi && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                Generar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COLLISION MODAL */}
      {isCollisionModalOpen && collisionTargetConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <DocumentTextIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 tracking-tight">
                Número Duplicado
              </h3>
              <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                El número de pregunta{' '}
                <span className="font-bold text-gray-900 mx-1">
                  {collisionTargetConfig.numStr}
                </span>{' '}
                ya existe en este examen. Por favor, selecciona un número
                diferente para poder guardar la pregunta.
              </p>
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => {
                    setIsCollisionModalOpen(false);
                    handleSubmit(undefined, collisionTargetConfig.stayInCreateMode, true);
                  }}
                  className="px-5 py-2.5 w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all flex justify-center items-center shadow-md font-bold uppercase tracking-tight text-xs"
                >
                  Permitir Duplicado
                </button>
                <button
                  onClick={() => setIsCollisionModalOpen(false)}
                  className="px-5 py-2.5 w-full bg-gray-100 text-gray-400 font-bold uppercase tracking-tight text-xs rounded-lg hover:bg-gray-200 transition-all flex justify-center items-center"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Recursos;
