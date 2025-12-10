export interface Categoria {
  id: number;
  nombre: string;
}

import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/Categorias`;

import { getAuthHeaders } from '../utils/apiUtils';

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
      console.error('Error fetching categories:', error);
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
      console.error('Error creating category:', error);
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
      console.error('Error updating category:', error);
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
      console.error('Error deleting category:', error);
      throw error;
    }
  },
};
