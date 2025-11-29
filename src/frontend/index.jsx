import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log("🚀 PitLane Ledger: Frontend script starting...");

// Immediate visual check
const rootElement = document.getElementById('root');
if (!rootElement) {
    console.error("❌ Root element not found!");
    document.body.innerHTML = '<h1 style="color:red">FATAL: Root element missing</h1>';
} else {
    console.log("✅ Root element found");
    // Add a temporary loading indicator directly to DOM
    const loader = document.createElement('div');
    loader.id = 'initial-loader';
    loader.style.color = '#00B8D9';
    loader.style.padding = '20px';
    loader.innerText = '⚡ Initializing PitLane Ledger...';
    rootElement.appendChild(loader);
}

// Simple Error Boundary
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("React Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, color: 'white', background: '#0A0E1A' }}>
                    <h1>⚠️ React Error</h1>
                    <pre style={{ color: '#ff4d4f', whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
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
    console.log("✅ React mount called");

    // Remove initial loader after a tick
    setTimeout(() => {
        const loader = document.getElementById('initial-loader');
        if (loader) loader.remove();
    }, 100);

} catch (err) {
    console.error("❌ Fatal Mount Error:", err);
    document.body.innerHTML += `<h2 style="color:red">Mount Error: ${err.message}</h2>`;
}
