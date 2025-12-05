import React, { useState, useEffect } from 'react';

// Import Williams Racing car images in preferred order
import carWRImage from '../Image files/Car WR.avif';
import williams800 from '../Image files/0 Williams 800.webp';
import wrCarImage from '../Image files/WR car.avif';
import williamsCarImage from '../Image files/Williams Car.avif';
import wrCar2024Image from '../Image files/WR car 2024.avif';
import wrCar2024RightImage from '../Image files/WR car 2024 right.avif';
import wrImage from '../Image files/WR.avif';

const BackgroundCarousel = () => {
    // Image config with individual blur and zoom settings
    const imageConfigs = [
        { src: carWRImage, blur: 3, zoom: 100 },              // Car WR - normal
        { src: wrCarImage, blur: 4, zoom: 115 },              // WR car - increased blur + 15% zoom
        { src: williamsCarImage, blur: 4, zoom: 100 },        // Williams Car - increased blur
        { src: wrCar2024Image, blur: 4, zoom: 125 },          // WR car 2024 - increased blur + 25% zoom
        { src: wrCar2024RightImage, blur: 4, zoom: 115 },     // WR car 2024 right - increased blur + 15% zoom
        { src: wrImage, blur: 6, zoom: 100 }                   // WR - extra blur (last, for text readability)
    ];
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Rotate images every 12 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % imageConfigs.length);
        }, 4000); // 4 seconds for testing - TODO: Change back to 12000 before deployment
        return () => clearInterval(interval);
    }, [imageConfigs.length]);

    return (
        <>
            <div
                style={{
                    ...styles.bgImage,
                    backgroundImage: `url(${imageConfigs[currentImageIndex].src})`,
                    filter: `blur(${imageConfigs[currentImageIndex].blur}px)`,
                    backgroundSize: `${imageConfigs[currentImageIndex].zoom}%`
                }}
            />
            <div style={styles.bgOverlay} />
        </>
    );
};

const styles = {
    bgImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background-image 1.5s ease-in-out, filter 1.5s ease-in-out',
        zIndex: 1,
        pointerEvents: 'none'
    },
    bgOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(5, 8, 16, 0.85) 0%, rgba(5, 8, 16, 0.7) 50%, rgba(5, 8, 16, 0.85) 100%)',
        zIndex: 2,
        pointerEvents: 'none'
    }
};

export default BackgroundCarousel;
