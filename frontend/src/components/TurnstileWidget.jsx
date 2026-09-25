// frontend/src/components/TurnstileWidget.jsx
import React, { useEffect, useRef } from 'react';

const TurnstileWidget = ({ onVerify, onError, onExpire }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  // Cloudflare testing sitekey (selalu lolos challenge secara instan untuk keperluan dev/testing)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

  useEffect(() => {
    if (siteKey === 'disabled') return;

    let intervalId = null;

    const renderWidget = () => {
      if (window.turnstile && containerRef.current && widgetIdRef.current === null) {
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token) => {
              if (onVerify) onVerify(token);
            },
            'error-callback': () => {
              if (onError) onError();
            },
            'expired-callback': () => {
              if (onExpire) onExpire();
            },
            theme: 'light',
            size: 'normal',
          });
        } catch (err) {
          console.warn('Turnstile render error:', err);
        }
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      intervalId = setInterval(() => {
        if (window.turnstile) {
          clearInterval(intervalId);
          intervalId = null;
          renderWidget();
        }
      }, 150);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onVerify, onError, onExpire]);

  if (siteKey === 'disabled') {
    return null;
  }

  return (
    <div className="flex justify-center my-3 min-h-[65px] transition-all">
      <div ref={containerRef} className="cf-turnstile-container" />
    </div>
  );
};

export default TurnstileWidget;
