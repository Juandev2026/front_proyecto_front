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
  ie?: string;
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
  years?: YearQuestionCount[];
}

export interface YearQuestionCount {
  year: number;
  cantidadPreguntas: number;
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
  especialidadId: number | null;
  especialidadNombre: string | null;
  year?: string;
  years?: YearQuestionCount[];
  cantidadPreguntas: number;
  clasificaciones: ClasificacionExamen[];
}

export interface LoginResponse {
  token: string;
  fullName: string;
  email: string;
  role: string;
  id: number;
  nivelId?: number | null;
  modalidadId?: number | null;
  especialidad?: string;
  especialidadId?: number | null;
  accesoIds?: number[];
  accesoNombres?: string[];
  fechaExpiracion?: string;
  userExamenes?: any[];
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
        ie: data.ie,
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

  login: async (data: LoginRequest): Promise<LoginResponse> => {
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
      throw error;
    }
  },

  getUserFilters: async (
    userId: number,
    token?: string
  ): Promise<LoginApiResponse> => {
    try {
      if (userId === undefined || userId === null || isNaN(userId)) {
        console.error('getUserFilters called with invalid userId:', userId);
        throw new Error('ID de usuario no válido');
      }

      const headers: any = {
        Accept: 'application/json',
      };

      const authToken = token || localStorage.getItem('token');
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      console.log(`Fetching filters for user ${userId}...`);
      const response = await fetch(`${apiAuth}/user-filters/${userId}`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching user filters:', response.status, errorText);
        throw new Error('Error al obtener filtros del usuario');
      }

      return await response.json();
    } catch (error) {
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
      const headers: any = {
        Accept: 'application/json',
      };

      const token = localStorage.getItem('token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${apiAuth}/status`, {
        method: 'GET',
        headers: headers,
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
