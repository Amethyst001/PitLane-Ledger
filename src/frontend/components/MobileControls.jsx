import React, { useState } from 'react';
import { invoke } from '@forge/bridge';
import { CheckCircle, AlertTriangle, ArrowLeft, Plus, QrCode, X } from 'lucide-react';

const MobileControls = ({ issueId, onReturn, onEventLogged }) => {
    const [isLogging, setIsLogging] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastAction, setLastAction] = useState('');
    const [showAddPartModal, setShowAddPartModal] = useState(false);
    const [newPart, setNewPart] = useState({ name: '', key: '', location: 'Garage 1' });

    const handleQuickLog = async (status) => {
        setIsLogging(true);

        try {
            await invoke('logEvent', {
                key: 'logEvent',
                issueId,
                status,
                note: `Quick log from pit crew mobile at ${new Date().toLocaleTimeString()}`
            });

            setLastAction(status);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2500);

            if (onEventLogged) onEventLogged();
        } catch (error) {
            console.error('Error logging event:', error);
            alert('Failed to log event');
        } finally {
            setIsLogging(false);
        }
    };

    const handleAddPart = async () => {
        if (!newPart.name || !newPart.key) {
            alert('Please enter Name and Key');
            return;
        }
        try {
            await invoke('addPart', {
                key: 'addPart',
                part: newPart
            });
            setShowAddPartModal(false);
            setLastAction('Part Added');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2500);
        } catch (error) {
            console.error('Error adding part:', error);
            alert('Failed to add part');
        }
    };

    const handlePrintQR = () => {
        // Simulate printing
        setLastAction('QR Sent to Printer');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2500);
    };

    return (
        <div style={styles.container}>
            {/* Header Removed as per user request */}
            <div style={{ marginTop: 'var(--spacing-xl)' }} />

            <div style={styles.buttonContainer}>
                <button onClick={() => handleQuickLog('✅ Cleared for Race')} disabled={isLogging} style={{ ...styles.bigButton, ...styles.greenButton }}>
                    <CheckCircle size={48} />
                    <span style={styles.buttonText}>CLEAR FOR RACE</span>
                </button>

                <button onClick={() => handleQuickLog('⚠️ DAMAGED')} disabled={isLogging} style={{ ...styles.bigButton, ...styles.redButton }}>
                    <AlertTriangle size={48} />
                    <span style={styles.buttonText}>LOG DAMAGE</span>
                </button>

                <div style={styles.secondaryRow}>
                    <button onClick={() => setShowAddPartModal(true)} style={styles.secondaryButton}>
                        <Plus size={20} />
                        <span>Add New Part</span>
                    </button>
                    <button onClick={handlePrintQR} style={styles.secondaryButton}>
                        <QrCode size={20} />
                        <span>Print QR</span>
                    </button>
                </div>
            </div>

            {showAddPartModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h3>Add New Part</h3>
                            <button onClick={() => setShowAddPartModal(false)} style={styles.closeBtn}><X size={20} /></button>
                        </div>
                        <input
                            style={styles.input}
                            placeholder="Part Name (e.g. Front Wing)"
                            value={newPart.name}
                            onChange={e => setNewPart({ ...newPart, name: e.target.value })}
                        />
                        <input
                            style={styles.input}
                            placeholder="Part Key (e.g. PIT-999)"
                            value={newPart.key}
                            onChange={e => setNewPart({ ...newPart, key: e.target.value })}
                        />
                        <button onClick={handleAddPart} style={styles.primaryBtn}>Add to Inventory</button>
                    </div>
                </div>
            )}

            <div style={{
                ...styles.toast,
                transform: showSuccess ? 'translateY(0)' : 'translateY(100px)',
                opacity: showSuccess ? 1 : 0
            }}>
                <CheckCircle size={24} color="#00D084" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: '700' }}>Success</span>
                    <span style={{ fontSize: '13px', opacity: 0.8 }}>
                        {lastAction === 'Part Added' ? 'New part added to inventory' :
                            lastAction === 'QR Sent to Printer' ? 'QR Code sent to local printer' :
                                'Event logged successfully'}
                    </span>
                </div>
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
    buttonContainer: { flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' },
    bigButton: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-md)', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: '24px', fontWeight: '700', cursor: 'pointer', minHeight: '150px', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'transform 0.1s' },
    greenButton: { backgroundColor: 'rgba(0, 208, 132, 0.1)', color: '#00D084', border: '2px solid #00D084' },
    redButton: { backgroundColor: 'rgba(240, 68, 56, 0.1)', color: '#F04438', border: '2px solid #F04438' },
    secondaryRow: { display: 'flex', gap: '16px' },
    secondaryButton: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', backgroundColor: '#151B2E', color: '#00B8D9', border: '1px solid #00B8D9', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    buttonText: { fontSize: '20px', fontWeight: '700' },
    toast: {
        position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: '#151B2E', border: '1px solid #00D084', borderRadius: '50px',
        padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)', zIndex: 2000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        color: '#FFFFFF', fontWeight: '600'
    },
    returnButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-md)', backgroundColor: 'transparent', color: 'var(--color-accent-cyan)', border: '2px solid var(--color-accent-cyan)', borderRadius: 'var(--radius-sm)', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 },
    modal: { backgroundColor: '#151B2E', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid #2D3748' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', color: 'white' },
    closeBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer' },
    input: { width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #2D3748', backgroundColor: '#0A0E1A', color: 'white' },
    primaryBtn: { width: '100%', padding: '12px', backgroundColor: '#00B8D9', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }
};

export default MobileControls;
