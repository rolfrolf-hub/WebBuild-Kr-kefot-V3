
import { z } from 'zod';

// ==========================================
// Base Enums & Types
// ==========================================

export const ToneTypeSchema = z.enum(['Minimalist', 'Playful', 'Professional', 'Bold', 'Mystical']);

export const SectionHeightModeSchema = z.enum(['auto', 'screen', 'custom']);

export const MediaTypeSchema = z.enum(['spotify', 'youtube', 'video', 'audio', 'mux', 'mux-bg', 'soundcloud']);

export const MuxPlayerConfigSchema = z.object({
    accentColor: z.string().optional(),
    primaryColor: z.string().optional().default('#ffffff'),
    secondaryColor: z.string().optional().default('#000000'),
    streamType: z.enum(['on-demand', 'live', 'll-live']).optional().default('on-demand'),
    showPlayButton: z.boolean().optional().default(true),
    showSeekButtons: z.boolean().optional().default(true),
    showMuteButton: z.boolean().optional().default(true),
    showCaptionsButton: z.boolean().optional().default(true),
    showFullscreenButton: z.boolean().optional().default(true),
    showAirplayButton: z.boolean().optional().default(true),
    showCastButton: z.boolean().optional().default(true),
    showPlaybackRateButton: z.boolean().optional().default(true),
    showVolumeRange: z.boolean().optional().default(true),
    showTimeRange: z.boolean().optional().default(true),
    showTimeDisplay: z.boolean().optional().default(true),
    showDurationDisplay: z.boolean().optional().default(true),
    autoPlay: z.enum(['off', 'muted', 'any']).optional().default('off'),
    loop: z.boolean().optional().default(false),
    startTime: z.number().optional(),
    forwardSeekOffset: z.number().optional(),
    backwardSeekOffset: z.number().optional(),
    aspectRatioDesktop: z.string().optional().default('16/9'),
    aspectRatioMobile: z.string().optional().default('16/9'),
    widthDesktop: z.string().optional().default('100%'),
    widthMobile: z.string().optional().default('100%'),
    xOffsetDesktop: z.number().optional().default(0),
    xOffsetMobile: z.number().optional().default(0),
    yOffsetDesktop: z.number().optional().default(0),
    yOffsetMobile: z.number().optional().default(0),
});

export const YouTubeConfigSchema = z.object({
    controls: z.boolean().optional().default(true),
    modestBranding: z.boolean().optional().default(true),
    autoplay: z.boolean().optional().default(false),
});

export const SpotifyConfigSchema = z.object({
    theme: z.enum(['0', '1']).optional().default('0'), // 0 = dark, 1 = light
    size: z.enum(['compact', 'normal']).optional().default('normal'),
});

export const SoundCloudConfigSchema = z.object({
    color: z.string().optional(),
    showComments: z.boolean().optional().default(false),
    showUser: z.boolean().optional().default(true),
    showTeaser: z.boolean().optional().default(false),
    autoPlay: z.boolean().optional().default(false),
});

export const UniversalMediaConfigSchema = z.object({
    mux: MuxPlayerConfigSchema.optional(),
    youtube: YouTubeConfigSchema.optional(),
    spotify: SpotifyConfigSchema.optional(),
    soundcloud: SoundCloudConfigSchema.optional(),
});

export const MediaItemSchema = z.object({
    id: z.string(),
    type: MediaTypeSchema,
    url: z.string(),
    title: z.string(),
    artist: z.string().optional(),
    thumbnail: z.string().optional(),
    thumbnailMode: z.enum(['custom', 'auto']).optional(), // 'auto' = platform thumb (YouTube/Mux) or first video frame; 'custom' = user-set thumbnail
    playingThumbnail: z.string().optional(),              // Audio only: image shown while playing; reverts to thumbnail on stop
    altText: z.string().optional(),
    mediaConfig: UniversalMediaConfigSchema.optional(),
});

export const VaultItemSchema = z.object({
    id: z.string(),
    type: z.enum(['image', 'video']),
    url: z.string(),
    title: z.string(),
    description: z.string(),
});

export const TextStyleSchema = z.object({
    font: z.string().optional(),
    scale: z.number().optional(),
    scaleMobile: z.number().optional(),
    classes: z.string().optional(),
    color: z.string().optional(),
    accent: z.string().optional(),
    lineHeight: z.enum(['none', 'tight', 'snug', 'normal', 'relaxed', 'loose']).optional(),
    glitchEnabled: z.boolean().optional(),
    semanticType: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'custom']).optional(),
    customSize: z.string().optional(),
});

// ==========================================
// Grouped State Schemas
// ==========================================

export const SectionLayoutSchema = z.object({
    heightMode: SectionHeightModeSchema,
    mobileHeightMode: SectionHeightModeSchema.optional(),
    paddingTopDesktop: z.number(),
    paddingBottomDesktop: z.number(),
    paddingTopMobile: z.number(),
    paddingBottomMobile: z.number(),
    marginBottom: z.number(),
    mobileMarginBottom: z.number(),
});

export const SectionVisualsSchema = z.object({
    saturation: z.number(),
    mobileSaturation: z.number(),
    dim: z.number(),
    mobileDim: z.number(),
    parallax: z.number(),
    mobileParallax: z.number(),
    opacity: z.number().optional(),
    mobileOpacity: z.number().optional(),
    blurEnabled: z.boolean(),
    blurStrength: z.number(),
    blurRadius: z.number(),
    playbackRate: z.number().optional().default(100), // 100 = 1.0x
    auraEnabled: z.boolean().optional().default(false),
    auraSpeed: z.number().optional().default(20),
    auraOpacity: z.number().optional().default(15),
    auraColor: z.string().optional().default(''),
    auraBlendMode: z.string().optional().default('color-burn'),
    glitchIntensity: z.number().optional().default(0), // 0 = off, 1-100
});

export const SectionFramingSchema = z.object({
    zoomDesktop: z.number().optional().default(1),
    zoomMobile: z.number().optional().default(1),
    xOffsetDesktop: z.number().optional().default(0),
    xOffsetMobile: z.number().optional().default(0),
    yOffsetDesktop: z.number().optional().default(0),
    yOffsetMobile: z.number().optional().default(0),
});

export const SectionConfigSchema = z.object({
    layout: SectionLayoutSchema,
    visuals: SectionVisualsSchema,
    framing: SectionFramingSchema.default({
        zoomDesktop: 1,
        zoomMobile: 1,
        xOffsetDesktop: 0,
        xOffsetMobile: 0,
        yOffsetDesktop: 0,
        yOffsetMobile: 0
    }),
    muxConfig: MuxPlayerConfigSchema.optional(),
    mediaConfig: UniversalMediaConfigSchema.optional(),
});

// ==========================================
// Specific Section Schemas
// ==========================================

export const HomeHeroSchema = SectionConfigSchema.extend({
    videoUrl: z.string(),
    headline: z.string(),
    subheadline: z.string(),
    ctaText: z.string(),
});

export const HomeOriginSchema = SectionConfigSchema.extend({
    imageUrl: z.string(),
    tagline: z.string(),
    headline: z.string(),
    text: z.string(),
    description: z.string(),
});

export const HomeLiveSchema = SectionConfigSchema.extend({
    videoUrl: z.string(),
    previewImageUrl: z.string(),
    framingImage: SectionFramingSchema.optional(),
    parallaxImage: z.object({ desktop: z.number(), mobile: z.number() }).optional(),
    tagline: z.string(),
    headline: z.string(),
    youtubeUrl: z.string(),
    youtubeText: z.string(),
});

export const HomeSpotifySchema = SectionConfigSchema.extend({
    url: z.string(),
    items: z.array(MediaItemSchema),
    columnsDesktop: z.number(),
    columnsMobile: z.number(),
    scaleDesktop: z.number(),
    scaleMobile: z.number(),
    gapDesktop: z.number(),
    gapMobile: z.number(),
    aspectRatioDesktop: z.string().optional(),
    aspectRatioMobile: z.string().optional(),
    imageUrl: z.string(),
    title: z.string(),
});

export const AboutHeroSchema = SectionConfigSchema.extend({
    videoUrl: z.string(),
    headline: z.string().optional().default(''),
    subheadline: z.string().optional().default(''),
    introText: z.string().optional().default(''),
});

export const AboutStorySchema = SectionConfigSchema.extend({
    tagline: z.string(),
    text: z.string(),
    imageUrl: z.string(),
});

export const AboutMissionSchema = SectionConfigSchema.extend({
    text: z.string(),
    tagline: z.string().optional().default(''),
});

export const AboutValuesSchema = SectionConfigSchema.extend({
    items: z.array(z.string()),
    descriptions: z.array(z.string()),
});

export const AboutCtaSchema = z.object({
    headline: z.string(),
    buttonText: z.string(),
});

// Sections Wrapper

export const HomeSectionsSchema = z.object({
    hero: HomeHeroSchema,
    origin: HomeOriginSchema,
    live: HomeLiveSchema,
    spotify: HomeSpotifySchema,
});

export const AboutSectionsSchema = z.object({
    hero: AboutHeroSchema,
    story: AboutStorySchema,
    mission: AboutMissionSchema,
    values: AboutValuesSchema,
    cta: AboutCtaSchema,
});

export const ContactSectionSchema = SectionConfigSchema.extend({
    videoUrl: z.string(),
    headline: z.string(),
    tagline: z.string(),
    text: z.string(),
    email: z.string(),
    addresses: z.array(z.object({ label: z.string(), address: z.string() })),
});

export const VaultSectionSchema = SectionConfigSchema.extend({
    videoUrl: z.string(),
    tagline: z.string(),
    headline: z.string(),
    description: z.string(),
    items: z.array(VaultItemSchema),
});

export const FooterConfigSchema = SectionConfigSchema.extend({
    videoUrl: z.string(),
    upperTagline: z.string().optional().default(''),
    tagline: z.string().optional().default(''),
    contactText: z.string(),
});

// ==========================================
// EPK Schema
// ==========================================

export const EpkTrackSchema = z.object({
    title: z.string(),
    description: z.string(),
    audioUrl: z.string().optional(),
    imageUrl: z.string().optional(),
});

export const EpkQuoteSchema = z.object({
    text: z.string(),
    author: z.string(),
    role: z.string(),
});

export const EpkPressAssetSchema = z.object({
    label: z.string(),
    url: z.string(),
});

export const EpkHookSchema = SectionConfigSchema.extend({
    imageUrl: z.string(),
    tagline: z.string(),
    ctaVideoUrl: z.string().optional().default(''),
    ctaSpotifyUrl: z.string().optional().default(''),
});

export const EpkPitchSchema = SectionConfigSchema.extend({
    imageUrl: z.string(),
    tagline: z.string(),
    introHeadline: z.string().optional().default(''),
    introText: z.string().optional().default(''),
    bioText: z.string(),
    keyPoints: z.array(z.string()),
    quotes: z.array(EpkQuoteSchema).optional().default([]),
});

export const EpkMediaSchema = SectionConfigSchema.extend({
    videoEmbedUrl: z.string(),
    spotifyEmbedUrl: z.string(),
    tagline: z.string(),
    tracksHeadline: z.string().optional().default('Selected Tracks'),
    videoHeadline: z.string().optional().default('Featured Video'),
    spotifyHeadline: z.string().optional().default('Listen'),
    tracks: z.array(EpkTrackSchema),
});

export const EpkPressSchema = SectionConfigSchema.extend({
    tagline: z.string(),
    headline: z.string(),
    assets: z.array(EpkPressAssetSchema),
});

export const EpkContactSchema = SectionConfigSchema.extend({
    imageUrl: z.string(),
    tagline: z.string(),
    headline: z.string(),
    email: z.string(),
    phone: z.string().optional().default(''),
});

export const EpkSectionSchema = z.object({
    hook: EpkHookSchema,
    pitch: EpkPitchSchema,
    media: EpkMediaSchema,
    press: EpkPressSchema,
    contact: EpkContactSchema,
});

// ==========================================
// Master Project Schema
// ==========================================

export const SEOPageConfigSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
});

export const SEOGlobalConfigSchema = z.object({
    siteName: z.string(),
    favicon: z.string().optional(),
    twitterHandle: z.string().optional(),
    robotsTxt: z.string().optional(),
});

export const ProjectStateSchema = z.object({
    meta: z.object({
        lastModified: z.number(),
        version: z.string(),
    }).optional(),

    // System
    isMobilePreview: z.boolean(),
    geminiApiKey: z.string().optional(),

    // Config
    ftpUser: z.string(),
    ftpPass: z.string(),
    serverBaseUrl: z.string(),
    savedAssets: z.array(z.string()),

    // Theme
    companyName: z.string(),
    tone: ToneTypeSchema,
    accentColor: z.string(),

    // Typography
    headingFont: z.string(),
    bodyFont: z.string(),
    headingScale: z.number().optional().default(1),
    bodyScale: z.number().optional().default(1),
    h1Font: z.string().optional(),
    h2Font: z.string().optional(),
    h3Font: z.string().optional(),
    h4Font: z.string().optional(),
    h5Font: z.string().optional(),
    h6Font: z.string().optional(),

    // Colors
    bodyColor: z.string().optional(),
    h1Color: z.string().optional(),
    h2Color: z.string().optional(),
    h3Color: z.string().optional(),
    h4Color: z.string().optional(),
    h5Color: z.string().optional(),
    h6Color: z.string().optional(),

    // Per-element Styles
    textStyles: z.record(z.string(), TextStyleSchema),

    // Navigation
    menuLogoName: z.string(),
    menuTagline: z.string(),
    navNames: z.object({
        home: z.string(),
        about: z.string(),
        contact: z.string(),
        portfolio: z.string(),
        lab: z.string(),
        vault: z.string().optional(),
        epk: z.string().optional(),
    }),
    menuOpacity: z.number().optional(),
    menuTintColor: z.string().optional(),
    menuTintAmount: z.number().optional(),
    menuOverlayBlur: z.number().optional().default(5),
    menuOverlayBrightness: z.number().optional().default(95),
    menuOverlayOpacity: z.number().optional().default(5),
    menuOverlayColor: z.string().optional().default('#000000'),
    isVaultVisible: z.boolean().optional(),

    // Page Visibility (for publish/nav control)
    pageVisibility: z.object({
        home: z.boolean().optional().default(true),
        about: z.boolean().optional().default(true),
        contact: z.boolean().optional().default(true),
        vault: z.boolean().optional().default(false),
        epk: z.boolean().optional().default(false),
    }).optional().default(() => ({ home: true, about: true, contact: true, vault: false, epk: false })),

    // Socials
    socials: z.object({
        youtubeUrl: z.string().optional(),
        soundcloudUrl: z.string().optional(),
        appleUrl: z.string().optional(),
        spotifyUrl: z.string().optional(),
        instagramUrl: z.string().optional(),
        xUrl: z.string().optional(),
        facebookUrl: z.string().optional(),
    }),

    // Sections
    sections: z.object({
        home: HomeSectionsSchema,
        about: AboutSectionsSchema,
        contact: ContactSectionSchema,
        vault: VaultSectionSchema,
        footer: FooterConfigSchema,
        epk: EpkSectionSchema.optional(),
    }),

    // Shared Data
    team: z.array(z.object({
        name: z.string(),
        role: z.string(),
        image: z.string(),
    })).optional(),

    mediaImgSizeDesktop: z.number(),
    mediaImgSizeMobile: z.number(),
    socialIconSize: z.number().optional().default(24),

    // SEO
    seo: z.object({
        global: SEOGlobalConfigSchema,
        pages: z.record(z.string(), SEOPageConfigSchema),
    }),
});

// ==========================================
// Inferred TypeScript Types
// ==========================================

export type ToneType = z.infer<typeof ToneTypeSchema>;
export type MediaType = z.infer<typeof MediaTypeSchema>;
export type SectionHeightMode = z.infer<typeof SectionHeightModeSchema>;
export type MediaItem = z.infer<typeof MediaItemSchema>;
export type VaultItem = z.infer<typeof VaultItemSchema>;
export type TextStyle = z.infer<typeof TextStyleSchema>;

export type SectionLayout = z.infer<typeof SectionLayoutSchema>;
export type SectionVisuals = z.infer<typeof SectionVisualsSchema>;
export type SectionFraming = z.infer<typeof SectionFramingSchema>;
export type SectionConfig = z.infer<typeof SectionConfigSchema>;
export type MuxPlayerConfig = z.infer<typeof MuxPlayerConfigSchema>;
export type YouTubeConfig = z.infer<typeof YouTubeConfigSchema>;
export type SpotifyConfig = z.infer<typeof SpotifyConfigSchema>;
export type SoundCloudConfig = z.infer<typeof SoundCloudConfigSchema>;
export type UniversalMediaConfig = z.infer<typeof UniversalMediaConfigSchema>;

export type HomeHero = z.infer<typeof HomeHeroSchema>;
export type HomeOrigin = z.infer<typeof HomeOriginSchema>;
export type HomeLive = z.infer<typeof HomeLiveSchema>;
export type HomeSpotify = z.infer<typeof HomeSpotifySchema>;
export type HomeSections = z.infer<typeof HomeSectionsSchema>;

export type AboutHero = z.infer<typeof AboutHeroSchema>;
export type AboutStory = z.infer<typeof AboutStorySchema>;
export type AboutMission = z.infer<typeof AboutMissionSchema>;
export type AboutValues = z.infer<typeof AboutValuesSchema>;
export type AboutCta = z.infer<typeof AboutCtaSchema>;
export type AboutSections = z.infer<typeof AboutSectionsSchema>;

export type ContactSection = z.infer<typeof ContactSectionSchema>;
export type VaultSection = z.infer<typeof VaultSectionSchema>;
export type FooterConfig = z.infer<typeof FooterConfigSchema>;
export type EpkSection = z.infer<typeof EpkSectionSchema>;
export type EpkHook = z.infer<typeof EpkHookSchema>;
export type EpkPitch = z.infer<typeof EpkPitchSchema>;
export type EpkMedia = z.infer<typeof EpkMediaSchema>;
export type EpkPress = z.infer<typeof EpkPressSchema>;
export type EpkContact = z.infer<typeof EpkContactSchema>;
export type EpkTrack = z.infer<typeof EpkTrackSchema>;
export type EpkPressAsset = z.infer<typeof EpkPressAssetSchema>;
export type EpkQuote = z.infer<typeof EpkQuoteSchema>;

export type SEOPageConfig = z.infer<typeof SEOPageConfigSchema>;
export type SEOGlobalConfig = z.infer<typeof SEOGlobalConfigSchema>;

export type ProjectState = z.infer<typeof ProjectStateSchema>;
