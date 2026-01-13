import { API_BASE_URL } from '../config/api';
import { getAuthHeaders, getAuthHeadersFormData, getPublicHeaders } from '../utils/apiUtils';

export interface Material {
  id: number;
  titulo: string;
  descripcion: string;
  url: string;
  imageUrl?: string;
  archivoUrl?: string;
  videoUrl?: string;
  categoriaId: number;
  categoria?: { 
    id: number; 
    nombre: string;
    materiales?: string[];
  };
  modalidadId: number;
  modalidad?: { id: number; nombre: string };
  nivelId: number;
  nivel?: { 
    id: number; 
    nombre: string;
    imageUrl?: string;
    modalidadId?: number;
    modalidad?: { id: number; nombre: string };
  };
  estadoId: number;
  estado?: { id: number; nombre: string; codigo: string; colorHex: string };
  usuarioEdicionId: number;
  fechaEdicion?: string;
  precio: number;
  telefono: string;
}

const API_URL = `${API_BASE_URL}/Materiales`;

export const materialService = {
  getAll: async (): Promise<Material[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getPublicHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener materiales');
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  getById: async (id: number): Promise<Material> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getPublicHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener el material');
      }
      return await response.json();
    } catch (error) {
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
      // Log removed
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
        if (!fd.has('estadoId') || fd.get('estadoId') === '0') {
            fd.delete('estadoId'); 
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
          estadoId: m.estadoId ? Number(m.estadoId) : null,
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
        // Log removed
        throw new Error(`Error al crear el material: ${errText}`);
      }

      return await response.json();
    } catch (error) {
      // Log removed
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
        if (!fd.has('estadoId') || fd.get('estadoId') === '0') {
            fd.delete('estadoId');
        }
        body = fd;
      } else {
        const m = material as Material;
        body = JSON.stringify({
          ...m,
          id,
          modalidadId: m.modalidadId ? Number(m.modalidadId) : null,
          nivelId: m.nivelId ? Number(m.nivelId) : null,
          estadoId: m.estadoId ? Number(m.estadoId) : null,
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
        // Log removed
        throw new Error(`Error al actualizar el material: ${errText}`);
      }

      // Check if response has content before parsing JSON
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as Material);
    } catch (error) {
      // Log removed
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
      // Log removed
      throw error;
    }
  },
};
