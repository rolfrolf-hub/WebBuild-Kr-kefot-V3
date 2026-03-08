
import React, { useState } from 'react';

interface FramingControlProps {
    label: string;
    zoom: number;
    xOffset: number;
    yOffset: number;
    onUpdate: (data: { zoom?: number; x?: number; y?: number }) => void;
    className?: string;
    isMobileMode?: boolean;
    variant?: 'overlay' | 'sidebar';
}

export const FramingControl: React.FC<FramingControlProps> = ({
    label,
    zoom = 1,
    xOffset = 0,
    yOffset = 0,
    onUpdate,
    className = '',
    isMobileMode = false,
    variant = 'overlay'
}) => {
    const [isOpen, setIsOpen] = useState(variant === 'sidebar');

    // Completely bulletproof number conversion
    const ensureNumber = (val: any, fallback: number) => {
        const num = Number(val);
        return Number.isFinite(num) ? num : fallback;
    };

    const safeZoom = ensureNumber(zoom, 1);
    const safeX = ensureNumber(xOffset, 0);
    const safeY = ensureNumber(yOffset, 0);

    return (
        <div className={`${variant === 'sidebar' ? 'relative w-full' : 'absolute z-50 group/framing'} ${className}`}>
            {isOpen ? (
                <div className={`${variant === 'sidebar' ? 'relative w-full' : 'bg-zinc-900 border border-zinc-700 p-4 rounded-xl shadow-2xl flex flex-col gap-4 w-64 animate-in fade-in zoom-in-95 duration-200'}`} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
                            <span className="text-[9px] text-[var(--accent)] font-medium uppercase tracking-tighter">{isMobileMode ? 'Mobile' : 'Desktop'} Framing</span>
                        </div>
                        {variant === 'overlay' && (
                            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        )}
                    </div>

                    {/* Zoom Control */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Zoom</span>
                            <span className="text-[10px] text-[var(--accent)] font-mono">{safeZoom.toFixed(2)}x</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="3.0"
                            step="0.01"
                            value={safeZoom}
                            onChange={(e) => onUpdate({ zoom: parseFloat(e.target.value) })}
                            className="w-full accent-[var(--accent)] cursor-pointer"
                        />
                    </div>

                    {/* X-Offset Control */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Position X</span>
                            <span className="text-[10px] text-[var(--accent)] font-mono">{safeX}%</span>
                        </div>
                        <input
                            type="range"
                            min="-50"
                            max="50"
                            step="1"
                            value={safeX}
                            onChange={(e) => onUpdate({ x: parseInt(e.target.value) })}
                            className="w-full accent-[var(--accent)] cursor-pointer"
                        />
                    </div>

                    {/* Y-Offset Control */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Position Y</span>
                            <span className="text-[10px] text-[var(--accent)] font-mono">{safeY}%</span>
                        </div>
                        <input
                            type="range"
                            min="-50"
                            max="50"
                            step="1"
                            value={safeY}
                            onChange={(e) => onUpdate({ y: parseInt(e.target.value) })}
                            className="w-full accent-[var(--accent)] cursor-pointer"
                        />
                    </div>
                </div>
            ) : (
                <button
                    onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                    className={`bg-black/60 hover:bg-[var(--accent)] backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20 transition-all shadow-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 duration-300 ${isOpen ? 'opacity-100' : ''}`}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    Framing
                </button>
            )}
        </div>
    );
};
