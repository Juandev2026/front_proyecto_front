// Google Analytics 4 Utilities

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

// Types for custom events
export type GAEventName =
  // Fase 1: MVP - Cursos y Exámenes
  | 'view_course'
  | 'course_cta_click'
  | 'exam_start'
  | 'exam_complete'
  // Fase 2: Videos y Materiales
  | 'video_start'
  | 'video_progress'
  | 'material_view'
  | 'material_download'
  // Fase 3: Búsqueda
  | 'search';

export interface GAEventParams {
  // Eventos de Cursos
  view_course: {
    course_id: string;
    course_name: string;
    category?: string;
  };
  course_cta_click: {
    course_id: string;
    course_name?: string;
    cta_type: 'inscribirse' | 'comprar' | 'ver_mas';
    price?: number;
  };
  
  // Eventos de Exámenes
  exam_start: {
    exam_id: string;
    course_id?: string;
    question_count?: number;
  };
  exam_complete: {
    exam_id: string;
    course_id?: string;
    score?: number;
    time_taken?: number; // en segundos
  };
  
  // Eventos de Videos
  video_start: {
    video_id: string;
    video_title: string;
    course_id?: string;
  };
  video_progress: {
    video_id: string;
    video_title?: string;
    progress_percent: 25 | 50 | 75 | 100;
  };
  
  // Eventos de Materiales
  material_view: {
    material_id: string;
    material_name: string;
    course_id?: string;
    material_type?: string;
  };
  material_download: {
    material_id: string;
    material_name: string;
    course_id?: string;
    file_type?: string;
  };
  
  // Eventos de Búsqueda
  search: {
    search_term: string;
    results_count?: number;
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
