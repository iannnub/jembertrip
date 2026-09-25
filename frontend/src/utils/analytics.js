// frontend/src/utils/analytics.js
/**
 * Helper utilitas pelacakan Google Analytics 4 (GA4).
 * Mendukung inisialisasi dinamis, pelacakan halaman (page_view), dan event kustom dengan output log di mode development.
 */

export const initGA = () => {
  if (typeof window === 'undefined') return;

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) {
    if (import.meta.env.DEV) {
      console.log('[GA4] VITE_GA_MEASUREMENT_ID belum diatur di .env. Event tracking berjalan dalam mode debug.');
    }
    return;
  }

  if (document.getElementById('ga4-script')) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });

  const script = document.createElement('script');
  script.id = 'ga4-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  if (import.meta.env.DEV) {
    console.log(`[GA4] Inisialisasi Google Analytics 4 aktif dengan ID: ${measurementId}`);
  }
};

export const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
  if (import.meta.env.DEV) {
    console.log(`[GA4 Event] ${eventName}:`, params);
  }
};

export const trackPageView = (pagePath, pageTitle) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle || document.title,
    });
  }
  if (import.meta.env.DEV) {
    console.log(`[GA4 PageView] ${pagePath} - ${pageTitle || document.title}`);
  }
};

