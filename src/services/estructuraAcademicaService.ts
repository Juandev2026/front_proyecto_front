import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface Especialidad {
  id: number;
  nombre: string;
}

export interface Nivel {
  id: number;
  nombre: string;
  especialidades: Especialidad[];
}

export interface Modalidad {
  id: number;
  nombre: string;
  niveles: Nivel[];
}

export const estructuraAcademicaService = {
  getAll: async (): Promise<Modalidad[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/EstructuraAcademica`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener estructura académica');
      return await response.json();
    } catch (error) {
      console.error('Error fetching estructura académica:', error);
      throw error;
    }
  },
};
