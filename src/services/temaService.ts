import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';
import { Tema } from './cursoService';

const API_URL = `${API_BASE_URL}/Temas`;

export const temaService = {
  create: async (tema: Omit<Tema, 'id'>): Promise<Tema> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(tema),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al crear el tema: ${response.status} ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  },

  update: async (id: number, tema: Tema): Promise<Tema> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(tema),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al actualizar el tema: ${response.status} ${errorText}`);
      }
      // Handle potential empty response (204 No Content)
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as Tema);
    } catch (error) {
      console.error(`Error updating topic with id ${id}:`, error);
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
        throw new Error(`Error al eliminar el tema: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error(`Error deleting topic with id ${id}:`, error);
      throw error;
    }
  },
};
