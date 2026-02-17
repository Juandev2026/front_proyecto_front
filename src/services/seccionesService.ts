import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface Seccion {
  id: number;
  nombre: string;
  descripcion: string;
  tipoExamenId: number | null;
  modalidadId: number | null;
  nivelId: number | null;
  especialidadId: number | null;
  tipoExamenNombre?: string;
  modalidadNombre?: string;
  nivelNombre?: string;
  especialidadNombre?: string;
  estado?: string;
  categoriasCount?: number;
}

export interface CreateSeccionRequest {
  nombre: string;
  descripcion: string;
  tipoExamenId: number | null;
  modalidadId: number | null;
  nivelId: number | null;
  especialidadId: number | null;
}

export const seccionesService = {
  getAll: async (): Promise<Seccion[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/GestionSecciones`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener secciones');
      return await response.json();
    } catch (error) {
      console.error('Error fetching secciones:', error);
      return [];
    }
  },

  create: async (data: CreateSeccionRequest): Promise<Seccion> => {
    try {
      const response = await fetch(`${API_BASE_URL}/GestionSecciones`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error al crear sección: ${errText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating seccion:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Seccion> => {
    try {
      const response = await fetch(`${API_BASE_URL}/GestionSecciones/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener sección');
      return await response.json();
    } catch (error) {
      console.error('Error fetching seccion by id:', error);
      throw error;
    }
  },

  update: async (id: number, data: CreateSeccionRequest): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/GestionSecciones/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...data }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error al actualizar sección: ${errText}`);
      }
    } catch (error) {
      console.error('Error updating seccion:', error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/GestionSecciones/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al eliminar sección');
    } catch (error) {
      console.error('Error deleting seccion:', error);
      throw error;
    }
  },
};
