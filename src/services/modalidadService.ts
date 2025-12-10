import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/Modalidades`;

export interface Modalidad {
  id: number;
  nombre: string;
}

import { getAuthHeaders } from '../utils/apiUtils';

export const modalidadService = {
  getAll: async (): Promise<Modalidad[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener modalidades - ' + response.status);
      }
      return await response.json();
    } catch (error) {
      console.warn('API /Modalidades unreachable or unauthorized (401). Using fallback data.');
      // Fallback data for registration form
      return [
        { id: 1, nombre: 'Presencial' },
        { id: 2, nombre: 'Virtual' },
        { id: 3, nombre: 'Híbrido' }
      ];
    }
  },
};
