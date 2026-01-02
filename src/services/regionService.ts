import { API_BASE_URL } from '../config/api';
import { getAuthHeaders, getPublicHeaders } from '../utils/apiUtils';

const API_URL = `${API_BASE_URL}/Regiones`;

export interface Region {
  id: number;
  nombre: string;
}

export const regionService = {
  getAll: async (): Promise<Region[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getPublicHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener regiones');
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  create: async (region: { nombre: string }): Promise<Region> => {
    try {
      const payload = {
        id: 0,
        nombre: region.nombre,
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Error al crear región');
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  update: async (id: number, region: { nombre: string }): Promise<void> => {
    try {
      const payload = {
        id,
        nombre: region.nombre,
      };

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Error al actualizar región');
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
        throw new Error('Error al eliminar región');
      }
    } catch (error) {
      // Log removed
      throw error;
    }
  },
};
