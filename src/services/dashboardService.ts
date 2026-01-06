import { cursoService } from './cursoService';
import { materialService } from './materialService';
import { noticiaService } from './noticiaService';
import { API_URL } from '../config/api';
import { getPublicHeaders } from '../utils/apiUtils';

export interface DashboardTotals {
  totalNoticias: number;
  totalMateriales: number;
  totalVideos: number;
}

export interface RecentActivityItem {
  id: number;
  type: 'noticia' | 'material' | 'video';
  title: string;
  date: string;
  action: string;
}

const ENDPOINT = `${API_URL}/Dashboard`;

export const dashboardService = {
  getTotals: async (): Promise<DashboardTotals> => {
    try {
      const response = await fetch(`${ENDPOINT}/Totals`, {
        headers: getPublicHeaders(),
      });
      if (!response.ok) {
        throw new Error('Error al obtener totales del dashboard');
      }
      return await response.json();
    } catch (error) {
      // Log removed
      throw error;
    }
  },

  getRecentActivity: async (): Promise<RecentActivityItem[]> => {
    try {
      const [noticias, materiales, cursos] = await Promise.all([
        noticiaService.getAll(),
        materialService.getAll(),
        cursoService.getAll(),
      ]);

      const activities: RecentActivityItem[] = [];

      // Get last 3 items of each type (assuming APIs return list, we take from end or sort if needed)
      // Since we don't know API sort order, we assume the latest added are at the end or we just take some.
      // Ideally we would sort by created date but we might not have that field on all.
      // We will take the last 2 of each to form a mixed list.

      const lastNoticias = noticias.slice(-2).reverse();
      const lastMateriales = materiales.slice(-2).reverse();
      const lastCursos = cursos.slice(-2).reverse(); // Assuming all courses are considered videos for now

      lastNoticias.forEach((n: any) => {
        activities.push({
          id: n.id,
          type: 'noticia',
          title: n.titulo,
          date: 'Reciente', // We don't have date on some interfaces, using placeholder
          action: 'Nueva noticia publicada',
        });
      });

      lastMateriales.forEach((m: any) => {
        activities.push({
          id: m.id,
          type: 'material',
          title: m.titulo,
          date: 'Reciente',
          action: 'Material actualizado',
        });
      });

      lastCursos.forEach((c: any) => {
        activities.push({
          id: c.id,
          type: 'video',
          title: c.titulo,
          date: 'Reciente',
          action: 'Nuevo video subido',
        });
      });

      return activities;
    } catch (error) {
      // Log removed
      return [];
    }
  },
};
