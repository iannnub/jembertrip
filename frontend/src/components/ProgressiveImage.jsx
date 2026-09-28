import React, { useState, useEffect } from 'react';

const FALLBACK_PLACEHOLDER = '/placeholder-wisata.svg';

/**
 * ProgressiveImage
 * Component gambar progresif dengan:
 * 1. Blur placeholder & skeleton pulse saat loading
 * 2. Bypass otomatis ngrok browser interstitial warning via header ngrok-skip-browser-warning
 * 3. Smooth transition blur-sm scale-105 -> blur-0 scale-100
 * 4. Graceful error handling dengan fallback placeholder
 */
export default function ProgressiveImage({
  src,
  alt = '',
  className = '',
  fallback = FALLBACK_PLACEHOLDER,
  blurDataURL = null,
  loading = 'lazy',
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(blurDataURL || fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setImgSrc(fallback);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    let isMounted = true;
    let objectUrlToRevoke = null;

    const isNgrokUrl = typeof src === 'string' && src.includes('ngrok');

    if (isNgrokUrl) {
      // Fetch via JavaScript dengan bypass header untuk ngrok interstitial
      fetch(src, {
        headers: {
          'ngrok-skip-browser-warning': '69420',
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const contentType = res.headers.get('content-type') || '';
          // Jika ngrok mengembalikan HTML bukan gambar, anggap gagal
          if (contentType.includes('text/html')) {
            throw new Error('Received HTML instead of image from tunnel');
          }
          return res.blob();
        })
        .then((blob) => {
          if (!isMounted) return;
          const objectUrl = URL.createObjectURL(blob);
          objectUrlToRevoke = objectUrl;

          // Preload blob object url
          const img = new Image();
          img.onload = () => {
            if (isMounted) {
              setImgSrc(objectUrl);
              setIsLoading(false);
            }
          };
          img.onerror = () => {
            if (isMounted) {
              setImgSrc(fallback);
              setIsLoading(false);
              setHasError(true);
            }
          };
          img.src = objectUrl;
        })
        .catch(() => {
          if (!isMounted) return;
          // Fallback ke direct load
          const directImg = new Image();
          directImg.onload = () => {
            if (isMounted) {
              setImgSrc(src);
              setIsLoading(false);
            }
          };
          directImg.onerror = () => {
            if (isMounted) {
              setImgSrc(fallback);
              setIsLoading(false);
              setHasError(true);
            }
          };
          directImg.src = src;
        });
    } else {
      // Standard image loading untuk static assets / CDN
      const img = new Image();
      img.onload = () => {
        if (isMounted) {
          setImgSrc(src);
          setIsLoading(false);
        }
      };
      img.onerror = () => {
        if (isMounted) {
          setImgSrc(fallback);
          setIsLoading(false);
          setHasError(true);
        }
      };
      img.src = src;
    }

    return () => {
      isMounted = false;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [src, fallback]);

  return (
    <div className="relative overflow-hidden w-full h-full">
      <img
        src={imgSrc}
        alt={alt}
        className={`${className} ${
          isLoading ? 'blur-sm scale-105 opacity-80' : 'blur-0 scale-100 opacity-100'
        } transition-all duration-500`}
        loading={loading}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200/60 animate-pulse pointer-events-none" />
      )}
      {hasError && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-xs pointer-events-none p-2 text-center">
          <svg className="w-8 h-8 mb-1 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[11px] font-medium text-slate-400">Gambar tidak tersedia</span>
        </div>
      )}
    </div>
  );
}
