import React from 'react';

export function AuraControl({ visuals, onUpdate }: { visuals: any; onUpdate: (v: any) => void }) {
    const BLEND_MODES = [
        'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
        'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'
    ];

    return (
        <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-3 mt-4">
            <div className="flex items-center justify-between">
                <label className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">Aurora Effekt (Nordlys)</label>
                <div
                    onClick={() => onUpdate({ auraEnabled: !visuals?.auraEnabled })}
                    className={`w-8 h-4 rounded-full transition-colors cursor-pointer relative ${visuals?.auraEnabled ? 'bg-emerald-600' : 'bg-zinc-700'}`}
                >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${visuals?.auraEnabled ? 'right-0.5' : 'left-0.5'}`} />
                </div>
            </div>

            {visuals?.auraEnabled && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[9px] text-zinc-500 uppercase">Farge (Blank = Aksent)</label>
                            <input
                                type="text"
                                value={visuals.auraColor || ''}
                                onChange={(e) => onUpdate({ auraColor: e.target.value })}
                                placeholder="#hex"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] text-zinc-500 uppercase">Blend Mode</label>
                            <select
                                value={visuals.auraBlendMode || 'screen'}
                                onChange={(e) => onUpdate({ auraBlendMode: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-1 py-1 text-[10px] text-white focus:outline-none cursor-pointer"
                            >
                                {BLEND_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-zinc-500 uppercase">
                            <span>Hastighet</span>
                            <span>{visuals.auraSpeed || 20}s</span>
                        </div>
                        <input
                            type="range" min="2" max="60" step="1"
                            value={visuals.auraSpeed || 20}
                            onChange={(e) => onUpdate({ auraSpeed: parseInt(e.target.value) })}
                            className="w-full accent-emerald-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-zinc-500 uppercase">
                            <span>Styrke (Opacity)</span>
                            <span>{visuals.auraOpacity || 15}%</span>
                        </div>
                        <input
                            type="range" min="0" max="100" step="1"
                            value={visuals.auraOpacity || 15}
                            onChange={(e) => onUpdate({ auraOpacity: parseInt(e.target.value) })}
                            className="w-full accent-emerald-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
