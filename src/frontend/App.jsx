import React, { useState, useEffect } from 'react';
import { view, requestJira } from '@forge/bridge';
import IssuePanel from './components/IssuePanel';
import Dashboard from './components/Dashboard';
import MobileControls from './components/MobileControls';
import './index.css';

const App = () => {
    const [context, setContext] = useState(null);
    const [isMobileMode, setIsMobileMode] = useState(false);

    useEffect(() => {
        const init = async () => {
            const ctx = await view.getContext();
            setContext(ctx);

            // Role-Based Routing: Check if user is in 'pit-crew'
            try {
                const response = await requestJira('/rest/api/3/myself?expand=groups');
                if (response.ok) {
                    const userData = await response.json();
                    const groups = userData.groups?.items?.map(g => g.name) || [];

                    if (groups.includes('pit-crew')) {
                        console.log('User is in pit-crew, enabling Mobile Mode');
                        setIsMobileMode(true);
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch user groups, defaulting to standard view:', error);
                // Fail safe: Do nothing, stay in standard view
            }
        };
        init();
    }, []);

    if (!context) {
        return <div style={{ padding: 20, color: '#00B8D9' }}>Initializing PitLane...</div>;
    }

    // 1. Priority: Mobile Mode (Role-Based)
    if (isMobileMode) {
        return <MobileControls />;
    }

    // 2. Check module key
    const moduleKey = context.moduleKey;

    if (moduleKey === 'pitlane-dashboard') {
        return <Dashboard />;
    }

    // 3. Default to Issue Panel
    return <IssuePanel />;
};

export default App;
