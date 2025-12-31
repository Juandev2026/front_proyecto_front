import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

const API_URL = `${API_BASE_URL}/Modalidades`;

export interface Modalidad {
  id: number;
  nombre: string;
}

export const modalidadService = {
  getAll: async (): Promise<Modalidad[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Error al obtener modalidades - ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  create: async (modalidad: { nombre: string }): Promise<Modalidad> => {
    try {
      const payload = {
        id: 0,
        nombre: modalidad.nombre,
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Error al crear modalidad');
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  update: async (id: number, modalidad: { nombre: string }): Promise<void> => {
    try {
      const payload = {
        id,
        nombre: modalidad.nombre,
      };

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Error al actualizar modalidad');
      }
    } catch (error) {
      // Log removed
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
        throw new Error('Error al eliminar modalidad');
      }
    } catch (error) {
      // Log removed
      throw error;
    }
  },
};
