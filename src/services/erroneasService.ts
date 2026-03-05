import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface Alternativa {
  id: number;
  contenido: string;
}

export interface ErrorInmediato {
  alternativaMarcada: number;
}

export interface SubPreguntaErronea {
  subPreguntaId: number;
  enunciado: string;
  respuestaCorrecta: string | number;
  alternativaMarcada: number;
  alternativas: Alternativa[];
}

export interface PreguntaErronea {
  preguntaId: number;
  examenId?: number;
  year?: number;
  numero?: number;
  enunciado: string;
  respuestaCorrecta: string | number | null;
  alternativas: Alternativa[];
  erroresInmediatos: ErrorInmediato[] | null;
  subPreguntas: SubPreguntaErronea[];
  puntaje?: number;
}

export interface EspecialidadErroneas {
  especialidadId: number;
  especialidadNombre: string;
  propios: PreguntaErronea[];
  otros: PreguntaErronea[];
}

export interface NivelErroneas {
  nivelId: number;
  nivelNombre: string;
  especialidades: EspecialidadErroneas[];
}

export interface ModalidadErroneas {
  modalidadId: number;
  modalidadNombre: string;
  niveles: NivelErroneas[];
}

export interface GroupByFechaErroneas {
  fecha: string;
  modalidades: ModalidadErroneas[];
}

const API_URL = `${API_BASE_URL}/Erroneas`;

export const erroneasService = {
  getByUser: async (
    userId: number,
    tipoExamenId?: number
  ): Promise<GroupByFechaErroneas[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (tipoExamenId !== undefined) {
        queryParams.append('tipoExamenId', String(tipoExamenId));
      }

      const queryString = queryParams.toString();
      const url = `${API_URL}/user/${userId}${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener respuestas erróneas');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  marcarRevisada: async (userId: number, preguntaId: number): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/marcar-revisada`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, preguntaId }),
      });
      if (!response.ok) {
        throw new Error('Error al marcar pregunta como revisada');
      }
    } catch (error) {
      throw error;
    }
  },

  deleteMultiple: async (
    userId: number,
    items: { examenId: number; year: number; preguntasId: number; subPreguntasId?: number | null }[]
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/delete-multiple/${userId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(items),
      });
      if (!response.ok) {
        throw new Error('Error al eliminar preguntas erróneas');
      }
    } catch (error) {
      throw error;
    }
  },
};
