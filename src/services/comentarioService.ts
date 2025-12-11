import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

const API_URL = `${API_BASE_URL}/Comentarios`;

export interface Comentario {
  id: number;
  contenido: string;
  fecha: string;
  noticiaId: number;
  usuarioId: number;
  usuario?: {
    id: number;
    nombreCompleto: string;
    email: string;
  };
}

export const comentarioService = {
  getAll: async (noticiaId: number): Promise<Comentario[]> => {
    try {
      const response = await fetch(`${API_URL}?noticiaId=${noticiaId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener comentarios');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  create: async (comentario: { contenido: string; noticiaId: number; usuarioId: number }): Promise<Comentario> => {
    try {
      // The API likely expects a structure similar to what we observed in other services
      // We'll send the basic fields.
      const payload = {
        id: 0,
        contenido: comentario.contenido,
        fecha: new Date().toISOString(),
        noticiaId: comentario.noticiaId,
        usuarioId: comentario.usuarioId
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Error al crear comentario');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating comment:', error);
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
        throw new Error('Error al eliminar comentario');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },
};
