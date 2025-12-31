import { getAuthHeadersFormData } from '../utils/apiUtils';

// Bypass proxy to avoid socket hang up and debug CORS/Server issues directly
const API_URL = '/api/proxy_upload_image';

export const uploadService = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeadersFormData(),
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      // // Log removed
      throw new Error(
        `Error al subir la imagen: ${response.status} ${errorText}`
      );
    }

    // The API returns the URL. It might be a plain string or a JSON object { url: "..." }
    const responseData = await response.json();
    const imageUrl = responseData.url || responseData;

    return imageUrl;
  },
};
