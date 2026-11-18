import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_PRESETS = [
    { value: '🏭 Manufactured', icon: '🏭', label: 'Manufactured' },
    { value: '✅ Quality Checked', icon: '✅', label: 'Quality Checked' },
    { value: '📦 Packaged', icon: '📦', label: 'Packaged' },
    { value: '✈️ Shipped', icon: '✈️', label: 'Shipped' },
    { value: '🏁 Trackside', icon: '🏁', label: 'Trackside' },
    { value: '✅ Cleared for Race', icon: '✅', label: 'Cleared for Race' },
    { value: '⚠️ DAMAGED', icon: '⚠️', label: 'DAMAGED' },
    { value: '🔧 Maintenance', icon: '🔧', label: 'Maintenance' },
    { value: '🚚 In Transit', icon: '🚚', label: 'In Transit' },
    { value: '📦 RETIRED', icon: '📦', label: 'RETIRED' }
];

const LogEventModal = ({ isOpen, onClose, onSubmit, issueId, issueKey, partName, currentStatus, currentAssignment, driverNames, isMobile }) => {
    // Dynamic assignment options using driver last names for consistency
    const getLastName = (name) => name?.split(' ').pop() || name;
    const ASSIGNMENT_OPTIONS = [
        { value: '', label: 'No Change' },
        { value: `Car 1 (${getLastName(driverNames?.car1) || 'Driver 1'})`, label: `Car 1 (${getLastName(driverNames?.car1) || 'Driver 1'})` },
        { value: `Car 2 (${getLastName(driverNames?.car2) || 'Driver 2'})`, label: `Car 2 (${getLastName(driverNames?.car2) || 'Driver 2'})` },
        { value: 'Spares', label: 'Spares' }
    ];

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
    const [showStatusDropdown, setShowStatusDropdown] = useState(false); // Custom dropdown state
    const [showAssignmentDropdown, setShowAssignmentDropdown] = useState(false); // Custom assignment dropdown

    // Update status when modal opens or currentStatus changes
    React.useEffect(() => {
        if (isOpen) {
            setStatus(getNextStatus(currentStatus));
            setAssignment(''); // Reset to no change on open
            setShowAdditionalDetails(false);
        }
    }, [isOpen, currentStatus]);

    // Keyboard shortcut: Escape to close
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
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
            // Show actual error message (e.g., Parc Fermé) instead of generic failure
            const errorMessage = error?.message || 'Failed to log event. Please try again.';
            setValidationError({ type: 'error', message: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Check if the current part is retired
    const isRetired = currentStatus && (currentStatus.toLowerCase().includes('retired') || currentStatus.toLowerCase().includes('scrapped'));

    if (!isOpen) return null;

    // SPECIAL UI FOR RETIRED PARTS - Premium design matching app aesthetic
    if (isRetired) {
        return (
            <div style={styles.overlay} onClick={onClose}>
                <div style={{
                    ...styles.modal,
                    maxWidth: '420px',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(18px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(18px) saturate(180%)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 184, 217, 0.1)'
                }} onClick={(e) => e.stopPropagation()}>
                    {/* Header with subtle gradient accent */}
                    <div style={{
                        padding: '24px 24px 16px',
                        borderBottom: '1px solid var(--color-border-subtle)',
                        background: 'linear-gradient(180deg, rgba(100, 116, 139, 0.1) 0%, transparent 100%)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '4px 10px',
                                    background: 'rgba(100, 116, 139, 0.2)',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: '#94A3B8',
                                    letterSpacing: '0.5px',
                                    marginBottom: '8px'
                                }}>
                                    RETIRED PART
                                </div>
                                <h2 style={{
                                    ...styles.modalTitle,
                                    fontSize: '18px',
                                    marginBottom: '4px'
                                }}>{partName || issueKey || issueId}</h2>
                                <p style={{
                                    fontSize: '13px',
                                    color: 'var(--color-text-muted)',
                                    margin: 0,
                                    fontFamily: 'var(--font-mono)'
                                }}>{issueKey || issueId}</p>
                            </div>
                            <button style={{
                                ...styles.closeButton,
                                background: 'rgba(100, 116, 139, 0.15)',
                                borderRadius: '8px',
                                width: '32px',
                                height: '32px'
                            }} onClick={onClose} aria-label="Close">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Action Cards */}
                    <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                        {/* Refurbish Card */}
                        <button
                            onClick={async () => {
                                setIsSubmitting(true);
                                try {
                                    await onSubmit({ status: '🔄 Refurbished', note: 'Part refurbished and returned to active inventory' });
                                    onClose();
                                } catch (error) {
                                    console.error('Error refurbishing part:', error);
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                            disabled={isSubmitting}
                            style={{
                                padding: '16px 20px',
                                background: 'linear-gradient(135deg, rgba(0, 184, 217, 0.15), rgba(0, 102, 202, 0.1))',
                                border: '1px solid rgba(0, 184, 217, 0.3)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                            }}
                        >
                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #00B8D9, #0066CA)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <ChevronUp size={22} color="white" />
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    color: '#00B8D9',
                                    marginBottom: '2px'
                                }}>Refurbish Part</div>
                                <div style={{
                                    fontSize: '12px',
                                    color: 'var(--color-text-muted)'
                                }}>Return to active inventory for reuse</div>
                            </div>
                        </button>

                        {/* Delete Card */}
                        <button
                            onClick={async () => {
                                if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE ${issueKey || issueId}?\n\nThis will remove all history and cannot be undone.`)) {
                                    return;
                                }
                                setIsSubmitting(true);
                                try {
                                    await onSubmit({ status: '__DELETE__', note: 'Part permanently deleted from inventory' });
                                    onClose();
                                } catch (error) {
                                    console.error('Error deleting part:', error);
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                            disabled={isSubmitting}
                            style={{
                                padding: '16px 20px',
                                background: 'rgba(240, 68, 56, 0.08)',
                                border: '1px solid rgba(240, 68, 56, 0.25)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                            }}
                        >
                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '10px',
                                background: 'rgba(240, 68, 56, 0.15)',
                                border: '1px solid rgba(240, 68, 56, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <X size={20} color="#F04438" />
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    color: '#F04438',
                                    marginBottom: '2px'
                                }}>Permanently Delete</div>
                                <div style={{
                                    fontSize: '12px',
                                    color: 'var(--color-text-muted)'
                                }}>Remove from inventory (irreversible)</div>
                            </div>
                        </button>

                        {/* Cancel link */}
                        <button
                            onClick={onClose}
                            style={{
                                marginTop: '8px',
                                padding: '10px',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: 'var(--color-text-muted)',
                                fontWeight: '500'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.overlay} onClick={onClose}>

            <div style={{
                ...styles.modal,
                ...(isMobile ? { maxWidth: '95vw', width: '95vw', padding: '20px' } : {})
            }} onClick={(e) => e.stopPropagation()}>
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
                                {pendingConfirm.message}
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
                        {/* Custom Table-like Dropdown */}
                        <div style={{ position: 'relative' }}>
                            {/* Trigger Button - shows current selection */}
                            <button
                                type="button"
                                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'var(--color-bg-secondary, #151B2E)',
                                    border: '1px solid var(--color-border-subtle, #2D3748)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>
                                        {STATUS_PRESETS.find(p => p.value === status)?.icon || '📋'}
                                    </span>
                                    <span>{STATUS_PRESETS.find(p => p.value === status)?.label || 'Select Status'}</span>
                                </div>
                                <ChevronDown size={18} style={{ opacity: 0.6, transform: showStatusDropdown ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                            </button>

                            {/* Dropdown List - Table-like layout */}
                            {showStatusDropdown && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    marginTop: '4px',
                                    background: 'var(--color-bg-secondary, #151B2E)',
                                    border: '1px solid var(--color-border-subtle, #2D3748)',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    zIndex: 100,
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
                                }}>
                                    {STATUS_PRESETS.map((preset) => (
                                        <div
                                            key={preset.value}
                                            onClick={() => {
                                                setStatus(preset.value);
                                                setShowStatusDropdown(false);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '12px 16px',
                                                cursor: 'pointer',
                                                background: preset.value === status ? 'rgba(0, 184, 217, 0.15)' : 'transparent',
                                                borderLeft: preset.value === status ? '3px solid #00B8D9' : '3px solid transparent',
                                                transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = preset.value === status ? 'rgba(0, 184, 217, 0.15)' : 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = preset.value === status ? 'rgba(0, 184, 217, 0.15)' : 'transparent'}
                                        >
                                            {/* Icon Column */}
                                            <span style={{
                                                fontSize: '18px',
                                                width: '40px',
                                                textAlign: 'center',
                                                opacity: 0.9,
                                                marginRight: '8px'
                                            }}>
                                                {preset.icon}
                                            </span>
                                            {/* Text Column */}
                                            <span style={{
                                                fontSize: '14px',
                                                color: preset.value === status ? '#00B8D9' : '#E2E8F0',
                                                fontWeight: preset.value === status ? '600' : '400'
                                            }}>
                                                {preset.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
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
                                {/* Custom Assignment Dropdown */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowAssignmentDropdown(!showAssignmentDropdown)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: 'var(--color-bg-secondary, #151B2E)',
                                            border: '1px solid var(--color-border-subtle, #2D3748)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <span>{ASSIGNMENT_OPTIONS.find(o => o.value === assignment)?.label || 'No Change'}</span>
                                        <ChevronDown size={18} style={{ opacity: 0.6, transform: showAssignmentDropdown ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                                    </button>

                                    {showAssignmentDropdown && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            marginTop: '4px',
                                            background: 'var(--color-bg-secondary, #151B2E)',
                                            border: '1px solid var(--color-border-subtle, #2D3748)',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            zIndex: 100,
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
                                        }}>
                                            {ASSIGNMENT_OPTIONS.map((opt) => (
                                                <div
                                                    key={opt.value}
                                                    onClick={() => {
                                                        setAssignment(opt.value);
                                                        setShowAssignmentDropdown(false);
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '12px 16px',
                                                        cursor: 'pointer',
                                                        background: opt.value === assignment ? 'rgba(0, 184, 217, 0.15)' : 'transparent',
                                                        borderLeft: opt.value === assignment ? '3px solid #00B8D9' : '3px solid transparent'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = opt.value === assignment ? 'rgba(0, 184, 217, 0.15)' : 'rgba(255,255,255,0.05)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = opt.value === assignment ? 'rgba(0, 184, 217, 0.15)' : 'transparent'}
                                                >
                                                    <span style={{ fontSize: '14px', color: opt.value === assignment ? '#00B8D9' : '#E2E8F0', fontWeight: opt.value === assignment ? '600' : '400' }}>
                                                        {opt.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {currentAssignment && (
                                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                        Currently: {(() => {
                                            // Extract just "Car 1" or "Car 2" and append last name
                                            if (currentAssignment.includes('Car 1')) {
                                                const lastName = driverNames?.car1?.split(' ').pop() || 'Driver 1';
                                                return `Car 1 (${lastName})`;
                                            } else if (currentAssignment.includes('Car 2')) {
                                                const lastName = driverNames?.car2?.split(' ').pop() || 'Driver 2';
                                                return `Car 2 (${lastName})`;
                                            } else if (currentAssignment.includes('Spare')) {
                                                return 'Spares';
                                            }
                                            return currentAssignment;
                                        })()}
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
    // Increased max-height for mobile to use more screen space
    form: { display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', maxHeight: '85vh', overflowY: 'auto', paddingRight: '8px', overscrollBehavior: 'contain' },
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
