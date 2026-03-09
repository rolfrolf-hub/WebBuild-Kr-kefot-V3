// ==========================================
// Single Source of Truth: re-export from Zod schemas
// ==========================================
export type {
  ToneType,
  MediaType,
  SectionHeightMode,
  MediaItem,
  TextStyle,
  SectionLayout,
  SectionVisuals,
  SectionFraming,
  SectionConfig,
  HomeHero,
  HomeOrigin,
  HomeLive,
  HomeSpotify,
  HomeSections,
  AboutHero,
  AboutStory,
  AboutMission,
  AboutValues,
  AboutCta,
  AboutSections,
  ContactSection,
  FooterConfig,
  EpkSection,
  EpkHook,
  EpkPitch,
  EpkMedia,
  EpkPress,
  EpkContact,
  EpkTrack,
  EpkPressAsset,
  EpkQuote,
  SEOPageConfig,
  SEOGlobalConfig,
  ProjectState,
  MuxPlayerConfig,
  YouTubeConfig,
  SpotifyConfig,
  SoundCloudConfig,
  UniversalMediaConfig,
} from '../server/schema';

// Runtime value re-exports (needed where code iterates over enum values)
export { ToneTypeSchema } from '../server/schema';
/** All valid tone values — use instead of Object.values(ToneType) */
import { ToneTypeSchema as _ToneTypeSchema } from '../server/schema';
export const TONE_VALUES = _ToneTypeSchema.options;

// ==========================================
// Frontend-only types (no schema equivalent)
// ==========================================

export interface MediaTransform {
  scale: number;
  x: number;
  y: number;
}

// Alias for compatibility (used by ~30 components)
export type { ProjectState as BrandState } from '../server/schema';
