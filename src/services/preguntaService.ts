import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface EnunciadoItem {
  id: number;
  contenido: string;
}

export interface Pregunta {
  id: number;
  enunciado?: string;
  alternativaA?: string;
  alternativaB?: string;
  alternativaC?: string;
  alternativaD?: string;
  respuesta?: string | number;
  sustento?: string;
  examenId: number;
  clasificacionId?: number;
  imagen?: string;
  tipoPreguntaId: number;
  preguntaId?: number; // ID del Padre (si existe)
  numero?: number;     // Orden de la sub-pregunta
  year?: string;
  enunciados?: EnunciadoItem[];
  subPreguntas?: any[];
}

export interface ExamenFilterRequest {
  tipoExamenId?: number;
  fuenteId?: number;
  modalidadId?: number;
  nivelId?: number;
  especialidadId?: number;
  year?: string;
}

const API_URL = `${API_BASE_URL}/Preguntas`;

export const preguntaService = {
  getAll: async (): Promise<Pregunta[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener preguntas');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: number): Promise<Pregunta> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener la pregunta');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
  
  create: async (item: Omit<Pregunta, 'id'>): Promise<Pregunta> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        throw new Error('Error al crear la pregunta');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  update: async (examenId: number, id: number, item: Partial<Pregunta>): Promise<Pregunta> => {
    try {
      // Stripping 'id' from the body as per the provided API schema
      const { id: _ignoredId, ...payload } = item;
      
      const response = await fetch(`${API_URL}/${examenId}/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Error al actualizar la pregunta');
      }
      
      const text = await response.text();
      const updatedData = text ? JSON.parse(text) : payload;
      
      // Ensure the returned object has the ID so UI components can update correctly
      return { ...updatedData, id } as Pregunta;
    } catch (error) {
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
        throw new Error('Error al eliminar la pregunta');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crear una sola pregunta (Padre) y retornar el objeto con ID
   */
  createSingle: async (item: Partial<Pregunta>): Promise<Pregunta> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Error al crear pregunta padre: ${err}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // --- NEW ENDPOINTS FOR EXAM-CENTRIC LOGIC ---

  getByExamenId: async (examenId: number): Promise<Pregunta[]> => {
    try {
      const response = await fetch(`${API_URL}/examen/${examenId}`, {
         headers: getAuthHeaders(),
      });

      if (response.status === 404) {
         // Exam not found or handled by API returning 404
         return [];
      }
      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
       console.error("Error fetching questions by exam:", error);
       return [];
    }
  },

  createForExamen: async (examenId: number, questions: Partial<Pregunta>[]): Promise<Pregunta[]> => {
     try {
        const response = await fetch(`${API_URL}/examen/${examenId}`, {
           method: 'POST',
           headers: {
              ...getAuthHeaders(),
              'Content-Type': 'application/json'
           },
           body: JSON.stringify(questions)
        });

        if (!response.ok) {
           const err = await response.text();
           throw new Error(`Error creating questions: ${err}`);
        }
        return await response.json();
     } catch (error) {
        throw error;
     }
  },

  examenFilter: async (filter: ExamenFilterRequest): Promise<Pregunta[]> => {
    try {
      const response = await fetch(`${API_URL}/examen-filter`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filter),
      });
      if (!response.ok) {
        throw new Error('Error filtering questions');
      }
      return await response.json();
    } catch (error) {
      console.error("Error in examenFilter:", error);
      return [];
    }
  }
};
