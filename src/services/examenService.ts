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
};
