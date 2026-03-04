import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface EspecialidadEA {
  id: number;
  nombre: string;
}

export interface NivelEA {
  id: number;
  nombre: string;
  especialidades: EspecialidadEA[];
}

export interface ModalidadEA {
  id: number;
  nombre: string;
  niveles: NivelEA[];
}

const API_URL = `${API_BASE_URL}/EstructuraAcademica`;

export const estructuraAcademicaService = {
  getAll: async (): Promise<ModalidadEA[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener estructura académica');
      }
      return await response.json();
    } catch (error) {
      console.error('estructuraAcademicaService.getAll error:', error);
      throw error;
    }
  },
};
