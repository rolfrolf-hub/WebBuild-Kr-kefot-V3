import React, { useState } from 'react';
import { SectionHeightMode, SectionLayout } from '../../types';

interface AtomicLayoutControlProps {
  label: string;
  layout: SectionLayout;
  onUpdate: (newData: Partial<SectionLayout>) => void;
  isMobile: boolean;
  className?: string;
  variant?: 'overlay' | 'sidebar';
}

export const AtomicLayoutControl: React.FC<AtomicLayoutControlProps> = ({
  label,
  layout,
  onUpdate,
  isMobile,
  className = '',
  variant = 'overlay'
}) => {
  const [isOpen, setIsOpen] = useState(variant === 'sidebar');

  const heightMode = layout?.heightMode || 'auto';
  const mobileHeightMode = layout?.mobileHeightMode ?? heightMode; // Fallback to desktop
  const effectiveHeightMode = isMobile ? mobileHeightMode : heightMode;

  const paddingTopDesktop = !isNaN(Number(layout?.paddingTopDesktop)) ? Number(layout?.paddingTopDesktop) : 6;
  const paddingBottomDesktop = !isNaN(Number(layout?.paddingBottomDesktop)) ? Number(layout?.paddingBottomDesktop) : 6;
  const paddingTopMobile = !isNaN(Number(layout?.paddingTopMobile)) ? Number(layout?.paddingTopMobile) : 4;
  const paddingBottomMobile = !isNaN(Number(layout?.paddingBottomMobile)) ? Number(layout?.paddingBottomMobile) : 4;
  const marginBottom = !isNaN(Number(layout?.marginBottom)) ? Number(layout?.marginBottom) : 0;
  const mobileMarginBottom = !isNaN(Number(layout?.mobileMarginBottom)) ? Number(layout?.mobileMarginBottom) : 0;

  const paddingTop = isMobile ? paddingTopMobile : paddingTopDesktop;
  const paddingBottom = isMobile ? paddingBottomMobile : paddingBottomDesktop;
  const currentMarginBottom = isMobile ? mobileMarginBottom : marginBottom;

  return (
    <div className={`${variant === 'sidebar' ? 'relative w-full' : 'absolute z-50 group/atomic'} ${className}`}>
      {isOpen ? (
        <div className={`${variant === 'sidebar' ? 'relative w-full' : 'bg-zinc-900 border border-zinc-700 p-4 rounded-xl shadow-2xl flex flex-col gap-4 w-64 animate-in fade-in zoom-in-95 duration-200'}`} onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-1">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
              <span className="text-[9px] text-[var(--accent)] font-medium uppercase tracking-tighter">
                {isMobile ? 'Mobile' : 'Desktop'} Layout
              </span>
            </div>
            {variant === 'overlay' && (
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>

          {/* Height Mode Selector - Mobile/Desktop Aware */}
          <div>
            <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
              Height Mode <span className="text-[var(--accent)]">({isMobile ? 'Mobile' : 'Desktop'})</span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['auto', 'screen', 'custom'] as SectionHeightMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onUpdate(isMobile
                    ? { mobileHeightMode: mode }
                    : { heightMode: mode }
                  )}
                  className={`py-1 text-[9px] font-bold uppercase rounded border transition-all ${effectiveHeightMode === mode
                    ? 'bg-[var(--accent-dark)] border-[var(--accent)] text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Padding Top */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Padding Top</span>
              <span className="text-[10px] text-[var(--accent)] font-mono">{paddingTop}rem</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={paddingTop}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdate(isMobile ? { paddingTopMobile: val } : { paddingTopDesktop: val });
              }}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* Padding Bottom */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Padding Bottom</span>
              <span className="text-[10px] text-[var(--accent)] font-mono">{paddingBottom}rem</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={paddingBottom}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdate(isMobile ? { paddingBottomMobile: val } : { paddingBottomDesktop: val });
              }}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* Margin Bottom */}
          <div className="pt-2 border-t border-zinc-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Margin Bottom</span>
              <span className="text-[10px] text-[var(--accent)] font-mono">{currentMarginBottom}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="8"
              value={currentMarginBottom}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                onUpdate(isMobile ? { mobileMarginBottom: val } : { marginBottom: val });
              }}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
          className="bg-black/60 hover:bg-[var(--accent)] backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20 transition-all shadow-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 duration-300"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /></svg>
          Layout & Spacing
        </button>
      )}
    </div>
  );
};