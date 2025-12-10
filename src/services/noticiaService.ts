import { API_BASE_URL } from '../config/api';
import { getAuthHeaders, getAuthHeadersFormData } from '../utils/apiUtils';

export interface Noticia {
  id: number;
  titulo: string;
  descripcion: string;
  categoriaId: number;
  fecha: string;
  imageUrl: string | null;
  esDestacado: boolean;
}

const API_URL = `${API_BASE_URL}/Noticias`;

export const noticiaService = {
  getAll: async (destacado?: boolean): Promise<Noticia[]> => {
    try {
      let url = API_URL;
      if (destacado !== undefined) {
        url += `?destacado=${destacado}`;
      }
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener noticias');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Noticia> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener la noticia');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching news with id ${id}:`, error);
      throw error;
    }
  },

  create: async (noticia: Omit<Noticia, 'id'> | FormData): Promise<Noticia> => {
    try {
      const isFormData = noticia instanceof FormData;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: isFormData ? getAuthHeadersFormData() : getAuthHeaders(),
        body: isFormData ? noticia : JSON.stringify(noticia),
      });
      if (!response.ok) {
        throw new Error('Error al crear la noticia');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating news:', error);
      throw error;
    }
  },

  update: async (id: number, noticia: Noticia | FormData): Promise<Noticia> => {
    try {
      const isFormData = noticia instanceof FormData;
      console.log('Updating news with payload:', isFormData ? 'FormData' : noticia);
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: isFormData ? getAuthHeadersFormData() : getAuthHeaders(),
        body: isFormData ? noticia : JSON.stringify(noticia),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Error updating news (Status: ${response.status}):`,
          errorText
        );
        throw new Error(
          `Error al actualizar la noticia: ${response.status} ${errorText}`
        );
      }

      // Check if response has content before parsing JSON
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as Noticia);
    } catch (error) {
      console.error(`Error updating news with id ${id}:`, error);
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
        throw new Error('Error al eliminar la noticia');
      }
    } catch (error) {
      console.error(`Error deleting news with id ${id}:`, error);
      throw error;
    }
  },
};
