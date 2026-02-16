import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface YearGrouped {
  year: string;
  count: number;
}

export interface EspecialidadGrouped {
  especialidadId: number;
  especialidadNombre: string;
  years: YearGrouped[];
}

export interface NivelGrouped {
  nivelId: number;
  nivelNombre: string;
  especialidades: EspecialidadGrouped[];
}

export interface ModalidadGrouped {
  modalidadId: number;
  modalidadNombre: string;
  niveles: NivelGrouped[];
}

export interface FuenteGrouped {
  fuenteId: number;
  fuenteNombre: string;
  modalidades: ModalidadGrouped[];
}

export interface ExamenGrouped {
  tipoExamenId: number;
  tipoExamenNombre: string;
  fuentes: FuenteGrouped[];
}

const API_URL = `${API_BASE_URL}/Examenes`;


export interface Examen {
  id: number;
  year: string;
  tipoExamenId: number;
  fuenteId: number;
  modalidadId: number;
  nivelId: number;
  especialidadId: number;
  nombre?: string; // Optional if not always present
}

export const examenService = {
  getGrouped: async (): Promise<ExamenGrouped[]> => {
    try {
      const response = await fetch(`${API_URL}/grouped`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener exámenes agrupados');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  getAll: async (): Promise<Examen[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener todos los exámenes');
      }
      return await response.json();
    } catch (error) {
       console.warn("Could not fetch all exams, possibly endpoint not supported", error);
       return [];
    }
  },

  create: async (data: Omit<Examen, 'id'>): Promise<Examen> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
         const err = await response.text();
         throw new Error(`Error al crear examen: ${err}`);
      }
      return await response.json();
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
        throw new Error('Error al eliminar examen');
      }
    } catch (error) {
      throw error;
    }
  },
};

