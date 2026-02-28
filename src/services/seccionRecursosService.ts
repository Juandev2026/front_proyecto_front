import FormData from 'form-data';
import { API_BASE_URL } from '../config/api';
import { getAuthHeaders, getAuthHeadersFormData } from '../utils/apiUtils';

export interface SeccionAnidada {
  id: number;
  nombre: string;
  descripcion: string;
  subSecciones: SubSeccionAnidada[];
}

export interface SubSeccionAnidada {
  id: number;
  nombre: string;
  descripcion: string;
  recurso: RecursoAnidado[];
}

export interface RecursoAnidado {
  idSeccionGestion: number;
  idSubSeccion: number;
  pdf: string;
  imagen: string;
  nombreArchivo: string;
  numero: number;
}

export interface CreateSeccionRecursoRequest {
  idSeccion: number;
  idSubSeccion: number;
  pdf: string;
  imagen: string;
  nombreArchivo: string;
}

export const seccionRecursosService = {

  create: async (formData: FormData): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/SeccionRecursos`, {
        method: 'POST',
        headers: getAuthHeadersFormData(),
        body: formData as any,
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error al crear recurso: ${errText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  },

  update: async (
    idSeccion: number,
    idSubSeccion: number,
    numero: number,
    data: FormData
  ): Promise<void> => {
    try {
      // The API expects 'multipart/form-data'. We let the browser set the Content-Type with boundary.
      // We only send Authorization header.
      const response = await fetch(
        `${API_BASE_URL}/SeccionRecursos/${idSeccion}/${idSubSeccion}/${numero}`,
        {
          method: 'PUT',
          headers: getAuthHeadersFormData(),
          body: data as any,
        }
      );
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error al actualizar recurso de sección: ${errText}`);
      }
    } catch (error) {
      console.error('Error updating seccion recurso:', error);
      throw error;
    }
  },

  delete: async (
    idSeccion: number,
    idSubSeccion: number,
    numero: number
  ): Promise<void> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/SeccionRecursos/${idSeccion}/${idSubSeccion}/${numero}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );
      if (!response.ok) throw new Error('Error al eliminar recurso de sección');
    } catch (error) {
      console.error('Error deleting seccion recurso:', error);
      throw error;
    }
  },

  deleteBySeccion: async (idSeccion: number): Promise<void> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/SeccionRecursos/seccion/${idSeccion}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );
      if (!response.ok)
        throw new Error('Error al eliminar todos los recursos de la sección');
    } catch (error) {
      console.error('Error deleting resources by seccion:', error);
      throw error;
    }
  },

  deleteBySubseccion: async (
    idSeccion: number,
    idSubSeccion: number
  ): Promise<void> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/SeccionRecursos/${idSeccion}/${idSubSeccion}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );
      if (!response.ok)
        throw new Error('Error al eliminar recursos de la subsección');
    } catch (error) {
      console.error('Error deleting resources by subseccion:', error);
      throw error;
    }
  },

  getDatosAnidados: async (): Promise<SeccionAnidada[]> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/SeccionRecursos/datos-anidados`,
        {
          headers: getAuthHeaders(),
        }
      );
      if (!response.ok) throw new Error('Error al obtener datos anidados');
      return await response.json();
    } catch (error) {
      console.error('Error fetching nested data:', error);
      return [];
    }
  },

  reorder: async (items: { id: number; orden: number }[]): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/SeccionRecursos/reorder`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(items),
      });
      if (!response.ok) throw new Error('Error al reordenar recursos');
    } catch (error) {
      console.error('Error reordering resources:', error);
      throw error;
    }
  },
};
