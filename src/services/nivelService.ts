import { API_BASE_URL } from '../config/api';
import { getAuthHeaders, getAuthHeadersFormData, getPublicHeaders } from '../utils/apiUtils';

const API_URL = `${API_BASE_URL}/Niveles`;

export interface Nivel {
  id: number;
  nombre: string;
  imageUrl?: string;
  modalidadIds: number[];
  modalidad?: string[]; // Array of strings based on API response
  modalidadId?: number; // Keep for compatibility if needed, but API seems to use arrays
}

export const nivelService = {
  getAll: async (): Promise<Nivel[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getPublicHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener niveles');
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  getByModalidadId: async (modalidadId: number): Promise<Nivel[]> => {
    try {
      // Fallback to fetch all and filter
      const response = await fetch(API_URL, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Error fetching levels');
      const all: Nivel[] = await response.json();
      return all.filter((n) => n.modalidadId === modalidadId);
    } catch (error) {
      // Log removed
      return [];
    }
  },

  create: async (
    nivel: { nombre: string; modalidadId: number }
  ): Promise<Nivel> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(nivel),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating nivel:', error);
      throw error;
    }
  },

  update: async (
    id: number,
    nivel: { nombre: string; modalidadId: number }
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...nivel, id }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Error updating nivel:', error);
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
        const errorText = await response.text();
        console.error(
          `Error deleting level ${id}: ${response.status} ${errorText}`
        );
        throw new Error(
          `Error ${response.status} al eliminar nivel: ${errorText}`
        );
      }
    } catch (error) {
      // Log removed
      throw error;
    }
  },
};
