import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface Publicidad {
  id: number;
  titulo: string;
  imageUrl: string;
  enlace: string;
  fecha?: string;
  modalidadId: number;
  nivelId: number;
  precio: number;
  telefono: string;
}

const API_URL = `${API_BASE_URL}/Publicidad`;

export const publicidadService = {
  getAll: async (): Promise<Publicidad[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorText = await response.text();
        // Log removed
        throw new Error(
          `Error ${response.status} al obtener publicidad: ${errorText}`
        );
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  getById: async (id: number): Promise<Publicidad | Publicidad[]> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener publicidad por ID');
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  create: async (
    publicidad: Omit<Publicidad, 'id' | 'fecha'>
  ): Promise<Publicidad> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...publicidad,
          precio: publicidad.precio ? Number(publicidad.precio) : 0,
          telefono: publicidad.telefono || '',
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error al crear publicidad: ${errText}`);
      }

      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  update: async (
    id: number,
    publicidad: Partial<Publicidad>
  ): Promise<Publicidad> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...publicidad,
          precio: publicidad.precio ? Number(publicidad.precio) : 0,
          telefono: publicidad.telefono || '',
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error al actualizar publicidad: ${errText}`);
      }

      const text = await response.text();
      // Try parsing JSON if response is not empty, otherwise return empty object or handle accordingly
      return text ? JSON.parse(text) : ({} as Publicidad);
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
        throw new Error('Error al eliminar publicidad');
      }
    } catch (error) {
      // Log removed
      throw error;
    }
  },
};
