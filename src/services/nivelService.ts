import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/Niveles`;

export interface Nivel {
  id: number;
  nombre: string;
  modalidadId: number;
}

import { getAuthHeaders } from '../utils/apiUtils';

export const nivelService = {
  getByModalidadId: async (modalidadId: number): Promise<Nivel[]> => {
    try {
      const response = await fetch(`${API_URL}/${modalidadId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener niveles - ' + response.status);
      }
      const data = await response.json();
      // API might return a single object instead of an array. Normalize to array.
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        return [data];
      }
      return [];
    } catch (error) {
      console.warn('API /Niveles/{id} unreachable or unauthorized (401). Using fallback data.');
      // Fallback data
      const allLevels = [
        { id: 1, nombre: 'Inicial', modalidadId: 1 },
        { id: 2, nombre: 'Primaria', modalidadId: 1 },
        { id: 3, nombre: 'Secundaria', modalidadId: 1 },
        { id: 4, nombre: 'Básico', modalidadId: 2 },
        { id: 5, nombre: 'Intermedio', modalidadId: 2 },
        { id: 6, nombre: 'Avanzado', modalidadId: 2 },
        { id: 7, nombre: 'Diplomado', modalidadId: 3 }
      ];
      return allLevels.filter(n => n.modalidadId === modalidadId);
    }
  },
};
