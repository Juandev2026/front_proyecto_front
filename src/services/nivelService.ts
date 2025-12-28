import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/Niveles`;

export interface Nivel {
  id: number;
  nombre: string;
  imageUrl?: string;
  modalidadId: number;
  modalidad?: {
    id: number;
    nombre: string;
  };
}

import { getAuthHeaders } from '../utils/apiUtils';

export const nivelService = {
  getAll: async (): Promise<Nivel[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener niveles');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching levels:', error);
      throw error;
    }
  },

  getByModalidadId: async (modalidadId: number): Promise<Nivel[]> => {
    try {
        // Fallback to fetch all and filter
      const response = await fetch(API_URL, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Error fetching levels');
      const all: Nivel[] = await response.json();
      return all.filter(n => n.modalidadId === modalidadId);
    } catch (error) {
      console.error('Error fetching levels by modality:', error);
      return [];
    }
  },

  create: async (nivel: { nombre: string; imageUrl?: string; modalidadId: number }): Promise<Nivel> => {
    try {
      const payload = {
        id: 0,
        nombre: nivel.nombre,
        imageUrl: nivel.imageUrl || '',
        modalidadId: nivel.modalidadId,
        modalidad: {
          id: nivel.modalidadId
        }
      };
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Error al crear nivel');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating level:', error);
      throw error;
    }
  },

  update: async (id: number, nivel: { nombre: string; imageUrl?: string; modalidadId: number }): Promise<void> => {
    try {
      const payload = {
        id: id,
        nombre: nivel.nombre,
        imageUrl: nivel.imageUrl || '',
        modalidadId: nivel.modalidadId,
        modalidad: {
          id: nivel.modalidadId
        }
      };

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Error al actualizar nivel');
      }
    } catch (error) {
      console.error('Error updating level:', error);
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
        console.error(`Error deleting level ${id}: ${response.status} ${errorText}`);
        throw new Error(`Error ${response.status} al eliminar nivel: ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting level:', error);
      throw error;
    }
  },
};
