import { API_BASE_URL } from '../config/api';
import { getAuthHeaders, getAuthHeadersFormData, getPublicHeaders } from '../utils/apiUtils';

export interface Noticia {
  id: number;
  titulo: string;
  descripcion: string;
  categoriaId: number;
  categoria?: string;
  fecha: string;
  imageUrl: string | null;
  archivoUrl: string | null;
  videoUrl: string | null;
  esDestacado: boolean;
  usuarioEdicionId?: number;
  modalidadId?: number;
  modalidad?: { id: number; nombre: string };
  nivelId?: number;
  nivel?: { id: number; nombre: string };
  precio?: number;
  comentarios?: any[];
  estadoId?: number;
  estado?: {
    id: number;
    nombre: string;
    codigo: string;
    colorHex: string;
  };
  autor?: string;
  esNormaLegal?: boolean;
  textoBotonDescarga?: string;
  linkDescarga?: string;
}

const API_URL = `${API_BASE_URL}/Noticias`;

export const noticiaService = {
  getAll: async (destacado?: boolean): Promise<Noticia[]> => {
    try {
      let url = API_URL;
      if (destacado !== undefined) {
        url += `?destacado=${destacado}`;
      }
      const response = await fetch(url, {
        headers: getPublicHeaders(),
      });
      if (!response.ok) {
        console.error(
          'Error al obtener noticias:',
          response.status,
          response.statusText
        );
        throw new Error(
          `Error al obtener noticias: ${response.status} ${response.statusText}`
        );
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  getById: async (id: number): Promise<Noticia> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        console.error(
          'Error al obtener la noticia:',
          response.status,
          response.statusText
        );
        throw new Error(
          `Error al obtener la noticia: ${response.status} ${response.statusText}`
        );
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  getByNivel: async (id: number): Promise<Noticia[]> => {
    try {
      const response = await fetch(`${API_URL}/nivel/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener noticias por nivel');
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  create: async (noticia: any): Promise<Noticia> => {
    try {
      const isFormData = noticia instanceof FormData;
      let body;
      const headers = isFormData ? getAuthHeadersFormData() : getAuthHeaders();

      if (isFormData) {
        const fd = noticia as FormData;
        // Don't force '0' if they don't exist, let them be null/undefined or handled by backend if missing.
        // But if we must send something, send null if possible or just omit.
        // If the backend expects keys to exist:
        if (!fd.has('modalidadId') || fd.get('modalidadId') === '0') {
          fd.delete('modalidadId'); // Ensure we don't send '0'
          // If we must send it as null, FormData treats everything as strings.
          // Ideally we just don't send it if it's null/0.
        }
        if (!fd.has('nivelId') || fd.get('nivelId') === '0') {
          fd.delete('nivelId');
        }
        // UsuarioEdicionId might be required, but if 0 it fails.
        if (fd.get('usuarioEdicionId') === '0') {
          // Try to keep it if it's required, strictly it should have been set in UI.
          // If it's truly 0, maybe we shouldn't send it.
        }

        // Remove nested stubs which are likely causing issues if IDs are 0
        // fd.append('modalidad.id', ...); // REMOVED

        body = fd;
      } else {
        // JSON Payload construction
        const n = noticia as Partial<Noticia>;
        body = JSON.stringify({
          ...n,
          id: n.id || 0,
          categoriaId: n.categoriaId || 0,
          modalidadId: (n as any).modalidadId
            ? Number((n as any).modalidadId)
            : null,
          // Remove nested objects
          nivelId: (n as any).nivelId ? Number((n as any).nivelId) : null,
          usuarioEdicionId: (n as any).usuarioEdicionId
            ? Number((n as any).usuarioEdicionId)
            : null,
          comentarios: [],
          imageUrl: n.imageUrl || '',
          archivoUrl: n.archivoUrl || '',
          autor: n.autor || '',
          estadoId: n.estadoId ? Number(n.estadoId) : 0,
          esNormaLegal: n.esNormaLegal || false,
          textoBotonDescarga: n.textoBotonDescarga || '',
          linkDescarga: n.linkDescarga || '',
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
        throw new Error(`Error al crear la noticia: ${errText}`);
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  update: async (id: number, noticia: any): Promise<Noticia> => {
    try {
      const isFormData = noticia instanceof FormData;
      let body;
      const headers = isFormData ? getAuthHeadersFormData() : getAuthHeaders();

      if (isFormData) {
        const fd = noticia as FormData;
        if (!fd.has('id')) fd.append('id', String(id));

        if (!fd.has('modalidadId') || fd.get('modalidadId') === '0') {
          fd.delete('modalidadId');
        }
        if (!fd.has('nivelId') || fd.get('nivelId') === '0') {
          fd.delete('nivelId');
        }

        // Remove nested stubs
        // fd.append('modalidad.id', ...); // REMOVED

        body = fd;
      } else {
        const n = noticia as Partial<Noticia>;
        body = JSON.stringify({
          ...n,
          id,
          categoriaId: n.categoriaId || 0,
          modalidadId: (n as any).modalidadId
            ? Number((n as any).modalidadId)
            : null,
          nivelId: (n as any).nivelId ? Number((n as any).nivelId) : null,
          // Remove nested objects
          usuarioEdicionId: (n as any).usuarioEdicionId
            ? Number((n as any).usuarioEdicionId)
            : null,
          imageUrl: n.imageUrl || '',
          archivoUrl: n.archivoUrl || '',
          autor: n.autor || '',
          estadoId: n.estadoId ? Number(n.estadoId) : 0,
          esNormaLegal: n.esNormaLegal || false,
          textoBotonDescarga: n.textoBotonDescarga || '',
          linkDescarga: n.linkDescarga || '',
        });
      }

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers,
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Error updating news (Status: ${response.status}):`,
          errorText
        );
        throw new Error(
          `Error al actualizar la noticia: ${response.status} ${errorText}`
        );
      }

      const text = await response.text();
      return text ? JSON.parse(text) : ({} as Noticia);
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
        throw new Error('Error al eliminar la noticia');
      }
    } catch (error) {
      // Log removed
      throw error;
    }
  },
};
