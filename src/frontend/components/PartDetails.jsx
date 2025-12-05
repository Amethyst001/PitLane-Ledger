import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@forge/bridge';
import { Radio, Plus, QrCode, Smartphone } from 'lucide-react';
import logo from '../pitlane.png';
import TelemetryTimeline from './TelemetryTimeline';
import LogEventModal from './LogEventModal';
import QRCodePanel from './QRCodePanel';
import MobileControls from './MobileControls';

const PartDetails = ({ issueId, issueKey, onClose }) => {
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

                // Check if production data exists, otherwise use demo
                const prodStatus = await invoke('getProductionStatus');
                const useProduction = prodStatus?.hasData || false;

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
                const prodStatus = await invoke('getProductionStatus');
                const useProduction = prodStatus?.hasData || false;
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

    const handleLogEvent = async ({ status, note }) => {
        try {
            await invoke('logEvent', {
                key: 'logEvent',
                issueId,
                status,
                note
            });
            // Fix: Re-fetch history after logging with correct payload
            const updatedHistoryData = await invoke('getHistory', { key: 'getHistory', query: currentPartKey || currentPartId });
            const historyArray = updatedHistoryData.history || (Array.isArray(updatedHistoryData) ? updatedHistoryData : []);
            setHistory(historyArray);
        } catch (error) {
            console.error('Error logging event:', error);
            throw error;
        }
    };

    const handleMobileEventLogged = async () => {
        try {
            const updatedHistoryData = await invoke('getHistory', { key: 'getHistory', query: currentPartKey || currentPartId });
            const historyArray = updatedHistoryData.history || (Array.isArray(updatedHistoryData) ? updatedHistoryData : []);
            setHistory(historyArray);
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
                    <Radio size={14} className="pulse" style={{ color: 'var(--color-success)' }} />
                    <span style={styles.liveBadgeText}>Live</span>
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
                                        key={part.id}
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

                    <div style={styles.iconGroup}>
                        <button onClick={() => setShowQRPanel(true)} style={styles.actionButtonSecondary} title="QR Code">
                            <QrCode size={16} />
                        </button>

                        <button onClick={() => setIsMobileMode(true)} style={styles.actionButtonSecondary} title="Pit Crew">
                            <Smartphone size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isMobileMode) {
        return (
            <MobileControls
                issueId={issueKey || issueId}
                onReturn={() => setIsMobileMode(false)}
                onEventLogged={handleMobileEventLogged}
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
                                {history?.[0]?.status || '—'}
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
                issueId={issueKey || issueId}
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
        display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', padding: '8px 14px',
        backgroundColor: 'rgba(0, 208, 132, 0.15)', border: '2px solid rgba(0, 208, 132, 0.4)',
        borderRadius: '8px', fontSize: '13px', fontWeight: '600'
    },
    liveBadgeText: { color: 'var(--color-success)' },
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
