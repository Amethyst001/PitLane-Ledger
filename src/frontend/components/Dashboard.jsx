import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import { Search, Activity, AlertTriangle, CheckCircle, Package, Truck, RefreshCw, X, Clock, ArrowRight, Settings, RotateCcw, Flag, Factory, Plane, Car, Users, Layers, TrendingUp } from 'lucide-react';
import PartDetails from './PartDetails';
import SettingsPanel from './SettingsPanel';
import CarConfigurator from './CarConfigurator';
import PredictiveTimeline from './PredictiveTimeline';
import RaceCalendarSettings from './RaceCalendarSettings';
import logo from '../pitlane.png';
import OnboardingGuide from './OnboardingGuide';

const Dashboard = ({ appMode }) => {
    const [parts, setParts] = useState([]);
    const [stats, setStats] = useState({ total: 0, trackside: 0, inTransit: 0, critical: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [activeFilterChassis, setActiveFilterChassis] = useState('ALL'); // NEW: Car 1, Car 2, Spares
    const [visualFilter, setVisualFilter] = useState(null);
    const [selectedPart, setSelectedPart] = useState(null);
    const [driverNames, setDriverNames] = useState({ car1: 'Car 1', car2: 'Car 2' });
    const [lastSynced, setLastSynced] = useState(new Date());
    const [visibleActivityCount, setVisibleActivityCount] = useState(10);
    const [visibleInventoryCount, setVisibleInventoryCount] = useState(10);
    const [showCalendarSettings, setShowCalendarSettings] = useState(false);
    const [raceCalendar, setRaceCalendar] = useState([]);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Initial Load
    useEffect(() => {
        fetchData();
    }, []);

    // Polling for "Live" updates (every 5 seconds) - SMART POLLING
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchData(true); // Silent update only if tab is visible
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Recalculate stats when filter changes
    useEffect(() => {
        const safeParts = Array.isArray(parts) ? parts : [];
        const activeParts = safeParts.filter(p => !['RETIRED', 'SCRAPPED'].includes(p.pitlaneStatus));

        // Apply chassis filter
        let filteredParts = activeParts;
        if (activeFilterChassis === 'CAR1') {
            filteredParts = activeParts.filter(p => p.assignment?.includes('Car 1'));
        } else if (activeFilterChassis === 'CAR2') {
            filteredParts = activeParts.filter(p => p.assignment?.includes('Car 2'));
        } else if (activeFilterChassis === 'SPARES') {
            filteredParts = activeParts.filter(p => p.assignment?.includes('Spares'));
        }

        const newStats = {
            total: filteredParts.length,
            trackside: filteredParts.filter(p => p.pitlaneStatus.includes('Trackside')).length,
            inTransit: filteredParts.filter(p => p.pitlaneStatus.includes('In Transit')).length,
            critical: filteredParts.filter(p => p.pitlaneStatus.includes('DAMAGED') || p.predictiveStatus === 'CRITICAL').length
        };
        setStats(newStats);
    }, [parts, activeFilterChassis]);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // Check production status first
            const prodStatus = await invoke('getProductionStatus');
            console.log('[Dashboard] Production Status:', prodStatus);

            // Call the correct resolver based on mode
            const resolverName = appMode === 'DEMO' ? 'getDemoParts' : 'getProductionParts';
            console.log('[Dashboard] Calling resolver:', resolverName, 'for mode:', appMode);

            const [allParts, calendar, fleetConfig] = await Promise.all([
                invoke(resolverName),
                invoke('getRaceCalendar', { key: 'getRaceCalendar' }),
                invoke('getFleetConfig', { key: 'getFleetConfig' })
            ]);

            setParts(Array.isArray(allParts) ? allParts : []);

            if (!silent) {
                // Only update calendar/drivers on full load to avoid jitter
                const defaultCalendar = [
                    { name: 'Bahrain GP', date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
                    { name: 'Saudi Arabian GP', date: new Date(Date.now() + 97 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
                    { name: 'Australian GP', date: new Date(Date.now() + 111 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
                ];
                setRaceCalendar(Array.isArray(calendar) && calendar.length > 0 ? calendar : defaultCalendar);

                // Load fleet configuration (persisted driver names)
                // Use demo names for DEMO mode, saved names for PROD mode
                if (appMode === 'DEMO') {
                    setDriverNames({ car1: 'Alex Albon', car2: 'Carlos Sainz' });
                } else if (fleetConfig) {
                    setDriverNames({ car1: fleetConfig.car1, car2: fleetConfig.car2 });
                }
            }

            // Calculate Stats - FILTER BY CHASSIS if not showing "ALL"
            const safeParts = Array.isArray(allParts) ? allParts : [];
            const activeParts = safeParts.filter(p => !['RETIRED', 'SCRAPPED'].includes(p.pitlaneStatus));

            // Apply chassis filter
            let filteredParts = activeParts;
            if (activeFilterChassis === 'CAR1') {
                filteredParts = activeParts.filter(p => p.assignment?.includes('Car 1'));
            } else if (activeFilterChassis === 'CAR2') {
                filteredParts = activeParts.filter(p => p.assignment?.includes('Car 2'));
            } else if (activeFilterChassis === 'SPARES') {
                filteredParts = activeParts.filter(p => p.assignment?.includes('Spares'));
            }
            // else activeFilterChassis === 'ALL' - use all activeParts

            const newStats = {
                total: filteredParts.length,
                trackside: filteredParts.filter(p => p.pitlaneStatus.includes('Trackside')).length,
                inTransit: filteredParts.filter(p => p.pitlaneStatus.includes('In Transit')).length,
                critical: filteredParts.filter(p => p.pitlaneStatus.includes('DAMAGED') || p.predictiveStatus === 'CRITICAL').length
            };
            setStats(newStats);
            setLastSynced(new Date());
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleResetOnboarding = async () => {
        try {
            await invoke('resetStorage', { issueId: null });
            window.location.reload();
        } catch (error) {
            console.error('Error resetting onboarding:', error);
            window.location.reload();
        }
    };

    // --- FILTERING LOGIC ---

    // 1. Filter by Chassis (Car 1, Car 2, Spares)
    const chassisFilteredParts = (Array.isArray(parts) ? parts : []).filter(part => {
        if (activeFilterChassis === 'ALL') return true;
        if (activeFilterChassis === 'CAR1') return part.assignment && part.assignment.includes('Car 1');
        if (activeFilterChassis === 'CAR2') return part.assignment && part.assignment.includes('Car 2');
        if (activeFilterChassis === 'SPARES') return part.assignment && part.assignment.includes('Spares');
        return true;
    });

    // 2. Filter by Search, Visual, and Status
    const finalFilteredParts = chassisFilteredParts.filter(part => {
        const matchesSearch = part.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            part.key?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesVisual = visualFilter ? part.name?.toLowerCase().includes(visualFilter.toLowerCase()) : true;

        let matchesStatus = true;
        if (statusFilter === 'TRACKSIDE') matchesStatus = part.pitlaneStatus.includes('Trackside');
        if (statusFilter === 'TRANSIT') matchesStatus = part.pitlaneStatus.includes('In Transit');
        if (statusFilter === 'CRITICAL') matchesStatus = part.pitlaneStatus.includes('DAMAGED') || part.predictiveStatus === 'CRITICAL';
        if (statusFilter === 'MANUFACTURED') matchesStatus = part.pitlaneStatus.includes('Manufactured');

        return matchesSearch && matchesVisual && matchesStatus;
    }).sort((a, b) => {
        // Smart Sort: Critical > Trackside > Transit > Manufactured > Others > Retired
        const getStatusPriority = (p) => {
            if (['RETIRED', 'SCRAPPED'].includes(p.pitlaneStatus)) return 5;
            if (p.pitlaneStatus.includes('DAMAGED') || p.predictiveStatus === 'CRITICAL') return 0;
            if (p.pitlaneStatus.includes('Trackside')) return 1;
            if (p.pitlaneStatus.includes('In Transit')) return 2;
            if (p.pitlaneStatus.includes('Manufactured')) return 3;
            return 4;
        };

        const priorityA = getStatusPriority(a);
        const priorityB = getStatusPriority(b);
        if (priorityA !== priorityB) return priorityA - priorityB;

        return a.name.localeCompare(b.name);
    });

    // Readiness Score Calculation
    const readinessScore = stats.total > 0 ? Math.round((stats.trackside / stats.total) * 100) : 0;
    const getPartWeight = (partName) => {
        if (partName.includes('Power Unit') || partName.includes('Engine') || partName.includes('Gearbox')) return 5;
        if (partName.includes('Wing') || partName.includes('Floor')) return 3;
        return 1;
    };
    const activeGlobalParts = (Array.isArray(parts) ? parts : []).filter(p => !['RETIRED', 'SCRAPPED'].includes(p.pitlaneStatus));
    const totalWeight = activeGlobalParts.reduce((sum, p) => sum + getPartWeight(p.name), 0);
    const tracksideWeight = activeGlobalParts.filter(p => p.pitlaneStatus.includes('Trackside')).reduce((sum, p) => sum + getPartWeight(p.name), 0);
    const weightedReadiness = totalWeight > 0 ? Math.round((tracksideWeight / totalWeight) * 100) : readinessScore;

    // === LOADING STATE ===
    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loadingSpinner}></div>
                <p style={styles.loadingText}>
                    {appMode === 'PROD' ? 'Loading production inventory...' : 'Loading dashboard...'}
                </p>
                <p style={styles.loadingSubtext}>Please wait</p>
            </div>
        );
    }

    if (showOnboarding) {
        return <OnboardingGuide onBack={() => setShowOnboarding(false)} />;
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <img src={logo} alt="Williams Racing" style={styles.logo} />
                    <div style={styles.titling}>
                        <div style={styles.topRow}>
                            <h1 style={styles.title}>Race Operations</h1>
                            <div style={styles.liveIndicator}>
                                <div style={styles.pulseDot}></div>
                                LIVE
                            </div>
                        </div>

                        <div style={styles.controlsRow}>
                            {/* Segmented Control for Filters - WRAPPED IN GLASS PILL */}
                            <div style={styles.glassPill}>
                                <nav aria-label="Fleet view" style={{ ...styles.segmentedControl, background: 'transparent', border: 'none' }}>
                                    <button
                                        onClick={() => setActiveFilterChassis('ALL')}
                                        style={activeFilterChassis === 'ALL' ? styles.segmentBtnActive : styles.segmentBtn}
                                    >
                                        All Fleet
                                    </button>
                                    <div style={styles.segmentDivider} />
                                    <button
                                        onClick={() => setActiveFilterChassis('CAR1')}
                                        style={activeFilterChassis === 'CAR1' ? styles.segmentBtnActive : styles.segmentBtn}
                                    >
                                        <span style={{ color: driverNames.car1 ? '#00A0E3' : 'inherit' }}>Car 1</span>
                                    </button>
                                    <div style={styles.segmentDivider} />
                                    <button
                                        onClick={() => setActiveFilterChassis('CAR2')}
                                        style={activeFilterChassis === 'CAR2' ? styles.segmentBtnActive : styles.segmentBtn}
                                    >
                                        <span style={{ color: driverNames.car2 ? '#22D3EE' : 'inherit' }}>Car 2</span>
                                    </button>
                                    <div style={styles.segmentDivider} />
                                    <button
                                        onClick={() => setActiveFilterChassis('SPARES')}
                                        style={activeFilterChassis === 'SPARES' ? styles.segmentBtnActive : styles.segmentBtn}
                                    >
                                        Spares
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={styles.headerRight}>
                    {/* Simplified Header Right - No Glass Pill or Sparkline */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

                        <div style={styles.statGroup}>
                            <span style={styles.statLabel}>FLEET READINESS</span>
                            <div style={styles.statValue}>{weightedReadiness}%</div>
                        </div>
                        <div style={styles.divider} />
                        <button onClick={() => setShowSettings(true)} style={styles.iconBtn} aria-label="Settings">
                            <Settings size={20} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            </header>

            <div style={styles.grid}>
                <StatCard title="Total Inventory" value={stats.total} icon={<Package size={20} />} color="#00A0E3" sub={`Synced: ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} />
                <StatCard title="Trackside Ready" value={stats.trackside} icon={<CheckCircle size={20} />} color="#00D084" sub="Race Available" />
                <StatCard title="In Transit" value={stats.inTransit} icon={<Activity size={20} />} color="#F59E0B" sub="En Route" />
                <StatCard title="Critical Issues" value={stats.critical} icon={<AlertTriangle size={20} />} color="#F04438" sub="Requires Attention" isCritical />
            </div>

            <div style={styles.splitView}>
                <div style={styles.leftColumn}>
                    {/* Pass FILTERED parts to CarConfigurator so it reflects the chassis selection */}
                    <CarConfigurator onPartSelect={setVisualFilter} parts={chassisFilteredParts} />

                    <div style={styles.panel}>
                        <div style={styles.panelHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h3 style={styles.panelTitle}>Active Inventory</h3>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {[
                                        { id: 'ALL', icon: <Package size={14} />, color: '#6B7280' },
                                        { id: 'TRACKSIDE', icon: <Flag size={14} />, color: '#00D084' },
                                        { id: 'TRANSIT', icon: <Plane size={14} />, color: '#00A0DE' },
                                        { id: 'CRITICAL', icon: <AlertTriangle size={14} />, color: '#F04438' },
                                        { id: 'MANUFACTURED', icon: <Factory size={14} />, color: '#9CA3AF' }
                                    ].map(filter => (
                                        <button
                                            key={filter.id}
                                            onClick={() => setStatusFilter(filter.id)}
                                            style={{
                                                background: statusFilter === filter.id ? filter.color : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${statusFilter === filter.id ? filter.color : 'rgba(255,255,255,0.1)'}`,
                                                borderRadius: '4px',
                                                padding: '4px 8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: statusFilter === filter.id ? '#000' : '#888',
                                                transition: 'all 0.2s'
                                            }}
                                            title={filter.id}
                                        >
                                            {filter.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
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
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {!loading && finalFilteredParts.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '60px',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '16px',
                                    border: '1px dashed var(--color-border-subtle)',
                                    marginTop: '20px'
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏎️</div>
                                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                                        No Parts Found
                                    </h3>
                                    <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                                        {searchQuery
                                            ? `No parts match "${searchQuery}". Try a different search term.`
                                            : "Your inventory is empty. Use the Onboarding Guide to import parts or add them manually via Mobile Mode."}
                                    </p>
                                </div>
                            ) : (
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Name</th>
                                            <th style={styles.th}>Assignment</th>
                                            <th style={styles.th}>Key</th>
                                            <th style={styles.th}>Status</th>
                                            <th style={styles.th}>Est. Life</th>

                                            <th style={styles.th}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {finalFilteredParts.slice(0, visibleInventoryCount).map(part => {
                                            const isRetired = ['RETIRED', 'SCRAPPED'].includes(part.pitlaneStatus);
                                            return (
                                                <tr key={part.id} style={{ ...styles.tr, opacity: isRetired ? 0.5 : 1 }} onClick={() => setSelectedPart(part)}>
                                                    <td style={styles.td}>
                                                        <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{part.name}</span>
                                                    </td>
                                                    <td style={styles.td}>
                                                        {isRetired ? (
                                                            <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                                                        ) : part.assignment ? (
                                                            <span style={getAssignmentStyle(part.assignment)} title={part.assignment}>
                                                                {part.assignment.includes('Car 1') ? `🔵 23 ${driverNames?.car1?.split(' ').pop() || 'Albon'}` :
                                                                    part.assignment.includes('Car 2') ? `🟡 55 ${driverNames?.car2?.split(' ').pop() || 'Sainz'}` :
                                                                        '⚪ Spares'}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td style={styles.td}>{part.key}</td>
                                                    <td style={styles.td}>
                                                        <span style={getStatusStyle(part.pitlaneStatus)}>
                                                            {part.pitlaneStatus}
                                                        </span>
                                                    </td>
                                                    <td style={styles.td}>
                                                        {part.predictiveStatus === 'CRITICAL' && !isRetired ? (
                                                            <span style={{ color: '#F04438', fontWeight: 'bold' }}>EOL</span>
                                                        ) : (
                                                            <span style={{ color: isRetired ? 'var(--color-text-muted)' : '#00D084' }}>
                                                                {isRetired ? '-' : `${part.lifeRemaining} Races`}
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td style={styles.td}>
                                                        <ArrowRight size={16} color="var(--color-accent-cyan)" />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                            {finalFilteredParts.length > visibleInventoryCount && (
                                <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid var(--color-border-subtle)' }}>
                                    <button
                                        onClick={() => setVisibleInventoryCount(prev => prev + 10)}
                                        style={styles.loadMoreBtn}
                                    >
                                        Show More
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={styles.rightColumn}>
                    <PredictiveTimeline parts={chassisFilteredParts} calendar={raceCalendar} onOpenSettings={() => setShowCalendarSettings(true)} />
                    <div style={{ ...styles.panel, height: '450px' }}>
                        <div style={styles.panelHeader}>
                            <h3 style={styles.panelTitle}>Recent Activity</h3>
                        </div>
                        <div style={styles.feed}>
                            {chassisFilteredParts.slice(0, visibleActivityCount).map((part) => (
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

            {
                selectedPart && (
                    <div style={styles.drawerOverlay} onClick={() => setSelectedPart(null)}>
                        <div style={styles.drawer} onClick={e => e.stopPropagation()}>
                            <button style={styles.closeButton} onClick={() => setSelectedPart(null)}>
                                <X size={24} />
                            </button>
                            <PartDetails
                                key={selectedPart.id}
                                issueId={selectedPart.id}
                                issueKey={selectedPart.key}
                                appMode={appMode}
                            />
                        </div>
                    </div>
                )
            }

            {
                showCalendarSettings && (
                    <RaceCalendarSettings
                        onClose={() => setShowCalendarSettings(false)}
                        onSave={(newCalendar) => setRaceCalendar(newCalendar)}
                        initialRaces={raceCalendar}
                    />
                )
            }

            {
                showSettings && (
                    <SettingsPanel
                        onClose={() => setShowSettings(false)}
                        currentDriverNames={driverNames}
                        appMode={appMode}
                        onDriverNamesUpdated={(newNames) => {
                            setDriverNames(newNames);
                            setShowSettings(false);
                            fetchData(); // Reload to refresh dashboard with new names
                        }}
                    />
                )
            }
        </div >
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

const ReadinessSparkline = ({ readiness }) => {
    // Generate simple 5-point trend based on current readiness
    // 100 -> 98 -> 95 -> 96 -> Current
    // This simulates a "Season Start" baseline drifting to current state
    const points = [100, 98, 95, 92, readiness];
    const max = 100;
    const min = 80; // Scale focus

    // Normalize points to SVG viewBox (50x20)
    const normalizeY = (val) => 20 - ((val - min) / (max - min)) * 20;
    const polylineMap = points.map((p, i) => `${i * 12.5},${normalizeY(p)}`).join(' ');

    const isPositive = readiness >= 90;
    const color = isPositive ? '#00D084' : '#F59E0B';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <svg width="50" height="20" viewBox="0 0 50 20" style={{ overflow: 'visible' }}>
                {/* Trend Line */}
                <polyline
                    points={polylineMap}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* End Dot */}
                <circle cx="50" cy={normalizeY(readiness)} r="3" fill={color} />
            </svg>
            <div style={{ fontSize: '10px', color: color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                {isPositive ? <TrendingUp size={10} /> : <Activity size={10} />}
                {readiness >= 95 ? '> Target' : 'Stable'}
            </div>
        </div>
    );
};

const getStatusStyle = (status) => {
    const base = { padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, display: 'inline-block' };
    if (status.includes('Trackside')) return { ...base, background: 'rgba(0, 208, 132, 0.15)', color: '#00D084' };
    if (status.includes('Transit')) return { ...base, background: 'rgba(139, 92, 246, 0.15)', color: 'var(--color-accent-purple)' };
    if (status.includes('Manufactured')) return { ...base, background: 'rgba(0, 184, 217, 0.15)', color: '#00B8D9' };
    if (status.includes('DAMAGED')) return { ...base, background: 'rgba(240, 68, 56, 0.15)', color: '#F04438' };
    return { ...base, background: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8' };
};

const getAssignmentStyle = (assignment) => {
    const base = { padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid transparent' };
    if (assignment && assignment.includes('Car 1')) return { ...base, background: 'rgba(0, 102, 202, 0.15)', color: 'var(--color-accent-blue)', borderColor: 'rgba(0, 102, 202, 0.3)' };
    if (assignment && assignment.includes('Car 2')) return { ...base, background: 'rgba(34, 211, 238, 0.15)', color: '#22D3EE', borderColor: 'rgba(34, 211, 238, 0.3)' };
    return { ...base, background: 'rgba(148, 163, 184, 0.1)', color: 'var(--color-text-muted)', borderColor: 'rgba(148, 163, 184, 0.2)' };
};

const styles = {
    container: { padding: '32px 16px', maxWidth: '90%', margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)', zoom: 1.35 },

    // Header Styles - Floating Glass Islands
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', padding: '0 8px' },
    glassPill: { background: 'rgba(21, 27, 46, 0.6)', padding: '4px 8px', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },

    headerLeft: { display: 'flex', alignItems: 'center', gap: '24px' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '24px' },
    logo: { height: '48px', width: 'auto' },
    titling: { display: 'flex', flexDirection: 'column', gap: '6px' },
    topRow: { display: 'flex', alignItems: 'center', gap: '12px' },
    title: { fontSize: '24px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', margin: 0 },

    // Segmented Control
    segmentedControl: { display: 'inline-flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' },
    segmentBtn: { background: 'transparent', border: 'none', color: '#94A3B8', padding: '6px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', borderRadius: '6px', transition: 'all 0.2s' },
    segmentBtnActive: { background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '6px 16px', fontSize: '13px', fontWeight: 600, cursor: 'default', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    segmentDivider: { width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' },

    // Indicators
    liveIndicator: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#00D084', background: 'rgba(0, 208, 132, 0.1)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(0, 208, 132, 0.2)' },
    pulseDot: { width: '6px', height: '6px', background: '#00D084', borderRadius: '50%', boxShadow: '0 0 8px #00D084' },

    // Stats
    statGroup: { textAlign: 'right' },
    statLabel: { display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em', marginBottom: '2px' },
    statValue: { fontSize: '24px', fontWeight: 700, color: '#00B8D9', lineHeight: 1, textShadow: '0 0 20px rgba(0, 184, 217, 0.2)' },

    iconBtn: { background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', ':hover': { background: 'rgba(255,255,255,0.1)', color: 'white' } },
    divider: { width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)' },

    resetBtn: { marginLeft: '20px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '8px', color: '#F04438', cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' },
    card: { background: '#151B2E', border: '1px solid var(--color-border-subtle)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-soft)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    cardLabel: { fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 600 },
    cardValue: { fontSize: '36px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' },
    cardTrend: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-muted)' },
    splitView: { display: 'flex', gap: '24px', flexWrap: 'wrap' },
    leftColumn: { flex: 2, display: 'flex', flexDirection: 'column', gap: '24px' },
    rightColumn: { flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' },
    panel: { background: '#151B2E', border: '1px solid var(--color-border-subtle)', borderRadius: '16px', overflow: 'hidden', height: '450px', display: 'flex', flexDirection: 'column' },
    panelHeader: { padding: '20px', borderBottom: '1px solid var(--color-border-subtle)', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    panelTitle: { margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' },
    searchContainer: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 12px', border: '1px solid var(--color-border-subtle)' },
    searchInput: { background: 'transparent', border: 'none', color: 'white', marginLeft: '8px', fontSize: '13px', outline: 'none', width: '150px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border-subtle)' },
    tr: { borderBottom: '1px solid var(--color-border-subtle)', cursor: 'pointer', transition: 'background 0.2s' },
    td: { padding: '16px 20px', fontSize: '14px', color: 'var(--color-text-secondary)' },
    loadMoreBtn: { background: 'transparent', border: '1px solid var(--color-accent-cyan)', color: 'var(--color-accent-cyan)', padding: '8px 24px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 },
    feed: { padding: '0', flex: 1, overflowY: 'auto' },
    feedItem: { display: 'flex', gap: '16px', padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)' },
    feedIcon: { marginTop: '4px' },
    feedContent: { flex: 1 },
    feedTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '2px' },
    feedStatus: { fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' },
    feedTime: { fontSize: '12px', color: 'var(--color-text-muted)' },
    drawerOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10, 14, 26, 0.8)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' },
    drawer: { width: '600px', maxWidth: '100%', height: '100%', backgroundColor: '#0A0E1A', borderLeft: '1px solid var(--color-border-neon)', boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)', overflowY: 'auto', position: 'relative', paddingTop: '60px' },
    closeButton: { position: 'absolute', top: '20px', right: '20px', background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: 'var(--color-text-primary)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 100, backdropFilter: 'blur(4px)' },

    // Loading State
    loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0A0E1A', color: '#00B8D9' },
    loadingSpinner: { width: '50px', height: '50px', border: '4px solid rgba(0, 184, 217, 0.1)', borderTopColor: '#00B8D9', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    loadingText: { marginTop: '24px', fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' },
    loadingSubtext: { marginTop: '8px', fontSize: '14px', color: 'var(--color-text-muted)' }
};

export default Dashboard;
