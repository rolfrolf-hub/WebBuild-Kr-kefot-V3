
import React, { useState } from 'react';

interface DimControlProps {
  label: string;
  value: number;
  onSave: (val: number) => void;
  className?: string;
  variant?: 'overlay' | 'sidebar';
}

export const DimControl: React.FC<DimControlProps> = ({ label, value, onSave, className = '', variant = 'overlay' }) => {
  const [isEditing, setIsEditing] = useState(variant === 'sidebar');

  const safeValue = (typeof value === 'number' && !isNaN(value)) ? value : 0;

  return (
    <div className={`relative group/dim ${className}`}>
      {isEditing ? (
        <div className={`${variant === 'sidebar' ? 'relative w-full mb-4' : 'absolute right-0 top-0 z-[1000] bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-2xl flex flex-col gap-2 w-48'}`} onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label} Filter</span>
            {variant === 'overlay' && (
              <button onClick={() => setIsEditing(false)} className="text-zinc-500 hover:text-white">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={safeValue}
            onChange={(e) => onSave(parseInt(e.target.value))}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
          <div className="text-[10px] text-right text-[var(--accent)] font-mono">{safeValue}%</div>
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          className="bg-black/60 hover:bg-[var(--accent)] backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20 transition-all shadow-lg opacity-0 group-hover:opacity-100 duration-300 whitespace-nowrap"
        >
          Filter: {safeValue}%
        </button>
      )}
    </div>
  );
};
