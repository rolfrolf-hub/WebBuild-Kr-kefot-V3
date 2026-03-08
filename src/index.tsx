import React from 'react';
import './style.css';
import '@mux/mux-player';
import '@mux/mux-background-video/html';
import { createRoot } from 'react-dom/client';
import App from './App';
import { HealthStatus } from './components/HealthStatus';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', background: 'white', height: '100dvh', overflow: 'auto' }}>
          <h1>Something went wrong.</h1>
          <h2 style={{ marginTop: '1rem' }}>Error:</h2>
          <pre style={{ background: '#eee', padding: '1rem', borderRadius: '4px' }}>
            {this.state.error?.toString()}
          </pre>
          <h2 style={{ marginTop: '1rem' }}>Stack (Check Console for full):</h2>
          <pre style={{ background: '#eee', padding: '1rem', borderRadius: '4px' }}>
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: '2rem', padding: '1rem 2rem', background: 'red', color: 'white', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}
          >
            EMERGENCY RESET DATA
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <HealthStatus />
    </ErrorBoundary>
  </React.StrictMode>
);