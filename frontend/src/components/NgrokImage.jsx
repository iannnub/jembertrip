import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NgrokImage = ({ src, alt, className, ...props }) => {
    const [imgSrc, setImgSrc] = useState(src);

    useEffect(() => {
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
    }, [src]);

    return <img src={imgSrc} alt={alt} className={className} {...props} />;
};

export default NgrokImage;
