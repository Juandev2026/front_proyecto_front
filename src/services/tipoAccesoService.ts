import { API_BASE_URL } from '../config/api';
import { getPublicHeaders } from '../utils/apiUtils';

const API_URL = `${API_BASE_URL}/TiposAcceso`;

export interface TipoAcceso {
  id: number;
  descripcion: string;
}

export const tipoAccesoService = {
  getAll: async (): Promise<TipoAcceso[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getPublicHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener tipos de acceso');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};
