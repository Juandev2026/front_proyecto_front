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
      // Use the simple endpoint for creation as identified
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

  getSubsecciones: async (seccionId: number): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/GestionSecciones/${seccionId}/subsecciones`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener subsecciones');
      return await response.json();
    } catch (error) {
      console.error('Error fetching subsecciones:', error);
      return [];
    }
  },

  createSubseccion: async (seccionId: number, nombre: string): Promise<any> => {
    try {
      // NOTE: User indicated /api/SubSecciones is the endpoint for creation.
      // However, this endpoint doesn't seem to take seccionId.
      // We are creating the entity, but the link to the section might be missing
      // if not handled by another endpoint.
      const response = await fetch(`${API_BASE_URL}/SubSecciones`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nombre, descripcion: 'Descripción por defecto', seccionId }),
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
};
