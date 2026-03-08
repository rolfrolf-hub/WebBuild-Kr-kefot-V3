import { useState, useEffect } from 'react';

export const HealthStatus = () => {
    const [apiOk, setApiOk] = useState<boolean>(false);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const response = await fetch('http://localhost:3015/api/health');
                setApiOk(response.ok);
            } catch (error) {
                setApiOk(false);
            }
        };

        // Check immediately on load
        checkHealth();

        // Then check every 5 seconds
        const interval = setInterval(checkHealth, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '10px',
                right: '10px',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '5px',
                fontSize: '12px',
                zIndex: 9999,
                fontFamily: 'monospace',
                display: 'flex',
                gap: '10px'
            }}
        >
            <span>Vite: 🟢 (3000)</span>
            <span>
                API: {apiOk ? '🟢 (3015)' : '🔴 (OFFLINE)'}
            </span>
        </div>
    );
};