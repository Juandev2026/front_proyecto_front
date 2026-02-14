import { API_BASE_URL } from '../config/api';
import { getAuthHeaders, getPublicHeaders } from '../utils/apiUtils';

const API_URL = `${API_BASE_URL}/Especialidades`;

export interface Especialidad {
  id: number;
  nombre: string;
  nivelId: number | number[]; // Can be array or number
  nivel?: {
    id: number;
    nombre: string;
  };
}

export interface CreateEspecialidadRequest {
  nombre: string;
  nivelId: number;
}

export interface UpdateEspecialidadRequest {
  nombre: string;
  nivelId: number;
}

export const especialidadesService = {
  getAll: async (): Promise<Especialidad[]> => {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: getPublicHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener especialidades');
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  getById: async (id: number): Promise<Especialidad> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener especialidad');
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  getByNivel: async (nivelId: number): Promise<Especialidad[]> => {
    try {
      const all = await especialidadesService.getAll();
      return all.filter((e) => e.nivelId === nivelId);
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  create: async (data: CreateEspecialidadRequest): Promise<Especialidad> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al crear especialidad');
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  update: async (
    id: number,
    data: UpdateEspecialidadRequest
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al actualizar especialidad');
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
      if (!response.ok) throw new Error('Error al eliminar especialidad');
    } catch (error) {
      // Log removed
      throw error;
    }
  },
};
