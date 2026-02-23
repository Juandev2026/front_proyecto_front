import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface RegisterData {
  fullName: string;
  email: string;
  passwordHash: string;
  role: string;
}

export interface RegisterRequest {
  nombreCompleto: string;
  email: string;
  password: string;
  role?: string;
  regionId: number;
  celular: string;
  modalidadId: number;
  nivelId: number;
  especialidadId: number;
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

export interface ClasificacionExamen {
  clasificacionId: number;
  clasificacionNombre: string;
  cantidadPreguntas: number;
  puntos?: number;
  tiempoPregunta?: number;
  minimo?: number;
}

export interface ExamenLogin {
  id: number;
  tipoExamenId: number;
  tipoExamenNombre: string;
  fuenteId: number;
  fuenteNombre: string;
  modalidadId: number;
  modalidadNombre: string;
  nivelId: number;
  nivelNombre: string;
  especialidadId: number;
  especialidadNombre: string;
  years: number[];
  cantidadPreguntas: number;
  clasificaciones: ClasificacionExamen[];
}

export interface LoginResponse {
  token: string;
  fullName: string;
  email: string;
  role: string;
  id: number;
  nivelId: number | null;
  modalidadId?: number | null;
  especialidad?: string;
  especialidadId?: number | null;
  accesoIds?: number[];
  accesoNombres?: string[];
}

export interface LoginApiResponse {
  user: LoginResponse;
  examenes: ExamenLogin[];
}


export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

const apiAuth = `${API_BASE_URL}/Auth`;

export const authService = {
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    try {
      // Payload should match RegisterRequest exactly now
      // Convert 0 to null for optional fields to avoid FK constraint violations if backend expects proper FKs
      const payload = {
        nombreCompleto: data.nombreCompleto,
        email: data.email,
        password: data.password,
        role: data.role || 'Client',
        regionId: Number(data.regionId),
        celular: data.celular,
        modalidadId: data.modalidadId ? Number(data.modalidadId) : null,
        nivelId: data.nivelId ? Number(data.nivelId) : null,
        especialidadId: data.especialidadId
          ? Number(data.especialidadId)
          : null,
      };

      const response = await fetch(`${apiAuth}/register`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(), // Keep existing helpers but ensure content-type
          'Content-Type': 'application/json',
          Accept: 'text/plain',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error en el registro');
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return {} as RegisterResponse;
    } catch (error) {
      // // Log removed
      throw error;
    }
  },

  login: async (data: LoginRequest): Promise<LoginApiResponse> => {
    try {
      const response = await fetch(`${apiAuth}/login`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
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
      // // Log removed
      throw error;
    }
  },

  forgotPassword: async (email: string): Promise<void> => {
    try {
      const response = await fetch(`${apiAuth}/forgot-password`, {
        method: 'POST',
        headers: {
          // No auth headers needed usually for forgot password
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || 'Error al solicitar recuperación de contraseña'
        );
      }
    } catch (error) {
      // // Log removed
      throw error;
    }
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    try {
      const response = await fetch(`${apiAuth}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al restablecer la contraseña');
      }
    } catch (error) {
      // // Log removed
      throw error;
    }
  },

  checkStatus: async (): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${apiAuth}/status`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al verificar el estado');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};
