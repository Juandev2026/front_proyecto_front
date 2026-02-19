import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

// DTO para crear una Sub-Pregunta (Hijo)
export interface CreateSubPreguntaDTO {
  examenId: number;
  preguntaId: number;         // ID del Padre
  numero: number;             // Secuencial (1, 2, 3...)
  enunciado: string;
  alternativaA: string;
  alternativaB: string;
  alternativaC: string;
  alternativaD: string;
  respuestaCorrecta: string;  // "A" | "B" | "C" | "D"
  sustento?: string;
  imagen?: string;
  clasificacionId?: number;
}

export interface SubPreguntaResponse extends CreateSubPreguntaDTO {
  // El backend puede retornar campos adicionales
}

const API_URL = `${API_BASE_URL}/SubPreguntas`;

export const subPreguntaService = {
  /**
   * Obtener todas las sub-preguntas de una pregunta padre
   */
  getByPreguntaId: async (examenId: number, preguntaId: number): Promise<SubPreguntaResponse[]> => {
    const response = await fetch(`${API_URL}/details/${examenId}/${preguntaId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 404) return [];
      const err = await response.text();
      throw new Error(`Error al obtener sub-preguntas: ${err}`);
    }
    return await response.json();
  },

  /**
   * Obtener el conteo de sub-preguntas de una pregunta padre
   */
  getCount: async (examenId: number, preguntaId: number): Promise<number> => {
    const response = await fetch(`${API_URL}/count/${examenId}/${preguntaId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      return 0;
    }
    return await response.json();
  },

  /**
   * Crear una sub-pregunta individual
   */
  create: async (dto: CreateSubPreguntaDTO): Promise<SubPreguntaResponse> => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Error al crear sub-pregunta: ${err}`);
    }
    return await response.json();
  },

  /**
   * Crear múltiples sub-preguntas en paralelo (Promise.all)
   */
  createBatch: async (dtos: CreateSubPreguntaDTO[]): Promise<SubPreguntaResponse[]> => {
    const promises = dtos.map(dto =>
      fetch(API_URL, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Error en sub-pregunta #${dto.numero}: ${err}`);
        }
        return res.json() as Promise<SubPreguntaResponse>;
      })
    );
    return Promise.all(promises);
  },

  /**
   * Actualizar una sub-pregunta (llave compuesta)
   */
  update: async (
    examenId: number, 
    preguntaId: number, 
    numero: number, 
    dto: Partial<CreateSubPreguntaDTO>
  ): Promise<SubPreguntaResponse> => {
    const response = await fetch(`${API_URL}/${examenId}/${preguntaId}/${numero}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Error al actualizar sub-pregunta: ${err}`);
    }
    return await response.json();
  },

  /**
   * Eliminar una sub-pregunta (llave compuesta)
   */
  delete: async (examenId: number, preguntaId: number, numero: number): Promise<void> => {
    const response = await fetch(`${API_URL}/${examenId}/${preguntaId}/${numero}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Error al eliminar sub-pregunta: ${err}`);
    }
  },
};
