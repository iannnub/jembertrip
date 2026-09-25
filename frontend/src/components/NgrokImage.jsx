import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const fallbackPlaceholder = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23f3f4f6%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%239ca3af%22%20font-family%3Asans-serif%20font-size%3D%2218%22%20font-weight%3D%22600%22%3EJemberTrip%3C%2Ftext%3E%3C%2Fsvg%3E";

const NgrokImage = ({ src, alt, className, ...props }) => {
    const isNgrok = Boolean(src && typeof src === 'string' && src.includes('ngrok'));
    const [imgSrc, setImgSrc] = useState(isNgrok ? null : src);
    const [isVisible, setIsVisible] = useState(!isNgrok);
    const imgRef = useRef(null);

    // Intersection Observer untuk Ngrok Lazy Loading
    useEffect(() => {
        if (!isNgrok) return;

        const currentRef = imgRef.current;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '800px' }
        );

        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) observer.disconnect();
        };
    }, [isNgrok]);

    useEffect(() => {
        if (!src) return;

        if (!isNgrok) {
            return;
        }

        if (!isVisible) return;

        let isMounted = true;
        axios.get(src, { 
            responseType: 'blob',
            headers: { 'ngrok-skip-browser-warning': '69420' }
        })
            .then(res => {
                if (isMounted) {
                    const objectURL = URL.createObjectURL(res.data);
                    setImgSrc(objectURL);
                }
            })
            .catch(() => {
                if (isMounted) setImgSrc(src);
            });

        return () => { isMounted = false; };
    }, [src, isVisible, isNgrok]);

    // Jika bukan gambar ngrok, langsung render img native tanpa overhead
    if (!isNgrok) {
        return (
            <img 
                src={src || fallbackPlaceholder}
                alt={alt} 
                loading="lazy"
                className={className}
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = fallbackPlaceholder;
                }} 
                {...props} 
            />
        );
    }

    return (
        <img 
            ref={imgRef}
            src={imgSrc || fallbackPlaceholder}
            alt={alt} 
            loading="lazy"
            className={`${className} ${!imgSrc ? 'animate-pulse bg-gray-200' : ''}`}
            onError={(e) => {
                e.target.onerror = null;
                e.target.src = fallbackPlaceholder;
            }} 
            {...props} 
        />
    );
};

export default NgrokImage;
