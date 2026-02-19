import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';
import { PreguntaExamen } from '../types/examen';

export interface Especialidad {
  id: number;
  nombre: string;
}

export interface Nivel {
  id: number;
  nombre: string;
  especialidades: Especialidad[];
  anios: string[];
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

  getAgrupados: async (): Promise<Modalidad[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/FiltrosEstructura/agrupados`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener filtros agrupados');
      return await response.json();
    } catch (error) {
      console.error('Error fetching grouped filters:', error);
      throw error;
    }
  },

  getConteoPreguntas: async (modalidadId: number, nivelId: number, year: string): Promise<any> => {
    try {
      const url = `${API_BASE_URL}/FiltrosEstructura/conteo-preguntas?modalidadId=${modalidadId}&nivelId=${nivelId}&year=${year}`;
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener conteo de preguntas');
      return await response.json();
    } catch (error) {
      console.error('Error fetching question count:', error);
      throw error;
    }
  },

  getPreguntas: async (modalidadId: number, nivelId: number, year: string, especialidadId?: number, clasificacionIds?: number[]): Promise<PreguntaExamen[]> => {
    try {
      let url = `${API_BASE_URL}/FiltrosEstructura/preguntas?modalidadId=${modalidadId}&nivelId=${nivelId}&year=${year}`;
      if (especialidadId) {
        url += `&especialidadId=${especialidadId}`;
      }
      if (clasificacionIds && clasificacionIds.length > 0) {
        clasificacionIds.forEach(id => {
          url += `&clasificacionIds=${id}`;
        });
      }
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener preguntas');
      return await response.json();
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  },
};
