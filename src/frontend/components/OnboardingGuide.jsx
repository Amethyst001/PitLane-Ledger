import React, { useState, useRef } from 'react';
import { invoke } from '@forge/bridge';
import './OnboardingGuide.css';

const OnboardingGuide = ({ onBack }) => {
    const [copiedStep, setCopiedStep] = useState(null);
    const [driverNames, setDriverNames] = useState({ car1: 'Alex Albon', car2: 'Carlos Sainz' });
    const [savedDrivers, setSavedDrivers] = useState(false);
    const fileInputRef = useRef(null);

    const steps = [
        {
            title: "Migrate Inventory Data",
            description: "Upload your master parts list (CSV) directly using the Jira Import Wizard. Supports any inventory size - from hundreds to thousands of parts. You can either download our template or migrate your existing CSV.",
            action: "Download CSV Template",
            action2: "Upload Existing CSV",
            actionType: "download"
        },
        {
            title: "Set Roles & Access",
            description: "Send the self-service assignment link to all mechanics. They click it once to join the 'pit-crew' group and activate mobile mode. (Default role is Manager/Dashboard view).",
            action: "Copy Self-Service Link",
            actionType: "copy",
            linkText: "https://your-site.atlassian.net/plugins/servlet/ac/pitlane-ledger/join-pit-crew"
        },
        {
            title: "Print Physical Tags",
            description: "Use the Bulk Print Utility to generate a printable view of all necessary QR code labels for industrial printing and attachment.",
            action: "Generate Bulk QR View",
            actionType: "generate"
        },
        {
            title: "Configure Fleet Drivers",
            description: "Set the driver names for Car 1 and Car 2. This will be used to tag parts in the inventory.",
            action: "Save Driver Names",
            actionType: "saveDrivers",
            isDriverConfig: true
        }
    ];

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const lines = content.split('\n');
                const headers = lines[0].toLowerCase();

                // Check if it looks like it needs mapping
                if (!headers.includes('summary') || !headers.includes('status')) {
                    alert('CSV uploaded! We detected custom columns. In a production version, we would help you map: ' + lines[0] + ' to PitLane format. For now, please use our template.');
                } else {
                    alert(`CSV validated! Found ${lines.length - 1} parts. Ready to import via Jira Import Wizard.`);
                }
            };
            reader.readAsText(file);
        }
    };

    const handleAction = async (step, index, isSecondary = false) => {
        if (step.actionType === 'copy') {
            navigator.clipboard.writeText(step.linkText);
            setCopiedStep(index);
            setTimeout(() => setCopiedStep(null), 2000);
        } else if (step.actionType === 'download') {
            // Generate and download CSV template
            const csvContent = 'Summary,Status,Priority,Description\n' +
                'Power Unit ICE #1,Trackside,High,"Primary power unit for Car 23"\n' +
                'Front Wing Assembly,In Transit,Medium,"Main aerodynamic component"\n' +
                'Gearbox Cassette,Manufactured,High,"Sequential gearbox for FW47"';
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pitlane-inventory-template.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setCopiedStep(index);
            setTimeout(() => setCopiedStep(null), 2000);
        } else if (step.actionType === 'generate') {
            // Generate bulk QR View
            // Open window immediately to bypass popup blockers
            const printWindow = window.open('', '_blank');

            if (printWindow) {
                printWindow.document.write('<html><body style="font-family: sans-serif; padding: 20px; text-align: center;"><h1>Loading Inventory Data...</h1><p>Please wait while we fetch the latest QR codes.</p></body></html>');

                try {
                    const allParts = await invoke('getAllParts');
                    printWindow.document.open();
                    printWindow.document.write(`
                        <html>
                        <head>
                            <title>PitLane Ledger - Bulk QR Codes</title>
                            <style>
                                body { font-family: sans-serif; padding: 20px; }
                                .qr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; }
                                .qr-item { border: 1px solid #ccc; padding: 10px; text-align: center; page-break-inside: avoid; }
                                .qr-code { width: 100px; height: 100px; background: #eee; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; }
                                .part-key { font-weight: bold; font-size: 14px; }
                                .part-name { font-size: 12px; color: #666; }
                                @media print {
                                    .no-print { display: none; }
                                }
                            </style>
                        </head>
                        <body>
                            <h1>PitLane Ledger - Inventory Tags</h1>
                            <button class="no-print" onclick="window.print()" style="padding: 10px 20px; margin-bottom: 20px; cursor: pointer;">Print Labels</button>
                            <div class="qr-grid">
                                ${allParts.map(part => `
                                    <div class="qr-item">
                                        <div class="qr-code">
                                            <!-- Placeholder for actual QR generation -->
                                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${part.key}" alt="${part.key}" />
                                        </div>
                                        <div class="part-key">${part.key}</div>
                                        <div class="part-name">${part.name}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                } catch (error) {
                    console.error('Failed to generate QR view:', error);
                    printWindow.document.body.innerHTML = '<h1>Error</h1><p>Failed to load parts for printing. Please try again.</p>';
                }
            } else {
                alert('Please allow popups to view the printable QR codes.');
            }
        } else if (step.actionType === 'saveDrivers') {
            invoke('setDriverNames', driverNames).then(() => {
                setSavedDrivers(true);
                setTimeout(() => setSavedDrivers(false), 2000);
            });
        }
    };

    const handleSecondaryAction = (step, index) => {
        if (step.action2) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="onboarding-guide-container">
            <div className="onboarding-guide-card">
                <div className="onboarding-header">
                    <h1 className="onboarding-title">Manager Onboarding Action Plan</h1>
                    <p className="onboarding-subtitle">
                        Complete these {steps.length} steps to deploy PitLane Ledger across your team
                    </p>
                </div>

                <div className="steps-container">
                    {steps.map((step, index) => (
                        <div key={index} className="step-item">
                            <div className="step-number">{index + 1}</div>
                            <div className="step-content">
                                <h3 className="step-title">{step.title}</h3>
                                <p className="step-description">{step.description}</p>
                                {step.isDriverConfig ? (
                                    <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Car 1 Driver</label>
                                            <input
                                                type="text"
                                                value={driverNames.car1}
                                                onChange={(e) => setDriverNames({ ...driverNames, car1: e.target.value })}
                                                style={{
                                                    width: '100%', padding: '10px', borderRadius: '8px',
                                                    border: '1px solid var(--color-border-subtle)',
                                                    background: 'var(--color-bg-surface-alt)',
                                                    color: 'var(--color-text-primary)',
                                                    fontSize: '14px'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Car 2 Driver</label>
                                            <input
                                                type="text"
                                                value={driverNames.car2}
                                                onChange={(e) => setDriverNames({ ...driverNames, car2: e.target.value })}
                                                style={{
                                                    width: '100%', padding: '10px', borderRadius: '8px',
                                                    border: '1px solid var(--color-border-subtle)',
                                                    background: 'var(--color-bg-surface-alt)',
                                                    color: 'var(--color-text-primary)',
                                                    fontSize: '14px'
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : null}
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button
                                        className="step-action-btn"
                                        onClick={() => handleAction(step, index)}
                                    >
                                        {step.actionType === 'saveDrivers' ? (savedDrivers ? 'Saved!' : 'Save Driver Names') :
                                            copiedStep === index ? (step.actionType === 'download' ? 'Downloaded!' : 'Copied!') : step.action}
                                    </button>
                                    {step.action2 && (
                                        <button
                                            className="step-action-btn"
                                            style={{ background: 'transparent', border: '1px solid var(--color-accent-cyan)' }}
                                            onClick={() => handleSecondaryAction(step, index)}
                                        >
                                            {step.action2}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                />

                <div className="onboarding-footer">
                    <button className="btn-back" onClick={onBack}>
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingGuide;
