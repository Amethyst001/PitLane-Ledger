import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone } from 'lucide-react';

const QRCodePanel = ({ isOpen, onClose, issueId, issueKey }) => {
    if (!isOpen) return null;

    const mobileUrl = `https://williams-parts.atlassian.net/browse/${issueKey || issueId}?view=mobile`;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <div style={styles.headerContent}>
                        <Smartphone size={20} style={{ color: 'var(--color-accent-cyan)' }} />
                        <h2 style={styles.title}>Pit Crew Mode</h2>
                    </div>
                    <button style={styles.closeButton} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div style={styles.qrContainer}>
                    <div style={styles.qrWrapper}>
                        <QRCodeSVG value={mobileUrl} size={200} level="H" bgColor="#151B2E" fgColor="#00B8D9" includeMargin={true} />
                    </div>

                    <p style={styles.instruction}>
                        Scan with your mobile device to access the parts passport on the go
                    </p>

                    <div style={styles.urlBox}>
                        <code style={styles.url}>{mobileUrl}</code>
                    </div>
                </div>

                <div style={styles.infoBadge}>
                    <span>🏁</span>
                    <span style={styles.infoBadgeText}>Track parts from the pit lane in real-time</span>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(10, 14, 26, 0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    },
    panel: {
        background: 'var(--glass-bg)', backdropFilter: 'blur(12px) saturate(150%)',
        border: '2px solid var(--color-border-neon)', borderRadius: 'var(--radius-lg)',
        boxShadow: '0 0 40px rgba(0, 184, 217, 0.3)', maxWidth: '400px', width: '100%', padding: 'var(--spacing-xl)'
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border-subtle)' },
    headerContent: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' },
    title: { fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 },
    closeButton: { background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 'var(--spacing-xs)', borderRadius: 'var(--radius-sm)', display: 'flex' },
    qrContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' },
    qrWrapper: { backgroundColor: 'var(--color-bg-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)', boxShadow: '0 0 30px rgba(0, 184, 217, 0.2)' },
    instruction: { fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: '1.6', margin: 0 },
    urlBox: { width: '100%', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-sm)', overflow: 'hidden' },
    url: { fontSize: '11px', color: 'var(--color-accent-cyan)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', display: 'block' },
    infoBadge: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-md)', backgroundColor: 'rgba(0, 160, 222, 0.15)', border: '1px solid rgba(0, 160, 222, 0.3)', borderRadius: 'var(--radius-sm)' },
    infoBadgeText: { fontSize: '12px', color: 'var(--color-accent-sky)', fontWeight: '500', flex: 1 }
};

export default QRCodePanel;
