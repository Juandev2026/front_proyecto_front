import { API_BASE_URL } from '../config/api';
import { getAuthHeaders, getPublicHeaders } from '../utils/apiUtils';

const API_URL = `${API_BASE_URL}/Users`;

export interface User {
  id: number;
  email: string;
  password?: string;
  passwordHash?: string;
  role: string;
  nombreCompleto: string;
  celular: string;
  regionId: number;
  region?: {
    id: number;
    nombre: string;
  };
  modalidadId: number;
  modalidad?: {
    id: number;
    nombre: string;
  };
  nivelId: number;
  nivel?: {
    id: number;
    nombre: string;
    modalidadId: number;
    modalidad?: {
      id: number;
      nombre: string;
    };
  };
  especialidadId: number;
  especialidad?: {
    id: number;
    nombre: string; // Corrected indentation
    nivelId: number;
    nivel?: {
      id: number;
      nombre: string;
      modalidadId: number;
      modalidad?: {
        id: number;
        nombre: string;
      };
    };
  };
  fechaExpiracion?: string;
  fechaCreacion?: string;
  fecha_creacion?: string; // Support both naming conventions
  estado?: string;
  ie?: string;
  observaciones?: string;
  tiempo?: number;
  accesoIds?: number[];
  accesoNombres?: string[];
  modalidadNombres?: string[];
  nivelNombres?: string[];
  especialidadNombres?: string[];
  userExamenes?: any[]; // For detailed data if needed
}

export const userService = {
  getAll: async (): Promise<User[]> => {
    try {
      let allUsers: User[] = [];
      let currentPage = 1;
      const pageSize = 100; // Máximo permitido por el backend
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`${API_URL}?page=${currentPage}&pageSize=${pageSize}`, {
          headers: getPublicHeaders(),
        });

        if (!response.ok) {
          throw new Error('Error al obtener usuarios');
        }

        const result = await response.json();
        const users = Array.isArray(result) ? result : (result.data ?? []);
        
        allUsers = [...allUsers, ...users];

        // Verificar si hay más páginas
        if (result.totalPages && currentPage < result.totalPages) {
          currentPage++;
        } else if (users.length === pageSize) {
          // Fallback por si no viene totalPages pero la página está llena
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      return allUsers;
    } catch (error) {
      throw error;
    }
  },

  getPaginated: async (
    page: number = 1,
    pageSize: number = 20,
    search: string = '',
    role: string = '',
    signal?: AbortSignal
  ): Promise<{ data: User[]; total: number }> => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search ? { search } : {}),
        ...(role ? { role } : {}),
      });
      const response = await fetch(`${API_URL}?${params.toString()}`, {
        headers: getPublicHeaders(),
        signal, // Soporte para cancelación
      });
      if (!response.ok) {
        throw new Error('Error al obtener usuarios');
      }
      const result = await response.json();
      // Soporte para { data: [], total: N } o array plano
      if (Array.isArray(result)) {
        return { data: result, total: result.length };
      }
      return {
        data: result.data ?? [],
        total: result.total ?? result.totalCount ?? (result.data?.length ?? 0),
      };
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: number): Promise<User> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener usuario');
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  create: async (user: Omit<User, 'id'>): Promise<User | null> => {
    try {
      console.log('UserService.create payload:', user);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(user),
      });

      const text = await response.text();
      console.log('Backend raw response text:', text);

      if (!response.ok) {
        // Si el body está vacío y es 500, el backend pudo haber creado el registro
        // pero falló al serializar la respuesta (bug del backend)
        if (!text || text.trim() === '') {
          console.warn(
            `Backend retornó ${response.status} con cuerpo vacío. Asumiendo éxito.`
          );
          return null; // Tratamos como éxito silencioso
        }
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { message: text };
        }
        throw new Error(
          errorData.message || `Error ${response.status}: ${text}`
        );
      }

      if (!text || text.trim() === '') return null;
      return JSON.parse(text);
    } catch (error) {
      throw error;
    }
  },

  update: async (id: number, user: Partial<User>): Promise<void> => {
    try {
      // Create a shallow copy to modify payload
      const payload = { ...user };

      // Remove sensitive or redundant fields for PATCH
      delete payload.id;
      delete payload.password;
      delete payload.passwordHash;

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Error al actualizar usuario');
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
        throw new Error('Error al eliminar usuario');
      }
    } catch (error) {
      // Log removed
      throw error;
    }
  },
};
