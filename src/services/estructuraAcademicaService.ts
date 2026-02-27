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
      const data = (await response.json()) as any[];
      return estructuraAcademicaService.mapPreguntas(data);
    } catch (error) {
      console.error('Error in getPreguntas:', error);
      return [];
    }
  },

  // Helper function to map raw API data to PreguntaExamen[]
  mapPreguntas: (rawData: any[]): PreguntaExamen[] => {
    if (!Array.isArray(rawData)) return [];

    const unescapeHTML = (str: string) => {
      if (!str) return '';
      return str
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');
    };

    const cleanAlternative = (str: string) => {
      if (!str) return '';
      const unescaped = unescapeHTML(str);
      return unescaped
        .replace(/^(<p[^>]*>)?\s*<strong>[A-Z]\s*[.):]\s*<\/strong>\s*/i, '$1')
        .replace(/^\s*[A-Z]\s*[.):]\s*/i, '');
    };

    const getLetter = (ans: any, alts: any[]) => {
      if (ans === undefined || ans === null || ans === '') return '';
      const sAns = String(ans).toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(sAns)) return sAns;
      if (!alts || alts.length === 0) return '';
      const idxById = alts.findIndex((a) => String(a.id) === String(ans));
      if (idxById !== -1) return String.fromCharCode(65 + idxById);
      const numAns = Number(ans);
      if (!isNaN(numAns) && numAns >= 0 && numAns < alts.length) {
        return String.fromCharCode(65 + numAns);
      }
      return sAns;
    };

    const mappedData: PreguntaExamen[] = rawData.map((q: any) => {
      return {
        id: q.id,
        preguntaId: q.id,
        examenId: q.examenId,
        year: q.year,
        enunciado: unescapeHTML(
          (q.enunciados || []).map((e: any) => e.contenido).join('<br/>') || q.enunciado || ''
        ),
        alternativaA: cleanAlternative(q.alternativas?.[0]?.contenido || q.alternativaA || ''),
        alternativaB: cleanAlternative(q.alternativas?.[1]?.contenido || q.alternativaB || ''),
        alternativaC: cleanAlternative(q.alternativas?.[2]?.contenido || q.alternativaC || ''),
        alternativaD: cleanAlternative(q.alternativas?.[3]?.contenido || q.alternativaD || ''),
        imagen: q.imagen || '',
        puntos: q.puntos || 0,
        tiempoPregunta: q.tiempoPregunta || 0,
        clasificacionId: q.clasificacionId,
        clasificacionNombre: q.clasificacionNombre,
        tipoPreguntaId: q.tipoPreguntaId,
        respuesta: getLetter(q.respuesta, q.alternativas || []),
        subPreguntas: (q.subPreguntas || []).map((sub: any) => ({
          numero: sub.numero,
          enunciado: unescapeHTML(
            (sub.enunciados || []).map((e: any) => e.contenido).join('<br/>') || sub.enunciado || ''
          ),
          alternativaA: cleanAlternative(sub.alternativas?.[0]?.contenido || sub.alternativaA || ''),
          alternativaB: cleanAlternative(sub.alternativas?.[1]?.contenido || sub.alternativaB || ''),
          alternativaC: cleanAlternative(sub.alternativas?.[2]?.contenido || sub.alternativaC || ''),
          alternativaD: cleanAlternative(sub.alternativas?.[3]?.contenido || sub.alternativaD || ''),
          imagen: sub.imagen || '',
          puntos: sub.puntos || 0,
          tiempoPregunta: sub.tiempoPregunta || 0,
          respuesta: getLetter(sub.respuestaCorrecta || sub.respuesta, sub.alternativas || []),
        })),
      };
    });

    const subEnunciados = new Set<string>();
    mappedData.forEach((q) => {
      if (q.subPreguntas && q.subPreguntas.length > 0) {
        q.subPreguntas.forEach((sub) => {
          if (sub.enunciado) subEnunciados.add(sub.enunciado.trim());
        });
      }
    });

    return mappedData.filter((q) => !subEnunciados.has(q.enunciado?.trim()));
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

      const rawData = await response.json();
      return estructuraAcademicaService.mapPreguntas(rawData);
    } catch (error) {
      console.error('Error in getPreguntasByFilter:', error);
      return [];
    }
  },
};
