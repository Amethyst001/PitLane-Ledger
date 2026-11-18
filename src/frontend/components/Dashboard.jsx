import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import { Search, Activity, AlertTriangle, CheckCircle, Package, Truck, RefreshCw, X, Clock, ArrowRight, Settings, RotateCcw, Flag, Factory, Plane, Car, Users, Layers, TrendingUp, Wrench, Calculator } from 'lucide-react';
import PartDetails from './PartDetails';
import SettingsPanel from './SettingsPanel';
import CarConfigurator from './CarConfigurator';
import PredictiveTimeline from './PredictiveTimeline';
import RaceCalendarSettings from './RaceCalendarSettings';
import FleetReadinessModal from './FleetReadinessModal';
import CostDashboard from './CostDashboard';
import PitCrewTasks from './PitCrewTasks';
import logo from '../pitlane.png';
import OnboardingGuide from './OnboardingGuide';

const Dashboard = ({ appMode, refreshTrigger, onEventLogged }) => {
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
    const [showActivityShowMore, setShowActivityShowMore] = useState(false);
    const [showFleetReadiness, setShowFleetReadiness] = useState(false);
    const [showPitCrewTasks, setShowPitCrewTasks] = useState(false);
    const [showCostDashboard, setShowCostDashboard] = useState(false);

    // Initial Load
    useEffect(() => {
        fetchData();
    }, []);

    // Polling for "Live" updates (every 5 seconds) - ONLY IN PROD MODE
    // In DEMO mode, data is session-local and doesn't need external refresh
    useEffect(() => {
        if (appMode === 'DEMO') return; // Skip polling in DEMO mode

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchData(true); // Silent update only if tab is visible
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [appMode]);

    // Refresh when parent triggers (after event logging) - ONLY IN PROD MODE
    // In DEMO mode, PartDetails already updates sessionStorage directly
    useEffect(() => {
        if (refreshTrigger > 0 && appMode !== 'DEMO') {
            fetchData(true); // Silent refresh
        }
    }, [refreshTrigger, appMode]);

    // Sync DEMO mode parts to sessionStorage for session persistence
    useEffect(() => {
        if (appMode === 'DEMO' && parts.length > 0) {
            sessionStorage.setItem('pitlane_demo_parts', JSON.stringify(parts));
            console.log('[Dashboard] DEMO mode: Synced', parts.length, 'parts to session');
        }
    }, [parts, appMode]);

    // Listen for keyboard shortcuts from App.jsx
    useEffect(() => {
        const handleFocusSearch = () => {
            const searchInput = document.querySelector('input[placeholder*="Search"]');
            if (searchInput) searchInput.focus();
        };
        const handleFilter = (e) => {
            if (e.detail) setStatusFilter(e.detail);
        };
        window.addEventListener('pitlane:focus-search', handleFocusSearch);
        window.addEventListener('pitlane:filter', handleFilter);
        return () => {
            window.removeEventListener('pitlane:focus-search', handleFocusSearch);
            window.removeEventListener('pitlane:filter', handleFilter);
        };
    }, []);

    // Listen for DEMO mode parts updates (from PartDetails/MobileControls)
    // This updates Dashboard state directly without calling backend
    useEffect(() => {
        if (appMode !== 'DEMO') return;

        const handleDemoPartsUpdated = (e) => {
            if (e.detail?.parts) {
                console.log('[Dashboard] DEMO: Received parts update event');
                setParts(e.detail.parts);
            }
        };
        window.addEventListener('pitlane:demo-parts-updated', handleDemoPartsUpdated);
        return () => window.removeEventListener('pitlane:demo-parts-updated', handleDemoPartsUpdated);
    }, [appMode]);

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

            let allParts;

            // DEMO MODE: Use sessionStorage for persistence within browser session
            if (appMode === 'DEMO') {
                const cachedDemo = sessionStorage.getItem('pitlane_demo_parts');
                if (cachedDemo) {
                    console.log('[Dashboard] DEMO mode: Using cached session data');
                    allParts = JSON.parse(cachedDemo);
                } else {
                    console.log('[Dashboard] DEMO mode: Fetching fresh mock data');
                    allParts = await invoke('getDemoParts');
                    // Cache it for the session
                    sessionStorage.setItem('pitlane_demo_parts', JSON.stringify(allParts));
                }
            } else {
                // PROD MODE: Always fetch from storage
                allParts = await invoke('getProductionParts');
            }

            const [calendar, fleetConfig] = await Promise.all([
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
                } else if (fleetConfig && fleetConfig.car1 !== 'Car 1') {
                    // Use saved config if it's not the default placeholder
                    setDriverNames({ car1: fleetConfig.car1, car2: fleetConfig.car2 });
                } else {
                    // Fall back to default driver names for PROD if not configured
                    setDriverNames({ car1: 'Alex Albon', car2: 'Carlos Sainz' });
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
            // Clear session storage (DEMO mode cache)
            sessionStorage.removeItem('pitlane_demo_parts');
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

    // Fleet Readiness Calculation - SMART scoring with spare coverage:
    // Core logic: Trackside=100%, Transit=50%, Manufactured=25%, Damaged=0%
    // Critical penalty REDUCED if a healthy spare exists for that part type
    // Spares contribute to overall readiness as backup buffer
    const calculateFleetReadiness = () => {
        const activeParts = (Array.isArray(parts) ? parts : []).filter(p => !['RETIRED', 'SCRAPPED'].includes(p.pitlaneStatus));
        if (activeParts.length === 0) return 0;

        // Weight by importance (Power Unit most critical)
        const getWeight = (name) => {
            if (name.includes('Power Unit') || name.includes('Engine') || name.includes('Gearbox')) return 5;
            if (name.includes('Wing') || name.includes('Floor') || name.includes('Chassis')) return 3;
            if (name.includes('Brake') || name.includes('Suspension') || name.includes('Wheel')) return 2;
            return 1;
        };

        // Get part category for spare matching
        const getCategory = (name) => {
            if (name.includes('Power Unit') || name.includes('ICE') || name.includes('MGU')) return 'power_unit';
            if (name.includes('Gearbox')) return 'gearbox';
            if (name.includes('Front Wing')) return 'front_wing';
            if (name.includes('Rear Wing')) return 'rear_wing';
            if (name.includes('Floor')) return 'floor';
            return name.split(' ')[0].toLowerCase(); // First word as fallback
        };

        // Build spare coverage map: { category: [healthy spares count] }
        const spareCoverage = {};
        activeParts.forEach(p => {
            const isSpare = p.assignment?.includes('Spare') || !p.assignment?.includes('Car');
            const isHealthy = !p.pitlaneStatus.includes('DAMAGED') && p.predictiveStatus !== 'CRITICAL';
            const isReady = p.pitlaneStatus.includes('Trackside') || p.pitlaneStatus.includes('Manufactured');

            if (isSpare && isHealthy && isReady) {
                const cat = getCategory(p.name);
                spareCoverage[cat] = (spareCoverage[cat] || 0) + 1;
            }
        });

        let readyScore = 0;
        let totalWeight = 0;

        activeParts.forEach(p => {
            const weight = getWeight(p.name);
            const category = getCategory(p.name);
            const hasHealthySpare = (spareCoverage[category] || 0) > 0;
            const statusLower = (p.pitlaneStatus || '').toLowerCase();

            totalWeight += weight;

            // Status-based scoring (case-insensitive)
            if (statusLower.includes('cleared') && statusLower.includes('race')) {
                readyScore += weight * 1.0; // 100% - Race ready!
            } else if (statusLower.includes('trackside')) {
                readyScore += weight * 1.0; // 100%
            } else if (statusLower.includes('transit')) {
                readyScore += weight * 0.5; // 50%
            } else if (statusLower.includes('manufactured') || statusLower.includes('quality')) {
                readyScore += weight * 0.25; // 25%
            } else if (statusLower.includes('scrap') || statusLower.includes('bin') || statusLower.includes('retired')) {
                readyScore += 0; // 0% - Should not count
                totalWeight -= weight; // Remove from total (don't penalize for scrapped parts)
            }
            // DAMAGED = 0%

            // Penalty for CRITICAL/DAMAGED - BUT reduced if spare available
            if (p.predictiveStatus === 'CRITICAL' || statusLower.includes('damage')) {
                const basePenalty = weight * 0.4; // 40% base penalty
                const actualPenalty = hasHealthySpare ? basePenalty * 0.5 : basePenalty; // 50% reduction if covered
                readyScore -= actualPenalty;
            }

            // Age factor: Parts with lower life remaining should reduce score
            if (p.lifeRemaining <= 1) {
                readyScore -= weight * 0.2; // Extra penalty for very low life
            }
        });

        // Bonus: Extra confidence if critical categories have spare coverage
        const criticalCategories = ['power_unit', 'gearbox', 'front_wing', 'rear_wing'];
        const coverageBonus = criticalCategories.filter(cat => spareCoverage[cat] > 0).length * 2;
        readyScore += coverageBonus;

        // PENALTY: Proportional deduction for MISSING critical parts
        // Only applies penalty proportional to what's missing, not absolute
        const requiredCategories = {
            power_unit: 2, turbo: 2, mgu_k: 2, mgu_h: 2,
            gearbox: 2, front_wing: 2, rear_wing: 2, floor: 2,
            brakes: 2, chassis: 2, energy_store: 2, control_electronics: 2
        };

        // Count trackside parts per category
        const tracksideByCategory = {};
        activeParts.forEach(p => {
            const cat = getCategory(p.name);
            const isTrackside = p.pitlaneStatus.includes('Trackside') ||
                (p.pitlaneStatus.includes('Cleared') && p.pitlaneStatus.includes('Race'));
            if (isTrackside) {
                tracksideByCategory[cat] = (tracksideByCategory[cat] || 0) + 1;
            }
        });

        // Calculate coverage ratio and apply proportional penalty
        let coverageScore = 0;
        let totalRequired = 0;
        Object.entries(requiredCategories).forEach(([cat, required]) => {
            const have = Math.min(tracksideByCategory[cat] || 0, required); // Cap at required
            const catWeight = cat.includes('power') || cat.includes('gearbox') ? 2 : 1;
            coverageScore += (have / required) * catWeight;
            totalRequired += catWeight;
        });

        // Coverage ratio (0-1) multiplied by weight factor
        const coverageRatio = totalRequired > 0 ? coverageScore / totalRequired : 1;

        // Blend the base score with coverage: 60% parts status, 40% coverage
        const blendedScore = (readyScore / totalWeight) * 0.6 + coverageRatio * 0.4;

        // Future enhancements (IDEAS - not implemented yet):
        // - Race proximity factor: penalize transit/factory parts when race is near
        // - Location-based readiness: Garage parts are immediately available
        // - Part age/usage history weighting
        // - Historical failure rate consideration

        return Math.max(0, Math.min(100, Math.round(blendedScore * 100)));
    };
    const weightedReadiness = calculateFleetReadiness();

    // === INTELLIGENT RECOMMENDATIONS ===
    const generateRecommendations = () => {
        const recommendations = [];
        const activeParts = parts.filter(p => !['RETIRED', 'SCRAPPED'].includes(p.pitlaneStatus));

        // Get part category for matching
        const getCategory = (name) => {
            if (name.includes('Power Unit') || name.includes('ICE') || name.includes('MGU')) return 'power_unit';
            if (name.includes('Gearbox')) return 'gearbox';
            if (name.includes('Front Wing')) return 'front_wing';
            if (name.includes('Rear Wing')) return 'rear_wing';
            if (name.includes('Floor')) return 'floor';
            return name.split(' ')[0].toLowerCase();
        };

        // Find critical car parts that have healthy spares
        const carParts = activeParts.filter(p => p.assignment?.includes('Car'));
        const spares = activeParts.filter(p => p.assignment?.includes('Spare') || !p.assignment?.includes('Car'));

        carParts.forEach(carPart => {
            const isCritical = carPart.predictiveStatus === 'CRITICAL' ||
                carPart.lifeRemaining <= 1 ||
                carPart.pitlaneStatus.includes('DAMAGED');

            if (isCritical) {
                const category = getCategory(carPart.name);
                const healthySpare = spares.find(s =>
                    getCategory(s.name) === category &&
                    !s.pitlaneStatus.includes('DAMAGED') &&
                    s.predictiveStatus !== 'CRITICAL' &&
                    s.lifeRemaining > 2 &&
                    (s.location?.includes('Garage') || s.pitlaneStatus.includes('Trackside'))
                );

                if (healthySpare) {
                    recommendations.push({
                        type: 'SWAP',
                        priority: carPart.pitlaneStatus.includes('DAMAGED') ? 'CRITICAL' : 'WARNING',
                        message: `Swap ${carPart.name} with ${healthySpare.name}`,
                        fromPart: carPart,
                        toPart: healthySpare,
                        reason: carPart.pitlaneStatus.includes('DAMAGED')
                            ? 'Damaged part has healthy spare available'
                            : `Only ${carPart.lifeRemaining} race${carPart.lifeRemaining === 1 ? '' : 's'} remaining`
                    });
                }
            }
        });

        // Check for parts still at factory when race is near
        const nextRace = raceCalendar?.[0];
        if (nextRace) {
            const daysToRace = nextRace.daysAway ?? Math.ceil((new Date(nextRace.date) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysToRace <= 2) {
                activeParts.filter(p => p.location?.includes('Factory')).forEach(p => {
                    recommendations.push({
                        type: 'LOGISTICS',
                        priority: 'WARNING',
                        message: `${p.name} is at Factory - may not arrive before race`,
                        part: p,
                        reason: `Race in ${daysToRace} day${daysToRace === 1 ? '' : 's'}, part at ${p.location}`
                    });
                });
            }
        }

        return recommendations;
    };
    const recommendations = generateRecommendations();

    // === FLEET ACTION HANDLER (Assign to Pit Crew) ===
    const handleFleetAction = (insight) => {
        if (!insight || !insight.actionData) return;

        console.log('[Dashboard] Assigning to Pit Crew:', insight);

        const actionData = insight.actionData;

        if (actionData.type === 'swap') {
            // Create a pit crew task with checklist
            const task = {
                id: `task-${Date.now()}`,
                type: 'swap',
                title: `Swap ${actionData.damagedPartKey} → ${actionData.sparePartKey}`,
                description: `Replace damaged ${actionData.damagedPartName} with spare ${actionData.sparePartName}. Assign to ${actionData.spareAssignment}.`,
                createdAt: new Date().toISOString(),
                actionData: actionData,
                checklist: [
                    { label: `Remove ${actionData.damagedPartKey} from ${actionData.spareAssignment}`, checked: false },
                    { label: `Move ${actionData.damagedPartKey} to Quarantine`, checked: false },
                    { label: `Install ${actionData.sparePartKey} to ${actionData.spareAssignment}`, checked: false },
                    { label: 'Verify installation and connections', checked: false }
                ]
            };

            // Store in sessionStorage
            const existingTasks = JSON.parse(sessionStorage.getItem('pitlane_pit_crew_tasks') || '[]');
            existingTasks.push(task);
            sessionStorage.setItem('pitlane_pit_crew_tasks', JSON.stringify(existingTasks));

            // Dispatch event for PitCrewTasks component
            window.dispatchEvent(new CustomEvent('pitlane:pit-crew-task-added', { detail: { task } }));

            // Close fleet readiness modal
            setShowFleetReadiness(false);

            // Open pit crew tasks panel
            setShowPitCrewTasks(true);

            console.log('[Dashboard] Task assigned to Pit Crew:', task.id);
        }
    };

    // === EXECUTE PIT CREW TASK (called when crew completes checklist) ===
    const executePitCrewTask = async (actionData) => {
        if (!actionData) return;

        console.log('[Dashboard] Executing pit crew task:', actionData);

        if (actionData.type === 'swap') {
            try {
                // 1. Retire the damaged part
                await invoke('logEvent', {
                    issueId: actionData.damagedPartKey,
                    status: 'RETIRED',
                    notes: `Retired by Pit Crew: Swapped with ${actionData.sparePartKey}`,
                    location: 'Quarantine'
                });

                // 2. Assign spare to the car
                await invoke('logEvent', {
                    issueId: actionData.sparePartKey,
                    status: '🏁 Trackside',
                    notes: `Installed by Pit Crew: Replaced ${actionData.damagedPartKey}`,
                    assignment: actionData.spareAssignment
                });

                // 3. Update local state for DEMO mode
                if (appMode === 'DEMO') {
                    const updatedParts = parts.map(p => {
                        if (p.key === actionData.damagedPartKey) {
                            return { ...p, pitlaneStatus: 'RETIRED', location: 'Quarantine', assignment: 'None' };
                        }
                        if (p.key === actionData.sparePartKey) {
                            return { ...p, pitlaneStatus: '🏁 Trackside', assignment: actionData.spareAssignment };
                        }
                        return p;
                    });
                    setParts(updatedParts);
                    sessionStorage.setItem('pitlane_demo_parts', JSON.stringify(updatedParts));
                    window.dispatchEvent(new CustomEvent('pitlane:demo-parts-updated', { detail: { parts: updatedParts } }));
                }

                // 4. Refresh data
                await fetchData(true);

                console.log('[Dashboard] Pit crew task completed:', actionData.damagedPartKey, '→', actionData.sparePartKey);
            } catch (error) {
                console.error('[Dashboard] Pit crew task failed:', error);
            }
        }
    };

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
                                        <span style={{ color: activeFilterChassis === 'CAR1' ? 'inherit' : '#00A0E3' }}>{driverNames.car1 || 'Car 1'}</span>
                                    </button>
                                    <div style={styles.segmentDivider} />
                                    <button
                                        onClick={() => setActiveFilterChassis('CAR2')}
                                        style={activeFilterChassis === 'CAR2' ? styles.segmentBtnActive : styles.segmentBtn}
                                    >
                                        <span style={{ color: activeFilterChassis === 'CAR2' ? 'inherit' : '#22D3EE' }}>{driverNames.car2 || 'Car 2'}</span>
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

                        <div
                            style={{ ...styles.statGroup, cursor: 'pointer', transition: 'all 0.2s ease' }}
                            onClick={() => setShowFleetReadiness(true)}
                            title="Click for detailed breakdown"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.opacity = '0.9';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.opacity = '1';
                            }}
                        >
                            <span style={styles.statLabel}>FLEET READINESS</span>
                            <div style={styles.statValue}>{weightedReadiness}%</div>
                        </div>
                        <div style={styles.divider} />
                        <button onClick={() => setShowCostDashboard(true)} style={styles.iconBtn} aria-label="Cost Calculator" title="Cost Cap Calculator">
                            <Calculator size={20} strokeWidth={1.5} />
                        </button>
                        <button onClick={() => setShowSettings(true)} style={styles.iconBtn} aria-label="Settings">
                            <Settings size={20} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            </header>

            <div style={styles.grid}>
                <StatCard title="Total Inventory" value={stats.total} icon={<Package size={20} />} color="#00A0E3" sub={`Synced: ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} onClick={() => setStatusFilter('ALL')} isActive={statusFilter === 'ALL'} />
                <StatCard title="Trackside Ready" value={stats.trackside} icon={<CheckCircle size={20} />} color="#00D084" sub="Race Available" onClick={() => setStatusFilter('TRACKSIDE')} isActive={statusFilter === 'TRACKSIDE'} />
                <StatCard title="In Transit" value={stats.inTransit} icon={<Activity size={20} />} color="#F59E0B" sub="En Route" onClick={() => setStatusFilter('TRANSIT')} isActive={statusFilter === 'TRANSIT'} />
                <StatCard title="Critical Issues" value={stats.critical} icon={<AlertTriangle size={20} />} color="#F04438" sub="Requires Attention" isCritical onClick={() => setStatusFilter('CRITICAL')} isActive={statusFilter === 'CRITICAL'} />
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
                                {(searchQuery || statusFilter !== 'ALL') && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                                        style={{
                                            background: 'rgba(0, 184, 217, 0.15)',
                                            border: '1px solid rgba(0, 184, 217, 0.3)',
                                            borderRadius: '6px',
                                            padding: '6px 12px',
                                            color: '#00D9FF',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            marginLeft: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s ease'
                                        }}
                                        title="Clear search and filters"
                                    >
                                        <X size={14} /> Clear Filter
                                    </button>
                                )}
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
                                                                {part.assignment.includes('Car 1') ? <><span style={{ color: '#3B82F6' }}>●</span> {driverNames?.car1?.split(' ').pop() || 'Albon'}</> :
                                                                    part.assignment.includes('Car 2') ? <><span style={{ color: '#22D3EE' }}>●</span> {driverNames?.car2?.split(' ').pop() || 'Sainz'}</> :
                                                                        <><span style={{ color: '#94A3B8' }}>●</span> Spares</>}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td style={styles.td}>{part.key}</td>
                                                    <td style={styles.td}>
                                                        <span style={getStatusStyle(part.pitlaneStatus)}>
                                                            {(() => {
                                                                const cleaned = (part.pitlaneStatus || '').replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2B50}]|[\u{2705}]|[\u{26A0}]|[\u{2708}]|[\u{1F3C1}]|[\u{1F3ED}]|[\u{1F4E6}]|[\u{1F6A8}]|[\u{1F527}]|[\uFE00-\uFE0F]|\u200B/gu, '').trim();
                                                                // Shorten common statuses for cleaner display
                                                                const lower = cleaned.toLowerCase();
                                                                if (lower.includes('cleared') && lower.includes('race')) return 'Cleared';
                                                                if (lower.includes('scrapped')) return 'Retired';
                                                                if (lower.includes('retired')) return 'Retired';
                                                                if (lower.includes('refurbish')) return 'Refurbished';
                                                                // Normalize to title case for consistent badge sizing
                                                                return cleaned.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
                                                            })()}
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
                    <PredictiveTimeline
                        parts={chassisFilteredParts}
                        calendar={raceCalendar}
                        onOpenSettings={() => setShowCalendarSettings(true)}
                        onPartClick={(partKey) => setSearchQuery(partKey)}
                    />
                    <div style={{ ...styles.panel, height: '450px', display: 'flex', flexDirection: 'column' }}>
                        <div style={styles.panelHeader}>
                            <h3 style={styles.panelTitle}>Recent Activity</h3>
                        </div>
                        <div
                            style={{ ...styles.feed, flex: 1, overflowY: 'auto' }}
                            onScroll={(e) => {
                                const el = e.target;
                                const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
                                if (nearBottom && visibleActivityCount === 10 && chassisFilteredParts.length > 10) {
                                    setShowActivityShowMore(true);
                                }
                            }}
                        >
                            {[...chassisFilteredParts]
                                .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
                                .slice(0, visibleActivityCount)
                                .map((part) => (
                                    <div key={part.id} style={styles.feedItem}>
                                        <div style={styles.feedIcon}>
                                            <Clock size={14} color="var(--color-text-secondary)" />
                                        </div>
                                        <div style={styles.feedContent}>
                                            <div style={styles.feedTitle}>{part.name}</div>
                                            <div style={styles.feedStatus}>
                                                Updated to <span style={{ color: 'var(--color-accent-cyan)' }}>{part.pitlaneStatus?.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2B50}]|[\u{2705}]|[\u{26A0}]|[\u{2708}]|[\u{1F3C1}]|[\u{1F3ED}]|[\u{1F4E6}]|[\u{1F6A8}]|[\u{1F527}]|[\uFE00-\uFE0F]|\u200B/gu, '').trim() || part.pitlaneStatus}</span>
                                            </div>
                                            <div style={styles.feedTime}>{new Date(part.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>
                                ))}
                            {/* Show More button - appears when user scrolls to end of first 10 */}
                            {showActivityShowMore && visibleActivityCount === 10 && chassisFilteredParts.length > 10 && (
                                <div style={{ padding: '12px', textAlign: 'center' }}>
                                    <button
                                        onClick={() => { setVisibleActivityCount(chassisFilteredParts.length); setShowActivityShowMore(false); }}
                                        style={styles.loadMoreBtn}
                                    >
                                        Show More ({chassisFilteredParts.length - 10} more)
                                    </button>
                                </div>
                            )}
                            {/* Show Less button - appears when viewing all items */}
                            {visibleActivityCount > 10 && (
                                <div style={{ padding: '12px', textAlign: 'center' }}>
                                    <button
                                        onClick={() => { setVisibleActivityCount(10); setShowActivityShowMore(false); }}
                                        style={styles.loadMoreBtn}
                                    >
                                        Show Less
                                    </button>
                                </div>
                            )}
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
                                onEventLogged={onEventLogged}
                                driverNames={driverNames}
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
                showFleetReadiness && (
                    <FleetReadinessModal
                        isOpen={showFleetReadiness}
                        onClose={() => setShowFleetReadiness(false)}
                        parts={parts}
                        readinessScore={weightedReadiness}
                        onExecuteAction={handleFleetAction}
                    />
                )
            }

            {
                showPitCrewTasks && (
                    <PitCrewTasks
                        isOpen={showPitCrewTasks}
                        onClose={() => setShowPitCrewTasks(false)}
                        onExecuteTask={executePitCrewTask}
                        appMode={appMode}
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

            {
                showCostDashboard && (
                    <CostDashboard
                        isOpen={showCostDashboard}
                        onClose={() => setShowCostDashboard(false)}
                        parts={parts}
                        appMode={appMode}
                        raceCount={24}  // 2025 F1 season has 24 races
                        sprintCount={6} // 2025 has 6 sprint weekends
                        partsBudgetConfig={appMode === 'PROD' ? JSON.parse(sessionStorage.getItem('pitlane_parts_budget') || '{}') : null}
                    />
                )
            }
        </div >
    );
};

const StatCard = ({ title, value, icon, color, sub, isCritical, onClick, isActive }) => (
    <div
        style={{
            ...styles.card,
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            transform: isActive ? 'scale(1.02)' : 'scale(1)',
            ...(isActive ? {
                border: `2px solid ${color}`,
                boxShadow: `0 0 20px ${color}40`
            } : {}),
            ...(isCritical && !isActive ? {
                border: '1px solid rgba(239, 68, 68, 0.4)',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.3), inset 0 0 10px rgba(239, 68, 68, 0.1)'
            } : {})
        }}
        onClick={onClick}
        onMouseEnter={(e) => { if (onClick && !isActive) e.currentTarget.style.transform = 'scale(1.02)'; }}
        onMouseLeave={(e) => { if (onClick && !isActive) e.currentTarget.style.transform = 'scale(1)'; }}
    >
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
    const base = { padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, display: 'inline-block' };
    // Aggressive cleaning for logic match
    const statusLower = (status || '').replace(/[\uFE00-\uFE0F]|\u200B/g, '').trim().toLowerCase();
    if (statusLower.includes('cleared') && statusLower.includes('race')) return { ...base, background: 'rgba(0, 208, 132, 0.15)', color: '#00D084' };
    if (statusLower.includes('trackside')) return { ...base, background: 'rgba(0, 208, 132, 0.15)', color: '#00D084' };
    if (statusLower.includes('transit')) return { ...base, background: 'rgba(139, 92, 246, 0.15)', color: 'var(--color-accent-purple)' };
    if (statusLower.includes('manufactured')) return { ...base, background: 'rgba(0, 184, 217, 0.15)', color: '#00B8D9' };
    if (statusLower.includes('damage')) return { ...base, background: 'rgba(100, 116, 139, 0.2)', color: '#94A3B8' };
    if (statusLower.includes('scrap') || statusLower.includes('bin') || statusLower.includes('retired')) return { ...base, background: 'rgba(100, 116, 139, 0.15)', color: '#64748B' };
    if (statusLower.includes('refurbish')) return { ...base, background: 'rgba(0, 184, 217, 0.15)', color: '#00B8D9' };
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
