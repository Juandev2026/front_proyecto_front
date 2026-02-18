import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface Clasificacion {
  id: number;
  clasificacionNombre: string;
}

const API_URL = `${API_BASE_URL}/Preguntas/clasificaciones`;

export const clasificacionService = {
  getAll: async (): Promise<Clasificacion[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener clasificaciones');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};
