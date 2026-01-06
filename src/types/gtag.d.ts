// TypeScript definitions for Google Analytics gtag

interface Window {
  gtag: (
    command: 'config' | 'event' | 'js' | 'set',
    targetId: string | Date,
    config?: Record<string, any>
  ) => void;
  dataLayer: any[];
}
