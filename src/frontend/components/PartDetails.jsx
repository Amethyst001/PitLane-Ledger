import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@forge/bridge';
import { Radio, Plus, QrCode, Smartphone } from 'lucide-react';
import logo from '../pitlane.png';
import TelemetryTimeline from './TelemetryTimeline';
import LogEventModal from './LogEventModal';
import QRCodePanel from './QRCodePanel';
import MobileControls from './MobileControls';

const PartDetails = ({ issueId, issueKey, onClose, appMode, onReturn, onScanAnother, isMobileView, onEventLogged }) => {
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allParts, setAllParts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPartId, setCurrentPartId] = useState(issueId);
    const [currentPartKey, setCurrentPartKey] = useState(issueKey);

    // Track previous values to prevent unnecessary re-fetches
    const prevPropsRef = useRef({ issueId, issueKey });
    const dataFetchedRef = useRef(false);

    // Modal states
    const [showLogModal, setShowLogModal] = useState(false);
    const [showQRPanel, setShowQRPanel] = useState(false);
    const [isMobileMode, setIsMobileMode] = useState(false);

    // Strip emojis from status text - timeline icons are sufficient
    const stripEmojis = (text) => {
        if (!text) return text;
        return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2B50}]|[\u{2705}]|[\u{26A0}]|[\u{2708}]|[\u{1F3C1}]|[\u{1F3ED}]|[\u{1F4E6}]|[\u{1F6A8}]|[\u{1F527}]/gu, '').trim();
    };
    const [mobileInitialView, setMobileInitialView] = useState(null);
    const [showQRScanner, setShowQRScanner] = useState(false); // QR scanner modal
    const [pressTimer, setPressTimer] = useState(null); // Long press timer

    // Only fetch data when issueId/issueKey ACTUALLY change (not just re-render)
    useEffect(() => {
        const propsChanged =
            prevPropsRef.current.issueId !== issueId ||
            prevPropsRef.current.issueKey !== issueKey;

        if (!propsChanged && dataFetchedRef.current) {
            // Props haven't changed and data already fetched - skip
            return;
        }

        prevPropsRef.current = { issueId, issueKey };

        // Update local state
        setCurrentPartId(issueId);
        setCurrentPartKey(issueKey);

        const fetchData = async () => {
            // Guard against undefined values
            if (!issueId && !issueKey) {
                console.warn('[PartDetails] No part ID or key provided');
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const query = issueKey || issueId;

                // STRICT MODE LOGIC: Trust the appMode prop
                const useProduction = appMode === 'PROD';

                // Use SEPARATE resolvers for demo vs prod
                const partsResolver = useProduction ? 'getProductionParts' : 'getDemoParts';
                const historyResolver = useProduction ? 'getProductionHistory' : 'getHistory';

                const [historyData, partsData] = await Promise.all([
                    invoke(historyResolver, { query }),
                    invoke(partsResolver)
                ]);

                // Check for errors in response
                if (historyData?.error) {
                    console.error('[PartDetails] History error:', historyData.error);
                    setHistory([]); // Show empty rather than crash
                } else {
                    const historyArray = historyData?.history || (Array.isArray(historyData) ? historyData : []);
                    setHistory(historyArray);
                }

                setAllParts(Array.isArray(partsData) ? partsData : []);
                dataFetchedRef.current = true;
                setLoading(false);
            } catch (error) {
                console.error('[PartDetails] Error loading telemetry:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, [issueId, issueKey]);

    const handlePartChange = async (partId, partKey) => {
        console.log('[PartDetails] handlePartChange called with:', { partId, partKey });
        setCurrentPartId(partId);
        setCurrentPartKey(partKey);

        // Don't refetch - part data is already in allParts, just update history from existing part
        const selectedPart = allParts.find(p => p.key === partKey);
        console.log('[PartDetails] selectedPart found:', !!selectedPart, '| has history:', !!selectedPart?.history);

        if (selectedPart && selectedPart.history) {
            // Part already has history, just update state instantly
            console.log('[PartDetails] Using cached history:', selectedPart.history.length, 'events');
            setHistory(selectedPart.history);
        } else {
            // Only fetch if history not already loaded
            console.log('[PartDetails] Fetching history for:', partKey);
            setLoading(true);
            try {
                const query = partKey || partId;
                const useProduction = appMode === 'PROD';
                const historyResolver = useProduction ? 'getProductionHistory' : 'getHistory';

                console.log('[PartDetails] Calling', historyResolver, 'with query:', query);
                const historyData = await invoke(historyResolver, { query });
                console.log('[PartDetails] History response:', historyData);

                const historyArray = historyData.history || (Array.isArray(historyData) ? historyData : []);
                setHistory(historyArray);
                setLoading(false);
            } catch (error) {
                console.error('[PartDetails] Error loading new part:', error);
                setLoading(false);
            }
        }
    };

    const handleLogEvent = async ({ status, note, assignment }) => {
        // --- VALIDATION BEFORE OPTIMISTIC UPDATE ---
        const partKey = currentPartKey || issueKey;
        const currentPart = allParts.find(p => p.key === partKey);
        const currentStatus = (currentPart?.pitlaneStatus || '').toLowerCase();

        // Validate "Clear for Race" - must not be damaged
        if (status.toLowerCase().includes('cleared') && status.toLowerCase().includes('race')) {
            if (currentStatus.includes('damage') || currentStatus.includes('quarantine') || currentStatus.includes('repair')) {
                throw new Error('Cannot clear a DAMAGED part for race. Please send the part for maintenance or repair first.');
            }
        }

        // OPTIMISTIC UI: Update state immediately for instant feedback
        const optimisticEvent = {
            id: `temp-${Date.now()}`,
            timestamp: new Date().toISOString(),
            status: status,
            note: note
        };

        // Immediately add to history (optimistic)
        setHistory(prev => [optimisticEvent, ...(prev || [])]);

        // Immediately update part status (and assignment if provided) in local state (optimistic)
        setAllParts(prev => prev.map(p =>
            p.key === partKey
                ? {
                    ...p,
                    pitlaneStatus: status,
                    lastUpdated: new Date().toISOString(),
                    ...(assignment ? { assignment } : {})
                }
                : p
        ));

        try {
            // SPECIAL CASE: Permanent delete (from retired parts modal)
            if (status === '__DELETE__') {
                const deleteResult = await invoke('deletePart', {
                    key: 'deletePart',
                    partKey: partKey,
                    appMode
                });

                if (deleteResult?.success) {
                    // Remove from local state
                    setAllParts(prev => prev.filter(p => p.key !== partKey));

                    // DEMO MODE: Also remove from sessionStorage
                    if (appMode === 'DEMO') {
                        const cachedParts = sessionStorage.getItem('pitlane_demo_parts');
                        if (cachedParts) {
                            const currentParts = JSON.parse(cachedParts);
                            const updatedParts = currentParts.filter(p => p.key !== partKey);
                            sessionStorage.setItem('pitlane_demo_parts', JSON.stringify(updatedParts));
                            window.dispatchEvent(new CustomEvent('pitlane:demo-parts-updated', {
                                detail: { parts: updatedParts }
                            }));
                        }
                    }

                    // Navigate back to inventory
                    if (onEventLogged) onEventLogged();
                    if (onClose) onClose();
                } else {
                    throw new Error(deleteResult?.error || 'Failed to delete part');
                }
                return;
            }

            // Fire off the resolver (backend will persist)
            const result = await invoke('logEvent', {
                key: 'logEvent',
                issueId: partKey,
                status,
                note,
                assignment,
                appMode
            });

            // Use returned event ID to update optimistic event
            if (result?.event) {
                setHistory(prev => prev.map(e =>
                    e.id === optimisticEvent.id ? { ...result.event } : e
                ));
            }

            // Use returned updated part if available (avoids refetch)
            if (result?.updatedPart) {
                setAllParts(prev => prev.map(p =>
                    p.key === result.updatedPart.key ? result.updatedPart : p
                ));
            }

            // DEMO MODE: Sync changes to sessionStorage to persist within session
            // Read from sessionStorage directly to avoid stale closure
            if (appMode === 'DEMO') {
                const cachedParts = sessionStorage.getItem('pitlane_demo_parts');
                if (cachedParts) {
                    const currentParts = JSON.parse(cachedParts);
                    const updatedParts = currentParts.map(p =>
                        p.key === partKey ? { ...p, pitlaneStatus: status, assignment: assignment || p.assignment, lastUpdated: new Date().toISOString() } : p
                    );
                    sessionStorage.setItem('pitlane_demo_parts', JSON.stringify(updatedParts));
                    console.log('[PartDetails] DEMO: Synced updated parts to session');

                    // Dispatch event for Dashboard to update its local state (no backend fetch needed)
                    window.dispatchEvent(new CustomEvent('pitlane:demo-parts-updated', {
                        detail: { parts: updatedParts }
                    }));
                }
            }

            // Trigger system-wide refresh in parent (for Dashboard to update) - PROD only
            if (onEventLogged && appMode !== 'DEMO') onEventLogged();

        } catch (error) {
            // ROLLBACK: Revert optimistic updates on failure
            console.error('Error logging event:', error);
            setHistory(prev => prev.filter(e => e.id !== optimisticEvent.id));
            // Refetch to restore correct state
            const partsResolver = appMode === 'PROD' ? 'getProductionParts' : 'getDemoParts';
            const freshParts = await invoke(partsResolver);
            if (Array.isArray(freshParts)) setAllParts(freshParts);
            throw error;
        }
    };

    const handleMobileEventLogged = async () => {
        try {
            // Use correct resolver based on app mode
            const historyResolver = appMode === 'PROD' ? 'getProductionHistory' : 'getHistory';
            const updatedHistoryData = await invoke(historyResolver, { key: historyResolver, query: currentPartKey || currentPartId });
            const historyArray = updatedHistoryData?.history || (Array.isArray(updatedHistoryData) ? updatedHistoryData : []);
            setHistory(historyArray);

            // Also refresh parts list to get updated status
            const partsResolver = appMode === 'PROD' ? 'getProductionParts' : 'getDemoParts';
            const updatedParts = await invoke(partsResolver);
            if (Array.isArray(updatedParts)) {
                setAllParts(updatedParts);
            }

            // Trigger system-wide refresh in parent
            if (onEventLogged) onEventLogged();
        } catch (error) {
            console.error('Error refreshing history:', error);
        }
    };

    // Render Header ALWAYS
    const renderHeader = () => (
        <div style={styles.header}>
            {/* Top Row: Logo, Title, Live Badge */}
            <div style={styles.headerTop}>
                <div style={styles.logoTitleGroup}>
                    <img src={logo} alt="Williams Racing" style={styles.logo} />
                    <div>
                        <h1 className="gradient-text" style={styles.title}>
                            PitLane Ledger
                        </h1>
                        <p style={styles.subtitle}>
                            Williams Parts Passport • {currentPartKey || currentPartId}
                        </p>
                    </div>
                </div>
                <div style={styles.liveBadge}>
                    <div style={{ width: '6px', height: '6px', background: '#00D084', borderRadius: '50%', boxShadow: '0 0 8px #00D084' }}></div>
                    <span style={styles.liveBadgeText}>LIVE</span>
                </div>
            </div>

            {/* Bottom Row: Search, Selector, Actions */}
            <div style={styles.headerBottom}>
                {allParts.length > 0 && (
                    <div style={styles.searchGroup}>
                        <input
                            type="text"
                            placeholder="Search parts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={styles.searchInput}
                        />
                        <select
                            key={`selector-${allParts.length}-${allParts.map(p => p.pitlaneStatus).join('')}`}
                            value={currentPartKey}
                            onChange={(e) => {
                                const selectedPart = allParts.find(p => p.key === e.target.value);
                                if (selectedPart) {
                                    handlePartChange(selectedPart.id, selectedPart.key);
                                }
                            }}
                            style={styles.partSelector}
                        >
                            {allParts
                                .filter(p => !['RETIRED', 'SCRAPPED'].includes(p.pitlaneStatus))
                                .filter(p =>
                                    !searchQuery ||
                                    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    p.key?.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map(part => (
                                    <option
                                        key={`${part.id}-${part.pitlaneStatus}`}
                                        value={part.key}
                                        style={{ background: '#0A0E1A', color: 'white' }}
                                    >
                                        {part.key} - {part.name}
                                    </option>
                                ))
                            }
                        </select>
                    </div>
                )}

                <div style={styles.actionGroup}>
                    <button onClick={() => setShowLogModal(true)} style={styles.actionButton} title="Log Event">
                        <Plus size={16} />
                        <span>Log Event</span>
                    </button>

                    <div style={styles.dividerVertical} />

                    {/* Mobile View: Show Scan Another button */}
                    {isMobileView && onScanAnother && (
                        <button
                            onClick={onScanAnother}
                            style={styles.actionButton}
                            title="Scan Another Part"
                        >
                            <QrCode size={16} />
                            <span>Scan Another</span>
                        </button>
                    )}

                    {/* Desktop View: Show QR and Mobile buttons */}
                    {!isMobileView && (
                        <div style={styles.iconGroup}>
                            <button
                                onClick={() => { setMobileInitialView('scan'); setIsMobileMode(true); }}
                                style={styles.actionButtonSecondary}
                                title="Scan QR Code"
                            >
                                <QrCode size={16} />
                                <span style={{ marginLeft: '6px', fontSize: '12px' }}>Scan QR</span>
                            </button>

                            <button
                                onClick={() => { setMobileInitialView('scan'); setIsMobileMode(true); }}
                                style={styles.actionButtonSecondary}
                                title="Pit Crew Mobile"
                            >
                                <Smartphone size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (isMobileMode) {
        return (
            <MobileControls
                issueId={currentPartKey || currentPartId || issueKey || issueId}
                onReturn={() => setIsMobileMode(false)}
                onEventLogged={handleMobileEventLogged}
                appMode={appMode}
                initialView={mobileInitialView}
                onScanSwitch={(scannedKey) => {
                    const part = allParts.find(p => p.key === scannedKey);
                    if (part) {
                        handlePartChange(part.id, part.key);
                    } else {
                        // If not found, it might be a new part the user wants to add.
                        // But let MobileControls handle the "not found" case or "add new" case?
                        // Actually, MobileControls scanner logic will decide. 
                        // If it calls onScanSwitch, it means it wants to switch.
                        // If we return false or error, MobileControls can show "Add Part" modal.
                        console.warn('Part not found:', scannedKey);
                        // We can't easily return value to MobileControls here if it's async.
                        // But MobileControls has access to invoke('addPart') so it can handle new parts itself.
                        // Here we just handle switching to EXISTING parts.
                    }
                }}
                allParts={allParts} // Pass inventory for local lookup in MobileControls
            />
        );
    }

    return (
        <div style={styles.container}>
            {renderHeader()}

            {loading ? (
                <div style={styles.loadingContainer}>
                    <div className="shimmer" style={{ width: '100%', height: '80px', marginBottom: '16px' }} />
                    <div className="shimmer" style={{ width: '100%', height: '80px', marginBottom: '16px' }} />
                    <div className="shimmer" style={{ width: '100%', height: '80px' }} />
                    <div style={styles.loadingText}>Loading Telemetry...</div>
                </div>
            ) : (
                <>
                    {/* Stats Bar */}
                    <div style={styles.statsBar}>
                        <div style={styles.statItem}>
                            <div style={styles.statValue}>{history?.length || 0}</div>
                            <div style={styles.statLabel}>Events</div>
                        </div>
                        <div style={styles.statDivider} />
                        <div style={styles.statItem}>
                            <div style={styles.statValue}>
                                {history?.[history.length - 1]?.timestamp
                                    ? Math.floor((Date.now() - new Date(history[history.length - 1].timestamp).getTime()) / (1000 * 60 * 60 * 24))
                                    : 0}d
                            </div>
                            <div style={styles.statLabel}>Age</div>
                        </div>
                        <div style={styles.statDivider} />
                        <div style={styles.statItem}>
                            <div style={styles.statValue}>
                                {stripEmojis(history?.[0]?.status) || '—'}
                            </div>
                            <div style={styles.statLabel}>Status</div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div style={styles.timelineContainer}>
                        <TelemetryTimeline history={history} />
                    </div>
                </>
            )}


            {/* Modals */}
            <LogEventModal
                isOpen={showLogModal}
                onClose={() => setShowLogModal(false)}
                onSubmit={handleLogEvent}
                issueId={currentPartId}
                issueKey={currentPartKey || issueKey}
                partName={allParts.find(p => p.key === currentPartKey)?.name}
                currentStatus={allParts.find(p => p.key === currentPartKey)?.pitlaneStatus}
                currentAssignment={allParts.find(p => p.key === currentPartKey)?.assignment}
            />

            <QRCodePanel
                isOpen={showQRPanel}
                onClose={() => setShowQRPanel(false)}
                issueId={issueId}
                issueKey={issueKey}
            />
        </div >
    );
};

const styles = {
    container: {
        backgroundColor: 'var(--color-bg-primary)',
        minHeight: '100%',
        maxWidth: '100vw', // Prevent overflow
        padding: 'var(--spacing-lg)',
        fontFamily: 'var(--font-sans)',
        color: 'var(--color-text-primary)',
        boxSizing: 'border-box', // Include padding in width
        overflowX: 'hidden' // Prevent horizontal scroll
    },
    header: {
        marginBottom: 'var(--spacing-xl)',
        paddingBottom: 'var(--spacing-lg)',
        borderBottom: '1px solid var(--color-border-subtle)'
    },
    headerTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        gap: '12px',
        flexWrap: 'wrap'
    },
    logoTitleGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flex: '1 1 auto'
    },
    logo: {
        height: '40px',
        width: 'auto',
        objectFit: 'contain',
        filter: 'drop-shadow(0 2px 8px rgba(0, 184, 217, 0.3))'
    },
    headerBottom: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center'
    },
    searchGroup: {
        display: 'flex',
        gap: '12px',
        flex: '1 1 auto',
        minWidth: '300px'
    },
    searchInput: {
        background: 'rgba(0, 184, 217, 0.08)',
        border: '2px solid var(--color-accent-cyan)',
        borderRadius: '8px',
        padding: '10px 14px',
        color: 'white',
        fontSize: '13px',
        fontWeight: 500,
        flex: '0 1 180px',
        outline: 'none'
    },
    partSelector: {
        background: 'rgba(0, 184, 217, 0.15)',
        border: '2px solid var(--color-accent-cyan)',
        borderRadius: '8px',
        padding: '10px 16px',
        color: 'var(--color-accent-cyan)',
        fontSize: '13px',
        fontWeight: 600,
        flex: '1 1 auto',
        minWidth: 0, // Allow shrinking below content size
        width: '100%', // Stretch to fill available space
        cursor: 'pointer',
        outline: 'none',
        boxSizing: 'border-box' // Include padding/border in width
    },
    actionGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    iconGroup: {
        display: 'flex',
        gap: '8px'
    },
    dividerVertical: {
        width: '1px',
        height: '24px',
        backgroundColor: 'var(--color-border-subtle)',
        margin: '0 4px'
    },
    actionButton: {
        display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', padding: '10px 16px',
        backgroundColor: 'var(--color-accent-cyan)', color: 'var(--color-bg-primary)',
        border: '2px solid var(--color-accent-cyan)', borderRadius: '8px',
        fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all var(--transition-normal)',
        boxShadow: '0 0 15px rgba(0, 184, 217, 0.3)'
    },
    actionButtonSecondary: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px',
        backgroundColor: 'transparent', color: 'var(--color-accent-cyan)',
        border: '2px solid var(--color-accent-cyan)', borderRadius: '8px',
        cursor: 'pointer', transition: 'all var(--transition-normal)'
    },
    title: { fontSize: '24px', fontWeight: '700', margin: 0, letterSpacing: '-0.02em', lineHeight: '1.2' },
    subtitle: { fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px', fontWeight: '400' },
    liveBadge: {
        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700,
        color: '#00D084', background: 'rgba(0, 208, 132, 0.1)', padding: '2px 8px',
        borderRadius: '12px', border: '1px solid rgba(0, 208, 132, 0.2)'
    },
    liveBadgeText: { color: '#00D084' },
    statsBar: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)',
        background: 'var(--glass-bg)', backdropFilter: 'blur(12px) saturate(150%)',
        border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-soft)'
    },
    statItem: { textAlign: 'center', flex: 1 },
    statValue: { fontSize: '24px', fontWeight: '700', color: 'var(--color-accent-cyan)', marginBottom: 'var(--spacing-xs)' },
    statLabel: { fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
    statDivider: { width: '1px', height: '40px', backgroundColor: 'var(--color-border-subtle)' },
    timelineContainer: { marginTop: 'var(--spacing-xl)' },
    loadingContainer: { padding: 'var(--spacing-xl)' },
    loadingText: { textAlign: 'center', fontSize: '18px', color: 'var(--color-accent-cyan)', marginTop: 'var(--spacing-lg)' }
};

export default PartDetails;
