import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import { X, Save, User, Settings as SettingsIcon, RefreshCw, Database, Trash2, Power, Info, AlertCircle } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const SettingsPanel = ({ onClose, currentDriverNames, onDriverNamesUpdated, appMode }) => {
    const [car1Driver, setCar1Driver] = useState(currentDriverNames.car1 || '');
    const [car2Driver, setCar2Driver] = useState(currentDriverNames.car2 || '');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('drivers'); // drivers, data, about
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, title: '', message: '' });

    useEffect(() => {
        setCar1Driver(currentDriverNames.car1 || '');
        setCar2Driver(currentDriverNames.car2 || '');
    }, [currentDriverNames]);

    const handleSaveDrivers = async () => {
        if (!car1Driver.trim() || !car2Driver.trim()) {
            setMessage('Both driver names are required');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            const result = await invoke('saveFleetConfig', {
                car1: car1Driver.trim(),
                car2: car2Driver.trim()
            });

            if (result.success) {
                setMessage('✓ Drivers saved successfully');
                setTimeout(() => {
                    onDriverNamesUpdated({ car1: car1Driver.trim(), car2: car2Driver.trim() });
                    setMessage('');
                }, 1500);
            } else {
                setMessage('Failed to save: ' + result.message);
            }
        } catch (error) {
            console.error('[Settings] Save error:', error);
            setMessage('Error saving drivers');
        } finally {
            setSaving(false);
        }
    };

    const handleClearProductionData = () => {
        setConfirmModal({
            isOpen: true,
            action: 'clearData',
            title: 'Clear Production Data',
            message: 'This will remove all CSV inventory and reset to demo mode. This action cannot be undone.'
        });
    };

    const handleResetOnboarding = () => {
        setConfirmModal({
            isOpen: true,
            action: 'resetOnboarding',
            title: 'Reset Onboarding',
            message: 'You will see the setup wizard again on next load. This action cannot be undone.'
        });
    };

    const executeConfirmedAction = async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });

        try {
            if (confirmModal.action === 'clearData') {
                const result = await invoke('clearProductionData');
                if (result.success) {
                    setMessage('✓ Production data cleared');
                    setTimeout(() => window.location.reload(), 1500);
                }
            } else if (confirmModal.action === 'resetOnboarding') {
                const result = await invoke('resetStorage');
                if (result.success) {
                    setMessage('✓ Onboarding reset');
                    setTimeout(() => window.location.reload(), 1500);
                }
            }
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerTitle}>
                        <SettingsIcon size={24} color="#00B8D9" />
                        <h2 style={styles.title}>Settings</h2>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={styles.tabs}>
                    <button
                        style={activeTab === 'drivers' ? styles.tabActive : styles.tab}
                        onClick={() => setActiveTab('drivers')}
                    >
                        <User size={16} />
                        Drivers
                    </button>
                    <button
                        style={activeTab === 'data' ? styles.tabActive : styles.tab}
                        onClick={() => setActiveTab('data')}
                    >
                        <Database size={16} />
                        Data
                    </button>
                    <button
                        style={activeTab === 'about' ? styles.tabActive : styles.tab}
                        onClick={() => setActiveTab('about')}
                    >
                        <Info size={16} />
                        About
                    </button>
                </div>

                {/* Content */}
                <div style={styles.content}>
                    {/* Drivers Tab */}
                    {activeTab === 'drivers' && (
                        <>
                            <div style={styles.section}>
                                <h3 style={styles.sectionTitle}>Driver Configuration</h3>
                                <p style={styles.sectionDesc}>
                                    Configure driver names for Car 1 and Car 2. These names will appear in dashboard tabs and reports.
                                </p>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Car 1 Driver</label>
                                    <input
                                        type="text"
                                        value={car1Driver}
                                        onChange={(e) => setCar1Driver(e.target.value)}
                                        placeholder="Enter driver name..."
                                        style={styles.input}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Car 2 Driver</label>
                                    <input
                                        type="text"
                                        value={car2Driver}
                                        onChange={(e) => setCar2Driver(e.target.value)}
                                        placeholder="Enter driver name..."
                                        style={styles.input}
                                    />
                                </div>
                            </div>

                            <div style={styles.infoBox}>
                                <strong>Note:</strong> Driver names are saved to Forge storage and persist across sessions.
                            </div>
                        </>
                    )}

                    {/* Data Tab */}
                    {activeTab === 'data' && (
                        <>
                            <div style={styles.section}>
                                <h3 style={styles.sectionTitle}>Data Management</h3>
                                <p style={styles.sectionDesc}>
                                    Manage your application data and reset settings.
                                </p>

                                <div style={styles.actionItem}>
                                    <div>
                                        <div style={styles.actionTitle}>Current Mode</div>
                                        <div style={styles.actionDesc}>
                                            {appMode === 'DEMO' ? 'Demo Mode (Hardcoded Data)' : 'Production Mode (CSV Data)'}
                                        </div>
                                    </div>
                                    <div style={{
                                        ...styles.badge,
                                        background: appMode === 'DEMO' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                        color: appMode === 'DEMO' ? '#8B5CF6' : '#22C55E',
                                        border: `1px solid ${appMode === 'DEMO' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
                                    }}>
                                        {appMode === 'DEMO' ? 'DEMO' : 'PRODUCTION'}
                                    </div>
                                </div>

                                <div style={{ ...styles.actionItem, marginTop: '20px' }}>
                                    <div>
                                        <div style={styles.actionTitle}>Clear Production Data</div>
                                        <div style={styles.actionDesc}>Remove all CSV inventory and reset to demo mode</div>
                                    </div>
                                    <button onClick={handleClearProductionData} style={styles.dangerBtn}>
                                        <Trash2 size={16} />
                                        Clear
                                    </button>
                                </div>

                                <div style={{ ...styles.actionItem, marginTop: '16px' }}>
                                    <div>
                                        <div style={styles.actionTitle}>Reset Onboarding</div>
                                        <div style={styles.actionDesc}>Show setup wizard again on next load</div>
                                    </div>
                                    <button onClick={handleResetOnboarding} style={styles.dangerBtn}>
                                        <RefreshCw size={16} />
                                        Reset
                                    </button>
                                </div>
                            </div>

                            <div style={{ ...styles.infoBox, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                <AlertCircle size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                                <strong>Warning:</strong> These actions cannot be undone. Use with caution.
                            </div>
                        </>
                    )}

                    {/* About Tab */}
                    {activeTab === 'about' && (
                        <>
                            <div style={styles.section}>
                                <h3 style={styles.sectionTitle}>About PitLane Ledger</h3>
                                <div style={styles.aboutItem}>
                                    <span style={styles.aboutLabel}>Version:</span>
                                    <span style={styles.aboutValue}>1.0.0</span>
                                </div>
                                <div style={styles.aboutItem}>
                                    <span style={styles.aboutLabel}>Environment:</span>
                                    <span style={styles.aboutValue}>Development</span>
                                </div>
                                <div style={styles.aboutItem}>
                                    <span style={styles.aboutLabel}>Team:</span>
                                    <span style={styles.aboutValue}>Williams Racing</span>
                                </div>
                                <div style={styles.aboutItem}>
                                    <span style={styles.aboutLabel}>App ID:</span>
                                    <span style={styles.aboutValue}>pitlane-ledger</span>
                                </div>
                            </div>

                            <div style={styles.infoBox}>
                                <strong>Williams Parts Passport System</strong><br />
                                Advanced parts tracking and telemetry for Formula 1 race operations.
                            </div>
                        </>
                    )}

                    {/* Message Display */}
                    {message && (
                        <div style={message.startsWith('✓') ? styles.successMessage : styles.errorMessage}>
                            {message}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <button onClick={onClose} style={styles.cancelBtn}>
                        Close
                    </button>
                    {activeTab === 'drivers' && (
                        <button onClick={handleSaveDrivers} style={styles.saveBtn} disabled={saving}>
                            {saving ? (
                                <>
                                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={executeConfirmedAction}
                onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                confirmText="Confirm"
                cancelText="Cancel"
                isDanger={true}
            />
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
    },
    panel: {
        background: 'linear-gradient(135deg, #0A0E1A 0%, #151B2E 100%)',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '650px',
        border: '1px solid rgba(0, 184, 217, 0.3)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 28px',
        borderBottom: '1px solid rgba(0, 184, 217, 0.2)',
        background: 'rgba(0, 184, 217, 0.05)'
    },
    headerTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    title: {
        margin: 0,
        fontSize: '24px',
        fontWeight: 700,
        color: '#fff'
    },
    closeBtn: {
        background: 'transparent',
        border: 'none',
        color: '#94A3B8',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    tabs: {
        display: 'flex',
        borderBottom: '1px solid rgba(0, 184, 217, 0.2)',
        background: 'rgba(0, 0, 0, 0.2)'
    },
    tab: {
        flex: 1,
        padding: '14px 20px',
        background: 'transparent',
        border: 'none',
        color: '#94A3B8',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        borderBottom: '2px solid transparent'
    },
    tabActive: {
        flex: 1,
        padding: '14px 20px',
        background: 'rgba(0, 184, 217, 0.05)',
        border: 'none',
        color: '#00B8D9',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderBottom: '2px solid #00B8D9'
    },
    content: {
        padding: '28px',
        maxHeight: '450px',
        overflowY: 'auto'
    },
    section: {
        marginBottom: '24px'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: 600,
        color: '#ffffff',
        marginBottom: '8px'
    },
    sectionDesc: {
        color: '#94A3B8',
        fontSize: '14px',
        marginBottom: '20px',
        lineHeight: '1.5'
    },
    formGroup: {
        marginBottom: '20px'
    },
    label: {
        display: 'block',
        color: '#E2E8F0',
        fontSize: '14px',
        fontWeight: 500,
        marginBottom: '8px'
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(0, 184, 217, 0.3)',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '15px',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'all 0.2s',
        boxSizing: 'border-box'
    },
    actionItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        border: '1px solid rgba(148, 163, 184, 0.2)'
    },
    actionTitle: {
        color: '#E2E8F0',
        fontSize: '15px',
        fontWeight: 500,
        marginBottom: '4px'
    },
    actionDesc: {
        color: '#94A3B8',
        fontSize: '13px'
    },
    badge: {
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600
    },
    dangerBtn: {
        padding: '8px 16px',
        background: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '6px',
        color: '#EF4444',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s'
    },
    aboutItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '6px',
        marginBottom: '8px'
    },
    aboutLabel: {
        color: '#94A3B8',
        fontSize: '14px'
    },
    aboutValue: {
        color: '#E2E8F0',
        fontSize: '14px',
        fontWeight: 500
    },
    infoBox: {
        background: 'rgba(0, 184, 217, 0.1)',
        border: '1px solid rgba(0, 184, 217, 0.3)',
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#94A3B8',
        fontSize: '13px',
        marginTop: '20px'
    },
    successMessage: {
        background: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#22C55E',
        fontSize: '14px',
        marginTop: '16px'
    },
    errorMessage: {
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#EF4444',
        fontSize: '14px',
        marginTop: '16px'
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '20px 28px',
        borderBottom: '1px solid rgba(0, 184, 217, 0.2)',
        background: 'rgba(0, 0, 0, 0.2)'
    },
    cancelBtn: {
        padding: '10px 20px',
        background: 'transparent',
        border: '1px solid rgba(148, 163, 184, 0.3)',
        borderRadius: '8px',
        color: '#94A3B8',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    saveBtn: {
        padding: '10px 20px',
        background: 'linear-gradient(135deg, #00B8D9 0%, #0066CA 100%)',
        border: 'none',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s'
    }
};

export default SettingsPanel;
