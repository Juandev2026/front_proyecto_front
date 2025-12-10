import { API_BASE_URL } from '../config/api';
import { getAuthHeaders, getAuthHeadersFormData } from '../utils/apiUtils';

export interface Noticia {
  id: number;
  titulo: string;
  descripcion: string;
  categoriaId: number;
  fecha: string;
  imageUrl: string | null;
  esDestacado: boolean;
  usuarioEdicionId?: number;
  modalidadId?: number;
  nivelId?: number;
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
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener noticias');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Noticia> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener la noticia');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching news with id ${id}:`, error);
      throw error;
    }
  },

  create: async (noticia: any): Promise<Noticia> => {
    try {
      const isFormData = noticia instanceof FormData;
      let body;
      const headers = isFormData ? getAuthHeadersFormData() : getAuthHeaders();

      if (isFormData) {
        // Append required fields if they don't exist in FormData? 
        // We can't easily check what's in FormData without looping.
        // But we can append valid default values or ensuring the UI sent them.
        // Better strategy: The UI should send them, OR we blindly append if missing?
        // FormData.append adds a new value, doesn't overwrite if existing usually.
        // But for nested objects in FormData, we need specific keys.
        
        // Let's assume the UI sends basic fields. We add the complex structure.
        // Actually, for FormData, we can try to rely on the backend NOT requiring nested objects if we send IDs,
        // BUT if it failed, we might need them.
        // Let's safe-guard:
        const fd = noticia as FormData;
        if (!fd.has('modalidadId')) fd.append('modalidadId', '0');
        if (!fd.has('nivelId')) fd.append('nivelId', '0');
        if (!fd.has('usuarioEdicionId')) fd.append('usuarioEdicionId', '0');
        
        // Append nested stubs for FormData binding
        fd.append('modalidad.id', fd.get('modalidadId') as string || '0');
        fd.append('modalidad.nombre', '');
        
        fd.append('nivel.id', fd.get('nivelId') as string || '0');
        fd.append('nivel.nombre', '');
        fd.append('nivel.modalidadId', fd.get('modalidadId') as string || '0');
        fd.append('nivel.modalidad.id', fd.get('modalidadId') as string || '0');
        fd.append('nivel.modalidad.nombre', '');

        body = fd;
      } else {
        // JSON Payload construction
        const n = noticia as Partial<Noticia>;
        body = JSON.stringify({
           ...n,
           id: n.id || 0,
           categoriaId: n.categoriaId || 0,
           modalidadId: (n as any).modalidadId || 0,
           modalidad: { id: (n as any).modalidadId || 0, nombre: '' },
           nivelId: (n as any).nivelId || 0,
           nivel: { 
             id: (n as any).nivelId || 0, 
             nombre: '', 
             modalidadId: (n as any).modalidadId || 0,
             modalidad: { id: (n as any).modalidadId || 0, nombre: '' }
           },
           usuarioEdicionId: (n as any).usuarioEdicionId || 0,
           comentarios: [], // Default empty array
           imageUrl: n.imageUrl || ""
        });
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body,
      });
      if (!response.ok) {
         const errText = await response.text();
         console.error('Create response error:', errText);
         throw new Error(`Error al crear la noticia: ${errText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating news:', error);
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
         // Ensure keys exist
         if (!fd.has('id')) fd.append('id', String(id));
         if (!fd.has('modalidadId')) fd.append('modalidadId', '0');
         if (!fd.has('nivelId')) fd.append('nivelId', '0');
         if (!fd.has('usuarioEdicionId')) fd.append('usuarioEdicionId', '0');
         
         // Nested stubs
         fd.append('modalidad.id', fd.get('modalidadId') as string || '0');
         fd.append('modalidad.nombre', '');
         
         fd.append('nivel.id', fd.get('nivelId') as string || '0');
         fd.append('nivel.nombre', '');
         fd.append('nivel.modalidadId', fd.get('modalidadId') as string || '0');
         fd.append('nivel.modalidad.id', fd.get('modalidadId') as string || '0');
         fd.append('nivel.modalidad.nombre', '');
 
         body = fd;
       } else {
         const n = noticia as Partial<Noticia>;
         body = JSON.stringify({
            ...n,
            id: id,
            categoriaId: n.categoriaId || 0,
            modalidadId: (n as any).modalidadId || 0,
            modalidad: { id: (n as any).modalidadId || 0, nombre: '' },
            nivelId: (n as any).nivelId || 0,
            nivel: { 
              id: (n as any).nivelId || 0, 
              nombre: '', 
              modalidadId: (n as any).modalidadId || 0,
              modalidad: { id: (n as any).modalidadId || 0, nombre: '' }
            },
            usuarioEdicionId: (n as any).usuarioEdicionId || 0,
            imageUrl: n.imageUrl || ""
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
      console.error(`Error updating news with id ${id}:`, error);
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
      console.error(`Error deleting news with id ${id}:`, error);
      throw error;
    }
  },
};
