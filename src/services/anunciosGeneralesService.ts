import { API_BASE_URL } from '../config/api';
import { getAuthHeaders, getPublicHeaders } from '../utils/apiUtils';

export interface AnuncioGeneral {
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

export const anunciosGeneralesService = {
  getAll: async (): Promise<AnuncioGeneral[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getPublicHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Error fetching anuncios generales: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching anuncios generales:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<AnuncioGeneral> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Error fetching anuncio general by id: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching anuncio general:', error);
      throw error;
    }
  },

  create: async (anuncio: Omit<AnuncioGeneral, 'id'>): Promise<AnuncioGeneral> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(anuncio),
      });
      if (!response.ok) {
        throw new Error(`Error creating anuncio general: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating anuncio general:', error);
      throw error;
    }
  },

  update: async (id: number, anuncio: AnuncioGeneral): Promise<AnuncioGeneral> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(anuncio),
      });
      if (!response.ok) {
        throw new Error(`Error updating anuncio general: ${response.status} ${response.statusText}`);
      }
      // The API documentation differs slightly on return types sometimes, but usually it returns the object or 200 OK.
      // If it returns plain text, handle it.
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as AnuncioGeneral);
    } catch (error) {
      console.error('Error updating anuncio general:', error);
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
        throw new Error(`Error deleting anuncio general: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting anuncio general:', error);
      throw error;
    }
  },
};
