import { useEffect, useRef, useState } from 'react';

/**
 * useLazyLoad hook
 * Memanfaatkan Intersection Observer untuk menunda rendering atau loading
 * elemen sampai mendekati viewport.
 * @param {Object} options - IntersectionObserver options
 * @returns {[React.RefObject, boolean]} [ref, isVisible]
 */
export function useLazyLoad(options = {}) {
  const [isVisible, setIsVisible] = useState(() => typeof IntersectionObserver === 'undefined');
  const ref = useRef(null);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '120px', // load 120px sebelum masuk viewport untuk pengalaman scroll mulus
        threshold: 0.01,
        ...options,
      }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, isVisible];
}

export default useLazyLoad;
