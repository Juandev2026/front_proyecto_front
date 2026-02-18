import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface TipoPregunta {
  id: number;
  tipoPreguntaNombre: string;
}

const API_URL = `${API_BASE_URL}/TipoPreguntas`;

export const tipoPreguntaService = {
  getAll: async (): Promise<TipoPregunta[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener tipos de preguntas');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};
