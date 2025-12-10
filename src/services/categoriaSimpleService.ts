export interface CategoriaSimple {
  id: number;
  nombre: string;
}

import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/CategoriasMateriales`;

import { getAuthHeaders } from '../utils/apiUtils';

export const categoriaSimpleService = {
  getAll: async (): Promise<CategoriaSimple[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener categorías simples');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching simple categories:', error);
      throw error;
    }
  },

  create: async (categoria: { nombre: string }): Promise<CategoriaSimple> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoria),
      });
      if (!response.ok) {
        throw new Error('Error al crear categoría simple');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating simple category:', error);
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
        throw new Error('Error al actualizar categoría simple');
      }
    } catch (error) {
      console.error('Error updating simple category:', error);
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
        throw new Error('Error al eliminar categoría simple');
      }
    } catch (error) {
      console.error('Error deleting simple category:', error);
      throw error;
    }
  },
};
