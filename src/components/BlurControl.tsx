
import React, { useState } from 'react';

interface BlurControlProps {
    label: string;
    enabled: boolean;
    strength: number;
    radius: number;
    onUpdate: (updates: { blurEnabled?: boolean; blurStrength?: number; blurRadius?: number }) => void;
    className?: string;
    variant?: 'overlay' | 'sidebar';
}

export const BlurControl: React.FC<BlurControlProps> = ({
    label,
    enabled,
    strength,
    radius,
    onUpdate,
    className = '',
    variant = 'overlay'
}) => {
    const [isOpen, setIsOpen] = useState(variant === 'sidebar');

    return (
        <div className={`relative z-50 group/blur ${className}`}>
            {isOpen ? (
                <div className={`${variant === 'sidebar' ? 'relative w-full mb-4' : 'bg-zinc-900 border border-zinc-700 p-4 rounded-xl shadow-2xl flex flex-col gap-4 w-64 animate-in fade-in zoom-in-95 duration-200'}`} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label} Blur</span>
                        </div>
                        {variant === 'overlay' && (
                            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        )}
                    </div>
                    {/* ... (rest of the content) ... */}

                    {/* Enabled Toggle */}
                    <div className="flex justify-between items-center bg-zinc-800/50 p-2 rounded-lg">
                        <span className="text-[10px] font-bold text-zinc-300 uppercase">Enable Blur</span>
                        <button
                            onClick={() => onUpdate({ blurEnabled: !enabled })}
                            className={`w-8 h-4 rounded-full transition-colors relative ${enabled ? 'bg-[var(--accent)]' : 'bg-zinc-700'}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {enabled && (
                        <>
                            {/* Strength Control */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Strength (Max)</span>
                                    <span className="text-[10px] text-[var(--accent)] font-mono">{strength}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="20"
                                    step="1"
                                    value={strength}
                                    onChange={(e) => onUpdate({ blurStrength: parseInt(e.target.value) })}
                                    className="w-full accent-[var(--accent)] cursor-pointer"
                                />
                            </div>

                            {/* Radius Control */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Clear Zone</span>
                                    <span className="text-[10px] text-[var(--accent)] font-mono">{Math.round(radius * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={radius}
                                    onChange={(e) => onUpdate({ blurRadius: parseFloat(e.target.value) })}
                                    className="w-full accent-[var(--accent)] cursor-pointer"
                                />
                                <p className="text-[9px] text-zinc-500 mt-1 italic">
                                    Distance from center before blur starts. 0% = Instant blur. 100% = No blur.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <button
                    onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                    className={`bg-black/60 hover:bg-[var(--accent)] backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20 transition-all shadow-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 duration-300 ${isOpen ? 'opacity-100' : ''}`}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                    Blur FX
                </button>
            )}
        </div>
    );
};
