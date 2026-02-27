import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface EnunciadoItem {
  id: number;
  contenido: string;
}

export interface Pregunta {
  id: number;
  enunciado?: string;
  alternativaA?: string;
  alternativaB?: string;
  alternativaC?: string;
  alternativaD?: string;
  respuesta?: string | number;
  sustento?: string;
  examenId: number;
  clasificacionId?: number;
  imagen?: string;
  tipoPreguntaId: number;
  preguntaId?: number; // ID del Padre (si existe)
  numero?: number; // Orden de la sub-pregunta
  year?: string;
  enunciados?: EnunciadoItem[];
  subPreguntas?: any[];
  alternativas?: any[];
  justificaciones?: any[];
  clasificacionNombre?: string;
}

export interface ExamenFilterRequest {
  tipoExamenId?: number;
  fuenteId?: number;
  modalidadId?: number;
  nivelId?: number;
  especialidadId?: number;
  year?: string;
}

export interface ClasificacionExamen {
  id: number;
  clasificacionNombre: string;
  puntos: number;
  tiempoPregunta: number;
  minimo: number;
}

const API_URL = `${API_BASE_URL}/Preguntas`;

export const preguntaService = {
  getClasificaciones: async (): Promise<ClasificacionExamen[]> => {
    const response = await fetch(`${API_URL}/clasificaciones`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Error al obtener clasificaciones');
    }
    return response.json();
  },

  getAll: async (): Promise<Pregunta[]> => {
    const response = await fetch(API_URL, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Error al obtener preguntas');
    }
    return response.json();
  },

  getById: async (id: number): Promise<Pregunta> => {
    const response = await fetch(`${API_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Error al obtener la pregunta');
    }
    return response.json();
  },

  create: async (item: Omit<Pregunta, 'id'>): Promise<Pregunta> => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      throw new Error('Error al crear la pregunta');
    }
    return response.json();
  },

  update: async (
    _examenId: number,
    id: number,
    item: Partial<Pregunta>
  ): Promise<Pregunta> => {
    const payload = {
      numero: Number(item.numero),
      clasificacionId: Number(item.clasificacionId),
      tipoPreguntaId: Number(item.tipoPreguntaId),
      respuesta: item.respuesta, // Can be string or number
      enunciado: item.enunciado,
      alternativaA: item.alternativaA,
      alternativaB: item.alternativaB,
      alternativaC: item.alternativaC,
      alternativaD: item.alternativaD,
      sustento: item.sustento,
      examenId: Number(item.examenId),
      imagen: item.imagen,
      enunciados: item.enunciados,
      alternativas: item.alternativas,
      justificaciones: item.justificaciones,
    };

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar la pregunta');
    }

    const text = await response.text();
    const updatedData = text ? JSON.parse(text) : payload;

    return { ...updatedData, id } as Pregunta;
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Error al eliminar la pregunta');
    }
  },

  /**
   * Crear una sola pregunta (Padre) y retornar el objeto con ID
   */
  createSingle: async (item: Partial<Pregunta>): Promise<Pregunta> => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Error al crear pregunta padre: ${err}`);
    }
    return response.json();
  },

  // --- NEW ENDPOINTS FOR EXAM-CENTRIC LOGIC ---

  getByExamenId: async (examenId: number): Promise<Pregunta[]> => {
    const response = await fetch(`${API_URL}/examen/${examenId}`, {
      headers: getAuthHeaders(),
    });

    if (response.status === 404) {
      // Exam not found or handled by API returning 404
      return [];
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  createForExamen: async (
    examenId: number,
    questions: Partial<Pregunta>[]
  ): Promise<Pregunta[]> => {
    const response = await fetch(`${API_URL}/examen/${examenId}/bulk`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questions),
    });
    if (!response.ok) {
      throw new Error('Error creating questions for exam');
    }
    return response.json();
  },

  examenFilter: async (filter: ExamenFilterRequest): Promise<Pregunta[]> => {
    const response = await fetch(`${API_URL}/examen-filter`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filter),
    });
    if (!response.ok) {
      throw new Error('Error filtering questions');
    }
    const rawData = await response.json();
    if (!Array.isArray(rawData)) return [];

    const getLetter = (ans: any, alts: any[]) => {
      if (ans === undefined || ans === null || ans === '') return '';
      const sAns = String(ans).toUpperCase();

      if (['A', 'B', 'C', 'D'].includes(sAns)) return sAns;
      if (!alts || alts.length === 0) return '';

      const idxById = alts.findIndex((a: any) => String(a.id) === String(ans));
      if (idxById !== -1) return String.fromCharCode(65 + idxById);

      const numAns = Number(ans);
      if (!Number.isNaN(numAns) && numAns >= 0 && numAns < alts.length) {
        return String.fromCharCode(65 + numAns);
      }
      return sAns;
    };

    return rawData
      .map((q: any) => {
        const mapped: Pregunta = {
          id: q.id,
          examenId: q.examenId,
          year: q.year,
          numero: q.numero,
          enunciado: (q.enunciados || [])
            .map((e: any) => e.contenido)
            .join('<br/>'),
          alternativaA: q.alternativas?.[0]?.contenido || '',
          alternativaB: q.alternativas?.[1]?.contenido || '',
          alternativaC: q.alternativas?.[2]?.contenido || '',
          alternativaD: q.alternativas?.[3]?.contenido || '',
          respuesta: getLetter(q.respuesta, q.alternativas || []),
          tipoPreguntaId: q.tipoPreguntaId,
          clasificacionId: q.clasificacionId,
          clasificacionNombre: q.clasificacionNombre,
          imagen: q.imagen || '',
          alternativas: q.alternativas,
          justificaciones: q.justificaciones,
          enunciados: q.enunciados,
          subPreguntas: (q.subPreguntas || []).map((sub: any) => ({
            ...sub,
            enunciado: (sub.enunciados || [])
              .map((e: any) => e.contenido)
              .join('<br/>'),
            alternativaA: sub.alternativas?.[0]?.contenido || '',
            alternativaB: sub.alternativas?.[1]?.contenido || '',
            alternativaC: sub.alternativas?.[2]?.contenido || '',
            alternativaD: sub.alternativas?.[3]?.contenido || '',
            respuesta: getLetter(
              sub.respuestaCorrecta || sub.respuesta,
              sub.alternativas || []
            ),
          })),
        };
        return mapped;
      })
      .sort((a, b) => {
        const numA = a.numero && a.numero > 0 ? a.numero : Infinity;
        const numB = b.numero && b.numero > 0 ? b.numero : Infinity;
        return numA - numB || a.id - b.id;
      });
  },
};
