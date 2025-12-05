import React, { useState, useRef } from 'react';
import { invoke } from '@forge/bridge';
import { Download, Link, Printer, Users, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import Toast from './Toast';

const OnboardingGuide = ({ onBack, onComplete }) => {
    const [copiedStep, setCopiedStep] = useState(null);
    const [driverNames, setDriverNames] = useState({ car1: '', car2: '' });
    const [savedDrivers, setSavedDrivers] = useState(false);
    const [toast, setToast] = useState(null);
    const [csvUploaded, setCsvUploaded] = useState(false);
    const fileInputRef = useRef(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    // Load fleet config on mount
    React.useEffect(() => {
        const loadFleetConfig = async () => {
            try {
                const config = await invoke('getFleetConfig');
                if (config) {
                    setDriverNames({ car1: config.car1, car2: config.car2 });
                }
            } catch (error) {
                console.error('Failed to load fleet config:', error);
            }
        };
        loadFleetConfig();
    }, []);

    // Security utility functions
    const sanitizeCSVValue = (value) => {
        // Prevent CSV formula injection
        if (typeof value !== 'string') return value;

        const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
        if (dangerousChars.some(char => value.startsWith(char))) {
            return `'${value}`; // Prefix with single quote to neutralize
        }
        return value;
    };

    const escapeHTML = (str) => {
        // Prevent XSS in generated HTML
        if (typeof str !== 'string') return str;
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    const validateFileSize = (file) => {
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB - plenty for thousands of parts
        return file.size <= MAX_FILE_SIZE;
    };

    const steps = [
        {
            title: "Migrate Inventory Data",
            description: "Upload your master parts list (CSV) directly using the Jira Import Wizard. Supports any inventory size.",
            action: "Download CSV Template",
            action2: "Upload Existing CSV",
            actionType: "download",
            icon: <Download size={20} />
        },
        {
            title: "Set Roles & Access",
            description: "Send the self-service assignment link to all mechanics to join the 'pit-crew' group.",
            action: "Copy Self-Service Link",
            actionType: "copy",
            linkText: "https://your-site.atlassian.net/plugins/servlet/ac/pitlane-ledger/join-pit-crew",
            icon: <Link size={20} />
        },
        {
            title: "Print Physical Tags",
            description: "Generate a printable view of all QR code labels for industrial printing.",
            action: "Print All QR Labels",
            actionType: "generate",
            icon: <Printer size={20} />
        },
        {
            title: "Configure Fleet Drivers",
            description: "Set the driver names for Car 1 and Car 2 for part tagging.",
            action: "Save Driver Names",
            actionType: "saveDrivers",
            isDriverConfig: true,
            icon: <Users size={20} />
        }
    ];

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'text/csv') {
            showToast('Please select a valid CSV file.', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            if (!content) return;

            try {
                // Parse CSV
                const lines = content.split('\n').filter(line => line.trim());
                if (lines.length < 2) {
                    showToast('CSV file is empty or has no data rows.', 'error');
                    return;
                }

                const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

                // Validate required headers (only Summary and Status are mandatory, Key auto-generates if missing)
                const requiredHeaders = ['summary', 'status'];
                const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

                if (missingHeaders.length > 0) {
                    showToast(
                        `Invalid CSV format. Missing required columns: ${missingHeaders.join(', ')}. Required: Summary, Status.`,
                        'error'
                    );
                    return;
                }

                // Get column indices
                const getIndex = (name) => headers.indexOf(name.toLowerCase());
                const summaryIdx = getIndex('summary');
                const statusIdx = getIndex('status');
                const keyIdx = getIndex('key');
                const descriptionIdx = getIndex('description');
                const locationIdx = getIndex('location');
                const assignmentIdx = getIndex('assignment');
                const lifeRemainingIdx = getIndex('life remaining');
                const lifeIdx = getIndex('life'); // Percentage

                // Parse data rows
                const parts = [];
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // Handle CSV with quotes
                    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v =>
                        v.replace(/^"|"$/g, '').trim()
                    );

                    if (values.length < 2) continue; // Skip rows with less than 2 values (need Summary + Status minimum)

                    // Auto-generate Key if column missing or value empty
                    const providedKey = (keyIdx >= 0 && values[keyIdx]) ? values[keyIdx].trim() : '';
                    const generatedKey = providedKey || `PIT-${1000 + i}`;

                    // Security: Sanitize all input values
                    const part = {
                        id: `imported-${Date.now()}-${i}`,
                        name: sanitizeCSVValue(values[summaryIdx] || 'Unknown Part'),
                        key: sanitizeCSVValue(generatedKey),
                        pitlaneStatus: sanitizeCSVValue(values[statusIdx] || 'Trackside'),
                        description: descriptionIdx >= 0 ? sanitizeCSVValue(values[descriptionIdx] || '') : '',
                        location: locationIdx >= 0 ? sanitizeCSVValue(values[locationIdx] || '') : 'Garage',
                        assignment: assignmentIdx >= 0 ? sanitizeCSVValue(values[assignmentIdx] || '') : 'Spares',
                        life: lifeIdx >= 0 ? Math.min(100, Math.max(0, parseInt(values[lifeIdx]) || 100)) : 100,
                        lifeRemaining: lifeRemainingIdx >= 0 ? Math.max(0, parseInt(values[lifeRemainingIdx]) || 5) : 5,
                        lastUpdated: new Date().toISOString(),
                        predictiveStatus: 'HEALTHY'
                    };

                    parts.push(part);
                }

                if (parts.length === 0) {
                    showToast('No valid parts found in CSV. Please check your file format and try again.', 'warning');
                    return;
                }

                console.log('[DEBUG] Parsed parts count:', parts.length);
                console.log('[DEBUG] First part:', parts[0]);

                // Import to backend
                const result = await invoke('importProductionData', { parts });

                console.log('[DEBUG] Backend result:', result);

                if (result.success) {
                    setCsvUploaded(true);
                    showToast(`Success! Imported ${result.count} parts into Production Inventory.`, 'success');
                } else {
                    showToast(`Import failed: ${result.message}`, 'error');
                }
            } catch (error) {
                console.error('CSV parsing error:', error);
                showToast('Failed to parse CSV file. Please check the format and try again.', 'error');
            }
        };

        reader.readAsText(file);
    };

    const handleAction = async (step, index) => {
        if (step.actionType === 'copy') {
            navigator.clipboard.writeText(step.linkText);
            setCopiedStep(index);
            setTimeout(() => setCopiedStep(null), 2000);
        } else if (step.actionType === 'download') {
            const csvContent = 'Summary,Status,Key,Assignment,Life Remaining,Location,Priority,Description\n' +
                'Power Unit ICE #1,Trackside,PIT-101,Car 1,5,Garage 1,High,"Primary power unit for Car 23"\n' +
                'Front Wing Assembly,In Transit,PIT-201,Spares,6,DHL Cargo,Medium,"Spare wing for Monaco setup"\n' +
                'Gearbox Casing,Manufactured,PIT-301,Car 2,8,Grove Factory,High,"New titanium casing for Car 55"\n';
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
            // Check if CSV has been uploaded
            if (!csvUploaded) {
                showToast('⚠️ Please upload a CSV file first before generating QR codes.', 'warning');
                return;
            }

            try {
                // Use production inventory for QR generation (CSV upload happens before this step)
                const allParts = await invoke('getProductionParts');

                if (!allParts || allParts.length === 0) {
                    showToast('⚠️ No inventory data found. Please upload a CSV file first before generating QR codes.', 'warning');
                    return;
                }

                const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>PitLane Ledger - Inventory QR Codes</title>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' https://api.qrserver.com; style-src 'unsafe-inline';">
    <style>
        body { font-family: sans-serif; padding: 20px; background-color: #050810; color: white; }
        h1 { text-align: center; color: #00B8D9; }
        .count { text-align: center; color: #94A3B8; margin-bottom: 30px; }
        .qr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; margin-top: 40px; }
        .qr-item { border: 1px solid #333; padding: 15px; text-align: center; border-radius: 8px; background: #151B2E; }
        .qr-code img { width: 100px; height: 100px; background: white; padding: 5px; border-radius: 4px; }
        .part-key { font-weight: bold; color: #00B8D9; margin-top: 10px; font-size: 14px; }
        .part-name { font-size: 12px; color: #94A3B8; margin-top: 4px; }
        @media print { 
            body { background-color: white; color: black; }
            .qr-item { border: 1px solid #ccc; background: white; }
            .no-print { display: none; } 
            h1 { color: black; }
        }
    </style>
</head>
<body>
    <h1>PitLane Ledger Production Inventory</h1>
    <div class="count no-print">Total Parts: ${allParts.length}</div>
    <div style="text-align: center; margin-bottom: 20px;" class="no-print">
        <button onclick="window.print()" style="padding: 10px 20px; background: #00B8D9; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Labels</button>
    </div>
    <div class="qr-grid">
        ${allParts.map(part => `
            <div class="qr-item">
                <div class="qr-code">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(escapeHTML(part.key))}" alt="QR Code for ${escapeHTML(part.key)}" />
                </div>
                <div class="part-key">${escapeHTML(part.key)}</div>
                <div class="part-name">${escapeHTML(part.name)}</div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;

                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pitlane-qr-codes-${new Date().toISOString().slice(0, 10)}.html`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);

                setCopiedStep(index);
                setTimeout(() => setCopiedStep(null), 2000);
                showToast(`Generated QR codes for ${allParts.length} parts. Opening download...`, 'success');
            } catch (error) {
                console.error('Failed to generate QR view:', error);
                showToast('Failed to generate QR codes. Please try again.', 'error');
            }
        } else if (step.actionType === 'saveDrivers') {
            try {
                console.log('[DEBUG] Saving drivers - driverNames:', driverNames);
                console.log('[DEBUG] Sending payload:', { payload: driverNames });

                const result = await invoke('saveFleetConfig', { payload: driverNames });

                console.log('[DEBUG] Save result:', JSON.stringify(result, null, 2));

                if (result.success) {
                    setSavedDrivers(true);
                    setTimeout(() => setSavedDrivers(false), 2000);
                    showToast('Fleet configuration saved successfully!', 'success');
                } else {
                    showToast(`Failed to save: ${result.message}`, 'error');
                }
            } catch (error) {
                console.error('Failed to save fleet config:', error);
                showToast('Failed to save fleet configuration. Please try again.', 'error');
            }
        }
    };

    return (
        <div style={styles.container}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div style={styles.card}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Manager Onboarding Action Plan</h1>
                    <p style={styles.subtitle}>
                        Complete these {steps.length} steps to deploy PitLane Ledger across your team
                    </p>
                </div>

                <div style={styles.stepsContainer}>
                    {steps.map((step, index) => (
                        <div key={index} style={styles.stepItem}>
                            <div style={styles.stepNumber}>{index + 1}</div>
                            <div style={styles.stepContent}>
                                <div style={styles.stepHeader}>
                                    <h3 style={styles.stepTitle}>{step.title}</h3>
                                    {step.icon && <div style={{ color: 'var(--color-accent-cyan)' }}>{step.icon}</div>}
                                </div>
                                <p style={styles.stepDescription}>{step.description}</p>

                                {step.isDriverConfig && (
                                    <div style={styles.driverConfig}>
                                        <div style={{ flex: 1 }}>
                                            <label style={styles.label}>Car 1 Driver</label>
                                            <input
                                                type="text"
                                                value={driverNames.car1}
                                                onChange={(e) => setDriverNames({ ...driverNames, car1: e.target.value })}
                                                placeholder="e.g., Alex Albon"
                                                style={styles.input}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={styles.label}>Car 2 Driver</label>
                                            <input
                                                type="text"
                                                value={driverNames.car2}
                                                onChange={(e) => setDriverNames({ ...driverNames, car2: e.target.value })}
                                                placeholder="e.g., Carlos Sainz"
                                                style={styles.input}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div style={styles.actionButtons}>
                                    <button
                                        onClick={() => handleAction(step, index)}
                                        style={styles.primaryBtn}
                                    >
                                        {copiedStep === index || (step.actionType === 'saveDrivers' && savedDrivers) ?
                                            <><Check size={16} /> Done</> : step.action}
                                    </button>
                                    {step.action2 && (
                                        <button
                                            onClick={() => fileInputRef.current.click()}
                                            style={styles.secondaryBtn}
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

                <div style={styles.footer}>
                    <button style={styles.secondaryBtn} onClick={onBack}>
                        <ArrowLeft size={16} />
                        Back to Selection
                    </button>
                    <button style={styles.primaryBtn} onClick={onComplete}>
                        Enter Dashboard
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '40px',
        maxWidth: '1000px',
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    card: {
        background: '#151B2E',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        boxShadow: 'var(--shadow-soft)'
    },
    header: {
        textAlign: 'center',
        marginBottom: '40px',
        borderBottom: '1px solid var(--color-border-subtle)',
        paddingBottom: '20px'
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: 'var(--color-accent-cyan)',
        marginBottom: '8px'
    },
    subtitle: {
        color: 'var(--color-text-secondary)',
        fontSize: '16px'
    },
    stepsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    stepItem: {
        display: 'flex',
        gap: '20px',
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: '1px solid var(--color-border-subtle)'
    },
    stepNumber: {
        width: '32px',
        height: '32px',
        background: 'var(--color-accent-cyan)',
        color: '#000',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '16px',
        flexShrink: 0
    },
    stepContent: {
        flex: 1
    },
    stepHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
    },
    stepTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: 'var(--color-text-primary)',
        margin: 0
    },
    stepDescription: {
        color: 'var(--color-text-secondary)',
        fontSize: '14px',
        marginBottom: '16px',
        lineHeight: '1.5'
    },
    driverConfig: {
        display: 'flex',
        gap: '16px',
        marginBottom: '16px'
    },
    label: {
        display: 'block',
        fontSize: '12px',
        color: 'var(--color-text-secondary)',
        marginBottom: '4px'
    },
    input: {
        width: '100%',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid var(--color-border-subtle)',
        background: 'var(--color-bg-surface-alt)',
        color: 'var(--color-text-primary)',
        fontSize: '14px',
        outline: 'none'
    },
    actionButtons: {
        display: 'flex',
        gap: '12px'
    },
    primaryBtn: {
        flex: 1,
        padding: '12px 20px',
        background: 'linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-blue))',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'transform 0.2s'
    },
    secondaryBtn: {
        flex: 1,
        padding: '12px 20px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '8px',
        color: 'var(--color-text-primary)',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'background 0.2s'
    },
    footer: {
        marginTop: '40px',
        borderTop: '1px solid var(--color-border-subtle)',
        paddingTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        gap: '20px'
    }
};

export default OnboardingGuide;
