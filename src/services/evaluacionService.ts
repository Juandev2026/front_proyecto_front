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
        const errorText = await response.text();
        console.error('Full grade error response:', errorText);
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {}
        throw new Error(errorData.message || errorData.title || errorText || 'Error al calificar el examen');
      }

      return await response.json();
    } catch (error) {
      console.error('Error grading exam:', error);
      throw error;
    }
  },
};
