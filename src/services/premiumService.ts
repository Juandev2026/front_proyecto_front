import { API_BASE_URL } from '../config/api';
import { getAuthHeaders, getAuthHeadersFormData } from '../utils/apiUtils';

export interface PremiumContent {
  id: number;
  titulo: string;
  descripcion: string;
  url: string;
  imageUrl?: string;
  archivoUrl?: string;
  videoUrl?: string;
  estadoId: number;
  estado?: { id: number; nombre: string; codigo: string; colorHex: string };
  usuarioEdicionId: number;
  fechaEdicion?: string;
  precio: number;
  telefono: string;
}

const API_URL = `${API_BASE_URL}/Premium`;

export const premiumService = {
  getAll: async (): Promise<PremiumContent[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener contenido premium');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: number): Promise<PremiumContent> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener el contenido premium');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  create: async (
    item: Omit<PremiumContent, 'id'> | FormData
  ): Promise<PremiumContent> => {
    try {
      const isFormData = item instanceof FormData;
      let body: string | FormData;
      const headers = isFormData ? getAuthHeadersFormData() : getAuthHeaders();

      if (isFormData) {
        const fd = item as FormData;
        if (!fd.has('estadoId') || fd.get('estadoId') === '0') {
            fd.delete('estadoId'); 
        }
        body = fd;
      } else {
        const m = item as PremiumContent;
        body = JSON.stringify({
          ...m,
          estadoId: m.estadoId ? Number(m.estadoId) : null,
          usuarioEdicionId: m.usuarioEdicionId
            ? Number(m.usuarioEdicionId)
            : null,
          precio: m.precio ? Number(m.precio) : 0,
        });
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error al crear el contenido premium: ${errText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  update: async (
    id: number,
    item: PremiumContent | FormData
  ): Promise<PremiumContent> => {
    try {
      const isFormData = item instanceof FormData;
      let body: string | FormData;
      const headers = isFormData ? getAuthHeadersFormData() : getAuthHeaders();

      if (isFormData) {
        const fd = item as FormData;
        if (!fd.has('id')) fd.append('id', String(id));
        if (!fd.has('estadoId') || fd.get('estadoId') === '0') {
            fd.delete('estadoId');
        }
        body = fd;
      } else {
        const m = item as PremiumContent;
        body = JSON.stringify({
          ...m,
          id,
          estadoId: m.estadoId ? Number(m.estadoId) : null,
          usuarioEdicionId: m.usuarioEdicionId
            ? Number(m.usuarioEdicionId)
            : null,
          precio: m.precio ? Number(m.precio) : 0,
        });
      }

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers,
        body,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error al actualizar el contenido premium: ${errText}`);
      }

      const text = await response.text();
      return text ? JSON.parse(text) : ({} as PremiumContent);
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
        throw new Error('Error al eliminar el contenido premium');
      }
    } catch (error) {
      throw error;
    }
  },
};
