import React, { useState } from 'react';
import { invoke } from '@forge/bridge';
import { Save, X, Plus, Trash2, Calendar } from 'lucide-react';

const RaceCalendarSettings = ({ onClose, onSave }) => {
    const [races, setRaces] = useState([
        { name: 'Bahrain GP', date: '2025-02-28' },
        { name: 'Saudi Arabian GP', date: '2025-03-08' },
        { name: 'Australian GP', date: '2025-03-22' }
    ]);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const handleAddRace = () => {
        setRaces([...races, { name: '', date: '' }]);
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
            // Validate
            const validRaces = races.filter(r => r.name && r.date);
            if (validRaces.length === 0) throw new Error("At least one valid race is required");

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

            await invoke('setRaceCalendar', { calendar: processed });
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
                    <h3 style={styles.title}>Race Calendar Settings</h3>
                    <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
                </div>

                <div style={styles.content}>
                    <div style={styles.listHeader}>
                        <span style={{ flex: 2 }}>Race Name</span>
                        <span style={{ flex: 1 }}>Date</span>
                        <span style={{ width: '30px' }}></span>
                    </div>

                    <div style={styles.scrollArea}>
                        {races.map((race, idx) => (
                            <div key={idx} style={styles.row}>
                                <input
                                    style={styles.input}
                                    placeholder="e.g. Monaco GP"
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
                                    <Trash2 size={16} />
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
                        {saving ? 'Saving...' : 'Save Calendar'}
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
    input: {
        flex: 2, background: '#0A0E1A', border: '1px solid var(--color-border-subtle)',
        display: 'flex', justifyContent: 'flex-end', gap: '12px'
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
