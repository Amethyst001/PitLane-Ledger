import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@forge/bridge';
import { CheckCircle, AlertTriangle, ArrowLeft, Plus, QrCode, X, List, Trash2, Wrench, ClipboardList } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import QrScanner from 'qr-scanner'; // Nimiq - primary scanner with WebWorker
import PitCrewTasks from './PitCrewTasks';
import logo from '../pitlane.png';

const MobileControls = ({ issueId, onReturn, onEventLogged, appMode, initialView, onScanSwitch, allParts, driverNames }) => {
    const [isLogging, setIsLogging] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastAction, setLastAction] = useState('');
    const [showAddPartModal, setShowAddPartModal] = useState(initialView === 'add');
    const [showPrintQRModal, setShowPrintQRModal] = useState(initialView === 'print');
    const [showPartsListModal, setShowPartsListModal] = useState(false); // Browse parts list
    const [showPitCrewTasks, setShowPitCrewTasks] = useState(initialView === 'tasks'); // Pit crew tasks
    const [newPart, setNewPart] = useState({ name: '', key: '', assignment: 'Spares' });
    const [qrPrintStats, setQRPrintStats] = useState({ lastPrint: null, lastCount: 0, currentCount: 0 });
    const [expandedFields, setExpandedFields] = useState(false); // Toggle for extra fields
    const [internalParts, setInternalParts] = useState([]); // Fallback if allParts prop is missing
    const [internalDriverNames, setInternalDriverNames] = useState({ car1: 'Driver 1', car2: 'Driver 2' });

    // Floating error message (bottom of screen, modern style)
    const [floatingError, setFloatingError] = useState(null);

    // Undo toast state
    const [undoToast, setUndoToast] = useState(null); // { issueId, previousStatus, countdown }
    const undoTimeoutRef = useRef(null);

    // Confirmation dialog for duplicate status
    const [confirmAction, setConfirmAction] = useState(null); // { status, message }

    // Load Data (QR history + Parts + DriverNames) on mount
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

                // Driver Names (from fleet config OR fallback)
                if (!driverNames) {
                    const fleetConfig = await invoke('getFleetConfig', { key: 'getFleetConfig' });
                    if (fleetConfig && fleetConfig.car1 && fleetConfig.car1 !== 'Car 1') {
                        setInternalDriverNames({ car1: fleetConfig.car1, car2: fleetConfig.car2 });
                    } else if (appMode === 'DEMO') {
                        setInternalDriverNames({ car1: 'Alex Albon', car2: 'Carlos Sainz' });
                    }
                }
            } catch (error) {
                console.error('Failed to load mobile data:', error);
            }
        };
        loadData();
    }, [appMode, driverNames]);

    const handleQuickLog = async (status) => {
        setIsLogging(true);
        setFloatingError(null); // Clear any previous error

        // --- WORKFLOW VALIDATION ---
        // Get current part info for validation
        const partsList = allParts || internalParts;
        const currentPart = issueId ? partsList.find(p => p.key === issueId || p.id === issueId) : null;
        const currentStatus = currentPart?.pitlaneStatus?.toLowerCase() || '';
        const previousStatus = currentPart?.pitlaneStatus || '🏁 Trackside'; // Save for undo

        // Validate "Clear for Race"
        if (status.includes('Cleared for Race') || status.includes('Clear for Race')) {
            // Block if part is damaged
            if (currentStatus.includes('damage') || currentStatus.includes('quarantine') || currentStatus.includes('repair')) {
                setFloatingError('Cannot clear a DAMAGED part for race. Please repair first.');
                setIsLogging(false);
                return;
            }
            // Block if part is not trackside
            if (!currentStatus.includes('trackside') && !currentStatus.includes('garage') && !currentStatus.includes('ready') && !currentStatus.includes('cleared')) {
                setFloatingError(`Part is not trackside (Status: ${currentPart?.pitlaneStatus}). Cannot clear for race.`);
                setIsLogging(false);
                return;
            }
            // Block if already cleared
            if (currentStatus.includes('cleared') && currentStatus.includes('race')) {
                setFloatingError('Part already cleared for race.');
                setIsLogging(false);
                return;
            }
        }

        // No validation for Log Damage - anything can be damaged

        // Check for duplicate/similar status - ask for confirmation
        const newStatusLower = status.toLowerCase();
        const isSimilarStatus = (
            (newStatusLower.includes('damage') && currentStatus.includes('damage')) ||
            (newStatusLower.includes('maintenance') && currentStatus.includes('maintenance')) ||
            (newStatusLower.includes('repair') && currentStatus.includes('repair')) ||
            (newStatusLower.includes('transit') && currentStatus.includes('transit')) ||
            (newStatusLower.includes('quarantine') && currentStatus.includes('quarantine')) ||
            (newStatusLower.includes('retired') && currentStatus.includes('retired'))
        );

        if (isSimilarStatus && !confirmAction) {
            // Get friendly status name
            const friendlyStatus = currentPart?.pitlaneStatus || 'this status';
            setConfirmAction({
                status,
                message: `Part is already "${friendlyStatus}". Do you want to proceed?`
            });
            setIsLogging(false);
            return;
        }

        try {
            await invoke('logEvent', {
                key: 'logEvent',
                issueId,
                status,
                note: `Quick log from pit crew mobile at ${new Date().toLocaleTimeString()}`,
                appMode
            });

            // DEMO MODE: Sync changes to sessionStorage to persist within session
            if (appMode === 'DEMO') {
                const cachedParts = sessionStorage.getItem('pitlane_demo_parts');
                if (cachedParts) {
                    const parts = JSON.parse(cachedParts);
                    const updatedParts = parts.map(p =>
                        p.key === issueId ? { ...p, pitlaneStatus: status, lastUpdated: new Date().toISOString() } : p
                    );
                    sessionStorage.setItem('pitlane_demo_parts', JSON.stringify(updatedParts));
                    console.log('[MobileControls] DEMO: Synced updated parts to session');

                    // Dispatch event for Dashboard to update its local state
                    window.dispatchEvent(new CustomEvent('pitlane:demo-parts-updated', {
                        detail: { parts: updatedParts }
                    }));
                }
            }

            setLastAction(status);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2500);

            // Show Undo toast for DAMAGED status (5-second countdown)
            if (status.toLowerCase().includes('damage')) {
                // Clear any existing undo timeout
                if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

                setUndoToast({
                    issueId,
                    previousStatus,
                    partKey: currentPart?.key || issueId,
                    countdown: 5
                });

                // Start countdown
                let count = 5;
                const countdownInterval = setInterval(() => {
                    count--;
                    if (count <= 0) {
                        clearInterval(countdownInterval);
                        setUndoToast(null);
                    } else {
                        setUndoToast(prev => prev ? { ...prev, countdown: count } : null);
                    }
                }, 1000);

                undoTimeoutRef.current = setTimeout(() => {
                    clearInterval(countdownInterval);
                    setUndoToast(null);
                }, 5000);
            }

            // Only trigger backend refresh for PROD mode
            if (onEventLogged && appMode !== 'DEMO') onEventLogged();
        } catch (error) {
            console.error('Error logging event:', error);
            setFloatingError('Failed to log event. Please try again.');
        } finally {
            setIsLogging(false);
        }
    };

    // Handle Undo action
    const handleUndo = async () => {
        if (!undoToast) return;

        const { issueId: undoIssueId, previousStatus, partKey } = undoToast;

        // Clear the undo toast
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        setUndoToast(null);

        // Revert to previous status
        try {
            await invoke('logEvent', {
                key: 'logEvent',
                issueId: undoIssueId,
                status: previousStatus,
                note: `Undo: Reverted from DAMAGED at ${new Date().toLocaleTimeString()}`,
                appMode
            });

            // DEMO MODE: Sync undo to sessionStorage
            if (appMode === 'DEMO') {
                const cachedParts = sessionStorage.getItem('pitlane_demo_parts');
                if (cachedParts) {
                    const parts = JSON.parse(cachedParts);
                    const updatedParts = parts.map(p =>
                        p.key === undoIssueId ? { ...p, pitlaneStatus: previousStatus, lastUpdated: new Date().toISOString() } : p
                    );
                    sessionStorage.setItem('pitlane_demo_parts', JSON.stringify(updatedParts));
                    window.dispatchEvent(new CustomEvent('pitlane:demo-parts-updated', {
                        detail: { parts: updatedParts }
                    }));
                }
            }

            setLastAction(`Undone - Reverted to ${previousStatus}`);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2500);

            if (onEventLogged && appMode !== 'DEMO') onEventLogged();
        } catch (error) {
            console.error('Undo failed:', error);
            setFloatingError('Failed to undo. Please try again.');
        }
    };

    // Quick log from scan result - uses the scanned part key directly
    const handleQuickLogFromScan = async (partKey, status) => {
        // Set issueId temporarily for the log
        const partsList = allParts || internalParts;
        const part = partsList.find(p => p.key === partKey);

        if (!part) {
            setFloatingError(`Part ${partKey} not found in inventory.`);
            return;
        }

        // Close scanner and log the event
        setShowScanner(false);
        setScanResult(null);

        // Use the handleQuickLog logic but with explicit issueId
        setIsLogging(true);
        setFloatingError(null);

        const currentStatus = (part.pitlaneStatus || '').toLowerCase();
        const previousStatus = part.pitlaneStatus || '🏁 Trackside';

        // Validate Clear for Race
        if (status.includes('Cleared for Race')) {
            if (currentStatus.includes('damage') || currentStatus.includes('quarantine') || currentStatus.includes('repair')) {
                setFloatingError('Cannot clear a DAMAGED part for race. Please repair first.');
                setIsLogging(false);
                return;
            }
            if (!currentStatus.includes('trackside') && !currentStatus.includes('garage') && !currentStatus.includes('ready') && !currentStatus.includes('cleared')) {
                setFloatingError(`Part is not trackside (Status: ${part.pitlaneStatus}). Cannot clear for race.`);
                setIsLogging(false);
                return;
            }
            if (currentStatus.includes('cleared') && currentStatus.includes('race')) {
                setFloatingError('Part already cleared for race.');
                setIsLogging(false);
                return;
            }
        }

        try {
            await invoke('logEvent', {
                key: 'logEvent',
                issueId: partKey,
                status,
                note: `Quick log from QR scan at ${new Date().toLocaleTimeString()}`,
                appMode
            });

            // DEMO MODE: Sync to sessionStorage
            if (appMode === 'DEMO') {
                const cachedParts = sessionStorage.getItem('pitlane_demo_parts');
                if (cachedParts) {
                    const parts = JSON.parse(cachedParts);
                    const updatedParts = parts.map(p =>
                        p.key === partKey ? { ...p, pitlaneStatus: status, lastUpdated: new Date().toISOString() } : p
                    );
                    sessionStorage.setItem('pitlane_demo_parts', JSON.stringify(updatedParts));
                    window.dispatchEvent(new CustomEvent('pitlane:demo-parts-updated', {
                        detail: { parts: updatedParts }
                    }));
                }
            }

            setLastAction(status);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2500);

            // Show Undo toast for DAMAGED
            if (status.toLowerCase().includes('damage')) {
                if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
                setUndoToast({ issueId: partKey, previousStatus, partKey, countdown: 5 });
                let count = 5;
                const countdownInterval = setInterval(() => {
                    count--;
                    if (count <= 0) {
                        clearInterval(countdownInterval);
                        setUndoToast(null);
                    } else {
                        setUndoToast(prev => prev ? { ...prev, countdown: count } : null);
                    }
                }, 1000);
                undoTimeoutRef.current = setTimeout(() => {
                    clearInterval(countdownInterval);
                    setUndoToast(null);
                }, 5000);
            }

            if (onEventLogged && appMode !== 'DEMO') onEventLogged();
        } catch (error) {
            console.error('Error logging from scan:', error);
            setFloatingError('Failed to log event. Please try again.');
        } finally {
            setIsLogging(false);
        }
    };

    const handleAutoGenerateKey = () => {
        const type = newPart.name.split(' ')[0].toUpperCase().substring(0, 3) || 'PRT';
        const random = Math.floor(Math.random() * 900) + 100;
        setNewPart(prev => ({ ...prev, key: `PIT-${type}-${random}` }));
    };

    // Scanner defaults to CLOSED - only open when user explicitly requests via Scan QR button
    const [showScanner, setShowScanner] = useState(initialView === 'scan');
    const [scanResult, setScanResult] = useState(null);
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
    const [torchOn, setTorchOn] = useState(false);
    const [scanHistory, setScanHistory] = useState([]); // Recent scans
    const [scanError, setScanError] = useState(null); // In-app error messages
    const isPausedRef = useRef(false);
    const scannerRef = useRef(null);

    // Initialize QR Scanner (Nimiq primary, html5-qrcode fallback)
    const videoRef = useRef(null);
    const mediaStreamRef = useRef(null); // Track actual MediaStream for cleanup
    const scannerTypeRef = useRef(null); // Use ref to avoid stale closure
    const [scannerType, setScannerType] = useState(null); // For UI display only

    // Immediate camera release function - stops ALL camera resources
    const stopCamera = () => {
        console.log('[Scanner] Stopping camera immediately');

        // 1. Stop the scanner library
        if (scannerRef.current) {
            try {
                if (scannerTypeRef.current === 'nimiq') {
                    scannerRef.current.destroy();
                } else if (scannerRef.current.isScanning) {
                    scannerRef.current.stop();
                }
            } catch (e) {
                console.warn('[Scanner] Library cleanup error:', e);
            }
            scannerRef.current = null;
            scannerTypeRef.current = null;
        }

        // 2. Force stop video element tracks directly (belt and suspenders)
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => {
                track.stop();
                console.log('[Scanner] Stopped video element track:', track.kind);
            });
            videoRef.current.srcObject = null;
        }

        // 3. Stop tracked MediaStream directly (most reliable)
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('[Scanner] Stopped MediaStream track:', track.label);
            });
            mediaStreamRef.current = null;
        }

        setScannerType(null);
    };

    // AGGRESSIVE camera release whenever tab loses focus or page unloads
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log('[Scanner] Tab hidden - stopping camera');
                stopCamera();
                setShowScanner(false); // Also close the modal
            }
        };

        const handleBeforeUnload = () => {
            console.log('[Scanner] Page unloading - stopping camera');
            stopCamera();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            stopCamera(); // Cleanup on unmount
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);
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

                    // Capture MediaStream for reliable cleanup
                    if (videoRef.current && videoRef.current.srcObject) {
                        mediaStreamRef.current = videoRef.current.srcObject;
                    }

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

    const handleScanSuccess = async (decodedText, scanner, decodedResult) => {
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

            // ALWAYS fetch fresh parts list to ensure accurate existence check
            let partsList = allParts || internalParts;
            try {
                const freshParts = await invoke(appMode === 'DEMO' ? 'getDemoParts' : 'getProductionParts', { key: appMode === 'DEMO' ? 'getDemoParts' : 'getProductionParts' });
                if (freshParts && freshParts.length > 0) {
                    partsList = freshParts;
                    setInternalParts(freshParts); // Update internal state
                }
            } catch (e) {
                console.warn('[Scanner] Could not refresh parts list:', e);
            }

            const existingPart = partsList && partsList.find(p => p.key === targetKey);
            const exists = !!existingPart;

            setScanResult({
                type: 'internal',
                text: targetKey,
                exists: exists,
                format: formatDisplay,
                partInfo: existingPart || null
            });
        } else {
            setScanResult({ type: 'external', text: decodedText, format: formatDisplay, partInfo: null });
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
        try {
            // Method 1: Nimiq scanner (preferred)
            if (scannerTypeRef.current === 'nimiq' && scannerRef.current) {
                const hasFlash = await scannerRef.current.hasFlash();
                if (hasFlash) {
                    await scannerRef.current.toggleFlash();
                    setTorchOn(!torchOn);
                    return;
                }
            }

            // Method 2: Direct MediaStream track
            if (mediaStreamRef.current) {
                const track = mediaStreamRef.current.getVideoTracks()[0];
                const capabilities = track.getCapabilities?.();
                if (capabilities?.torch) {
                    await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
                    setTorchOn(!torchOn);
                    return;
                }
            }

            // Method 3: html5-qrcode API
            if (scannerTypeRef.current === 'html5' && scannerRef.current) {
                const caps = scannerRef.current.getRunningTrackCameraCapabilities?.();
                if (caps?.torchFeature?.()?.isSupported?.()) {
                    await caps.torchFeature().apply(!torchOn);
                    setTorchOn(!torchOn);
                    return;
                }
            }

            // No torch available
            setScanError('Flashlight not available on this device or camera.');
        } catch (err) {
            console.warn('[Scanner] Torch toggle failed:', err);
            setScanError('Unable to toggle flashlight: ' + err.message);
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

    // Execute pit crew task (when crew completes checklist)
    const executePitCrewTask = async (actionData) => {
        if (!actionData) return;

        console.log('[MobileControls] Executing pit crew task:', actionData);

        if (actionData.type === 'swap') {
            try {
                setIsLogging(true);

                // 1. Retire the damaged part
                await invoke('logEvent', {
                    issueId: actionData.damagedPartKey,
                    status: 'RETIRED',
                    notes: `Retired by Pit Crew: Swapped with ${actionData.sparePartKey}`,
                    location: 'Quarantine'
                });

                // 2. Assign spare to the car
                await invoke('logEvent', {
                    issueId: actionData.sparePartKey,
                    status: '🏁 Trackside',
                    notes: `Installed by Pit Crew: Replaced ${actionData.damagedPartKey}`,
                    assignment: actionData.spareAssignment
                });

                // 3. Update local state for DEMO mode
                if (appMode === 'DEMO') {
                    const parts = allParts || internalParts;
                    const updatedParts = parts.map(p => {
                        if (p.key === actionData.damagedPartKey) {
                            return { ...p, pitlaneStatus: 'RETIRED', location: 'Quarantine', assignment: 'None' };
                        }
                        if (p.key === actionData.sparePartKey) {
                            return { ...p, pitlaneStatus: '🏁 Trackside', assignment: actionData.spareAssignment };
                        }
                        return p;
                    });
                    sessionStorage.setItem('pitlane_demo_parts', JSON.stringify(updatedParts));
                    window.dispatchEvent(new CustomEvent('pitlane:demo-parts-updated', { detail: { parts: updatedParts } }));
                }

                setLastAction('Swap Completed');
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2500);

                console.log('[MobileControls] Pit crew task completed:', actionData.damagedPartKey, '→', actionData.sparePartKey);
            } catch (error) {
                console.error('[MobileControls] Pit crew task failed:', error);
            } finally {
                setIsLogging(false);
            }
        }
    };

    return (
        <div style={styles.container}>
            {/* Header with Logo and Task Button */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                marginBottom: '16px',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={logo} alt="PitLane" style={{ height: '28px', width: 'auto' }} />
                    <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#64748B',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        Pit Crew
                    </span>
                </div>
                <button
                    onClick={() => setShowPitCrewTasks(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 14px',
                        background: 'rgba(0, 184, 217, 0.1)',
                        border: '1px solid rgba(0, 184, 217, 0.3)',
                        borderRadius: '8px',
                        color: '#00B8D9',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    <ClipboardList size={18} />
                    <span>Tasks</span>
                </button>
            </header>

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
                    <button onClick={() => handleQuickLog('📦 RETIRED')} disabled={isLogging} style={{ ...styles.secondaryButton, color: '#64748B', borderColor: 'rgba(100, 116, 139, 0.3)' }}>
                        <Trash2 size={20} />
                        <span>Retire</span>
                    </button>
                </div>

                {/* Browse Inventory - Navigate to PartDetails view */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        console.log('[PitMobile] Browse Inventory clicked', { onScanSwitch, allParts, internalParts });
                        if (onScanSwitch) {
                            const parts = allParts || internalParts;
                            const targetKey = parts.length > 0 ? parts[0].key : 'BROWSE';
                            console.log('[PitMobile] Navigating to:', targetKey);
                            onScanSwitch(targetKey);
                        } else {
                            console.warn('[PitMobile] onScanSwitch not provided');
                            alert('Browse Inventory requires navigating back to main view first.');
                        }
                    }}
                    style={{ ...styles.secondaryButton, width: '100%', marginTop: 'var(--spacing-md)' }}
                >
                    <List size={20} />
                    <span>Browse Inventory</span>
                </button>
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
                                <label style={styles.label}>ASSIGNMENT</label>
                                <select
                                    style={styles.input}
                                    value={newPart.assignment || 'Spares'}
                                    onChange={e => setNewPart({ ...newPart, assignment: e.target.value })}
                                >
                                    <option value="Spares">Spares</option>
                                    <option value={`Car 1 (${(driverNames || internalDriverNames)?.car1?.split(' ').pop() || 'Driver 1'})`}>
                                        Car 1 ({(driverNames || internalDriverNames)?.car1?.split(' ').pop() || 'Driver 1'})
                                    </option>
                                    <option value={`Car 2 (${(driverNames || internalDriverNames)?.car2?.split(' ').pop() || 'Driver 2'})`}>
                                        Car 2 ({(driverNames || internalDriverNames)?.car2?.split(' ').pop() || 'Driver 2'})
                                    </option>
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


                        {scanResult && (
                            <div style={styles.scanResultCard}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                    <QrCode size={24} color="#00B8D9" />
                                    <div>
                                        <div style={{ color: '#94A3B8', fontSize: '11px', textTransform: 'uppercase' }}>
                                            DETECTED • {scanResult.format || 'QR CODE'}
                                        </div>
                                        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>{scanResult.text}</div>
                                        {scanResult.partInfo && (
                                            <div style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}>
                                                Current: {scanResult.partInfo.pitlaneStatus?.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '').trim()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Smart Actions - Primary quick actions */}
                                {scanResult.type === 'internal' && scanResult.exists && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Quick Actions</div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => {
                                                    handleQuickLogFromScan(scanResult.text, '✅ Cleared for Race');
                                                }}
                                                style={{ ...styles.primaryBtn, flex: 1, background: 'rgba(0, 208, 132, 0.15)', color: '#00D084', border: '1px solid rgba(0, 208, 132, 0.3)' }}
                                            >
                                                <CheckCircle size={16} /> Clear for Race
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleQuickLogFromScan(scanResult.text, '⚠️ DAMAGED');
                                                }}
                                                style={{ ...styles.primaryBtn, flex: 1, background: 'rgba(240, 68, 56, 0.15)', color: '#F04438', border: '1px solid rgba(240, 68, 56, 0.3)' }}
                                            >
                                                <AlertTriangle size={16} /> Log Damage
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {scanResult.type === 'internal' && scanResult.exists && (
                                        <button onClick={() => handleActionFromScan('switch')} style={styles.secondaryBtn}>
                                            More Options
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
                                lastAction.includes('DAMAGED') ? `Logged DAMAGED status for ${issueId}` :
                                    lastAction.includes('Cleared') ? `Logged Cleared for Race status for ${issueId}` :
                                        lastAction.includes('Undone') ? lastAction :
                                            `Logged ${lastAction.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '').trim()} status`}
                    </span>
                </div>
            </div>

            <button onClick={() => setShowScanner(true)} style={styles.returnButton}>
                <QrCode size={16} />
                <span>Scan QR Code</span>
            </button>

            {/* Floating Error Message - Bottom of Screen (Modern Style) */}
            {floatingError && (
                <div style={{
                    position: 'fixed',
                    bottom: '100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(240, 68, 56, 0.95)',
                    color: 'white',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(240, 68, 56, 0.4)',
                    zIndex: 9999,
                    fontSize: '14px',
                    fontWeight: 600,
                    maxWidth: '90%',
                    textAlign: 'center',
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    {floatingError}
                    <button
                        onClick={() => setFloatingError(null)}
                        style={{
                            marginLeft: '16px',
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                        }}
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Undo Toast - Shows after DAMAGED status with countdown */}
            {undoToast && (
                <div style={{
                    position: 'fixed',
                    bottom: '100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(30, 41, 59, 0.98)',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    minWidth: '300px'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>
                            Logged DAMAGED status for {undoToast.partKey}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                            Disappears in {undoToast.countdown}s
                        </div>
                    </div>
                    <button
                        onClick={handleUndo}
                        style={{
                            background: 'rgba(0, 184, 217, 0.2)',
                            border: '1px solid rgba(0, 184, 217, 0.4)',
                            color: '#00B8D9',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '13px'
                        }}
                    >
                        UNDO
                    </button>
                </div>
            )}

            {/* Pit Crew Tasks Modal */}
            {showPitCrewTasks && (
                <PitCrewTasks
                    isOpen={showPitCrewTasks}
                    onClose={() => setShowPitCrewTasks(false)}
                    onExecuteTask={executePitCrewTask}
                    appMode={appMode}
                />
            )}

            {/* Duplicate Status Confirmation Dialog */}
            {confirmAction && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 3000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'var(--glass-bg, rgba(15, 23, 42, 0.95))',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '16px',
                        padding: '24px',
                        maxWidth: '360px',
                        textAlign: 'center'
                    }}>
                        <AlertTriangle size={40} color="#F59E0B" style={{ marginBottom: '16px' }} />
                        <p style={{
                            fontSize: '15px',
                            color: '#fff',
                            margin: '0 0 20px',
                            lineHeight: 1.5
                        }}>
                            {confirmAction.message}
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setConfirmAction(null)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    color: '#94A3B8',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const statusToLog = confirmAction.status;
                                    setConfirmAction(null);
                                    // Re-trigger with confirmation flag implicitly (confirmAction will be null)
                                    handleQuickLog(statusToLog);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#F59E0B',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#0A0E1A',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
