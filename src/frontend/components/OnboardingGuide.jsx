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
                if (!content) return;
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
            // Generate bulk QR View - Download as HTML file to avoid popup blockers
            try {
                const allParts = await invoke('getAllParts', { key: 'getAllParts' });
                if (!Array.isArray(allParts)) {
                    throw new Error('Invalid parts data received');
                }

                const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>PitLane Ledger - Inventory QR Codes</title>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
            color: #fff;
            padding: 40px 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid rgba(0, 184, 217, 0.3);
        }
        
        .logo-area {
            margin-bottom: 20px;
        }
        
        .logo-text {
            font-size: 48px;
            font-weight: 700;
            background: linear-gradient(90deg, #00B8D9, #00A0E3);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .header h1 {
            font-size: 32px;
            margin: 10px 0;
            color: #fff;
        }
        
        .header p {
            color: rgba(255, 255, 255, 0.6);
            font-size: 16px;
        }
        
        .controls {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .btn-print {
            background: linear-gradient(135deg, #00B8D9, #0066cc);
            border: none;
            color: white;
            padding: 15px 40px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 184, 217, 0.3);
            transition: transform 0.2s;
        }
        
        .btn-print:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 184, 217, 0.4);
        }
        
        .stats {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(0, 184, 217, 0.1);
            border-radius: 12px;
            border: 1px solid rgba(0, 184, 217, 0.2);
        }
        
        .stats-number {
            font-size: 48px;
            font-weight: 700;
            color: #00B8D9;
        }
        
        .stats-label {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .qr-grid { 
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 24px;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .qr-item { 
            background: rgba(21, 27, 46, 0.8);
            border: 2px solid rgba(0, 184, 217, 0.2);
            padding: 20px;
            text-align: center;
            border-radius: 12px;
            page-break-inside: avoid;
            transition: all 0.3s;
        }
        
        .qr-item:hover {
            border-color: rgba(0, 184, 217, 0.5);
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0, 184, 217, 0.2);
        }
        
        .qr-code { 
            width: 120px;
            height: 120px;
            background: #fff;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            padding: 8px;
            position: relative;
        }
        
        .qr-code img {
            width: 100%;
            height: 100%;
        }
        
        .qr-logo {
            display: none; /* No logo overlay */
        }
        
        .part-key { 
            font-weight: 700;
            font-size: 16px;
            color: #00B8D9;
            margin-bottom: 6px;
        }
        
        .part-name { 
            font-size: 13px;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.4;
        }
        
        @media print {
            body {
                background: white;
                color: black;
                padding: 20px;
            }
            
            .no-print { display: none; }
            
            .header {
                border-bottom-color: #ddd;
            }
            
            .logo-text {
                -webkit-text-fill-color: #00B8D9;
                color: #00B8D9;
            }
            
            .header h1, .header p {
                color: black;
            }
            
            .stats {
                background: #f5f5f5;
                border-color: #ddd;
            }
            
            .stats-number {
                color: #00B8D9;
            }
            
            .stats-label {
                color: #666;
            }
            
            .qr-item {
                background: white;
                border-color: #ddd;
            }
            
            .qr-item:hover {
                transform: none;
                box-shadow: none;
            }
            
            .part-key {
                color: #0066cc;
            }
            
            .part-name {
                color: #666;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-area">
            <div class="logo-text">PitLane Ledger</div>
        </div>
        <h1>Inventory QR Codes</h1>
        <p>Scan any code to view part details on mobile</p>
    </div>
    
    <div class="controls no-print">
        <button class="btn-print" onclick="window.print()">Print All Labels</button>
    </div>
    
    <div class="stats no-print">
        <div class="stats-number">${allParts.length}</div>
        <div class="stats-label">Total Parts</div>
    </div>
    
    <div class="qr-grid">
        ${allParts.map(part => `
            <div class="qr-item">
                <div class="qr-code">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent('https://pitlaneledger.atlassian.net/browse/' + part.key)}" alt="${part.key}" />
                </div>
                <div class="part-key">${part.key}</div>
                <div class="part-name">${part.name}</div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
                // Create blob and download
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pitlane-qr-codes-${new Date().toISOString().slice(0, 10)}.html`;
                document.body.appendChild(a);
                a.click();

                // Cleanup
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);

                setCopiedStep(index);
                setTimeout(() => setCopiedStep(null), 3000);
            } catch (error) {
                console.error('Failed to generate QR view:', error);
                alert('Failed to generate QR codes. Please try again.');
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
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => handleAction(step, index)}
                                        style={{
                                            flex: 1,
                                            padding: '12px 20px',
                                            background: 'linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-blue))',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            transition: 'transform 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        {copiedStep === index || (step.actionType === 'saveDrivers' && savedDrivers) ? '✓ Done' : step.action}
                                    </button>
                                    {step.action2 && (
                                        <button
                                            onClick={() => handleSecondaryAction(step, index)}
                                            style={{
                                                flex: 1,
                                                padding: '12px 20px',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid var(--color-border-subtle)',
                                                borderRadius: '8px',
                                                color: 'var(--color-text-primary)',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                transition: 'all 0.2s'
                                            }}
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
