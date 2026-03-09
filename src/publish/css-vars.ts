/**
 * src/publish/css-vars.ts
 *
 * Generates only the dynamic, brand-specific CSS custom properties.
 * All Tailwind utility classes and static custom components (btn-glass, glitch, etc.)
 * live in src/style.css and are compiled by Vite — no manual duplication here.
 *
 * Output: ~150 lines of :root { } variables + mobile overrides.
 * Used in generatePageHTML as <style>${generateCSSVars(brandData)}</style>.
 */

import { BrandState } from '../types';

// ── Helpers (identical to the ones in generateGlobalCSS) ─────────────────────

function hexToRgb(hex: string): string {
  if (!hex || typeof hex !== 'string') return '69 150 148';
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length !== 6) return '69 150 148';
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function getFramingCss(prefix: string, zoom: number = 1, x: number = 0, y: number = 0): string {
  return `--${prefix}-zoom: ${zoom || 1}; --${prefix}-x: ${x || 0}%; --${prefix}-y: ${y || 0}%;`;
}

function getMuxPropsCss(prefix: string, width: string | number = '100%', x: string | number = 0, y: string | number = 0): string {
  const scaleValue = parseFloat(width as string) / 100 || 1;
  return `--${prefix}-scale: ${scaleValue}; --${prefix}-trans-x: ${x || 0}%; --${prefix}-trans-y: ${y || 0}%;`;
}

function getAtomicSpacing(cssPrefix: string, sectionData: any): string {
  const layout = sectionData?.layout || {};
  const ptD = layout.paddingTopDesktop ?? 4;
  const pbD = layout.paddingBottomDesktop ?? 4;
  const ptM = layout.paddingTopMobile ?? 2;
  const pbM = layout.paddingBottomMobile ?? 2;
  const mode = layout.heightMode || 'auto';
  const mobileMode = layout.mobileHeightMode ?? mode;
  const minH = mode === 'screen' ? '100dvh' : 'auto';
  const mobileMinH = mobileMode === 'screen' ? '100dvh' : 'auto';
  return `
        --${cssPrefix}-pt: ${ptD}rem;
        --${cssPrefix}-pb: ${pbD}rem;
        --${cssPrefix}-min-h: ${minH};
        @media (max-width: 768px) {
          :root {
            --${cssPrefix}-pt: ${ptM}rem;
            --${cssPrefix}-pb: ${pbM}rem;
            --${cssPrefix}-min-h: ${mobileMinH};
          }
        }`;
}

function getHeaderBg(brandData: BrandState): string {
  const opacity = brandData.menuOpacity ?? 0.4;
  const tintColor = brandData.menuTintColor || brandData.accentColor || '#000000';
  const tintAmount = brandData.menuTintAmount ?? 0.1;
  const rgb = hexToRgb(tintColor).split(' ').map(Number);
  const r = Math.round(rgb[0] * tintAmount + 10);
  const g = Math.round(rgb[1] * tintAmount + 10);
  const b = Math.round(rgb[2] * tintAmount + 10);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generates the dynamic CSS custom properties for a brand.
 * Returns a CSS string suitable for embedding in a <style> tag.
 * Contains ONLY :root variables — no Tailwind utilities (those come from style.css).
 */
export function generateCSSVars(brandData: BrandState): string {
  const accentRgb = hexToRgb(brandData.accentColor);

  const s = brandData.sections;
  const hHero   = s.home.hero;
  const hOrigin = s.home.origin;
  const hLive   = s.home.live;
  const hSpot   = s.home.spotify;
  const aHero   = s.about.hero;
  const aStory  = s.about.story;
  const aMission = s.about.mission;
  const aValues  = s.about.values;
  const contact  = s.contact;
  const footer   = s.footer;
  const epk      = s.epk;

  const safeDiv = (num: number, div: number) => (div === 0 ? 0 : num / div);
  const mobileMediaWidth  = safeDiv(brandData.mediaImgSizeMobile, hSpot.columnsMobile);
  const desktopMediaWidth = safeDiv(brandData.mediaImgSizeDesktop, hSpot.columnsDesktop);

  // Typography text-style variables (per-key scale, color, line-height, font-family)
  const textStyleVars = Object.entries(brandData.textStyles || {}).map(([key, style]) => {
    const scale = style.scale || 1.0;
    const scaleMobile = style.scaleMobile ?? scale;
    const scaleVar = `--scale-${key}: ${scale};`;
    const mobileOverride = scaleMobile !== scale
      ? `\n@media (max-width: 768px) { :root { --scale-${key}: ${scaleMobile}; } }`
      : '';
    const colorVar = style.color ? `--color-${key}: ${style.color};` : '';
    const lhMap: Record<string, string> = {
      none: '1', tight: '1.25', snug: '1.375', normal: '1.5', relaxed: '1.625', loose: '2',
    };
    const lhRaw = style.lineHeight || 'inherit';
    const lhVal = lhMap[lhRaw] || lhRaw;
    const lhVar = `--lh-${key}: ${lhVal};`;
    let fontVal = 'inherit';
    if (style.font) fontVal = style.font;
    else if (style.semanticType) fontVal = `var(--font-${style.semanticType})`;
    const fontVar = `--font-fam-${key}: ${fontVal};`;
    return `${scaleVar}${mobileOverride}\n${colorVar}\n${lhVar}\n${fontVar}`;
  }).join('\n');

  return `:root {
  --scroll-y: 0;
  --accent: ${brandData.accentColor};
  --accent-light: color-mix(in srgb, ${brandData.accentColor}, white 25%);
  --accent-rgb: ${accentRgb};
  --font-h1: ${brandData.h1Font || brandData.headingFont || "'Playfair Display', serif"};
  --font-h2: ${brandData.h2Font || brandData.headingFont || "'Playfair Display', serif"};
  --font-h3: ${brandData.h3Font || brandData.headingFont || "'Playfair Display', serif"};
  --font-h4: ${brandData.h4Font || brandData.headingFont || "'Playfair Display', serif"};
  --font-h5: ${brandData.h5Font || brandData.headingFont || "'Playfair Display', serif"};
  --font-h6: ${brandData.h6Font || brandData.headingFont || "'Playfair Display', serif"};
  --font-body: ${brandData.bodyFont || "'Montserrat', sans-serif"};

  /* Header */
  --header-bg: ${getHeaderBg(brandData)};
  --header-h: 6rem;
  --header-px: 2rem;
  --header-py: 1.5rem;
  --menu-overlay-blur: ${brandData.menuOverlayBlur ?? 5}px;
  --menu-overlay-brightness: ${brandData.menuOverlayBrightness ?? 95}%;
  --menu-overlay-color: rgba(${hexToRgb(brandData.menuOverlayColor || '#000000').split(' ').join(', ')}, ${(brandData.menuOverlayOpacity ?? 5) / 100});

  /* Atomic Spacing & Heights */
  ${getAtomicSpacing('hero',           hHero)}
  ${getAtomicSpacing('origin',         hOrigin)}
  ${getAtomicSpacing('live',           hLive)}
  ${getAtomicSpacing('spotify',        hSpot)}
  ${getAtomicSpacing('about-hero',     aHero)}
  ${getAtomicSpacing('story',          aStory)}
  ${getAtomicSpacing('mission',        aMission)}
  ${getAtomicSpacing('about-values',   aValues)}
  ${getAtomicSpacing('contact',        contact)}
  ${getAtomicSpacing('footer-section', footer)}
  ${epk ? getAtomicSpacing('epk-hook',     epk.hook)    : ''}
  ${epk ? getAtomicSpacing('epk-pitch',    epk.pitch)   : ''}
  ${epk ? getAtomicSpacing('epk-media',    epk.media)   : ''}
  ${epk ? getAtomicSpacing('epk-press',    epk.press)   : ''}
  ${epk ? getAtomicSpacing('epk-contact',  epk.contact) : ''}

  --media-aspect-ratio: ${hSpot.aspectRatioMobile || '1/1'};
  --media-scale: ${hSpot.scaleMobile || 1};

  /* Fluid Typography */
  --fs-display: ${(brandData as any).h1SizeDesktop ? `${(brandData as any).h1SizeDesktop}rem` : 'clamp(2.5rem, 5vw + 1rem, 8rem)'};
  --fs-h1: ${(brandData as any).h2SizeDesktop ? `${(brandData as any).h2SizeDesktop}rem` : 'clamp(2rem, 4vw + 1rem, 6rem)'};
  --fs-h2: ${(brandData as any).h3SizeDesktop ? `${(brandData as any).h3SizeDesktop}rem` : 'clamp(1.5rem, 3vw + 1rem, 4.5rem)'};
  --fs-h3: ${(brandData as any).h4SizeDesktop ? `${(brandData as any).h4SizeDesktop}rem` : 'clamp(1.25rem, 2vw + 1rem, 3rem)'};
  --fs-h4: ${(brandData as any).h5SizeDesktop ? `${(brandData as any).h5SizeDesktop}rem` : 'clamp(1.1rem, 1.5vw + 0.5rem, 1.75rem)'};
  --fs-h5: ${(brandData as any).h6SizeDesktop ? `${(brandData as any).h6SizeDesktop}rem` : 'clamp(0.95rem, 1.2vw + 0.4rem, 1.25rem)'};
  --fs-body: ${(brandData as any).bodySizeDesktop ? `${(brandData as any).bodySizeDesktop}rem` : 'clamp(0.875rem, 1vw + 0.5rem, 1.125rem)'};

  /* Heading Colors */
  --color-h1: ${(brandData as any).h1Color || '#eae8e8'};
  --color-h2: ${(brandData as any).h2Color || '#eae8e8'};
  --color-h3: ${(brandData as any).h3Color || '#eae8e8'};
  --color-h4: ${(brandData as any).h4Color || '#eae8e8'};
  --color-h5: ${(brandData as any).h5Color || '#eae8e8'};
  --color-h6: ${(brandData as any).h6Color || '#eae8e8'};
  --color-body: ${(brandData as any).bodyColor || '#eae8e8'};

  /* Desktop Framing */
  ${getFramingCss('hero',       hHero.framing.zoomDesktop,   hHero.framing.xOffsetDesktop,   hHero.framing.yOffsetDesktop)}
  ${getFramingCss('origin',     hOrigin.framing.zoomDesktop, hOrigin.framing.xOffsetDesktop, hOrigin.framing.yOffsetDesktop)}
  ${getFramingCss('live',       hLive.framing.zoomDesktop,   hLive.framing.xOffsetDesktop,   hLive.framing.yOffsetDesktop)}
  ${getFramingCss('live-image', (hLive.framingImage || hLive.framing).zoomDesktop, (hLive.framingImage || hLive.framing).xOffsetDesktop, (hLive.framingImage || hLive.framing).yOffsetDesktop)}
  ${getFramingCss('footer',     footer.framing.zoomDesktop,  footer.framing.xOffsetDesktop,  footer.framing.yOffsetDesktop)}
  ${getFramingCss('contact',    contact.framing.zoomDesktop, contact.framing.xOffsetDesktop, contact.framing.yOffsetDesktop)}
  ${getFramingCss('story',      aStory.framing.zoomDesktop,  aStory.framing.xOffsetDesktop,  aStory.framing.yOffsetDesktop)}
  ${getFramingCss('about-hero', aHero.framing.zoomDesktop,   aHero.framing.xOffsetDesktop,   aHero.framing.yOffsetDesktop)}
  ${getMuxPropsCss('live-mux',  hLive.mediaConfig?.mux?.widthDesktop, hLive.mediaConfig?.mux?.xOffsetDesktop, (hLive.mediaConfig?.mux as any)?.yOffsetDesktop)}

  /* Visuals */
  --hero-sat: ${hHero.visuals.saturation}%;   --hero-dim: ${hHero.visuals.dim / 100};   --hero-para: ${hHero.visuals.parallax};   --hero-op: ${(hHero.visuals.opacity ?? 100) / 100};
  --origin-sat: ${hOrigin.visuals.saturation}%; --origin-dim: ${hOrigin.visuals.dim / 100}; --origin-para: ${hOrigin.visuals.parallax}; --origin-op: ${(hOrigin.visuals.opacity ?? 100) / 100};
  --live-sat: ${hLive.visuals.saturation}%;   --live-dim: ${hLive.visuals.dim / 100};   --live-para: ${hLive.visuals.parallax};   --live-op: ${(hLive.visuals.opacity ?? 100) / 100};
  --live-image-sat: ${hLive.visuals.saturation}%; --live-image-dim: ${hLive.visuals.dim / 100}; --live-image-para: ${(hLive.parallaxImage?.desktop ?? hLive.visuals.parallax)}; --live-image-op: ${(hLive.visuals.opacity ?? 100) / 100};
  --spotify-sat: ${hSpot.visuals.saturation}%; --spotify-dim: ${hSpot.visuals.dim / 100}; --spotify-para: ${hSpot.visuals.parallax}; --spotify-op: ${(hSpot.visuals.opacity ?? 100) / 100};
  --about-hero-sat: ${aHero.visuals.saturation}%; --about-hero-dim: ${aHero.visuals.dim / 100}; --about-hero-para: ${aHero.visuals.parallax}; --about-hero-op: ${(aHero.visuals.opacity ?? 100) / 100};
  --story-sat: ${aStory.visuals.saturation}%; --story-dim: ${aStory.visuals.dim / 100}; --story-para: ${aStory.visuals.parallax}; --story-op: ${(aStory.visuals.opacity ?? 100) / 100};
  --footer-sat: ${footer.visuals.saturation}%; --footer-dim: ${footer.visuals.dim / 100}; --footer-para: ${footer.visuals.parallax}; --footer-op: ${(footer.visuals.opacity ?? 100) / 100};
  --contact-sat: ${contact.visuals.saturation}%; --contact-dim: ${contact.visuals.dim / 100}; --contact-para: ${contact.visuals.parallax}; --contact-op: ${(contact.visuals.opacity ?? 100) / 100};
  ${epk ? `
  --epk-hook-sat: ${epk.hook.visuals.saturation}%; --epk-hook-dim: ${epk.hook.visuals.dim / 100}; --epk-hook-para: ${epk.hook.visuals.parallax}; --epk-hook-op: ${(epk.hook.visuals.opacity ?? 100) / 100}; --epk-hook-margin: ${epk.hook.layout.marginBottom ?? 0}px;
  --epk-hook-aura-op: ${(epk.hook.visuals.auraOpacity ?? 15) / 100}; --epk-hook-aura-speed: ${epk.hook.visuals.auraSpeed ?? 20}s; --epk-hook-aura-blend: ${epk.hook.visuals.auraBlendMode || 'screen'}; --epk-hook-aura-display: ${epk.hook.visuals.auraEnabled ? 'block' : 'none'};
  --epk-hook-glitch: ${(epk.hook.visuals.glitchIntensity ?? 0) / 100};
  ${epk.hook.visuals.auraColor ? `--epk-hook-aura-color: ${epk.hook.visuals.auraColor};` : ''}
  --epk-pitch-sat: ${epk.pitch.visuals.saturation}%; --epk-pitch-dim: ${epk.pitch.visuals.dim / 100}; --epk-pitch-para: ${epk.pitch.visuals.parallax}; --epk-pitch-op: ${(epk.pitch.visuals.opacity ?? 100) / 100}; --epk-pitch-margin: ${epk.pitch.layout.marginBottom ?? 0}px;
  --epk-media-sat: ${epk.media.visuals?.saturation ?? 100}%; --epk-media-margin: ${epk.media.layout.marginBottom ?? 0}px;
  --epk-contact-sat: ${epk.contact.visuals.saturation}%; --epk-contact-dim: ${epk.contact.visuals.dim / 100}; --epk-contact-para: ${epk.contact.visuals.parallax}; --epk-contact-op: ${(epk.contact.visuals.opacity ?? 100) / 100}; --epk-contact-margin: ${epk.contact.layout.marginBottom ?? 0}px;
  --epk-contact-glitch: ${(epk.contact.visuals.glitchIntensity ?? 0) / 100};
  --epk-contact-aura-op: ${(epk.contact.visuals.auraOpacity ?? 15) / 100}; --epk-contact-aura-speed: ${epk.contact.visuals.auraSpeed ?? 20}s; --epk-contact-aura-blend: ${epk.contact.visuals.auraBlendMode || 'screen'}; --epk-contact-aura-display: ${epk.contact.visuals.auraEnabled ? 'block' : 'none'};
  ${epk.contact.visuals.auraColor ? `--epk-contact-aura-color: ${epk.contact.visuals.auraColor};` : ''}
  ${getFramingCss('epk-hook',    epk.hook.framing?.zoomDesktop,    epk.hook.framing?.xOffsetDesktop,    epk.hook.framing?.yOffsetDesktop)}
  ${getFramingCss('epk-pitch',   epk.pitch.framing?.zoomDesktop,   epk.pitch.framing?.xOffsetDesktop,   epk.pitch.framing?.yOffsetDesktop)}
  ${getFramingCss('epk-contact', epk.contact.framing?.zoomDesktop, epk.contact.framing?.xOffsetDesktop, epk.contact.framing?.yOffsetDesktop)}
  ` : ''}

  /* Text Style Overrides */
  ${textStyleVars}

  /* Section Margins */
  --hero-margin: ${hHero.layout.marginBottom}px;
  --origin-margin: ${hOrigin.layout.marginBottom}px;
  --live-margin: ${hLive.layout.marginBottom}px;
  --spotify-margin: ${hSpot.layout.marginBottom}px;
  --about-hero-margin: ${aHero.layout.marginBottom}px;
  --story-margin: ${aStory.layout.marginBottom}px;
  --about-mission-margin: ${aMission.layout.marginBottom}px;
  --about-values-margin: ${aValues.layout.marginBottom}px;
  --footer-margin: ${footer.layout.marginBottom}px;

  --fs-hero-mobile: 2.25rem;
  --fs-hero-desktop: 8rem;
  --heading-scale: 1;
  --body-scale: 1;
  --media-width: ${mobileMediaWidth}%;
  --media-gap: ${hSpot.gapMobile * 4}px;
}

@media (max-width: 768px) {
  :root {
    --header-h: 5rem;
    --header-px: 1rem;
    --header-py: 1rem;
    --media-width: ${mobileMediaWidth}%;
    --media-gap: ${hSpot.gapMobile * 4}px;
    --media-aspect-ratio: ${hSpot.aspectRatioMobile || '1/1'};
    --media-scale: ${hSpot.scaleMobile || 1};
  }
}

@media (min-width: 769px) {
  :root {
    --media-width: ${desktopMediaWidth}%;
    --media-gap: ${hSpot.gapDesktop * 4}px;
    --media-aspect-ratio: ${hSpot.aspectRatioDesktop || '16/9'};
    --media-scale: ${hSpot.scaleDesktop || 1};
    /* Desktop Framing Overrides */
    ${getFramingCss('hero',       hHero.framing.zoomDesktop,   hHero.framing.xOffsetDesktop,   hHero.framing.yOffsetDesktop)}
    ${getFramingCss('origin',     hOrigin.framing.zoomDesktop, hOrigin.framing.xOffsetDesktop, hOrigin.framing.yOffsetDesktop)}
    ${getFramingCss('live',       hLive.framing.zoomDesktop,   hLive.framing.xOffsetDesktop,   hLive.framing.yOffsetDesktop)}
    ${getFramingCss('footer',     footer.framing.zoomDesktop,  footer.framing.xOffsetDesktop,  footer.framing.yOffsetDesktop)}
    ${getFramingCss('contact',    contact.framing.zoomDesktop, contact.framing.xOffsetDesktop, contact.framing.yOffsetDesktop)}
    ${getFramingCss('about-hero', aHero.framing.zoomDesktop,   aHero.framing.xOffsetDesktop,   aHero.framing.yOffsetDesktop)}
    ${getFramingCss('story',      aStory.framing.zoomDesktop,  aStory.framing.xOffsetDesktop,  aStory.framing.yOffsetDesktop)}
    --hero-sat: ${hHero.visuals.saturation}%;   --hero-dim: ${hHero.visuals.dim / 100};   --hero-para: ${hHero.visuals.parallax};
    --origin-sat: ${hOrigin.visuals.saturation}%; --origin-dim: ${hOrigin.visuals.dim / 100}; --origin-para: ${hOrigin.visuals.parallax};
    --live-sat: ${hLive.visuals.saturation}%;   --live-dim: ${hLive.visuals.dim / 100};   --live-para: ${hLive.visuals.parallax};
    --story-sat: ${aStory.visuals.saturation}%; --story-dim: ${aStory.visuals.dim / 100}; --story-para: ${aStory.visuals.parallax};
    --about-hero-sat: ${aHero.visuals.saturation}%; --about-hero-dim: ${aHero.visuals.dim / 100}; --about-hero-para: ${aHero.visuals.parallax};
  }
}`;
}
