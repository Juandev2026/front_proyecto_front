import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface Anuncio {
  id: number;
  titulo: string;
  descripcion: string;
  celular: string;
  imagenUrl: string;
  ruta: string;
  precio: number;
  telefono: string;
}

const API_URL = `${API_BASE_URL}/AnunciosGenerales`;

export const anuncioService = {
  getAll: async (): Promise<Anuncio[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(
          `Error al obtener anuncios: ${response.status} ${response.statusText}`
        );
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  getById: async (id: number): Promise<Anuncio> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener el anuncio');
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  create: async (anuncio: Omit<Anuncio, 'id'>): Promise<Anuncio> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(anuncio),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al crear anuncio: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  update: async (id: number, anuncio: Partial<Anuncio>): Promise<Anuncio> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(anuncio),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al actualizar anuncio: ${errorText}`);
      }

      const text = await response.text();
      return text ? JSON.parse(text) : ({} as Anuncio);
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
        throw new Error('Error al eliminar el anuncio');
      }
    } catch (error) {
      // Log removed
      throw error;
    }
  },
};
