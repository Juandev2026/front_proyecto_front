import { API_BASE_URL } from '../config/api';
import { getAuthHeaders, getPublicHeaders } from '../utils/apiUtils';

export interface NormaLegal {
  id: number;
  nombre: string;
  descripcion: string;
  url: string;
  fechaCreacion?: string;
}

const API_URL = `${API_BASE_URL}/NormasLegales`;

export const normasLegalesService = {
  getAll: async (): Promise<NormaLegal[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getPublicHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener normas legales');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: number): Promise<NormaLegal> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getPublicHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener norma legal');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  create: async (norma: Omit<NormaLegal, 'id' | 'fechaCreacion'>): Promise<NormaLegal> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(norma),
      });

      if (!response.ok) {
        throw new Error('Error al crear norma legal');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  update: async (id: number, norma: Partial<NormaLegal>): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(norma),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar norma legal');
      }
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
        throw new Error('Error al eliminar norma legal');
      }
    } catch (error) {
      throw error;
    }
  },
};
