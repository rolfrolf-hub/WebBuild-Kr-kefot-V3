import React, { useState } from 'react';
import Portal from './Portal';

export const FONT_OPTIONS = [
  { name: 'Playfair Display', family: "'Playfair Display', serif" },
  { name: 'Inter', family: "'Inter', sans-serif" },
  { name: 'Roboto', family: "'Roboto', sans-serif" },
  { name: 'Montserrat', family: "'Montserrat', sans-serif" },
  { name: 'Open Sans', family: "'Open Sans', sans-serif" },
  { name: 'Lato', family: "'Lato', sans-serif" },
  { name: 'Merriweather', family: "'Merriweather', serif" },
  { name: 'Lora', family: "'Lora', serif" },
  { name: 'Oswald', family: "'Oswald', sans-serif" },
  { name: 'Cinzel', family: "'Cinzel', serif" },
];

interface TypographyControlProps {
  brandData: any;
  onUpdate: (data: any) => void;
}

const ColorPicker = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
  <div className="flex items-center justify-between">
    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full border border-zinc-700 overflow-hidden relative">
        <input
          type="color"
          value={value || '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute -top-2 -left-2 w-10 h-10 p-0 border-0 bg-transparent cursor-pointer"
        />
      </div>
      <span className="text-[10px] text-zinc-400 font-mono">{value}</span>
    </div>
  </div>
);

const FontSelect = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
  <div>
    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{label}</label>
    <select
      value={FONT_OPTIONS.find(f => f.family === value)?.name || FONT_OPTIONS[0].name}
      onChange={(e) => {
        const font = FONT_OPTIONS.find(f => f.name === e.target.value);
        if (font) onChange(font.family);
      }}
      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-[var(--accent)] outline-none"
    >
      {FONT_OPTIONS.map(f => (
        <option key={f.name} value={f.name}>{f.name}</option>
      ))}
    </select>
  </div>
);

export const TypographyControl: React.FC<TypographyControlProps> = ({ brandData, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'General' | 'Menu' | 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6' | 'Body'>('General');

  // Fallbacks
  const h1Font = brandData.h1Font || brandData.headingFont;
  const h2Font = brandData.h2Font || brandData.headingFont;
  const h3Font = brandData.h3Font || brandData.headingFont;
  const h4Font = brandData.h4Font || brandData.headingFont;
  const h5Font = brandData.h5Font || brandData.headingFont;
  const h6Font = brandData.h6Font || brandData.headingFont;
  const bodyFont = brandData.bodyFont;

  // Safe Math for numeric values to prevent crashes

  const safeMenuOpacity = !isNaN(Number(brandData.menuOpacity)) ? Number(brandData.menuOpacity) : 0.8;
  const safeMenuTintAmount = !isNaN(Number(brandData.menuTintAmount)) ? Number(brandData.menuTintAmount) : 0.2;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-full border flex items-center gap-2 transition-all ${isOpen ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-zinc-800 bg-black text-zinc-400 hover:text-white'
          }`}
        title="Global Site Engine"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        <span className="text-[10px] font-bold uppercase tracking-widest">SITE ENGINE</span>
      </button>

      {isOpen && (
        <Portal>
          <div className="fixed inset-0 z-[9999]" onClick={() => setIsOpen(false)} />
          <div className="fixed top-20 right-8 z-[10000] w-80 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-white">
            <div className="flex border-b border-zinc-800 overflow-x-auto no-scrollbar">
              {['General', 'Menu', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Body'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-none px-4 py-3 text-[9px] font-bold uppercase tracking-widest ${activeTab === tab ? 'bg-zinc-900 text-[var(--accent)]' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-5 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
              {activeTab === 'General' && (
                <>
                  <ColorPicker label="Accent Color" value={brandData.accentColor} onChange={(val) => onUpdate({ accentColor: val })} />
                  <hr className="border-zinc-800" />
                  <p className="text-[9px] text-zinc-500 mt-2 italic text-center">Global sizing controls removed. Use individual section controls.</p>
                </>
              )}

              {activeTab === 'Menu' && (
                <>
                  <div className="space-y-6">
                    <ColorPicker label="Menu Tint Color" value={brandData.menuTintColor || brandData.accentColor} onChange={(val) => onUpdate({ menuTintColor: val })} />

                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                        <span>Menu Bar Opacity</span>
                        <span className="text-[var(--accent)]">{(safeMenuOpacity * 100).toFixed(0)}%</span>
                      </div>
                      <input type="range" min="0" max="1" step="0.05" value={safeMenuOpacity} onChange={(e) => onUpdate({ menuOpacity: parseFloat(e.target.value) })} className="w-full accent-[var(--accent)]" />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                        <span>Tint Amount</span>
                        <span className="text-[var(--accent)]">{(safeMenuTintAmount * 100).toFixed(0)}%</span>
                      </div>
                      <input type="range" min="0" max="1" step="0.05" value={safeMenuTintAmount} onChange={(e) => onUpdate({ menuTintAmount: parseFloat(e.target.value) })} className="w-full accent-[var(--accent)]" />
                      <p className="text-[9px] text-zinc-500 mt-2 italic">Controls how much of the tint color is mixed with black.</p>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'H1' && (
                <>
                  <FontSelect label="H1 Font Family" value={h1Font} onChange={(val) => onUpdate({ h1Font: val })} />
                  <ColorPicker label="H1 Color" value={brandData.h1Color || '#eae8e8'} onChange={(val) => onUpdate({ h1Color: val })} />
                </>
              )}

              {activeTab === 'H2' && (
                <>
                  <FontSelect label="H2 Font Family" value={h2Font} onChange={(val) => onUpdate({ h2Font: val })} />
                  <ColorPicker label="H2 Color" value={brandData.h2Color || '#eae8e8'} onChange={(val) => onUpdate({ h2Color: val })} />
                </>
              )}

              {activeTab === 'H3' && (
                <>
                  <FontSelect label="H3 Font Family" value={h3Font} onChange={(val) => onUpdate({ h3Font: val })} />
                  <ColorPicker label="H3 Color" value={brandData.h3Color || '#eae8e8'} onChange={(val) => onUpdate({ h3Color: val })} />
                </>
              )}

              {activeTab === 'H4' && (
                <>
                  <FontSelect label="H4 Font Family" value={h4Font} onChange={(val) => onUpdate({ h4Font: val })} />
                  <ColorPicker label="H4 Color" value={brandData.h4Color || '#eae8e8'} onChange={(val) => onUpdate({ h4Color: val })} />
                </>
              )}

              {activeTab === 'H5' && (
                <>
                  <FontSelect label="H5 Font Family" value={h5Font} onChange={(val) => onUpdate({ h5Font: val })} />
                  <ColorPicker label="H5 Color" value={brandData.h5Color || '#eae8e8'} onChange={(val) => onUpdate({ h5Color: val })} />
                </>
              )}

              {activeTab === 'H6' && (
                <>
                  <FontSelect label="H6 Font Family" value={h6Font} onChange={(val) => onUpdate({ h6Font: val })} />
                  <ColorPicker label="H6 Color" value={brandData.h6Color || '#eae8e8'} onChange={(val) => onUpdate({ h6Color: val })} />
                </>
              )}

              {activeTab === 'Body' && (
                <>
                  <FontSelect label="Body Font Family" value={bodyFont} onChange={(val) => onUpdate({ bodyFont: val })} />
                  <ColorPicker label="Body Text Color" value={brandData.bodyColor || '#eae8e8'} onChange={(val) => onUpdate({ bodyColor: val })} />
                </>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
