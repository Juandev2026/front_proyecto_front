import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface Pregunta {
  id: number;
  enunciado: string;
  alternativaA: string;
  alternativaB: string;
  alternativaC: string;
  alternativaD: string;
  respuesta: string;
  sustento: string;
  examenId: number;
  clasificacionId: number;
  imagen: string;
  tipoPreguntaId: number;
}

const API_URL = `${API_BASE_URL}/Preguntas`;

export const preguntaService = {
  getAll: async (): Promise<Pregunta[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener preguntas');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: number): Promise<Pregunta> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener la pregunta');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
  
  create: async (item: Omit<Pregunta, 'id'>): Promise<Pregunta> => {
    try {
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
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  update: async (id: number, item: Partial<Pregunta>): Promise<Pregunta> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        throw new Error('Error al actualizar la pregunta');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al eliminar la pregunta');
      }
    } catch (error) {
      throw error;
    }
  },
};
