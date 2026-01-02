import { API_BASE_URL } from '../config/api';
import { getAuthHeaders, getAuthHeadersFormData, getPublicHeaders } from '../utils/apiUtils';

const API_URL = `${API_BASE_URL}/Niveles`;

export interface Nivel {
  id: number;
  nombre: string;
  imageUrl?: string;
  modalidadId: number;
  modalidad?: {
    id: number;
    nombre: string;
  };
}

export const nivelService = {
  getAll: async (): Promise<Nivel[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getPublicHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener niveles');
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  getByModalidadId: async (modalidadId: number): Promise<Nivel[]> => {
    try {
      // Fallback to fetch all and filter
      const response = await fetch(API_URL, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Error fetching levels');
      const all: Nivel[] = await response.json();
      return all.filter((n) => n.modalidadId === modalidadId);
    } catch (error) {
      // Log removed
      return [];
    }
  },

  create: async (
    nivel: { nombre: string; imageUrl?: string; modalidadId: number } | FormData
  ): Promise<Nivel> => {
    try {
      const isFormData = nivel instanceof FormData;
      let body: string | FormData;
      const headers = isFormData ? getAuthHeadersFormData() : getAuthHeaders();

      if (isFormData) {
        body = nivel as FormData;
      } else {
        const n = nivel as {
          nombre: string;
          imageUrl?: string;
          modalidadId: number;
        };
        body = JSON.stringify({
          id: 0,
          nombre: n.nombre,
          imageUrl: n.imageUrl || '',
          modalidadId: n.modalidadId,
          modalidad: { id: n.modalidadId },
        });
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body,
      });
      if (!response.ok) {
        throw new Error('Error al crear nivel');
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  update: async (
    id: number,
    nivel: { nombre: string; imageUrl?: string; modalidadId: number } | FormData
  ): Promise<void> => {
    try {
      const isFormData = nivel instanceof FormData;
      let body: string | FormData;
      const headers = isFormData ? getAuthHeadersFormData() : getAuthHeaders();

      if (isFormData) {
        const fd = nivel as FormData;
        if (!fd.has('id')) fd.append('id', String(id));
        body = fd;
      } else {
        const n = nivel as {
          nombre: string;
          imageUrl?: string;
          modalidadId: number;
        };
        body = JSON.stringify({
          id,
          nombre: n.nombre,
          imageUrl: n.imageUrl || '',
          modalidadId: n.modalidadId,
          modalidad: { id: n.modalidadId },
        });
      }

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers,
        body,
      });
      if (!response.ok) {
        throw new Error('Error al actualizar nivel');
      }
    } catch (error) {
      // Log removed
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
        const errorText = await response.text();
        console.error(
          `Error deleting level ${id}: ${response.status} ${errorText}`
        );
        throw new Error(
          `Error ${response.status} al eliminar nivel: ${errorText}`
        );
      }
    } catch (error) {
      // Log removed
      throw error;
    }
  },
};
