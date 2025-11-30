import React, { useState } from 'react';
import { AlertTriangle, Calendar, Wrench, CheckCircle, ChevronDown } from 'lucide-react';

const MaintenanceDropdown = ({ parts }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Refined Red Color (Less sharp/neon, more premium)
    const DANGER_COLOR = '#F04438';
    const DANGER_BG_START = 'rgba(240, 68, 56, 0.12)';
    const DANGER_BG_END = 'rgba(240, 68, 56, 0.06)';

    return (
        <div style={{ marginTop: '8px' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: `linear-gradient(135deg, ${DANGER_BG_START} 0%, ${DANGER_BG_END} 100%)`,
                    border: `1px solid rgba(240, 68, 56, 0.25)`, // Reduced opacity
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: DANGER_COLOR,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isOpen ? `0 4px 12px rgba(240, 68, 56, 0.1)` : `0 2px 4px rgba(240, 68, 56, 0.05)`,
                    transform: isOpen ? 'translateY(-1px)' : 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = `linear-gradient(135deg, rgba(240, 68, 56, 0.16) 0%, rgba(240, 68, 56, 0.1) 100%)`;
                    e.currentTarget.style.borderColor = `rgba(240, 68, 56, 0.35)`;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${DANGER_BG_START} 0%, ${DANGER_BG_END} 100%)`;
                    e.currentTarget.style.borderColor = `rgba(240, 68, 56, 0.25)`;
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wrench size={14} style={{ strokeWidth: 2.5 }} />
                    <span style={{ letterSpacing: '0.3px' }}>Replace {parts.length} Item{parts.length > 1 ? 's' : ''}</span>
                </div>
                <ChevronDown
                    size={16}
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        strokeWidth: 2.5
                    }}
                />
            </button>

            <div style={{
                maxHeight: isOpen ? `${parts.length * 40 + 16}px` : '0px',
                overflow: 'hidden',
                transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                marginTop: isOpen ? '6px' : '0'
            }}>
                <div style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: `1px solid rgba(240, 68, 56, 0.15)`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    backdropFilter: 'blur(8px)'
                }}>
                    {parts.map((p, i) => (
                        <div
                            key={p.id}
                            style={{
                                fontSize: '11px',
                                color: DANGER_COLOR,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 0',
                                borderBottom: i < parts.length - 1 ? `1px solid rgba(240, 68, 56, 0.1)` : 'none',
                                animation: isOpen ? `fadeIn 0.3s ease-out ${i * 0.05}s both` : 'none'
                            }}
                        >
                            <div style={{
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                background: DANGER_COLOR,
                                boxShadow: `0 0 4px rgba(240, 68, 56, 0.5)`
                            }} />
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <span style={{ fontWeight: 500, letterSpacing: '0.2px' }}>{p.name}</span>
                                <span style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px' }}>
                                    {p.sparesAvailable !== undefined ? (
                                        p.sparesAvailable === 0 ? (
                                            <span style={{ color: '#F04438', fontWeight: 'bold' }}>⚠️ NO SPARES</span>
                                        ) : (
                                            <span style={{ color: '#10B981' }}>{p.sparesAvailable} spare{p.sparesAvailable !== 1 ? 's' : ''} available</span>
                                        )
                                    ) : 'Spares unknown'}
                                </span>
                            </div>
                            {p.lifeRemaining !== undefined && (
                                <span style={{
                                    fontSize: '10px',
                                    opacity: 0.8,
                                    background: `rgba(240, 68, 56, 0.1)`,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {p.lifeRemaining} races
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PredictiveTimeline = ({ parts, calendar, onOpenSettings }) => {
    const upcomingRaces = calendar || [
        { name: 'Bahrain GP', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), daysAway: 3 },
        { name: 'Saudi Arabian GP', date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), daysAway: 10 },
        { name: 'Australian GP', date: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000), daysAway: 17 },
    ];

    const criticalParts = parts
        .filter(p =>
            (p.predictiveStatus === 'CRITICAL' || p.predictiveStatus === 'WARNING') &&
            !['RETIRED', 'SCRAPPED'].includes(p.pitlaneStatus)
        )
        .sort((a, b) => a.lifeRemaining - b.lifeRemaining);

    const nextRaceReadiness = parts.filter(p => p.pitlaneStatus.includes('Trackside')).length;
    const inTransit = parts.filter(p => p.pitlaneStatus.includes('Transit')).length;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>Predictive Timeline</h3>
                <button
                    onClick={onOpenSettings}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.2s'
                    }}
                    title="Edit Race Calendar"
                >
                    <Calendar size={16} />
                </button>
            </div>

            <div style={styles.scrollArea}>
                {/* Upcoming End-of-Life Warnings */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>
                        <AlertTriangle size={16} color="#F59E0B" />
                        <span>UPCOMING END-OF-LIFE</span>
                    </div>

                    <div style={styles.eolGroup}>
                        {criticalParts.map(part => (
                            <div key={part.id} style={{
                                ...styles.eolItem,
                                ...(part.predictiveStatus === 'CRITICAL' ? styles.criticalEol : styles.warningEol)
                            }}>
                                <div style={styles.eolName}>{part.name}</div>
                                <div style={part.predictiveStatus === 'CRITICAL' ? styles.eolBadge : styles.eolBadgeWarning}>
                                    {part.predictiveStatus === 'CRITICAL' ? '🔴' : '🟠'} {part.lifeRemaining} {part.lifeRemaining === 1 ? 'race' : 'races'}
                                </div>
                            </div>
                        ))}
                        {criticalParts.length === 0 && (
                            <div style={styles.allClear}>
                                <CheckCircle size={16} color="#00D084" style={{ marginBottom: '4px' }} />
                                <span>All parts within safe operating window</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Race Calendar */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>
                        <Calendar size={16} color="#00D9FF" />
                        <span>RACE CALENDAR</span>
                    </div>

                    <div style={styles.timelineContainer}>
                        {/* Vertical Line */}
                        <div style={styles.timelineLine} />

                        {upcomingRaces.map((race, idx) => (
                            <div key={idx} style={styles.timelineItem}>
                                {/* Timeline Dot */}
                                <div style={{
                                    ...styles.timelineDot,
                                    background: idx === 0 ? '#00D9FF' : '#1E293B',
                                    borderColor: idx === 0 ? 'rgba(0, 217, 255, 0.3)' : '#334155'
                                }} />

                                <div style={styles.timelineContent}>
                                    <div style={styles.raceHeader}>
                                        <div style={styles.raceName}>{race.name}</div>
                                        <div style={styles.raceDays}>{race.daysAway}d</div>
                                    </div>
                                    <div style={styles.raceStatus}>
                                        <span style={{ color: nextRaceReadiness >= 8 ? '#00D084' : '#F59E0B' }}>
                                            {nextRaceReadiness} parts trackside
                                        </span>
                                        {inTransit > 0 && (
                                            <span style={{ color: '#F59E0B', marginLeft: '8px' }}>
                                                • {inTransit} in transit
                                            </span>
                                        )}
                                    </div>
                                    {idx === 0 && criticalParts.length > 0 && (
                                        <MaintenanceDropdown parts={criticalParts} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        background: '#151B2E',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '450px', // Fixed height for balance
    },
    header: {
        padding: '20px',
        borderBottom: '1px solid var(--color-border-subtle)',
        background: 'rgba(255, 255, 255, 0.02)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--color-text-primary)',
    },
    scrollArea: {
        overflowY: 'auto',
        flex: 1,
    },
    section: {
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border-subtle)',
    },
    sectionTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '16px',
    },
    eolGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    eolItem: {
        padding: '10px 12px',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    criticalEol: {
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
    },
    warningEol: {
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
    },
    eolName: {
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--color-text-primary)',
    },
    eolBadge: {
        fontSize: '12px',
        fontWeight: 700,
        color: '#F04438',
        minWidth: '80px',
        textAlign: 'left',
        display: 'flex',
        justifyContent: 'flex-start',
        gap: '6px'
    },
    eolBadgeWarning: {
        fontSize: '12px',
        fontWeight: 700,
        color: '#F59E0B',
        minWidth: '80px',
        textAlign: 'left',
        display: 'flex',
        justifyContent: 'flex-start',
        gap: '6px'
    },
    allClear: {
        fontSize: '13px',
        color: '#00D084',
        fontWeight: 500,
        textAlign: 'center',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(0, 208, 132, 0.05)',
        borderRadius: '8px',
        border: '1px dashed rgba(0, 208, 132, 0.3)'
    },
    timelineContainer: {
        position: 'relative',
        paddingLeft: '12px',
    },
    timelineLine: {
        position: 'absolute',
        left: '19px', // Center of the dot (12px padding + 7px half-width)
        top: '8px',
        bottom: '20px',
        width: '2px',
        background: 'rgba(255, 255, 255, 0.1)',
    },
    timelineItem: {
        position: 'relative',
        paddingLeft: '24px',
        marginBottom: '24px',
    },
    timelineDot: {
        position: 'absolute',
        left: '0',
        top: '4px',
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        border: '2px solid',
        zIndex: 2,
    },
    timelineContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    raceHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    raceName: {
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--color-text-primary)',
    },
    raceDays: {
        fontSize: '12px',
        fontWeight: 700,
        color: '#00D9FF',
        background: 'rgba(0, 217, 255, 0.1)',
        padding: '2px 8px',
        borderRadius: '4px',
    },
    raceStatus: {
        fontSize: '12px',
        color: 'var(--color-text-secondary)',
    },
    raceMaintenance: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        color: '#F04438',
        background: 'rgba(240, 68, 56, 0.1)',
        padding: '4px 8px',
        borderRadius: '4px',
        marginTop: '4px',
    },
};

export default PredictiveTimeline;
