import React, { useMemo, useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Truck, Package, Wrench, ChevronRight } from 'lucide-react';

// F1 2024 Critical Parts Categories (per FIA regulations)
const CRITICAL_PARTS = {
    power_unit: { name: 'Power Unit (ICE)', required: 2, seasonLimit: 4 },
    turbo: { name: 'Turbocharger', required: 2, seasonLimit: 4 },
    mgu_k: { name: 'MGU-K', required: 2, seasonLimit: 4 },
    mgu_h: { name: 'MGU-H', required: 2, seasonLimit: 4 },
    energy_store: { name: 'Energy Store', required: 2, seasonLimit: 2 },
    control_electronics: { name: 'Control Electronics', required: 2, seasonLimit: 2 },
    gearbox: { name: 'Gearbox', required: 2, seasonLimit: 4 },
    front_wing: { name: 'Front Wing', required: 2, seasonLimit: null },
    rear_wing: { name: 'Rear Wing', required: 2, seasonLimit: null },
    floor: { name: 'Floor Assembly', required: 2, seasonLimit: null },
    brakes: { name: 'Brake System', required: 2, seasonLimit: null },
    chassis: { name: 'Monocoque', required: 2, seasonLimit: 1 }
};

// Default ETA for In Transit parts (48 hours)
const DEFAULT_TRANSIT_HOURS = 48;

// 30 minutes in ms for completed task display
const COMPLETED_DISPLAY_TIME = 30 * 60 * 1000;

const FleetReadinessModal = ({ isOpen, onClose, parts, readinessScore, onExecuteAction }) => {
    // Track assigned and completed tasks
    const [assignedTasks, setAssignedTasks] = useState({});
    const [completedTasks, setCompletedTasks] = useState({});

    // Load assigned/completed state from sessionStorage
    useEffect(() => {
        const stored = sessionStorage.getItem('pitlane_assigned_insights');
        if (stored) setAssignedTasks(JSON.parse(stored));

        const completed = sessionStorage.getItem('pitlane_completed_insights');
        if (completed) {
            const parsed = JSON.parse(completed);
            // Filter out tasks older than 30 minutes
            const now = Date.now();
            const filtered = {};
            Object.entries(parsed).forEach(([key, timestamp]) => {
                if (now - timestamp < COMPLETED_DISPLAY_TIME) {
                    filtered[key] = timestamp;
                }
            });
            setCompletedTasks(filtered);
        }

        // Listen for task completion from PitCrewTasks
        const handleTaskComplete = (e) => {
            if (e.detail?.taskKey) {
                setCompletedTasks(prev => {
                    const updated = { ...prev, [e.detail.taskKey]: Date.now() };
                    sessionStorage.setItem('pitlane_completed_insights', JSON.stringify(updated));
                    return updated;
                });
                // Remove from assigned
                setAssignedTasks(prev => {
                    const updated = { ...prev };
                    delete updated[e.detail.taskKey];
                    sessionStorage.setItem('pitlane_assigned_insights', JSON.stringify(updated));
                    return updated;
                });
            }
        };
        window.addEventListener('pitlane:pit-crew-task-completed', handleTaskComplete);
        return () => window.removeEventListener('pitlane:pit-crew-task-completed', handleTaskComplete);
    }, []);

    // Keyboard shortcut: Escape to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Handle assign button click
    const handleAssign = (insight, taskKey) => {
        // Mark as assigned
        setAssignedTasks(prev => {
            const updated = { ...prev, [taskKey]: Date.now() };
            sessionStorage.setItem('pitlane_assigned_insights', JSON.stringify(updated));
            return updated;
        });
        // Execute the action (creates pit crew task)
        onExecuteAction(insight);
    };
    // Analyze parts and generate insights
    const analysis = useMemo(() => {
        if (!Array.isArray(parts) || parts.length === 0) {
            return { categories: {}, insights: [], criticalParts: [] };
        }

        const activeParts = parts.filter(p =>
            !['RETIRED', 'SCRAPPED'].some(s => (p.pitlaneStatus || '').toUpperCase().includes(s))
        );

        // Categorize parts - more robust matching with priority order
        const getCategory = (name) => {
            const n = (name || '').toLowerCase();

            // Check most specific patterns first
            // Turbocharger - check before power_unit since names can be "Power Unit Turbocharger"
            if (n.includes('turbo') || n.includes('tc')) return 'turbo';

            // MGU-K and MGU-H - check before other PU components
            if (n.includes('mgu-k') || n.includes('mgu k') || n.includes('mguk') || n.includes('kinetic')) return 'mgu_k';
            if (n.includes('mgu-h') || n.includes('mgu h') || n.includes('mguh') || n.includes('heat')) return 'mgu_h';

            // Energy Store / Battery
            if (n.includes('battery') || n.includes('energy') || n.includes('es ') || n.includes(' es')) return 'energy_store';

            // Control Electronics
            if (n.includes('ecu') || n.includes('electronic') || n.includes('wiring') || n.includes('control') || n.includes('ce ') || n.includes(' ce')) return 'control_electronics';

            // Power Unit (ICE) - after checking turbo/mgu/etc
            if (n.includes('ice') || n.includes('engine') || n.includes('power unit') || n.includes('pu ') || n.includes(' pu') || n.includes('combustion')) return 'power_unit';

            // Gearbox
            if (n.includes('gearbox') || n.includes('gear box') || n.includes('transmission') || n.includes('cassette')) return 'gearbox';

            // Wings - check full phrases
            if (n.includes('front wing') || n.includes('fw ') || n.includes(' fw')) return 'front_wing';
            if (n.includes('rear wing') || n.includes('rw ') || n.includes(' rw') || n.includes('beam wing') || n.includes('drs')) return 'rear_wing';

            // Floor
            if (n.includes('floor') || n.includes('diffuser') || n.includes('plank') || n.includes('underbody')) return 'floor';

            // Brakes
            if (n.includes('brake') || n.includes('caliper') || n.includes('disc') || n.includes('pad')) return 'brakes';

            // Chassis
            if (n.includes('chassis') || n.includes('monocoque') || n.includes('tub') || n.includes('survival cell')) return 'chassis';

            return 'other';
        };

        // Build category stats
        const categories = {};
        Object.keys(CRITICAL_PARTS).forEach(cat => {
            categories[cat] = {
                ...CRITICAL_PARTS[cat],
                trackside: 0,
                inTransit: 0,
                manufactured: 0,
                damaged: 0,
                total: 0,
                parts: []
            };
        });
        categories.other = { name: 'Other Parts', required: 0, trackside: 0, inTransit: 0, manufactured: 0, damaged: 0, total: 0, parts: [] };

        activeParts.forEach(p => {
            const cat = getCategory(p.name);
            if (!categories[cat]) return;

            const status = (p.pitlaneStatus || '').toLowerCase();
            categories[cat].total++;
            categories[cat].parts.push(p);

            if (status.includes('trackside') || status.includes('cleared')) {
                categories[cat].trackside++;
            } else if (status.includes('transit')) {
                categories[cat].inTransit++;
            } else if (status.includes('manufactured') || status.includes('quality')) {
                categories[cat].manufactured++;
            }
            if (status.includes('damage') || p.predictiveStatus === 'CRITICAL') {
                categories[cat].damaged++;
            }
        });

        // Generate actionable insights
        const insights = [];

        // Check for damaged parts with available spares
        activeParts.forEach(p => {
            const status = (p.pitlaneStatus || '').toLowerCase();
            if (status.includes('damage') || p.predictiveStatus === 'CRITICAL') {
                const cat = getCategory(p.name);
                const categoryParts = categories[cat]?.parts || [];
                const healthySpare = categoryParts.find(sp =>
                    sp.key !== p.key &&
                    !(sp.pitlaneStatus || '').toLowerCase().includes('damage') &&
                    sp.predictiveStatus !== 'CRITICAL' &&
                    (sp.assignment?.includes('Spare') || !sp.assignment?.includes('Car'))
                );

                if (healthySpare) {
                    insights.push({
                        type: 'spare_available',
                        priority: 1,
                        icon: 'swap',
                        color: '#00D084',
                        title: `Swap available for ${p.key}`,
                        description: `${p.name} is damaged but ${healthySpare.key} (${healthySpare.life || 100}% life) is available as spare`,
                        action: `Replace with ${healthySpare.key}`,
                        impact: '+5%',
                        executable: true,
                        actionData: {
                            type: 'swap',
                            damagedPartKey: p.key,
                            sparePartKey: healthySpare.key,
                            damagedPartName: p.name,
                            sparePartName: healthySpare.name,
                            spareAssignment: p.assignment // Swap spare to this assignment
                        }
                    });
                } else {
                    insights.push({
                        type: 'no_spare',
                        priority: 0,
                        icon: 'alert',
                        color: '#F04438',
                        title: `Critical: No spare for ${p.key}`,
                        description: `${p.name} is damaged with no healthy backup available`,
                        action: 'Order replacement urgently',
                        impact: 'Risk'
                    });
                }
            }
        });

        // Check for parts in transit (arrival estimate)
        activeParts.filter(p => (p.pitlaneStatus || '').toLowerCase().includes('transit')).forEach(p => {
            insights.push({
                type: 'in_transit',
                priority: 2,
                icon: 'truck',
                color: '#F59E0B',
                title: `${p.key} arriving in ~${DEFAULT_TRANSIT_HOURS}h`,
                description: `${p.name} in transit via ${p.location || 'carrier'}`,
                action: 'Track shipment',
                impact: '+3%'
            });
        });

        // Check for quick wins (trackside parts not cleared)
        activeParts.filter(p => {
            const status = (p.pitlaneStatus || '').toLowerCase();
            return status.includes('trackside') && !status.includes('cleared') && (p.life || 100) > 80;
        }).slice(0, 3).forEach(p => {
            insights.push({
                type: 'quick_win',
                priority: 3,
                icon: 'check',
                color: '#00B8D9',
                title: `Clear ${p.key} for race`,
                description: `${p.name} is trackside at ${p.life || 100}% life`,
                action: 'Mark as race-ready',
                impact: '+2%'
            });
        });

        // Sort insights by priority (critical first)
        insights.sort((a, b) => a.priority - b.priority);

        // Critical parts status
        const criticalParts = Object.entries(categories)
            .filter(([key]) => key !== 'other')
            .map(([key, cat]) => ({
                key,
                name: cat.name,
                required: cat.required,
                available: cat.trackside + cat.inTransit,
                trackside: cat.trackside,
                damaged: cat.damaged,
                status: cat.trackside >= cat.required ? 'ready' :
                    cat.trackside + cat.inTransit >= cat.required ? 'pending' : 'missing'
            }));

        return { categories, insights: insights.slice(0, 6), criticalParts };
    }, [parts]);

    if (!isOpen) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'ready': return '#00D084';
            case 'pending': return '#F59E0B';
            case 'missing': return '#F04438';
            default: return '#64748B';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'ready': return <CheckCircle size={16} />;
            case 'pending': return <Truck size={16} />;
            case 'missing': return <AlertTriangle size={16} />;
            default: return <Package size={16} />;
        }
    };

    const getInsightIcon = (icon) => {
        switch (icon) {
            case 'swap': return <Wrench size={18} />;
            case 'alert': return <AlertTriangle size={18} />;
            case 'truck': return <Truck size={18} />;
            case 'check': return <CheckCircle size={18} />;
            default: return <Package size={18} />;
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.title}>Fleet Readiness</h2>
                        <p style={styles.subtitle}>Race weekend preparation status</p>
                    </div>
                    <button style={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Score Overview */}
                <div style={styles.scoreSection}>
                    <div style={styles.scoreCircle}>
                        <span style={styles.scoreValue}>{readinessScore}</span>
                        <span style={styles.scoreUnit}>%</span>
                    </div>
                    <div style={styles.scoreBar}>
                        <div style={{ ...styles.scoreBarFill, width: `${readinessScore}%` }} />
                    </div>
                    <p style={styles.scoreLabel}>
                        {readinessScore >= 90 ? 'Race Ready' :
                            readinessScore >= 70 ? 'Needs Attention' : 'Critical Issues'}
                    </p>
                </div>

                {/* Critical Parts Checklist */}
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Critical Parts (Both Cars)</h3>
                    <div style={styles.criticalGrid}>
                        {analysis.criticalParts.map(part => (
                            <div key={part.key} style={styles.criticalItem}>
                                <div style={{ ...styles.criticalIcon, color: getStatusColor(part.status) }}>
                                    {getStatusIcon(part.status)}
                                </div>
                                <div style={styles.criticalInfo}>
                                    <span style={styles.criticalName}>{part.name}</span>
                                    <span style={styles.criticalCount}>
                                        {part.trackside}/{part.required} trackside
                                        {part.damaged > 0 && <span style={{ color: '#F04438' }}> • {part.damaged} damaged</span>}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actionable Insights */}
                {analysis.insights.length > 0 && (
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>Priority Actions</h3>
                        <div style={styles.insightsList}>
                            {analysis.insights.map((insight, i) => (
                                <div key={i} style={styles.insightItem}>
                                    <div style={{ ...styles.insightIcon, background: `${insight.color}20`, color: insight.color }}>
                                        {getInsightIcon(insight.icon)}
                                    </div>
                                    <div style={styles.insightContent}>
                                        <div style={styles.insightTitle}>{insight.title}</div>
                                        <div style={styles.insightDesc}>{insight.description}</div>
                                    </div>
                                    {insight.executable && onExecuteAction ? (() => {
                                        const taskKey = insight.actionData?.damagedPartKey || `insight-${i}`;
                                        const isAssigned = assignedTasks[taskKey];
                                        const isComplete = completedTasks[taskKey];

                                        if (isComplete) {
                                            return (
                                                <div style={{ ...styles.executeBtn, background: '#00D084', cursor: 'default', opacity: 0.8 }}>
                                                    ✓ Complete
                                                </div>
                                            );
                                        } else if (isAssigned) {
                                            return (
                                                <div style={{ ...styles.executeBtn, background: '#64748B', cursor: 'default', opacity: 0.7 }}>
                                                    Assigned
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <button
                                                    style={styles.executeBtn}
                                                    onClick={() => handleAssign(insight, taskKey)}
                                                >
                                                    Assign
                                                </button>
                                            );
                                        }
                                    })() : (
                                        <div style={{ ...styles.insightImpact, color: insight.color }}>
                                            {insight.impact}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Close button */}
                <button style={styles.doneBtn} onClick={onClose}>
                    Done
                </button>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
    },
    modal: {
        background: 'var(--glass-bg, rgba(15, 23, 42, 0.95))',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '85vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '20px 24px',
        borderBottom: '1px solid var(--color-border-subtle, rgba(255,255,255,0.1))'
    },
    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: '600',
        color: 'var(--color-text-primary, #fff)'
    },
    subtitle: {
        margin: '4px 0 0',
        fontSize: '13px',
        color: 'var(--color-text-muted, #64748B)'
    },
    closeBtn: {
        background: 'rgba(100, 116, 139, 0.15)',
        border: 'none',
        borderRadius: '8px',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--color-text-muted, #64748B)'
    },
    scoreSection: {
        padding: '24px',
        textAlign: 'center',
        borderBottom: '1px solid var(--color-border-subtle, rgba(255,255,255,0.1))'
    },
    scoreCircle: {
        display: 'inline-flex',
        alignItems: 'baseline',
        marginBottom: '16px'
    },
    scoreValue: {
        fontSize: '56px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #00B8D9, #0066CA)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
    },
    scoreUnit: {
        fontSize: '24px',
        fontWeight: '600',
        color: 'var(--color-text-muted, #64748B)',
        marginLeft: '4px'
    },
    scoreBar: {
        height: '8px',
        background: 'rgba(100, 116, 139, 0.2)',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '12px'
    },
    scoreBarFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #00B8D9, #0066CA)',
        borderRadius: '4px',
        transition: 'width 0.5s ease'
    },
    scoreLabel: {
        margin: 0,
        fontSize: '13px',
        color: 'var(--color-text-muted, #64748B)'
    },
    section: {
        padding: '20px 24px'
    },
    sectionTitle: {
        margin: '0 0 12px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--color-text-muted, #64748B)'
    },
    criticalGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px'
    },
    criticalItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        background: 'rgba(100, 116, 139, 0.08)',
        borderRadius: '8px'
    },
    criticalIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    criticalInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    criticalName: {
        fontSize: '12px',
        fontWeight: '500',
        color: 'var(--color-text-primary, #fff)'
    },
    criticalCount: {
        fontSize: '11px',
        color: 'var(--color-text-muted, #64748B)'
    },
    insightsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    insightItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        background: 'rgba(100, 116, 139, 0.08)',
        borderRadius: '10px'
    },
    insightIcon: {
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
    },
    insightContent: {
        flex: 1,
        minWidth: 0
    },
    insightTitle: {
        fontSize: '13px',
        fontWeight: '500',
        color: 'var(--color-text-primary, #fff)',
        marginBottom: '2px'
    },
    insightDesc: {
        fontSize: '11px',
        color: 'var(--color-text-muted, #64748B)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    insightImpact: {
        fontSize: '12px',
        fontWeight: '600',
        flexShrink: 0
    },
    executeBtn: {
        padding: '6px 12px',
        background: 'linear-gradient(135deg, #00B8D9, #0066CA)',
        border: 'none',
        borderRadius: '6px',
        color: 'white',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'transform 0.2s ease'
    },
    doneBtn: {
        display: 'block',
        width: 'calc(100% - 48px)',
        margin: '0 24px 24px',
        padding: '12px',
        background: 'linear-gradient(135deg, #00B8D9, #0066CA)',
        border: 'none',
        borderRadius: '10px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer'
    }
};

export default FleetReadinessModal;
