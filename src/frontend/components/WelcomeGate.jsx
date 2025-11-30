import React, { useState } from 'react';
import './WelcomeGate.css';

const WelcomeGate = ({ onStartDemo, onStartOnboarding }) => {
    const [isLoadingDemo, setIsLoadingDemo] = useState(false);

    const handleDemoClick = async () => {
        setIsLoadingDemo(true);
        await onStartDemo();
    };
    return (
        <div className="welcome-gate-container">
            <div className="welcome-gate-card">
                <div className="welcome-header">
                    <h1 className="welcome-title">Welcome to PitLane Ledger</h1>
                    <p className="welcome-subtitle">
                        Transform Jira into a secure, F1-grade Parts Passport.
                        Choose your path to begin managing your inventory with precision.
                    </p>
                </div>

                <div className="welcome-actions">
                    <button
                        className="btn-primary"
                        onClick={handleDemoClick}
                        disabled={isLoadingDemo}
                    >
                        {isLoadingDemo ? 'Loading Demo...' : 'EXPLORE LIVE DEMO'}
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={onStartOnboarding}
                    >
                        START ONBOARDING
                    </button>
                </div>

                <div className="welcome-footer">
                    <p className="footer-text">
                        Engineered for precision tracking • Real-time telemetry • Complete chain of custody
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WelcomeGate;
