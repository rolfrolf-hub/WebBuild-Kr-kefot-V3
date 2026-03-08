// ============================================================
// Kraakefot Module Library — Phase 1
// Low-risk visual & layout presets for all sections.
// Each module is a named partial-data patch applied via
// updateBrand + deepMerge.  No array mutations, no content
// fields — only primitive visuals/layout fields.
// ============================================================

export type ModuleCategory = 'aurora' | 'blur' | 'parallax' | 'layout';

export interface FxModule {
  id: string;
  category: ModuleCategory;
  name: string;
  description?: string;
  /** Fields to apply when this module is activated */
  patch: Record<string, any>;
  /** Fields to apply when this module is deactivated (toggled off) */
  offPatch?: Record<string, any>;
}

export interface LayoutModule {
  id: string;
  name: string;
  description?: string;
  patch: Record<string, any>;
}

// ----------------------------------------------------------------
// Detection: is a module currently active?
// A module is "active" when ALL of its patch values match the
// current data object.
// ----------------------------------------------------------------
export function isModuleActive(patch: Record<string, any>, data: any): boolean {
  if (!data) return false;
  return Object.entries(patch).every(([k, v]) => data[k] === v);
}

// ================================================================
// VISUAL FX MODULES
// ================================================================

export const VISUAL_MODULES: FxModule[] = [

  // ---- AURORA (Nordlys-effekt) ----
  {
    id: 'aurora-off',
    category: 'aurora',
    name: 'Av',
    description: 'Deaktiver aurora-effekten',
    patch: { auraEnabled: false },
  },
  {
    id: 'aurora-nordlys',
    category: 'aurora',
    name: 'Nordlys',
    description: 'Subtil nordlys, color-burn blend',
    patch: { auraEnabled: true, auraOpacity: 12, auraSpeed: 25, auraColor: '', auraBlendMode: 'color-burn' },
    offPatch: { auraEnabled: false },
  },
  {
    id: 'aurora-glow',
    category: 'aurora',
    name: 'Glød',
    description: 'Screen blend — sterkere, mer glødende',
    patch: { auraEnabled: true, auraOpacity: 22, auraSpeed: 15, auraColor: '', auraBlendMode: 'screen' },
    offPatch: { auraEnabled: false },
  },
  {
    id: 'aurora-intense',
    category: 'aurora',
    name: 'Intens',
    description: 'Overlay blend — dramatisk og tung',
    patch: { auraEnabled: true, auraOpacity: 40, auraSpeed: 8, auraColor: '', auraBlendMode: 'overlay' },
    offPatch: { auraEnabled: false },
  },
  {
    id: 'aurora-neon',
    category: 'aurora',
    name: 'Neon',
    description: 'Aksent-grønn neon-glød',
    patch: { auraEnabled: true, auraOpacity: 28, auraSpeed: 12, auraColor: '#00ff88', auraBlendMode: 'color-dodge' },
    offPatch: { auraEnabled: false },
  },

  // ---- BLUR (Linseskarphet) ----
  {
    id: 'blur-off',
    category: 'blur',
    name: 'Av',
    description: 'Deaktiver blur-effekten',
    patch: { blurEnabled: false },
  },
  {
    id: 'blur-soft',
    category: 'blur',
    name: 'Myk',
    description: 'Lett, bred blur med stor klar sone',
    patch: { blurEnabled: true, blurStrength: 4, blurRadius: 0.65 },
    offPatch: { blurEnabled: false },
  },
  {
    id: 'blur-center',
    category: 'blur',
    name: 'Senter',
    description: 'Moderat blur, senter klart',
    patch: { blurEnabled: true, blurStrength: 8, blurRadius: 0.5 },
    offPatch: { blurEnabled: false },
  },
  {
    id: 'blur-vignette',
    category: 'blur',
    name: 'Vignett',
    description: 'Tung kantblur, sterk fokus mot midten',
    patch: { blurEnabled: true, blurStrength: 15, blurRadius: 0.3 },
    offPatch: { blurEnabled: false },
  },

  // ---- PARALLAX (Scrolldybde) ----
  {
    id: 'parallax-off',
    category: 'parallax',
    name: 'Av',
    description: 'Ingen parallax-effekt',
    patch: { parallax: 0, mobileParallax: 0 },
  },
  {
    id: 'parallax-subtle',
    category: 'parallax',
    name: 'Subtil',
    description: 'Liten scrolldybde — diskret',
    patch: { parallax: 20, mobileParallax: 10 },
    offPatch: { parallax: 0, mobileParallax: 0 },
  },
  {
    id: 'parallax-normal',
    category: 'parallax',
    name: 'Normal',
    description: 'Standard parallax-dybde',
    patch: { parallax: 40, mobileParallax: 20 },
    offPatch: { parallax: 0, mobileParallax: 0 },
  },
  {
    id: 'parallax-dramatic',
    category: 'parallax',
    name: 'Dramatisk',
    description: 'Sterk, kinematisk scrolleffekt',
    patch: { parallax: 70, mobileParallax: 35 },
    offPatch: { parallax: 0, mobileParallax: 0 },
  },
];

// ================================================================
// LAYOUT MODULES
// ================================================================

export const LAYOUT_MODULES: LayoutModule[] = [
  {
    id: 'layout-compact',
    name: 'Kompakt',
    description: 'Lite luft — tett layout',
    patch: { paddingTopDesktop: 32, paddingBottomDesktop: 32, paddingTopMobile: 20, paddingBottomMobile: 20 },
  },
  {
    id: 'layout-normal',
    name: 'Normal',
    description: 'Standard padding',
    patch: { paddingTopDesktop: 80, paddingBottomDesktop: 80, paddingTopMobile: 48, paddingBottomMobile: 48 },
  },
  {
    id: 'layout-spacious',
    name: 'Romslig',
    description: 'Mye luft — luftig, åpen feel',
    patch: { paddingTopDesktop: 140, paddingBottomDesktop: 140, paddingTopMobile: 80, paddingBottomMobile: 80 },
  },
  {
    id: 'layout-fullscreen',
    name: 'Full skjerm',
    description: 'Fyller hele skjermhøyden',
    patch: { heightMode: 'screen', paddingTopDesktop: 0, paddingBottomDesktop: 0, paddingTopMobile: 0, paddingBottomMobile: 0 },
  },
  {
    id: 'layout-auto',
    name: 'Auto-høyde',
    description: 'Tilpasser seg innholdets høyde',
    patch: { heightMode: 'auto' },
  },
];

// Human-readable labels per category
export const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  aurora: 'Aurora',
  blur: 'Blur',
  parallax: 'Parallax',
  layout: 'Layout',
};
