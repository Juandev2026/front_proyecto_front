import { API_BASE_URL } from '../config/api';
import { getAuthHeaders, getPublicHeaders } from '../utils/apiUtils';

const API_URL = `${API_BASE_URL}/Niveles`;

export interface Nivel {
  id: number;
  nombre: string;
  imageUrl?: string;
  modalidadIds: number | number[]; // Can be single number or array
  modalidad?: string | string[]; // Can be single string or array
  modalidadId?: number; // Keep for compatibility
}

export const nivelService = {
  getAll: async (): Promise<Nivel[]> => {
    try {
      const response = await fetch(`${API_URL}/usuarios`, {
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
      const all = await nivelService.getAll();
      return all.filter((n) => {
        // Handle both single number and array formats
        if (typeof n.modalidadIds === 'number') {
          return n.modalidadIds === modalidadId;
        }
        return (
          n.modalidadId === modalidadId ||
          (n.modalidadIds && n.modalidadIds.includes(modalidadId))
        );
      });
    } catch (error) {
      // Log removed
      return [];
    }
  },

  create: async (nivel: {
    nombre: string;
    modalidadId: number;
  }): Promise<Nivel> => {
    try {
      const payload = {
        nombre: nivel.nombre,
        modalidadId: nivel.modalidadId,
      };
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
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
      const payload = {
        nombre: nivel.nombre,
        modalidadId: nivel.modalidadId,
      };
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
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
