import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_PRESETS = [
    { value: '🏭 Manufactured', label: '🏭 Manufactured' },
    { value: '✅ Quality Checked', label: '✅ Quality Checked' },
    { value: '📦 Packaged', label: '📦 Packaged' },
    { value: '✈️ Shipped', label: '✈️ Shipped' },
    { value: '🏁 Trackside', label: '🏁 Trackside' },
    { value: '✅ Cleared for Race', label: '✅ Cleared for Race' },
    { value: '⚠️ DAMAGED', label: '⚠️ DAMAGED' },
    { value: '🔧 Maintenance', label: '🔧 Maintenance' },
    { value: '🚚 In Transit', label: '🚚 In Transit' }
];

const ASSIGNMENT_OPTIONS = [
    { value: '', label: 'No Change' },
    { value: 'Car 1 (Albon)', label: 'Car 1 (Albon)' },
    { value: 'Car 2 (Sainz)', label: 'Car 2 (Sainz)' },
    { value: 'Spares', label: 'Spares' }
];

const LogEventModal = ({ isOpen, onClose, onSubmit, issueId, issueKey, partName, currentStatus, currentAssignment }) => {
    // Smart default logic with flexible matching
    const getNextStatus = (current) => {
        if (!current) return STATUS_PRESETS[0].value;

        // Normalize: remove emojis and extra whitespace, lowercase
        const normalize = (s) => s?.replace(/[^\w\s]/g, '').trim().toLowerCase() || '';
        const currentNorm = normalize(current);

        // Map normalized keywords to next status
        const transitions = [
            { keywords: ['factory'], next: '🏭 Manufactured' },
            { keywords: ['manufactured'], next: '✅ Quality Checked' },
            { keywords: ['quality', 'checked', 'qc'], next: '📦 Packaged' },
            { keywords: ['packaged', 'packed'], next: '✈️ Shipped' },
            { keywords: ['shipped'], next: '🚚 In Transit' },
            { keywords: ['transit'], next: '🏁 Trackside' },
            { keywords: ['trackside', 'ready', 'garage'], next: '✅ Cleared for Race' },
            { keywords: ['cleared', 'race'], next: '🏁 Trackside' },
            { keywords: ['damaged', 'damage', 'quarantine'], next: '🔧 Maintenance' },
            { keywords: ['maintenance', 'repair'], next: '✅ Quality Checked' }
        ];

        // Find matching transition
        for (const t of transitions) {
            if (t.keywords.some(kw => currentNorm.includes(kw))) {
                return t.next;
            }
        }

        // Fallback to first preset
        return STATUS_PRESETS[0].value;
    };

    const [status, setStatus] = useState(getNextStatus(currentStatus));
    const [assignment, setAssignment] = useState(''); // Empty = no change
    const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);

    // Update status when modal opens or currentStatus changes
    React.useEffect(() => {
        if (isOpen) {
            setStatus(getNextStatus(currentStatus));
            setAssignment(''); // Reset to no change on open
            setShowAdditionalDetails(false);
        }
    }, [isOpen, currentStatus]);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState(null); // In-app error display
    const [pendingConfirm, setPendingConfirm] = useState(null); // For warnings that need confirmation

    // Clear errors when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setValidationError(null);
            setPendingConfirm(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationError(null);

        // --- WORKFLOW VALIDATION ---
        const currentStatusLower = (currentStatus || '').toLowerCase();
        const newStatusLower = status.toLowerCase();

        // Block: Setting same status again (redundant)
        if (currentStatusLower === newStatusLower ||
            (currentStatus && status.replace(/[^\w\s]/g, '').toLowerCase() === currentStatus.replace(/[^\w\s]/g, '').toLowerCase())) {
            // Allow if assignment is changing
            if (!assignment) {
                setValidationError({ type: 'info', message: 'Part already has this status. No change needed.' });
                return;
            }
        }

        // Block: Cannot clear a damaged part for race
        if ((newStatusLower.includes('cleared') && newStatusLower.includes('race')) || newStatusLower.includes('clear for race')) {
            if (currentStatusLower.includes('damage') || currentStatusLower.includes('quarantine') || currentStatusLower.includes('repair')) {
                setValidationError({ type: 'error', message: 'Cannot clear a DAMAGED part for race. Please send the part for maintenance or repair first.' });
                return;
            }
            // Warn if not trackside
            if (!currentStatusLower.includes('trackside') && !currentStatusLower.includes('garage') && !currentStatusLower.includes('ready')) {
                setPendingConfirm({ message: `Part is not trackside (Status: ${currentStatus}). Proceed anyway?` });
                return;
            }
        }

        // Block: Cannot ship a damaged part
        if (newStatusLower.includes('ship') || newStatusLower.includes('transit')) {
            if (currentStatusLower.includes('damage')) {
                setValidationError({ type: 'error', message: 'Cannot ship a DAMAGED part. Please repair or quarantine the part first.' });
                return;
            }
        }

        // Warn: Shipping without Quality Check (skipping steps)
        if (newStatusLower.includes('ship') || newStatusLower.includes('transit')) {
            if (currentStatusLower.includes('factory') || currentStatusLower.includes('manufactured')) {
                if (!currentStatusLower.includes('quality') && !currentStatusLower.includes('check') && !currentStatusLower.includes('packaged')) {
                    setPendingConfirm({ message: 'Part has not been Quality Checked. Shipping without QC may violate compliance. Proceed anyway?' });
                    return;
                }
            }
        }

        // Warn: Going to Trackside without packaging/shipping
        if (newStatusLower.includes('trackside') && !currentStatusLower.includes('transit') && !currentStatusLower.includes('ship')) {
            if (currentStatusLower.includes('factory') || currentStatusLower.includes('manufactured') || currentStatusLower.includes('packaged')) {
                setPendingConfirm({ message: 'Part hasn\'t been shipped. Marking as Trackside directly. Proceed anyway?' });
                return;
            }
        }

        // Warn: Retiring active part
        if (newStatusLower.includes('retire') || newStatusLower.includes('scrap') || newStatusLower.includes('end of life')) {
            if (currentStatusLower.includes('trackside') || currentStatusLower.includes('race') || currentStatusLower.includes('garage')) {
                setPendingConfirm({ message: 'Part is currently active (trackside/race). Retiring an active part is unusual. Are you sure?' });
                return;
            }
        }

        // Warn: Marking new part as damaged
        if (newStatusLower.includes('damage')) {
            if (currentStatusLower.includes('manufactured') || currentStatusLower.includes('factory')) {
                setPendingConfirm({ message: 'Marking a newly manufactured part as DAMAGED. This may indicate a manufacturing defect. Proceed?' });
                return;
            }
        }

        await executeSubmit();
    };

    const executeSubmit = async () => {
        setIsSubmitting(true);
        setPendingConfirm(null);

        try {
            await onSubmit({ status, note, assignment: assignment || undefined });
            setStatus(STATUS_PRESETS[0].value);
            setNote('');
            setAssignment('');
            onClose();
        } catch (error) {
            console.error('Error logging event:', error);
            setValidationError({ type: 'error', message: 'Failed to log event. Please try again.' });
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
                    {/* In-app validation error */}
                    {validationError && (
                        <div style={{
                            padding: '12px 16px',
                            marginBottom: '16px',
                            borderRadius: '8px',
                            background: validationError.type === 'error' ? 'rgba(240, 68, 56, 0.15)' : 'rgba(0, 184, 217, 0.15)',
                            border: `1px solid ${validationError.type === 'error' ? 'rgba(240, 68, 56, 0.4)' : 'rgba(0, 184, 217, 0.4)'}`,
                            color: validationError.type === 'error' ? '#F04438' : '#00B8D9',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <span>{validationError.type === 'error' ? '⚠️' : 'ℹ️'}</span>
                            <span>{validationError.message}</span>
                        </div>
                    )}

                    {/* In-app confirmation warning */}
                    {pendingConfirm && (
                        <div style={{
                            padding: '16px',
                            marginBottom: '16px',
                            borderRadius: '8px',
                            background: 'rgba(247, 144, 9, 0.15)',
                            border: '1px solid rgba(247, 144, 9, 0.4)',
                            color: '#F79009'
                        }}>
                            <div style={{ marginBottom: '12px', fontSize: '13px' }}>
                                ⚠️ {pendingConfirm.message}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={executeSubmit}
                                    style={{ padding: '8px 16px', background: '#F79009', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Yes, Proceed
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPendingConfirm(null)}
                                    style={{ padding: '8px 16px', background: 'transparent', color: '#94A3B8', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Event Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} style={styles.select} required>
                            {STATUS_PRESETS.map((preset) => (
                                <option key={preset.value} value={preset.value}>{preset.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Additional Details Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-accent-cyan)',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            padding: '8px 0'
                        }}
                    >
                        {showAdditionalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        Additional Details
                    </button>

                    {/* Additional Details Section */}
                    {showAdditionalDetails && (
                        <div style={{
                            padding: '16px',
                            background: 'rgba(0, 184, 217, 0.05)',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border-subtle)'
                        }}>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Change Assignment</label>
                                <select
                                    value={assignment}
                                    onChange={(e) => setAssignment(e.target.value)}
                                    style={styles.select}
                                >
                                    {ASSIGNMENT_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {currentAssignment && (
                                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                        Currently: {currentAssignment}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

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
