import React, { useState, useEffect } from 'react';
import { view, requestJira, invoke } from '@forge/bridge';
import IssuePanel from './components/IssuePanel';
import Dashboard from './components/Dashboard';
import MobileControls from './components/MobileControls';
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

    useEffect(() => {
        const init = async () => {
            const ctx = await view.getContext();
            setContext(ctx);

            // 1. Role-Based Routing (Pit Crew -> Mobile)
            try {
                const response = await requestJira('/rest/api/3/myself?expand=groups');
                if (response.ok) {
                    const userData = await response.json();
                    const groups = userData.groups?.items?.map(g => g.name) || [];
                    if (groups.includes('pit-crew')) {
                        setIsMobileMode(true);
                        setLoading(false);
                        return; // Exit early for mobile users
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch user groups:', error);
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

    // 1. Mobile Mode (Priority)
    if (isMobileMode) {
        return <MobileControls />;
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
        return <Dashboard appMode={appMode} />;
    }

    // Default to Issue Panel
    return <IssuePanel />;
};

export default App;
