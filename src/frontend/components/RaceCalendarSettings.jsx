import React, { useState, useRef } from 'react';
import { invoke } from '@forge/bridge';
import { Save, X, Plus, Trash2, Calendar } from 'lucide-react';

const RaceCalendarSettings = ({ onClose, onSave, initialRaces }) => {
    const [races, setRaces] = useState(initialRaces && initialRaces.length > 0 ? initialRaces : [
        { name: 'Bahrain GP', date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }, // ~3 months out
        { name: 'Saudi Arabian GP', date: new Date(Date.now() + 97 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { name: 'Australian GP', date: new Date(Date.now() + 111 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
    ]);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const scrollAreaRef = useRef(null);

    const handleAddRace = () => {
        setRaces([...races, { name: '', date: '' }]);
        // Auto-scroll to bottom after adding
        setTimeout(() => {
            if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
            }
        }, 50);
    };

    const handleRemoveRace = (index) => {
        const newRaces = [...races];
        newRaces.splice(index, 1);
        setRaces(newRaces);
    };

    const handleChange = (index, field, value) => {
        const newRaces = [...races];
        newRaces[index][field] = value;
        setRaces(newRaces);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            // Validate: Check for incomplete entries
            const incompleteRace = races.find(r => !r.name.trim() || !r.date);
            if (incompleteRace) {
                throw new Error("All races must have both a name and a date.");
            }

            const validRaces = races;
            if (validRaces.length === 0) throw new Error("At least one race is required");

            // Calculate daysAway for each
            const processed = validRaces.map(r => {
                const date = new Date(r.date);
                const today = new Date();
                // Reset time part for accurate day calculation
                today.setHours(0, 0, 0, 0);
                date.setHours(0, 0, 0, 0);

                const daysAway = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
                return { ...r, daysAway };
            }).filter(r => r.daysAway >= 0); // Only keep future or today's races

            console.log('[RaceCalendarSettings] Saving calendar:', processed);
            const result = await invoke('setRaceCalendar', { key: 'setRaceCalendar', calendar: processed });
            console.log('[RaceCalendarSettings] Save result:', result);
            onSave(processed);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h3 style={styles.title}>Race Calendar</h3>
                    <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
                </div>

                <div style={styles.content}>
                    <div style={styles.scrollArea} ref={scrollAreaRef}>
                        {races.map((race, idx) => (
                            <div key={idx} style={styles.row}>
                                <div style={styles.rowNumber}>{idx + 1}</div>
                                <input
                                    style={styles.input}
                                    placeholder="Race name (e.g. Monaco GP)"
                                    value={race.name}
                                    onChange={(e) => handleChange(idx, 'name', e.target.value)}
                                />
                                <input
                                    type="date"
                                    style={styles.dateInput}
                                    value={race.date}
                                    onChange={(e) => handleChange(idx, 'date', e.target.value)}
                                />
                                <button onClick={() => handleRemoveRace(idx)} style={styles.deleteBtn}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button onClick={handleAddRace} style={styles.addBtn}>
                        <Plus size={16} />
                        Add Race
                    </button>

                    {error && <div style={styles.error}>{error}</div>}
                </div>

                <div style={styles.footer}>
                    <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
                    <button onClick={handleSave} style={styles.saveBtn} disabled={saving}>
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(10, 14, 26, 0.8)', backdropFilter: 'blur(4px)',
        zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    modal: {
        width: '600px', maxWidth: '90%',
        backgroundColor: '#151B2E', border: '1px solid var(--color-border-subtle)',
        borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', maxHeight: '80vh'
    },
    header: {
        padding: '20px', borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    title: { margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' },
    closeBtn: { background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' },
    content: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' },
    listHeader: { display: 'flex', gap: '12px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' },
    scrollArea: { overflowY: 'auto', maxHeight: '300px', display: 'flex', flexDirection: 'column', gap: '8px' },
    row: { display: 'flex', gap: '12px', alignItems: 'center' },
    rowNumber: {
        width: '24px', height: '24px', borderRadius: '50%',
        background: 'rgba(0, 184, 217, 0.15)', color: '#00B8D9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: 600, flexShrink: 0
    },
    input: {
        flex: 2, background: '#0A0E1A', border: '1px solid var(--color-border-subtle)',
        color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', outline: 'none'
    },
    dateInput: {
        flex: 1, background: '#0A0E1A', border: '1px solid var(--color-border-subtle)',
        color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', outline: 'none',
        colorScheme: 'dark'
    },
    deleteBtn: {
        background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444',
        width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
    },
    addBtn: {
        background: 'rgba(0, 184, 217, 0.1)', border: '1px dashed rgba(0, 184, 217, 0.3)',
        color: '#00B8D9', padding: '10px', borderRadius: '8px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        fontSize: '13px', fontWeight: 600, marginTop: '8px', transition: 'all 0.2s'
    },
    footer: {
        padding: '20px', borderTop: '1px solid var(--color-border-subtle)',
        display: 'flex', justifyContent: 'space-between', gap: '12px', background: 'rgba(0,0,0,0.2)'
    },
    error: {
        color: '#EF4444', fontSize: '13px', marginTop: '10px', padding: '10px',
        background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', textAlign: 'center'
    },
    cancelBtn: {
        background: 'transparent', border: '1px solid var(--color-border-subtle)',
        color: 'var(--color-text-secondary)', padding: '10px 20px', borderRadius: '8px',
        cursor: 'pointer', fontWeight: 600
    },
    saveBtn: {
        background: 'var(--color-accent-cyan)', border: 'none',
        color: '#000', padding: '10px 20px', borderRadius: '8px',
        cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
    }
};

export default RaceCalendarSettings;
