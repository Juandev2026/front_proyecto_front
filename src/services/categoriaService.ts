import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface Categoria {
  id: number;
  nombre: string;
}

const API_URL = `${API_BASE_URL}/CategoriasCursos`;

export const categoriaService = {
  getAll: async (): Promise<Categoria[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener categorías');
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  create: async (categoria: { nombre: string }): Promise<Categoria> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoria),
      });
      if (!response.ok) {
        throw new Error('Error al crear categoría');
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  update: async (id: number, categoria: { nombre: string }): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoria),
      });
      if (!response.ok) {
        throw new Error('Error al actualizar categoría');
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
        throw new Error('Error al eliminar categoría');
      }
    } catch (error) {
      // Log removed
      throw error;
    }
  },
};
