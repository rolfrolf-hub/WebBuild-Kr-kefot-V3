
import React, { useState } from 'react';
import { BrandState } from '../types';

interface LayoutControlProps {
  label: string;
  columns: number;
  gap: number;
  scale: number;
  itemSize?: number; // New prop for width %
  aspectRatio?: string; // aspect ratio (e.g., '1/1', '4/3', '16/9')
  onUpdate: (data: { columns?: number; gap?: number; scale?: number; itemSize?: number; aspectRatio?: string }) => void;
  className?: string;
  isMobileMode?: boolean;
  brandData?: BrandState;
  variant?: 'overlay' | 'sidebar';
}

export const LayoutControl: React.FC<LayoutControlProps> = ({
  label,
  columns,
  gap,
  scale,
  itemSize = 100,
  aspectRatio = '1/1',
  onUpdate,
  className = '',
  isMobileMode = false,
  brandData,
  variant = 'overlay'
}) => {
  const [isEditing, setIsEditing] = useState(variant === 'sidebar');

  return (
    <div className={`relative z-10 group/layout ${className}`}>
      {isEditing ? (
        <div className={`${variant === 'sidebar' ? 'relative w-full' : 'bg-zinc-900 border border-zinc-700 p-5 rounded-2xl shadow-2xl flex flex-col gap-5 w-64 animate-in fade-in zoom-in-95 duration-200'}`} onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                {isMobileMode ? 'Mobile Layout' : 'Desktop Layout'}
              </span>
              <span className="text-[9px] text-[var(--accent)] font-medium uppercase tracking-tighter">Layout & Size</span>
            </div>
            {variant === 'overlay' && (
              <button onClick={() => setIsEditing(false)} className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded-lg transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>

          <div className="space-y-5">
            {/* Column Layout Selector */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Columns</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => onUpdate({ columns: num })}
                    className={`flex flex-col items-center justify-center h-10 rounded-lg border transition-all ${columns === num ? 'bg-[var(--accent-dark)] border-[var(--accent)] text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                    title={`${num} Column${num > 1 ? 's' : ''}`}
                  >
                    <span className="text-[10px] font-bold">{num}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Item Size (Width %) */}
            <div>
              <div className="flex justify-between text-[10px] text-zinc-400 mb-2 font-bold uppercase tracking-tight">
                <span>Item Size (Width)</span>
                <span className="text-[var(--accent)]">{itemSize}%</span>
              </div>
              <input
                type="range" min="50" max="150" step="5"
                value={itemSize}
                onChange={(e) => onUpdate({ itemSize: parseInt(e.target.value) })}
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
            </div>

            {/* Scale (Transform) */}
            <div>
              <div className="flex justify-between text-[10px] text-zinc-400 mb-2 font-bold uppercase tracking-tight">
                <span>Zoom Scale</span>
                <span className="text-[var(--accent)]">{((scale || 1) * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min="0.5" max="1.5" step="0.05"
                value={scale}
                onChange={(e) => onUpdate({ scale: parseFloat(e.target.value) })}
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
            </div>

            {/* Gap Slider */}
            <div>
              <div className="flex justify-between text-[10px] text-zinc-400 mb-2 font-bold uppercase tracking-tight">
                <span>Spacing (Gap)</span>
                <span className="text-[var(--accent)]">{gap}px</span>
              </div>
              <input
                type="range" min="0" max="64"
                step="4"
                value={gap}
                onChange={(e) => onUpdate({ gap: parseInt(e.target.value) })}
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ label: '1:1', value: '1/1' }, { label: '4:3', value: '4/3' }, { label: '16:9', value: '16/9' }].map(ratio => (
                  <button
                    key={ratio.value}
                    onClick={() => onUpdate({ aspectRatio: ratio.value })}
                    className={`h-10 rounded-lg border transition-all text-[10px] font-bold ${aspectRatio === ratio.value ? 'bg-[var(--accent-dark)] border-[var(--accent)] text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Reset all data? This will clear local storage and reload the page.")) {
                    localStorage.removeItem('kraakefot-data');
                    window.location.reload();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-950/20 hover:bg-red-600 border border-red-900/30 text-red-500/80 hover:text-white text-[9px] py-2 rounded-lg uppercase font-bold transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                Wipe All Data
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          className="bg-black/80 hover:bg-[var(--accent)] backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-white/20 shadow-xl transition-all opacity-0 group-hover:opacity-100 duration-300 flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
          Layout & Size
        </button>
      )}
    </div>
  );
};
