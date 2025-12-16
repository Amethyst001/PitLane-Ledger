import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleGoHome = () => {
        // Clear error and navigate to home/dashboard
        this.setState({ hasError: false, error: null });
        window.location.href = window.location.origin + window.location.pathname;
    };

    handleRefresh = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={styles.container}>
                    <div style={styles.errorCard}>
                        <AlertTriangle size={48} color="#F04438" style={{ marginBottom: '16px' }} />
                        <h1 style={styles.title}>⚠️ Something Went Wrong</h1>
                        <p style={styles.errorMessage}>
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <p style={styles.subtitle}>
                            Don't worry! You can go back to the dashboard or refresh the page
                        </p>
                        <div style={styles.buttonGroup}>
                            <button onClick={this.handleGoHome} style={styles.buttonPrimary}>
                                <ArrowLeft size={16} />
                                <span>Go Home</span>
                            </button>
                            <button onClick={this.handleRefresh} style={styles.buttonSecondary}>
                                <RefreshCw size={16} />
                                <span>Refresh</span>
                            </button>
                        </div>
                        {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                            <details style={{ marginTop: '20px', textAlign: 'left' }}>
                                <summary style={{ cursor: 'pointer', color: '#9CA3AF', fontSize: '12px' }}>
                                    Show Error Details
                                </summary>
                                <pre style={styles.errorStack}>
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const styles = {
    container: {
        backgroundColor: '#0A0E1A',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    errorCard: {
        background: 'rgba(20, 24, 36, 0.95)',
        border: '2px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '500px',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
    },
    title: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#FFFFFF',
        margin: '0 0 12px 0'
    },
    errorMessage: {
        fontSize: '14px',
        color: '#F04438',
        margin: '0 0 8px 0',
        fontFamily: 'monospace',
        background: 'rgba(240, 68, 56, 0.1)',
        padding: '12px',
        borderRadius: '6px',
        wordBreak: 'break-word'
    },
    subtitle: {
        fontSize: '14px',
        color: '#9CA3AF',
        margin: '0 0 24px 0'
    },
    buttonGroup: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'center'
    },
    buttonPrimary: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        background: 'var(--color-accent-cyan, #00B8D9)',
        color: '#0A0E1A',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    buttonSecondary: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        background: 'transparent',
        color: 'var(--color-accent-cyan, #00B8D9)',
        border: '2px solid var(--color-accent-cyan, #00B8D9)',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    errorStack: {
        marginTop: '24px',
        padding: '12px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#9CA3AF',
        textAlign: 'left',
        overflow: 'auto',
        maxHeight: '200px'
    }
};

export default ErrorBoundary;
