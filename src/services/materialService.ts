import { API_BASE_URL } from '../config/api';
import { getAuthHeaders, getAuthHeadersFormData } from '../utils/apiUtils';

export interface Material {
  id: number;
  titulo: string;
  descripcion: string;
  url: string;
  categoriaId: number;
  categoria?: { id: number; nombre: string };
  modalidadId: number;
  modalidad?: { id: number; nombre: string };
  nivelId: number;
  nivel?: { id: number; nombre: string };
  usuarioEdicionId: number;
  precio: number;
  telefono: string;
}

const API_URL = `${API_BASE_URL}/Materiales`;

export const materialService = {
  getAll: async (): Promise<Material[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener materiales');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching materials:', error);
      throw error;
    }
  },

  getByNivel: async (id: number): Promise<Material[]> => {
    try {
      const response = await fetch(`${API_URL}/nivel/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener materiales por nivel');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching materials by level ${id}:`, error);
      throw error;
    }
  },

  create: async (
    material: Omit<Material, 'id'> | FormData
  ): Promise<Material> => {
    try {
      const isFormData = material instanceof FormData;
      let body: string | FormData;
      const headers = isFormData ? getAuthHeadersFormData() : getAuthHeaders();

      if (isFormData) {
        const fd = material as FormData;
        if (!fd.has('modalidadId') || fd.get('modalidadId') === '0') {
          fd.delete('modalidadId');
        }
        if (!fd.has('nivelId') || fd.get('nivelId') === '0') {
          fd.delete('nivelId');
        }
        if (!fd.has('usuarioEdicionId') || fd.get('usuarioEdicionId') === '0') {
          // optional handling if needed
        }
        body = fd;
      } else {
        const m = material as Material;
        body = JSON.stringify({
          ...m,
          modalidadId: m.modalidadId ? Number(m.modalidadId) : null,
          nivelId: m.nivelId ? Number(m.nivelId) : null,
          usuarioEdicionId: m.usuarioEdicionId
            ? Number(m.usuarioEdicionId)
            : null,
          precio: m.precio ? Number(m.precio) : 0,
          telefono: m.telefono || '',
        });
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Create material error:', errText);
        throw new Error(`Error al crear el material: ${errText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  },

  update: async (
    id: number,
    material: Material | FormData
  ): Promise<Material> => {
    try {
      const isFormData = material instanceof FormData;
      let body: string | FormData;
      const headers = isFormData ? getAuthHeadersFormData() : getAuthHeaders();

      if (isFormData) {
        const fd = material as FormData;
        if (!fd.has('id')) fd.append('id', String(id));
        if (!fd.has('modalidadId') || fd.get('modalidadId') === '0') {
          fd.delete('modalidadId');
        }
        if (!fd.has('nivelId') || fd.get('nivelId') === '0') {
          fd.delete('nivelId');
        }
        body = fd;
      } else {
        const m = material as Material;
        body = JSON.stringify({
          ...m,
          id,
          modalidadId: m.modalidadId ? Number(m.modalidadId) : null,
          nivelId: m.nivelId ? Number(m.nivelId) : null,
          usuarioEdicionId: m.usuarioEdicionId
            ? Number(m.usuarioEdicionId)
            : null,
          precio: m.precio ? Number(m.precio) : 0,
          telefono: m.telefono || '',
        });
      }

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers,
        body,
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Update material error:', errText);
        throw new Error(`Error al actualizar el material: ${errText}`);
      }

      // Check if response has content before parsing JSON
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as Material);
    } catch (error) {
      console.error(`Error updating material with id ${id}:`, error);
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
        throw new Error('Error al eliminar el material');
      }
    } catch (error) {
      console.error(`Error deleting material with id ${id}:`, error);
      throw error;
    }
  },
};
