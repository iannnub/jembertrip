import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const NgrokImage = ({ src, alt, className, ...props }) => {
    const [imgSrc, setImgSrc] = useState(null); // start empty for lazy loading
    const [isVisible, setIsVisible] = useState(false);
    const imgRef = useRef(null);

    // Intersection Observer untuk Lazy Loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '800px' } // Load way before it comes into view
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (imgRef.current) observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        let isMounted = true;
        if (src && src.includes('ngrok-free.dev')) {
            axios.get(src, { responseType: 'blob' })
                .then(res => {
                    if (isMounted) {
                        const objectURL = URL.createObjectURL(res.data);
                        setImgSrc(objectURL);
                    }
                })
                .catch(err => {
                    if (isMounted) setImgSrc(src);
                });
        } else {
            setImgSrc(src);
        }
        return () => { isMounted = false; };
    }, [src, isVisible]);

    const fallbackPlaceholder = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23f3f4f6%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%239ca3af%22%20font-family%3Asans-serif%20font-size%3D%2218%22%20font-weight%3D%22600%22%3EJemberTrip%3C%2Ftext%3E%3C%2Fsvg%3E";

    return (
        <img 
            ref={imgRef}
            src={imgSrc || "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"}
            alt={alt} 
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
