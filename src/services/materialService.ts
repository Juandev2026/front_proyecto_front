export interface Material {
  id: number;
  titulo: string;
  descripcion: string;
  url: string;
  categoriaId: number;
}

import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/Materiales`;

import { getAuthHeaders, getAuthHeadersFormData } from '../utils/apiUtils';

export const materialService = {
  getAll: async (): Promise<Material[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener materiales');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching materials:', error);
      throw error;
    }
  },

  create: async (
    material: Omit<Material, 'id'> | FormData
  ): Promise<Material> => {
    try {
      const isFormData = material instanceof FormData;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: isFormData ? getAuthHeadersFormData() : getAuthHeaders(),
        body: isFormData ? material : JSON.stringify(material),
      });

      if (!response.ok) {
        throw new Error('Error al crear el material');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  },

  update: async (
    id: number,
    material: Material | FormData
  ): Promise<Material> => {
    try {
      const isFormData = material instanceof FormData;
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: isFormData ? getAuthHeadersFormData() : getAuthHeaders(),
        body: isFormData ? material : JSON.stringify(material),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el material');
      }

      // Check if response has content before parsing JSON
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as Material);
    } catch (error) {
      console.error(`Error updating material with id ${id}:`, error);
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
        throw new Error('Error al eliminar el material');
      }
    } catch (error) {
      console.error(`Error deleting material with id ${id}:`, error);
      throw error;
    }
  },
};
