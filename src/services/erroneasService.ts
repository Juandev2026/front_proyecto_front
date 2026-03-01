import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface RespuestaErronea {
  id: number;
  pruebaId: number;
  preguntaId: number;
  alternativaMarcada: number;
  year: number;
  examenId: number;
  userId: number;
  fechaCreacion: string;
  enunciado: string;
  alternativaText: string | null;
}

const API_URL = `${API_BASE_URL}/Erroneas`;

export const erroneasService = {
  getByUser: async (userId: number): Promise<RespuestaErronea[]> => {
    try {
      const response = await fetch(`${API_URL}/user/${userId}`, {
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
