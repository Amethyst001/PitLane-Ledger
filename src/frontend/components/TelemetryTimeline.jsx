import React from 'react';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { Factory, Wrench, CheckCircle, Package, Plane, Flag, AlertTriangle, Truck, ClipboardCheck, Archive, AlertCircle } from 'lucide-react';

/**
 * Icon mapping for different event statuses
 */
const getIconForStatus = (status) => {
    if (!status) return <Wrench size={20} />;
    const statusLower = status.toLowerCase();

    if (statusLower.includes('manufactured') || statusLower.includes('forged') || statusLower.includes('assembly')) {
        return <Factory size={20} />;
    }
    if (statusLower.includes('inspection') || statusLower.includes('review')) {
        return <ClipboardCheck size={20} />;
    }
    if (statusLower.includes('quality') || statusLower.includes('testing') || statusLower.includes('passed') || statusLower.includes('certified')) {
        return <CheckCircle size={20} />;
    }
    if (statusLower.includes('packaged') || statusLower.includes('sealed') || statusLower.includes('received') || statusLower.includes('receive') || statusLower.includes('ordered')) {
        return <Package size={20} />;
    }
    if (statusLower.includes('transit') || statusLower.includes('shipped') || statusLower.includes('flight')) {
        return <Plane size={20} />;
    }
    if (statusLower.includes('trackside') || statusLower.includes('arrived')) {
        return <Flag size={20} />;
    }
    if (statusLower.includes('end of life') || statusLower.includes('retired') || statusLower.includes('scrapped')) {
        return <Archive size={20} />;
    }
    if (statusLower.includes('damaged') || statusLower.includes('failed') || statusLower.includes('critical')) {
        return <AlertTriangle size={20} />;
    }
    if (statusLower.includes('alert') || statusLower.includes('wear') || statusLower.includes('warning')) {
        return <AlertCircle size={20} />;
    }
    if (statusLower.includes('assigned') || statusLower.includes('install') || statusLower.includes('fitted') || statusLower.includes('service')) {
        return <Wrench size={20} />;
    }
    if (statusLower.includes('deliver') || statusLower.includes('dispatched')) {
        return <Truck size={20} />;
    }

    return <Wrench size={20} />;
};

const getColorForStatus = (status) => {
    // UNIFIED CYAN-BLUE COLOR for all timeline icons (per user request - consistent texture)
    return '#00B8D9'; // Cyan-blue for all statuses
};

const TelemetryTimeline = ({ history }) => {
    // Strip emojis from status text - timeline circles already have icons
    const stripEmojis = (text) => {
        if (!text) return text;
        return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2B50}]|[\u{2705}]|[\u{26A0}]|[\u{2708}]|[\u{1F3C1}]|[\u{1F3ED}]|[\u{1F4E6}]|[\u{1F6A8}]|[\u{1F527}]/gu, '').trim();
    };

    // Deduplicate CONSECUTIVE entries with same status within 5 minutes (accidental double-clicks)
    const deduplicatedHistory = React.useMemo(() => {
        if (!Array.isArray(history) || history.length === 0) return [];

        // SORT by timestamp descending (most recent first)
        const sorted = [...history].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        const result = [];
        const FIVE_MINUTES_MS = 5 * 60 * 1000;

        for (let i = 0; i < sorted.length; i++) {
            const current = sorted[i];
            const prev = result[result.length - 1];

            // If no previous, or different status, add it
            if (!prev) {
                result.push(current);
                continue;
            }

            // Normalize statuses for comparison (remove emojis, lowercase)
            const currentStatus = stripEmojis(current.status || '').toLowerCase();
            const prevStatus = stripEmojis(prev.status || '').toLowerCase();

            // If statuses are different, add it
            if (currentStatus !== prevStatus) {
                result.push(current);
                continue;
            }

            // Same status - check time difference
            const currentTime = new Date(current.timestamp).getTime();
            const prevTime = new Date(prev.timestamp).getTime();
            const timeDiff = Math.abs(currentTime - prevTime);

            // If more than 5 minutes apart, it's a legitimate re-entry, add it
            if (timeDiff > FIVE_MINUTES_MS) {
                result.push(current);
            }
            // Otherwise skip (duplicate within 5 minutes)
        }

        return result;
    }, [history]);

    if (deduplicatedHistory.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-muted)' }}>
                No telemetry data available
            </div>
        );
    }

    return (
        <VerticalTimeline lineColor="var(--color-border-neon)" layout="1-column-left" animate={true}>
            {deduplicatedHistory.map((event) => {
                const color = getColorForStatus(event.status);
                const displayStatus = stripEmojis(event.status);

                return (
                    <VerticalTimelineElement
                        key={event.id}
                        date={new Date(event.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                        iconStyle={{
                            background: color,
                            color: '#fff',
                            boxShadow: `0 0 20px ${color}80`
                        }}
                        icon={getIconForStatus(event.status)}
                        contentStyle={{
                            background: 'var(--glass-bg)',
                            backdropFilter: 'blur(12px) saturate(150%)',
                            WebkitBackdropFilter: 'blur(12px) saturate(150%)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-soft)',
                            color: 'var(--color-text-primary)',
                            transition: 'all var(--transition-normal)'
                        }}
                        contentArrowStyle={{ borderRight: '7px solid var(--glass-border)' }}
                        dateClassName="timeline-date"
                    >
                        <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            marginBottom: 'var(--spacing-sm)',
                            color: 'var(--color-text-primary)'
                        }}>
                            {displayStatus}
                        </h3>

                        {event.note && (
                            <p style={{
                                fontSize: '14px',
                                lineHeight: '1.6',
                                color: 'var(--color-text-secondary)',
                                marginBottom: 'var(--spacing-xs)'
                            }}>
                                {event.note}
                            </p>
                        )}

                        <div style={{
                            fontSize: '12px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--color-text-muted)',
                            marginTop: 'var(--spacing-sm)',
                            paddingTop: 'var(--spacing-sm)',
                            borderTop: '1px solid var(--color-border-subtle)'
                        }}>
                            ID: {event.id?.substring(0, 8) || 'Unknown'}...
                        </div>
                    </VerticalTimelineElement>
                );
            })}
        </VerticalTimeline>
    );
};

// Helper: Strip emojis and invisible characters for cleaner display
const stripEmojis = (str) => {
    return str
        .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|[\uFE00-\uFE0F]|\u200B)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

export default TelemetryTimeline;
