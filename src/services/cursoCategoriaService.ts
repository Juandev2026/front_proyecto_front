import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

const API_URL = `${API_BASE_URL}/CategoriasGenerales`;

export interface CategoriaGeneral {
  id: number;
  nombre: string;
}

export const cursoCategoriaService = {
  getAll: async (): Promise<CategoriaGeneral[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener categorías de cursos');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching course categories:', error);
      throw error;
    }
  },

  create: async (
    categoria: Omit<CategoriaGeneral, 'id'>
  ): Promise<CategoriaGeneral> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoria),
      });
      if (!response.ok) {
        throw new Error('Error al crear categoría de curso');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating course category:', error);
      throw error;
    }
  },

  update: async (
    id: number,
    categoria: CategoriaGeneral
  ): Promise<CategoriaGeneral> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoria),
      });
      if (!response.ok) {
        throw new Error('Error al actualizar categoría de curso');
      }
      // Some APIs return 200 OK with empty body on PUT
      const text = await response.text();
      return text ? JSON.parse(text) : categoria;
    } catch (error) {
      console.error('Error updating course category:', error);
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
        throw new Error('Error al eliminar categoría de curso');
      }
    } catch (error) {
      console.error('Error deleting course category:', error);
      throw error;
    }
  },
};
