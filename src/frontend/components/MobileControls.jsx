import React, { useState } from 'react';
import { invoke } from '@forge/bridge';
import { CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

const MobileControls = ({ issueId, onReturn, onEventLogged }) => {
    const [isLogging, setIsLogging] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleQuickLog = async (status) => {
        setIsLogging(true);

        try {
            await invoke('logEvent', {
                issueId,
                status,
                note: `Quick log from pit crew mobile at ${new Date().toLocaleTimeString()}`
            });

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);

            if (onEventLogged) onEventLogged();
        } catch (error) {
            console.error('Error logging event:', error);
            alert('Failed to log event');
        } finally {
            setIsLogging(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>🏁 Pit Crew Control</h1>
                <p style={styles.subtitle}>Issue: {issueId}</p>
            </div>

            <div style={styles.buttonContainer}>
                <button onClick={() => handleQuickLog('✅ Cleared for Race')} disabled={isLogging} style={{ ...styles.bigButton, ...styles.greenButton }}>
                    <CheckCircle size={48} />
                    <span style={styles.buttonText}>CLEAR FOR RACE</span>
                </button>

                <button onClick={() => handleQuickLog('⚠️ DAMAGED')} disabled={isLogging} style={{ ...styles.bigButton, ...styles.redButton }}>
                    <AlertTriangle size={48} />
                    <span style={styles.buttonText}>LOG DAMAGE</span>
                </button>
            </div>

            {/* Subtle Toast Notification */}
            <div style={{
                ...styles.toast,
                transform: showSuccess ? 'translateY(0)' : 'translateY(100px)',
                opacity: showSuccess ? 1 : 0
            }}>
                <CheckCircle size={24} color="#00D084" />
                <span>Event Logged Successfully</span>
            </div>

            <button onClick={onReturn} style={styles.returnButton}>
                <ArrowLeft size={16} />
                <span>Return to Dashboard</span>
            </button>
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)', padding: 'var(--spacing-lg)' },
    header: { textAlign: 'center', marginBottom: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-lg)', borderBottom: '2px solid var(--color-accent-cyan)' },
    title: { fontSize: '32px', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, marginBottom: 'var(--spacing-sm)' },
    subtitle: { fontSize: '16px', color: 'var(--color-text-secondary)', margin: 0 },
    buttonContainer: { flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' },
    bigButton: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-md)', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: '24px', fontWeight: '700', cursor: 'pointer', minHeight: '200px', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'transform 0.1s' },
    greenButton: { backgroundColor: 'rgba(0, 208, 132, 0.1)', color: '#00D084', border: '2px solid #00D084' },
    redButton: { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '2px solid #EF4444' },
    buttonText: { fontSize: '24px', fontWeight: '700' },
    toast: {
        position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: '#151B2E', border: '1px solid #00D084', borderRadius: '50px',
        padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)', zIndex: 2000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        color: '#FFFFFF', fontWeight: '600'
    },
    returnButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-md)', backgroundColor: 'transparent', color: 'var(--color-accent-cyan)', border: '2px solid var(--color-accent-cyan)', borderRadius: 'var(--radius-sm)', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }
};

export default MobileControls;
