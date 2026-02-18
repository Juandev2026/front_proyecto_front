import { API_BASE_URL } from '../config/api';
import { getAuthHeadersFormData } from '../utils/apiUtils';

export const uploadService = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const headers = getAuthHeadersFormData();

    try {
      const response = await fetch(`${API_BASE_URL}/Upload/image`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error al subir el archivo: ${response.status} ${errorText}`
        );
      }

      // The API returns the URL as a string in the body based on Swagger
      // But let's handle potential JSON wrapping just in case
      const responseText = await response.text();
      try {
        const json = JSON.parse(responseText);
        return json.url || json; // Adjust based on actual response
      } catch (e) {
        return responseText; // It's likely just the URL string
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },
};
