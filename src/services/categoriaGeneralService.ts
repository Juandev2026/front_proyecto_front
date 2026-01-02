import { API_BASE_URL } from '../config/api';
import { getAuthHeaders, getPublicHeaders } from '../utils/apiUtils';

export interface CategoriaGeneral {
  id: number;
  nombre: string;
}

const API_URL = `${API_BASE_URL}/CategoriasNoticias`;

export const categoriaGeneralService = {
  getAll: async (): Promise<CategoriaGeneral[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getPublicHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener categorías generales');
      }
      return await response.json();
    } catch (error) {
      // Log removed
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
        throw new Error('Error al actualizar categoría general');
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
        throw new Error('Error al eliminar categoría general');
      }
    } catch (error) {
      // Log removed
      throw error;
    }
  },
};
