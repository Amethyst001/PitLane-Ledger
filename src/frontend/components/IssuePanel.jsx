import React, { useState, useEffect } from 'react';
import { view, invoke } from '@forge/bridge';
import PartDetails from './PartDetails';

const IssuePanel = () => {
    const [context, setContext] = useState(null);
    const [appMode, setAppMode] = useState(null);

    useEffect(() => {
        const init = async () => {
            const ctx = await view.getContext();
            setContext(ctx);

            // Fetch the stored appMode
            try {
                const storedMode = await invoke('getAppMode', { key: 'getAppMode' });
                setAppMode(storedMode || 'DEMO');
                console.log('[IssuePanel] Loaded appMode:', storedMode || 'DEMO');
            } catch (error) {
                console.warn('[IssuePanel] Failed to fetch appMode, defaulting to DEMO:', error);
                setAppMode('DEMO');
            }
        };
        init();
    }, []);

    if (!context || !appMode) return null;

    return (
        <PartDetails
            issueId={context.extension.issue.id}
            issueKey={context.extension.issue.key}
            appMode={appMode}
        />
    );
};

export default IssuePanel;
