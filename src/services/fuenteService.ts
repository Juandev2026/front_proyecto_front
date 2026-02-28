import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface FuenteCategoria {
  modalidadId: number | null;
  nivelId: number | null;
  especialidadId: number | null;
}

export interface Fuente {
  id: number;
  nombre: string;
  descripcion: string;
  tipoExamenId: number;
  categorias: FuenteCategoria[];
  visible: boolean;
  esDefault: boolean;
  tipoExamenNombre?: string;
  cantidadCategorias?: number;
}

export interface CreateFuenteRequest {
  nombre: string;
  descripcion: string;
  tipoExamenId: number;
  categorias: FuenteCategoria[];
}

export const fuenteService = {
  getAll: async (): Promise<Fuente[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/Fuentes`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener fuentes');
      return await response.json();
    } catch (error) {
      console.error('Error fetching fuentes:', error);
      return [];
    }
  },

  create: async (data: CreateFuenteRequest): Promise<Fuente> => {
    try {
      console.log('PAYLOAD ENVIADO A /api/Fuentes:', JSON.stringify(data, null, 2));
      const response = await fetch(`${API_BASE_URL}/Fuentes`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error al crear fuente: ${errText}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error('Error creating fuente:', error);
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  },

  getById: async (id: number): Promise<Fuente> => {
    try {
      const response = await fetch(`${API_BASE_URL}/Fuentes/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener fuente');
      return await response.json();
    } catch (error) {
      console.error('Error fetching fuente by id:', error);
      throw error;
    }
  },

  update: async (
    id: number,
    data: { nombre: string; visible: boolean; esDefault: boolean }
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/Fuentes/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error al actualizar fuente: ${errText}`);
      }
    } catch (error) {
      console.error('Error updating fuente:', error);
      throw error;
    }
  },

  updatePropio: async (
    id: number,
    data: {
      id: number;
      nombre: string;
      descripcion: string;
      tipoExamenId: number;
      visible: boolean;
      categorias: FuenteCategoria[];
    }
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/Fuentes/propios/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error al actualizar fuente propia: ${errText}`);
      }
    } catch (error) {
      console.error('Error updating fuente propia:', error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/Fuentes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al eliminar fuente');
    } catch (error) {
      console.error('Error deleting fuente:', error);
      throw error;
    }
  },
};
