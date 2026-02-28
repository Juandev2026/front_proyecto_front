import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface Seccion {
  id: number;
  nombre: string;
  descripcion: string;
  tipoExamenId: number;
  modalidadId: number;
  nivelId: number;
  especialidadId: number;
  tipoExamenNombre: string;
  modalidadNombre: string;
  nivelNombre: string;
  especialidadNombre: string;
  esVisible: boolean;
  esDefault: boolean;
  categorias: { id: number; descripcion: string }[];
  cantidadCategorias: number;
}

export interface CreateSeccionRequest {
  nombre: string;
  descripcion: string;
  tipoExamenId?: number;
  modalidadId?: number;
  nivelId?: number;
  especialidadId?: number;
  esVisible?: boolean;
  esDefault?: boolean;
  categoriasIds?: number[];
  subSeccionesIds?: number[];
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

  getById: async (id: number): Promise<Seccion> => {
    try {
      const response = await fetch(`${API_BASE_URL}/Secciones/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/Secciones/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
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

  getSubsecciones: async (seccionId: number): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/Secciones/${seccionId}/subsecciones`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener subsecciones');
      return await response.json();
    } catch (error) {
      console.error('Error fetching subsecciones:', error);
      return [];
    }
  },

  createSubseccion: async (seccionId: number, nombre: string, descripcion: string = 'Descripción por defecto'): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/Secciones/${seccionId}/subsecciones`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nombre,
          descripcion,
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error al crear subsección: ${errText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating subseccion:', error);
      throw error;
    }
  },

  updateSubseccion: async (id: number, nombre: string, descripcion: string = 'Descripción por defecto'): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/SubSecciones/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nombre,
          descripcion,
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error al actualizar subsección: ${errText}`);
      }
    } catch (error) {
      console.error('Error updating subseccion:', error);
      throw error;
    }
  },

  deleteSubseccion: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/SubSecciones/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al eliminar subsección');
    } catch (error) {
      console.error('Error deleting subseccion:', error);
      throw error;
    }
  },

  reorderSecciones: async (items: { id: number; orden: number }[]): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/Secciones/reorder`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(items),
      });
      if (!response.ok) throw new Error('Error al reordenar secciones');
    } catch (error) {
      console.error('Error reordering secciones:', error);
      throw error;
    }
  },

  reorderSubsecciones: async (items: { id: number; orden: number }[]): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/SubSecciones/reorder`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(items),
      });
      if (!response.ok) throw new Error('Error al reordenar subsecciones');
    } catch (error) {
      console.error('Error reordering subsecciones:', error);
      throw error;
    }
  },
};
