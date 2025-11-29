import React, { useState, useEffect } from 'react';
import { invoke, view } from '@forge/bridge';
import { Search, Activity, AlertTriangle, CheckCircle, Package, Truck, RefreshCw, X, Clock, ArrowRight } from 'lucide-react';
import PartDetails from './PartDetails';
import CarConfigurator from './CarConfigurator';
import PredictiveTimeline from './PredictiveTimeline';

const Dashboard = () => {
    const [parts, setParts] = useState([]);
    const [stats, setStats] = useState({ total: 0, trackside: 0, inTransit: 0, critical: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [visualFilter, setVisualFilter] = useState(null);
    const [selectedPart, setSelectedPart] = useState(null);
    const [lastSynced, setLastSynced] = useState(new Date());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const allParts = await invoke('getAllParts');
            setParts(allParts);

            const newStats = {
                total: allParts.length,
                trackside: allParts.filter(p => p.pitlaneStatus.includes('Trackside')).length,
                inTransit: allParts.filter(p => p.pitlaneStatus.includes('In Transit')).length,
                critical: allParts.filter(p => p.pitlaneStatus.includes('DAMAGED') || p.predictiveStatus === 'CRITICAL').length
            };
            setStats(newStats);
            setLastSynced(new Date());
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredParts = parts.filter(part => {
        const matchesSearch = part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            part.key.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesVisual = visualFilter ? part.name.includes(visualFilter) : true;
        return matchesSearch && matchesVisual;
    });

    const readinessScore = stats.total > 0 ? Math.round((stats.trackside / stats.total) * 100) : 0;

    // Weighted Readiness: Critical parts count more
    const getPartWeight = (partName) => {
        if (partName.includes('Power Unit') || partName.includes('Engine') || partName.includes('Gearbox') || partName.includes('ICE') || partName.includes('MGU')) return 5;
        if (partName.includes('Wing') || partName.includes('Floor') || partName.includes('Diffuser')) return 3;
        if (partName.includes('Suspension') || partName.includes('Wishbone')) return 2;
        return 1;
    };
    const totalWeight = parts.reduce((sum, p) => sum + getPartWeight(p.name), 0);
    const tracksideWeight = parts.filter(p => p.pitlaneStatus.includes('Trackside')).reduce((sum, p) => sum + getPartWeight(p.name), 0);
    const weightedReadiness = totalWeight > 0 ? Math.round((tracksideWeight / totalWeight) * 100) : readinessScore;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.logoArea}>
                    <span style={styles.f1Icon}>🏎️</span>
                    <h1 style={styles.title}>Mission Control (Live)</h1>
                    <p style={styles.subtitle}>Global Parts Overview • Williams Racing</p>
                </div>
                <div style={styles.readinessContainer}>
                    <div style={styles.readinessBadge}>
                        <div style={styles.readinessLabel}>FLEET READINESS</div>
                        <div style={styles.readinessValue}>{weightedReadiness}%</div>
                    </div>
                    <svg width="60" height="30" style={{ marginLeft: '16px' }}>
                        <path d="M0,25 Q15,5 30,15 T60,5" fill="none" stroke="#00D084" strokeWidth="3" />
                    </svg>
                </div>
            </header>

            <div style={styles.grid}>
                <StatCard title="Total Inventory" value={stats.total} icon={<Package size={20} />} color="#00A0E3" sub={`Synced: ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} />
                <StatCard title="Trackside Ready" value={stats.trackside} icon={<CheckCircle size={20} />} color="#00D084" sub="Race Available" />
                <StatCard title="In Transit" value={stats.inTransit} icon={<Activity size={20} />} color="#F59E0B" sub="En Route" />
                <StatCard title="Critical Issues" value={stats.critical} icon={<AlertTriangle size={20} />} color="#EF4444" sub="Requires Attention" isCritical />
            </div>

            <div style={styles.splitView}>
                <div style={styles.leftColumn}>
                    <CarConfigurator onPartSelect={setVisualFilter} parts={parts} />

                    <div style={styles.panel}>
                        <div style={styles.panelHeader}>
                            <h3 style={styles.panelTitle}>Active Inventory</h3>
                            <div style={styles.searchContainer}>
                                <Search size={16} style={{ marginRight: '8px', color: '#888' }} />
                                <input
                                    type="text"
                                    placeholder="Search parts..."
                                    style={styles.searchInput}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Part Name</th>
                                    <th style={styles.th}>Key</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Life</th>
                                    <th style={styles.th}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredParts.slice(0, 10).map(part => (
                                    <tr key={part.id} style={styles.tr} onClick={() => setSelectedPart(part)}>
                                        <td style={styles.td}>
                                            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{part.name}</span>
                                        </td>
                                        <td style={styles.td}>{part.key}</td>
                                        <td style={styles.td}>
                                            <span style={getStatusStyle(part.pitlaneStatus)}>
                                                {part.pitlaneStatus}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            {part.predictiveStatus === 'CRITICAL' ? (
                                                <span style={{ color: '#EF4444', fontWeight: 'bold' }}>⚠️ End of Life</span>
                                            ) : (
                                                <span style={{ color: '#00D084' }}>{part.lifeRemaining} Races</span>
                                            )}
                                        </td>
                                        <td style={styles.td}>
                                            <ArrowRight size={16} color="var(--color-accent-cyan)" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={styles.rightColumn}>
                    <PredictiveTimeline parts={parts} />
                    <div style={styles.panel}>
                        <div style={styles.panelHeader}>
                            <h3 style={styles.panelTitle}>Recent Activity</h3>
                        </div>
                        <div style={styles.feed}>
                            {parts.slice(0, 5).map((part) => (
                                <div key={part.id} style={styles.feedItem}>
                                    <div style={styles.feedIcon}>
                                        <Clock size={14} color="var(--color-text-secondary)" />
                                    </div>
                                    <div style={styles.feedContent}>
                                        <div style={styles.feedTitle}>{part.name}</div>
                                        <div style={styles.feedStatus}>
                                            Updated to <span style={{ color: 'var(--color-accent-cyan)' }}>{part.pitlaneStatus}</span>
                                        </div>
                                        <div style={styles.feedTime}>{new Date(part.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {selectedPart && (
                <div style={styles.drawerOverlay} onClick={() => setSelectedPart(null)}>
                    <div style={styles.drawer} onClick={e => e.stopPropagation()}>
                        <button style={styles.closeButton} onClick={() => setSelectedPart(null)}>
                            <X size={24} />
                        </button>
                        <PartDetails
                            issueId={selectedPart.id}
                            issueKey={selectedPart.key}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, icon, color, sub, isCritical }) => (
    <div style={{
        ...styles.card,
        ...(isCritical ? {
            border: '1px solid rgba(239, 68, 68, 0.4)',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.3), inset 0 0 10px rgba(239, 68, 68, 0.1)'
        } : {})
    }}>
        <div style={styles.cardHeader}>
            <div style={styles.cardLabel}>{title}</div>
            <div style={{ color }}>{icon}</div>
        </div>
        <div style={styles.cardValue}>{value}</div>
        <div style={{ ...styles.cardTrend, color }}>
            {sub}
        </div>
    </div>
);

const getStatusStyle = (status) => {
    const base = {
        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, display: 'inline-block'
    };
    if (status.includes('Trackside')) return { ...base, background: 'rgba(0, 208, 132, 0.15)', color: '#00D084' };
    if (status.includes('Transit')) return { ...base, background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' };
    if (status.includes('Manufactured')) return { ...base, background: 'rgba(0, 184, 217, 0.15)', color: '#00B8D9' };
    if (status.includes('DAMAGED')) return { ...base, background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' };
    return { ...base, background: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8' };
};

const styles = {
    container: { padding: '40px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' },
    header: { marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
    logoArea: { display: 'flex', flexDirection: 'column' },
    f1Icon: { fontSize: '32px', marginBottom: '10px' },
    title: { fontSize: '36px', fontWeight: 700, marginBottom: '4px', background: 'linear-gradient(90deg, #fff, #00A0E3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    subtitle: { color: 'var(--color-text-secondary)', fontSize: '16px' },
    readinessContainer: { display: 'flex', alignItems: 'center' },
    readinessBadge: { textAlign: 'right' },
    readinessLabel: { fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' },
    readinessValue: { fontSize: '48px', fontWeight: '700', color: '#00D084', lineHeight: 1, textShadow: '0 0 20px rgba(0, 208, 132, 0.3)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' },
    card: { background: '#151B2E', border: '1px solid var(--color-border-subtle)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-soft)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    cardLabel: { fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 600 },
    cardValue: { fontSize: '36px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' },
    cardTrend: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-muted)' },
    splitView: { display: 'flex', gap: '24px', flexWrap: 'wrap' },
    leftColumn: { flex: 2, display: 'flex', flexDirection: 'column', gap: '24px' },
    rightColumn: { flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' },
    panel: { background: '#151B2E', border: '1px solid var(--color-border-subtle)', borderRadius: '16px', overflow: 'hidden', minHeight: '600px', display: 'flex', flexDirection: 'column' },
    panelHeader: { padding: '20px', borderBottom: '1px solid var(--color-border-subtle)', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    panelTitle: { margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' },
    searchContainer: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 12px', border: '1px solid var(--color-border-subtle)' },
    searchInput: { background: 'transparent', border: 'none', color: 'white', marginLeft: '8px', fontSize: '13px', outline: 'none', width: '150px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border-subtle)' },
    tr: { borderBottom: '1px solid var(--color-border-subtle)', cursor: 'pointer', transition: 'background 0.2s' },
    td: { padding: '16px 20px', fontSize: '14px', color: 'var(--color-text-secondary)' },
    feed: { padding: '0', flex: 1 },
    feedItem: { display: 'flex', gap: '16px', padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)' },
    feedIcon: { marginTop: '4px' },
    feedContent: { flex: 1 },
    feedTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '2px' },
    feedStatus: { fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' },
    feedTime: { fontSize: '12px', color: 'var(--color-text-muted)' },
    drawerOverlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(10, 14, 26, 0.8)', backdropFilter: 'blur(4px)',
        zIndex: 1000, display: 'flex', justifyContent: 'flex-end'
    },
    drawer: {
        width: '600px', maxWidth: '100%', height: '100%',
        backgroundColor: '#0A0E1A', borderLeft: '1px solid var(--color-border-neon)',
        boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)',
        overflowY: 'auto', position: 'relative',
        paddingTop: '60px'
    },
    closeButton: {
        position: 'absolute', top: '20px', right: '20px',
        background: 'rgba(255, 255, 255, 0.1)',
        border: 'none', color: 'var(--color-text-primary)',
        borderRadius: '50%', width: '32px', height: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', zIndex: 100,
        backdropFilter: 'blur(4px)'
    }
};

export default Dashboard;
