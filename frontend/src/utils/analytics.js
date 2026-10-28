// frontend/src/utils/analytics.js
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

if (typeof window !== 'undefined' && GA_MEASUREMENT_ID && !window.gtagInitialized) {
  window.gtagInitialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

export const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
    if (import.meta.env.DEV) {
      console.log(`[GA4 Event] ${eventName}:`, params);
    }
  }
};

export const trackPageView = (pagePath, pageTitle) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
    });
  }
};
