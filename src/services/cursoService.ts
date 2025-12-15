export interface Tema {
  id: number;
  nombre: string;
  descripcion: string;
  cursoId: number;
}

export interface Curso {
  id: number;
  nombre: string;
  descripcion: string;
  categoriaId: number;
  duracion: string;
  idioma: string;
  loQueAprenderas: string;
  precio: number;
  precioOferta: number;
  imagenUrl: string;
  numero: string;
  modalidadId?: number;
  nivelId?: number;
  usuarioEdicionId?: number;
  temas: Tema[];
}

import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/Cursos`;

import { getAuthHeaders, getAuthHeadersFormData } from '../utils/apiUtils';

export const cursoService = {
  getAll: async (): Promise<Curso[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener cursos');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Curso> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener el curso');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching course with id ${id}:`, error);
      throw error;
    }
  },

  getByNivel: async (id: number): Promise<Curso[]> => {
    try {
      const response = await fetch(`${API_URL}/nivel/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener cursos por nivel');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching courses by level ${id}:`, error);
      throw error;
    }
  },

  create: async (curso: Omit<Curso, 'id'> | FormData): Promise<Curso> => {
    try {
      const isFormData = curso instanceof FormData;
      let body: string | FormData;
      const headers = isFormData ? getAuthHeadersFormData() : getAuthHeaders();

      if (isFormData) {
        const fd = curso as FormData;
        if (!fd.has('modalidadId') || fd.get('modalidadId') === '0') {
             fd.delete('modalidadId');
        }
        if (!fd.has('nivelId') || fd.get('nivelId') === '0') {
             fd.delete('nivelId');
        }
        if (!fd.has('usuarioEdicionId') || fd.get('usuarioEdicionId') === '0') {
             // optional handling
        }
        body = fd;
      } else {
        const c = curso as any; // Cast to any to access potential new properties
        body = JSON.stringify({
            ...c,
            modalidadId: c.modalidadId ? Number(c.modalidadId) : null,
            nivelId: c.nivelId ? Number(c.nivelId) : null,
            usuarioEdicionId: c.usuarioEdicionId ? Number(c.usuarioEdicionId) : null
        });
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body,
      });
      if (!response.ok) {
        throw new Error('Error al crear el curso');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  },

  update: async (id: number, curso: Curso | FormData): Promise<Curso> => {
    try {
      const isFormData = curso instanceof FormData;
      let body: string | FormData;
      const headers = isFormData ? getAuthHeadersFormData() : getAuthHeaders();

      console.log('Updating course with payload:', isFormData ? 'FormData' : curso);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (isFormData) {
         const fd = curso as FormData;
         if (!fd.has('id')) fd.append('id', String(id));
         if (!fd.has('modalidadId') || fd.get('modalidadId') === '0') {
             fd.delete('modalidadId');
         }
         if (!fd.has('nivelId') || fd.get('nivelId') === '0') {
             fd.delete('nivelId');
         }
         body = fd;
      } else {
         const c = curso as any;
         body = JSON.stringify({
             ...c,
             id: id,
             modalidadId: c.modalidadId ? Number(c.modalidadId) : null,
             nivelId: c.nivelId ? Number(c.nivelId) : null,
             usuarioEdicionId: c.usuarioEdicionId ? Number(c.usuarioEdicionId) : null
         });
      }

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers,
        body,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Error al actualizar el curso: ${response.status} ${errorText}`);
      }
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as Curso);
    } catch (error) {
      console.error(`Error updating course with id ${id}:`, error);
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
        throw new Error('Error al eliminar el curso');
      }
    } catch (error) {
      console.error(`Error deleting course with id ${id}:`, error);
      throw error;
    }
  },
};
