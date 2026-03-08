import React, { useState } from 'react';

interface MuxVideoControlProps {
  /** framing object from section data (zoomDesktop, zoomMobile) */
  framing: {
    zoomDesktop?: number;
    zoomMobile?: number;
    [key: string]: any;
  };
  /** visuals object from section data (playbackRate) */
  visuals: {
    playbackRate?: number;
    [key: string]: any;
  };
  onUpdateFraming: (updates: { zoomDesktop?: number; zoomMobile?: number }) => void;
  onUpdateVisuals: (updates: { playbackRate?: number }) => void;
  variant?: 'sidebar' | 'overlay';
}

export const MuxVideoControl: React.FC<MuxVideoControlProps> = ({
  framing,
  visuals,
  onUpdateFraming,
  onUpdateVisuals,
  variant = 'sidebar',
}) => {
  const [isOpen, setIsOpen] = useState(variant === 'sidebar');

  const ensureNum = (val: any, fallback: number) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  };

  const zoomD = ensureNum(framing?.zoomDesktop, 1);
  const zoomM = ensureNum(framing?.zoomMobile, 1);
  const rate  = ensureNum(visuals?.playbackRate, 0.8);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-700 text-xs font-bold text-zinc-400 uppercase tracking-wider transition-colors"
      >
        <span className="flex items-center gap-2">
          {/* Video icon */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          Mux Video
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-900 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          Mux Video
        </span>
        {variant === 'overlay' && (
          <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Zoom — Desktop */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
            {/* Desktop icon */}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Zoom Desktop
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">{zoomD.toFixed(2)}x</span>
        </div>
        <input
          type="range" min="0.5" max="3" step="0.01"
          value={zoomD}
          onChange={e => onUpdateFraming({ zoomDesktop: parseFloat(e.target.value) })}
          className="w-full accent-cyan-400 cursor-pointer"
        />
      </div>

      {/* Zoom — Mobile */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
            {/* Mobile icon */}
            <svg width="9" height="11" viewBox="0 0 18 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="1" width="14" height="22" rx="2" />
              <line x1="9" y1="18" x2="9" y2="18" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Zoom Mobile
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">{zoomM.toFixed(2)}x</span>
        </div>
        <input
          type="range" min="0.5" max="3" step="0.01"
          value={zoomM}
          onChange={e => onUpdateFraming({ zoomMobile: parseFloat(e.target.value) })}
          className="w-full accent-cyan-400 cursor-pointer"
        />
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-700/60" />

      {/* Playback Rate */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
            {/* Speed icon */}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Playback Speed
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">{rate.toFixed(2)}x</span>
        </div>
        <input
          type="range" min="0.1" max="2" step="0.05"
          value={rate}
          onChange={e => onUpdateVisuals({ playbackRate: parseFloat(e.target.value) })}
          className="w-full accent-cyan-400 cursor-pointer"
        />
        <div className="flex justify-between text-[9px] text-zinc-600 mt-0.5 px-0.5">
          <span>0.1× slow</span>
          <span>1.0× normal</span>
          <span>2.0× fast</span>
        </div>
      </div>

      {/* Collapse button (sidebar only) */}
      {variant === 'sidebar' && (
        <button
          onClick={() => setIsOpen(false)}
          className="w-full text-center text-[9px] text-zinc-600 hover:text-zinc-400 pt-1 transition-colors"
        >
          ▲ collapse
        </button>
      )}
    </div>
  );
};
