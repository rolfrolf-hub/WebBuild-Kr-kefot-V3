import React from 'react';
import { BrandState } from '../types';

interface GlobalVisualsControlProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
}

export const GlobalVisualsControl: React.FC<GlobalVisualsControlProps> = ({ brandData, onUpdate }) => {
    return (
        <div className="space-y-6">
            {/* Global Button Aura */}
            <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] border-b border-zinc-800 pb-2 flex justify-between items-center">
                    Knappeeffekter (Global)
                    <div
                        onClick={() => onUpdate({ buttonAuraEnabled: brandData.buttonAuraEnabled !== false ? false : true })}
                        className={`w-8 h-4 rounded-full transition-colors cursor-pointer relative ${brandData.buttonAuraEnabled !== false ? 'bg-emerald-600' : 'bg-zinc-700'}`}
                    >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${brandData.buttonAuraEnabled !== false ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                </h4>
                <div className="pl-2">
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                        Aktiver dette for å vise det animerte nordlyset (Aura) bak alle hovedknapper (btn-glass).
                    </p>
                </div>
            </div>

            {/* Header Background */}
            <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] border-b border-zinc-800 pb-2">
                    Hovedmeny (Header)
                </h4>

                <div className="space-y-3 pl-2">
                    {/* Menu Base Opacity */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-500">
                            <label>Bakgrunnssynlighet</label>
                            <span>{Math.round((brandData.menuOpacity ?? 0.4) * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={brandData.menuOpacity ?? 0.4}
                            onChange={(e) => onUpdate({ menuOpacity: parseFloat(e.target.value) })}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                        />
                    </div>

                    {/* Menu Tint Color */}
                    <div className="flex justify-between items-center gap-4">
                        <label className="text-[10px] uppercase font-bold text-zinc-500">Tint Farge</label>
                        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded p-1 max-w-[120px]">
                            <input
                                type="color"
                                value={brandData.menuTintColor || brandData.accentColor}
                                onChange={(e) => onUpdate({ menuTintColor: e.target.value })}
                                className="h-6 w-6 rounded cursor-pointer bg-transparent border-none shrink-0"
                            />
                            <span className="text-[10px] font-mono text-zinc-400 truncate w-full">
                                {brandData.menuTintColor || brandData.accentColor}
                            </span>
                        </div>
                    </div>

                    {/* Menu Tint Amount */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-500">
                            <label>Tint Styrke</label>
                            <span>{Math.round((brandData.menuTintAmount ?? 0.1) * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={brandData.menuTintAmount ?? 0.1}
                            onChange={(e) => onUpdate({ menuTintAmount: parseFloat(e.target.value) })}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] border-b border-zinc-800 pb-2">
                    Mobilmeny Bakgrunn
                </h4>

                <div className="space-y-3 pl-2">
                    {/* Overlay Blur */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-500">
                            <label>Blur (Uskarphet)</label>
                            <span>{brandData.menuOverlayBlur ?? 5}px</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={brandData.menuOverlayBlur ?? 5}
                            onChange={(e) => onUpdate({ menuOverlayBlur: parseInt(e.target.value) })}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    {/* Overlay Brightness */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-500">
                            <label>Lysstyrke</label>
                            <span>{brandData.menuOverlayBrightness ?? 95}%</span>
                        </div>
                        <input
                            type="range"
                            min="50"
                            max="150"
                            step="5"
                            value={brandData.menuOverlayBrightness ?? 95}
                            onChange={(e) => onUpdate({ menuOverlayBrightness: parseInt(e.target.value) })}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                    </div>

                    {/* Overlay Base Color Opacity */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-500">
                            <label>Fargegjennomsiktighet</label>
                            <span>{brandData.menuOverlayOpacity ?? 5}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={brandData.menuOverlayOpacity ?? 5}
                            onChange={(e) => onUpdate({ menuOverlayOpacity: parseInt(e.target.value) })}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                        />
                    </div>

                    {/* Overlay Base Color */}
                    <div className="flex justify-between items-center gap-4">
                        <label className="text-[10px] uppercase font-bold text-zinc-500">Bakgrunnsfarge</label>
                        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded p-1 max-w-[120px]">
                            <input
                                type="color"
                                value={brandData.menuOverlayColor || '#000000'}
                                onChange={(e) => onUpdate({ menuOverlayColor: e.target.value })}
                                className="h-6 w-6 rounded cursor-pointer bg-transparent border-none shrink-0"
                            />
                            <span className="text-[10px] font-mono text-zinc-400 truncate w-full">
                                {brandData.menuOverlayColor || '#000000'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
