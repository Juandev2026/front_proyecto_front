import { API_BASE_URL } from '../config/api';
import { PreguntaExamen } from '../types/examen';
import { getAuthHeaders } from '../utils/apiUtils';

export interface Especialidad {
  id: number;
  nombre: string;
}

export interface Nivel {
  id: number;
  nombre: string;
  especialidades: Especialidad[];
  anios: string[];
}

export interface Modalidad {
  id: number;
  nombre: string;
  niveles: Nivel[];
}

export const estructuraAcademicaService = {
  getAll: async (): Promise<Modalidad[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/Examenes/grouped-simple`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok)
        throw new Error('Error al obtener estructura académica');
      const groupedData = await response.json();

      const modMap = new Map<number, Modalidad>();

      groupedData.forEach((tipo: any) => {
        tipo.fuentes.forEach((fuente: any) => {
          fuente.modalidades.forEach((m: any) => {
            if (!modMap.has(m.modalidadId)) {
              modMap.set(m.modalidadId, {
                id: m.modalidadId,
                nombre: m.modalidadNombre,
                niveles: [],
              });
            }

            const modEntry = modMap.get(m.modalidadId)!;

            m.niveles.forEach((n: any) => {
              if (n.nivelNombre && n.nivelNombre.toUpperCase() === 'NINGUNO')
                return;

              let nivEntry = modEntry.niveles.find((nx) => nx.id === n.nivelId);
              if (!nivEntry) {
                nivEntry = {
                  id: n.nivelId,
                  nombre: n.nivelNombre,
                  especialidades: [],
                  anios: [],
                };
                modEntry.niveles.push(nivEntry);
              }

              n.especialidades.forEach((e: any) => {
                if (
                  e.especialidadNombre &&
                  e.especialidadNombre.toUpperCase() === 'NINGUNO'
                )
                  return;
                if (
                  e.especialidadId !== null &&
                  !nivEntry!.especialidades.some(
                    (ex) => ex.id === e.especialidadId
                  )
                ) {
                  nivEntry!.especialidades.push({
                    id: e.especialidadId,
                    nombre: e.especialidadNombre || '',
                  });
                }
              });
            });
          });
        });
      });

      return Array.from(modMap.values());
    } catch (error) {
      console.error('Error fetching estructura académica:', error);
      throw error;
    }
  },

  getAgrupados: async (): Promise<Modalidad[]> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/FiltrosEstructura/agrupados`,
        {
          headers: getAuthHeaders(),
        }
      );
      if (!response.ok) throw new Error('Error al obtener filtros agrupados');
      return await response.json();
    } catch (error) {
      console.error('Error fetching grouped filters:', error);
      throw error;
    }
  },

  getConteoPreguntas: async (
    modalidadId: number,
    nivelId: number,
    year: string
  ): Promise<any> => {
    try {
      const url = `${API_BASE_URL}/FiltrosEstructura/conteo-preguntas?modalidadId=${modalidadId}&nivelId=${nivelId}&year=${year}`;
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener conteo de preguntas');
      return await response.json();
    } catch (error) {
      console.error('Error fetching question count:', error);
      throw error;
    }
  },

  getPreguntas: async (
    modalidadId: number,
    nivelId: number,
    year: string,
    especialidadId?: number,
    clasificacionIds?: number[]
  ): Promise<PreguntaExamen[]> => {
    try {
      let url = `${API_BASE_URL}/FiltrosEstructura/preguntas?modalidadId=${modalidadId}&nivelId=${nivelId}&year=${year}`;
      if (especialidadId) {
        url += `&especialidadId=${especialidadId}`;
      }
      if (clasificacionIds && clasificacionIds.length > 0) {
        clasificacionIds.forEach((id) => {
          url += `&clasificacionIds=${id}`;
        });
      }
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al obtener preguntas');
      const data = (await response.json()) as PreguntaExamen[];

      const subEnunciados = new Set<string>();
      data.forEach((q) => {
        if (q.subPreguntas && q.subPreguntas.length > 0) {
          q.subPreguntas.forEach((sub) => {
            if (sub.enunciado) subEnunciados.add(sub.enunciado.trim());
          });
        }
      });

      return data.filter((q) => !subEnunciados.has(q.enunciado?.trim()));
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  },

  // --- NUEVA FUNCIÓN AÑADIDA AQUÍ ---
  getPreguntasByFilter: async (payload: {
    tipoExamenId: number;
    fuenteId: number;
    modalidadId: number;
    nivelId: number;
    especialidadId: number;
    year: string;
    clasificaciones?: number[];
  }): Promise<PreguntaExamen[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/Preguntas/examen-filter`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al obtener preguntas filtradas');
      }

      const data = (await response.json()) as PreguntaExamen[];

      // Mantenemos la misma lógica de deduplicación que usabas en getPreguntas
      const subEnunciados = new Set<string>();
      data.forEach((q) => {
        if (q.subPreguntas && q.subPreguntas.length > 0) {
          q.subPreguntas.forEach((sub) => {
            if (sub.enunciado) subEnunciados.add(sub.enunciado.trim());
          });
        }
      });

      return data.filter((q) => !subEnunciados.has(q.enunciado?.trim()));
    } catch (error) {
      console.error('Error fetching questions by filter:', error);
      throw error;
    }
  },
};
