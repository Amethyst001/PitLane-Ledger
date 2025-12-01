import React from 'react';
import { AlertTriangle, Calendar, Wrench } from 'lucide-react';

const PredictiveTimeline = ({ parts }) => {
    const upcomingRaces = [
        { name: 'Bahrain GP', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), daysAway: 3 },
        { name: 'Saudi Arabian GP', date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), daysAway: 10 },
        { name: 'Australian GP', date: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000), daysAway: 17 },
    ];

    const criticalParts = parts.filter(p => p.predictiveStatus === 'CRITICAL' && p.lifeRemaining <= 1);
    const warningParts = parts.filter(p => p.predictiveStatus === 'WARNING' || p.lifeRemaining === 2);

    const nextRaceReadiness = parts.filter(p => p.pitlaneStatus.includes('Trackside')).length;
    const inTransit = parts.filter(p => p.pitlaneStatus.includes('Transit')).length;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>Predictive Timeline</h3>
            </div>

            {/* Upcoming End-of-Life Warnings */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>
                    <AlertTriangle size={16} color="#F59E0B" />
                    <span>UPCOMING END-OF-LIFE</span>
                </div>

                {criticalParts.length > 0 && (
                    <div style={styles.eolGroup}>
                        {criticalParts.map(part => (
                            <div key={part.id} style={{ ...styles.eolItem, ...styles.criticalEol }}>
                                <div style={styles.eolName}>{part.name}</div>
                                <div style={styles.eolBadge}>🔴 {part.lifeRemaining} {part.lifeRemaining === 1 ? 'race' : 'races'}</div>
                            </div>
                        ))}
                    </div>
                )}

                {warningParts.length > 0 && (
                    <div style={styles.eolGroup}>
                        {warningParts.map(part => (
                            <div key={part.id} style={{ ...styles.eolItem, ...styles.warningEol }}>
                                <div style={styles.eolName}>{part.name}</div>
                                <div style={styles.eolBadgeWarning}>🟠 {part.lifeRemaining} races</div>
                            </div>
                        ))}
                    </div>
                )}

                {criticalParts.length === 0 && warningParts.length === 0 && (
                    <div style={styles.allClear}>
                        ✅ All parts within safe operating window
                    </div>
                )}
            </div>

            {/* Race Calendar */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>
                    <Calendar size={16} color="#00D9FF" />
                    <span>RACE CALENDAR</span>
                </div>

                {upcomingRaces.map((race, idx) => (
                    <div key={idx} style={styles.raceItem}>
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
                                <span>Replace: {criticalParts.map(p => p.name.split(' ')[0]).join(', ')}</span>
                            </div>
                        )}
                    </div>
                ))}
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
        color: '#EF4444',
    },
    eolBadgeWarning: {
        fontSize: '12px',
        fontWeight: 700,
        color: '#F59E0B',
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
    },
    raceHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
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
        marginBottom: '4px',
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
};

export default PredictiveTimeline;
