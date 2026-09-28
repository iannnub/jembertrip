/**
 * Frontend Performance Monitoring & Preconnect Utility
 */

export function logWebVitals() {
  if (typeof window !== 'undefined' && 'performance' in window && 'PerformanceObserver' in window) {
    try {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcp = entries[entries.length - 1];
        if (lcp) {
          const lcpTime = Math.round(lcp.renderTime || lcp.loadTime);
          if (import.meta.env.DEV) {
            console.log(`[Web Vitals] LCP: ${lcpTime} ms`);
          }
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidTime = Math.round(entry.processingStart - entry.startTime);
          if (import.meta.env.DEV) {
            console.log(`[Web Vitals] FID: ${fidTime} ms`);
          }
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let cls = 0;
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            cls += entry.value;
            if (import.meta.env.DEV) {
              console.log(`[Web Vitals] CLS: ${cls.toFixed(3)}`);
            }
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });
    } catch {
      // Fallback untuk browser lawas
    }
  }
}

export function preconnect(urls) {
  if (typeof document === 'undefined') return;
  urls.forEach((url) => {
    if (!url) return;
    try {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);

      const dnsLink = document.createElement('link');
      dnsLink.rel = 'dns-prefetch';
      dnsLink.href = url;
      document.head.appendChild(dnsLink);
    } catch {
      // ignore
    }
  });
}
