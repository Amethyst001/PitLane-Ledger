import React from 'react';
import { invoke } from '@forge/bridge';
import { Play, Rocket, ArrowRight } from 'lucide-react';
import BackgroundCarousel from './BackgroundCarousel';

const ModeSelection = ({ onSelectMode }) => {
    const [isLoading, setIsLoading] = React.useState(null); // 'DEMO' or 'PROD' when loading

    const handleSelection = async (mode) => {
        setIsLoading(mode);
        try {
            // Persist the mode selection to the backend
            await invoke('setAppMode', { mode });
            onSelectMode(mode);
        } catch (error) {
            console.error('Failed to set app mode:', error);
            // Fallback to client-side navigation even if storage fails
            onSelectMode(mode);
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div style={styles.container}>
            <BackgroundCarousel />
            <div style={styles.content}>
                <h1 style={styles.title}>Select Operation Mode</h1>
                <p style={styles.subtitle}>Choose how you want to initialize the PitLane Ledger environment.</p>

                <div style={styles.grid}>
                    {/* DEMO MODE */}
                    <button
                        onClick={() => handleSelection('DEMO')}
                        disabled={isLoading !== null}
                        style={{
                            ...styles.card,
                            opacity: isLoading !== null ? 0.6 : 1,
                            cursor: isLoading !== null ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <div style={styles.iconWrapper}>
                            <Play size={32} color="#00D084" />
                        </div>
                        <div style={styles.cardContent}>
                            <h3 style={styles.cardTitle}>Explore Demo</h3>
                            <p style={styles.cardDesc}>
                                Enter with pre-populated mock data. Ideal for hackathon judging and testing features without setup.
                            </p>
                            <div style={styles.fakeLink}>
                                {isLoading === 'DEMO' ? 'Loading...' : 'Launch Demo'} <ArrowRight size={16} />
                            </div>
                        </div>
                    </button>

                    {/* PRODUCTION MODE */}
                    <button
                        onClick={() => handleSelection('PROD')}
                        disabled={isLoading !== null}
                        style={{
                            ...styles.card,
                            opacity: isLoading !== null ? 0.6 : 1,
                            cursor: isLoading !== null ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <div style={styles.iconWrapper}>
                            <Rocket size={32} color="#00B8D9" />
                        </div>
                        <div style={styles.cardContent}>
                            <h3 style={styles.cardTitle}>Launch Product</h3>
                            <p style={styles.cardDesc}>
                                Start with a clean slate. Configure drivers, import CSV inventory, and set up the team.
                            </p>
                            <div style={styles.fakeLink}>
                                {isLoading === 'PROD' ? 'Loading...' : 'Start Onboarding'} <ArrowRight size={16} />
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Background Elements */}
            <div style={styles.bgGlow} />
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
        fontFamily: 'var(--font-sans)'
    },
    content: {
        position: 'relative',
        zIndex: 10,
        maxWidth: '900px',
        width: '100%',
        padding: '40px',
        textAlign: 'center'
    },
    title: {
        fontSize: '48px',
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: '16px',
        letterSpacing: '-1px'
    },
    subtitle: {
        fontSize: '18px',
        color: '#94A3B8',
        marginBottom: '64px'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '32px'
    },
    card: {
        background: 'rgba(21, 27, 46, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '40px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        height: '100%',
        backdropFilter: 'blur(10px)'
    },
    iconWrapper: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    cardContent: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1
    },
    cardTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: '12px'
    },
    cardDesc: {
        fontSize: '15px',
        color: '#94A3B8',
        lineHeight: '1.6',
        marginBottom: '32px',
        flex: 1
    },
    fakeLink: {
        color: 'var(--color-accent-cyan)',
        fontWeight: '600',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    },
    bgGlow: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '1000px',
        height: '1000px',
        background: 'radial-gradient(circle, rgba(0, 102, 202, 0.1) 0%, rgba(0,0,0,0) 70%)',
        zIndex: 1,
        pointerEvents: 'none'
    },
    bgGrid: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        zIndex: 0,
        pointerEvents: 'none'
    }
};

export default ModeSelection;
