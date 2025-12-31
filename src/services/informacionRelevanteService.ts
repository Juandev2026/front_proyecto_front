import { API_URL, getAuthHeaders } from '../config/api';

export interface InformacionRelevante {
  id: number;
  urlImagen: string;
  titulo: string;
  descripcion: string;
  url: string;
  precio: number;
  telefono: string;
}

const ENDPOINT = `${API_URL}/InformacionRelevante`;

export const informacionRelevanteService = {
  getAll: async (): Promise<InformacionRelevante[]> => {
    try {
      const response = await fetch(ENDPOINT, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener informacion relevante');
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  create: async (
    data: Omit<InformacionRelevante, 'id'>
  ): Promise<InformacionRelevante> => {
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Error al crear informacion relevante');
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  update: async (
    id: number,
    data: Omit<InformacionRelevante, 'id'>
  ): Promise<void> => {
    try {
      const response = await fetch(`${ENDPOINT}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Error al actualizar informacion relevante');
      }
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${ENDPOINT}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al eliminar informacion relevante');
      }
    } catch (error) {
      // Log removed
      throw error;
    }
  },
};
