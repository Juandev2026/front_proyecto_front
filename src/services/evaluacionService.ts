import { API_BASE_URL } from '../config/api';
import {
  SolucionExamenRequest,
  ResultadoExamenResponse,
} from '../types/examen';
import { getAuthHeaders } from '../utils/apiUtils';

export const evaluacionService = {
  calificar: async (
    payload: SolucionExamenRequest
  ): Promise<ResultadoExamenResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/Evaluacion/calificar`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al calificar el examen');
      }

      return await response.json();
    } catch (error) {
      console.error('Error grading exam:', error);
      throw error;
    }
  },
};
