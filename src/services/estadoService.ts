import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface Estado {
  id: number;
  nombre: string;
  codigo: string;
  colorHex: string;
}

const API_URL = `${API_BASE_URL}/Estados`;

export const estadoService = {
  getAll: async (): Promise<Estado[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener estados');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: number): Promise<Estado> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener el estado');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};
