import React, { useState, useEffect } from 'react';

// Import Williams Racing car images in preferred order (same as WelcomeGate)
import carWRImage from '../Image files/Car WR.avif';
import wrCarImage from '../Image files/WR car.avif';
import williamsCarImage from '../Image files/Williams Car.avif';
import wrCar2024Image from '../Image files/WR car 2024.avif';
import wrCar2024RightImage from '../Image files/WR car 2024 right.avif';

const BackgroundCarousel = () => {
    // Image config with individual blur and zoom settings (synced with WelcomeGate)
    const imageConfigs = [
        { src: carWRImage, blur: 2, zoom: 105 },
        { src: wrCarImage, blur: 3, zoom: 115 },
        { src: williamsCarImage, blur: 3, zoom: 110 },
        { src: wrCar2024Image, blur: 3, zoom: 120 },
        { src: wrCar2024RightImage, blur: 3, zoom: 112 }
    ];
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [prevImageIndex, setPrevImageIndex] = useState(null);

    // Smooth crossfade rotation every 12 seconds (matching WelcomeGate)
    useEffect(() => {
        const interval = setInterval(() => {
            setPrevImageIndex(currentImageIndex);
            setCurrentImageIndex((prev) => (prev + 1) % imageConfigs.length);

            // Clear previous image after transition completes
            setTimeout(() => {
                setPrevImageIndex(null);
            }, 3000);
        }, 12000);
        return () => clearInterval(interval);
    }, [currentImageIndex, imageConfigs.length]);

    return (
        <>
            {/* CSS for animations */}
            <style>{`
                @keyframes kenBurnsBg {
                    0% { transform: scale(1) translateX(0); }
                    50% { transform: scale(1.03) translateX(-0.2%); }
                    100% { transform: scale(1) translateX(0); }
                }
                @keyframes fadeInBg {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOutBg {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                .carousel-bg-current {
                    animation: kenBurnsBg 35s cubic-bezier(0.4, 0, 0.2, 1) infinite, fadeInBg 3s ease-in-out;
                }
                .carousel-bg-prev {
                    animation: fadeOutBg 3s ease-in-out forwards;
                }
            `}</style>

            {/* Previous Image (fading out) */}
            {prevImageIndex !== null && (
                <div
                    className="carousel-bg-prev"
                    style={{
                        ...styles.bgImage,
                        backgroundImage: `url(${imageConfigs[prevImageIndex].src})`,
                        filter: `blur(${imageConfigs[prevImageIndex].blur}px)`,
                        backgroundSize: `${imageConfigs[prevImageIndex].zoom}%`
                    }}
                />
            )}

            {/* Current Image (fading in with Ken Burns) */}
            <div
                className="carousel-bg-current"
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
        top: '-5%',
        left: '-5%',
        right: '-5%',
        bottom: '-5%',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 1,
        pointerEvents: 'none'
    },
    bgOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(5, 8, 16, 0.88) 0%, rgba(5, 8, 16, 0.72) 50%, rgba(5, 8, 16, 0.88) 100%)',
        zIndex: 2,
        pointerEvents: 'none'
    }
};

export default BackgroundCarousel;

