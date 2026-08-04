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
            { rootMargin: '100px' } // Load slightly before it comes into view
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

    return (
        <img 
            ref={imgRef}
            src={imgSrc || "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"} // placeholder transparan
            alt={alt} 
            className={`${className} ${!imgSrc ? 'animate-pulse bg-gray-200' : ''}`} 
            {...props} 
        />
    );
};

export default NgrokImage;
