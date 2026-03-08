
import React, { useState } from 'react';
import { BrandState } from '../types';
import { ServerMediaBrowser } from './ServerMediaBrowser';

interface MediaEditControlProps {
  label: string;
  value: string;
  onSave: (val: string) => void;
  className?: string;
  brandData?: BrandState;
  onUpdate?: (newData: Partial<BrandState>) => void;
  variant?: 'overlay' | 'sidebar';
}

export const MediaEditControl: React.FC<MediaEditControlProps> = ({
  label,
  value,
  onSave,
  className = '',
  brandData,
  onUpdate,
  variant = 'overlay'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const safeValue = value || '';

  const isSidebar = variant === 'sidebar';

  if (isEditing) {
    return (
      <div className={`${isSidebar ? 'relative w-full mb-3 ' : 'absolute z-[100]'} bg-zinc-900 border border-[rgb(var(--accent-rgb)/0.5)] p-2 rounded-xl flex gap-2 items-center shadow-2xl ${className}`} onClick={e => e.stopPropagation()}>
        <input
          value={safeValue}
          onChange={(e) => onSave(e.target.value)}
          className="bg-black border border-zinc-800 rounded px-3 py-1.5 text-xs flex-1 text-white focus:border-[var(--accent)] outline-none font-mono"
          placeholder="Media URL..."
          autoFocus
        />

        {/* Library Button */}
        {brandData && onUpdate && (
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-1.5 rounded-lg transition-colors border border-zinc-700 shrink-0"
            title="Browse Server / Library"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
          </button>
        )}

        <button onClick={() => setIsEditing(false)} className="bg-[var(--accent-dark)] hover:bg-[var(--accent)] text-white p-1.5 rounded-lg transition-colors shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
        </button>

        {brandData && onUpdate && (
          <ServerMediaBrowser
            isOpen={isLibraryOpen}
            onClose={() => setIsLibraryOpen(false)}
            brandData={brandData}
            onSelect={(url) => {
              onSave(url);
              setIsLibraryOpen(false);
              setIsEditing(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className={isSidebar ? 'relative w-full mb-3' : 'absolute z-50'}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className={isSidebar
          ? `w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-3 rounded-lg flex flex-col items-start justify-center group transition-all gap-2`
          : `bg-black/80 hover:bg-[var(--accent)] backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20 transition-all shadow-lg opacity-0 group-hover:opacity-100 duration-300 ${className}`
        }
      >
        {isSidebar ? (
          <>
            <div className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-500 group-hover:text-white shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white">{label}</span>
            </div>
            {safeValue && (
              <div className="flex items-center gap-2 w-full bg-black/40 rounded p-1 border border-zinc-800/50">
                {safeValue.match(/\.(mp4|webm|mov)$/i) ? (
                  <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded overflow-hidden shrink-0 bg-zinc-800">
                    <img src={safeValue.startsWith('http') ? safeValue : `${brandData?.serverBaseUrl || ''}/${safeValue}`} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <span className="text-[9px] text-zinc-500 font-mono truncate text-left flex-1">{safeValue.split('/').pop()}</span>
              </div>
            )}
          </>
        ) : label}
      </button>
    </div>
  );
};
