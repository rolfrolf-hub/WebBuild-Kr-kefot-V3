import React, { useState } from 'react';
import { BrandState, TextStyle } from '../types';
import { FONT_OPTIONS } from './TypographyControl';

interface TypographyEditControlProps {
  label: string;
  styleKey: string;
  brandData: BrandState;
  onUpdate: (newData: Partial<BrandState>) => void;
  className?: string;
  variant?: 'overlay' | 'sidebar';
  textValue?: string;
  onTextUpdate?: (val: string) => void;
}

export const TypographyEditControl: React.FC<TypographyEditControlProps> = ({
  label,
  styleKey,
  brandData,
  onUpdate,
  className = '',
  variant = 'overlay',
  textValue,
  onTextUpdate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentStyle: TextStyle = brandData.textStyles?.[styleKey] || {};

  const updateStyle = (updates: Partial<TextStyle>) => {
    const newTextStyles = {
      ...brandData.textStyles,
      [styleKey]: {
        ...currentStyle,
        ...updates
      }
    };
    onUpdate({ textStyles: newTextStyles });
  };

  const [activeGroup, setActiveGroup] = useState<string | null>('content');

  const toggleGroup = (group: string) => {
    setActiveGroup(activeGroup === group ? null : group);
  };

  const isSidebar = variant === 'sidebar';

  return (
    <div className={`${isSidebar ? 'relative w-full mb-3 ' : 'absolute z-[60] group/typo'} ${className}`}>
      {isOpen ? (
        <div
          className={`${isSidebar ? 'relative w-full' : 'absolute z-50 w-64'} bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
              <span className="text-[9px] text-[var(--accent)] font-medium uppercase tracking-tighter">Text & Style</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          <div className="overflow-y-auto max-h-[60vh] custom-scrollbar">

            {/* CONTENT GROUP */}
            {onTextUpdate && (
              <div className="border-b border-zinc-800">
                <button
                  onClick={() => toggleGroup('content')}
                  className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Content</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-zinc-500 transition-transform ${activeGroup === 'content' ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {activeGroup === 'content' && (
                  <div className="p-3 pt-0 animate-in slide-in-from-top-1 duration-200">
                    <textarea
                      value={textValue || ''}
                      onChange={(e) => onTextUpdate(e.target.value)}
                      placeholder="Enter text content..."
                      rows={3}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[11px] text-zinc-200 focus:border-[var(--accent)] outline-none resize-y min-h-[60px]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TYPOGRAPHY GROUP */}
            <div className="border-b border-zinc-800">
              <button
                onClick={() => toggleGroup('typography')}
                className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors"
              >
                <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Typography</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-zinc-500 transition-transform ${activeGroup === 'typography' ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {activeGroup === 'typography' && (
                <div className="p-3 pt-0 space-y-3 animate-in slide-in-from-top-1 duration-200">
                  {/* Font Control */}
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Font Family</label>
                    <select
                      value={FONT_OPTIONS.find(f => f.family === currentStyle.font)?.name || 'Default'}
                      onChange={(e) => {
                        const font = FONT_OPTIONS.find(f => f.name === e.target.value);
                        updateStyle({ font: font?.family || undefined });
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-[var(--accent)] outline-none"
                    >
                      <option value="Default">Global Default</option>
                      {FONT_OPTIONS.map(f => (
                        <option key={f.name} value={f.name}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Global Style Link */}
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Semantic Preset</label>
                    <select
                      value={currentStyle.semanticType || ''}
                      onChange={(e) => updateStyle({ semanticType: e.target.value as any || undefined })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-zinc-300 focus:border-[var(--accent)] outline-none"
                    >
                      <option value="">Auto (Use Tag)</option>
                      <option value="h1">Header 1 (Display)</option>
                      <option value="h2">Header 2 (Large)</option>
                      <option value="h3">Header 3 (Medium)</option>
                      <option value="h4">Header 4 (Small)</option>
                      <option value="h5">Header 5 (Tiny)</option>
                      <option value="h6">Header 6 (Micro)</option>
                      <option value="body">Body / Paragraph</option>
                    </select>
                  </div>

                  {/* Manual Override Toggle */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id={`manual-override-${styleKey}`}
                      checked={currentStyle.semanticType === 'custom'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateStyle({ semanticType: 'custom' });
                        } else {
                          updateStyle({ semanticType: undefined, customSize: undefined });
                        }
                      }}
                      className="w-3 h-3 rounded border-zinc-700 accent-[var(--accent)] cursor-pointer"
                    />
                    <label
                      htmlFor={`manual-override-${styleKey}`}
                      className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest cursor-pointer select-none"
                    >
                      Fristilt (Manual Override)
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* SIZING GROUP */}
            <div className="border-b border-zinc-800">
              <button
                onClick={() => toggleGroup('sizing')}
                className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors"
              >
                <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Sizing</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-zinc-500 transition-transform ${activeGroup === 'sizing' ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {activeGroup === 'sizing' && (
                <div className="p-3 pt-0 space-y-3 animate-in slide-in-from-top-1 duration-200">
                  {/* Size (Scale) Control */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-zinc-400">Desktop Scale</span>
                        <span className="text-[10px] text-[var(--accent)] font-mono">{(currentStyle?.scale || 1.0).toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.05"
                        value={currentStyle.scale || 1.0}
                        onChange={(e) => updateStyle({ scale: parseFloat(e.target.value), customSize: undefined })}
                        className="w-full accent-[var(--accent)] cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-zinc-400">Mobile Scale</span>
                        <span className="text-[10px] text-[var(--accent)] font-mono">{(currentStyle?.scaleMobile ?? currentStyle.scale ?? 1.0).toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.05"
                        value={currentStyle.scaleMobile ?? currentStyle.scale ?? 1.0}
                        onChange={(e) => updateStyle({ scaleMobile: parseFloat(e.target.value), customSize: undefined })}
                        className="w-full accent-[var(--accent)] cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                      />
                    </div>
                  </div>

                  {/* Absolute Size Control */}
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Custom Override (px/rem)</label>
                    <input
                      type="text"
                      value={currentStyle.customSize || ''}
                      onChange={(e) => updateStyle({ customSize: e.target.value })}
                      placeholder="e.g. 24px (Overrides Scale)"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-zinc-300 focus:border-[var(--accent)] outline-none font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* APPEARANCE GROUP */}
            <div className="border-b border-zinc-800">
              <button
                onClick={() => toggleGroup('appearance')}
                className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors"
              >
                <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Appearance</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-zinc-500 transition-transform ${activeGroup === 'appearance' ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {activeGroup === 'appearance' && (
                <div className="p-3 pt-0 space-y-3 animate-in slide-in-from-top-1 duration-200">
                  {/* Color Controls */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Text Color</label>
                      <div className="flex gap-1.5">
                        <input
                          type="color"
                          value={currentStyle.color || '#ffffff'}
                          onChange={(e) => updateStyle({ color: e.target.value })}
                          className="w-6 h-6 bg-transparent border-none cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={currentStyle.color || ''}
                          onChange={(e) => updateStyle({ color: e.target.value })}
                          placeholder="#FFF"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5 text-[9px] text-zinc-300 font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Accent Color</label>
                      <div className="flex gap-1.5">
                        <input
                          type="color"
                          value={currentStyle.accent || brandData.accentColor}
                          onChange={(e) => updateStyle({ accent: e.target.value })}
                          className="w-6 h-6 bg-transparent border-none cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={currentStyle.accent || ''}
                          onChange={(e) => updateStyle({ accent: e.target.value })}
                          placeholder="Accent"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5 text-[9px] text-zinc-300 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Leading / Line Height */}
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Line Height</label>
                    <select
                      value={currentStyle.lineHeight || ''}
                      onChange={(e) => updateStyle({ lineHeight: e.target.value as any || undefined })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-zinc-300 focus:border-[var(--accent)] outline-none"
                    >
                      <option value="">Auto (Default)</option>
                      <option value="none">None (1)</option>
                      <option value="tight">Tight (1.25)</option>
                      <option value="snug">Snug (1.375)</option>
                      <option value="normal">Normal (1.5)</option>
                      <option value="relaxed">Relaxed (1.625)</option>
                      <option value="loose">Loose (2)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* UTILITIES GROUP */}
            <div className="">
              <button
                onClick={() => toggleGroup('utilities')}
                className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors"
              >
                <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Effects & Utils</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-zinc-500 transition-transform ${activeGroup === 'utilities' ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {activeGroup === 'utilities' && (
                <div className="p-3 pt-0 space-y-3 animate-in slide-in-from-top-1 duration-200">
                  {/* Glitch FX Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Text Glitch FX</span>
                    <button
                      onClick={() => updateStyle({ glitchEnabled: !currentStyle.glitchEnabled })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${currentStyle.glitchEnabled ? 'bg-[var(--accent)]' : 'bg-zinc-700'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${currentStyle.glitchEnabled ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Custom Classes Control */}
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Tailwind Classes</label>
                    <input
                      value={currentStyle.classes || ''}
                      onChange={(e) => updateStyle({ classes: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-zinc-300 focus:border-[var(--accent)] outline-none font-mono"
                      placeholder="e.g. tracking-tighter uppercase"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="p-3 border-t border-zinc-800 flex justify-end">
            <button
              onClick={() => onUpdate({ textStyles: { ...brandData.textStyles, [styleKey]: {} } })}
              className="text-[9px] text-zinc-500 hover:text-red-500 uppercase font-bold tracking-widest transition-colors flex items-center gap-1"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
              Reset Styles
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
          className={isSidebar
            ? `w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-3 rounded-lg flex items-center justify-between group transition-all`
            : `bg-black/60 hover:bg-[var(--accent)] backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20 transition-all shadow-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 duration-300 ${isOpen ? 'opacity-100' : ''}`
          }
        >
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isSidebar ? 'text-zinc-500 group-hover:text-white' : ''}><path d="M12 4v16M4 12h16" /><path d="M7 12l5 5 5-5" /></svg>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isSidebar ? 'text-zinc-400 group-hover:text-white' : ''}`}>{label}</span>
          </div>
          {isSidebar && <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover:bg-[var(--accent)] transition-colors" />}

        </button>
      )}
    </div>
  );
};
