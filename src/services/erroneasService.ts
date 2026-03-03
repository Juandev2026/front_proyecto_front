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
  respuestaCorrecta: string;
  alternativaMarcada: number;
  alternativas: Alternativa[];
}

export interface PreguntaErronea {
  preguntaId: number;
  numero?: number;
  enunciado: string;
  respuestaCorrecta: string | null;
  alternativas: Alternativa[];
  erroresInmediatos: ErrorInmediato[] | null;
  subPreguntas: SubPreguntaErronea[];
  year?: number;
  examenId?: number;
}

export interface GrupoErroneas {
  fecha: string;
  preguntas: PreguntaErronea[];
}

const API_URL = `${API_BASE_URL}/Erroneas`;

export const erroneasService = {
  getByUser: async (
    userId: number,
    tipoExamenId?: number
  ): Promise<GrupoErroneas[]> => {
    try {
      let url = `${API_URL}/user/${userId}`;
      if (tipoExamenId !== undefined) {
        url += `?tipoExamenId=${tipoExamenId}`;
      }
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
};
