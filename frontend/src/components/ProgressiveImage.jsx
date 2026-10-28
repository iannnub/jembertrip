import React, { useState, useEffect } from 'react';

const FALLBACK_PLACEHOLDER = '/placeholder-wisata.svg';

/**
 * ProgressiveImage
 * Fast native image renderer:
 * - Untuk asset lokal / non-ngrok: langsung render <img src={src} decoding="async" /> pada frame pertama tanpa double-fetch JS.
 * - Untuk URL tunnel ngrok eksternal: otomatis menyertakan header ngrok-skip-browser-warning.
 */
export default function ProgressiveImage({
  src,
  alt = '',
  className = '',
  fallback = FALLBACK_PLACEHOLDER,
  loading = 'lazy',
  ...props
}) {
  const isNgrokUrl = typeof src === 'string' && src.includes('ngrok');
  const [ngrokBlobUrl, setNgrokBlobUrl] = useState(null);
  const [failedSrc, setFailedSrc] = useState(null);

  useEffect(() => {
    if (!src || !isNgrokUrl) {
      return;
    }

    let isMounted = true;
    let objectUrlToRevoke = null;

    fetch(src, {
      headers: {
        'ngrok-skip-browser-warning': '69420',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          throw new Error('Received HTML instead of image from tunnel');
        }
        return res.blob();
      })
      .then((blob) => {
        if (!isMounted) return;
        const objectUrl = URL.createObjectURL(blob);
        objectUrlToRevoke = objectUrl;
        setNgrokBlobUrl(objectUrl);
      })
      .catch(() => {
        if (isMounted) {
          setFailedSrc(src);
        }
      });

    return () => {
      isMounted = false;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [src, isNgrokUrl]);

  const hasError = !src || failedSrc === src;
  const resolvedSrc = hasError
    ? fallback
    : isNgrokUrl
      ? ngrokBlobUrl || fallback
      : src;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={(e) => {
        if (e.currentTarget.src !== window.location.origin + fallback) {
          setFailedSrc(src);
          e.currentTarget.src = fallback;
        }
      }}
      {...props}
    />
  );
}
