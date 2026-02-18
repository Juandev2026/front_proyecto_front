import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface SeccionRecurso {
  idSeccion: number;
  idSubSeccion: number;
  pdf: string;
  imagen: string;
  nombreArchivo: string;
  numero: number;
  descripcionSeccion: string;
  descripcionSubSeccion: string;
}

export interface RecursoAnidado {
  idSeccionGestion: number;
  idSubSeccion: number;
  pdf: string;
  imagen: string;
  nombreArchivo: string;
  numero: number;
}

export interface SubSeccionAnidada {
  id: number;
  nombre: string;
  descripcion: string;
  recursos: RecursoAnidado[];
}

export interface SeccionAnidada {
  id: number;
  nombre: string;
  descripcion: string;
  subSecciones: SubSeccionAnidada[];
}

export interface CreateSeccionRecursoRequest {
  idSeccion: number;
  idSubSeccion: number;
  pdf: string;
  imagen: string;
  nombreArchivo: string;
}

export const seccionRecursosService = {
  getAll: async (): Promise<SeccionRecurso[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/SeccionRecursos`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener recursos de sección');
      return await response.json();
    } catch (error) {
      console.error('Error fetching seccion recursos:', error);
      return [];
    }
  },

  getBySeccion: async (idSeccion: number): Promise<SeccionRecurso[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/SeccionRecursos/seccion/${idSeccion}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener recursos por sección');
      return await response.json();
    } catch (error) {
      console.error('Error fetching recursos by seccion:', error);
      return [];
    }
  },

  getBySubseccion: async (idSubSeccion: number): Promise<SeccionRecurso[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/SeccionRecursos/subseccion/${idSubSeccion}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener recursos por subsección');
      return await response.json();
    } catch (error) {
      console.error('Error fetching recursos by subseccion:', error);
      return [];
    }
  },

  getByIds: async (idSeccion: number, idSubSeccion: number): Promise<SeccionRecurso> => {
    try {
      const response = await fetch(`${API_BASE_URL}/SeccionRecursos/${idSeccion}/${idSubSeccion}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener el recurso');
      return await response.json();
    } catch (error) {
      console.error('Error fetching seccion recurso:', error);
      throw error;
    }
  },

  create: async (data: CreateSeccionRecursoRequest): Promise<SeccionRecurso> => {
    try {
      const response = await fetch(`${API_BASE_URL}/SeccionRecursos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error al crear recurso de sección: ${errText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating seccion recurso:', error);
      throw error;
    }
  },

  update: async (idSeccion: number, idSubSeccion: number, data: CreateSeccionRecursoRequest): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/SeccionRecursos/${idSeccion}/${idSubSeccion}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error al actualizar recurso de sección: ${errText}`);
      }
    } catch (error) {
      console.error('Error updating seccion recurso:', error);
      throw error;
    }
  },

  delete: async (idSeccion: number, idSubSeccion: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/SeccionRecursos/${idSeccion}/${idSubSeccion}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al eliminar recurso de sección');
    } catch (error) {
      console.error('Error deleting seccion recurso:', error);
      throw error;
    }
  },

  getDatosAnidados: async (): Promise<SeccionAnidada[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/SeccionRecursos/datos-anidados`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener datos anidados');
      return await response.json();
    } catch (error) {
      console.error('Error fetching nested data:', error);
      return [];
    }
  }
};
