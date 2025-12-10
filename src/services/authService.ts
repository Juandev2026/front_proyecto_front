export interface RegisterData {
  fullName: string;
  email: string;
  passwordHash: string;
  role: string;
}

export interface RegisterRequest {
  id?: number;
  email: string;
  passwordHash?: string;
  role?: string;
  nombreCompleto: string;
  celular: string;
  password?: string;
  regionId: number;
  modalidadId: number;
  nivelId: number;
}

export interface RegisterResponse {
  id: number;
  email: string;
  nombreCompleto: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  fullName: string;
  email: string;
  role: string;
}

import { API_BASE_URL } from '../config/api';

const API_Auth = `${API_BASE_URL}/Auth`;

import { getAuthHeaders } from '../utils/apiUtils';

export const authService = {
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    try {
      // Ensure payload matches specific /Auth/register schema
      const payload = {
        nombreCompleto: data.nombreCompleto,
        email: data.email,
        password: data.password,
        role: 'Client', // Forced as per standard registration
        regionId: Number(data.regionId), // User requested regionId
        celular: data.celular,
        modalidadId: Number(data.modalidadId),
        nivelId: Number(data.nivelId)
      };

      const response = await fetch(`${API_Auth}/register`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(), // Includes 'Content-Type': 'application/json' and 'Authorization'
          Accept: 'text/plain',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error en el registro');
      }

      // Backend returns 201 Created or 200 OK often with created object or just ID.
      // Assuming it returns JSON similar to input or ID.
      // If text/plain, handle accordingly.
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // Fallback for text response
        return {} as RegisterResponse; 
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${API_Auth}/login`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error en el inicio de sesión');
      }

      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
};
