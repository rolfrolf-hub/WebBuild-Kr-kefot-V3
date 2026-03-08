import React, { useState, useRef, useEffect, useCallback } from 'react';

const PRESETS_KEY = 'kraakefot-presets-v1';

interface StoredPreset {
  id: string;
  name: string;
  path: string;
  data: any;
  createdAt: number;
}

interface PresetButtonProps {
  /** Unique identifier for this data slice, used to group presets — e.g. 'home.hero' */
  path: string;
  /** Human-readable label shown in placeholder and empty state — e.g. 'Home → Hero' */
  label: string;
  /** Returns the current data snapshot to save */
  getData: () => any;
  /** Called with the saved data when user clicks restore */
  onRestore: (data: any) => void;
}

function readAll(): StoredPreset[] {
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeAll(presets: StoredPreset[]) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export const PresetButton: React.FC<PresetButtonProps> = ({ path, label, getData, onRestore }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [presets, setPresets] = useState<StoredPreset[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadPresets = useCallback(() => {
    setPresets(readAll().filter(p => p.path === path));
  }, [path]);

  useEffect(() => {
    if (isOpen) loadPresets();
  }, [isOpen, loadPresets]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSave = () => {
    const name = nameInput.trim() ||
      `${label} – ${new Date().toLocaleDateString('no-NO', { day: '2-digit', month: '2-digit', year: '2-digit' })}`;
    const preset: StoredPreset = {
      id: Date.now().toString(),
      name,
      path,
      data: getData(),
      createdAt: Date.now(),
    };
    writeAll([...readAll(), preset]);
    setNameInput('');
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1400);
    loadPresets();
  };

  const handleRestore = (preset: StoredPreset) => {
    onRestore(preset.data);
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    writeAll(readAll().filter(p => p.id !== id));
    loadPresets();
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger button — floppy disk icon */}
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(v => !v); }}
        title={`Lagre / Last inn preset: ${label}`}
        className={`p-1 rounded transition-colors ${
          isOpen ? 'text-emerald-400' : 'text-zinc-600 hover:text-zinc-400'
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl shadow-black/60 z-50 p-3 space-y-3">

          {/* --- Save section --- */}
          <div>
            <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-2">
              Lagre nåværende tilstand
            </p>
            <div className="flex gap-1.5">
              <input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder={`${label}…`}
                className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-[11px] text-zinc-200 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors"
              />
              <button
                onClick={handleSave}
                className="shrink-0 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded text-[10px] font-bold uppercase text-white transition-colors"
              >
                {savedFlash ? '✓' : 'Lagre'}
              </button>
            </div>
          </div>

          {/* --- Saved presets list --- */}
          {presets.length > 0 ? (
            <div>
              <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-2">
                Lagrede presets ({presets.length})
              </p>
              <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
                {presets
                  .slice()
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map(p => (
                    <div key={p.id} className="flex items-center gap-1 group/row">
                      <button
                        onClick={() => handleRestore(p)}
                        className="flex-1 min-w-0 text-left px-2 py-1.5 bg-zinc-800 hover:bg-emerald-900/30 border border-zinc-700 hover:border-emerald-700/60 rounded text-[11px] text-zinc-300 transition-colors"
                      >
                        <span className="block truncate">{p.name}</span>
                        <span className="text-[9px] text-zinc-600">
                          {new Date(p.createdAt).toLocaleDateString('no-NO', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        title="Slett preset"
                        className="shrink-0 p-1.5 text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover/row:opacity-100"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-zinc-700 italic text-center py-0.5">
              Ingen presets lagret for {label}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
