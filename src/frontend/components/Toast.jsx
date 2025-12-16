import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const config = {
        success: {
            icon: <CheckCircle size={20} />,
            color: '#00D084',
            bg: 'rgba(0, 208, 132, 0.1)',
            border: 'rgba(0, 208, 132, 0.3)'
        },
        error: {
            icon: <XCircle size={20} />,
            color: '#F04438',
            bg: 'rgba(240, 68, 56, 0.1)',
            border: 'rgba(240, 68, 56, 0.3)'
        },
        warning: {
            icon: <AlertCircle size={20} />,
            color: '#F79009',
            bg: 'rgba(247, 144, 9, 0.1)',
            border: 'rgba(247, 144, 9, 0.3)'
        },
        info: {
            icon: <Info size={20} />,
            color: '#00B8D9',
            bg: 'rgba(0, 184, 217, 0.1)',
            border: 'rgba(0, 184, 217, 0.3)'
        }
    };

    const style = config[type] || config.info;

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            minWidth: '300px',
            maxWidth: '500px',
            padding: '16px 20px',
            background: style.bg,
            border: `1px solid ${style.border}`,
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideIn 0.3s ease-out',
            color: '#FFFFFF'
        }}>
            <div style={{ color: style.color, flexShrink: 0 }}>
                {style.icon}
            </div>
            <div style={{ flex: 1, fontSize: '14px', lineHeight: '1.5' }}>
                {message}
            </div>
            <button
                onClick={onClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: style.color,
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '0',
                    lineHeight: '1'
                }}
            >
                ×
            </button>
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default Toast;
