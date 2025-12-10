
import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

const API_URL = `${API_BASE_URL}/CategoriasSimples`;

export interface CategoriaSimple {
  id: number;
  nombre: string;
}

export const materialCategoriaService = {
  getAll: async (): Promise<CategoriaSimple[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener categorías de materiales');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching material categories:', error);
      throw error;
    }
  },

  create: async (
    categoria: Omit<CategoriaSimple, 'id'>
  ): Promise<CategoriaSimple> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoria),
      });
      if (!response.ok) {
        throw new Error('Error al crear categoría de material');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  update: async (
    id: number,
    categoria: CategoriaSimple
  ): Promise<CategoriaSimple> => {
     try {
       const response = await fetch(`${API_URL}/${id}`, {
         method: 'PUT',
         headers: getAuthHeaders(),
         body: JSON.stringify(categoria),
       });
       if (!response.ok) {
         throw new Error('Error al actualizar categoría de material');
       }
       const text = await response.text();
       return text ? JSON.parse(text) : categoria;
    } catch (error) {
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
        throw new Error('Error al eliminar categoría de material');
      }
    } catch (error) {
      throw error;
    }
  },
};
