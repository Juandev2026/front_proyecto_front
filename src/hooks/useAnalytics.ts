import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { trackEvent, GAEventName, GAEventParams } from '../lib/analytics';

/**
 * Custom hook for Google Analytics event tracking
 * Provides type-safe event tracking and automatic time-on-page tracking
 */
export const useAnalytics = () => {
  const router = useRouter();
  const startTimeRef = useRef<number>(Date.now());

  // Track time spent on page when component unmounts
  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      // Only track if user spent more than 5 seconds
      if (timeSpent > 5 && typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'user_engagement', {
          engagement_time_msec: timeSpent * 1000,
          page_path: router.pathname,
        });
      }
    };
  }, [router.pathname]);

  // Type-safe event tracking function
  const track = useCallback(<T extends GAEventName>(
    eventName: T,
    params: GAEventParams[T]
  ) => {
    trackEvent(eventName, params);
  }, []);

  return { track };
};

/**
 * Hook specifically for tracking video progress
 * Automatically tracks 25%, 50%, 75%, 100% milestones
 */
export const useVideoTracking = (videoId: string, videoTitle: string, courseId?: string) => {
  const trackedMilestones = useRef<Set<number>>(new Set());

  const trackVideoStart = useCallback(() => {
    trackEvent('video_start', {
      video_id: videoId,
      video_title: videoTitle,
      course_id: courseId,
    });
    trackedMilestones.current.clear();
  }, [videoId, videoTitle, courseId]);

  const trackVideoProgress = useCallback((progressPercent: number) => {
    // Track milestones: 25, 50, 75, 100
    const milestones = [25, 50, 75, 100];
    
    for (const milestone of milestones) {
      if (
        progressPercent >= milestone &&
        !trackedMilestones.current.has(milestone)
      ) {
        trackEvent('video_progress', {
          video_id: videoId,
          video_title: videoTitle,
          progress_percent: milestone as 25 | 50 | 75 | 100,
        });
        trackedMilestones.current.add(milestone);
      }
    }
  }, [videoId, videoTitle]);

  return {
    trackVideoStart,
    trackVideoProgress,
  };
};
