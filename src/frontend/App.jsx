import React, { useState, useEffect } from 'react';
import { view, requestJira, invoke } from '@forge/bridge';
import IssuePanel from './components/IssuePanel';
import Dashboard from './components/Dashboard';
import MobileControls from './components/MobileControls';
import PartDetails from './components/PartDetails';
import WelcomeGate from './components/WelcomeGate';
import ModeSelection from './components/ModeSelection';
import OnboardingGuide from './components/OnboardingGuide';
import './index.css';

const App = () => {
    const [context, setContext] = useState(null);
    const [isMobileMode, setIsMobileMode] = useState(false);
    const [showWelcomeGate, setShowWelcomeGate] = useState(true);
    const [showModeSelection, setShowModeSelection] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [appMode, setAppMode] = useState(null); // 'DEMO' or 'PROD' - purely in React state
    const [mobilePartKey, setMobilePartKey] = useState(null); // Part key selected in mobile scanner
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Increment to trigger system-wide refresh

    // Dynamic Scaling: Calculate ideal zoom based on viewport
    useEffect(() => {
        const calculateScale = () => {
            // WelcomeGate natural content height (logo -> footer)
            const WELCOME_GATE_HEIGHT = 800; // Approximate total height in px
            const viewportHeight = window.innerHeight;

            // Calculate scale to fit perfectly (min 0.5 to avoid too small, max 1.0 for native size)
            const calculatedScale = Math.min(1.0, Math.max(0.5, viewportHeight / WELCOME_GATE_HEIGHT));

            // Apply to root for global effect
            document.documentElement.style.setProperty('--dynamic-scale', calculatedScale);
            console.log(`[App] Dynamic scale applied: ${(calculatedScale * 100).toFixed(0)}% (viewport: ${viewportHeight}px)`);
        };

        calculateScale();
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, []);

    // Global Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Escape - Close modal / Go back
            if (e.key === 'Escape') {
                // Dispatch custom event that modals can listen to
                window.dispatchEvent(new CustomEvent('pitlane:escape'));
                // If in mobile part view, go back
                if (mobilePartKey) {
                    setMobilePartKey(null);
                }
            }

            // Ctrl+F or Cmd+F - Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('pitlane:focus-search'));
            }

            // Ctrl+N or Cmd+N - Add new part
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('pitlane:add-part'));
            }

            // Ctrl+L or Cmd+L - Log event
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('pitlane:log-event'));
            }

            // Ctrl+1,2,3,4 - Stat filters
            if ((e.ctrlKey || e.metaKey) && ['1', '2', '3', '4'].includes(e.key)) {
                e.preventDefault();
                const filterMap = { '1': 'ALL', '2': 'TRACKSIDE', '3': 'TRANSIT', '4': 'CRITICAL' };
                window.dispatchEvent(new CustomEvent('pitlane:filter', { detail: filterMap[e.key] }));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mobilePartKey]);

    // Auto View Switching: Smart toggle between mobile/desktop based on viewport
    useEffect(() => {
        let debounceTimer = null;
        const MIN_STABLE_TIME = 500; // 500ms to prevent accidental toggles

        const checkMobileSignals = () => {
            const signals = {
                // Lower breakpoint to standard tablet width (768px)
                // This prevents "Desktop with Rovo sidebar" from triggering mobile view
                narrowWidth: window.innerWidth < 768,
                touchDevice: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
                mobileUA: /Android|iPhone|iPad|iPod|webOS|BlackBerry/i.test(navigator.userAgent),
                portraitMode: window.innerHeight > window.innerWidth
            };
            // More conservative logic:
            // 1. If it has a Mobile User Agent (Real phone/tablet) -> Mobile Mode
            // 2. If NO Mobile UA (Desktop browser) -> Only trigger if EXTREMELY narrow (< 600px)
            //    This effectively treats 600px-768px on Desktop as "Small Desktop Window" instead of "Mobile App"
            const isTrueMobile = signals.mobileUA;
            const isVeryNarrowDesktop = !signals.mobileUA && window.innerWidth < 600;

            return {
                shouldBeMobile: isTrueMobile || isVeryNarrowDesktop,
                signals
            };
        };

        const handleResize = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const { shouldBeMobile, signals } = checkMobileSignals();

                if (shouldBeMobile && !isMobileMode) {
                    console.log('[App] Switching to Mobile View. Signals:', signals);
                    setIsMobileMode(true);
                } else if (!shouldBeMobile && isMobileMode) {
                    console.log('[App] Switching to Dashboard View. Signals:', signals);
                    setIsMobileMode(false);
                    setMobilePartKey(null);
                }
            }, MIN_STABLE_TIME);
        };

        // Also listen to orientation changes for mobile devices
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            clearTimeout(debounceTimer);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, [isMobileMode]);

    useEffect(() => {
        const init = async () => {
            const ctx = await view.getContext();
            setContext(ctx);

            // 1. Role-Based Routing (Pit Crew -> Mobile)
            let isMobile = false;
            try {
                const response = await requestJira('/rest/api/3/myself?expand=groups');
                if (response.ok) {
                    const userData = await response.json();
                    const groups = userData.groups?.items?.map(g => g.name) || [];
                    if (groups.includes('pit-crew')) {
                        console.log('[App] User is in pit-crew group -> Mobile Mode');
                        isMobile = true;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch user groups:', error);
            }

            // 2. Device Detection (fallback if not pit-crew)
            if (!isMobile) {
                // Allow ?mobile=1 URL param for testing
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('mobile') === '1') {
                    console.log('[App] Mobile mode forced via URL param');
                    isMobile = true;
                } else {
                    const signals = {
                        // Match dynamic logic: Only strictly narrow (< 600) counts as mobile on Desktop
                        narrowScreen: window.innerWidth < 600,
                        mobileUA: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                    };
                    // More conservative: ONLY narrowScreen (< 600) OR mobileUA
                    if (signals.narrowScreen || signals.mobileUA) {
                        console.log('[App] Mobile device detected via signals:', signals);
                        isMobile = true;
                    }
                }
            }

            if (isMobile) {
                // Fetch saved appMode for mobile users (they skip mode selection)
                try {
                    const savedMode = await invoke('getAppMode');
                    if (savedMode) {
                        setAppMode(savedMode);
                        console.log('[App] Mobile user loaded appMode:', savedMode);
                    } else {
                        // Default to DEMO if no mode saved yet
                        setAppMode('DEMO');
                        console.log('[App] Mobile user defaulting to DEMO mode');
                    }
                } catch (err) {
                    console.warn('[App] Failed to fetch appMode for mobile:', err);
                    setAppMode('DEMO'); // Fallback
                }
                setIsMobileMode(true);
                setLoading(false);
                return; // Exit early for mobile users
            }

            // 2. Check Onboarding Status
            try {
                const isFirstLoad = await invoke('checkInitialLoad', { key: 'checkInitialLoad' });
                setShowWelcomeGate(isFirstLoad);
                if (!isFirstLoad) {
                    // If already onboarded, skip everything and go to Dashboard
                    setShowModeSelection(false);
                    setShowOnboarding(false);
                }
            } catch (error) {
                console.error('Failed to check initial load:', error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleEnterPitLane = () => {
        setShowWelcomeGate(false);
        setShowModeSelection(true);
    };

    const handleSelectMode = async (mode) => {
        setAppMode(mode); // Set mode in React state

        if (mode === 'DEMO') {
            // Demo Mode: NO STORAGE CALLS! Purely in-memory
            // Close mode selection and skip onboarding in one batch
            setShowModeSelection(false);
            setShowOnboarding(false);
        } else {
            // Production Mode: Persist to storage and go to onboarding
            // Set onboarding FIRST, then close mode selection to avoid Dashboard flash
            setShowOnboarding(true);
            setShowModeSelection(false);
            await invoke('setAppMode', { mode: 'PROD' });
        }
    };

    const handleFinishOnboarding = async () => {
        // Mark as complete when they finish the guide
        await invoke('enterPitLane', { key: 'enterPitLane' });
        setShowOnboarding(false);
    };

    if (loading) {
        return <div style={{ padding: 40, textAlign: 'center', color: '#00B8D9' }}>Initializing PitLane Ledger...</div>;
    }

    // 1. Mobile Mode (Priority) - Scanner-First Flow
    if (isMobileMode) {
        const handleSmartReturn = () => {
            if (window.innerWidth < 768) {
                alert('Your screen is still in mobile size. Widen your browser to access the full Dashboard.');
            } else {
                setIsMobileMode(false);
                setMobilePartKey(null);
            }
        };

        // If a part has been scanned, show PartDetails for that part
        if (mobilePartKey) {
            return (
                <PartDetails
                    issueKey={mobilePartKey}
                    appMode={appMode}
                    onReturn={() => setMobilePartKey(null)} // Back to scanner
                    onScanAnother={() => setMobilePartKey(null)} // Back to scanner
                    isMobileView={true}
                />
            );
        }

        // Default: Show MobileControls with scanner as initial view
        return (
            <MobileControls
                onReturn={handleSmartReturn}
                appMode={appMode}
                initialView="scan" // Open scanner by default
                onScanSwitch={(partKey) => setMobilePartKey(partKey)} // Navigate to PartDetails on scan
            />
        );
    }

    // 2. Welcome Gate (First Time)
    if (showWelcomeGate) {
        return <WelcomeGate onEnter={handleEnterPitLane} />;
    }

    // 3. Mode Selection (After Gate)
    if (showModeSelection) {
        return <ModeSelection onSelectMode={handleSelectMode} />;
    }

    // 4. Onboarding Guide (If selected PROD)
    if (showOnboarding) {
        return (
            <OnboardingGuide
                onBack={() => {
                    setShowOnboarding(false);
                    setShowModeSelection(true);
                }}
                onComplete={handleFinishOnboarding}
            />
        );
    }

    // 5. Standard Dashboard or Issue Panel
    const moduleKey = context?.moduleKey;

    if (moduleKey === 'pitlane-dashboard') {
        return (
            <Dashboard
                appMode={appMode}
                refreshTrigger={refreshTrigger}
                onEventLogged={() => setRefreshTrigger(prev => prev + 1)}
            />
        );
    }

    // Default to Issue Panel
    return <IssuePanel />;
};

export default App;
