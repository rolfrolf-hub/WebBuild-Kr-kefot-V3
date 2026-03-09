import React, { useState, useEffect } from 'react';
import { ProjectState } from '../types';
import { PreviewIframe } from './PreviewIframe';

type Device = {
    name: string;
    width: number;
    height: number;
    icon: string;
};

const DEVICES: Device[] = [
    { name: 'iPhone 14 Pro', width: 390, height: 844, icon: '📱' },
    { name: 'iPhone SE', width: 375, height: 667, icon: '📱' },
    { name: 'iPad Pro 11"', width: 834, height: 1194, icon: '📱' },
    { name: 'Desktop HD', width: 1920, height: 1080, icon: '🖥️' },
];

export const PreviewWindow: React.FC = () => {
    const [brandData, setBrandData] = useState<ProjectState | null>(null);
    const [activePage, setActivePage] = useState<'home' | 'about' | 'contact' | 'epk'>('home');
    const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0); // Default to iPhone 14 Pro
    const [scale, setScale] = useState(1);

    const selectedDevice = DEVICES[selectedDeviceIndex];

    // --- 1. LISTEN FOR MESSAGES FROM EDITOR (PARENT) ---
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Allow messages from the parent window
            const { type, payload } = event.data;

            switch (type) {
                case 'INIT':
                case 'UPDATE':
                    setBrandData(payload.brandData);
                    setActivePage(payload.activePage);
                    break;

                case 'PAGE_CHANGED':
                    setActivePage(payload.page);
                    break;

                case 'SCROLL_TO_SECTION':
                    // Forward scroll command to the inner content iframe
                    const iframe = document.querySelector('iframe');
                    if (iframe && iframe.contentWindow) {
                        const element = iframe.contentDocument?.getElementById(payload.sectionId);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                    break;
            }
        };

        window.addEventListener('message', handleMessage);

        // --- HANDSHAKE ---
        // Tell the Parent (Editor) we are alive and ready for data
        window.parent.postMessage({ type: 'PREVIEW_READY' }, window.location.origin);

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // --- 2. SEND "DEVICE CHANGED" SIGNAL TO EDITOR ---
    useEffect(() => {
        const device = DEVICES[selectedDeviceIndex];

        // Logic: Anything smaller than 600px is "Mobile Mode"
        const isMobile = device.width < 600;

        // console.log('[Preview] Switching Device:', device.name);

        // CRITICAL FIX: Send to window.parent (The Iframe Host), not window.opener
        window.parent.postMessage(
            {
                type: 'DEVICE_CHANGED',
                payload: { isMobile, deviceName: device.name }
            },
            window.location.origin
        );
    }, [selectedDeviceIndex]);

    // --- 3. AUTO-SCALE LOGIC ---
    useEffect(() => {
        const updateScale = () => {
            const padding = 60; // Space around the phone
            const toolbarHeight = 80;

            // Calculate available space in the iframe
            const maxWidth = window.innerWidth - padding;
            const maxHeight = window.innerHeight - toolbarHeight - padding;

            const scaleX = maxWidth / (selectedDevice.width + 24);
            const scaleY = maxHeight / (selectedDevice.height + 24);

            // Fit to screen, but never scale UP (pixelated), only DOWN
            setScale(Math.min(scaleX, scaleY, 1));
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [selectedDevice]);

    // --- 4. KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '4') {
                e.preventDefault();
                const index = parseInt(e.key) - 1;
                if (index < DEVICES.length) setSelectedDeviceIndex(index);
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    if (!brandData) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-950 text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Syncing with Editor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0 shadow-xl z-50">
                <div className="flex items-center gap-4">
                    <h2 className="text-zinc-400 font-bold text-xs uppercase tracking-wider">
                        True Preview
                    </h2>
                    <div className="h-4 w-px bg-zinc-800" />

                    {/* Device Buttons */}
                    <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg">
                        {DEVICES.map((device, idx) => (
                            <button
                                key={device.name}
                                onClick={() => setSelectedDeviceIndex(idx)}
                                className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold transition-all ${selectedDeviceIndex === idx
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                    }`}
                            >
                                <span className="mr-1.5 opacity-70">{device.icon}</span>
                                {device.name.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Page Tabs */}
                <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg">
                    {(['home', 'about', 'contact', 'epk'] as const).map((page) => (
                        <button
                            key={page}
                            onClick={() => {
                                setActivePage(page);
                                // Notify editor of page change
                                window.parent.postMessage(
                                    { type: 'PAGE_CHANGED', payload: { page } },
                                    window.location.origin
                                );
                            }}
                            className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold transition-all ${activePage === page
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            </div>

            {/* The Stage */}
            <div className="flex-1 flex items-center justify-center overflow-hidden bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-zinc-950/50">
                <div
                    className="relative transition-all duration-300 ease-out"
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'center center',
                    }}
                >
                    {/* Phone/Monitor Frame */}
                    <div
                        className="relative bg-black shadow-2xl overflow-hidden"
                        style={{
                            width: selectedDevice.width + 24,
                            height: selectedDevice.height + 24,
                            borderRadius: selectedDevice.width < 600 ? '40px' : '12px',
                            border: '12px solid #1a1a1a',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        {/* Mobile Notch */}
                        {selectedDevice.width < 600 && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1a1a1a] rounded-b-xl z-20 pointer-events-none" />
                        )}

                        {/* The Actual Site Content */}
                        <div className="w-full h-full bg-white overflow-hidden rounded-[28px] md:rounded-none">
                            <PreviewIframe
                                brandData={brandData}
                                activePage={activePage}
                                deviceWidth={selectedDevice.width}
                                deviceHeight={selectedDevice.height}
                            />
                        </div>
                    </div>

                    {/* Device Label */}
                    <div className="absolute -bottom-12 left-0 right-0 text-center opacity-50">
                        <span className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold">
                            {selectedDevice.name}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};