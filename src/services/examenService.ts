import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../utils/apiUtils';

export interface EspecialidadGrouped {
  especialidadId: number | null;
  especialidadNombre: string | null;
  years?: { year: string; count: number }[];
}

export interface NivelGrouped {
  nivelId: number;
  nivelNombre: string;
  especialidades: EspecialidadGrouped[];
}

export interface ModalidadGrouped {
  modalidadId: number;
  modalidadNombre: string;
  niveles: NivelGrouped[];
}

export interface FuenteGrouped {
  fuenteId: number;
  fuenteNombre: string;
  modalidades: ModalidadGrouped[];
}

export interface ExamenGrouped {
  tipoExamenId: number;
  tipoExamenNombre: string;
  fuentes: FuenteGrouped[];
}

const API_URL = `${API_BASE_URL}/Examenes`;

export interface Examen {
  id: number;
  year: string;
  tipoExamenId: number;
  fuenteId: number;
  modalidadId: number;
  nivelId: number;
  especialidadId: number;
  nombre?: string;
}

export interface SimplifiedHierarchy {
  modalidades: { id: number; nombre: string; base?: number }[];
  niveles: { id: number; nombre: string; modalidadIds: number[] }[];
  especialidades: { id: number; nombre: string; nivelId: number }[];
}

export const examenService = {
  getGrouped: async (): Promise<ExamenGrouped[]> => {
    try {
      const response = await fetch(`${API_URL}/grouped`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener exámenes agrupados');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  getSimplifiedHierarchy: async (): Promise<SimplifiedHierarchy> => {
    const grouped = await examenService.getGrouped();
    const modsMap = new Map<number, { id: number; nombre: string }>();
    const nivsMap = new Map<
      number,
      { id: number; nombre: string; modIds: Set<number> }
    >();
    const espsMap = new Map<
      string,
      { id: number; nombre: string; nivelId: number }
    >();

    grouped.forEach((tipo) => {
      tipo.fuentes.forEach((fuente) => {
        fuente.modalidades.forEach((m) => {
          if (!modsMap.has(m.modalidadId)) {
            modsMap.set(m.modalidadId, {
              id: m.modalidadId,
              nombre: m.modalidadNombre,
            });
          }

          m.niveles.forEach((n) => {
            if (!nivsMap.has(n.nivelId)) {
              nivsMap.set(n.nivelId, {
                id: n.nivelId,
                nombre: n.nivelNombre,
                modIds: new Set(),
              });
            }
            nivsMap.get(n.nivelId)!.modIds.add(m.modalidadId);

            n.especialidades.forEach((e) => {
              if (e.especialidadId !== null) {
                const key = `${e.especialidadId}-${n.nivelId}`;
                if (!espsMap.has(key)) {
                  espsMap.set(key, {
                    id: e.especialidadId,
                    nombre: e.especialidadNombre || '',
                    nivelId: n.nivelId,
                  });
                }
              }
            });
          });
        });
      });
    });

    return {
      modalidades: Array.from(modsMap.values()),
      niveles: Array.from(nivsMap.values())
        .map((n) => ({
          id: n.id,
          nombre: n.nombre,
          modalidadIds: Array.from(n.modIds),
        }))
        .filter((n) => n.nombre && n.nombre.toUpperCase() !== 'NINGUNO'),
      especialidades: Array.from(espsMap.values()).filter(
        (e) => e.nombre && e.nombre.toUpperCase() !== 'NINGUNO'
      ),
    };
  },

  getAll: async (): Promise<Examen[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener todos los exámenes');
      }
      return await response.json();
    } catch (error) {
      console.warn(
        'Could not fetch all exams, possibly endpoint not supported',
        error
      );
      return [];
    }
  },

  create: async (data: Omit<Examen, 'id'>): Promise<Examen> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Error al crear examen: ${err}`);
      }
      return await response.json();
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
        throw new Error('Error al eliminar examen');
      }
    } catch (error) {
      throw error;
    }
  },

  addYear: async (data: {
    tipoExamenId: number;
    fuenteId: number;
    modalidadId: number;
    nivelId: number | null;
    especialidadId: number | null;
    year: string;
  }): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/add-year`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Error al añadir año: ${err}`);
      }
    } catch (error) {
      throw error;
    }
  },

  removeYear: async (payload: {
    tipoExamenId: number;
    fuenteId: number;
    modalidadId: number;
    nivelId: number | null;
    especialidadId: number | null;
    year: number | string;
  }): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/remove-year`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Sending DELETE to /api/Examenes/remove-year with payload:', JSON.stringify(payload, null, 2));

      if (!response.ok) {
        let err = '';
        try {
          err = await response.text();
        } catch (e) {
          err = 'No response body';
        }
        
        if (response.status === 404) {
          throw new Error('La ruta /api/Examenes/remove-year no fue encontrada (404). Verifica que el endpoint acepte DELETE con JSON body.');
        }
        
        throw new Error(`Error al eliminar año (${response.status}): ${err}`);
      }
    } catch (error) {
      console.error('removeYear API Error:', error);
      throw error;
    }
  },

  getPropios: async (): Promise<any[]> => {
    try {
      const response = await fetch(`${API_URL}/propios`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener exámenes propios');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};
