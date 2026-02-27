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
} from '@heroicons/react/outline';
import dynamic from 'next/dynamic';

import PreguntaComunForm from '../../../components/admin/PreguntaComunForm';
import AdminLayout from '../../../components/AdminLayout';
import HtmlMathRenderer from '../../../components/common/HtmlMathRenderer';
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
import 'react-quill/dist/quill.snow.css';
import 'katex/dist/katex.min.css';
import { ADMIN_CATALOG } from '../../../data/adminCatalog';

// Dynamic import for ReactQuill
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

// Dynamic import for TiptapEditor (Math Editor)
const TiptapEditor = dynamic(
  () => import('../../../components/editor/TiptapEditor'),
  { ssr: false }
);

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
    let combined = JSON.parse(JSON.stringify(rawGroupedData)) as ExamenGrouped[];

    // 2. Normalizamos la lista de exámenes del usuario (puede venir como array o como objeto con propiedad 'examenes')
    const userExamsList = Array.isArray(loginExamenes) ? loginExamenes : ((loginExamenes as any)?.examenes || []);

    // 3. Fusionamos con la información de userExamsList para asegurar que no falte nada (como "Directivos")
    if (userExamsList && userExamsList.length > 0) {
      userExamsList.forEach((le: any) => {
        const tId = Number(le.tipoExamenId);
        if (!tId) return;

        let tipo = combined.find(t => t.tipoExamenId === tId);
        if (!tipo) {
          tipo = {
            tipoExamenId: tId,
            tipoExamenNombre: le.tipoExamenNombre || 'Sin nombre',
            fuentes: []
          };
          combined.push(tipo);
        }

        const fId = Number(le.fuenteId);
        let fuente = tipo.fuentes.find(f => f.fuenteId === fId);
        if (!fuente) {
          fuente = {
            fuenteId: fId,
            fuenteNombre: le.fuenteNombre || 'Sin nombre',
            modalidades: []
          };
          tipo.fuentes.push(fuente);
        }

        const mId = Number(le.modalidadId);
        let mod = fuente.modalidades.find(m => m.modalidadId === mId);
        if (!mod) {
          mod = {
            modalidadId: mId,
            modalidadNombre: le.modalidadNombre || 'Sin nombre',
            niveles: []
          };
          fuente.modalidades.push(mod);
        }

        const nId = Number(le.nivelId);
        let niv = mod.niveles.find(n => n.nivelId === nId);
        if (!niv) {
          niv = {
            nivelId: nId,
            nivelNombre: le.nivelNombre || 'Sin nombre',
            especialidades: []
          };
          mod.niveles.push(niv);
        }

        const eId = (le.especialidadId === null || le.especialidadId === undefined) ? null : Number(le.especialidadId);
        const hasEsp = niv.especialidades.some(e => 
            (e.especialidadId === eId) || (eId === null && e.especialidadId === null)
        );
        if (!hasEsp) {
          niv.especialidades.push({
            especialidadId: eId,
            especialidadNombre: le.especialidadNombre || 'General'
          });
        }
      });
    }

    // 4. Si el usuario es ADMIN, mostramos TODO el catálogo propocionado (ADMIN_CATALOG)
    if (userRole === 'Admin') return ADMIN_CATALOG;

    // 5. Si NO es Admin, filtramos para que solo vea lo que tiene asignado estrictamente (usa rawGroupedData como base)
    return combined.filter(tipo => 
      userExamsList.some((le: any) => le.tipoExamenId === tipo.tipoExamenId)
    ).map(tipo => ({
      ...tipo,
      fuentes: tipo.fuentes.filter(f => 
        userExamsList.some((le: any) => le.tipoExamenId === tipo.tipoExamenId && le.fuenteId === f.fuenteId)
      ).map(f => ({
        ...f,
        modalidades: f.modalidades.filter(m => 
           userExamsList.some((le: any) => le.tipoExamenId === tipo.tipoExamenId && le.fuenteId === f.fuenteId && le.modalidadId === m.modalidadId)
        ).map(m => ({
          ...m,
          niveles: m.niveles.filter(n => 
            userExamsList.some((le: any) => le.tipoExamenId === tipo.tipoExamenId && le.fuenteId === f.fuenteId && le.modalidadId === m.modalidadId && le.nivelId === n.nivelId)
          ).map(n => ({
            ...n,
            especialidades: n.especialidades.filter(e => 
              userExamsList.some((le: any) => le.tipoExamenId === tipo.tipoExamenId && le.fuenteId === f.fuenteId && le.modalidadId === m.modalidadId && le.nivelId === n.nivelId && (e.especialidadId === null ? le.especialidadId === null : le.especialidadId === e.especialidadId))
            )
          }))
        }))
      }))
    }));
  }, [rawGroupedData, loginExamenes, userRole]);

  const [allExams, setAllExams] = useState<Examen[]>([]);
  const [tipoPreguntas, setTipoPreguntas] = useState<TipoPregunta[]>([]);
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const [editingId, setEditingId] = useState<number | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [showResults, setShowResults] = useState(false); // New state for toggling views

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
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

  // Helper to serialize blocks to HTML
  const serializeJustification = () => {
    return justificationBlocks
      .map((b) => {
        if (b.type === 'image')
          return `<div data-block-type="image"><img src="${b.content}" /></div>`;
        return `<div data-block-type="text">${b.content}</div>`;
      })
      .join('');
  };

  // --- UTILS ---
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
        return 'CONOCIMIENTOS GENERALES';
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
    const parentItems = items.filter((q) => q.tipoPreguntaId === 2);
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
    return (
      groupedData.find((t) => t.tipoExamenId === Number(selectedTipo))
        ?.fuentes || []
    );
  }, [groupedData, selectedTipo]);

  const availableModalidades = useMemo(() => {
    if (!selectedFuente) return [];
    const mods = availableFuentes.find((f: any) => f.fuenteId === Number(selectedFuente))?.modalidades || [];
    return [...mods];
  }, [availableFuentes, selectedFuente]);

  const availableNiveles = useMemo(() => {
    if (!selectedModalidad) return [];
    return availableModalidades.find((m: any) => m.modalidadId === Number(selectedModalidad))?.niveles || [];
  }, [availableModalidades, selectedModalidad]);

  const availableEspecialidades = useMemo(() => {
    if (!selectedNivel) return [];
    return availableNiveles.find((n: any) => n.nivelId === Number(selectedNivel))?.especialidades || [];
  }, [availableNiveles, selectedNivel]);

  // Auto-select specialty if only one is available and it's null/empty (hidden)
  useEffect(() => {
    const firstEsp = availableEspecialidades[0];
    if (availableEspecialidades.length === 1 && (!firstEsp?.especialidadId) && selectedEspecialidad === '') {
      setSelectedEspecialidad(firstEsp?.especialidadId === null ? 0 : (firstEsp?.especialidadId ?? ''));
    }
  }, [availableEspecialidades, selectedEspecialidad]);

  const availableYears = useMemo(() => {
    if (!selectedTipo || !selectedFuente) return [];

    // Prioridad 1: Si es Admin, usamos la jerarquía de ADMIN_CATALOG
    if (userRole === 'Admin') {
        const tipo = ADMIN_CATALOG.find(t => t.tipoExamenId === Number(selectedTipo));
        const fuente = tipo?.fuentes.find(f => f.fuenteId === Number(selectedFuente));
        const modalidad = fuente?.modalidades.find(m => m.modalidadId === Number(selectedModalidad));
        const nivel = modalidad?.niveles.find(n => n.nivelId === Number(selectedNivel));
        const especialidad = nivel?.especialidades.find(e => 
            (selectedEspecialidad === '') 
                ? (e.especialidadId === null || e.especialidadId === 0)
                : e.especialidadId === Number(selectedEspecialidad)
        );

        if (especialidad?.years) {
            return especialidad.years.map(y => ({ year: y.year }));
        }
        
        // Fallback for NINGUNO level if no specialty selected
        if (!especialidad && nivel && !selectedEspecialidad) {
            const defaultEsp = nivel.especialidades[0];
            if (defaultEsp?.years) return defaultEsp.years.map(y => ({ year: y.year }));
        }
    }

    // Prioridad 2: Lógica actual para usuarios no-admin o fallback
    const effEspecialidadId = selectedEspecialidad ? Number(selectedEspecialidad) : 0;
    const effNivelId = selectedNivel ? Number(selectedNivel) : 0;
    const effModalidadId = selectedModalidad ? Number(selectedModalidad) : 0;

    const filteredFromCatalog = allExams.filter(e => 
      e.tipoExamenId === Number(selectedTipo) &&
      e.fuenteId === Number(selectedFuente) &&
      (effModalidadId === 0 ? (!e.modalidadId || e.modalidadId === 0) : e.modalidadId === effModalidadId) &&
      (effNivelId === 0 ? (!e.nivelId || e.nivelId === 0) : e.nivelId === effNivelId) &&
      (effEspecialidadId === 0 ? (!e.especialidadId || e.especialidadId === 0) : e.especialidadId === effEspecialidadId)
    ).flatMap(e => (e as any).years ? (e as any).years.map((y: any) => y.year) : [e.year]);

    const userExamsList = Array.isArray(loginExamenes) ? loginExamenes : ((loginExamenes as any)?.examenes || []);
    const filteredFromUser = userExamsList.filter((le: any) => 
      Number(le.tipoExamenId) === Number(selectedTipo) &&
      Number(le.fuenteId) === Number(selectedFuente) &&
      (effModalidadId === 0 || Number(le.modalidadId) === effModalidadId) &&
      (effNivelId === 0 || (le.nivelId !== null && Number(le.nivelId) === effNivelId)) &&
      (effEspecialidadId === 0 || (le.especialidadId !== null && Number(le.especialidadId) === effEspecialidadId))
    ).flatMap((le: any) => le.years?.map((y: any) => y.year) || (le.year !== undefined ? [le.year] : []));

    const allYears = Array.from(new Set([...filteredFromCatalog, ...filteredFromUser]))
      .filter(y => y !== null && y !== undefined && y !== '' && y !== 0 && y !== '0');

    return allYears.sort((a, b) => Number(b) - Number(a)).map(y => ({ year: y.toString() }));
  }, [selectedTipo, selectedFuente, selectedModalidad, selectedNivel, selectedEspecialidad, allExams, loginExamenes, userRole]);

  // --- CONTINUOUS INDEXING LOGIC ---
  const itemsWithIndices = useMemo(() => {
    let globalCounter = 0;
    const sortedItems = [...filteredItems].sort((a, b) => {
      const numA = a.numero && a.numero > 0 ? a.numero : Infinity;
      const numB = b.numero && b.numero > 0 ? b.numero : Infinity;
      return numA - numB || a.id - b.id;
    });
    
    return sortedItems.map(item => {
      const isParent = item.tipoPreguntaId === 2;
      let mainIdx = null;
      
      if (!isParent) {
        globalCounter++;
        mainIdx = globalCounter;
      }
      
      const subPreguntas = item.subPreguntas || subQuestionsMap[item.id] || [];
      // Sort subs by order (numero) then by id
      const sortedSubs = [...subPreguntas].sort((a, b) => (a.numero || 0) - (b.numero || 0) || a.id - b.id);
      
      const subsWithIdx = sortedSubs.map(s => {
        globalCounter++;
        return { ...s, displayIndex: globalCounter };
      });
      
      return { ...item, displayIndex: mainIdx, subsWithIdx };
    });
  }, [filteredItems, subQuestionsMap]);

  const currentItems = itemsWithIndices;

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

    // If it's a grouped question, we might need to fetch sub-questions if they aren't loaded
    if (item.tipoPreguntaId === 2) {
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

    setNewItem({
      enunciado: item.enunciados
        ? item.enunciados.map((e: any) => e.contenido).join('')
        : item.enunciado || '',
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
    const blocks: JustificationBlock[] = [];
    if (item.justificaciones && item.justificaciones.length > 0) {
      item.justificaciones.forEach((j: any) => {
        blocks.push({
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
              const img = c.querySelector('img');
              blocks.push({
                id: Math.random().toString(),
                type: 'image',
                content: img?.src || '',
              });
            } else {
              blocks.push({
                id: Math.random().toString(),
                type: 'text',
                content: c.innerHTML,
              });
            }
          });
        } else {
          blocks.push({ id: '1', type: 'text', content: item.sustento });
        }
      } else {
        blocks.push({ id: '1', type: 'text', content: item.sustento });
      }
    }
    setJustificationBlocks(blocks);

    setViewMode('edit');
  };

  const resetForm = () => {
    setEditingId(null);
    setJustificationBlocks([]);
    setImageFile(null);
    setNumeroPregunta('');
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
        setAlternatives(prev => [
            ...prev,
            {
                id: '4',
                contenido: generated.alternativaD!,
                esCorrecta: generated.respuesta === 'D',
            }
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
        setAlternatives(prev => [
            ...prev,
            {
                id: '4',
                contenido: generated.alternativaD!,
                esCorrecta: generated.respuesta === 'D',
            }
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
    if (
      !selectedTipo ||
      !selectedFuente ||
      !selectedModalidad ||
      !selectedNivel ||
      !selectedEspecialidad
    ) {
      alert(
        'Por favor selecciona todos los filtros (Tipo, Fuente, Modalidad, Nivel, Especialidad) antes de añadir un año.'
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
      // We need to construct the exam object.
      await examenService.create({
        year,
        tipoExamenId: Number(selectedTipo),
        fuenteId: Number(selectedFuente),
        modalidadId: Number(selectedModalidad),
        nivelId: Number(selectedNivel),
        especialidadId: Number(selectedEspecialidad),
        nombre: `${year} - ${selectedEspecialidad}`, // Optional name
      });
      alert('Año añadido con éxito.');
      setNewYearInput(''); // Clear input
      await fetchData(); // Reload filters
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
      // Determine effective IDs (same logic as resolveCurrentExamenId)
      const effModalidadId = selectedModalidad ? Number(selectedModalidad) : 0;
      const effNivelId = selectedNivel ? Number(selectedNivel) : 0;
      let effEspecialidadId = 0;
      if (selectedEspecialidad) {
        effEspecialidadId = Number(selectedEspecialidad);
      } else if (
        availableEspecialidades.length === 1 &&
        (!availableEspecialidades[0]?.especialidadId ||
          availableEspecialidades[0].especialidadId === 0)
      ) {
        effEspecialidadId = 0;
      }

      const allExams = await examenService.getAll();
      const targetExam = allExams.find(
        (e: any) =>
          e.year === selectedYear &&
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
      );

      if (!targetExam) {
        alert(
          'No se encontró el examen correspondiente para eliminar. (Asegúrate de que el endpoint getAll esté soportado)'
        );
        return;
      }

      await examenService.delete(targetExam.id);
      alert('Año eliminado correctamente.');
      setSelectedYear('');
      await fetchData();
    } catch (e: any) {
      alert(`Error eliminando: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- DATA FETCHING ---
  const fetchData = async () => {
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
      if (rawGroupedData.length === 0) {
          try {
            const grouped = await examenService.getGrouped();
            setRawGroupedData(grouped);
          } catch (err: any) {
             console.error('Examen Service Error:', err);
          }
      }

      if (allExams.length === 0) {
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
      const hasFilter = selectedTipo || selectedFuente || selectedModalidad || selectedNivel || selectedEspecialidad || selectedYear;
      
      try {
        setItemsLoading(true);
        let data: Pregunta[] = [];
        
        if (hasFilter) {
          const filterData = {
            tipoExamenId: selectedTipo ? Number(selectedTipo) : undefined,
            fuenteId: selectedFuente ? Number(selectedFuente) : undefined,
            modalidadId: selectedModalidad ? Number(selectedModalidad) : undefined,
            nivelId: selectedNivel ? Number(selectedNivel) : undefined,
            especialidadId: selectedEspecialidad ? Number(selectedEspecialidad) : undefined,
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
    // Minimum required: tipo, fuente, and year
    if (!selectedTipo || !selectedFuente || !selectedYear) {
      return null;
    }

    // Determine the effective especialidadId:
    // If user explicitly selected one, use it.
    // If there's only one specialty and it has no real ID (null/0), treat as 0.
    // Otherwise (specialties exist but none selected), we can't resolve.
    let effectiveEspecialidadId: number | null = null;
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
    const effectiveNivelId = selectedNivel
      ? Number(selectedNivel)
      : availableNiveles.length === 0
      ? 0
      : null;
    if (effectiveNivelId === null) return null; // niveles exist but none chosen

    // Determine effective modalidadId (0 if none available/needed)
    const effectiveModalidadId = selectedModalidad
      ? Number(selectedModalidad)
      : availableModalidades.length === 0
      ? 0
      : null;
    if (effectiveModalidadId === null) return null;

    try {
      const allExams = await examenService.getAll();
      const target = allExams.find(
        (e) =>
          e.tipoExamenId === Number(selectedTipo) &&
          e.fuenteId === Number(selectedFuente) &&
          (effectiveModalidadId === 0
            ? !e.modalidadId || e.modalidadId === 0
            : e.modalidadId === effectiveModalidadId) &&
          (effectiveNivelId === 0
            ? !e.nivelId || e.nivelId === 0
            : e.nivelId === effectiveNivelId) &&
          (effectiveEspecialidadId === 0
            ? !e.especialidadId || e.especialidadId === 0
            : e.especialidadId === effectiveEspecialidadId) &&
          e.year === selectedYear
      );
      return target ? target.id : null;
    } catch (error) {
      console.error('Error resolving examen ID', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar Tipo de Pregunta
    if (!newItem.tipoPreguntaId) {
      alert('El tipo de pregunta es obligatorio');
      return;
    }

    // Validar Número de Pregunta
    const numPreguntaParsed = parseInt(numeroPregunta, 10);
    if (
      !numeroPregunta.trim() ||
      isNaN(numPreguntaParsed) ||
      numPreguntaParsed <= 0
    ) {
      alert('El número de la pregunta es obligatorio y debe ser mayor a 0');
      return;
    }

    if (!newItem.enunciado.trim()) {
      // eslint-disable-next-line no-alert
      alert('El enunciado es obligatorio');
      return;
    }

    // Resolve Examen ID
    let targetExamenId = newItem.examenId;
    if (!editingId && (!targetExamenId || targetExamenId === 0)) {
      const resolvedId = await resolveCurrentExamenId();
      if (!resolvedId) {
        alert(
          'No se pudo determinar el examen al cual asociar esta pregunta. Asegúrate de tener todos los filtros (Año incluido) seleccionados.'
        );
        return;
      }
      targetExamenId = resolvedId;
    }

    try {
      let finalUrl = newItem.imagen;
      if (imageFile) {
        finalUrl = await uploadService.uploadImage(imageFile);
      }

      const correctAlt = alternatives.find((a) => a.esCorrecta);
      if (newItem.tipoPreguntaId === 1 && !correctAlt) {
        // Only validate for Individual questions for now
        alert('Debes marcar una alternativa como correcta.');
        return;
      }

      // Ensure we have up to 4 alternatives (A, B, C, D) but only those with content
      const safeAlts = alternatives.map(a => ({ ...a }));
      // The API expects exactly A, B, C, D fields. If less than 4, D will be empty.
      // However, the mapping below already handles indexing.
      // If we have > 4, the backend might only take the first 4.

      const mappedAlts = {
        alternativaA: safeAlts[0]?.contenido || '',
        alternativaB: safeAlts[1]?.contenido || '',
        alternativaC: safeAlts[2]?.contenido || '',
        alternativaD: safeAlts[3]?.contenido || '',
        respuesta:
          newItem.tipoPreguntaId === 1
            ? ['A', 'B', 'C', 'D'][safeAlts.findIndex((a) => a.esCorrecta)] ||
              ''
            : '',
      };

      const payload = {
        enunciado: newItem.enunciado,
        alternativaA: mappedAlts.alternativaA,
        alternativaB: mappedAlts.alternativaB,
        alternativaC: mappedAlts.alternativaC,
        alternativaD: mappedAlts.alternativaD,
        respuesta: mappedAlts.respuesta,
        sustento: serializeJustification(),
        examenId: targetExamenId,
        clasificacionId: Number(newItem.clasificacionId),
        imagen: finalUrl,
        tipoPreguntaId: Number(newItem.tipoPreguntaId),
      };

      if (editingId) {
        // UPDATE Logic (remains same? Or new endpoint?)
        // Assuming update endpoint is standard PUT /api/Preguntas/{id}
        const updated = await preguntaService.update(
          payload.examenId,
          editingId,
          payload
        );

        // Optimistic Update
        setItems((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        alert('Pregunta actualizada con éxito');
      } else {
        // POST /api/Preguntas — examenId va dentro del body
        const created = await preguntaService.create(
          payload as Omit<Pregunta, 'id'>
        );
        if (created) {
          setItems((prev) => [created, ...prev]);
          alert('Pregunta creada con éxito');
        }
      }

      // DO NOT reset filters, keep context
      // setViewMode('list'); // Maybe stay in create? User might want "Guardar y Añadir otra" handling
      // resetForm(); // We handle this based on which button was clicked effectively
      // But for this generic handler:
      setViewMode('list');
      resetForm();
    } catch (err) {
      console.error(err);
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
      <AdminLayout>
        <div className="space-y-6 pb-20">
          {' '}
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
          <div className="bg-white p-6 space-y-6 max-w-7xl mx-auto">
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

            {/* CONDITIONAL RENDER: INDIVIDUAL vs GROUP */}
            {newItem.tipoPreguntaId === 2 ? (
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
                onSuccess={() => {
                  fetchData();
                  setViewMode('list');
                }}
                onCancel={() => setViewMode('list')}
              />
            ) : (
              /* --- FORMULARIO INDIVIDUAL (Estándar) --- */
              <>
                {/* 3. FILA: NÚMERO Y TIPO DE PREGUNTA */}
                <div className="border border-[#4790FD] rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Número */}
                    <div className="w-full md:w-1/4">
                      <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                        Número de la pregunta{' '}
                        <span className="text-red-500">*</span>
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
                      />
                    </div>

                    {/* Clasificación */}
                    <div className="w-full md:w-3/4">
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
                          <option value={0}>
                            Seleccionar Clasificación...
                          </option>
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

                {/* 4. SECCIÓN ENUNCIADO (Estilo exacto a la imagen) */}
                <div className="border border-[#4790FD] rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-gray-700 font-medium text-sm">
                      Enunciado de la pregunta
                    </label>

                    {/* Botones de Acción */}
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          setNewItem({
                            ...newItem,
                            enunciado: newItem.enunciado || '<p> </p>',
                          })
                        }
                        className="flex items-center gap-2 text-[#4790FD] border border-[#4790FD] px-4 py-1.5 rounded hover:bg-blue-50 text-sm font-medium transition-colors"
                      >
                        <DocumentTextIcon className="w-4 h-4" /> Añadir Texto
                      </button>
                      <button className="flex items-center gap-2 text-gray-600 border border-gray-300 px-4 py-1.5 rounded hover:bg-gray-50 text-sm font-medium transition-colors">
                        <span className="font-bold text-lg leading-none">
                          +
                        </span>{' '}
                        Añadir Imagen
                      </button>
                    </div>
                  </div>

                  {/* Lógica de Visualización: Editor o Placeholder */}
                  {!newItem.enunciado || newItem.enunciado === '<p><br></p>' ? (
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
                    /* EDITOR DE ENUNCIADO */
                    <div className="quill-editor-container border border-gray-200 rounded-lg overflow-hidden">
                      <ReactQuill
                        theme="snow"
                        value={newItem.enunciado}
                        onChange={(val) =>
                          setNewItem({ ...newItem, enunciado: val })
                        }
                        modules={modules}
                        className="bg-white"
                        placeholder="Escribe el enunciado aquí..."
                      />
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
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={addJustificationText}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-sky-200 text-sky-600 rounded-lg hover:bg-sky-50 transition-colors text-sm font-medium"
                    >
                      <MenuAlt2Icon className="w-4 h-4" /> Añadir Texto
                    </button>
                    <button
                      type="button"
                      onClick={() => justificationFileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-sky-200 text-sky-600 rounded-lg hover:bg-sky-50 transition-colors text-sm font-medium"
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
                          className="absolute -right-2 -top-2 p-1 bg-red-100 text-red-500 rounded-full shadow-sm hover:bg-red-200 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
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
                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-lg z-20 flex justify-end gap-4 md:px-10">
                  <button
                    onClick={handleSubmit}
                    className="bg-[#4a90f9] text-white px-6 py-2 rounded shadow hover:bg-blue-600 font-medium transition-colors"
                  >
                    Guardar Pregunta
                  </button>
                  <button className="bg-white text-[#4a90f9] border border-[#4a90f9] px-6 py-2 rounded shadow hover:bg-blue-50 font-medium transition-colors">
                    Guardar y Añadir otra
                  </button>
                </div>
              </>
            )}
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
          <div className="flex flex-col gap-4 mb-6">
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
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                Sección Fuente <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-blue-100 disabled:cursor-not-allowed"
                value={selectedFuente}
                onChange={(e) => {
                  setSelectedFuente(e.target.value ? Number(e.target.value) : '');
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
                    : 'Primero selecciona el tipo de examen'}
                </option>
                {availableFuentes.map((f: any) => (
                  <option key={f.fuenteId} value={f.fuenteId}>
                    {f.fuenteNombre}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Modalidad */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                {isDirectivo ? 'Sección Directiva' : 'Modalidad'}
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-blue-100 disabled:cursor-not-allowed"
                value={selectedModalidad}
                onChange={(e) => {
                  setSelectedModalidad(e.target.value ? Number(e.target.value) : '');
                  setSelectedNivel('');
                  setSelectedEspecialidad('');
                  setSelectedYear('');
                }}
                disabled={!selectedFuente || availableModalidades.length === 0}
              >
                <option value="" disabled hidden>Seleccionar modalidad</option>
                {availableModalidades.map((m: any) => (
                  <option key={m.modalidadId} value={m.modalidadId}>
                    {m.modalidadNombre}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Nivel */}
            {availableNiveles.length > 0 && 
             !(availableNiveles.length === 1 && availableNiveles[0]?.nivelNombre?.toUpperCase() === 'NINGUNO') && (
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Nivel
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-blue-100 disabled:cursor-not-allowed"
                  value={selectedNivel}
                  onChange={(e) => {
                    setSelectedNivel(e.target.value ? Number(e.target.value) : '');
                    setSelectedEspecialidad('');
                    setSelectedYear('');
                  }}
                  disabled={!selectedModalidad}
                >
                  <option value="" disabled hidden>Seleccionar nivel</option>
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
             !(availableEspecialidades.length === 1 && (!availableEspecialidades[0]?.especialidadId)) && (
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Especialidad
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-blue-100 disabled:cursor-not-allowed"
                  value={selectedEspecialidad}
                  onChange={(e) => {
                    setSelectedEspecialidad(e.target.value ? Number(e.target.value) : '');
                    setSelectedYear('');
                  }}
                  disabled={!selectedNivel}
                >
                  <option value="" disabled hidden>Seleccionar especialidad</option>
                  {availableEspecialidades.map((e: any, idx: any) => (
                    <option key={e.especialidadId !== null ? e.especialidadId : `null-${idx}`} value={e.especialidadId !== null ? e.especialidadId.toString() : ''}>
                      {e.especialidadNombre ?? 'General'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 6. Año */}
            {selectedModalidad && (
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Año
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-blue-100 disabled:cursor-not-allowed"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">Seleccionar Año</option>
                  {availableYears.map((y: { year: string }) => (
                    <option key={y.year} value={y.year}>
                      {y.year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* New Row for Year Management */}
          {selectedModalidad && (
             <div className="flex items-end gap-2 mt-4">
                 <input 
                     type="text"
                     placeholder="Nuevo año (ej: 2025)"
                     className="w-full border border-primary rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                     value={newYearInput}
                     onChange={(e) => setNewYearInput(e.target.value)}
                 />
                 <button
                     onClick={handleAddYear}
                     className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary transition-colors text-sm font-medium shadow-md whitespace-nowrap"
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
                disabled={!selectedTipo || itemsLoading}
                onClick={() => {
                  if (filteredItems.length === 0) {
                    alert("No se encontraron preguntas para esta categoría.");
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

              {isDirectivo && (
                <>
                  <a
                    href="/admin/premium/secciones"
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-orange-600 transition-colors text-sm font-medium shadow-md"
                  >
                    <MenuAlt2Icon className="w-4 h-4 mr-2" />
                    Gestión de Secciones
                  </a>
                  <button
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-orange-600 transition-colors text-sm font-medium shadow-md"
                    onClick={() =>
                      alert('Módulo de gestión de exámenes en desarrollo')
                    }
                  >
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    Gestión de Exámenes
                  </button>
                </>
              )}
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
          <div>
            {/* RESULT HEADER & CRITERIA */}
            <div className="w-full bg-primary py-4 px-6 rounded-t-lg shadow-sm flex items-center gap-4">
                 <button onClick={() => setShowResults(false)} className="text-white hover:text-gray-200 font-medium flex items-center gap-1">
                    <ChevronLeftIcon className="w-5 h-5" /> Volver
                 </button>
                 <h1 className="text-xl font-bold text-white flex-1 text-center">Ver preguntas</h1>
            </div>
            
            <div className="bg-white border border-gray-200 p-4 rounded-b-lg mb-6 shadow-sm">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                     <div className="flex flex-wrap gap-2 items-center">
                         <span className="font-bold text-gray-700 mr-2">Criterios de selección</span>
                         <span className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm">
                             {filteredItems.length} {filteredItems.length === 1 ? 'Pregunta' : 'Preguntas'}
                         </span>
                         {/* Display Selected Criteria as Pills */}
                         {groupedData.find(t => t.tipoExamenId === selectedTipo) && (
                            <span className="bg-blue-100 text-primary text-xs px-3 py-1 rounded-full font-medium">
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
                        className="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary transition-colors flex items-center gap-2"
                     >
                        <PlusIcon className="w-5 h-5" />
                        Añadir preguntas
                     </button>
                 </div>
            </div>

            <div className="space-y-6">
                {currentItems.map((item) => {
                     const isParent = item.tipoPreguntaId === 2;
                     const subCount = subCountsMap[item.id] || 0;
                     const isLoadingSubs = loadingSubIds.has(item.id);
                     const subs = item.subsWithIdx || [];

                     return (
                      <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        {/* --- TOP BAR (INDICADORES Y ACCIONES) --- */}
                        <div className="bg-gray-50 px-6 py-3 border-b flex justify-between items-center flex-wrap gap-4">
                          
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center font-bold text-sm">
                              {!isParent ? (item.numero || item.displayIndex || '-') : ''}
                            </div>
                            
                            <span className="text-sm font-bold text-gray-900">
                               {isParent ? 'Pregunta Grupal' : 'Pregunta Individual'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            {item.clasificacionNombre && (
                                <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                                    item.clasificacionNombre === 'CL' ? 'bg-blue-100 text-blue-700' :
                                    item.clasificacionNombre === 'RL' ? 'bg-purple-100 text-purple-700' :
                                    item.clasificacionNombre === 'CCP' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
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
                                subs.map((sub, idx) => (
                                  <div
                                    key={`${sub.examenId}-${sub.preguntaId}-${sub.numero}`}
                                    className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                                  >
                                    {/* Header mini */}
                                    <div className="flex items-center gap-2 mb-3">
                                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs">
                                        {sub.displayIndex}
                                      </span>
                                      <span className="text-xs font-bold text-gray-500 uppercase">
                                        Sub-Pregunta {sub.displayIndex}
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
                                      {sub.alternativas && sub.alternativas.length > 0 ? (
                                        sub.alternativas.map((alt: any) => {
                                          const respString = sub.respuestaCorrecta?.toString();
                                          const isCorrect = alt.id.toString() === respString;
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
                                                className={`text-sm ${isCorrect ? 'text-green-800 font-medium' : 'text-gray-800'}`}
                                              />
                                            </div>
                                          );
                                        })
                                      ) : (
                                        ['A', 'B', 'C', 'D'].map((opt, i) => {
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
                                                  />
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>

                                    {/* Sustento */}
                                    <div className="text-xs text-gray-500 border-t pt-3 border-gray-100">
                                      <span className="font-bold text-gray-700 block mb-1 uppercase tracking-tight">
                                        Sustento:
                                      </span>
                                      <div className="italic">
                                        {sub.sustento ? (
                                          <HtmlMathRenderer
                                            html={sub.sustento}
                                          />
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
                              {item.alternativas && item.alternativas.length > 0 ? (
                                item.alternativas.map((alt: any) => {
                                  const isCorrect = alt.id.toString() === item.respuesta?.toString();
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
                                        className={`text-sm ${isCorrect ? 'text-green-800 font-medium' : 'text-gray-800'}`}
                                      />
                                    </div>
                                  );
                                })
                              ) : (
                                ['A', 'B', 'C', 'D'].map((opt, i) => {
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
                                          className="text-gray-800"
                                        />
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            <div className="text-sm text-gray-500 mt-4 border-t pt-4 border-gray-100">
                              <span className="font-bold text-gray-700 block mb-1">
                                Sustento:
                              </span>
                              <div className="italic">
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
    </AdminLayout>
  );
};

export default Recursos;
