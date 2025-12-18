import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface Anuncio {
  id: number;
  titulo: string;
  descripcion: string;
  celular: string;
  imagenUrl: string;
  ruta: string;
}

const API_URL = `${API_BASE_URL}/AnunciosGenerales`;

export const anuncioService = {
  getAll: async (): Promise<Anuncio[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        console.error('Error al obtener anuncios:', response.status, response.statusText);
        throw new Error(`Error al obtener anuncios: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  },
};
