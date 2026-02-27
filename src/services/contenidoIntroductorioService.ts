import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface ContenidoIntroductorio {
  id: number;
  nombreModulo: string;
  descripcion: string;
  urlVideo: string;
}

export interface UpdateContenidoRequest {
  nombreModulo: string;
  descripcion: string;
  urlVideo: string;
}

export const contenidoIntroductorioService = {
  getAll: async (): Promise<ContenidoIntroductorio[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/ContenidoIntroductorio`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok)
        throw new Error('Failed to fetch contenido introductorio');
      return await response.json();
    } catch (error) {
      console.error('Error in getAll ContenidoIntroductorio:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<ContenidoIntroductorio> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/ContenidoIntroductorio/${id}`,
        {
          headers: getAuthHeaders(),
        }
      );
      if (!response.ok) throw new Error('Failed to fetch content item');
      return await response.json();
    } catch (error) {
      console.error(`Error in getById ContenidoIntroductorio (${id}):`, error);
      throw error;
    }
  },

  update: async (id: number, data: UpdateContenidoRequest): Promise<void> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/ContenidoIntroductorio/${id}`,
        {
          method: 'PUT',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error('Failed to update content item');
    } catch (error) {
      console.error(`Error in update ContenidoIntroductorio (${id}):`, error);
      throw error;
    }
  },
};
