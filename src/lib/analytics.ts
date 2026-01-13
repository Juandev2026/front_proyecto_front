// Google Analytics 4 Utilities

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

// Types for custom events
export type GAEventName =
  // Fase 1: MVP - Cursos y Exámenes
  | 'ver_curso'
  | 'clic_accion_curso'
  | 'iniciar_examen'
  | 'completar_examen'
  // Fase 2: Videos y Materiales
  | 'iniciar_video'
  | 'progreso_video'
  | 'ver_material'
  | 'descargar_material'
  // Fase 3: Búsqueda
  | 'busqueda';

export interface GAEventParams {
  // Eventos de Cursos
  ver_curso: {
    id_curso: string;
    nombre_curso: string;
    categoria?: string;
  };
  clic_accion_curso: {
    id_curso: string;
    nombre_curso?: string;
    tipo_accion: 'inscribirse' | 'comprar' | 'ver_mas';
    precio?: number;
  };
  
  // Eventos de Exámenes
  iniciar_examen: {
    id_examen: string;
    id_curso?: string;
    cantidad_preguntas?: number;
  };
  completar_examen: {
    id_examen: string;
    id_curso?: string;
    puntaje?: number;
    tiempo_tomado?: number; // en segundos
  };
  
  // Eventos de Videos
  iniciar_video: {
    id_video: string;
    titulo_video: string;
    id_curso?: string;
  };
  progreso_video: {
    id_video: string;
    titulo_video?: string;
    porcentaje_progreso: 25 | 50 | 75 | 100;
  };
  
  // Eventos de Materiales
  ver_material: {
    id_material: string;
    nombre_material: string;
    id_curso?: string;
    tipo_material?: string;
  };
  descargar_material: {
    id_material: string;
    nombre_material: string;
    id_curso?: string;
    tipo_archivo?: string;
  };
  
  // Eventos de Búsqueda
  busqueda: {
    termino_busqueda: string;
    cantidad_resultados?: number;
  };
}

/**
 * Initialize Google Analytics
 */
export const initGA = (): void => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID) {
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: window.location.pathname,
      anonymize_ip: true, // Privacy-friendly
    });
  }
};

/**
 * Track page views
 */
export const trackPageView = (url: string): void => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

/**
 * Track custom events with type safety
 */
export const trackEvent = <T extends GAEventName>(
  eventName: T,
  params: GAEventParams[T]
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[GA4 Event]', eventName, params);
    }
    
    window.gtag('event', eventName, params);
  }
};

/**
 * Track time spent on page
 */
export const trackTimeOnPage = (pagePath: string, timeInSeconds: number): void => {
  if (typeof window !== 'undefined' && window.gtag && timeInSeconds > 5) {
    window.gtag('event', 'user_engagement', {
      engagement_time_msec: timeInSeconds * 1000,
      page_path: pagePath,
    });
  }
};
