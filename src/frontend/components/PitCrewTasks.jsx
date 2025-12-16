import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Circle, AlertTriangle, Wrench, ChevronDown, ChevronUp } from 'lucide-react';

const PitCrewTasks = ({ isOpen, onClose, onExecuteTask, appMode }) => {
    const [tasks, setTasks] = useState([]);
    const [expandedTask, setExpandedTask] = useState(null);
    const [showConfirm, setShowConfirm] = useState(null);

    // Load tasks from sessionStorage
    useEffect(() => {
        const loadTasks = () => {
            const stored = sessionStorage.getItem('pitlane_pit_crew_tasks');
            if (stored) {
                setTasks(JSON.parse(stored));
            }
        };
        loadTasks();

        // Listen for new tasks
        const handleNewTask = (e) => {
            if (e.detail?.task) {
                setTasks(prev => {
                    const updated = [...prev, e.detail.task];
                    sessionStorage.setItem('pitlane_pit_crew_tasks', JSON.stringify(updated));
                    return updated;
                });
            }
        };
        window.addEventListener('pitlane:pit-crew-task-added', handleNewTask);
        return () => window.removeEventListener('pitlane:pit-crew-task-added', handleNewTask);
    }, []);

    // Toggle checklist item
    const toggleChecklistItem = (taskId, itemIndex) => {
        setTasks(prev => {
            const updated = prev.map(task => {
                if (task.id === taskId) {
                    const newChecklist = [...task.checklist];
                    newChecklist[itemIndex] = { ...newChecklist[itemIndex], checked: !newChecklist[itemIndex].checked };
                    return { ...task, checklist: newChecklist };
                }
                return task;
            });
            sessionStorage.setItem('pitlane_pit_crew_tasks', JSON.stringify(updated));
            return updated;
        });
    };

    // Check if all items are checked
    const isTaskComplete = (task) => task.checklist.every(item => item.checked);

    // Handle submit with confirmation
    const handleSubmitClick = (task) => {
        if (isTaskComplete(task)) {
            setShowConfirm(task.id);
        }
    };

    // Execute the task
    const handleConfirmExecute = async (task) => {
        try {
            await onExecuteTask(task.actionData);
            // Remove task from list
            setTasks(prev => {
                const updated = prev.filter(t => t.id !== task.id);
                sessionStorage.setItem('pitlane_pit_crew_tasks', JSON.stringify(updated));
                return updated;
            });
            setShowConfirm(null);

            // Dispatch completion event for FleetReadinessModal to update button state
            const taskKey = task.actionData?.damagedPartKey || task.id;
            window.dispatchEvent(new CustomEvent('pitlane:pit-crew-task-completed', {
                detail: { taskKey, task }
            }));
        } catch (error) {
            console.error('[PitCrewTasks] Execute failed:', error);
        }
    };

    // Cancel/remove task
    const handleCancelTask = (taskId) => {
        setTasks(prev => {
            const updated = prev.filter(t => t.id !== taskId);
            sessionStorage.setItem('pitlane_pit_crew_tasks', JSON.stringify(updated));
            return updated;
        });
        setShowConfirm(null);
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerContent}>
                        <Wrench size={20} color="#00B8D9" />
                        <div>
                            <h2 style={styles.title}>Pit Crew Tasks</h2>
                            <p style={styles.subtitle}>{tasks.length} pending task{tasks.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button style={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tasks List */}
                <div style={styles.tasksList}>
                    {tasks.length === 0 ? (
                        <div style={styles.emptyState}>
                            <CheckCircle size={48} color="#64748B" />
                            <p>No pending tasks</p>
                            <span>Tasks assigned by Race Operations will appear here</span>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <div key={task.id} style={styles.taskCard}>
                                {/* Task Header */}
                                <div
                                    style={styles.taskHeader}
                                    onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                                >
                                    <div style={styles.taskInfo}>
                                        <span style={styles.taskType}>{task.type.toUpperCase()}</span>
                                        <span style={styles.taskTitle}>{task.title}</span>
                                    </div>
                                    <div style={styles.taskMeta}>
                                        <span style={styles.taskProgress}>
                                            {task.checklist.filter(i => i.checked).length}/{task.checklist.length}
                                        </span>
                                        {expandedTask === task.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>

                                {/* Expanded Checklist */}
                                {expandedTask === task.id && (
                                    <div style={styles.taskBody}>
                                        <p style={styles.taskDesc}>{task.description}</p>

                                        {/* Checklist */}
                                        <div style={styles.checklist}>
                                            {task.checklist.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    style={styles.checklistItem}
                                                    onClick={() => toggleChecklistItem(task.id, idx)}
                                                >
                                                    {item.checked
                                                        ? <CheckCircle size={18} color="#00B8D9" />
                                                        : <Circle size={18} color="#64748B" />
                                                    }
                                                    <span style={{
                                                        ...styles.checklistText,
                                                        textDecoration: item.checked ? 'line-through' : 'none',
                                                        color: item.checked ? '#64748B' : '#fff'
                                                    }}>
                                                        {item.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={styles.taskActions}>
                                            <button
                                                style={styles.cancelBtn}
                                                onClick={() => handleCancelTask(task.id)}
                                            >
                                                Cancel Task
                                            </button>
                                            <button
                                                style={{
                                                    ...styles.submitBtn,
                                                    opacity: isTaskComplete(task) ? 1 : 0.5,
                                                    cursor: isTaskComplete(task) ? 'pointer' : 'not-allowed'
                                                }}
                                                onClick={() => handleSubmitClick(task)}
                                                disabled={!isTaskComplete(task)}
                                            >
                                                {isTaskComplete(task) ? 'Submit Complete' : 'Complete All Items'}
                                            </button>
                                        </div>

                                        {/* Confirmation Dialog */}
                                        {showConfirm === task.id && (
                                            <div style={styles.confirmDialog}>
                                                <AlertTriangle size={20} color="#F59E0B" />
                                                <div style={styles.confirmContent}>
                                                    <p style={styles.confirmTitle}>Confirm Execution</p>
                                                    <p style={styles.confirmText}>
                                                        This will execute the {task.type} in the backend.
                                                        Are you sure you've completed all physical steps?
                                                    </p>
                                                </div>
                                                <div style={styles.confirmActions}>
                                                    <button
                                                        style={styles.confirmNo}
                                                        onClick={() => setShowConfirm(null)}
                                                    >
                                                        Go Back
                                                    </button>
                                                    <button
                                                        style={styles.confirmYes}
                                                        onClick={() => handleConfirmExecute(task)}
                                                    >
                                                        Yes, Execute
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
    },
    modal: {
        background: 'var(--glass-bg, rgba(15, 23, 42, 0.95))',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
    },
    headerContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    title: {
        margin: 0,
        fontSize: '16px',
        fontWeight: '600',
        color: '#fff'
    },
    subtitle: {
        margin: 0,
        fontSize: '12px',
        color: '#64748B'
    },
    closeBtn: {
        background: 'rgba(100, 116, 139, 0.15)',
        border: 'none',
        borderRadius: '8px',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#64748B'
    },
    tasksList: {
        flex: 1,
        overflow: 'auto',
        padding: '16px'
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        color: '#64748B',
        gap: '8px'
    },
    taskCard: {
        background: 'rgba(100, 116, 139, 0.08)',
        borderRadius: '12px',
        marginBottom: '12px',
        overflow: 'hidden'
    },
    taskHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px',
        cursor: 'pointer'
    },
    taskInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    taskType: {
        fontSize: '10px',
        fontWeight: '600',
        color: '#00B8D9',
        letterSpacing: '0.5px'
    },
    taskTitle: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#fff'
    },
    taskMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#64748B'
    },
    taskProgress: {
        fontSize: '12px',
        fontWeight: '500'
    },
    taskBody: {
        padding: '0 16px 16px',
        borderTop: '1px solid rgba(255,255,255,0.05)'
    },
    taskDesc: {
        margin: '12px 0',
        fontSize: '12px',
        color: '#94A3B8',
        lineHeight: 1.5
    },
    checklist: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '16px'
    },
    checklistItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        cursor: 'pointer'
    },
    checklistText: {
        fontSize: '13px',
        flex: 1
    },
    taskActions: {
        display: 'flex',
        gap: '8px'
    },
    cancelBtn: {
        flex: 1,
        padding: '10px',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '8px',
        color: '#94A3B8',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer'
    },
    submitBtn: {
        flex: 1,
        padding: '10px',
        background: '#00B8D9',
        border: 'none',
        borderRadius: '8px',
        color: '#0A0E1A',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    confirmDialog: {
        marginTop: '12px',
        padding: '14px',
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    confirmContent: {
        flex: 1
    },
    confirmTitle: {
        margin: 0,
        fontSize: '13px',
        fontWeight: '600',
        color: '#F59E0B'
    },
    confirmText: {
        margin: '4px 0 0',
        fontSize: '12px',
        color: '#94A3B8',
        lineHeight: 1.4
    },
    confirmActions: {
        display: 'flex',
        gap: '8px'
    },
    confirmNo: {
        flex: 1,
        padding: '8px',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '6px',
        color: '#94A3B8',
        fontSize: '12px',
        fontWeight: '500',
        cursor: 'pointer'
    },
    confirmYes: {
        flex: 1,
        padding: '8px',
        background: '#F59E0B',
        border: 'none',
        borderRadius: '6px',
        color: '#0A0E1A',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer'
    }
};

export default PitCrewTasks;
