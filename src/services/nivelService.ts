import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/Niveles`;

export interface Nivel {
  id: number;
  nombre: string;
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
      // The user spec implies /api/Niveles might return all, but for filtering we might need client side 
      // OR there is a specific endpoint. The previous code used {API_URL}/{modalidadId} which seems to correspond to GET /api/Niveles/{id} 
      // BUT existing usage suggests it treats the ID as distinct from GET by ID. 
      // The user provided spec shows GET /api/Niveles returns list. 
      // And GET /api/Niveles/{id} returns ONE item. 
      // So filtering by modalidad might need to happen client side or via query param if API supports it.
      // For now, I will keep the previous logic BUT with a fallback to fetching all and filtering if the specific endpoint fails, 
      // OR just fetch all and filter client side if the previous endpoint was actually wrong.
      // However, if the previous code was working, I should be careful. 
      // Wait, the previous code had a fallback with mock data.
      // Let's rely on getAll and filter in the UI for the general list, 
      // but for the specific dropdown in materials, we might want to keep this helper if possible.
      // Actually, looking at the user spec: GET /api/Niveles returns simple list. 
      // There is NO endpoint shown for /api/Niveles/ByModalidad/{id}.
      // So I'll implement getAll and filter client-side for safety.
      
      const response = await fetch(API_URL, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Error fetching levels');
      const all: Nivel[] = await response.json();
      return all.filter(n => n.modalidadId === modalidadId);
    } catch (error) {
      console.error('Error fetching levels by modality:', error);
      return [];
    }
  },

  create: async (nivel: { nombre: string; modalidadId: number }): Promise<Nivel> => {
    try {
      const payload = {
        id: 0,
        nombre: nivel.nombre,
        modalidadId: nivel.modalidadId,
        modalidad: {
          id: 0,
          nombre: 'string'
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

  update: async (id: number, nivel: { nombre: string; modalidadId: number }): Promise<void> => {
    try {
      const payload = {
        id: id,
        nombre: nivel.nombre,
        modalidadId: nivel.modalidadId,
        modalidad: {
          id: 0,
          nombre: 'string'
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
