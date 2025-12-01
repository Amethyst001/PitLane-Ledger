import React from 'react';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { Factory, Wrench, CheckCircle, Package, Plane, Flag, AlertTriangle, Truck, ClipboardCheck } from 'lucide-react';

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
    if (statusLower.includes('damaged') || statusLower.includes('failed') || statusLower.includes('alert') || statusLower.includes('wear') || statusLower.includes('warning')) {
        return <AlertTriangle size={20} />;
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
    if (!status) return '#00B8D9';
    const statusLower = status.toLowerCase();

    if (statusLower.includes('damaged') || statusLower.includes('failed') || statusLower.includes('critical')) {
        return '#F04438';
    }
    if (statusLower.includes('quality') || statusLower.includes('passed') || statusLower.includes('trackside')) {
        return '#00D084';
    }
    if (statusLower.includes('transit') || statusLower.includes('shipped')) {
        return '#00A0DE';
    }

    return '#00B8D9';
};

const TelemetryTimeline = ({ history }) => {
    if (!Array.isArray(history) || history.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-muted)' }}>
                No telemetry data available
            </div>
        );
    }

    return (
        <VerticalTimeline lineColor="var(--color-border-neon)" layout="1-column-left" animate={true}>
            {history.map((event) => {
                const color = getColorForStatus(event.status);

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
                            {event.status}
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

export default TelemetryTimeline;
