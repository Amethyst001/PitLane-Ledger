import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';


// Immediate visual check
const rootElement = document.getElementById('root');
if (!rootElement) {
    console.error("❌ Root element not found!");
    document.body.innerHTML = '<h1 style="color:red">FATAL: Root element missing</h1>';
} else {

    // Add a temporary loading indicator directly to DOM
    const loader = document.createElement('div');
    loader.id = 'initial-loader';
    loader.style.color = '#00B8D9';
    loader.style.padding = '20px';
    loader.innerText = '⚡ Initializing PitLane Ledger...';
    rootElement.appendChild(loader);
}

// Enhanced Error Boundary with Go Home button
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
        this.setState({ hasError: false, error: null });
        window.location.href = window.location.origin + window.location.pathname;
    };

    handleRefresh = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ backgroundColor: '#0A0E1A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    <div style={{ background: 'rgba(20, 24, 36, 0.95)', border: '2px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '40px', maxWidth: '500px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', margin: '0 0 12px 0' }}>Something Went Wrong</h1>
                        <p style={{ fontSize: '14px', color: '#F04438', margin: '0 0 8px 0', fontFamily: 'monospace', background: 'rgba(240, 68, 56, 0.1)', padding: '12px', borderRadius: '6px', wordBreak: 'break-word' }}>
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <p style={{ fontSize: '14px', color: '#9CA3AF', margin: '0 0 24px 0' }}>
                            Don't worry! You can go back home or refresh the page
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
                            <button onClick={this.handleGoHome} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#00B8D9', color: '#0A0E1A', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                                <span>← Go Home</span>
                            </button>
                            <button onClick={this.handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'transparent', color: '#00B8D9', border: '2px solid #00B8D9', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                                <span>↻ Refresh</span>
                            </button>
                        </div>
                        {this.state.error?.stack && (
                            <details style={{ marginTop: '20px', textAlign: 'left' }}>
                                <summary style={{ cursor: 'pointer', color: '#9CA3AF', fontSize: '12px' }}>Show Error Details</summary>
                                <pre style={{ marginTop: '12px', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '6px', fontSize: '11px', color: '#9CA3AF', overflow: 'auto', maxHeight: '200px' }}>
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

try {
    const root = createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </React.StrictMode>
    );


    // Remove initial loader after a tick
    setTimeout(() => {
        const loader = document.getElementById('initial-loader');
        if (loader) loader.remove();
    }, 100);

} catch (err) {
    console.error("❌ Fatal Mount Error:", err);
    document.body.innerHTML += `<h2 style="color:red">Mount Error: ${err.message}</h2>`;
}
