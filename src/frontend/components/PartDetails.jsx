import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import { Radio, Plus, QrCode, Smartphone } from 'lucide-react';
import TelemetryTimeline from './TelemetryTimeline';
import LogEventModal from './LogEventModal';
import QRCodePanel from './QRCodePanel';
import MobileControls from './MobileControls';

const PartDetails = ({ issueId, issueKey, onClose }) => {
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showLogModal, setShowLogModal] = useState(false);
    const [showQRPanel, setShowQRPanel] = useState(false);
    const [isMobileMode, setIsMobileMode] = useState(false);

    useEffect(() => {
        if (!issueId) return;

        setLoading(true);
        // Seed demo data first, then fetch history
        invoke('seedDemoData', { issueId })
            .then(() => invoke('getHistory', { issueId }))
            .then(data => {
                setHistory(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading telemetry:', error);
                setLoading(false);
            });
    }, [issueId]);

    const handleLogEvent = async ({ status, note }) => {
        try {
            const updatedHistory = await invoke('logEvent', {
                issueId,
                status,
                note
            });
            setHistory(updatedHistory);
        } catch (error) {
            console.error('Error logging event:', error);
            throw error;
        }
    };

    const handleMobileEventLogged = async () => {
        try {
            const updatedHistory = await invoke('getHistory', { issueId });
            setHistory(updatedHistory);
        } catch (error) {
            console.error('Error refreshing history:', error);
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingContainer}>
                    <div className="shimmer" style={{ width: '100%', height: '80px', marginBottom: '16px' }} />
                    <div className="shimmer" style={{ width: '100%', height: '80px', marginBottom: '16px' }} />
                    <div className="shimmer" style={{ width: '100%', height: '80px' }} />
                    <div style={styles.loadingText}>🏎️ Loading Telemetry...</div>
                </div>
            </div>
        );
    }

    if (isMobileMode) {
        return (
            <MobileControls
                issueId={issueKey || issueId}
                onReturn={() => setIsMobileMode(false)}
                onEventLogged={handleMobileEventLogged}
            />
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 className="gradient-text" style={styles.title}>
                        🏁 PitLane Ledger
                    </h1>
                    <p style={styles.subtitle}>
                        Williams Parts Passport • {issueKey || issueId}
                    </p>
                </div>

                <div style={styles.headerActions}>
                    <div style={styles.liveBadge}>
                        <Radio size={14} className="pulse" style={{ color: 'var(--color-success)' }} />
                        <span style={styles.liveBadgeText}>Live</span>
                    </div>

                    <button onClick={() => setShowLogModal(true)} style={styles.actionButton} title="Log Event">
                        <Plus size={16} />
                        <span>Log Event</span>
                    </button>

                    <button onClick={() => setShowQRPanel(true)} style={styles.actionButtonSecondary} title="QR Code">
                        <QrCode size={16} />
                    </button>

                    <button onClick={() => setIsMobileMode(true)} style={styles.actionButtonSecondary} title="Simulate Mobile">
                        <Smartphone size={16} />
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div style={styles.statsBar}>
                <div style={styles.statItem}>
                    <div style={styles.statValue}>{history?.length || 0}</div>
                    <div style={styles.statLabel}>Events</div>
                </div>
                <div style={styles.statDivider} />
                <div style={styles.statItem}>
                    <div style={styles.statValue}>
                        {history?.[0]?.timestamp
                            ? Math.floor((Date.now() - new Date(history[0].timestamp).getTime()) / (1000 * 60 * 60 * 24))
                            : 0}d
                    </div>
                    <div style={styles.statLabel}>Age</div>
                </div>
                <div style={styles.statDivider} />
                <div style={styles.statItem}>
                    <div style={styles.statValue}>
                        {history?.[history.length - 1]?.status.split(' ')[0] || '—'}
                    </div>
                    <div style={styles.statLabel}>Status</div>
                </div>
            </div>

            {/* Timeline */}
            <div style={styles.timelineContainer}>
                <TelemetryTimeline history={history} />
            </div>

            {/* Modals */}
            <LogEventModal
                isOpen={showLogModal}
                onClose={() => setShowLogModal(false)}
                onSubmit={handleLogEvent}
                issueId={issueKey || issueId}
            />

            <QRCodePanel
                isOpen={showQRPanel}
                onClose={() => setShowQRPanel(false)}
                issueId={issueId}
                issueKey={issueKey}
            />
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: 'var(--color-bg-primary)',
        minHeight: '100%',
        padding: 'var(--spacing-lg)',
        fontFamily: 'var(--font-sans)',
        color: 'var(--color-text-primary)'
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-lg)',
        borderBottom: '1px solid var(--color-border-subtle)'
    },
    headerActions: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' },
    actionButton: {
        display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', padding: '8px 16px',
        backgroundColor: 'var(--color-accent-cyan)', color: 'var(--color-bg-primary)',
        border: '2px solid var(--color-accent-cyan)', borderRadius: 'var(--radius-sm)',
        fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all var(--transition-normal)',
        boxShadow: '0 0 15px rgba(0, 184, 217, 0.3)'
    },
    actionButtonSecondary: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px',
        backgroundColor: 'transparent', color: 'var(--color-accent-cyan)',
        border: '2px solid var(--color-accent-cyan)', borderRadius: 'var(--radius-sm)',
        cursor: 'pointer', transition: 'all var(--transition-normal)'
    },
    title: { fontSize: '28px', fontWeight: '700', margin: 0, letterSpacing: '-0.02em', lineHeight: '1.2' },
    subtitle: { fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-sm)', fontWeight: '400' },
    liveBadge: {
        display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', padding: '6px 12px',
        backgroundColor: 'rgba(0, 208, 132, 0.15)', border: '1px solid rgba(0, 208, 132, 0.3)',
        borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '600'
    },
    liveBadgeText: { color: 'var(--color-success)' },
    statsBar: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)',
        background: 'var(--glass-bg)', backdropFilter: 'blur(12px) saturate(150%)',
        border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-soft)'
    },
    statItem: { textAlign: 'center', flex: 1 },
    statValue: { fontSize: '24px', fontWeight: '700', color: 'var(--color-accent-cyan)', marginBottom: 'var(--spacing-xs)' },
    statLabel: { fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
    statDivider: { width: '1px', height: '40px', backgroundColor: 'var(--color-border-subtle)' },
    timelineContainer: { marginTop: 'var(--spacing-xl)' },
    loadingContainer: { padding: 'var(--spacing-xl)' },
    loadingText: { textAlign: 'center', fontSize: '18px', color: 'var(--color-accent-cyan)', marginTop: 'var(--spacing-lg)' }
};

export default PartDetails;
