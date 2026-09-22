// Google Analytics 4 (GA4) Helper
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = 'G-GCENVLT74X';

/**
 * Tracks virtual page views for SPA navigation
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: pagePath,
      page_title: pageTitle || document.title,
    });
  }
}

/**
 * Tracks custom user interactions/events in GA4
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, string | number | boolean>
) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  }
}
