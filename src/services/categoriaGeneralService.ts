export interface CategoriaGeneral {
  id: number;
  nombre: string;
}

import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/CategoriasNoticias`;

import { getAuthHeaders } from '../utils/apiUtils';

export const categoriaGeneralService = {
  getAll: async (): Promise<CategoriaGeneral[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener categorías generales');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching general categories:', error);
      throw error;
    }
  },

  create: async (categoria: { nombre: string }): Promise<CategoriaGeneral> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoria),
      });
      if (!response.ok) {
        throw new Error('Error al crear categoría general');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating general category:', error);
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
        throw new Error('Error al actualizar categoría general');
      }
    } catch (error) {
      console.error('Error updating general category:', error);
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
        throw new Error('Error al eliminar categoría general');
      }
    } catch (error) {
      console.error('Error deleting general category:', error);
      throw error;
    }
  },
};
