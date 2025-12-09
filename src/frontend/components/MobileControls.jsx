import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@forge/bridge';
import { CheckCircle, AlertTriangle, ArrowLeft, Plus, QrCode, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import QrScanner from 'qr-scanner'; // Nimiq - primary scanner with WebWorker

const MobileControls = ({ issueId, onReturn, onEventLogged, appMode, initialView, onScanSwitch, allParts }) => {
    const [isLogging, setIsLogging] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastAction, setLastAction] = useState('');
    const [showAddPartModal, setShowAddPartModal] = useState(initialView === 'add');
    const [showPrintQRModal, setShowPrintQRModal] = useState(initialView === 'print');
    const [newPart, setNewPart] = useState({ name: '', key: '', location: 'Garage 1' });
    const [qrPrintStats, setQRPrintStats] = useState({ lastPrint: null, lastCount: 0, currentCount: 0 });
    const [expandedFields, setExpandedFields] = useState(false); // Toggle for extra fields
    const [internalParts, setInternalParts] = useState([]); // Fallback if allParts prop is missing

    // Load Data (QR history + Parts) on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                // History
                const history = localStorage.getItem('pitlane_qr_print_history');
                if (history) {
                    const data = JSON.parse(history);
                    setQRPrintStats(prev => ({ ...prev, lastPrint: data.lastPrint, lastCount: data.count }));
                }

                // Parts
                const resolver = appMode === 'DEMO' ? 'getDemoParts' : 'getProductionParts';
                const parts = await invoke(resolver);
                setInternalParts(parts || []);
                setQRPrintStats(prev => ({ ...prev, currentCount: parts?.length || 0 }));
            } catch (error) {
                console.error('Failed to load mobile data:', error);
            }
        };
        loadData();
    }, [appMode]);

    const handleQuickLog = async (status) => {
        setIsLogging(true);

        try {
            await invoke('logEvent', {
                key: 'logEvent',
                issueId,
                status,
                note: `Quick log from pit crew mobile at ${new Date().toLocaleTimeString()}`
            });

            setLastAction(status);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2500);

            if (onEventLogged) onEventLogged();
        } catch (error) {
            console.error('Error logging event:', error);
            alert('Failed to log event');
        } finally {
            setIsLogging(false);
        }
    };

    const handleAutoGenerateKey = () => {
        const type = newPart.name.split(' ')[0].toUpperCase().substring(0, 3) || 'PRT';
        const random = Math.floor(Math.random() * 900) + 100;
        setNewPart(prev => ({ ...prev, key: `PIT-${type}-${random}` }));
    };

    // Default to scanner view unless another modal is explicitly requested
    const [showScanner, setShowScanner] = useState(initialView !== 'add' && initialView !== 'print');
    const [scanResult, setScanResult] = useState(null);
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
    const [torchOn, setTorchOn] = useState(false);
    const [scanHistory, setScanHistory] = useState([]); // Recent scans
    const [scanError, setScanError] = useState(null); // In-app error messages
    const isPausedRef = useRef(false);
    const scannerRef = useRef(null);

    // Initialize QR Scanner (Nimiq primary, html5-qrcode fallback)
    const videoRef = useRef(null);
    const scannerTypeRef = useRef(null); // Use ref to avoid stale closure
    const [scannerType, setScannerType] = useState(null); // For UI display only

    // Immediate camera release function
    const stopCamera = () => {
        if (scannerRef.current) {
            console.log('[Scanner] Stopping camera immediately');
            try {
                if (scannerTypeRef.current === 'nimiq') {
                    scannerRef.current.destroy();
                } else if (scannerRef.current.isScanning) {
                    scannerRef.current.stop();
                }
            } catch (e) {
                console.warn('[Scanner] Cleanup error:', e);
            }
            scannerRef.current = null;
            scannerTypeRef.current = null;
        }
    };

    useEffect(() => {
        if (!showScanner) {
            setScanResult(null);
            stopCamera(); // Immediately release camera when modal closes
            return;
        }

        // Reset state
        setScanResult(null);
        setScanError(null);
        isPausedRef.current = false;

        const initScanner = async () => {
            // Try Nimiq QrScanner first (uses WebWorker + native BarcodeDetector)
            const hasNativeSupport = await QrScanner.hasCamera();

            if (hasNativeSupport && videoRef.current) {
                try {
                    console.log('[Scanner] Initializing Nimiq QrScanner (WebWorker mode)');

                    const qrScanner = new QrScanner(
                        videoRef.current,
                        (result) => {
                            if (isPausedRef.current) return;
                            console.log('[Nimiq] Scanned:', result.data);
                            isPausedRef.current = true;

                            // Vibration feedback
                            if (navigator.vibrate) navigator.vibrate(200);

                            // Build compatible result format
                            handleScanSuccess(result.data, null, {
                                result: { format: { formatName: 'QR_CODE' } }
                            });
                        },
                        {
                            preferredCamera: facingMode === 'user' ? 'user' : 'environment',
                            highlightScanRegion: true,
                            highlightCodeOutline: true,
                            maxScansPerSecond: 15,
                            returnDetailedScanResult: true
                        }
                    );

                    await qrScanner.start();
                    scannerRef.current = qrScanner;
                    scannerTypeRef.current = 'nimiq';
                    setScannerType('nimiq');
                    console.log('[Scanner] Nimiq started successfully');
                    return;
                } catch (nimiqErr) {
                    console.warn('[Scanner] Nimiq failed, falling back to html5-qrcode:', nimiqErr);
                }
            }

            // Fallback: html5-qrcode
            console.log('[Scanner] Using html5-qrcode fallback');
            const timer = setTimeout(() => {
                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;
                scannerTypeRef.current = 'html5';
                setScannerType('html5');

                const config = {
                    fps: 15,
                    qrbox: { width: 280, height: 280 },
                    aspectRatio: 1.0,
                    experimentalFeatures: { useBarCodeDetectorIfSupported: true }
                };

                html5QrCode.start(
                    { facingMode },
                    config,
                    (decodedText, decodedResult) => {
                        if (isPausedRef.current) return;
                        console.log('[html5] Scanned:', decodedText);
                        isPausedRef.current = true;
                        if (navigator.vibrate) navigator.vibrate(200);
                        handleScanSuccess(decodedText, html5QrCode, decodedResult);
                    },
                    () => { } // Ignore errors
                ).catch(err => {
                    console.error('[Scanner] html5-qrcode failed:', err);
                    const msg = err.name === 'NotAllowedError' ? 'Camera permission denied.' :
                        err.name === 'NotFoundError' ? 'No camera found.' :
                            err.name === 'NotReadableError' ? 'Camera in use by another app.' :
                                'Failed to start camera.';
                    setScanError(msg);
                    setShowScanner(false);
                });
            }, 100);

            return () => clearTimeout(timer);
        };

        initScanner();

        // Stop camera when tab becomes hidden or browser is minimized
        const handleVisibilityChange = () => {
            if (document.hidden && scannerRef.current) {
                console.log('[Scanner] Tab hidden - stopping camera');
                stopCamera(); // Stop entirely when hidden for security
            }
        };

        // Stop camera when leaving page
        const handleBeforeUnload = () => {
            stopCamera();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            stopCamera(); // Use the centralized cleanup function
        };
    }, [showScanner, facingMode]);

    const handleScanSuccess = (decodedText, scanner, decodedResult) => {
        // Vibration feedback (if supported)
        if (navigator.vibrate) navigator.vibrate(200);

        // Format detection from decodedResult (if available)
        const format = decodedResult?.result?.format?.formatName || 'QR_CODE';
        const formatDisplay = format.replace(/_/g, ' ');

        const isPitPart = decodedText.startsWith('PIT-') || decodedText.startsWith('pit-');

        // Add to scan history (keep last 10)
        const historyEntry = { text: decodedText, format: formatDisplay, time: new Date().toLocaleTimeString() };
        setScanHistory(prev => [historyEntry, ...prev.slice(0, 9)]);

        if (isPitPart) {
            const targetKey = decodedText.toUpperCase();
            // Check if key exists in allParts (if available) or internalParts
            const partsList = allParts || internalParts;
            const exists = partsList && partsList.some(p => p.key === targetKey);

            setScanResult({
                type: 'internal',
                text: targetKey,
                exists: !!exists,
                format: formatDisplay
            });
        } else {
            setScanResult({ type: 'external', text: decodedText, format: formatDisplay });
        }
    };

    const handleDismissScan = () => {
        setScanResult(null);
        isPausedRef.current = false; // Resume scanning
    };

    const handleFlipCamera = async () => {
        const newMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newMode);
        // Stop and restart scanner with new facing mode
        if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop();
            scannerRef.current = null;
        }
        // useEffect will restart with new facingMode
        setShowScanner(false);
        setTimeout(() => setShowScanner(true), 100);
    };

    const handleToggleTorch = async () => {
        if (!scannerRef.current) return;
        try {
            const track = scannerRef.current.getRunningTrackCameraCapabilities?.();
            if (track && track.torchFeature && track.torchFeature().isSupported()) {
                await track.torchFeature().apply(!torchOn);
                setTorchOn(!torchOn);
            } else {
                alert('Flashlight not available on this device/camera.');
            }
        } catch (err) {
            console.warn('Torch toggle failed:', err);
            alert('Unable to toggle flashlight.');
        }
    };

    // DEV ONLY: Upload QR image for testing (remove in production)
    const handleUploadQR = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setScanError(null); // Clear previous errors
        try {
            const html5QrCode = new Html5Qrcode("reader-upload");
            const result = await html5QrCode.scanFile(file, true);
            console.log('Scanned from upload:', result);
            if (navigator.vibrate) navigator.vibrate(200);
            handleScanSuccess(result, null, null);
        } catch (err) {
            console.error('Failed to scan uploaded image:', err);
            setScanError('No QR/barcode found in image. Try a clearer image.');
        }
    };

    const handleActionFromScan = (action) => {
        if (!scanResult) return;

        if (action === 'switch') {
            if (onScanSwitch) onScanSwitch(scanResult.text);
            setShowScanner(false);
        } else if (action === 'add') {
            setNewPart(prev => ({
                ...prev,
                key: scanResult.type === 'internal' ? scanResult.text : `PIT-EXT-${Math.floor(Math.random() * 9999)}`,
                name: scanResult.type === 'external' ? `Scanned: ${scanResult.text.substring(0, 20)}...` : 'New Pit Part',
                description: `Scanned Data: ${scanResult.text}`
            }));
            setShowAddPartModal(true);
            setExpandedFields(true);
            setShowScanner(false);
        }
    };

    const handleScanQR = () => {
        setShowScanner(true);
    };

    const handleAddPart = async () => {
        if (!newPart.name || !newPart.key) {
            alert('Please enter Name and Key');
            return;
        }
        setIsLogging(true); // Reuse isLogging state for Create Part
        try {
            await invoke('addPart', {
                key: 'addPart',
                part: newPart
            });
            setShowAddPartModal(false);
            setLastAction('Part Added');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2500);
        } catch (error) {
            console.error('Error adding part:', error);
            alert('Failed to add part');
        } finally {
            setIsLogging(false);
        }
    };

    const generateQRHTML = (parts) => {
        const escapeHTML = (str) => {
            if (typeof str !== 'string') return str;
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        };

        return `<!DOCTYPE html>
<html>
<head>
    <title>PitLane Ledger - QR Codes</title>
    <meta charset="UTF-8">
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
    <h1>PitLane Ledger QR Codes</h1>
    <div class="count no-print">Total Parts: ${parts.length}</div>
    <div style="text-align: center; margin-bottom: 20px;" class="no-print">
        <button onclick="window.print()" style="padding: 10px 20px; background: #00B8D9; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Labels</button>
    </div>
    <div class="qr-grid">
        ${parts.map(part => `
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
    };

    const handlePrintQROption = async (printAll) => {
        try {
            const resolver = appMode === 'DEMO' ? 'getDemoParts' : 'getProductionParts';
            const allParts = await invoke(resolver);

            if (!allParts || allParts.length === 0) {
                alert('No parts found in inventory');
                return;
            }

            let partsToPrint = allParts;
            if (!printAll && qrPrintStats.lastPrint) {
                // Print only new/changed parts since last print
                const lastPrintTime = new Date(qrPrintStats.lastPrint);
                partsToPrint = allParts.filter(part => {
                    const partUpdated = new Date(part.lastUpdated);
                    return partUpdated > lastPrintTime;
                });

                if (partsToPrint.length === 0) {
                    alert('No parts have been added or updated since last print');
                    return;
                }
            }

            const htmlContent = generateQRHTML(partsToPrint);
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pitlane-qr-codes-${printAll ? 'all' : 'delta'}-${new Date().toISOString().slice(0, 10)}.html`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);

            // Save print history
            localStorage.setItem('pitlane_qr_print_history', JSON.stringify({
                lastPrint: new Date().toISOString(),
                count: allParts.length
            }));

            setShowPrintQRModal(false);
            setLastAction(`QR Codes Generated (${partsToPrint.length} parts)`);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2500);
        } catch (error) {
            console.error('Failed to generate QR codes:', error);
            alert('Failed to generate QR codes');
        }
    };

    return (
        <div style={styles.container}>
            {/* Header Removed as per user request */}
            <div style={{ marginTop: 'var(--spacing-xl)' }} />

            <div style={styles.buttonContainer}>
                <button onClick={() => handleQuickLog('✅ Cleared for Race')} disabled={isLogging} style={{ ...styles.bigButton, ...styles.greenButton }}>
                    <CheckCircle size={48} />
                    <span style={styles.buttonText}>CLEAR FOR RACE</span>
                </button>

                <button onClick={() => handleQuickLog('⚠️ DAMAGED')} disabled={isLogging} style={{ ...styles.bigButton, ...styles.redButton }}>
                    <AlertTriangle size={48} />
                    <span style={styles.buttonText}>LOG DAMAGE</span>
                </button>

                <div style={styles.secondaryRow}>
                    <button onClick={() => setShowAddPartModal(true)} style={styles.secondaryButton}>
                        <Plus size={20} />
                        <span>Add New Part</span>
                    </button>
                    <button onClick={() => setShowPrintQRModal(true)} style={styles.secondaryButton}>
                        <QrCode size={20} />
                        <span>Print QR</span>
                    </button>
                </div>
            </div>

            {showAddPartModal && (
                <div style={{ ...styles.modalOverlay, zIndex: 2000 }}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>Add New Part</h3>
                            <button onClick={() => setShowAddPartModal(false)} style={styles.closeBtn}><X size={20} /></button>
                        </div>

                        <div style={styles.formSection}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>PART NAME</label>
                                <input
                                    style={styles.input}
                                    value={newPart.name}
                                    onChange={e => setNewPart({ ...newPart, name: e.target.value })}
                                    placeholder="e.g., Front Wing Spec B"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>SERIAL KEY</label>
                                <div style={styles.inputGroup}>
                                    <input
                                        style={styles.groupedInput}
                                        value={newPart.key}
                                        onChange={e => setNewPart({ ...newPart, key: e.target.value })}
                                        placeholder="PIT-XXX-001"
                                    />
                                    <button onClick={handleAutoGenerateKey} style={styles.groupedBtnLeft}>
                                        Auto
                                    </button>
                                    <button onClick={handleScanQR} style={styles.groupedBtnRight} title="Scan QR">
                                        <QrCode size={16} />
                                    </button>
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>LOCATION</label>
                                <select
                                    style={styles.input}
                                    value={newPart.location}
                                    onChange={e => setNewPart({ ...newPart, location: e.target.value })}
                                >
                                    <option>Garage 1</option>
                                    <option>Garage 2</option>
                                    <option>Spares</option>
                                    <option>Truck 1</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ margin: '16px 0', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <button
                                onClick={() => setExpandedFields(!expandedFields)}
                                style={{ background: 'transparent', border: 'none', color: '#22D3EE', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}
                            >
                                <span>Advanced Details</span>
                                <span>{expandedFields ? '−' : '+'}</span>
                            </button>

                            {expandedFields && (
                                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>ASSIGNMENT</label>
                                        <select
                                            style={styles.input}
                                            value={newPart.assignment || ''}
                                            onChange={e => setNewPart({ ...newPart, assignment: e.target.value })}
                                        >
                                            <option value="">Unassigned</option>
                                            <option value="Car 1">Car 1</option>
                                            <option value="Car 2">Car 2</option>
                                        </select>
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>INITIAL LIFE (%)</label>
                                        <input
                                            type="number"
                                            style={styles.input}
                                            value={newPart.life || 100}
                                            onChange={e => setNewPart({ ...newPart, life: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '24px' }}>
                            <button
                                onClick={handleAddPart}
                                disabled={isLogging}
                                style={{
                                    ...styles.primaryBtn,
                                    opacity: isLogging ? 0.6 : 1,
                                    cursor: isLogging ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isLogging ? 'Creating...' : 'Create Part'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPrintQRModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ margin: 0 }}>Print QR Codes</h3>
                            <button onClick={() => setShowPrintQRModal(false)} style={styles.closeBtn}><X size={20} /></button>
                        </div>
                        <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '16px' }}>
                            {qrPrintStats.lastPrint
                                ? `Last printed: ${new Date(qrPrintStats.lastPrint).toLocaleDateString()} (${qrPrintStats.lastCount} parts)`
                                : 'No previous print history'}
                        </p>
                        <button onClick={() => handlePrintQROption(true)} style={{ ...styles.primaryBtn, marginBottom: '12px' }}>
                            Print All QR Codes ({qrPrintStats.currentCount} parts)
                        </button>
                        {qrPrintStats.lastPrint && (
                            <button onClick={() => handlePrintQROption(false)} style={styles.secondaryBtn} disabled={qrPrintStats.currentCount <= qrPrintStats.lastCount}>
                                Print Since Last ({Math.max(0, qrPrintStats.currentCount - qrPrintStats.lastCount)} new)
                            </button>
                        )}
                    </div>
                </div>
            )}

            {showScanner && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ margin: 0 }}>Scan QR Code</h3>
                            <button onClick={() => setShowScanner(false)} style={styles.closeBtn}><X size={20} /></button>
                        </div>

                        {/* Nimiq video element (primary) */}
                        <video
                            ref={videoRef}
                            style={{
                                width: '100%',
                                minHeight: '300px',
                                background: '#000',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                display: scannerType === 'nimiq' || !scannerType ? 'block' : 'none'
                            }}
                        />

                        {/* html5-qrcode fallback container */}
                        <div
                            id="reader"
                            style={{
                                width: '100%',
                                minHeight: '300px',
                                background: '#000',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                display: scannerType === 'html5' ? 'block' : 'none'
                            }}
                        />

                        {/* Camera Controls */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px' }}>
                            <button onClick={handleFlipCamera} style={{ ...styles.secondaryBtn, padding: '8px 16px', fontSize: '12px' }}>
                                Flip Camera
                            </button>
                            <button onClick={handleToggleTorch} style={{ ...styles.secondaryBtn, padding: '8px 16px', fontSize: '12px', ...(torchOn && { background: 'rgba(245, 158, 11, 0.3)', borderColor: '#F59E0B' }) }}>
                                {torchOn ? 'Torch ON' : 'Torch'}
                            </button>
                        </div>

                        {!scanResult && (
                            <p style={{ textAlign: 'center', fontSize: '13px', color: '#94A3B8', marginTop: '12px' }}>
                                Point camera at a PitLane part QR or any product barcode
                            </p>
                        )}

                        {/* In-app error message */}
                        {scanError && (
                            <div style={{ textAlign: 'center', padding: '10px 16px', background: 'rgba(240, 68, 56, 0.15)', border: '1px solid rgba(240, 68, 56, 0.3)', borderRadius: '8px', marginTop: '12px', color: '#F04438', fontSize: '13px' }}>
                                ⚠️ {scanError}
                                <button onClick={() => setScanError(null)} style={{ marginLeft: '12px', background: 'transparent', border: 'none', color: '#F04438', cursor: 'pointer', fontSize: '16px' }}>×</button>
                            </div>
                        )}

                        {/* DEV ONLY: Upload/Paste QR for testing - REMOVE IN PRODUCTION */}
                        {!scanResult && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px dashed rgba(245, 158, 11, 0.3)' }}>
                                <label style={{ ...styles.secondaryBtn, padding: '8px 12px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    📁 Upload QR
                                    <input type="file" accept="image/*" onChange={handleUploadQR} style={{ display: 'none' }} />
                                </label>
                                <button
                                    onClick={async () => {
                                        try {
                                            const items = await navigator.clipboard.read();
                                            for (const item of items) {
                                                if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                                                    const blob = await item.getType(item.types.find(t => t.startsWith('image/')));
                                                    const file = new File([blob], 'clipboard.png', { type: blob.type });
                                                    handleUploadQR({ target: { files: [file] } });
                                                    return;
                                                }
                                            }
                                            setScanError('No image in clipboard. Copy an image first.');
                                        } catch (err) {
                                            setScanError('Clipboard not available. Try uploading instead.');
                                        }
                                    }}
                                    style={{ ...styles.secondaryBtn, padding: '8px 12px', fontSize: '11px' }}
                                >
                                    📋 Paste from Clipboard
                                </button>
                                <div id="reader-upload" style={{ display: 'none' }}></div>
                            </div>
                        )}

                        {scanResult && (
                            <div style={styles.scanResultCard}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                    <QrCode size={24} color="#00B8D9" />
                                    <div>
                                        <div style={{ color: '#94A3B8', fontSize: '11px', textTransform: 'uppercase' }}>
                                            DETECTED • {scanResult.format || 'QR CODE'}
                                        </div>
                                        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>{scanResult.text}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {scanResult.type === 'internal' && scanResult.exists && (
                                        <button onClick={() => handleActionFromScan('switch')} style={styles.primaryBtn}>
                                            Switch to Part
                                        </button>
                                    )}
                                    {scanResult.type === 'internal' && !scanResult.exists && (
                                        <button onClick={() => handleActionFromScan('add')} style={styles.primaryBtn}>
                                            Add New Part
                                        </button>
                                    )}
                                    {scanResult.type === 'external' && (
                                        <button onClick={() => handleActionFromScan('add')} style={styles.primaryBtn}>
                                            Create From Scan
                                        </button>
                                    )}
                                    <button onClick={handleDismissScan} style={styles.secondaryBtn}>
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={{
                ...styles.toast,
                transform: showSuccess ? 'translateY(0)' : 'translateY(100px)',
                opacity: showSuccess ? 1 : 0
            }}>
                <CheckCircle size={24} color="#00D084" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: '700' }}>Success</span>
                    <span style={{ fontSize: '13px', opacity: 0.8 }}>
                        {lastAction === 'Part Added' ? 'New part added to inventory' :
                            lastAction === 'QR Sent to Printer' ? 'QR Code sent to local printer' :
                                'Event logged successfully'}
                    </span>
                </div>
            </div>

            <button onClick={() => setShowScanner(true)} style={styles.returnButton}>
                <QrCode size={16} />
                <span>Scan QR Code</span>
            </button>
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)', padding: 'var(--spacing-lg)' },
    buttonContainer: { flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' },
    bigButton: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-md)', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: '24px', fontWeight: '700', cursor: 'pointer', minHeight: '150px', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'transform 0.1s' },
    greenButton: { backgroundColor: 'rgba(0, 208, 132, 0.1)', color: '#00D084', border: '2px solid #00D084' },
    redButton: { backgroundColor: 'rgba(240, 68, 56, 0.1)', color: '#F04438', border: '2px solid #F04438' },
    secondaryRow: { display: 'flex', gap: '16px' },
    secondaryButton: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', backgroundColor: '#151B2E', color: '#00B8D9', border: '1px solid #00B8D9', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    buttonText: { fontSize: '20px', fontWeight: '700' },
    toast: {
        position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: '#151B2E', border: '1px solid #00D084', borderRadius: '50px',
        padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)', zIndex: 2000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        color: '#FFFFFF', fontWeight: '600'
    },
    returnButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-md)', backgroundColor: 'transparent', color: 'var(--color-accent-cyan)', border: '2px solid var(--color-accent-cyan)', borderRadius: 'var(--radius-sm)', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 },
    modal: { backgroundColor: '#151B2E', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid #2D3748' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', color: 'white' },
    closeBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #2D3748', backgroundColor: '#0A0E1A', color: 'white', fontSize: '14px' },
    primaryBtn: { width: '100%', padding: '14px', backgroundColor: '#22D3EE', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' },
    secondaryBtn: { width: '100%', padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#22D3EE', fontWeight: '600', border: '1px solid #2D3748', borderRadius: '8px', cursor: 'pointer' },
    label: { display: 'block', color: '#94A3B8', fontSize: '11px', fontWeight: '600', marginBottom: '6px', letterSpacing: '0.05em' },
    formGroup: { marginBottom: '16px' },

    // New Input Group Styles
    inputGroup: { display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2D3748' },
    groupedInput: { flex: 1, padding: '12px', border: 'none', backgroundColor: '#0A0E1A', color: 'white', fontSize: '14px', borderRadius: 0 },
    groupedBtnLeft: { padding: '0 16px', background: 'rgba(34, 211, 238, 0.1)', color: '#22D3EE', border: 'none', borderLeft: '1px solid #2D3748', cursor: 'pointer', fontWeight: 600, fontSize: '13px' },
    groupedBtnRight: { padding: '0 16px', background: 'rgba(34, 211, 238, 0.1)', color: '#22D3EE', border: 'none', borderLeft: '1px solid #2D3748', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    scanResultCard: { marginTop: '16px', padding: '16px', background: 'rgba(34, 211, 238, 0.1)', border: '1px solid #00B8D9', borderRadius: '8px', animation: 'fadeIn 0.2s ease' }
};

export default MobileControls;
