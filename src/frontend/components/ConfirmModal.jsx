import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false }) => {
    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onCancel}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <div style={styles.headerContent}>
                        <AlertCircle size={24} color={isDanger ? '#EF4444' : '#00B8D9'} />
                        <h3 style={styles.title}>{title}</h3>
                    </div>
                    <button onClick={onCancel} style={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div style={styles.content}>
                    <p style={styles.message}>{message}</p>
                </div>

                <div style={styles.footer}>
                    <button onClick={onCancel} style={styles.cancelBtn}>
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={isDanger ? styles.dangerBtn : styles.confirmBtn}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
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
        zIndex: 10001
    },
    modal: {
        background: 'linear-gradient(135deg, #0A0E1A 0%, #151B2E 100%)',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '450px',
        border: '1px solid rgba(0, 184, 217, 0.3)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        borderBottom: '1px solid rgba(0, 184, 217, 0.2)',
        background: 'rgba(0, 184, 217, 0.05)'
    },
    headerContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 600,
        color: '#fff'
    },
    closeBtn: {
        background: 'transparent',
        border: 'none',
        color: '#94A3B8',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    content: {
        padding: '24px'
    },
    message: {
        margin: 0,
        color: '#E2E8F0',
        fontSize: '15px',
        lineHeight: '1.6'
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '16px 24px',
        borderTop: '1px solid rgba(0, 184, 217, 0.2)',
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
    confirmBtn: {
        padding: '10px 20px',
        background: 'linear-gradient(135deg, #00B8D9 0%, #0066CA 100%)',
        border: 'none',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    dangerBtn: {
        padding: '10px 20px',
        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        border: 'none',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s'
    }
};

export default ConfirmModal;
