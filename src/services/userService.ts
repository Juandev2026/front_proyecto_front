import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

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
    nombre: string;
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
}

export const userService = {
  getAll: async (): Promise<User[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener usuarios');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
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
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  create: async (user: Omit<User, 'id'>): Promise<User> => {
    try {
      const payload = {
        ...user,
        id: 0,
        // ensure required fields are present if not strictly typed in Omit
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Error al crear usuario');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  update: async (id: number, user: Partial<User>): Promise<void> => {
    try {
      // Create a shallow copy to modify payload
      const payload = { ...user, id };

      // Remove password if it is empty string or undefined, so backend doesn't try to hash an empty password
      if (!payload.password) {
        delete payload.password;
      }

      console.log('Update Payload:', payload); // Debugging

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Error al actualizar usuario');
      }
    } catch (error) {
      console.error('Error updating user:', error);
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
      console.error('Error deleting user:', error);
      throw error;
    }
  },
};
