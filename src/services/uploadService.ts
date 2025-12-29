import { API_BASE_URL } from '../config/api';
import { getAuthHeadersFormData } from '../utils/apiUtils';

const API_URL = `${API_BASE_URL}/Upload/image`;

export const uploadService = {
  uploadImage: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeadersFormData(),
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al subir la imagen: ${response.status} ${errorText}`);
      }

      // The API returns the URL as a string (text/plain)
      const imageUrl = await response.text();
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },
};
