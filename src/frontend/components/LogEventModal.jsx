import React, { useState } from 'react';
import { X } from 'lucide-react';

const STATUS_PRESETS = [
    { value: '🏭 Manufactured', label: '🏭 Manufactured' },
    { value: '✅ Quality Checked', label: '✅ Quality Checked' },
    { value: '📦 Packaged', label: '📦 Packaged' },
    { value: '✈️ Shipped', label: '✈️ Shipped' },
    { value: '🏁 Trackside', label: '🏁 Trackside' },
    { value: '⚠️ DAMAGED', label: '⚠️ DAMAGED' },
    { value: '🔧 Maintenance', label: '🔧 Maintenance' },
    { value: '🚚 In Transit', label: '🚚 In Transit' }
];

const LogEventModal = ({ isOpen, onClose, onSubmit, issueId, issueKey, partName }) => {
    const [status, setStatus] = useState(STATUS_PRESETS[0].value);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await onSubmit({ status, note });
            setStatus(STATUS_PRESETS[0].value);
            setNote('');
            onClose();
        } catch (error) {
            console.error('Error logging event:', error);
            alert('Failed to log event. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <div>
                        <h2 style={styles.modalTitle}>Log Telemetry Event</h2>
                        <p style={styles.modalSubtitle}>
                            {issueKey || issueId} {partName ? `• ${partName}` : ''}
                        </p>
                    </div>
                    <button style={styles.closeButton} onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Event Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} style={styles.select} required>
                            {STATUS_PRESETS.map((preset) => (
                                <option key={preset.value} value={preset.value}>{preset.label}</option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Notes</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Enter event details (optional)..."
                            style={styles.textarea}
                            rows={4}
                        />
                    </div>

                    <div style={styles.buttonGroup}>
                        <button type="button" onClick={onClose} style={styles.buttonSecondary} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" style={styles.buttonPrimary} disabled={isSubmitting}>
                            {isSubmitting ? 'Logging...' : 'Log Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(10, 14, 26, 0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 'var(--spacing-lg)'
    },
    modal: {
        background: 'var(--glass-bg)', backdropFilter: 'blur(12px) saturate(150%)',
        border: '2px solid var(--color-border-neon)', borderRadius: 'var(--radius-lg)',
        boxShadow: '0 0 40px rgba(0, 184, 217, 0.3), var(--shadow-soft)',
        maxWidth: '500px', width: '100%', padding: 'var(--spacing-xl)'
    },
    modalHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-md)',
        borderBottom: '1px solid var(--color-border-subtle)'
    },
    modalTitle: {
        fontSize: '20px', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0,
        background: 'linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-blue))',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
    },
    modalSubtitle: { fontSize: '13px', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)' },
    closeButton: {
        background: 'transparent', border: 'none', color: 'var(--color-text-secondary)',
        cursor: 'pointer', padding: 'var(--spacing-xs)', borderRadius: 'var(--radius-sm)',
        transition: 'all var(--transition-normal)', display: 'flex'
    },
    form: { display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' },
    label: {
        fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)',
        textTransform: 'uppercase', letterSpacing: '0.05em'
    },
    select: {
        backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)',
        padding: '12px 16px', fontSize: '14px', cursor: 'pointer'
    },
    textarea: {
        backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)',
        padding: '12px 16px', fontSize: '14px', resize: 'vertical', minHeight: '100px'
    },
    buttonGroup: { display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' },
    buttonSecondary: {
        flex: 1, padding: '12px 24px', backgroundColor: 'transparent',
        color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
    },
    buttonPrimary: {
        flex: 1, padding: '12px 24px', backgroundColor: 'var(--color-accent-cyan)',
        color: 'var(--color-bg-primary)', border: '2px solid var(--color-accent-cyan)',
        borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
        boxShadow: '0 0 20px rgba(0, 184, 217, 0.3)'
    }
};

export default LogEventModal;
