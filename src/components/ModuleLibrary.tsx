import React, { useState } from 'react';
import {
  VISUAL_MODULES,
  LAYOUT_MODULES,
  isModuleActive,
  FxModule,
  LayoutModule,
  ModuleCategory,
  CATEGORY_LABELS,
} from '../data/modules';

// ----------------------------------------------------------------
// Props
// ----------------------------------------------------------------
export interface ModuleLibraryProps {
  visuals: any;
  layout: any;
  onApplyVisuals: (patch: Record<string, any>) => void;
  onApplyLayout: (patch: Record<string, any>) => void;
  /** Which FX categories to show. Defaults to all. Pass a subset
   *  when a section doesn't support a given effect
   *  (e.g. gallery has no aurora → omit 'aurora'). */
  categories?: ModuleCategory[];
}

// ----------------------------------------------------------------
// Category accent colours (Tailwind JIT-safe literals)
// ----------------------------------------------------------------
const CATEGORY_ACCENT: Record<ModuleCategory, { active: string; label: string }> = {
  aurora: {
    active: 'bg-emerald-900/40 border-emerald-600/50 text-emerald-300',
    label: 'text-emerald-600',
  },
  blur: {
    active: 'bg-blue-900/40 border-blue-600/50 text-blue-300',
    label: 'text-blue-600',
  },
  parallax: {
    active: 'bg-purple-900/40 border-purple-600/50 text-purple-300',
    label: 'text-purple-600',
  },
  layout: {
    active: 'bg-amber-900/40 border-amber-600/50 text-amber-300',
    label: 'text-amber-600',
  },
};

// Category icons (inline SVG paths for zero-dependency icons)
const CATEGORY_ICONS: Record<ModuleCategory, React.ReactNode> = {
  aurora: (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z" />
    </svg>
  ),
  blur: (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="3" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  parallax: (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="17 11 12 6 7 11" /><polyline points="17 18 12 13 7 18" />
    </svg>
  ),
  layout: (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
};

const ALL_CATEGORIES: ModuleCategory[] = ['aurora', 'blur', 'parallax', 'layout'];

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export const ModuleLibrary: React.FC<ModuleLibraryProps> = ({
  visuals,
  layout,
  onApplyVisuals,
  onApplyLayout,
  categories = ALL_CATEGORIES,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const fxCategories = categories.filter((c): c is Exclude<ModuleCategory, 'layout'> => c !== 'layout');
  const showLayout = categories.includes('layout');

  const handleFxModule = (mod: FxModule) => {
    if (isModuleActive(mod.patch, visuals)) {
      // toggle off: restore to "off" state if defined
      if (mod.offPatch) onApplyVisuals(mod.offPatch);
    } else {
      onApplyVisuals(mod.patch);
    }
  };

  const handleLayoutModule = (mod: LayoutModule) => {
    // layout modules aren't toggled off — just switch between them
    onApplyLayout(mod.patch);
  };

  // Count active FX modules for badge
  const activeCount = VISUAL_MODULES.filter(
    m => categories.includes(m.category) && isModuleActive(m.patch, visuals) && m.id !== `${m.category}-off`
  ).length + LAYOUT_MODULES.filter(m => showLayout && isModuleActive(m.patch, layout)).length;

  return (
    <div className="mb-4 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Header / trigger */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900/80 hover:bg-zinc-800/80 transition-colors"
      >
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Moduler
        </span>
        <span className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="text-[9px] bg-emerald-700/50 text-emerald-300 rounded-full px-1.5 py-0.5 font-bold">
              {activeCount} aktiv
            </span>
          )}
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
            className="text-zinc-600"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div className="p-3 space-y-4 bg-zinc-950 border-t border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-150">

          {/* FX categories */}
          {fxCategories.map(cat => {
            const mods = VISUAL_MODULES.filter(m => m.category === cat);
            const accent = CATEGORY_ACCENT[cat];
            return (
              <div key={cat}>
                <p className={`text-[8px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1 ${accent.label}`}>
                  {CATEGORY_ICONS[cat]}
                  {CATEGORY_LABELS[cat]}
                </p>
                <div className="flex flex-wrap gap-1">
                  {mods.map(mod => {
                    const active = isModuleActive(mod.patch, visuals);
                    return (
                      <button
                        key={mod.id}
                        onClick={() => handleFxModule(mod)}
                        title={mod.description}
                        className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${
                          active
                            ? accent.active
                            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                        }`}
                      >
                        {active && <span className="mr-0.5 text-[8px]">✓ </span>}
                        {mod.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Layout category */}
          {showLayout && (
            <div className={fxCategories.length > 0 ? 'border-t border-zinc-800 pt-3' : ''}>
              <p className={`text-[8px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1 ${CATEGORY_ACCENT.layout.label}`}>
                {CATEGORY_ICONS.layout}
                {CATEGORY_LABELS.layout}
              </p>
              <div className="flex flex-wrap gap-1">
                {LAYOUT_MODULES.map(mod => {
                  const active = isModuleActive(mod.patch, layout);
                  return (
                    <button
                      key={mod.id}
                      onClick={() => handleLayoutModule(mod)}
                      title={mod.description}
                      className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${
                        active
                          ? CATEGORY_ACCENT.layout.active
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      {active && <span className="mr-0.5 text-[8px]">✓ </span>}
                      {mod.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Help text */}
          <p className="text-[8px] text-zinc-700 italic leading-tight">
            Klikk for å aktivere · klikk igjen for å fjerne · kombinasjoner er mulig
          </p>
        </div>
      )}
    </div>
  );
};
