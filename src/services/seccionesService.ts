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
      const response = await fetch(`${API_BASE_URL}/Secciones`, {
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
      const response = await fetch(`${API_BASE_URL}/Secciones`, {
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

  update: async (id: number, data: Partial<CreateSeccionRequest>): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/Secciones/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, ...data }),
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
      const response = await fetch(`${API_BASE_URL}/Secciones/${id}`, {
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
