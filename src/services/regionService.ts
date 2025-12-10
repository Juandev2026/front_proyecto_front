import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/Regiones`;

export interface Region {
  id: number;
  nombre: string;
}

import { getAuthHeaders } from '../utils/apiUtils';

export const regionService = {
  getAll: async (): Promise<Region[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener regiones - ' + response.status);
      }
      return await response.json();
    } catch (error) {
      console.warn('API /Regiones unreachable or unauthorized (401). Using fallback data.');
      // Fallback data
      return [
         { id: 1, nombre: 'Lima' },
         { id: 2, nombre: 'Arequipa' },
         { id: 3, nombre: 'Cusco' },
         { id: 4, nombre: 'La Libertad' },
         { id: 5, nombre: 'Piura' },
         { id: 6, nombre: 'Junín' }
      ];
    }
  },
};
