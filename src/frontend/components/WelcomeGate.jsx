import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Zap, Activity } from 'lucide-react';
import logo from '../pitlane.png';

// Import Williams Racing car images in preferred order
import carWRImage from '../Image files/Car WR.avif';
import wrCarImage from '../Image files/WR car.avif';
import williamsCarImage from '../Image files/Williams Car.avif';
import wrCar2024Image from '../Image files/WR car 2024.avif';
import wrCar2024RightImage from '../Image files/WR car 2024 right.avif';

const WelcomeGate = ({ onEnter }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [prevImageIndex, setPrevImageIndex] = useState(null);

    const handleEnter = async () => {
        setIsLoading(true);
        try {
            await onEnter();
        } catch (error) {
            console.error('Error entering:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Image config with individual blur and zoom settings
    const imageConfigs = [
        { src: carWRImage, blur: 2, zoom: 105 },
        { src: wrCarImage, blur: 3, zoom: 115 },
        { src: williamsCarImage, blur: 3, zoom: 110 },
        { src: wrCar2024Image, blur: 3, zoom: 120 },
        { src: wrCar2024RightImage, blur: 3, zoom: 112 }
    ];

    // Smooth crossfade image rotation every 12 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setPrevImageIndex(currentImageIndex);
            setCurrentImageIndex((prev) => (prev + 1) % imageConfigs.length);

            // Clear previous image after transition completes (must match fadeOut duration)
            setTimeout(() => {
                setPrevImageIndex(null);
            }, 3000);
        }, 12000);
        return () => clearInterval(interval);
    }, [currentImageIndex, imageConfigs.length]);

    return (
        <div style={styles.container}>
            {/* CSS for animations */}
            <style>{`
                @keyframes kenBurns {
                    0% { transform: scale(1) translateX(0); }
                    50% { transform: scale(1.03) translateX(-0.2%); }
                    100% { transform: scale(1) translateX(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes floatParticle {
                    0% { transform: translateY(0) translateX(0); opacity: 0; }
                    3% { opacity: 0.6; }
                    97% { opacity: 0.6; }
                    100% { transform: translateY(-100vh) translateX(8px); opacity: 0; }
                }
                @keyframes pulseGlow {
                    0%, 100% { opacity: 0.12; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 0.18; transform: translate(-50%, -50%) scale(1.05); }
                }
                .bg-image-current {
                    animation: kenBurns 35s cubic-bezier(0.4, 0, 0.2, 1) infinite, fadeIn 3s ease-in-out;
                }
                .bg-image-prev {
                    animation: fadeOut 3s ease-in-out forwards;
                }
                .floating-particle {
                    position: absolute;
                    width: 3px;
                    height: 3px;
                    background: rgba(0, 184, 217, 0.6);
                    border-radius: 50%;
                    box-shadow: 0 0 4px rgba(0, 184, 217, 0.4);
                    animation: floatParticle 18s linear infinite;
                }
                .bg-glow-animated {
                    animation: pulseGlow 8s ease-in-out infinite;
                }
            `}</style>

            {/* Previous Image (fading out) */}
            {prevImageIndex !== null && (
                <div
                    className="bg-image-prev"
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
                className="bg-image-current"
                style={{
                    ...styles.bgImage,
                    backgroundImage: `url(${imageConfigs[currentImageIndex].src})`,
                    filter: `blur(${imageConfigs[currentImageIndex].blur}px)`,
                    backgroundSize: `${imageConfigs[currentImageIndex].zoom}%`
                }}
            />

            <div style={styles.bgOverlay} />

            {/* Floating Particles - must be above overlay */}
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className="floating-particle"
                    style={{
                        left: `${5 + (i * 8)}%`,
                        bottom: '-10px',
                        animationDelay: `${i * 1.2}s`,
                        animationDuration: `${14 + (i % 4) * 3}s`,
                        zIndex: 5
                    }}
                />
            ))}

            <div style={styles.content}>
                <div style={styles.logoContainer}>
                    <img src={logo} alt="Williams Racing" style={styles.logo} />
                    <div style={styles.badge}>ENTERPRISE ASSET MANAGEMENT</div>
                </div>

                <h1 style={styles.title}>
                    PitLane <span style={{ color: 'var(--color-accent-cyan)' }}>Ledger</span>
                </h1>

                <p style={styles.subtitle}>
                    Advanced Telemetry & Parts Tracking System
                </p>

                <div style={styles.features}>
                    <div style={styles.featureItem}>
                        <ShieldCheck size={20} color="#00D084" />
                        <span>Audit-Ready Architecture</span>
                    </div>
                    <div style={styles.featureItem}>
                        <Zap size={20} color="#F59E0B" />
                        <span>Real-time Sync</span>
                    </div>
                    <div style={styles.featureItem}>
                        <Activity size={20} color="#00B8D9" />
                        <span>Lifecycle Tracking</span>
                    </div>
                </div>

                <button
                    onClick={handleEnter}
                    disabled={isLoading}
                    style={{
                        ...styles.enterButton,
                        opacity: isLoading ? 0.6 : 1,
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                >
                    <span>{isLoading ? 'LOADING...' : 'ENTER PIT LANE'}</span>
                    {!isLoading && <ArrowRight size={20} />}
                </button>

                <div style={styles.footer}>
                    Authorized Personnel Only • Built for Codegeist 2025: Williams Racing Edition
                </div>
            </div>

            {/* Animated Glow */}
            <div className="bg-glow-animated" style={styles.bgGlow} />
            <div style={styles.bgGrid} />
        </div>
    );
};

const styles = {
    container: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#050810',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)'
    },
    content: {
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: '600px',
        padding: '40px'
    },
    logoContainer: {
        marginBottom: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
    },
    logo: {
        height: '64px',
        width: 'auto'
    },
    badge: {
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '2px',
        color: 'rgba(255, 255, 255, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '4px 12px',
        borderRadius: '20px',
        textTransform: 'uppercase'
    },
    title: {
        fontSize: '64px',
        fontWeight: '800',
        color: '#FFFFFF',
        margin: '0 0 16px 0',
        lineHeight: 1.1,
        letterSpacing: '-2px'
    },
    subtitle: {
        fontSize: '18px',
        color: '#94A3B8',
        margin: '0 0 48px 0',
        fontWeight: '400'
    },
    features: {
        display: 'flex',
        gap: '32px',
        marginBottom: '64px',
        color: '#E2E8F0',
        fontSize: '14px',
        fontWeight: '500'
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    enterButton: {
        background: 'linear-gradient(90deg, #0066CA 0%, #00B8D9 100%)',
        border: 'none',
        borderRadius: '4px',
        padding: '16px 48px',
        color: '#FFFFFF',
        fontSize: '16px',
        fontWeight: '700',
        letterSpacing: '1px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        boxShadow: '0 0 30px rgba(0, 184, 217, 0.4)'
    },
    footer: {
        position: 'absolute',
        bottom: '-100px',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.3)',
        letterSpacing: '0.5px'
    },
    bgGlow: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '900px',
        height: '900px',
        background: 'radial-gradient(circle, rgba(0, 102, 202, 0.18) 0%, rgba(0,0,0,0) 60%)',
        zIndex: 1,
        pointerEvents: 'none'
    },
    bgGrid: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        zIndex: 0,
        pointerEvents: 'none'
    },
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

export default WelcomeGate;
