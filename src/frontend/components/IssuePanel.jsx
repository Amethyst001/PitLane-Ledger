import React, { useState, useEffect } from 'react';
import { view } from '@forge/bridge';
import PartDetails from './PartDetails';

const IssuePanel = () => {
    const [context, setContext] = useState(null);

    useEffect(() => {
        view.getContext().then(setContext);
    }, []);

    if (!context) return null;

    return (
        <PartDetails
            issueId={context.extension.issue.id}
            issueKey={context.extension.issue.key}
        />
    );
};

export default IssuePanel;
