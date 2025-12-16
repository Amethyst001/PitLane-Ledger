import React from 'react';
import { AlertTriangle, Calendar, Wrench } from 'lucide-react';

const PredictiveTimeline = ({ parts, calendar = [], onOpenSettings, onPartClick }) => {
    // Process calendar data: calculate daysAway if missing, and sort
    const upcomingRaces = React.useMemo(() => {
        if (!Array.isArray(calendar) || calendar.length === 0) return [];

        return calendar.map(race => {
            if (race.daysAway !== undefined) return race;

            const date = new Date(race.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);
            const diffTime = date - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { ...race, daysAway: diffDays };
        })
            .filter(r => r.daysAway >= 0)
            .sort((a, b) => a.daysAway - b.daysAway);
    }, [calendar]);

    // Critical: CRITICAL status OR lifeRemaining <= 1 OR DAMAGED status
    const criticalParts = React.useMemo(() =>
        parts.filter(p =>
            (p.predictiveStatus === 'CRITICAL' || p.pitlaneStatus?.includes('DAMAGED')) &&
            p.lifeRemaining <= 2
        ), [parts]);

    // Warning: WARNING status OR lifeRemaining = 2-3 (not already critical)
    const warningParts = React.useMemo(() =>
        parts.filter(p =>
            !p.pitlaneStatus?.includes('DAMAGED') &&
            p.predictiveStatus !== 'CRITICAL' &&
            (p.predictiveStatus === 'WARNING' || (p.lifeRemaining >= 2 && p.lifeRemaining <= 3))
        ), [parts]);

    const nextRaceReadiness = parts.filter(p => p.pitlaneStatus.includes('Trackside')).length;
    const inTransit = parts.filter(p => p.pitlaneStatus.includes('Transit')).length;

    const [visibleRaces, setVisibleRaces] = React.useState(3);
    const [visibleEOLCount, setVisibleEOLCount] = React.useState(10);

    const toggleShowMore = () => {
        setVisibleRaces(prev => prev === 3 ? upcomingRaces.length : 3);
    };

    const handlePartClick = (part) => {
        if (onPartClick) {
            onPartClick(part.key);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>Predictive Timeline</h3>
                <button onClick={onOpenSettings} style={styles.iconButton} title="Manage Calendar">
                    <Calendar size={16} />
                </button>
            </div>

            {/* Upcoming End-of-Life Warnings */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>
                    <AlertTriangle size={16} color="#F59E0B" />
                    <span>UPCOMING END-OF-LIFE</span>
                </div>

                {criticalParts.length > 0 && (
                    <div style={styles.eolGroup}>
                        {criticalParts.slice(0, visibleEOLCount).map(part => (
                            <div
                                key={part.id}
                                style={{ ...styles.eolItem, ...styles.criticalEol, cursor: onPartClick ? 'pointer' : 'default' }}
                                onClick={() => handlePartClick(part)}
                            >
                                <div style={styles.eolName}>{part.name}</div>
                                <div style={styles.eolBadge}>🔴 {part.lifeRemaining} {part.lifeRemaining === 1 ? 'race' : 'races'}</div>
                            </div>
                        ))}
                    </div>
                )}

                {warningParts.length > 0 && (
                    <div style={styles.eolGroup}>
                        {warningParts.slice(0, Math.max(0, visibleEOLCount - criticalParts.length)).map(part => (
                            <div
                                key={part.id}
                                style={{ ...styles.eolItem, ...styles.warningEol, cursor: onPartClick ? 'pointer' : 'default' }}
                                onClick={() => handlePartClick(part)}
                            >
                                <div style={styles.eolName}>{part.name}</div>
                                <div style={styles.eolBadgeWarning}>🟠 {part.lifeRemaining} races</div>
                            </div>
                        ))}
                    </div>
                )}

                {criticalParts.length === 0 && warningParts.length === 0 && (
                    <div style={styles.allClear}>
                        All parts within safe operating window
                    </div>
                )}

                {(criticalParts.length + warningParts.length) > 10 && visibleEOLCount < (criticalParts.length + warningParts.length) && (
                    <div style={{ padding: '12px 0', textAlign: 'center' }}>
                        <button
                            onClick={() => setVisibleEOLCount(criticalParts.length + warningParts.length)}
                            style={styles.showMoreBtn}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--color-accent-cyan)';
                                e.currentTarget.style.color = '#0A0E1A';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--color-accent-cyan)';
                            }}
                        >
                            Show More ({(criticalParts.length + warningParts.length) - visibleEOLCount} more)
                        </button>
                    </div>
                )}
            </div>

            {/* Race Calendar */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>
                    <Calendar size={16} color="#00D9FF" />
                    <span>RACE CALENDAR</span>
                </div>

                {upcomingRaces.slice(0, visibleRaces).map((race, idx) => {
                    const raceDate = new Date(race.date);
                    const month = raceDate.toLocaleString('default', { month: 'short' }).toUpperCase();
                    const day = raceDate.getDate().toString().padStart(2, '0');

                    return (
                        <div key={idx} style={styles.raceItem}>
                            <div style={styles.dateBox}>
                                <div style={styles.dateMonth}>{month}</div>
                                <div style={styles.dateDay}>{day}</div>
                            </div>
                            <div style={styles.raceContent}>
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
                                    <div style={styles.raceMaintenance}>
                                        <Wrench size={12} />
                                        <span>Replace: {criticalParts.map(p => p.name?.split(' ')[0] || 'Unknown').join(', ')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {upcomingRaces.length > 3 && (
                    <div style={{ padding: '12px 0', textAlign: 'center' }}>
                        <button
                            onClick={toggleShowMore}
                            style={styles.showMoreBtn}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--color-accent-cyan)';
                                e.currentTarget.style.color = '#0A0E1A';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--color-accent-cyan)';
                            }}
                        >
                            {visibleRaces === 3 ? 'Show More' : 'Show Less'}
                        </button>
                    </div>
                )}
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
        height: '450px',
        overflowY: 'auto'
    },
    header: {
        padding: '20px',
        borderBottom: '1px solid var(--color-border-subtle)',
        background: 'rgba(255, 255, 255, 0.02)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconButton: {
        background: 'transparent',
        border: 'none',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '4px',
        transition: 'color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--color-text-primary)',
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
        marginBottom: '12px',
    },
    eolGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '8px',
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
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flex: 1,
        marginRight: '12px',
    },
    eolBadge: {
        fontSize: '12px',
        fontWeight: 700,
        color: '#EF4444',
        width: '90px', // Fixed width for consistent column alignment
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'flex-start', // Align circles to the left within the fixed column
        alignItems: 'center',
    },
    eolBadgeWarning: {
        fontSize: '12px',
        fontWeight: 700,
        color: '#F59E0B',
        width: '90px',
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    allClear: {
        fontSize: '13px',
        color: '#00D084',
        fontWeight: 500,
        textAlign: 'center',
        padding: '8px',
    },
    raceItem: {
        padding: '12px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start'
    },
    dateBox: {
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        padding: '8px',
        minWidth: '50px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--color-border-subtle)'
    },
    dateMonth: {
        fontSize: '10px',
        fontWeight: 700,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase'
    },
    dateDay: {
        fontSize: '18px',
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        lineHeight: 1.2
    },
    raceContent: {
        flex: 1
    },
    raceHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
    },
    raceName: {
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--color-text-primary)',
    },
    raceDays: {
        fontSize: '11px',
        fontWeight: 700,
        color: '#00D9FF',
        background: 'rgba(0, 217, 255, 0.1)',
        padding: '2px 6px',
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
        color: '#EF4444',
        background: 'rgba(239, 68, 68, 0.1)',
        padding: '4px 8px',
        borderRadius: '4px',
        marginTop: '6px',
    },
    showMoreBtn: {
        background: 'transparent',
        border: '1px solid var(--color-accent-cyan)',
        color: 'var(--color-accent-cyan)',
        padding: '8px 24px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 600,
        transition: 'all 0.2s'
    },
};

export default PredictiveTimeline;
