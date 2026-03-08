import { BrandState, MediaItem, TextStyle } from '../../types';
import { FONT_OPTIONS } from '../TypographyControl';
import { getEmbedUrl, extractMuxId } from '../../utils/mediaHelpers';

export type PageKey = 'home' | 'about' | 'contact' | 'vault' | 'epk';

export const generateMetaTags = (page: PageKey, brandData: BrandState) => {
  const global = brandData.seo?.global || { siteName: brandData.companyName };
  const pageSeo = brandData.seo?.pages?.[page] || {};

  const title = pageSeo.title || `${brandData.companyName} | ${page.charAt(0).toUpperCase() + page.slice(1)}`;
  const description = pageSeo.description || "Digital opplevelse fra Kråkefot";
  const url = `${brandData.serverBaseUrl}/${page === 'home' ? '' : page + '.html'}`;
  const image = pageSeo.ogImage || brandData.sections.home.hero.videoUrl.replace(/\.(mp4|mov|webm)$/i, '.jpg'); // Fallback logic

  // Preload Hero media — image gets preload link, video gets preload link for faster start
  const heroUrl = brandData.sections.home.hero.videoUrl;
  const isHeroVideo = /\.(mp4|mov|webm|m4v)$/i.test(heroUrl);
  const preloadTag = isHeroVideo
    ? `<link rel="preload" as="video" href="${heroUrl}" type="video/mp4">`
    : `<link rel="preload" as="image" href="${heroUrl}">`;

  return `
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${url}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    ${preloadTag}
    <meta property="og:site_name" content="${global.siteName}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${url}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="${image}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    ${global.favicon ? `<link rel="icon" href="${global.favicon}" type="image/x-icon">` : ''}
  `;
};

export const generateJsonLd = (page: PageKey, brandData: BrandState) => {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MusicGroup",
        "name": brandData.companyName,
        "url": brandData.serverBaseUrl,
        "logo": brandData.savedAssets[0] || "",
        "image": brandData.savedAssets[0] || "",
        "genre": ["Alternative Rock", "Progressive Rock"],
        "sameAs": Object.values(brandData.socials).filter(Boolean)
      },
      {
        "@type": "WebSite",
        "name": brandData.companyName,
        "url": brandData.serverBaseUrl,
      }
    ]
  };
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
};

export const generateSitemap = (brandData: BrandState) => {
  const baseUrl = brandData.serverBaseUrl.replace(/\/$/, '');
  const date = new Date().toISOString().split('T')[0];
  const vis = brandData.pageVisibility || { home: true, about: true, contact: true, vault: brandData.isVaultVisible ?? false, epk: false };

  let urls = `
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`;

  if (vis.about !== false) {
    urls += `
  <url>
    <loc>${baseUrl}/about.html</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  if (vis.contact !== false) {
    urls += `
  <url>
    <loc>${baseUrl}/contact.html</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  if (vis.vault) {
    urls += `
  <url>
    <loc>${baseUrl}/vault.html</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }

  if (vis.epk) {
    urls += `
  <url>
    <loc>${baseUrl}/epk.html</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
};

export const generateRobots = (brandData: BrandState) => {
  return brandData.seo?.global?.robotsTxt || "User-agent: *\nAllow: /";
};

export const generateHtaccess = () => `
# Kråkefot Builder Routes
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\\.html$ - [L]
RewriteRule ^about/?$ about.html [L]
RewriteRule ^contact/?$ contact.html [L]
RewriteRule ^vault/?$ vault.html [L]
RewriteRule ^epk/?$ epk.html [L]
</IfModule>

# CACHE-BUSTING & COMPRESSION
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType video/mp4 "access plus 1 year"
  ExpiresByType video/x-m4v "access plus 1 year"
  AddType video/mp4 .mp4 .m4v .mov
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresDefault "access plus 2 days"
</IfModule>
<FilesMatch "\\.(html|htm)$">
  Header set Cache-Control "no-cache, no-store, must-revalidate"
  Header set Pragma "no-cache"
  Header set Expires 0
</FilesMatch>
`;

export const generateGlobalCSS = (brandData: BrandState, isScoped = false) => {
  const hexToRgb = (hex: string) => {
    if (!hex || typeof hex !== 'string') return '69 150 148';
    const cleanHex = hex.split('#').join('').trim();
    if (cleanHex.length !== 6) return '69 150 148';
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `${r} ${g} ${b}`;
  };

  const accentRgb = hexToRgb(brandData.accentColor);

  const getFramingCss = (prefix: string, zoom: number = 1, x: number = 0, y: number = 0) => {
    return `--${prefix}-zoom: ${zoom || 1}; --${prefix}-x: ${x || 0}%; --${prefix}-y: ${y || 0}%;`;
  };

  const getMuxPropsCss = (prefix: string, width: string | number = '100%', x: string | number = 0, y: string | number = 0) => {
    // Width slider goes from 10 to 200+. We translate that to a CSS scale value (e.g. 150% -> 1.5)
    const scaleValue = parseFloat(width as string) / 100 || 1;
    return `--${prefix}-scale: ${scaleValue}; --${prefix}-trans-x: ${x || 0}%; --${prefix}-trans-y: ${y || 0}%;`;
  };

  // Helper to access section layout safely
  const getLayout = (section: any) => section?.layout || {};

  const getAtomicSpacing = (statePrefix: string, cssPrefix: string, sectionData: any) => {
    const layout = getLayout(sectionData);
    const ptD = layout.paddingTopDesktop ?? 4;
    const pbD = layout.paddingBottomDesktop ?? 4;
    const ptM = layout.paddingTopMobile ?? 2;
    const pbM = layout.paddingBottomMobile ?? 2;
    const mode = layout.heightMode || 'auto';
    const mobileMode = layout.mobileHeightMode ?? mode; // Fallback to desktop if not set
    const minH = mode === 'screen' ? '100dvh' : 'auto';
    const mobileMinH = mobileMode === 'screen' ? '100dvh' : 'auto';

    return `
          --${cssPrefix}-pt: ${ptD}rem;
          --${cssPrefix}-pb: ${pbD}rem;
          --${cssPrefix}-min-h: ${minH};
          @media (max-width: 768px) {
            --${cssPrefix}-pt: ${ptM}rem;
            --${cssPrefix}-pb: ${pbM}rem;
            --${cssPrefix}-min-h: ${mobileMinH};
          }
        `;
  };

  const getHeaderBg = (brandData: BrandState) => {
    const opacity = brandData.menuOpacity ?? 0.4;
    const tintColor = brandData.menuTintColor || brandData.accentColor || '#000000';
    const tintAmount = brandData.menuTintAmount ?? 0.1;
    const rgb = hexToRgb(tintColor).split(' ').map(Number);
    const r = Math.round(rgb[0] * tintAmount + 10);
    const g = Math.round(rgb[1] * tintAmount + 10);
    const b = Math.round(rgb[2] * tintAmount + 10);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const s = brandData.sections;
  const spotify = s.home.spotify;

  // Fallbacks for safely accessing possibly undefined nested properties
  const safeDiv = (num: number, div: number) => (div === 0 ? 0 : num / div);

  const mobileMediaWidth = safeDiv(brandData.mediaImgSizeMobile, spotify.columnsMobile);
  const desktopMediaWidth = safeDiv(brandData.mediaImgSizeDesktop, spotify.columnsDesktop);

  const rootSelector = isScoped ? '.kraakefot-site' : ':root';
  const bodySelector = isScoped ? '.kraakefot-site' : 'body';
  const htmlSelector = isScoped ? '.kraakefot-site' : 'html';

  // Shortcuts for sections to reduce verbosity
  const hHero = s.home.hero;
  const hOrigin = s.home.origin;
  const hLive = s.home.live;
  const hSpot = s.home.spotify;
  const aHero = s.about.hero;
  const aStory = s.about.story;
  const aMission = s.about.mission;
  const aValues = s.about.values;
  const contact = s.contact;
  const footer = s.footer;
  const vault = s.vault;
  const epk = s.epk;

  return `
      ${rootSelector} {
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
        
        /* Menu & Header Parity */
        --header-bg: ${getHeaderBg(brandData)};
        --header-h: 6rem; /* h-24 */
        --header-px: 2rem; /* px-8 */
        --header-py: 1.5rem; /* py-6 */
        --menu-overlay-blur: ${brandData.menuOverlayBlur ?? 5}px;
        --menu-overlay-brightness: ${brandData.menuOverlayBrightness ?? 95}%;
        --menu-overlay-color: rgba(${hexToRgb(brandData.menuOverlayColor || '#000000').split(' ').join(', ')}, ${(brandData.menuOverlayOpacity ?? 5) / 100});
        
        @media (max-width: 768px) {
          :root {
            --header-h: 5rem; /* h-20 */
            --header-px: 1rem; /* px-4 */
            --header-py: 1rem; /* py-4 */
          }
        }
        
        /* Atomic Spacing & Heights */
        ${getAtomicSpacing('homeHero', 'hero', hHero)}
        ${getAtomicSpacing('homeOrigin', 'origin', hOrigin)}
        ${getAtomicSpacing('homeLive', 'live', hLive)}
        ${getAtomicSpacing('homeSpotify', 'spotify', hSpot)}
        ${getAtomicSpacing('aboutHero', 'about-hero', aHero)}
        ${getAtomicSpacing('aboutStory', 'story', aStory)}
        ${getAtomicSpacing('aboutMission', 'mission', aMission)}
        ${getAtomicSpacing('aboutValues', 'about-values', aValues)}
        ${getAtomicSpacing('contact', 'contact', contact)}
        ${getAtomicSpacing('footer', 'footer-section', footer)}
        ${getAtomicSpacing('vault', 'vault', vault)}
        ${epk ? getAtomicSpacing('epkHook', 'epk-hook', epk.hook) : ''}
        ${epk ? getAtomicSpacing('epkPitch', 'epk-pitch', epk.pitch) : ''}
        ${epk ? getAtomicSpacing('epkMedia', 'epk-media', epk.media) : ''}
        ${epk ? getAtomicSpacing('epkPress', 'epk-press', epk.press) : ''}
        ${epk ? getAtomicSpacing('epkContact', 'epk-contact', epk.contact) : ''}
        
        --media-aspect-ratio: ${hSpot.aspectRatioMobile || '1/1'};
        --media-scale: ${hSpot.scaleMobile || 1};

        /* Fluid Typography (Desktop — uses user sizes when set, else clamp fallback) */
        /* NOTE: The CSS var names are shifted by one level to match computeFontSize mapping:
           semanticType h1 → --fs-display, h2 → --fs-h1, h3 → --fs-h2, h4 → --fs-h3 */
        --fs-display: ${(brandData as any).h1SizeDesktop ? `${(brandData as any).h1SizeDesktop}rem` : "clamp(2.5rem, 5vw + 1rem, 8rem)"};
        --fs-h1: ${(brandData as any).h2SizeDesktop ? `${(brandData as any).h2SizeDesktop}rem` : "clamp(2rem, 4vw + 1rem, 6rem)"};
        --fs-h2: ${(brandData as any).h3SizeDesktop ? `${(brandData as any).h3SizeDesktop}rem` : "clamp(1.5rem, 3vw + 1rem, 4.5rem)"};
        --fs-h3: ${(brandData as any).h4SizeDesktop ? `${(brandData as any).h4SizeDesktop}rem` : "clamp(1.25rem, 2vw + 1rem, 3rem)"};
        --fs-h4: ${(brandData as any).h5SizeDesktop ? `${(brandData as any).h5SizeDesktop}rem` : "clamp(1.1rem, 1.5vw + 0.5rem, 1.75rem)"};
        --fs-h5: ${(brandData as any).h6SizeDesktop ? `${(brandData as any).h6SizeDesktop}rem` : "clamp(0.95rem, 1.2vw + 0.4rem, 1.25rem)"};
        --fs-body: ${(brandData as any).bodySizeDesktop ? `${(brandData as any).bodySizeDesktop}rem` : "clamp(0.875rem, 1vw + 0.5rem, 1.125rem)"};

        /* Heading Colors (user-configurable) */
        --color-h1: ${(brandData as any).h1Color || '#eae8e8'};
        --color-h2: ${(brandData as any).h2Color || '#eae8e8'};
        --color-h3: ${(brandData as any).h3Color || '#eae8e8'};
        --color-h4: ${(brandData as any).h4Color || '#eae8e8'};
        --color-h5: ${(brandData as any).h5Color || '#eae8e8'};
        --color-h6: ${(brandData as any).h6Color || '#eae8e8'};
        --color-body: ${(brandData as any).bodyColor || '#eae8e8'};

        /* Desktop Framing Variables */
        ${getFramingCss('hero', hHero.framing.zoomDesktop, hHero.framing.xOffsetDesktop, hHero.framing.yOffsetDesktop)}
        ${getFramingCss('origin', hOrigin.framing.zoomDesktop, hOrigin.framing.xOffsetDesktop, hOrigin.framing.yOffsetDesktop)}
        ${getFramingCss('live', hLive.framing.zoomDesktop, hLive.framing.xOffsetDesktop, hLive.framing.yOffsetDesktop)}
        ${getFramingCss('live-image', (hLive.framingImage || hLive.framing).zoomDesktop, (hLive.framingImage || hLive.framing).xOffsetDesktop, (hLive.framingImage || hLive.framing).yOffsetDesktop)}
        ${getFramingCss('footer', footer.framing.zoomDesktop, footer.framing.xOffsetDesktop, footer.framing.yOffsetDesktop)}
        ${getFramingCss('contact', contact.framing.zoomDesktop, contact.framing.xOffsetDesktop, contact.framing.yOffsetDesktop)}
        ${getFramingCss('vault', vault.framing.zoomDesktop, vault.framing.xOffsetDesktop, vault.framing.yOffsetDesktop)}
        ${getFramingCss('story', aStory.framing.zoomDesktop, aStory.framing.xOffsetDesktop, aStory.framing.yOffsetDesktop)}
        ${getFramingCss('about-hero', aHero.framing.zoomDesktop, aHero.framing.xOffsetDesktop, aHero.framing.yOffsetDesktop)}
        ${getMuxPropsCss('live-mux', hLive.mediaConfig?.mux?.widthDesktop, hLive.mediaConfig?.mux?.xOffsetDesktop, (hLive.mediaConfig?.mux as any)?.yOffsetDesktop)}
        
        /* Visuals */
        /* Visuals */
        --hero-sat: ${hHero.visuals.saturation}%; --hero-dim: ${hHero.visuals.dim / 100}; --hero-para: ${hHero.visuals.parallax}; --hero-op: ${(hHero.visuals.opacity ?? 100) / 100};
        --origin-sat: ${hOrigin.visuals.saturation}%; --origin-dim: ${hOrigin.visuals.dim / 100}; --origin-para: ${hOrigin.visuals.parallax}; --origin-op: ${(hOrigin.visuals.opacity ?? 100) / 100};
        --live-sat: ${hLive.visuals.saturation}%; --live-dim: ${hLive.visuals.dim / 100}; --live-para: ${hLive.visuals.parallax}; --live-op: ${(hLive.visuals.opacity ?? 100) / 100};
        --live-image-sat: ${hLive.visuals.saturation}%; --live-image-dim: ${hLive.visuals.dim / 100}; --live-image-para: ${(hLive.parallaxImage?.desktop ?? hLive.visuals.parallax)}; --live-image-op: ${(hLive.visuals.opacity ?? 100) / 100};
        --spotify-sat: ${hSpot.visuals.saturation}%; --spotify-dim: ${hSpot.visuals.dim / 100}; --spotify-para: ${hSpot.visuals.parallax}; --spotify-op: ${(hSpot.visuals.opacity ?? 100) / 100};
        --about-hero-sat: ${aHero.visuals.saturation}%; --about-hero-dim: ${aHero.visuals.dim / 100}; --about-hero-para: ${aHero.visuals.parallax}; --about-hero-op: ${(aHero.visuals.opacity ?? 100) / 100};
        --story-sat: ${aStory.visuals.saturation}%; --story-dim: ${aStory.visuals.dim / 100}; --story-para: ${aStory.visuals.parallax}; --story-op: ${(aStory.visuals.opacity ?? 100) / 100};
        --footer-sat: ${footer.visuals.saturation}%; --footer-dim: ${footer.visuals.dim / 100}; --footer-para: ${footer.visuals.parallax}; --footer-op: ${(footer.visuals.opacity ?? 100) / 100};
        --contact-sat: ${contact.visuals.saturation}%; --contact-dim: ${contact.visuals.dim / 100}; --contact-para: ${contact.visuals.parallax}; --contact-op: ${(contact.visuals.opacity ?? 100) / 100};
        --vault-sat: ${vault.visuals.saturation}%; --vault-dim: ${vault.visuals.dim / 100}; --vault-para: ${vault.visuals.parallax}; --vault-op: ${(vault.visuals.opacity ?? 100) / 100};
        ${epk ? `
        --epk-hook-sat: ${epk.hook.visuals.saturation}%; --epk-hook-dim: ${epk.hook.visuals.dim / 100}; --epk-hook-para: ${epk.hook.visuals.parallax}; --epk-hook-op: ${(epk.hook.visuals.opacity ?? 100) / 100}; --epk-hook-margin: ${epk.hook.layout.marginBottom ?? 0}px;
        --epk-hook-aura-op: ${(epk.hook.visuals.auraOpacity ?? 15) / 100}; --epk-hook-aura-speed: ${epk.hook.visuals.auraSpeed ?? 20}s; --epk-hook-aura-blend: ${epk.hook.visuals.auraBlendMode || 'screen'}; --epk-hook-aura-display: ${epk.hook.visuals.auraEnabled ? 'block' : 'none'}; --hg-buffer: 400%; --hg-norm: 0.25;
        --aura-op: ${(epk.hook.visuals.auraOpacity ?? 15) / 100}; --hg-buffer: 200%; --hg-norm: 0.5;
        --epk-hook-glitch: ${(epk.hook.visuals.glitchIntensity ?? 0) / 100};
        ${epk.hook.visuals.auraColor ? `--epk-hook-aura-color: ${epk.hook.visuals.auraColor};` : ''}
        --epk-pitch-sat: ${epk.pitch.visuals.saturation}%; --epk-pitch-dim: ${epk.pitch.visuals.dim / 100}; --epk-pitch-para: ${epk.pitch.visuals.parallax}; --epk-pitch-op: ${(epk.pitch.visuals.opacity ?? 100) / 100}; --epk-pitch-margin: ${epk.pitch.layout.marginBottom ?? 0}px;
        --epk-media-sat: ${epk.media.visuals?.saturation ?? 100}%; --epk-media-margin: ${epk.media.layout.marginBottom ?? 0}px;
        --epk-contact-sat: ${epk.contact.visuals.saturation}%; --epk-contact-dim: ${epk.contact.visuals.dim / 100}; --epk-contact-para: ${epk.contact.visuals.parallax}; --epk-contact-op: ${(epk.contact.visuals.opacity ?? 100) / 100}; --epk-contact-margin: ${epk.contact.layout.marginBottom ?? 0}px;
        --epk-contact-glitch: ${(epk.contact.visuals.glitchIntensity ?? 0) / 100};
        --epk-contact-aura-op: ${(epk.contact.visuals.auraOpacity ?? 15) / 100}; --epk-contact-aura-speed: ${epk.contact.visuals.auraSpeed ?? 20}s; --epk-contact-aura-blend: ${epk.contact.visuals.auraBlendMode || 'screen'}; --epk-contact-aura-display: ${epk.contact.visuals.auraEnabled ? 'block' : 'none'};
        ${epk.contact.visuals.auraColor ? `--epk-contact-aura-color: ${epk.contact.visuals.auraColor};` : ''}
        ${getFramingCss('epk-hook', epk.hook.framing?.zoomDesktop, epk.hook.framing?.xOffsetDesktop, epk.hook.framing?.yOffsetDesktop)}
        ${getFramingCss('epk-pitch', epk.pitch.framing?.zoomDesktop, epk.pitch.framing?.xOffsetDesktop, epk.pitch.framing?.yOffsetDesktop)}
        ${getFramingCss('epk-contact', epk.contact.framing?.zoomDesktop, epk.contact.framing?.xOffsetDesktop, epk.contact.framing?.yOffsetDesktop)}
        ` : ''}
        
        /* Dynamic Text Styles (Hot Update Compatible) */
        ${Object.entries(brandData.textStyles || {}).map(([key, style]) => {
    // Font-size is now computed inline by resolveTextStyle — no --fs-key needed.
    // BUT we need --scale-key for mobile/desktop differences
    const scale = style.scale || 1.0;
    const scaleMobile = style.scaleMobile ?? scale;
    const scaleVar = `--scale-${key}: ${scale};`;
    const mobileOverride = scaleMobile !== scale
      ? `\n@media (max-width: 768px) { :root { --scale-${key}: ${scaleMobile}; } }`
      : '';

    // 1. Color
    const colorVar = style.color ? `--color-${key}: ${style.color};` : '';

    // 2. Line Height
    let lhVal = style.lineHeight || 'inherit';
    const lhMap: Record<string, string> = {
      none: '1', tight: '1.25', snug: '1.375', normal: '1.5', relaxed: '1.625', loose: '2'
    };
    if (lhMap[lhVal]) lhVal = lhMap[lhVal];
    const lhVar = `--lh-${key}: ${lhVal};`;

    // 3. Font Family
    let fontVal = 'inherit';
    if (style.font) fontVal = style.font;
    else if (style.semanticType) fontVal = `var(--font-${style.semanticType})`;
    const fontVar = `--font-fam-${key}: ${fontVal};`;

    return `${scaleVar}${mobileOverride}\n${colorVar}\n${lhVar}\n${fontVar}`;
  }).join('\n')}

        --hero-margin: ${hHero.layout.marginBottom}px;
        --origin-margin: ${hOrigin.layout.marginBottom}px;
        --live-margin: ${hLive.layout.marginBottom}px;
        --spotify-margin: ${hSpot.layout.marginBottom}px;
        --about-hero-margin: ${aHero.layout.marginBottom}px;
        --story-margin: ${aStory.layout.marginBottom}px;
        --about-mission-margin: ${aMission.layout.marginBottom}px;
        --about-values-margin: ${aValues.layout.marginBottom}px;
        --footer-margin: ${footer.layout.marginBottom}px;
        --vault-margin: ${vault.layout.marginBottom}px;
        
        /* PARITY: Hero Headline Match (text-9xl, tracking-tighter) */
        --fs-hero-mobile: 2.25rem; /* text-4xl */
        --fs-hero-desktop: 8rem;   /* text-9xl */
        
        --heading-scale: 1;
        --body-scale: 1;
        --media-width: ${mobileMediaWidth}%;
        --media-gap: ${hSpot.gapMobile * 4}px;
      }
      
      /* Tailwind Utilities Parity — double backslashes so JS template literal outputs correct CSS selectors */
      .text-xs { font-size: 0.75rem; line-height: 1rem; }
      .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
      .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
      .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
      .text-2xl { font-size: 1.5rem; line-height: 2rem; }
      .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
      .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
      .text-5xl { font-size: 3rem; line-height: 1; }
      .text-7xl { font-size: 4.5rem; line-height: 1; }
      .text-8xl { font-size: 6rem; line-height: 1; }
      .text-9xl { font-size: 8rem; line-height: 1; }

      .leading-none { line-height: 1; }
      .leading-tight { line-height: 1.25; }
      .tracking-tight { letter-spacing: -0.025em; }
      .tracking-tighter { letter-spacing: -0.05em; }
      .tracking-widest { letter-spacing: 0.1em; }
      .tracking-\\[0\\.2em\\] { letter-spacing: 0.2em; }
      .tracking-\\[0\\.3em\\] { letter-spacing: 0.3em; }
      .tracking-\\[0\\.4em\\] { letter-spacing: 0.4em; }
      .tracking-\\[0\\.5em\\] { letter-spacing: 0.5em; }

      .block { display: block; }
      .inline-block { display: inline-block; }
      .inline-flex { display: inline-flex; }
      .flex { display: flex; }
      .grid { display: grid; }
      .hidden { display: none; }
      .fixed { position: fixed; }
      .absolute { position: absolute; }
      .relative { position: relative; }
      .sticky { position: sticky; }
      .inset-0 { inset: 0; }
      .top-0 { top: 0; }
      .top-20 { top: 5rem; }
      .right-0 { right: 0; }
      .right-6 { right: 1.5rem; }
      .bottom-0 { bottom: 0; }
      .bottom-6 { bottom: 1.5rem; }
      .left-0 { left: 0; }
      .left-6 { left: 1.5rem; }
      .z-0 { z-index: 0; }
      .z-10 { z-index: 10; }
      .z-20 { z-index: 20; }
      .z-30 { z-index: 30; }
      .z-40 { z-index: 40; }
      .z-50 { z-index: 50; }
      .z-\\[100\\] { z-index: 100; }
      .flex-col { flex-direction: column; }
      .flex-row { flex-direction: row; }
      .flex-wrap { flex-wrap: wrap; }
      .flex-nowrap { flex-wrap: nowrap; }
      .flex-grow { flex-grow: 1; }
      .shrink-0 { flex-shrink: 0; }
      .items-center { align-items: center; }
      .justify-center { justify-content: center; }
      .justify-between { justify-content: space-between; }
      .justify-end { justify-content: flex-end; }
      .grid-cols-1 { grid-template-columns: repeat(1,minmax(0,1fr)); }
      .grid-cols-2 { grid-template-columns: repeat(2,minmax(0,1fr)); }
      .gap-2 { gap: 0.5rem; }
      .gap-3 { gap: 0.75rem; }
      .gap-4 { gap: 1rem; }
      .gap-6 { gap: 1.5rem; }
      .gap-8 { gap: 2rem; }
      .gap-10 { gap: 2.5rem; }
      .gap-12 { gap: 3rem; }
      .gap-16 { gap: 4rem; }
      .w-px { width: 1px; }
      .w-6 { width: 1.5rem; }
      .w-8 { width: 2rem; }
      .w-10 { width: 2.5rem; }
      .w-12 { width: 3rem; }
      .w-16 { width: 4rem; }
      .w-24 { width: 6rem; }
      .w-32 { width: 8rem; }
      .w-full { width: 100%; }
      .w-\\[72px\\] { width: 72px; }
      .h-1 { height: 0.25rem; }
      .h-4 { height: 1rem; }
      .h-6 { height: 1.5rem; }
      .h-8 { height: 2rem; }
      .h-10 { height: 2.5rem; }
      .h-12 { height: 3rem; }
      .h-16 { height: 4rem; }
      .h-24 { height: 6rem; }
      .h-full { height: 100%; }
      .h-\\[72px\\] { height: 72px; }
      .max-w-2xl { max-width: 42rem; }
      .max-w-3xl { max-width: 48rem; }
      .max-w-4xl { max-width: 56rem; }
      .max-w-5xl { max-width: 64rem; }
      .max-w-6xl { max-width: 72rem; }
      .max-w-7xl { max-width: 80rem; }
      .mx-auto { margin-left: auto; margin-right: auto; }
      .ml-1 { margin-left: 0.25rem; }
      .ml-2 { margin-left: 0.5rem; }
      .mt-3 { margin-top: 0.75rem; }
      .mt-8 { margin-top: 2rem; }
      .mt-12 { margin-top: 3rem; }
      .mt-16 { margin-top: 4rem; }
      .mt-20 { margin-top: 5rem; }
      .mt-24 { margin-top: 6rem; }
      .mb-1 { margin-bottom: 0.25rem; }
      .mb-4 { margin-bottom: 1rem; }
      .mb-6 { margin-bottom: 1.5rem; }
      .mb-8 { margin-bottom: 2rem; }
      .mb-12 { margin-bottom: 3rem; }
      .mb-16 { margin-bottom: 4rem; }
      .p-6 { padding: 1.5rem; }
      .p-8 { padding: 2rem; }
      .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
      .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
      .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
      .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
      .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
      .py-16 { padding-top: 4rem; padding-bottom: 4rem; }
      .py-20 { padding-top: 5rem; padding-bottom: 5rem; }
      .py-24 { padding-top: 6rem; padding-bottom: 6rem; }
      .px-4 { padding-left: 1rem; padding-right: 1rem; }
      .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
      .px-8 { padding-left: 2rem; padding-right: 2rem; }
      .font-bold { font-weight: 700; }
      .font-medium { font-weight: 500; }
      .font-normal { font-weight: 400; }
      .uppercase { text-transform: uppercase; }
      .not-italic { font-style: normal; }
      .text-center { text-align: center; }
      .text-left { text-align: left; }
      .text-right { text-align: right; }
      .text-white { color: #fff; }
      .text-zinc-100 { color: #f4f4f5; }
      .text-zinc-400 { color: #a1a1aa; }
      .text-zinc-500 { color: #71717a; }
      .text-zinc-600 { color: #52525b; }
      .text-zinc-700 { color: #3f3f46; }
      .text-zinc-800 { color: #27272a; }
      .text-\\[var\\(--accent\\)\\] { color: var(--accent); }
      .text-\\[var\\(--accent-light\\)\\] { color: var(--accent-light); }
      .text-\\[10px\\] { font-size: 10px; }
      .bg-black { background-color: #000; }
      .bg-white { background-color: #fff; }
      .bg-zinc-800 { background-color: #27272a; }
      .border { border-width: 1px; border-style: solid; }
      .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
      .border-t { border-top-width: 1px; border-top-style: solid; }
      .border-2 { border-width: 2px; border-style: solid; }
      .border-zinc-800 { border-color: #27272a; }
      .border-white { border-color: #fff; }
      .border-\\[var\\(--accent\\)\\] { border-color: var(--accent); }
      .rounded { border-radius: 0.25rem; }
      .rounded-sm { border-radius: 0.125rem; }
      .rounded-lg { border-radius: 0.5rem; }
      .rounded-full { border-radius: 9999px; }
      .overflow-hidden { overflow: hidden; }
      .overflow-y-auto { overflow-y: auto; }
      .object-cover { object-fit: cover; }
      .cursor-pointer { cursor: pointer; }
      .select-none { user-select: none; }
      .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -4px rgba(0,0,0,0.1); }
      .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
      .scale-90 { transform: scale(.9); }
      .scale-100 { transform: scale(1); }
      .opacity-0 { opacity: 0; }
      .opacity-100 { opacity: 1; }
      .transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4,0,0.2,1); transition-duration: 150ms; }
      .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4,0,0.2,1); transition-duration: 150ms; }
      .transition-opacity { transition-property: opacity; transition-timing-function: cubic-bezier(0.4,0,0.2,1); transition-duration: 150ms; }
      .transition-transform { transition-property: transform; transition-timing-function: cubic-bezier(0.4,0,0.2,1); transition-duration: 150ms; }
      .duration-200 { transition-duration: 200ms; }
      .duration-300 { transition-duration: 300ms; }
      .duration-500 { transition-duration: 500ms; }
      .duration-1000 { transition-duration: 1000ms; }
      .ease-in-out { transition-timing-function: cubic-bezier(0.4,0,0.2,1); }
      .ease-out { transition-timing-function: cubic-bezier(0,0,0.2,1); }
      .hover\\:text-\\[var\\(--accent\\)\\]:hover { color: var(--accent); }
      .hover\\:text-\\[var\\(--accent-light\\)\\]:hover { color: var(--accent-light); }
      .hover\\:text-white:hover { color: #fff; }
      .hover\\:border-\\[var\\(--accent\\)\\]:hover { border-color: var(--accent); }
      .hover\\:bg-white\\/20:hover { background-color: rgba(255,255,255,0.2); }
      .group:hover .group-hover\\:opacity-0 { opacity: 0; }
      .group:hover .group-hover\\:opacity-100 { opacity: 1; }
      .group:hover .group-hover\\:scale-100 { transform: scale(1); }
      .group:hover .group-hover\\:translate-x-1 { transform: translateX(0.25rem); }
      .group:hover .group-hover\\:translate-y-0 { transform: translateY(0); }
      .group:hover .group-hover\\:rotate-90 { transform: rotate(90deg); }
      .group:hover .group-hover\\/btn\\:translate-y-0 { transform: translateY(0); }
      .group.is-active-slide .group-\\[\\.is-active-slide\\]\\:opacity-0 { opacity: 0; }
      .group.is-spotify-active .group-\\[\\.is-spotify-active\\]\\:opacity-0 { opacity: 0; }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      .animate-pulse { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
      @keyframes bounce { 0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); } 50% { transform: translateY(0); animation-timing-function: cubic-bezier(0,0,0.2,1); } }
      .animate-bounce { animation: bounce 1s infinite; }
      /* Opacity-modifier classes */
      .bg-black\\/40 { background-color: rgba(0,0,0,0.4); }
      .bg-black\\/60 { background-color: rgba(0,0,0,0.6); }
      .bg-white\\/10 { background-color: rgba(255,255,255,0.1); }
      .bg-zinc-800\\/50 { background-color: rgba(39,39,42,0.5); }
      .bg-zinc-900 { background-color: #18181b; }
      .text-white\\/50 { color: rgba(255,255,255,0.5); }
      .text-zinc-300 { color: #d4d4d8; }
      .text-red-500 { color: #ef4444; }
      .border-zinc-800\\/50 { border-color: rgba(39,39,42,0.5); }
      .border-zinc-900\\/50 { border-color: rgba(24,24,27,0.5); }
      .border-zinc-900 { border-color: #18181b; }
      .border-l-2 { border-left-width: 2px; border-left-style: solid; }
      .border-accent { border-color: var(--accent); }
      .italic { font-style: italic; }
      .whitespace-pre-wrap { white-space: pre-wrap; }
      .pl-8 { padding-left: 2rem; }
      .rounded-3xl { border-radius: 1.5rem; }
      .rounded-\\[2rem\\] { border-radius: 2rem; }
      .break-all { word-break: break-all; }
      .rotate-45 { transform: rotate(45deg); }
      .-rotate-45 { transform: rotate(-45deg); }
      .group:hover .group-hover\\:rotate-90 { transform: rotate(90deg); }
      .group:hover .group-hover\\:-rotate-90 { transform: rotate(-90deg); }
      .shadow-black\\/40 { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.4),0 4px 6px -4px rgba(0,0,0,0.4); }
      .drop-shadow-lg { filter: drop-shadow(0 10px 8px rgba(0,0,0,0.04)) drop-shadow(0 4px 3px rgba(0,0,0,0.1)); }
      .drop-shadow-2xl { filter: drop-shadow(0 25px 25px rgba(0,0,0,0.15)); }
      .bg-\\[var\\(--accent\\)\\]\\/20 { background-color: color-mix(in srgb, var(--accent) 20%, transparent); }
      .shadow-\\[0_0_30px_rgb\\(var\\(--accent-rgb\\)\\/0\\.2\\)\\] { box-shadow: 0 0 30px rgb(var(--accent-rgb)/0.2); }
      .backdrop-blur-sm { backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
      .backdrop-blur-md { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      .backdrop-blur-xl { backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); }
      .backdrop-blur-3xl { backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%); }
      .backdrop-blur-2xl { backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); }
      .bg-gradient-to-b { background-image: linear-gradient(to bottom, var(--tw-gradient-stops)); }
      .from-black { --tw-gradient-from: #000 var(--tw-gradient-from-position); --tw-gradient-to: rgba(0,0,0,0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
      .via-black\\/40 { --tw-gradient-to: rgba(0,0,0,0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), rgba(0,0,0,0.4) var(--tw-gradient-via-position), var(--tw-gradient-to); }
      .to-black { --tw-gradient-to: #000 var(--tw-gradient-to-position); }
      .container { width: 100%; margin-right: auto; margin-left: auto; padding-right: 1rem; padding-left: 1rem; }
      .pointer-events-none { pointer-events: none; }
      .pointer-events-auto { pointer-events: auto; }
      .items-start { align-items: flex-start; }
      .flex-1 { flex: 1 1 0%; }
      .min-h-\\[80vh\\] { min-height: 80vh; }
      .overflow-x-hidden { overflow-x: hidden; }
      .font-sans { font-family: var(--font-body); }
      .font-serif { font-family: var(--font-h1, serif); }
      .font-light { font-weight: 300; }
      .italic { font-style: italic; }
      .whitespace-pre-wrap { white-space: pre-wrap; }
      .break-all { word-break: break-all; }
      .leading-relaxed { line-height: 1.625; }
      .translate-y-full { transform: translateY(100%); }
      .translate-y-\\[-15px\\] { transform: translateY(-15px); }
      .translate-y-2 { transform: translateY(0.5rem); }

      @media (min-width: 640px) {
        .sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
        .sm\\:text-lg { font-size: 1.125rem; line-height: 1.75rem; }
        .sm\\:text-2xl { font-size: 1.5rem; line-height: 2rem; }
        .sm\\:text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
      }
      @media (min-width: 768px) {
          .md\\:block { display: block; }
          .md\\:flex { display: flex; }
          .md\\:hidden { display: none; }
          .md\\:h-8 { height: 2rem; }
          .md\\:h-10 { height: 2.5rem; }
          .md\\:h-12 { height: 3rem; }
          .md\\:h-24 { height: 6rem; }
          .md\\:w-8 { width: 2rem; }
          .md\\:w-10 { width: 2.5rem; }
          .md\\:w-12 { width: 3rem; }
          .md\\:w-24 { width: 6rem; }
          .md\\:text-xs { font-size: 0.75rem; line-height: 1rem; }
          .md\\:text-sm { font-size: 0.875rem; line-height: 1.25rem; }
          .md\\:text-xl { font-size: 1.25rem; line-height: 1.75rem; }
          .md\\:text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
          .md\\:text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
          .md\\:text-5xl { font-size: 3rem; line-height: 1; }
          .md\\:text-6xl { font-size: 3.75rem; line-height: 1; }
          .md\\:text-7xl { font-size: 4.5rem; line-height: 1; }
          .md\\:text-8xl { font-size: 6rem; line-height: 1; }
          .md\\:text-9xl { font-size: 8rem; line-height: 1; }
          .md\\:text-left { text-align: left; }
          .md\\:leading-tight { line-height: 1.25; }
          .md\\:gap-3 { gap: 0.75rem; }
          .md\\:gap-8 { gap: 2rem; }
          .md\\:gap-10 { gap: 2.5rem; }
          .md\\:gap-14 { gap: 3.5rem; }
          .md\\:mb-8 { margin-bottom: 2rem; }
          .md\\:mb-12 { margin-bottom: 3rem; }
          .md\\:mt-16 { margin-top: 4rem; }
          .md\\:top-24 { top: 6rem; }
          .md\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
          .md\\:p-0 { padding: 0; }
          .md\\:p-10 { padding: 2.5rem; }
          .md\\:p-20 { padding: 5rem; }
          .md\\:grid-cols-3 { grid-template-columns: repeat(3,minmax(0,1fr)); }
      }
      @media (min-width: 1024px) {
          .lg\\:text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
          .lg\\:text-7xl { font-size: 4.5rem; line-height: 1; }
          .lg\\:text-9xl { font-size: 8rem; line-height: 1; }
          .lg\\:text-\\[12rem\\] { font-size: 12rem; line-height: 1; }
          .lg\\:grid-cols-4 { grid-template-columns: repeat(4,minmax(0,1fr)); }
          .lg\\:grid-cols-5 { grid-template-columns: repeat(5,minmax(0,1fr)); }
          .lg\\:col-span-2 { grid-column: span 2/span 2; }
          .lg\\:col-span-3 { grid-column: span 3/span 3; }
      }

      /* Play Button Animation */
      @keyframes pulse-ring {
          0% { transform: scale(0.33); opacity: 0; }
          80% { opacity: 0.5; }
          100% { transform: scale(1.3); opacity: 0; }
      }
      .animate-play-ring { animation: pulse-ring 2s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
      
      /* SPECTACULAR PLAY BUTTON */
      #live-play-btn {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 2px solid var(--accent);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37), 
                      inset 0 0 0 1px rgb(var(--accent-rgb) / 0.2);
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
          color: white;
          opacity: 0.8;
          outline: none !important;
          width: 72px;
          height: 72px;
      }

      @media (min-width: 768px) {
          #live-play-btn {
              width: 96px;
              height: 96px;
          }
      }
      
      @media (hover: hover) {
          #live-play-btn:hover {
              background: rgba(255, 255, 255, 0.2);
              transform: scale(1.05) translateY(-2px);
              border-color: rgba(255, 255, 255, 0.4);
              opacity: 1;
          }
      }

      #live-play-btn:active {
          transform: scale(0.92);
          opacity: 1;
          background: rgba(255, 255, 255, 0.3);
          transition: all 0.1s;
      }

      #live-play-btn .play-icon {
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
      }

      .btn-glass {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.8rem 2.5rem;
          border-radius: 9999px;
          background: rgba(var(--accent-rgb, 255 255 255) / 0.08);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border: 2px solid rgba(var(--accent-rgb, 255 255 255) / 0.6);
          color: white !important;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          text-decoration: none;
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
          z-index: 1;
      }

      @media (max-width: 768px) {
          .btn-glass {
              padding: 0.5rem 1.2rem;
              letter-spacing: 0.15em;
              font-size: 8px;
          }
          #epk-hook { justify-content: center !important; }
      }

      .btn-glass::before {
          content: '';
          position: absolute;
          inset: -100%;
          background: conic-gradient(
              from 180deg at 50% 50%,
              transparent 0deg,
              rgba(var(--accent-rgb, 69 150 148) / 0.4) 60deg,
              rgba(168, 85, 247, 0.3) 120deg,
              rgba(var(--accent-rgb, 69 150 148) / 0.4) 180deg,
              rgba(168, 85, 247, 0.3) 240deg,
              rgba(var(--accent-rgb, 69 150 148) / 0.4) 300deg,
              transparent 360deg
          );
          filter: blur(35px);
          animation: aurora-spin 6s linear infinite;
          opacity: 0.8;
          z-index: -1;
          transition: opacity 0.6s, filter 0.6s;
      }

      .btn-glass:hover {
          transform: translateY(-2px) scale(1.02);
          border-color: rgba(var(--accent-rgb, 255 255 255) / 0.8);
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.4),
            0 0 20px rgba(var(--accent-rgb, 255 255 255) / 0.2);
      }

      .btn-glass:hover::before {
          opacity: 1;
          filter: blur(25px);
      }

      @keyframes aurora-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
      }
      

      @media (min-width: 1024px) {
         ${rootSelector} {
            --media-width: ${desktopMediaWidth}%;
            --media-gap: ${hSpot.gapDesktop * 4}px;
            --media-aspect-ratio: ${hSpot.aspectRatioDesktop || '1/1'};
            --media-scale: ${hSpot.scaleDesktop || 1};
         }
      }

      @media (max-width: 768px) {
        ${rootSelector} {
          ${getFramingCss('hero', hHero.framing.zoomMobile, hHero.framing.xOffsetMobile, hHero.framing.yOffsetMobile)}
          ${getFramingCss('origin', hOrigin.framing.zoomMobile, hOrigin.framing.xOffsetMobile, hOrigin.framing.yOffsetMobile)}
          ${getFramingCss('live', hLive.framing.zoomMobile, hLive.framing.xOffsetMobile, hLive.framing.yOffsetMobile)}
          ${getFramingCss('live-image', (hLive.framingImage || hLive.framing).zoomMobile, (hLive.framingImage || hLive.framing).xOffsetMobile, (hLive.framingImage || hLive.framing).yOffsetMobile)}
          ${getFramingCss('footer', footer.framing.zoomMobile, footer.framing.xOffsetMobile, footer.framing.yOffsetMobile)}
          ${getFramingCss('contact', contact.framing.zoomMobile, contact.framing.xOffsetMobile, contact.framing.yOffsetMobile)}
          ${getFramingCss('vault', vault.framing.zoomMobile, vault.framing.xOffsetMobile, vault.framing.yOffsetMobile)}
          ${getFramingCss('story', aStory.framing.zoomMobile, aStory.framing.xOffsetMobile, aStory.framing.yOffsetMobile)}
          ${getFramingCss('about-hero', aHero.framing.zoomMobile, aHero.framing.xOffsetMobile, aHero.framing.yOffsetMobile)}
          ${getMuxPropsCss('live-mux', hLive.mediaConfig?.mux?.widthMobile, hLive.mediaConfig?.mux?.xOffsetMobile, (hLive.mediaConfig?.mux as any)?.yOffsetMobile)}
          
          /* Mobile Font Override — shifted to match computeFontSize mapping */
          --fs-display: ${(brandData as any).h1SizeMobile ? `${(brandData as any).h1SizeMobile}rem` : "clamp(2rem, 4vw + 1rem, 6rem)"};
          --fs-h1: ${(brandData as any).h2SizeMobile ? `${(brandData as any).h2SizeMobile}rem` : "clamp(1.75rem, 3.5vw + 1rem, 4.5rem)"};
          --fs-h2: ${(brandData as any).h3SizeMobile ? `${(brandData as any).h3SizeMobile}rem` : "clamp(1.25rem, 2.5vw + 1rem, 3.5rem)"};
          --fs-h3: ${(brandData as any).h4SizeMobile ? `${(brandData as any).h4SizeMobile}rem` : "clamp(1.125rem, 2vw + 1rem, 2.5rem)"};
          --fs-h4: ${(brandData as any).h5SizeMobile ? `${(brandData as any).h5SizeMobile}rem` : "clamp(0.95rem, 1.2vw + 0.4rem, 1.25rem)"};
          --fs-h5: ${(brandData as any).h6SizeMobile ? `${(brandData as any).h6SizeMobile}rem` : "clamp(0.85rem, 1vw + 0.35rem, 1rem)"};
          --fs-body: ${(brandData as any).bodySizeMobile ? `${(brandData as any).bodySizeMobile}rem` : "clamp(0.875rem, 1vw + 0.5rem, 1.125rem)"};
          --fs-hero-actual: var(--fs-hero-mobile);
          
          --hero-sat: ${hHero.visuals.mobileSaturation}%; --hero-dim: ${hHero.visuals.mobileDim / 100}; --hero-para: ${hHero.visuals.mobileParallax}; --hero-op: ${(hHero.visuals.mobileOpacity ?? 100) / 100}; --hero-margin: ${hHero.layout.mobileMarginBottom}px;
          --origin-sat: ${hOrigin.visuals.mobileSaturation}%; --origin-dim: ${hOrigin.visuals.mobileDim / 100}; --origin-para: ${hOrigin.visuals.mobileParallax}; --origin-op: ${(hOrigin.visuals.mobileOpacity ?? 100) / 100}; --origin-margin: ${hOrigin.layout.mobileMarginBottom}px;
          --live-sat: ${hLive.visuals.mobileSaturation}%; --live-dim: ${hLive.visuals.mobileDim / 100}; --live-para: ${hLive.visuals.mobileParallax}; --live-op: ${(hLive.visuals.mobileOpacity ?? 100) / 100}; --live-margin: ${hLive.layout.mobileMarginBottom}px;
          --live-image-sat: ${hLive.visuals.mobileSaturation}%; --live-image-dim: ${hLive.visuals.mobileDim / 100}; --live-image-para: ${(hLive.parallaxImage?.mobile ?? hLive.visuals.mobileParallax)}; --live-image-op: ${(hLive.visuals.mobileOpacity ?? 100) / 100};
          --spotify-sat: ${hSpot.visuals.mobileSaturation}%; --spotify-dim: ${hSpot.visuals.mobileDim / 100}; --spotify-para: ${hSpot.visuals.mobileParallax}; --spotify-op: ${(hSpot.visuals.mobileOpacity ?? 100) / 100}; --spotify-margin: ${hSpot.layout.mobileMarginBottom}px;
          --about-hero-sat: ${aHero.visuals.mobileSaturation}%; --about-hero-dim: ${aHero.visuals.mobileDim / 100}; --about-hero-para: ${aHero.visuals.mobileParallax}; --about-hero-op: ${(aHero.visuals.mobileOpacity ?? 100) / 100}; --about-hero-margin: ${aHero.layout.mobileMarginBottom}px;
          --story-sat: ${aStory.visuals.mobileSaturation}%; --story-dim: ${aStory.visuals.mobileDim / 100}; --story-para: ${aStory.visuals.mobileParallax}; --story-op: ${(aStory.visuals.mobileOpacity ?? 100) / 100}; --story-margin: ${aStory.layout.mobileMarginBottom}px;
          --footer-sat: ${footer.visuals.mobileSaturation}%; --footer-dim: ${footer.visuals.mobileDim / 100}; --footer-para: ${footer.visuals.mobileParallax}; --footer-op: ${(footer.visuals.mobileOpacity ?? 100) / 100};
          --contact-sat: ${contact.visuals.mobileSaturation}%; --contact-dim: ${contact.visuals.mobileDim / 100}; --contact-para: ${contact.visuals.mobileParallax}; --contact-op: ${(contact.visuals.mobileOpacity ?? 100) / 100};
          ${epk ? `
          --epk-hook-sat: ${epk.hook.visuals.mobileSaturation}%; --epk-hook-dim: ${epk.hook.visuals.mobileDim / 100}; --epk-hook-para: ${epk.hook.visuals.mobileParallax}; --epk-hook-op: ${(epk.hook.visuals.mobileOpacity ?? 100) / 100}; --epk-hook-margin: ${epk.hook.layout.mobileMarginBottom ?? epk.hook.layout.marginBottom ?? 0}px;
          --epk-hook-aura-op: ${(epk.hook.visuals.auraOpacity ?? 15) / 100}; --epk-hook-aura-speed: ${epk.hook.visuals.auraSpeed ?? 20}s; --epk-hook-aura-blend: ${epk.hook.visuals.auraBlendMode || 'screen'}; --epk-hook-aura-display: ${epk.hook.visuals.auraEnabled ? 'block' : 'none'};
          --epk-hook-glitch: ${(epk.hook.visuals.glitchIntensity ?? 0) / 100};
          --aura-op: ${(epk.hook.visuals.auraOpacity ?? 15) / 100};
          --aura-blur: 40px;
          ${epk.hook.visuals.auraColor ? `--epk-hook-aura-color: ${epk.hook.visuals.auraColor};` : ''}
          --epk-pitch-sat: ${epk.pitch.visuals.mobileSaturation}%; --epk-pitch-dim: ${epk.pitch.visuals.mobileDim / 100}; --epk-pitch-para: ${epk.pitch.visuals.mobileParallax}; --epk-pitch-op: ${(epk.pitch.visuals.mobileOpacity ?? 100) / 100}; --epk-pitch-margin: ${epk.pitch.layout.mobileMarginBottom ?? epk.pitch.layout.marginBottom ?? 0}px;
          --epk-media-sat: ${epk.media.visuals?.mobileSaturation ?? 100}%; --epk-media-margin: ${epk.media.layout.mobileMarginBottom ?? epk.media.layout.marginBottom ?? 0}px;
          --epk-contact-sat: ${epk.contact.visuals.mobileSaturation}%; --epk-contact-dim: ${epk.contact.visuals.mobileDim / 100}; --epk-contact-para: ${epk.contact.visuals.mobileParallax}; --epk-contact-op: ${(epk.contact.visuals.mobileOpacity ?? 100) / 100}; --epk-contact-margin: ${epk.contact.layout.mobileMarginBottom ?? epk.contact.layout.marginBottom ?? 0}px;
          --epk-press-margin: ${epk.press.layout.mobileMarginBottom ?? epk.press.layout.marginBottom ?? 0}px;
          ${getFramingCss('epk-hook', epk.hook.framing?.zoomMobile, epk.hook.framing?.xOffsetMobile, epk.hook.framing?.yOffsetMobile)}
          ${getFramingCss('epk-pitch', epk.pitch.framing?.zoomMobile, epk.pitch.framing?.xOffsetMobile, epk.pitch.framing?.yOffsetMobile)}
          ${getFramingCss('epk-contact', epk.contact.framing?.zoomMobile, epk.contact.framing?.xOffsetMobile, epk.contact.framing?.yOffsetMobile)}
          ` : ''}
          --vault-sat: ${vault.visuals.mobileSaturation}%; --vault-dim: ${vault.visuals.mobileDim / 100}; --vault-para: ${vault.visuals.mobileParallax}; --vault-op: ${(vault.visuals.mobileOpacity ?? 100) / 100}; --vault-margin: ${vault.layout.mobileMarginBottom}px;
          --about-mission-margin: ${aMission.layout.mobileMarginBottom}px;
          --about-values-margin: ${aValues.layout.mobileMarginBottom}px;
        }
      }
      
      ${isScoped ? '' : '*, *::before, *::after { box-sizing: border-box; }'}
      
      ${htmlSelector} { 
        font-size: calc(16px * var(--body-scale)); 
        scroll-behavior: smooth;
        width: 100%;
        max-width: 100vw;
        overflow-x: clip;
        touch-action: manipulation;
      }
      
      ${bodySelector} { 
        background-color: black; 
        color: white; 
        font-family: var(--font-body); 
        overflow-x: clip; 
        width: 100%;
        max-width: 100vw;
        margin: 0;
        padding: 0;
        touch-action: manipulation;
        -webkit-font-smoothing: antialiased;
        ${isScoped ? 'box-sizing: border-box;' : ''}
      }


      /* Fix for white lines/gaps between sections */
      section {
        margin-top: -1px;
        padding-top: calc(var(--section-pt, 0) + 1px);
        background-color: black;
        border: none !important;
        outline: 1px solid black !important;
        outline-offset: -1px !important;
      }
      section:first-of-type {
        margin-top: 0;
        outline: none !important;
      }

      /* Optimized Media Handling */
      .kraakefot-site img:not(.universal-media-element), 
      .kraakefot-site video:not(.universal-media-element) {
        max-width: 100%;
        height: auto;
        display: block;
      }
      
      /* UNIVERSAL MEDIA WRAPPER */
      .media-container-universal {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: black;
          overflow: hidden;
      }

      .media-internal-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
      }

      /* Increased specificity to override any external/global resets */
      .kraakefot-site .universal-media-element {
          width: 100% !important;
          height: 100% !important;
          min-width: 100%;
          min-height: 100%;
          object-fit: cover;
          will-change: transform, opacity;
          transform-origin: center center;
          transition: opacity 1.5s ease;
          opacity: 0; 
          backface-visibility: hidden;
      }
      .universal-media-element.loaded {
          opacity: var(--target-op, 1);
      }

      .epk-track-card {
          font-size: 16px;
          border-radius: 1.5em;
          width: 100%;
          padding: 1.5em;
      }

      @media (max-width: 768px) {
           /* Mobile specific overrides if needed in future */
           .epk-track-card {
               font-size: 12px;
               width: 75%;
               border-radius: 1.5em;
               padding: 1.5em;
           }
      }

      @media (min-width: 768px) {
           .md-press-grid {
               grid-template-columns: repeat(3, 1fr) !important;
           }
      }


      /* ── EPK HERO (HOOK) GLITCH FX ──────────────────────────── */
      /* --epk-hook-glitch: 0 = off, 1 = full               */
      .epk-hook-glitch-wrap {
          position: absolute; inset: 0; z-index: 4;
          pointer-events: none; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
      }
            .epk-hook-glitch-inner {
          position: relative; width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          --hg-zoom: calc(var(--epk-hook-zoom) + calc(var(--scroll-y, 0) * 0.0001));
          --hg-base-tx: scale(var(--hg-zoom)) translate3d(calc(var(--epk-hook-x) * var(--hg-norm)), calc(calc(var(--scroll-y, 0) * 1px * var(--epk-hook-para) / 100) + calc(var(--epk-hook-y) * var(--hg-norm))), 0);
      }
      .epk-hook-glitch-img, .epk-hook-glitch-rgb {
          position: absolute; 
          width: var(--hg-buffer); height: var(--hg-buffer);
          min-width: 100%; min-height: 100%; max-width: none; max-height: none;
          object-fit: cover;
          opacity: 0;
          will-change: opacity, transform, clip-path;
      }
      .epk-hook-glitch-img {
          filter: grayscale(40%) contrast(1.3) brightness(0.8);
          mix-blend-mode: luminosity;
          animation: hgGlitch 8s infinite 2s;
      }
      .epk-hook-glitch-rgb {
          filter: saturate(8) contrast(1.2) brightness(0.5);
          mix-blend-mode: screen;
          animation: hgRgb 8s infinite 2s;
      }
      .epk-hook-glitch-wrap::after {
          content: ''; position: absolute; left:-20%; right:-20%;
          height: 4px; top: 35%;
          background: linear-gradient(90deg,transparent,rgba(255,255,255,0.95) 40%,rgba(200,255,240,0.7) 60%,transparent);
          opacity: 0; filter: blur(1.5px); mix-blend-mode: screen;
          animation: hgFlare 8s infinite 2s;
          animation-play-state: var(--hg-play, paused);
      }
      @keyframes hgGlitch {
          0%,8%  { opacity:0; transform:var(--hg-base-tx); clip-path:none; }
          8.5%   { opacity:calc(var(--epk-hook-glitch,0)*0.9); transform:var(--hg-base-tx) translateX(calc(var(--epk-hook-glitch,0)*-7px)); clip-path:inset(15% 0 60% 0); filter:grayscale(40%) contrast(1.6) brightness(1.4); }
          9%     { opacity:calc(var(--epk-hook-glitch,0)*0.7); transform:var(--hg-base-tx) translateX(calc(var(--epk-hook-glitch,0)*5px)); clip-path:inset(40% 0 20% 0); }
          9.3%   { opacity:calc(var(--epk-hook-glitch,0)*1.0); transform:var(--hg-base-tx) translateX(calc(var(--epk-hook-glitch,0)*-4px)) skewX(calc(var(--epk-hook-glitch,0)*-2deg)); clip-path:inset(55% 0 5% 0); }
          9.6%   { opacity:calc(var(--epk-hook-glitch,0)*0.5); transform:var(--hg-base-tx) translateX(calc(var(--epk-hook-glitch,0)*3px)); clip-path:inset(70% 0 10% 0); }
          10%    { opacity:0; transform:var(--hg-base-tx); clip-path:none; }
          
          21%    { opacity:calc(var(--epk-hook-glitch,0)*0.15); transform:var(--hg-base-tx) translateX(1.5px); clip-path:inset(10% 0 85% 0); }
          21.1%  { opacity:0; }
          32%    { opacity:calc(var(--epk-hook-glitch,0)*0.10); transform:var(--hg-base-tx) translateY(-1.5px); clip-path:inset(80% 0 15% 0); }
          32.1%  { opacity:0; }

          35%,43%{ opacity:0; transform:var(--hg-base-tx); clip-path:none; }
          43.4%  { opacity:calc(var(--epk-hook-glitch,0)*0.8); transform:translateX(calc(var(--epk-hook-glitch,0)*6px)); clip-path:inset(22% 0 55% 0); filter:grayscale(20%) contrast(1.5) brightness(1.3); }
          43.7%  { opacity:calc(var(--epk-hook-glitch,0)*0.95); transform:translateX(calc(var(--epk-hook-glitch,0)*-5px)) skewX(calc(var(--epk-hook-glitch,0)*1.5deg)); clip-path:inset(60% 0 8% 0); }
          44%    { opacity:0; transform:var(--hg-base-tx); clip-path:none; }

          68%    { opacity:calc(var(--epk-hook-glitch,0)*0.18); transform:var(--hg-base-tx) translateX(-2.5px); clip-path:inset(45% 0 52% 0); }
          68.1%  { opacity:0; }
          82%    { opacity:calc(var(--epk-hook-glitch,0)*0.12); transform:var(--hg-base-tx) scale(1.025); clip-path:inset(5% 0 90% 0); }
          82.1%  { opacity:0; }
          95%    { opacity:calc(var(--epk-hook-glitch,0)*0.15); transform:var(--hg-base-tx) translateX(3.5px); clip-path:inset(85% 0 5% 0); }
          95.1%  { opacity:0; }

          100%   { opacity:0; }
      }
      @keyframes hgRgb {
          0%,8%  { opacity:0; }
          8.5%   { opacity:calc(var(--epk-hook-glitch,0)*0.35); transform:var(--hg-base-tx) translate(calc(var(--epk-hook-glitch,0)*8px),calc(var(--epk-hook-glitch,0)*-2px)); }
          9%     { opacity:calc(var(--epk-hook-glitch,0)*0.25); transform:var(--hg-base-tx) translate(calc(var(--epk-hook-glitch,0)*-7px),1px); }
          9.5%   { opacity:calc(var(--epk-hook-glitch,0)*0.3); transform:var(--hg-base-tx) translate(calc(var(--epk-hook-glitch,0)*6px),0); }
          10%    { opacity:0; }

          21%    { opacity:calc(var(--epk-hook-glitch,0)*0.10); transform:var(--hg-base-tx) translate(-2.5px, 1.5px); }
          21.1%  { opacity:0; }
          68%    { opacity:calc(var(--epk-hook-glitch,0)*0.12); transform:var(--hg-base-tx) translate(3.5px, -1.5px); }
          68.1%  { opacity:0; }

          43%    { opacity:calc(var(--epk-hook-glitch,0)*0.3); transform:var(--hg-base-tx) translate(calc(var(--epk-hook-glitch,0)*-6px),2px); }
          44%    { opacity:0; }
          100%   { opacity:0; }
      }
      @keyframes hgFlare {
          0%,8%  { opacity:0; top:35%; } 8.5% { opacity:calc(var(--epk-hook-glitch,0)*0.9); top:22%; }
          8.8%   { opacity:calc(var(--epk-hook-glitch,0)*0.6); top:55%; } 9.1% { opacity:calc(var(--epk-hook-glitch,0)*1.0); top:38%; }
          9.4%   { opacity:0; top:35%; } 43.3% { opacity:0; top:35%; } 43.6% { opacity:calc(var(--epk-hook-glitch,0)*0.85); top:18%; }
          43.9%  { opacity:0; top:35%; } 100% { opacity:0; }
      }

      /* ── EPK CONTACT GLITCH FX ───────────────────────────────── */
      .epk-contact-glitch-wrap {
          position: absolute; inset: 0; z-index: 4;
          pointer-events: none; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
      }
      .epk-contact-glitch-inner {
          position: relative; width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          --cg-zoom: calc(var(--epk-contact-zoom) + calc(var(--scroll-y, 0) * 0.0001));
          --cg-base-tx: scale(var(--cg-zoom)) translate3d(calc(var(--epk-contact-x) * var(--hg-norm)), calc(calc(var(--scroll-y, 0) * 1px * var(--epk-contact-para) / 100) + calc(var(--epk-contact-y) * var(--hg-norm))), 0);
      }
      .epk-contact-glitch-img, .epk-contact-glitch-rgb {
          position: absolute; 
          width: var(--hg-buffer); height: var(--hg-buffer);
          min-width: 100%; min-height: 100%; max-width: none; max-height: none;
          object-fit: cover;
          opacity: 0;
          will-change: opacity, transform, clip-path;
      }
      .epk-contact-glitch-img {
          filter: grayscale(40%) contrast(1.3) brightness(0.8);
          mix-blend-mode: luminosity;
          animation: cgGlitch 8s infinite 2.5s;
      }
      .epk-contact-glitch-rgb {
          filter: saturate(8) contrast(1.2) brightness(0.5);
          mix-blend-mode: screen;
          animation: cgRgb 8s infinite 2.5s;
      }
      @keyframes cgGlitch {
          0%,8%  { opacity:0; transform:var(--cg-base-tx); clip-path:none; }
          8.5%   { opacity:calc(var(--epk-contact-glitch,0)*0.9); transform:var(--cg-base-tx) translateX(calc(var(--epk-contact-glitch,0)*-7px)); clip-path:inset(15% 0 60% 0); filter:grayscale(40%) contrast(1.6) brightness(1.4); }
          9%     { opacity:calc(var(--epk-contact-glitch,0)*0.7); transform:var(--cg-base-tx) translateX(calc(var(--epk-contact-glitch,0)*5px)); clip-path:inset(40% 0 20% 0); }
          9.3%   { opacity:calc(var(--epk-contact-glitch,0)*1.0); transform:var(--cg-base-tx) translateX(calc(var(--epk-contact-glitch,0)*-4px)) skewX(calc(var(--epk-contact-glitch,0)*-2deg)); clip-path:inset(55% 0 5% 0); }
          9.6%   { opacity:calc(var(--epk-contact-glitch,0)*0.5); transform:var(--cg-base-tx) translateX(calc(var(--epk-contact-glitch,0)*3px)); clip-path:inset(70% 0 10% 0); }
          10%    { opacity:0; transform:var(--cg-base-tx); clip-path:none; }
          
          21%    { opacity:calc(var(--epk-contact-glitch,0)*0.15); transform:var(--cg-base-tx) translateX(1.5px); clip-path:inset(10% 0 85% 0); }
          21.1%  { opacity:0; }
          32%    { opacity:calc(var(--epk-contact-glitch,0)*0.10); transform:var(--cg-base-tx) translateY(-1.5px); clip-path:inset(80% 0 15% 0); }
          32.1%  { opacity:0; }

          35%,43%{ opacity:0; transform:var(--cg-base-tx); clip-path:none; }
          43.4%  { opacity:calc(var(--epk-contact-glitch,0)*0.8); transform:translateX(calc(var(--epk-contact-glitch,0)*6px)); clip-path:inset(22% 0 55% 0); filter:grayscale(20%) contrast(1.5) brightness(1.3); }
          43.7%  { opacity:calc(var(--epk-contact-glitch,0)*0.95); transform:translateX(calc(var(--epk-contact-glitch,0)*-5px)) skewX(calc(var(--epk-contact-glitch,0)*1.5deg)); clip-path:inset(60% 0 8% 0); }
          44%    { opacity:0; transform:var(--cg-base-tx); clip-path:none; }

          68%    { opacity:calc(var(--epk-contact-glitch,0)*0.18); transform:var(--cg-base-tx) translateX(-2.5px); clip-path:inset(45% 0 52% 0); }
          68.1%  { opacity:0; }
          82%    { opacity:calc(var(--epk-contact-glitch,0)*0.12); transform:var(--cg-base-tx) scale(1.025); clip-path:inset(5% 0 90% 0); }
          82.1%  { opacity:0; }
          95%    { opacity:calc(var(--epk-contact-glitch,0)*0.15); transform:var(--cg-base-tx) translateX(3.5px); clip-path:inset(85% 0 5% 0); }
          95.1%  { opacity:0; }

          100%   { opacity:0; }
      }
      @keyframes cgRgb {
          0%,8%  { opacity:0; }
          8.5%   { opacity:calc(var(--epk-contact-glitch,0)*0.35); transform:var(--cg-base-tx) translate(calc(var(--epk-contact-glitch,0)*8px),calc(var(--epk-contact-glitch,0)*-2px)); }
          9%     { opacity:calc(var(--epk-contact-glitch,0)*0.25); transform:var(--cg-base-tx) translate(calc(var(--epk-contact-glitch,0)*-7px),1px); }
          9.5%   { opacity:calc(var(--epk-contact-glitch,0)*0.3); transform:var(--cg-base-tx) translate(calc(var(--epk-contact-glitch,0)*6px),0); }
          10%    { opacity:0; }

          21%    { opacity:calc(var(--epk-contact-glitch,0)*0.10); transform:var(--cg-base-tx) translate(-2.5px, 1.5px); }
          21.1%  { opacity:0; }
          68%    { opacity:calc(var(--epk-contact-glitch,0)*0.12); transform:var(--cg-base-tx) translate(3.5px, -1.5px); }
          68.1%  { opacity:0; }

          43%    { opacity:calc(var(--epk-contact-glitch,0)*0.3); transform:var(--cg-base-tx) translate(calc(var(--epk-contact-glitch,0)*-6px),2px); }
          44%    { opacity:0; }
          100%   { opacity:0; }
      }

      /* ── GLITCH PRESS CARDS ────────────────────────────────── */
      .press-glitch-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          width: 100%;
      }
      @media (max-width: 768px) {
          .press-glitch-grid {
              gap: 6px;
          }
      }

      .press-glitch-card {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          background: #060606;
          aspect-ratio: 9/14;
          cursor: pointer;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(var(--accent-rgb), 0.15);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
      }
      .press-glitch-card:hover {
          border-color: rgba(var(--accent-rgb), 0.6);
          box-shadow: 0 0 18px rgba(var(--accent-rgb), 0.12), inset 0 0 30px rgba(var(--accent-rgb), 0.04);
      }

      /* Background hero image — hidden by default, glitches in */
      .press-glitch-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          opacity: 0;
          filter: grayscale(100%) contrast(1.4) brightness(0.65);
          mix-blend-mode: luminosity;
          pointer-events: none;
          will-change: opacity, transform, clip-path;
          z-index: 1;
      }

      /* Scanline overlay — always on */
      .press-glitch-card::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 5;
          background: repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.22) 2px,
              rgba(0,0,0,0.22) 4px
          );
          pointer-events: none;
      }

      /* White flare burst — synced to glitch moments via ::after */
      .press-glitch-card::after {
          content: '';
          position: absolute;
          left: -20%;
          right: -20%;
          height: 3px;
          top: 30%;
          z-index: 6;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9) 40%, rgba(220,255,250,0.7) 60%, transparent);
          opacity: 0;
          pointer-events: none;
          filter: blur(1px);
          mix-blend-mode: screen;
      }

      /* RGB channel split layer */
      .press-glitch-rgb {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          opacity: 0;
          filter: grayscale(100%) contrast(1.4) brightness(0.55);
          mix-blend-mode: screen;
          pointer-events: none;
          z-index: 2;
      }

      /* ── AURORA / NORTHERN LIGHTS layer ── */
      .press-glitch-aurora {
          position: absolute;
          inset: -20%;
          z-index: 3;
          opacity: 0.18;
          pointer-events: none;
          mix-blend-mode: screen;
          animation: pgAurora 12s ease-in-out infinite alternate;
          border-radius: 50%;
          filter: blur(18px);
      }
      .press-glitch-aurora-2 {
          position: absolute;
          inset: -30%;
          z-index: 3;
          opacity: 0.12;
          pointer-events: none;
          mix-blend-mode: screen;
          animation: pgAurora2 18s ease-in-out infinite alternate;
          border-radius: 40%;
          filter: blur(24px);
      }

      /* Press Profile 1: Cold Cyan (Accent Mix) */
      .pg-flare-1 .press-glitch-aurora {
          animation-duration: 10s; animation-delay: -3s;
          background: conic-gradient(from 200deg at 38% 52%, transparent 0deg, rgba(var(--accent-rgb),0.6) 30deg, rgba(160, 230, 220, 0.4) 60deg, transparent 90deg, rgba(var(--accent-rgb),0.5) 150deg, rgba(142, 142, 175, 0.3) 200deg, transparent 250deg, rgba(var(--accent-rgb),0.4) 300deg, transparent 360deg);
      }
      .pg-flare-1 .press-glitch-aurora-2 {
          animation-duration: 16s; animation-delay: -5s;
          background: conic-gradient(from 80deg at 62% 48%, transparent 0deg, rgba(31, 63, 63, 0.3) 40deg, rgba(var(--accent-rgb),0.3) 80deg, transparent 130deg, rgba(160, 230, 220, 0.3) 200deg, rgba(142, 142, 175, 0.2) 240deg, transparent 290deg, rgba(31, 63, 63, 0.2) 330deg, transparent 360deg);
      }

      /* Press Profile 2: Deep Petrol (Accent Mix) */
      .pg-flare-2 .press-glitch-aurora {
          animation-duration: 14s; animation-delay: -7s;
          background: conic-gradient(from 200deg at 65% 35%, transparent 0deg, rgba(var(--accent-rgb),0.6) 30deg, rgba(31, 63, 63, 0.5) 60deg, transparent 90deg, rgba(var(--accent-rgb),0.5) 150deg, rgba(160, 230, 220, 0.3) 200deg, transparent 250deg, rgba(var(--accent-rgb),0.4) 300deg, transparent 360deg);
      }
      .pg-flare-2 .press-glitch-aurora-2 {
          animation-duration: 20s; animation-delay: -10s;
          background: conic-gradient(from 80deg at 35% 65%, transparent 0deg, rgba(142, 142, 175, 0.3) 40deg, rgba(var(--accent-rgb),0.3) 80deg, transparent 130deg, rgba(31, 63, 63, 0.4) 200deg, rgba(160, 230, 220, 0.2) 240deg, transparent 290deg, rgba(142, 142, 175, 0.2) 330deg, transparent 360deg);
      }

      /* Press Profile 3: Heather Gray (Accent Mix) */
      .pg-flare-3 .press-glitch-aurora {
          animation-duration: 16s; animation-delay: -12s;
          background: conic-gradient(from 200deg at 50% 50%, transparent 0deg, rgba(var(--accent-rgb),0.6) 30deg, rgba(142, 142, 175, 0.5) 60deg, transparent 90deg, rgba(var(--accent-rgb),0.5) 150deg, rgba(31, 63, 63, 0.3) 200deg, transparent 250deg, rgba(var(--accent-rgb),0.4) 300deg, transparent 360deg);
      }
      .pg-flare-3 .press-glitch-aurora-2 {
          animation-duration: 23s; animation-delay: -14s;
          background: conic-gradient(from 80deg at 50% 50%, transparent 0deg, rgba(160, 230, 220, 0.3) 40deg, rgba(var(--accent-rgb),0.3) 80deg, transparent 130deg, rgba(142, 142, 175, 0.4) 200deg, rgba(160, 230, 220, 0.2) 240deg, transparent 290deg, rgba(31, 63, 63, 0.2) 330deg, transparent 360deg);
      }

      .press-glitch-content {
          position: relative;
          z-index: 7;
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 10px 8px 0;
      }

      .press-glitch-badge {
          align-self: flex-end;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--accent);
          border: 1px solid var(--accent);
          border-radius: 4px;
          padding: 2px 5px;
          background: rgba(var(--accent-rgb), 0.1);
          margin-bottom: 4px;
          text-shadow: 0 0 6px var(--accent);
      }

      .press-glitch-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: rgba(255,255,255,0.45);
          margin-top: auto;
          margin-bottom: 2px;
          padding: 0 1px;
      }

      .press-glitch-download {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 8px 4px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent);
          border-top: 1px solid rgba(var(--accent-rgb), 0.3);
          background: rgba(var(--accent-rgb), 0.05);
          box-shadow: 0 -4px 14px rgba(var(--accent-rgb), 0.1), 0 0 20px rgba(var(--accent-rgb), 0.05) inset;
          transition: background 0.2s, box-shadow 0.2s;
          margin-top: 8px;
          text-shadow: 0 0 8px var(--accent);
      }
      .press-glitch-card:hover .press-glitch-download {
          background: rgba(var(--accent-rgb), 0.14);
          box-shadow: 0 -6px 24px rgba(var(--accent-rgb), 0.22), 0 0 30px rgba(var(--accent-rgb), 0.1) inset;
      }

      /* ── AURORA KEYFRAMES ── */
      @keyframes pgAurora {
          0%   { transform: rotate(0deg) scale(1) translate(0%, 0%); opacity: 0.18; }
          25%  { transform: rotate(15deg) scale(1.1) translate(3%, -4%); opacity: 0.22; }
          50%  { transform: rotate(-8deg) scale(0.95) translate(-2%, 5%); opacity: 0.15; }
          75%  { transform: rotate(22deg) scale(1.08) translate(4%, 2%); opacity: 0.25; }
          100% { transform: rotate(-5deg) scale(1.05) translate(-3%, -2%); opacity: 0.19; }
      }
      @keyframes pgAurora2 {
          0%   { transform: rotate(0deg) scale(1) translate(0%, 0%); opacity: 0.12; }
          33%  { transform: rotate(-20deg) scale(1.15) translate(-5%, 3%); opacity: 0.16; }
          66%  { transform: rotate(12deg) scale(0.9) translate(4%, -5%); opacity: 0.1; }
          100% { transform: rotate(-10deg) scale(1.1) translate(2%, 4%); opacity: 0.14; }
      }

      /* ── WHITE FLARE keyframes — synced to each card's glitch timing ── */
      @keyframes pgFlare1 {
          0%,71%   { opacity:0; top:30%; transform:scaleY(1); }
          72%      { opacity:0.85; top:22%; transform:scaleY(2.5); filter:blur(0px); }
          72.5%    { opacity:0.4; top:55%; transform:scaleY(1); filter:blur(2px); }
          73%      { opacity:0.9; top:40%; transform:scaleY(3); filter:blur(0.5px); }
          73.5%    { opacity:0; top:30%; }
          81%      { opacity:0; top:60%; }
          82%      { opacity:0.7; top:15%; transform:scaleY(2); filter:blur(1px); }
          82.5%    { opacity:0.3; top:70%; transform:scaleY(1.5); }
          83%      { opacity:0.8; top:45%; transform:scaleY(2.5); filter:blur(0px); }
          83.5%    { opacity:0; }
          100%     { opacity:0; }
      }
      @keyframes pgFlare2 {
          0%,59%   { opacity:0; top:40%; }
          60%      { opacity:0.7; top:28%; transform:scaleY(2); filter:blur(1px); }
          60.5%    { opacity:0.35; top:62%; transform:scaleY(1); }
          61%      { opacity:0.75; top:38%; transform:scaleY(3); filter:blur(0px); }
          61.5%    { opacity:0; }
          77%      { opacity:0; top:50%; }
          78%      { opacity:0.6; top:18%; transform:scaleY(2.5); }
          78.5%    { opacity:0; }
          100%     { opacity:0; }
      }
      @keyframes pgFlare3 {
          0%,84%   { opacity:0; top:35%; }
          85%      { opacity:0.5; top:25%; transform:scaleY(2); filter:blur(1.5px); }
          85.5%    { opacity:0.2; top:65%; transform:scaleY(1); }
          86%      { opacity:0.55; top:42%; transform:scaleY(2); filter:blur(0.5px); }
          86.5%    { opacity:0; }
          93%      { opacity:0; top:50%; }
          94%      { opacity:0.4; top:20%; transform:scaleY(1.5); }
          94.5%    { opacity:0; }
          100%     { opacity:0; }
      }

      /* ── ENHANCED IMAGE GLITCH KEYFRAMES ── */
      @keyframes pgGlitch1 {
          0%,70%  { opacity:0; clip-path:inset(50% 0 50% 0); transform:translateX(0) skewX(0); filter:grayscale(100%) contrast(1.4) brightness(0.65); }
          71%     { opacity:0.75; clip-path:inset(5% 0 68% 0); transform:translateX(-5px) skewX(-1deg); filter:grayscale(100%) contrast(2) brightness(1.1); }
          71.5%   { opacity:0.5; clip-path:inset(58% 0 10% 0); transform:translateX(6px) skewX(1.5deg); filter:grayscale(100%) contrast(1.6) brightness(0.8); }
          72%     { opacity:0.9; clip-path:inset(30% 0 38% 0); transform:translateX(-3px) skewX(-0.5deg); filter:grayscale(100%) contrast(2.2) brightness(1.3); }
          72.5%   { opacity:0; clip-path:inset(50% 0 50% 0); transform:translateX(0); }
          73%     { opacity:0.6; clip-path:inset(12% 0 72% 0); transform:translateX(4px); filter:grayscale(100%) contrast(1.8) brightness(0.9); }
          73.5%   { opacity:0; clip-path:inset(50% 0 50% 0); transform:translateX(0); }
          80%     { opacity:0; }
          81%     { opacity:0.7; clip-path:inset(22% 0 52% 0); transform:translateX(-6px) skewX(2deg); filter:grayscale(100%) contrast(2) brightness(1.2); }
          81.5%   { opacity:0.45; clip-path:inset(72% 0 6% 0); transform:translateX(5px) skewX(-1deg); filter:grayscale(100%) contrast(1.5) brightness(0.7); }
          82%     { opacity:0.8; clip-path:inset(42% 0 22% 0); transform:translateX(-4px); filter:grayscale(100%) contrast(2.4) brightness(1.4); }
          82.5%   { opacity:0; clip-path:inset(50% 0 50% 0); transform:translateX(0); }
          100%    { opacity:0; clip-path:inset(50% 0 50% 0); transform:translateX(0); }
      }
      @keyframes pgGlitch2 {
          0%,58%  { opacity:0; clip-path:inset(50% 0 50% 0); transform:translateX(0); filter:grayscale(100%) contrast(1.4) brightness(0.65); }
          59%     { opacity:0.65; clip-path:inset(28% 0 42% 0); transform:translateX(4px) skewX(-1deg); filter:grayscale(100%) contrast(1.8) brightness(1.0); }
          59.5%   { opacity:0.35; clip-path:inset(62% 0 12% 0); transform:translateX(-5px) skewX(1deg); filter:grayscale(100%) contrast(2) brightness(0.9); }
          60%     { opacity:0.7; clip-path:inset(8% 0 65% 0); transform:translateX(3px); filter:grayscale(100%) contrast(2.2) brightness(1.2); }
          60.5%   { opacity:0; clip-path:inset(50% 0 50% 0); transform:translateX(0); }
          76%     { opacity:0; }
          77%     { opacity:0.6; clip-path:inset(15% 0 58% 0); transform:translateX(-4px) skewX(0.8deg); filter:grayscale(100%) contrast(1.9) brightness(1.1); }
          77.5%   { opacity:0.4; clip-path:inset(52% 0 28% 0); transform:translateX(5px) skewX(-1.5deg); }
          78%     { opacity:0; clip-path:inset(50% 0 50% 0); transform:translateX(0); }
          100%    { opacity:0; clip-path:inset(50% 0 50% 0); transform:translateX(0); }
      }
      @keyframes pgGlitch3 {
          0%,83%  { opacity:0; clip-path:inset(50% 0 50% 0); transform:translateX(0); filter:grayscale(100%) contrast(1.4) brightness(0.65); }
          84%     { opacity:0.42; clip-path:inset(20% 0 48% 0); transform:translateX(-3px) skewX(-0.5deg); filter:grayscale(100%) contrast(1.7) brightness(0.95); }
          84.5%   { opacity:0.22; clip-path:inset(66% 0 8% 0); transform:translateX(3px) skewX(0.8deg); }
          85%     { opacity:0.5; clip-path:inset(38% 0 32% 0); transform:translateX(-2px); filter:grayscale(100%) contrast(2) brightness(1.1); }
          85.5%   { opacity:0; clip-path:inset(50% 0 50% 0); transform:translateX(0); }
          92%     { opacity:0; }
          93%     { opacity:0.35; clip-path:inset(45% 0 30% 0); transform:translateX(2px); filter:grayscale(100%) contrast(1.6) brightness(0.9); }
          93.5%   { opacity:0; clip-path:inset(50% 0 50% 0); }
          100%    { opacity:0; clip-path:inset(50% 0 50% 0); transform:translateX(0); }
      }

      /* Enhanced RGB channel split with stronger chromatic aberration */
      @keyframes pgRgb1 {
          0%,70%  { opacity:0; transform:translateX(0); }
          71%     { opacity:0.3; transform:translateX(-7px); filter:grayscale(0%) contrast(1.5) brightness(0.6) sepia(1) hue-rotate(-30deg) saturate(8); }
          71.5%   { opacity:0.2; transform:translateX(8px); filter:grayscale(0%) contrast(1.5) brightness(0.5) sepia(1) hue-rotate(170deg) saturate(8); }
          72%     { opacity:0; transform:translateX(0); }
          81%     { opacity:0.25; transform:translateX(-6px); filter:grayscale(0%) contrast(1.5) brightness(0.6) sepia(1) hue-rotate(-40deg) saturate(8); }
          82%     { opacity:0; transform:translateX(0); }
          100%    { opacity:0; }
      }
      @keyframes pgRgb2 {
          0%,58%  { opacity:0; transform:translateX(0); }
          59%     { opacity:0.24; transform:translateX(-6px); filter:grayscale(0%) contrast(1.5) brightness(0.6) sepia(1) hue-rotate(-30deg) saturate(7); }
          59.5%   { opacity:0.16; transform:translateX(6px); filter:grayscale(0%) contrast(1.5) brightness(0.5) sepia(1) hue-rotate(160deg) saturate(7); }
          60%     { opacity:0; transform:translateX(0); }
          77%     { opacity:0.2; transform:translateX(5px); filter:grayscale(0%) contrast(1.5) brightness(0.55) sepia(1) hue-rotate(-20deg) saturate(7); }
          77.5%   { opacity:0; transform:translateX(0); }
          100%    { opacity:0; }
      }
      @keyframes pgRgb3 {
          0%,83%  { opacity:0; transform:translateX(0); }
          84%     { opacity:0.18; transform:translateX(-4px); filter:grayscale(0%) contrast(1.5) brightness(0.6) sepia(1) hue-rotate(-30deg) saturate(6); }
          84.5%   { opacity:0.12; transform:translateX(4px); filter:grayscale(0%) contrast(1.5) brightness(0.5) sepia(1) hue-rotate(150deg) saturate(6); }
          85%     { opacity:0; transform:translateX(0); }
          93%     { opacity:0.14; transform:translateX(-3px); filter:grayscale(0%) contrast(1.4) brightness(0.55) sepia(1) hue-rotate(-25deg) saturate(6); }
          93.5%   { opacity:0; transform:translateX(0); }
          100%    { opacity:0; }
      }

      .pg-img-1 { animation: pgGlitch1 4s infinite; }
      .pg-img-2 { animation: pgGlitch2 6.5s infinite; animation-delay: -2.1s; }
      .pg-img-3 { animation: pgGlitch3 9s infinite; animation-delay: -5.7s; }
      .pg-rgb-1 { animation: pgRgb1 4s infinite; }
      .pg-rgb-2 { animation: pgRgb2 6.5s infinite; animation-delay: -2.1s; }
      .pg-rgb-3 { animation: pgRgb3 9s infinite; animation-delay: -5.7s; }

      /* FLARE on ::after — per-card staggered */
      .pg-flare-1::after { animation: pgFlare1 4s infinite; }
      .pg-flare-2::after { animation: pgFlare2 6.5s infinite; animation-delay: -2.1s; }
      .pg-flare-3::after { animation: pgFlare3 9s infinite; animation-delay: -5.7s; }

      /* Hover: freeze glitch at full brightness, aurora pulses */
      .press-glitch-card:hover .pg-img-1,
      .press-glitch-card:hover .pg-img-2,
      .press-glitch-card:hover .pg-img-3 {
          opacity: 0.6 !important;
          clip-path: inset(0) !important;
          animation-play-state: paused;
          transition: opacity 0.2s;
          filter: grayscale(100%) contrast(1.6) brightness(0.75) !important;
      }
      .press-glitch-card:hover .pg-rgb-1,
      .press-glitch-card:hover .pg-rgb-2,
      .press-glitch-card:hover .pg-rgb-3 {
          opacity: 0.18 !important;
          animation-play-state: paused;
          transition: opacity 0.2s;
      }
      

      /* ── TRACK GLITCH CARDS (Multimedia / Selected Tracks) ─── */
      .track-glitch-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          width: 100%;
      }
      .track-glitch-card {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          background: #040a06;
          aspect-ratio: 3/4;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(var(--accent-rgb), 0.18);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          transform: translateZ(0);
      }
      .track-glitch-card:hover, .track-glitch-card.is-playing {
          border-color: rgba(var(--accent-rgb), 0.65);
          box-shadow: 0 0 22px rgba(var(--accent-rgb), 0.18), inset 0 0 40px rgba(var(--accent-rgb), 0.05);
      }
      .track-glitch-img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; object-position: center top;
          opacity: 0; filter: grayscale(100%) contrast(1.2) brightness(0.6);
          mix-blend-mode: luminosity; pointer-events: none; z-index: 1;
          will-change: opacity, transform, clip-path;
      }
      .track-glitch-rgb {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; object-position: center top;
          opacity: 0; filter: grayscale(100%) contrast(1.4) brightness(0.55);
          mix-blend-mode: screen; pointer-events: none; z-index: 2;
      }
      .track-glitch-card::before {
          content: ''; position: absolute; inset: 0; z-index: 5; pointer-events: none;
          background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.2) 2px,rgba(0,0,0,0.2) 4px);
      }
      .track-glitch-card::after {
          content: ''; position: absolute; left: -20%; right: -20%; height: 3px; top: 30%;
          z-index: 6; opacity: 0; pointer-events: none; filter: blur(1px); mix-blend-mode: screen;
          background: linear-gradient(90deg,transparent,rgba(255,255,255,0.85) 40%,rgba(200,255,220,0.65) 60%,transparent);
      }
      .track-glitch-aurora {
          position: absolute; inset: -20%; z-index: 3; opacity: 0.15; pointer-events: none;
          mix-blend-mode: screen; animation: tgAurora 18s ease-in-out infinite alternate;
          border-radius: 50%; filter: blur(16px); transition: opacity 1s ease;
      }
      .track-glitch-aurora-2 {
          position: absolute; inset: -30%; z-index: 3; opacity: 0.09; pointer-events: none;
          mix-blend-mode: screen; animation: tgAurora2 28s ease-in-out infinite alternate;
          border-radius: 40%; filter: blur(22px); transition: opacity 1s ease;
      }

      /* Profile 1: Ice Cyan (Accent Mix) */
      .tg-flare-1 .track-glitch-aurora {
          animation-duration: 16s; animation-delay: -3s;
          background: conic-gradient(from 160deg at 42% 48%, transparent 0deg, rgba(var(--accent-rgb),0.9) 25deg, rgba(160, 230, 220, 0.6) 55deg, rgba(142, 142, 175, 0.4) 120deg, transparent 180deg, rgba(var(--accent-rgb),0.5) 200deg, rgba(160, 230, 220, 0.4) 240deg, transparent 270deg, rgba(var(--accent-rgb),0.6) 320deg, transparent 360deg);
      }
      .tg-flare-1 .track-glitch-aurora-2 {
          animation-duration: 24s; animation-delay: -6s;
          background: conic-gradient(from 60deg at 58% 52%, transparent 0deg, rgba(160, 230, 220, 0.5) 35deg, rgba(142, 142, 175, 0.3) 70deg, transparent 120deg, rgba(var(--accent-rgb),0.5) 190deg, rgba(160, 230, 220, 0.3) 230deg, transparent 280deg, rgba(31, 63, 63, 0.45) 330deg, transparent 360deg);
      }

      /* Profile 2: Deep Petrol (Accent Mix) */
      .tg-flare-2 .track-glitch-aurora {
          animation-duration: 20s; animation-delay: -8s;
          background: conic-gradient(from 160deg at 58% 62%, transparent 0deg, rgba(var(--accent-rgb),0.9) 25deg, rgba(31, 63, 63, 0.7) 55deg, rgba(142, 142, 175, 0.5) 80deg, transparent 110deg, rgba(var(--accent-rgb),0.5) 200deg, rgba(31, 63, 63, 0.4) 240deg, transparent 270deg, rgba(var(--accent-rgb),0.6) 320deg, transparent 360deg);
      }
      .tg-flare-2 .track-glitch-aurora-2 {
          animation-duration: 30s; animation-delay: -12s;
          background: conic-gradient(from 60deg at 42% 38%, transparent 0deg, rgba(31, 63, 63, 0.5) 35deg, rgba(160, 230, 220, 0.4) 70deg, transparent 120deg, rgba(var(--accent-rgb),0.5) 190deg, rgba(142, 142, 175, 0.3) 230deg, transparent 280deg, rgba(31, 63, 63, 0.45) 330deg, transparent 360deg);
      }

      /* Profile 3: Heather Gray (Accent Mix) */
      .tg-flare-3 .track-glitch-aurora {
          animation-duration: 22s; animation-delay: -14s;
          background: conic-gradient(from 160deg at 50% 68%, transparent 0deg, rgba(var(--accent-rgb),0.9) 25deg, rgba(142, 142, 175, 0.7) 55deg, rgba(160, 230, 220, 0.4) 80deg, transparent 110deg, rgba(var(--accent-rgb),0.5) 200deg, rgba(142, 142, 175, 0.3) 240deg, transparent 270deg, rgba(var(--accent-rgb),0.6) 320deg, transparent 360deg);
      }
      .tg-flare-3 .track-glitch-aurora-2 {
          animation-duration: 36s; animation-delay: -18s;
          background: conic-gradient(from 60deg at 50% 32%, transparent 0deg, rgba(142, 142, 175, 0.5) 35deg, rgba(31, 63, 63, 0.15) 70deg, transparent 120deg, rgba(var(--accent-rgb),0.5) 190deg, rgba(160, 230, 220, 0.3) 230deg, transparent 280deg, rgba(142, 142, 175, 0.45) 330deg, transparent 360deg);
      }
      .track-glitch-card:hover .track-glitch-aurora,
      .track-glitch-card.is-playing .track-glitch-aurora { opacity: 0.28; }
      .track-glitch-card:hover .track-glitch-aurora-2,
      .track-glitch-card.is-playing .track-glitch-aurora-2 { opacity: 0.16; }
      /* Scanlines hide on hover */
      .track-glitch-card::before { transition: opacity 0.5s ease; }
      .track-glitch-card:hover::before { opacity: 0 !important; }
      @keyframes tgAurora {
          0%   { transform: rotate(0deg) scale(1) translate(0%,0%); opacity: 0.26; }
          25%  { transform: rotate(14deg) scale(1.1) translate(3%,-4%); opacity: 0.33; }
          50%  { transform: rotate(-8deg) scale(0.94) translate(-2%,5%); opacity: 0.22; }
          75%  { transform: rotate(20deg) scale(1.08) translate(4%,2%); opacity: 0.35; }
          100% { transform: rotate(-5deg) scale(1.04) translate(-3%,-2%); opacity: 0.28; }
      }
      @keyframes tgAurora2 {
          0%   { transform: rotate(0deg) scale(1) translate(0%,0%); opacity: 0.16; }
          33%  { transform: rotate(-18deg) scale(1.14) translate(-5%,3%); opacity: 0.21; }
          66%  { transform: rotate(11deg) scale(0.9) translate(4%,-5%); opacity: 0.13; }
          100% { transform: rotate(-10deg) scale(1.1) translate(2%,4%); opacity: 0.19; }
      }
      .track-glitch-content {
          position: relative; z-index: 7; display: flex; flex-direction: column;
          height: 100%; padding: 8px 8px 0;
      }
      .track-glitch-num { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;opacity:.3;color:#fff;margin-bottom:auto; }
      .track-glitch-title { font-weight:700;color:#fff;font-size:11px;line-height:1.2;margin-bottom:2px; }
      @media (min-width: 768px) { .track-glitch-title { font-size: 14px; } }
      .track-glitch-desc { font-size:9px;color:#d4d4d8;font-style:italic;opacity:.75; }
      .track-glitch-topline { position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(to right,transparent,var(--accent),transparent);z-index:8; }
      .track-glitch-play {
          position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
          z-index:9;opacity:0;transition:opacity 0.4s ease;pointer-events:none;
      }
      .track-glitch-card:hover .track-glitch-play,
      .track-glitch-card.is-playing .track-glitch-play { opacity:1; }
      .track-glitch-play-btn {
          width:36px;height:36px;border-radius:50%;border:2px solid var(--accent);
          display:flex;align-items:center;justify-content:center;color:#fff;
          background:rgba(255,255,255,0.08);backdrop-filter:blur(12px);
          -webkit-backdrop-filter:blur(12px);box-shadow:0 0 20px rgba(var(--accent-rgb),0.25);position:relative;
      }
      .track-glitch-bar {
          display:flex;align-items:center;justify-content:center;gap:4px;
          padding:7px 4px;font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;
          color:var(--accent);border-top:1px solid rgba(var(--accent-rgb),0.3);
          background:rgba(var(--accent-rgb),0.04);box-shadow:0 -4px 12px rgba(var(--accent-rgb),0.08);
          transition:background .2s,box-shadow .2s;margin-top:6px;text-shadow:0 0 8px var(--accent);
      }
      .track-glitch-bar::after {
          content: 'Listen';
      }
      .track-glitch-card:hover .track-glitch-bar,
      .track-glitch-card.is-playing .track-glitch-bar {
          background:rgba(var(--accent-rgb),0.13);box-shadow:0 -5px 22px rgba(var(--accent-rgb),0.2);
      }
      .track-glitch-card:hover .tg-img-1,.track-glitch-card:hover .tg-img-2,.track-glitch-card:hover .tg-img-3,
      .track-glitch-card.is-playing .tg-img-1,.track-glitch-card.is-playing .tg-img-2,.track-glitch-card.is-playing .tg-img-3 {
          opacity:0.6 !important;clip-path:inset(0) !important;animation-play-state:paused;
          filter:grayscale(100%) contrast(1.5) brightness(0.7) !important;
      }
      .track-glitch-card:hover .tg-rgb-1,.track-glitch-card:hover .tg-rgb-2,.track-glitch-card:hover .tg-rgb-3,
      .track-glitch-card.is-playing .tg-rgb-1,.track-glitch-card.is-playing .tg-rgb-2,.track-glitch-card.is-playing .tg-rgb-3 {
          opacity:0.18 !important;animation-play-state:paused;
      }
      /* Track: glitch-burst then hold image open until next cycle */
      .tg-img-1 { animation: tgReveal1 5s infinite; }
      .tg-img-2 { animation: tgReveal2 7.5s infinite; animation-delay: -4.1s; }
      .tg-img-3 { animation: tgReveal3 11s infinite; animation-delay: -7.3s; }
      .tg-rgb-1 { animation: tgRgbR1 5s infinite; }
      .tg-rgb-2 { animation: tgRgbR2 7.5s infinite; animation-delay: -4.1s; }
      .tg-rgb-3 { animation: tgRgbR3 11s infinite; animation-delay: -7.3s; }
      .tg-flare-1::after { animation: pgFlare1 5s infinite; }
      .tg-flare-2::after { animation: pgFlare2 7.5s infinite; animation-delay: -4.1s; }
      .tg-flare-3::after { animation: pgFlare3 11s infinite; animation-delay: -7.3s; }

      /* Card 1 — 5s: glitch at 2-4.5%, hold open 5-97% */
      @keyframes tgReveal1 {
        0%    { opacity:0; transform:var(--hg-base-tx); clip-path:none; filter:grayscale(100%) contrast(1.2) brightness(0.6); }
        2%    { opacity:.95; transform:translateX(-7px); clip-path:inset(12% 0 62% 0); filter:grayscale(100%) contrast(1.8) brightness(1.4); }
        3%    { opacity:.7;  transform:translateX(5px);  clip-path:inset(48% 0 18% 0); }
        3.5%  { opacity:1;   transform:translateX(-4px) skewX(-1.5deg); clip-path:inset(28% 0 38% 0); }
        4%    { opacity:.8;  transform:translateX(3px);  clip-path:inset(65% 0 8% 0); }
        5%    { opacity:.38; transform:var(--hg-base-tx); clip-path:none; filter:grayscale(100%) contrast(1.2) brightness(0.6); }
        52%   { opacity:.9;  transform:translateX(4px); clip-path:inset(30% 0 45% 0); filter:grayscale(100%) contrast(1.6) brightness(1.2); }
        53%   { opacity:.38; transform:var(--hg-base-tx); clip-path:none; filter:grayscale(100%) contrast(1.2) brightness(0.6); }
        95%,97%{ opacity:.38; transform:var(--hg-base-tx); clip-path:none; }
        99%   { opacity:0; } 100% { opacity:0; }
      }
      /* Card 2 — 7.5s: glitch at 12-15%, hold open 16-97% */
      @keyframes tgReveal2 {
        0%,10%{ opacity:0; transform:var(--hg-base-tx); clip-path:none; filter:grayscale(100%) contrast(1.2) brightness(0.6); }
        12%   { opacity:.9;  transform:translateX(7px); clip-path:inset(18% 0 55% 0); filter:grayscale(100%) contrast(1.7) brightness(1.3); }
        13%   { opacity:.65; transform:translateX(-6px); clip-path:inset(55% 0 12% 0); }
        13.5% { opacity:1;   transform:translateX(3px) skewX(1deg); clip-path:inset(35% 0 30% 0); }
        14%   { opacity:.7;  transform:none; clip-path:inset(70% 0 5% 0); }
        16%   { opacity:.38; transform:var(--hg-base-tx); clip-path:none; filter:grayscale(100%) contrast(1.2) brightness(0.6); }
        60%   { opacity:.85; transform:translateX(-5px); clip-path:inset(40% 0 35% 0); filter:grayscale(100%) contrast(1.5) brightness(1.2); }
        61%   { opacity:.38; transform:var(--hg-base-tx); clip-path:none; filter:grayscale(100%) contrast(1.2) brightness(0.6); }
        95%,97%{ opacity:.38; transform:var(--hg-base-tx); clip-path:none; }
        99%   { opacity:0; } 100% { opacity:0; }
      }
      /* Card 3 — 11s: glitch at 24-27%, hold open 28-97% */
      @keyframes tgReveal3 {
        0%,22%{ opacity:0; transform:var(--hg-base-tx); clip-path:none; filter:grayscale(100%) contrast(1.2) brightness(0.6); }
        24%   { opacity:.95; transform:translateX(-6px); clip-path:inset(8% 0 70% 0); filter:grayscale(100%) contrast(1.9) brightness(1.5); }
        25%   { opacity:.6;  transform:translateX(5px); clip-path:inset(60% 0 10% 0); }
        25.5% { opacity:1;   transform:translateX(-3px) skewX(-2deg); clip-path:inset(20% 0 50% 0); }
        26%   { opacity:.75; transform:translateX(4px); clip-path:inset(75% 0 3% 0); }
        28%   { opacity:.38; transform:var(--hg-base-tx); clip-path:none; filter:grayscale(100%) contrast(1.2) brightness(0.6); }
        68%   { opacity:.9;  transform:translateX(6px); clip-path:inset(45% 0 28% 0); filter:grayscale(100%) contrast(1.6) brightness(1.3); }
        69%   { opacity:.38; transform:var(--hg-base-tx); clip-path:none; filter:grayscale(100%) contrast(1.2) brightness(0.6); }
        95%,97%{ opacity:.38; transform:var(--hg-base-tx); clip-path:none; }
        99%   { opacity:0; } 100% { opacity:0; }
      }
      /* RGB — faint persistent glow while card is held open */
      @keyframes tgRgbR1 {
        0%,4.4%{ opacity:0; } 2% { opacity:.3; transform:translate(8px,-2px); }
        3% { opacity:.2; transform:translate(-6px,1px); } 4% { opacity:.1; }
        5%,97%{ opacity:.06; transform:none; } 99%,100%{ opacity:0; }
      }
      @keyframes tgRgbR2 {
        0%,14.9%{ opacity:0; } 12% { opacity:.28; transform:translate(-7px,2px); }
        13% { opacity:.18; transform:translate(5px,-1px); } 14% { opacity:.08; }
        16%,97%{ opacity:.06; transform:none; } 99%,100%{ opacity:0; }
      }
      @keyframes tgRgbR3 {
        0%,26.9%{ opacity:0; } 24% { opacity:.32; transform:translate(7px,-3px); }
        25% { opacity:.2; transform:translate(-5px,1px); } 26% { opacity:.09; }
        28%,97%{ opacity:.06; transform:none; } 99%,100%{ opacity:0; }
      }

      /* SITE LOADER */
      #site-loader {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background-color: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.8s ease-out, visibility 0.8s ease-out;
      }
      #site-loader.hidden {
        opacity: 0;
        visibility: hidden;
      }
      .loader-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }
      .loader-spinner {
        width: 40px;
        height: 40px;
        border: 2px solid #333;
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      .loader-text {
        font-family: var(--font-heading);
        font-size: 0.875rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #666;
        animation: pulse 2s ease-in-out infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

      /* SCROLL DRIVEN ANIMATIONS (2026 STANDARD) */
      @keyframes reveal-up {
        from { opacity: 0; transform: translateY(50px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .scroll-reveal {
        /* Fallback for old browsers */
        opacity: 1; 
        transform: translateY(0);
      }

      /* Only apply advanced animation if supported */
      @supports (animation-timeline: view()) {
        .scroll-reveal {
          animation: reveal-up linear both;
          animation-timeline: view();
          animation-range: entry 10% cover 25%;
        }
      }
      button, a, input, select { min-height: 44px; min-width: 44px; touch-action: manipulation; }
      
      h1, .h1-scale { font-size: calc(var(--fs-display) * var(--heading-scale)); font-family: var(--font-h1); }
      h2, .h2-scale { font-size: calc(var(--fs-h1) * var(--heading-scale)); font-family: var(--font-h2); }
      h3, .h3-scale { font-size: calc(var(--fs-h2) * var(--heading-scale)); font-family: var(--font-h3); }
      h4, .h4-scale { font-family: var(--font-h4); }
      h5, .h5-scale { font-family: var(--font-h5); }
      h6, .h6-scale { font-family: var(--font-h6); }
      p, .body-scale { font-size: var(--fs-body); font-family: var(--font-body); }

      /* Updated Glitch Effect - Unified for Parity */
      .glitch-heading {
          position: relative;
          color: white;
          mix-blend-mode: vivid-light;
          transform-style: preserve-3d;
      }
      
      .glitch-heading::before,
      .glitch-heading::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
          pointer-events: none;
          
          /* CRITICAL: Force inheritance */
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          font-style: inherit;
          line-height: inherit;
          letter-spacing: inherit;
          text-transform: inherit;
          text-align: inherit;
          
          opacity: 0.8;
      }
      
      /* Layer 1: Accent Color */
      .glitch-heading::before {
          left: 0.015em;
          text-shadow: -0.015em 0 var(--accent);
          z-index: -1; 
          animation: glitch-anim-1 4s infinite linear alternate-reverse;
      }
      
      /* Layer 2: White/Gray */
      .glitch-heading::after {
          left: -0.015em;
          text-shadow: 0.015em 0 #ffffff;
          z-index: -2;
          animation: glitch-anim-2 5s infinite linear alternate-reverse;
      }
      
      /* HOVER STATE: High Intensity */
      .glitch-heading:hover::before {
          opacity: 1;
          animation: glitch-anim-hover 0.25s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
      }
      .glitch-heading:hover::after {
          opacity: 1;
          animation: glitch-anim-hover 0.25s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94) reverse both;
      }
      
      /* GLITCH ANIMATION 1 */
      @keyframes glitch-anim-1 {
          0%, 80% { opacity: 0; transform: translate(0); clip-path: inset(50% 0 50% 0); }
          81% { opacity: 1; transform: translate(-0.02em, 0.01em); clip-path: inset(20% 0 30% 0); color: var(--accent); }
          82% { opacity: 1; transform: translate(0.01em, -0.01em); clip-path: inset(60% 0 10% 0); color: #ffffff; }
          83% { opacity: 1; transform: translate(-0.01em, 0.01em); clip-path: inset(40% 0 50% 0); color: #a1a1aa; }
          84% { opacity: 0; transform: translate(0); clip-path: inset(50% 0 50% 0); }
          90% { opacity: 1; transform: translate(0.01em, -0.01em); clip-path: inset(10% 0 60% 0); color: var(--accent); }
          91% { opacity: 1; transform: translate(-0.01em, 0.01em); clip-path: inset(80% 0 5% 0); color: #ffffff; }
          100% { opacity: 0; transform: translate(0); clip-path: inset(50% 0 50% 0); }
      }
      
      /* GLITCH ANIMATION 2 */
      @keyframes glitch-anim-2 {
          0%, 75% { opacity: 0; transform: translate(0); clip-path: inset(50% 0 50% 0); }
          76% { opacity: 1; transform: translate(0.02em, -0.01em); clip-path: inset(15% 0 40% 0); color: #ffffff; }
          77% { opacity: 1; transform: translate(-0.01em, 0.02em); clip-path: inset(70% 0 5% 0); color: #71717a; }
          78% { opacity: 0; transform: translate(0); clip-path: inset(50% 0 50% 0); }
          85% { opacity: 1; transform: translate(0.01em, -0.02em); clip-path: inset(5% 0 80% 0); color: var(--accent); }
          86% { opacity: 1; transform: translate(-0.02em, 0.01em); clip-path: inset(30% 0 10% 0); color: #ffffff; }
          100% { opacity: 0; transform: translate(0); clip-path: inset(50% 0 50% 0); }
      }
      
      /* INTENSE HOVER ANIMATION */
      @keyframes glitch-anim-hover {
          0% { clip-path: inset(20% 0 80% 0); transform: translate(-0.02em, 0.01em); }
          20% { clip-path: inset(60% 0 10% 0); transform: translate(0.02em, -0.01em); }
          40% { clip-path: inset(40% 0 50% 0); transform: translate(-0.02em, 0.02em); }
          60% { clip-path: inset(80% 0 5% 0); transform: translate(0.02em, -0.02em); }
          80% { clip-path: inset(10% 0 70% 0); transform: translate(-0.01em, 0.01em); }
          100% { clip-path: inset(30% 0 20% 0); transform: translate(0.01em, 0); opacity: 0; }
      }
      
      .media-gallery-grid { 
          display: flex; 
          flex-wrap: nowrap; 
          overflow-x: auto; 
          gap: var(--media-gap); 
          padding-bottom: 3rem; /* Extra buffer */
          padding-top: 3rem;    /* Extra buffer */
          margin-top: -3rem;    /* Offset buffer */
          margin-bottom: -1rem; /* Offset buffer */
          justify-content: flex-start; 
          align-items: center; /* Center items for organic height changes */
          scroll-behavior: auto; 
          -webkit-overflow-scrolling: touch; 
          -ms-overflow-style: none; 
          scrollbar-width: none; 
          padding-left: max(1rem, 5vw); 
          padding-right: max(1rem, 5vw); 
          will-change: transform;
      }
      .media-gallery-grid::-webkit-scrollbar { display: none; width: 0; height: 0; }
      .media-gallery-item { 
          flex: 0 0 var(--media-width); 
          width: var(--media-width); 
          margin: 0; 
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.6s ease, filter 0.6s ease, box-shadow 0.6s ease;
          background: #09090b;
      }
      /* Thumbnail elements (img and video) */
      .media-gallery-item .thumb-default,
      .media-gallery-item .thumb-playing {
          width: 100%; height: 100%; object-fit: cover;
          filter: grayscale(100%) brightness(0.7);
          transition: filter 0.6s ease, transform 0.6s ease, opacity 0.5s ease;
          cursor: pointer; opacity: 0;
      }
      .media-gallery-item .thumb-default.loaded { opacity: 1; }
      /* video-thumb shows as soon as it has data */
      .media-gallery-item video.thumb-default { opacity: 1; }

      /* Punkt 2: thumb-playing hidden by default, toggled by is-playing-audio */
      .media-gallery-item .thumb-playing { opacity: 0 !important; pointer-events: none; }

      /* Active & Hover States */
      .media-gallery-item:hover:not(.is-active-slide) .thumb-default {
          filter: grayscale(0%) brightness(1);
          transform: scale(1.02);
      }

      .media-gallery-item.is-active-slide {
          z-index: 50;
          filter: grayscale(0%) brightness(1) !important;
          border-color: var(--accent) !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.8);
      }
      .media-gallery-item.is-active-slide .quote-mark { color: var(--accent); }

      /* Audio: thumb-default stays visible, modified by play state */
      .media-gallery-item.is-active-slide.is-audio-active .thumb-default {
          filter: grayscale(100%) brightness(0.7) !important;
          opacity: 1 !important;
      }
      .media-gallery-item.is-active-slide.is-audio-active.is-playing-audio .thumb-default {
          filter: grayscale(0%) brightness(1) !important;
          opacity: 1 !important;
      }
      /* Show playing thumbnail when audio plays (if set) */
      .media-gallery-item.is-active-slide.is-audio-active.is-playing-audio .thumb-playing {
          opacity: 1 !important;
          filter: grayscale(0%) brightness(1) !important;
          pointer-events: none;
      }
      /* When playing thumb is shown, hide default thumb */
      .media-gallery-item.is-active-slide.is-audio-active.is-playing-audio:has(.thumb-playing.loaded) .thumb-default {
          opacity: 0 !important;
      }

      /* Non-audio active: hide thumbnail completely */
      .media-gallery-item.is-active-slide:not(.is-audio-active) .thumb-default,
      .media-gallery-item.is-active-slide:not(.is-audio-active) .thumb-playing {
          opacity: 0 !important;
          pointer-events: none;
      }

      .media-gallery-item.is-active-slide .media-info-overlay,
      .media-gallery-item.is-active-slide .media-play-overlay {
          opacity: 0 !important;
          pointer-events: none !important;
      }

      /* Special Request: Return to grayscale if hovering over a different slide */
      .media-gallery-grid:hover .media-gallery-item.is-active-slide:not(:hover) {
          filter: grayscale(100%) brightness(0.7) !important;
          box-shadow: none;
      }
      .media-gallery-grid:hover .media-gallery-item.is-active-slide:not(:hover) .media-embed-container {
          filter: grayscale(100%) brightness(0.7);
      }

      /* Punkt 6: Custom audio play/pause button */
      .audio-custom-btn {
          width: 4rem; height: 4rem;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(8px);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--accent);
          box-shadow: 0 10px 30px rgba(0,0,0,0.6);
          cursor: pointer;
          transition: background 0.3s ease, transform 0.2s ease;
          position: relative; z-index: 40;
      }
      .audio-custom-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }

      .media-embed-container {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.5s ease;
          background: black;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
      }
      .media-gallery-item.is-active-slide .media-embed-container {
          opacity: 1;
          pointer-events: auto;
      }
      /* Audio: embed container must be transparent so thumbnail stays visible behind play button */
      .media-gallery-item.is-audio-active .media-embed-container {
          background: transparent;
      }
      .media-embed-container iframe,
      .media-embed-container video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
          object-fit: cover;
      }

      /* Social Icons */
      .social-link {
          color: #a1a1aa;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          text-decoration: none;
      }
      .social-link:hover {
          color: var(--accent) !important;
          transform: scale(1.15) translateY(-2px);
      }
      .social-link svg {
          width: 24px;
          height: 24px;
          transition: transform 0.5s ease;
      }
      @media (min-width: 768px) {
          .social-link svg {
              width: 32px;
              height: 32px;
          }
      }

      /* EPK Pitch & Quotes */
      .epk-pitch-grid {
          display: block;
          max-width: 72rem;
          margin: 0 auto;
      }
      .epk-bio-text {
          width: 100%;
          display: flow-root;
      }
      .epk-quote-box {
          float: right;
          width: 45%;
          max-width: 420px;
          margin: 1.5rem 0 3rem 3rem;
          clear: right;
      }
      @media (max-width: 768px) {
          .epk-quote-box {
              width: 55%;
              max-width: 240px;
              margin: 0.5rem 0 1.5rem 1.5rem;
              clear: right;
          }
      }

      @keyframes epk-glow-aurora {
          0% {
              transform: rotate(0deg) scale(1);
              opacity: 0;
              filter: blur(40px) hue-rotate(0deg);
          }
          5% {
              opacity: calc(var(--aura-op, 1) * 0.4);
          }
          25% {
              transform: rotate(90deg) scale(1.1);
              opacity: calc(var(--aura-op, 1) * 0.7);
              filter: blur(50px) hue-rotate(10deg);
          }
          50% {
              transform: rotate(180deg) scale(0.95);
              opacity: calc(var(--aura-op, 1) * 0.3);
              filter: blur(35px) hue-rotate(-5deg);
          }
          75% {
              transform: rotate(270deg) scale(1.05);
              opacity: calc(var(--aura-op, 1) * 0.8);
              filter: blur(45px) hue-rotate(5deg);
          }
          85% {
              opacity: calc(var(--aura-op, 1) * 0.4);
              transform: rotate(320deg) scale(1);
          }
          92%, 100% {
              transform: rotate(360deg) scale(1);
              opacity: 0;
              filter: blur(40px) hue-rotate(0deg);
          }
      }

      .epk-quote-box {
          padding: 2.5rem;
          border-radius: 1.25rem;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgb(var(--accent-rgb) / 0.15);
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          /* Fallback Parallax for Safari/Firefox */
          transform: translate3d(0, calc(var(--scroll-y, 0) * 1px * -0.12), 0);
          will-change: transform;
      }

      /* Scroll Driven Parallax for Quotes (Chrome/Edge/Opera) */
      @keyframes quote-parallax {
          from { transform: translateY(60px); }
          to { transform: translateY(-60px); }
      }

      @supports (animation-timeline: view()) {
          .epk-quote-box {
              transform: none !important; /* Disable fallback if SDA is supported */
              animation: quote-parallax linear both;
              animation-timeline: view();
              animation-range: entry 0% exit 100%;
          }
      }

      .epk-quote-glow {
          --aura-op: 0.5;
          position: absolute;
          inset: -100%;
          background: conic-gradient(
              from 0deg,
              transparent 40%,
              rgb(var(--accent-rgb) / 0.8) 50%,
              transparent 60%
          );
          animation: epk-glow-aurora 12s ease-in-out infinite;
          pointer-events: none;
          filter: blur(40px);
          z-index: 0;
          will-change: transform, opacity, filter;
      }

      .hero-aurora {
          display: var(--aura-display, block);
          position: absolute;
          inset: -50%;
          background: conic-gradient(
              from 0deg,
              transparent 30%,
              var(--aura-color, rgb(var(--accent-rgb) / 0.8)) 50%,
              transparent 70%
          );
          animation: epk-glow-aurora var(--aura-speed, 20s) ease-in-out infinite;
          pointer-events: none;
          filter: blur(80px);
          mix-blend-mode: var(--aura-blend, screen);
          z-index: 1;
          will-change: transform, opacity, filter;
      }

      @media (max-width: 768px) {
          .hero-aurora {
              filter: blur(40px);
          }
      }

      .epk-quote-box > *:not(.epk-quote-glow) {
          position: relative;
          z-index: 1;
      }

      @media (max-width: 768px) {
          .epk-quote-box {
              padding: 1.5rem;
          }
          .epk-quote-box blockquote {
              font-size: 1.1rem !important;
              margin-bottom: 1rem !important;
          }
          .epk-quote-box .quote-mark {
              font-size: 3rem !important;
          }
      }
    `;
};

/**
 * Generates a flat map of ALL CSS custom properties for a given brandData + device width.
 * Used for hot-updating the preview iframe DOM without a full srcDoc reload.
 * Resolves mobile vs desktop values based on deviceWidth.
 */
export const generateCSSVariableOverrides = (brandData: BrandState, deviceWidth: number): Record<string, string> => {
  const hexToRgb = (hex: string) => {
    if (!hex || typeof hex !== 'string') return '69 150 148';
    const cleanHex = hex.split('#').join('').trim();
    if (cleanHex.length !== 6) return '69 150 148';
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `${r} ${g} ${b}`;
  };

  const isMobile = deviceWidth < 768;
  const isSmallDesktop = deviceWidth < 1024;
  const accentRgb = hexToRgb(brandData.accentColor);

  const s = brandData.sections ?? ({} as any);
  const hHero = s.home?.hero ?? {};
  const hOrigin = s.home?.origin ?? {};
  const hLive = s.home?.live ?? {};
  const hSpot = s.home?.spotify ?? {};
  const aHero = s.about?.hero ?? {};
  const aStory = s.about?.story ?? {};
  const aMission = s.about?.mission ?? {};
  const aValues = s.about?.values ?? {};
  const contact = s.contact ?? {};
  const footer = s.footer ?? {};
  const vault = s.vault ?? {};
  const epk = s.epk;
  const safeDiv = (num: number, div: number) => (div === 0 ? 0 : num / div);

  // Helper: resolve spacing for a section
  const getSpacingVars = (cssPrefix: string, sectionData: any): Record<string, string> => {
    const layout = sectionData?.layout || {};
    const ptD = layout.paddingTopDesktop ?? 4;
    const pbD = layout.paddingBottomDesktop ?? 4;
    const ptM = layout.paddingTopMobile ?? 2;
    const pbM = layout.paddingBottomMobile ?? 2;
    const mode = layout.heightMode || 'auto';
    const mobileMode = layout.mobileHeightMode ?? mode;
    const minH = mode === 'screen' ? '100dvh' : 'auto';
    const mobileMinH = mobileMode === 'screen' ? '100dvh' : 'auto';

    return {
      [`--${cssPrefix}-pt`]: isMobile ? `${ptM}rem` : `${ptD}rem`,
      [`--${cssPrefix}-pb`]: isMobile ? `${pbM}rem` : `${pbD}rem`,
      [`--${cssPrefix}-min-h`]: isMobile ? mobileMinH : minH,
    };
  };

  // Helper: resolve framing for a section
  const getFramingVars = (prefix: string, framing: any): Record<string, string> => {
    const zoom = (isMobile ? framing?.zoomMobile : framing?.zoomDesktop) ?? 1;
    const x = (isMobile ? framing?.xOffsetMobile : framing?.xOffsetDesktop) ?? 0;
    const y = (isMobile ? framing?.yOffsetMobile : framing?.yOffsetDesktop) ?? 0;
    return {
      [`--${prefix}-zoom`]: `${zoom || 1}`,
      [`--${prefix}-x`]: `${x || 0}%`,
      [`--${prefix}-y`]: `${y || 0}%`,
    };
  };

  // Helper: resolve visuals for a section
  const getVisualVars = (prefix: string, visuals: any): Record<string, string> => {
    const sat = isMobile ? visuals.mobileSaturation : visuals.saturation;
    const dim = isMobile ? visuals.mobileDim : visuals.dim;
    const para = isMobile ? visuals.mobileParallax : visuals.parallax;
    const op = isMobile ? (visuals.mobileOpacity ?? 100) : (visuals.opacity ?? 100);
    const res: Record<string, string> = {
      [`--${prefix}-sat`]: `${sat}%`,
      [`--${prefix}-dim`]: `${dim / 100}`,
      [`--${prefix}-para`]: `${para}`,
      [`--${prefix}-op`]: `${op / 100}`,
      [`--${prefix}-aura-op`]: `${(visuals.auraOpacity ?? 15) / 100}`,
      [`--${prefix}-aura-speed`]: `${visuals.auraSpeed ?? 20}s`,
      [`--${prefix}-aura-blend`]: visuals.auraBlendMode || 'screen',
      [`--${prefix}-aura-display`]: visuals.auraEnabled ? 'block' : 'none',
      '--aura-op': `${(visuals.auraOpacity ?? 15) / 100}`,
      '--aura-blur': isMobile ? '40px' : '80px',
    };
    if (visuals.auraColor) {
      res[`--${prefix}-aura-color`] = visuals.auraColor;
    }
    return res;
  };

  // Helper: margin for a section
  const getMarginVar = (prefix: string, layout: any): Record<string, string> => {
    const margin = isMobile ? (layout.mobileMarginBottom ?? 0) : (layout.marginBottom ?? 0);
    return { [`--${prefix}-margin`]: `${margin}px` };
  };

  // Media gallery vars
  const mobileMediaWidth = safeDiv(brandData.mediaImgSizeMobile, hSpot.columnsMobile);
  const desktopMediaWidth = safeDiv(brandData.mediaImgSizeDesktop, hSpot.columnsDesktop);

  const vars: Record<string, string> = {
    // Theme
    '--accent': brandData.accentColor,
    '--accent-rgb': accentRgb,
    '--font-h1': brandData.h1Font || brandData.headingFont || "'Playfair Display', serif",
    '--font-h2': brandData.h2Font || brandData.headingFont || "'Playfair Display', serif",
    '--font-h3': brandData.h3Font || brandData.headingFont || "'Playfair Display', serif",
    '--font-h4': brandData.h4Font || brandData.headingFont || "'Playfair Display', serif",
    '--font-h5': brandData.h5Font || brandData.headingFont || "'Playfair Display', serif",
    '--font-h6': brandData.h6Font || brandData.headingFont || "'Playfair Display', serif",
    '--font-body': brandData.bodyFont || "'Montserrat', sans-serif",
    
    // Header & Menu Global
    '--header-bg': (() => {
      const opacity = brandData.menuOpacity ?? 0.4;
      const tintColor = brandData.menuTintColor || brandData.accentColor || '#000000';
      const tintAmount = brandData.menuTintAmount ?? 0.1;
      const rgb = hexToRgb(tintColor).split(' ').map(Number);
      const r = Math.round(rgb[0] * tintAmount + 10);
      const g = Math.round(rgb[1] * tintAmount + 10);
      const b = Math.round(rgb[2] * tintAmount + 10);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    })(),
    '--header-h': isMobile ? '5rem' : '6rem',
    '--header-px': isMobile ? '1rem' : '2rem',
    '--header-py': isMobile ? '1rem' : '1.5rem',

    // Dynamic Typography Sizes (device-aware)
    // NOTE: CSS var names are shifted to match computeFontSize mapping:
    // semanticType h1 → --fs-display, h2 → --fs-h1, h3 → --fs-h2, h4 → --fs-h3
    '--fs-display': isMobile
      ? ((brandData as any).h1SizeMobile ? `${(brandData as any).h1SizeMobile}rem` : 'clamp(2rem, 4vw + 1rem, 6rem)')
      : ((brandData as any).h1SizeDesktop ? `${(brandData as any).h1SizeDesktop}rem` : 'clamp(2.5rem, 5vw + 1rem, 8rem)'),
    '--fs-h1': isMobile
      ? ((brandData as any).h2SizeMobile ? `${(brandData as any).h2SizeMobile}rem` : 'clamp(1.75rem, 3.5vw + 1rem, 4.5rem)')
      : ((brandData as any).h2SizeDesktop ? `${(brandData as any).h2SizeDesktop}rem` : 'clamp(2rem, 4vw + 1rem, 6rem)'),
    '--fs-h2': isMobile
      ? ((brandData as any).h3SizeMobile ? `${(brandData as any).h3SizeMobile}rem` : 'clamp(1.25rem, 2.5vw + 1rem, 3.5rem)')
      : ((brandData as any).h3SizeDesktop ? `${(brandData as any).h3SizeDesktop}rem` : 'clamp(1.5rem, 3vw + 1rem, 4.5rem)'),
    '--fs-h3': isMobile
      ? ((brandData as any).h4SizeMobile ? `${(brandData as any).h4SizeMobile}rem` : 'clamp(1.125rem, 2vw + 1rem, 2.5rem)')
      : ((brandData as any).h4SizeDesktop ? `${(brandData as any).h4SizeDesktop}rem` : 'clamp(1.25rem, 2vw + 1rem, 3rem)'),
    '--fs-h4': isMobile
      ? ((brandData as any).h5SizeMobile ? `${(brandData as any).h5SizeMobile}rem` : 'clamp(0.95rem, 1.2vw + 0.4rem, 1.25rem)')
      : ((brandData as any).h5SizeDesktop ? `${(brandData as any).h5SizeDesktop}rem` : 'clamp(1.1rem, 1.5vw + 0.5rem, 1.75rem)'),
    '--fs-h5': isMobile
      ? ((brandData as any).h6SizeMobile ? `${(brandData as any).h6SizeMobile}rem` : 'clamp(0.85rem, 1vw + 0.35rem, 1rem)')
      : ((brandData as any).h6SizeDesktop ? `${(brandData as any).h6SizeDesktop}rem` : 'clamp(0.95rem, 1.2vw + 0.4rem, 1.25rem)'),
    '--fs-body': isMobile
      ? ((brandData as any).bodySizeMobile ? `${(brandData as any).bodySizeMobile}rem` : 'clamp(0.875rem, 1vw + 0.5rem, 1.125rem)')
      : ((brandData as any).bodySizeDesktop ? `${(brandData as any).bodySizeDesktop}rem` : 'clamp(0.875rem, 1vw + 0.5rem, 1.125rem)'),

    // Heading & Body Colors
    '--color-h1': (brandData as any).h1Color || '#eae8e8',
    '--color-h2': (brandData as any).h2Color || '#eae8e8',
    '--color-h3': (brandData as any).h3Color || '#eae8e8',
    '--color-h4': (brandData as any).h4Color || '#eae8e8',
    '--color-h5': (brandData as any).h5Color || '#eae8e8',
    '--color-h6': (brandData as any).h6Color || '#eae8e8',
    '--color-body': (brandData as any).bodyColor || '#eae8e8',

    // Spacing for all sections
    ...getSpacingVars('hero', hHero),
    ...getSpacingVars('origin', hOrigin),
    ...getSpacingVars('live', hLive),
    ...getSpacingVars('spotify', hSpot),
    ...getSpacingVars('about-hero', aHero),
    ...getSpacingVars('story', aStory),
    ...getSpacingVars('mission', aMission),
    ...getSpacingVars('about-values', aValues),
    ...getSpacingVars('contact', contact),
    ...getSpacingVars('footer-section', footer),
    ...getSpacingVars('vault', vault),
    ...(epk ? getSpacingVars('epk-hook', epk.hook) : {}),
    ...(epk ? getSpacingVars('epk-pitch', epk.pitch) : {}),
    ...(epk ? getSpacingVars('epk-media', epk.media) : {}),
    ...(epk ? getSpacingVars('epk-press', epk.press) : {}),
    ...(epk ? getSpacingVars('epk-contact', epk.contact) : {}),

    // Framing for all sections (device-aware)
    ...getFramingVars('hero', hHero.framing),
    ...getFramingVars('origin', hOrigin.framing),
    ...getFramingVars('live', hLive.framing),
    ...getFramingVars('live-image', hLive.framingImage || hLive.framing),
    ...getFramingVars('footer', footer.framing),
    ...getFramingVars('contact', contact.framing),
    ...getFramingVars('vault', vault.framing),
    ...getFramingVars('story', aStory.framing),
    ...getFramingVars('about', aHero.framing),
    ...(epk ? getFramingVars('epk-hook', epk.hook.framing) : {}),
    ...(epk ? getFramingVars('epk-pitch', epk.pitch.framing) : {}),
    ...(epk ? getFramingVars('epk-contact', epk.contact.framing) : {}),

    // Visuals for all sections (device-aware)
    ...getVisualVars('hero', hHero.visuals),
    ...getVisualVars('origin', hOrigin.visuals),
    ...getVisualVars('live', hLive.visuals),
    ...getVisualVars('spotify', hSpot.visuals),
    ...getVisualVars('about-hero', aHero.visuals),
    ...getVisualVars('story', aStory.visuals),
    ...getVisualVars('footer', footer.visuals),
    ...getVisualVars('contact', contact.visuals),
    ...getVisualVars('vault', vault.visuals),
    ...(epk ? getVisualVars('epk-hook', epk.hook.visuals) : {}),
    ...(epk ? getVisualVars('epk-pitch', epk.pitch.visuals) : {}),
    ...(epk ? getVisualVars('epk-contact', epk.contact.visuals) : {}),
    // EPK Media saturation (section-level filter, no background image)
    ...(epk ? { '--epk-media-sat': `${isMobile ? (epk.media.visuals?.mobileSaturation ?? 100) : (epk.media.visuals?.saturation ?? 100)}%` } : {}),

    // Live image special visuals
    '--live-image-sat': `${isMobile ? hLive.visuals.mobileSaturation : hLive.visuals.saturation}%`,
    '--live-image-dim': `${(isMobile ? hLive.visuals.mobileDim : hLive.visuals.dim) / 100}`,
    '--live-image-para': `${isMobile ? (hLive.parallaxImage?.mobile ?? hLive.visuals.mobileParallax) : (hLive.parallaxImage?.desktop ?? hLive.visuals.parallax)}`,
    '--live-image-op': `${((isMobile ? hLive.visuals.mobileOpacity : hLive.visuals.opacity) ?? 100) / 100}`,

    // Margins for all sections
    ...getMarginVar('hero', hHero.layout),
    ...getMarginVar('origin', hOrigin.layout),
    ...getMarginVar('live', hLive.layout),
    ...getMarginVar('spotify', hSpot.layout),
    ...getMarginVar('about-hero', aHero.layout),
    ...getMarginVar('story', aStory.layout),
    ...getMarginVar('about-mission', aMission.layout),
    ...getMarginVar('about-values', aValues.layout),
    ...getMarginVar('footer', footer.layout),
    ...getMarginVar('vault', vault.layout),

    // Media gallery (device-aware)
    '--media-width': isSmallDesktop ? `${mobileMediaWidth}%` : `${desktopMediaWidth}%`,
    '--media-gap': isSmallDesktop ? `${hSpot.gapMobile * 4}px` : `${hSpot.gapDesktop * 4}px`,
    '--media-aspect-ratio': isSmallDesktop ? (hSpot.aspectRatioMobile || '1/1') : (hSpot.aspectRatioDesktop || '1/1'),
    '--media-scale': `${isSmallDesktop ? (hSpot.scaleMobile || 1) : (hSpot.scaleDesktop || 1)}`,
    '--social-icon-size': `${brandData.socialIconSize || 24}px`,

    // Global Visuals (Menu & Overlays)
    '--menu-overlay-blur': `${brandData.menuOverlayBlur ?? 5}px`,
    '--menu-overlay-brightness': `${brandData.menuOverlayBrightness ?? 95}%`,
    '--menu-overlay-opacity': `${(brandData.menuOverlayOpacity ?? 5) / 100}`,
    '--menu-overlay-color': `rgba(${hexToRgb(brandData.menuOverlayColor || '#000000').split(' ').join(', ')}, ${(brandData.menuOverlayOpacity ?? 5) / 100})`,
  };

  // Dynamic Font Size Overrides
  if (brandData.textStyles) {
    const IS_HEADING_DEFAULT: Record<string, boolean> = {
      homeHeadline: true, homeSubheadline: false, homeSpotifyTitle: true,
      homeOriginTagline: false, homeOriginHeadline: true, homeOriginText: false, homeOriginDescription: false,
      homeLiveTagline: false, homeLiveHeadline: true, tagline: true, story: false, mission: true,
      aboutHeroHeadline: true, aboutHeroSubheadline: false, aboutStoryTagline: false, aboutMissionTagline: false,
      vaultHeadline: true, vaultDescription: false, contactHeadline: true, contactText: false,
      homeFooterTagline: true, homeFooterUpperTagline: false,
      epkHookHeadline: true, epkHookTagline: false, epkPitchTagline: false, epkIntroHeadline: true, epkIntroText: false,
      epkPitchBio: false, epkQuoteText: true, epkQuoteAuthor: true, epkQuoteRole: false,
      epkMediaTagline: false, epkTracksHeadline: true, epkVideoHeadline: true, epkSpotifyHeadline: true,
      epkPressTagline: false, epkPressHeadline: true, epkContactTagline: false,
      epkContactHeadline: true, epkContactEmail: true, epkContactPhone: false
    };

    Object.entries(brandData.textStyles).forEach(([key, style]) => {
      // Font-size is now computed inline by resolveTextStyle — no --fs-key needed in CSS vars.

      // 1. Color
      if (style.color) {
        vars[`--color-${key}`] = style.color;
      }

      // 2. Line Height
      if (style.lineHeight) {
        const lhMap: Record<string, string> = {
          none: '1', tight: '1.25', snug: '1.375', normal: '1.5', relaxed: '1.625', loose: '2'
        };
        vars[`--lh-${key}`] = lhMap[style.lineHeight] || style.lineHeight;
      }

      // 3. Font Family
      if (style.font) {
        vars[`--font-fam-${key}`] = style.font;
      } else if (style.semanticType) {
        vars[`--font-fam-${key}`] = `var(--font-${style.semanticType})`;
      }
    });
  }

  return vars;
};

export const generateScriptJS = (brandData: BrandState) => `
(function() {
  // --- HOT RELOAD CLEANUP REGISTRY ---
  // In the persistent DOM preview, scripts are re-executed. We must clean up old listeners.
  if (window._kfCleanups) {
      window._kfCleanups.forEach(fn => { try { fn(); } catch(e){} });
  }
  window._kfCleanups = [];
  const addCleanup = (fn) => window._kfCleanups.push(fn);

  const handleLoad = (el) => {
    if (!el) return;
    el.classList.add('loaded');
  };

  const initMedia = () => {
    const media = document.querySelectorAll('img, video, mux-background-video');
    media.forEach(el => {
      if (el.tagName === 'IMG') {
        if (el.complete) handleLoad(el);
        else el.addEventListener('load', () => handleLoad(el));
      } else if (el.tagName === 'VIDEO' || el.tagName === 'MUX-BACKGROUND-VIDEO') {
        el.muted = true; // Crucial for iOS/mobile autoplay policy compliance

        const setRate = () => {
            if (el.id !== 'live-video' && typeof el.playbackRate !== 'undefined') {
                const rateMap = ${JSON.stringify({
  'media-home-hero': brandData.sections.home?.hero?.visuals?.playbackRate ?? 0.8,
  'media-about-hero': (brandData.sections.about?.hero as any)?.visuals?.playbackRate ?? 0.8,
  'media-vault': brandData.sections.vault?.visuals?.playbackRate ?? 0.8,
  'media-home-origin': brandData.sections.home?.origin?.visuals?.playbackRate ?? 1.0,
  'media-home-gallery': brandData.sections.home?.spotify?.visuals?.playbackRate ?? 1.0,
  'media-about-story': (brandData.sections.about?.story as any)?.visuals?.playbackRate ?? 1.0,
  'media-contact': (brandData.sections.contact as any)?.visuals?.playbackRate ?? 1.0,
  'media-footer': brandData.sections.footer?.visuals?.playbackRate ?? 1.0,
  'media-epk-hook': brandData.sections.epk?.hook?.visuals?.playbackRate ?? 0.8,
  'media-epk-pitch': brandData.sections.epk?.pitch?.visuals?.playbackRate ?? 1.0,
  'media-epk-contact': brandData.sections.epk?.contact?.visuals?.playbackRate ?? 1.0,
})};
                el.playbackRate = rateMap[el.id] ?? 0.8;
            }
        };

        if (el.tagName === 'MUX-BACKGROUND-VIDEO' || el.readyState >= 2) {
            handleLoad(el);
            setRate();
        }
        el.addEventListener('loadeddata', () => { handleLoad(el); setRate(); });
        el.addEventListener('canplay', () => { handleLoad(el); setRate(); });
        
        // Force play nudge (Silent)
        if (typeof el.play === 'function') {
            const playPromise = el.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Autoplay prevented. Silent fail.
                    // Try simpler load-and-play fallback without logging
                    if (typeof el.load === 'function') el.load();
                    const p2 = el.play();
                    if(p2 !== undefined) p2.catch(() => {}); 
                });
            }
        }

        setTimeout(() => { 
            if (el.tagName === 'MUX-BACKGROUND-VIDEO' || (el.readyState !== undefined && el.readyState >= 1)) handleLoad(el); 
        }, 1000);
      }
      setTimeout(() => handleLoad(el), 3000); // Failsafe

      // IntersectionObserver for Performance (Mux Guidelines)
      // Pauses playback when user scrolls past the video to save CPU/Battery
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              if (typeof el.play === 'function') el.play().catch(() => {});
            } else {
              if (typeof el.pause === 'function') el.pause();
            }
          });
        }, { threshold: 0.1 });
        observer.observe(el);
        addCleanup(() => observer.disconnect());
      }
    });
  };

  const hideLoader = () => {
    const loader = document.getElementById('site-loader');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.pointerEvents = 'none';
        setTimeout(() => {
          loader.style.display = 'none';
        }, 850);
    }
  };

  // Immediate init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initMedia(); });
  } else {
    initMedia();
  }
  window.addEventListener('load', () => { initMedia(); hideLoader(); });
  setTimeout(hideLoader, 2500);

  const initInteractiveElements = () => {
    // Infinite Carousel (Optimized scroll version to prevent cutting off)
    class InfiniteCarousel {
      constructor(element) {
        this.container = element;
        this.isPaused = false;
        // Punkt 4: Desktop 20% raskere enn mobil (0.6 vs 0.5)
        this.speed = window.innerWidth < 768 ? 0.5 : 0.6;
        this._resumeTimeout = null;
        this.scrollPos = 0;
        this.init();
      }
      init() {
        if (!this.container) return;
        const items = Array.from(this.container.children);
        if (this.container.querySelectorAll('[aria-hidden="true"]').length > 0) return;

        items.forEach(item => {
          const clone = item.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          this.container.appendChild(clone);
        });
        
        const setPaused = (val, delay = 0) => {
            if (this._resumeTimeout) clearTimeout(this._resumeTimeout);
            if (val) {
                this.isPaused = true;
            } else {
                this._resumeTimeout = setTimeout(() => {
                    this.isPaused = false;
                    this.scrollPos = this.container.scrollLeft;
                    this._resumeTimeout = null;
                }, delay);
            }
        };
        // Expose setPaused so outsideClickHandler can trigger immediate resume
        this._setPaused = setPaused;

        this.container.addEventListener('mouseenter', () => setPaused(true));
        this.container.addEventListener('mouseleave', () => setPaused(false, 1000));
        this.container.addEventListener('touchstart', () => setPaused(true), {passive: true});
        this.container.addEventListener('touchend', () => setPaused(false, 2000), {passive: true});
        
        // Note: Removed scroll listener to prevent auto-pause loop
        // The isAutoScrolling flag already prevents interference with user scrolling

        this.scrollPos = this.container.scrollLeft;
        this.animate();
      }
      animate() {
        if (this._destroyed) return;
        const hasActiveSlide = this.container.querySelector('.is-active-slide');
        
        if (!this.isPaused && !hasActiveSlide) {
          this.scrollPos += this.speed;
          const halfWidth = this.container.scrollWidth / 2;
          
          if (this.scrollPos >= halfWidth) {
              this.scrollPos -= halfWidth;
          }
          
          this.isAutoScrolling = true;
          this.container.scrollLeft = this.scrollPos;
          // Release flag after browser has likely processed the scroll
          setTimeout(() => { this.isAutoScrolling = false; }, 20);
        } else {
            // While paused or playing video, keep internal scrollPos synced
            this.scrollPos = this.container.scrollLeft;
        }
        requestAnimationFrame(this.animate.bind(this));
      }
      destroy() {
          this._destroyed = true;
      }
    }
    const carousels = Array.from(document.querySelectorAll('[data-carousel="true"]')).map(el => new InfiniteCarousel(el));
    addCleanup(() => carousels.forEach(c => c.destroy()));

    // Inline Media Playback Logic
    window.toggleGalleryItem = function(buttonEl, id, type, url, configStr) {
        const item = buttonEl.closest('.media-gallery-item');
        const isCurrentlyActive = item.classList.contains('is-active-slide');
        
        // STRATEGY FIX: If already active, DO NOTHING. 
        // This allows clicks on the iframe/video to work without closing the slide.
        if (isCurrentlyActive) return;

        // 1. Reset all other items
        document.querySelectorAll('.media-gallery-item').forEach(el => {
            el.classList.remove('is-active-slide');
            el.classList.remove('is-spotify-active');
            el.classList.remove('is-audio-active');
            el.classList.remove('is-mux-playing');
            const embed = el.querySelector('.media-embed-container');
            if(embed) embed.innerHTML = ''; // Stop playback
        });

        if (!isCurrentlyActive) {
            // 2. Activate this item
            item.classList.add('is-active-slide');
            if(type === 'spotify') item.classList.add('is-spotify-active');
            if(type === 'audio' || url.match(/\\.(mp3|wav|ogg)$/i)) item.classList.add('is-audio-active');
            
            const embedContainer = item.querySelector('.media-embed-container');
            
            let embedHtml = '';
            
            // Clear previous
            if(embedContainer) embedContainer.innerHTML = '';
            
            // Wrapper to hold the player
            const wrapper = document.createElement('div');
            wrapper.className = 'w-full h-full relative pointer-events-auto'; // Ensure it captures clicks

            if (type === 'spotify') {
                const isMobileV = window.innerWidth < 640;
                const scaleStyle = isMobileV
                    ? 'width:142%; height:142%; transform: scale(0.7); transform-origin: top left;'
                    : 'width:100%; height:100%;';

                // SoundCloud-fix (punkt 7): Detect SoundCloud URL regardless of type label
                if (url.includes('soundcloud.com')) {
                    const scEmbedUrl = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url) + '&color=%23ff5500&auto_play=true&hide_related=false&show_comments=false&show_user=true&show_reposts=false&visual=false';
                    wrapper.innerHTML = '<iframe src="' + scEmbedUrl + '" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media" loading="lazy" scrolling="no" style="border-radius:12px; overflow:hidden; ' + scaleStyle + '"></iframe>';
                } else {
                    // Standard Spotify embed
                    const trackId = url.split('/').pop().split('?')[0];
                    wrapper.innerHTML = '<iframe src="https://open.spotify.com/embed/track/' + trackId + '" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" scrolling="no" style="border-radius:12px; overflow:hidden; ' + scaleStyle + '"></iframe>';
                }
                embedContainer.appendChild(wrapper);
            } 
            else if (type === 'youtube') {
                const vidId = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop().split('?')[0];
                // STRATEGY CHANGE: Auto-play initialized on the primary user tap
                // User already tapped the card, so autoplay is permissible.
                const muteParam = '0'; // Start Unmuted
                wrapper.innerHTML = '<iframe src="https://www.youtube.com/embed/' + vidId + '?autoplay=1&mute=' + muteParam + '&playsinline=1&controls=1&rel=0&modestbranding=1&autohide=1&showinfo=0" class="w-full h-full border-0" allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
                embedContainer.appendChild(wrapper);
            } 
            else if (type === 'video' || url.match(/\.(mp4|m4v|webm|ogv)$/i)) {
                // Local Video: Manual creation with aggressive unmuting
                const video = document.createElement('video');
                video.className = 'w-full h-full object-cover';
                video.controls = true;

                // Critical Attributes for iOS
                video.setAttribute('playsinline', '');
                video.setAttribute('webkit-playsinline', '');

                // Properties: Start MUTED for iOS autoplay policy
                video.muted = true;
                video.defaultMuted = true;
                video.volume = 1.0;
                video.preload = 'none'; // Don't preload gallery videos — load only on click

                // Responsive sources: if URL ends in -1080.mp4, add 480p for mobile
                const url480 = url.replace(/-1080(\.(mp4|m4v|webm|mov))$/i, '-480$1');
                const hasResponsive = url480 !== url;
                if (hasResponsive) {
                    const src1080 = document.createElement('source');
                    src1080.src = url;
                    src1080.type = 'video/mp4';
                    src1080.media = '(min-width: 768px)';
                    const src480 = document.createElement('source');
                    src480.src = url480;
                    src480.type = 'video/mp4';
                    video.appendChild(src1080);
                    video.appendChild(src480);
                } else {
                    video.src = url;
                }

                wrapper.appendChild(video);
                embedContainer.appendChild(wrapper);
                
                // Play logic
                video.play().then(() => {
                    // Once playing, attempt to unmute
                    video.muted = false;
                    video.volume = 1.0;
                }).catch(e => {
                    // Fallback: If autoplay fails, show controls and ensure it's unmuted for manual play
                    video.muted = false; 
                });
            } 
            else if (type === 'mux' || (url && /^[a-zA-Z0-9_-]{15,45}$/.test(url) && !url.includes('.'))) {
                var config = {};
                try { if(configStr) config = JSON.parse(configStr); } catch(e){}
                var mux = config.mux || {};
                var isMobile = window.innerWidth < 768;

                wrapper.style.cssText = 'width:' + ((isMobile ? mux.widthMobile : mux.widthDesktop) || '100%') + '; aspect-ratio:' + ((isMobile ? mux.aspectRatioMobile : mux.aspectRatioDesktop) || '16/9') + '; transform: translateX(' + ((isMobile ? mux.xOffsetMobile : mux.xOffsetDesktop) || 0) + '%); position:relative; background:#000; margin:0 auto;';
                
                const muxEl = document.createElement('mux-player');
                muxEl.setAttribute('playback-id', url);
                muxEl.setAttribute('stream-type', 'on-demand');
                
                var ap = mux.autoPlay || 'off';
                if (ap === 'muted' || ap === 'any') {
                    muxEl.setAttribute('autoplay', ap);
                }
                
                muxEl.setAttribute('playsinline', '');
                muxEl.setAttribute('crossorigin', '');
                
                if (mux.accentColor) muxEl.setAttribute('accent-color', mux.accentColor);
                if (mux.primaryColor) muxEl.setAttribute('primary-color', mux.primaryColor);
                if (mux.secondaryColor) muxEl.setAttribute('secondary-color', mux.secondaryColor);
                if (mux.startTime) muxEl.setAttribute('start-time', mux.startTime);
                
                // Mux player CSS variables for controls
                muxEl.style.cssText = 'width:100%; height:100%; display:block;';
                muxEl.style.setProperty('--play-button', mux.showPlayButton === false ? 'none' : '');
                muxEl.style.setProperty('--seek-backward-button', mux.showSeekButtons === false ? 'none' : '');
                muxEl.style.setProperty('--seek-forward-button', mux.showSeekButtons === false ? 'none' : '');
                muxEl.style.setProperty('--mut-button', mux.showMuteButton === false ? 'none' : '');
                muxEl.style.setProperty('--captions-button', mux.showCaptionsButton === false ? 'none' : '');
                muxEl.style.setProperty('--fullscreen-button', mux.showFullscreenButton === false ? 'none' : '');
                muxEl.style.setProperty('--poster', 'none');

                
                wrapper.appendChild(muxEl);
                embedContainer.appendChild(wrapper);
            }
            else if (type === 'audio' || url.match(/\.(mp3|wav|ogg)$/i)) {
  // Punkt 6 & 7: Custom play/pause knapp — ingen native controls
  // Audio-elementet er skjult; brukeren klikker på custom-knappen (user gesture i iframe)
  wrapper.className = 'w-full h-full relative pointer-events-auto flex items-center justify-center';

  const audio = document.createElement('audio');
  audio.src = url;
  audio.preload = 'auto';
  audio.style.display = 'none'; // Ingen native controls

  // Custom play/pause button — samme stil som play-overlay-knappen
  const btn = document.createElement('button');
  btn.className = 'audio-custom-btn';
  btn.setAttribute('aria-label', 'Play / Pause');

  const playSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="white" style="margin-left:3px"><path d="M8 5v14l11-7z"/></svg>';
  const pauseSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  btn.innerHTML = playSvg;

  audio.addEventListener('play', () => {
    item.classList.add('is-playing-audio');
    btn.innerHTML = pauseSvg;
  });
  audio.addEventListener('pause', () => {
    item.classList.remove('is-playing-audio');
    btn.innerHTML = playSvg;
  });
  audio.addEventListener('ended', () => {
    item.classList.remove('is-playing-audio');
    btn.innerHTML = playSvg;
  });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    // This click IS a user gesture — audio.play() is safe here
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  wrapper.appendChild(audio);
  wrapper.appendChild(btn);
  embedContainer.appendChild(wrapper);
  // First card click IS a user gesture — play immediately, no second tap needed
  audio.play().catch(() => {});
}
        }
    };

// Close active slides when clicking outside
const outsideClickHandler = (e) => {
  if (!e.target.closest('.media-gallery-item')) {
    document.querySelectorAll('.media-gallery-item').forEach(el => {
      el.classList.remove('is-active-slide');
      el.classList.remove('is-spotify-active');
      el.classList.remove('is-audio-active');
      el.classList.remove('is-playing-audio');
      el.classList.remove('is-mux-playing');
      const embed = el.querySelector('.media-embed-container');
      if (embed) embed.innerHTML = '';
    });
    // Punkt 5: Umiddelbar resume — kansel ventende delay og gjenoppta karusellen nå
    carousels.forEach(c => {
      if (c._setPaused) c._setPaused(false, 0);
    });
  }
};
document.addEventListener('click', outsideClickHandler);
addCleanup(() => document.removeEventListener('click', outsideClickHandler));

// Scroll Sequence Animation
class ScrollSequence {
  constructor(sticky) {
    this.sticky  = sticky;
    this.wrapper = sticky.parentElement;
    this.mediaWrap = sticky.querySelector('.seq-media-wrap');
    this.canvas  = sticky.querySelector('.scroll-seq-canvas');
    if (!this.canvas) return;
    this.ctx          = this.canvas.getContext('2d');
    this.blurTarget   = sticky.querySelector('.blur-target');
    this.dimOverlay   = sticky.querySelector('.seq-dim-overlay');
    this.blackout     = sticky.querySelector('.seq-blackout');
    this.heroText     = sticky.querySelector('.seq-hero-text');
    this.introText    = sticky.querySelector('.seq-intro-text');
    this.parallaxFraction = parseFloat(sticky.dataset.scrollSeqParallax || '7') / 100;
    this.frameCount   = 45;
    // Responsive size: pick smallest size that covers viewport × DPR
    const sizes = [320, 480, 640, 960, 1920];
    const effectiveW = window.innerWidth * (window.devicePixelRatio || 1);
    this.frameSize = 1920;
    for (let si = 0; si < sizes.length; si++) { if (sizes[si] >= effectiveW) { this.frameSize = sizes[si]; break; } }
    this.frames       = new Array(this.frameCount).fill(null);
    this.loadedCount  = 0;
    this.ticking      = false;
    this.preload();
  }

  getProgress() {
    if (!this.wrapper) return 0;
    const rect     = this.wrapper.getBoundingClientRect();
    
    const isSticky = window.getComputedStyle(this.sticky).position === 'sticky';
    if (!isSticky) {
        // When not sticky, we lock progress to 0 so the user can debug the starting framing
        // without the zoom animation or blackout overlay triggering.
        return 0;
    }

    const scrollable = rect.height - window.innerHeight;
    if (scrollable <= 0) return 0;
    return Math.max(0, Math.min(1, -rect.top / scrollable));
  }

  preload() {
    let firstReady = false;
    for (let i = 0; i < this.frameCount; i++) {
      const img = new Image();
      const num = String(i + 1).padStart(2, '0');
      img.src = 'https://kraakefot.com/media/animations/about-hero-v5/' + this.frameSize + '/frame_' + num + '-' + this.frameSize + '.webp';
      this.frames[i] = img;
      const idx = i;
      img.onload = () => {
        this.loadedCount++;
        if (!firstReady && idx === 0) { firstReady = true; this.requestUpdate(); }
        else this.requestUpdate();
      };
      img.onerror = () => { this.loadedCount++; this.frames[idx] = null; };
    }
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.sticky.offsetWidth;
    const h = this.sticky.offsetHeight;
    if (w > 0 && h > 0 && (this.canvas.width !== w * dpr || this.canvas.height !== h * dpr)) {
      this.canvas.width  = w * dpr;
      this.canvas.height = h * dpr;
      this.ctx.scale(dpr, dpr);
    }
  }

  draw() {
    if (!this.canvas || !this.ctx) return;
    const progress = this.getProgress();
    this.resize();

    // ── Frame selection ────────────────────────────────────────────────────
    const frameIndex = Math.min(this.frameCount - 1, Math.floor(progress * this.frameCount));
    let img = null;
    for (let j = frameIndex; j >= 0; j--) {
      const f = this.frames[j];
      if (f && f.complete && f.naturalWidth > 0) { img = f; break; }
    }
    if (img) {
      const pf = this.parallaxFraction;
      // Use CSS dimensions for layout math — ctx.scale(dpr,dpr) already handles the scaling
      const w  = this.sticky.offsetWidth, h = this.sticky.offsetHeight;
      const isMobile = window.innerWidth < 768;

      // Absolute Default Scaling: Follow width only (Width-Fit).
      const baseScale = w / img.naturalWidth;
      const zoom = parseFloat(this.sticky.dataset[isMobile ? 'zoomMobile' : 'zoomDesktop'] || 1);
      const xOff = parseFloat(this.sticky.dataset[isMobile ? 'xMobile' : 'xDesktop'] || 0);
      const yOff = parseFloat(this.sticky.dataset[isMobile ? 'yMobile' : 'yDesktop'] || 0);
      
      const scale = baseScale * zoom;
      const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
      const parallaxPx = progress * h * pf;

      const userDx = (xOff / 100) * w;
      const userDy = (yOff / 100) * h;

      const dx = (w - dw) / 2 + userDx;
      // Origin Sync: Top-Center (0). Image starts at top by default; use Position Y to move down.
      const dy = 0 - parallaxPx + userDy;

      // clearRect must cover the full DPR-scaled buffer
      const dpr = window.devicePixelRatio || 1;
      this.ctx.clearRect(0, 0, w * dpr, h * dpr);
      this.ctx.drawImage(img, dx, dy, dw, dh);
    }

    if (this.mediaWrap) {
        this.mediaWrap.style.transform = '';
    }

    if (this.heroText) {
      // Fade in towards the end (8th to last frame is ~0.82 scroll progress)
      this.heroText.style.opacity = progress < 0.82 ? 0 : (progress - 0.82) / 0.18;
    }

    if (this.introText) {
      // Fade out over first 5 frames (5/45 = ~0.11 scroll progress)
      this.introText.style.opacity = Math.max(0, 1 - progress / 0.11);
    }

    if (this.blurTarget) {
      this.blurTarget.style.transform = '';
    }

    if (this.dimOverlay) {
      // Base opacity set via css variables. We just ensure we don't translate it anymore.
      this.dimOverlay.style.transform = '';
    }

    if (this.blackout) {
      this.blackout.style.transform = '';
      this.blackout.style.opacity = progress < 0.8 ? 0 : (progress - 0.8) / 0.2;
    }
  }

  // ── Persistent rAF loop (fixes iOS Safari scroll-event throttling) ──────────
  // Instead of relying on 'scroll' events (which Safari throttles during touch
  // gestures and momentum scrolling), we run a continuous rAF loop that polls
  // scroll position every visual frame. The loop is gated by IntersectionObserver
  // so it only runs while the wrapper is in the viewport.
  tick() {
    if (!this._visible) return;
    this.draw();
    this._rafId = requestAnimationFrame(() => this.tick());
  }

  init() {
    this._visible = false;
    this._rafId = null;

    // Resize handler: reset canvas dimensions so next draw re-inits them
    this.resizeHandler = () => { if (this.canvas) this.canvas.width = 0; };
    window.addEventListener('resize', this.resizeHandler, { passive: true });

    // IntersectionObserver: start/stop the rAF loop based on visibility
    this._observer = new IntersectionObserver((entries) => {
      const isVisible = entries[0].isIntersecting;
      if (isVisible && !this._visible) {
        this._visible = true;
        this.tick(); // start the loop
      } else if (!isVisible) {
        this._visible = false;
        if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
      }
    }, { rootMargin: '100px 0px' }); // start slightly before entering viewport
    this._observer.observe(this.wrapper);

    // Belt-and-suspenders: touchmove fires more reliably than scroll on iOS
    this._touchHandler = () => { if (!this._visible) { this._visible = true; this.tick(); } };
    window.addEventListener('touchmove', this._touchHandler, { passive: true });

    // Initial draw (frames may already be loaded)
    this._visible = true;
    this.tick();
  }

  destroy() {
    this._visible = false;
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    if (this._observer) this._observer.disconnect();
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
    if (this._touchHandler) window.removeEventListener('touchmove', this._touchHandler);
  }
}

// Scroll Blur FX Implementation
class ScrollBlur {
  constructor(element) {
    this.element = element;
    this.target = element.querySelector('.blur-target') || element.firstElementChild;
    // Fallback to first child if no specific target class is found, 
    // though sections usually have a wrapper div as first child for this purpose.

    if (!this.target) return;

    // Read config from data attributes or use defaults
    this.strength = parseFloat(element.dataset.blurStrength || '0');
    this.radius = parseFloat(element.dataset.blurRadius || '0');
    this.enabled = element.dataset.scrollBlur === 'true';

    if (!this.enabled) return;

    this.ticking = false;
    this.init();
  }

  init() {
    this.update();
    this.scrollHandler = () => this.requestUpdate();
    this.resizeHandler = () => this.requestUpdate();
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    window.addEventListener('resize', this.resizeHandler, { passive: true });
  }

  destroy() {
    window.removeEventListener('scroll', this.scrollHandler);
    window.removeEventListener('resize', this.resizeHandler);
  }

  requestUpdate() {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.update();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  update() {
    const rect = this.element.getBoundingClientRect();
    if (rect.height === 0) return; // Guard against zero height during layout

    const windowHeight = window.innerHeight;
    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = windowHeight / 2;

    const distanceFromCenter = Math.abs(elementCenter - viewportCenter);
    const maxDistance = windowHeight / 2;

    const normalizedDistance = Math.min(1, distanceFromCenter / maxDistance);

    let blurAmount = 0;
    if (normalizedDistance > this.radius) {
      const ramp = (normalizedDistance - this.radius) / (1 - this.radius);
      blurAmount = Math.min(this.strength, ramp * this.strength);
    }

    this.target.style.filter = 'blur(' + blurAmount.toFixed(2) + 'px)';
    this.target.style.willChange = 'filter';
  }
}

    // Initialize Scroll Sequences
    const scrollSeqs = Array.from(document.querySelectorAll('[data-scroll-seq]')).map(el => {
      const s = new ScrollSequence(el); s.init(); return s;
    });
    addCleanup(() => scrollSeqs.forEach(s => s.destroy()));

    // Initialize Blur FX
    const scrollBlurs = Array.from(document.querySelectorAll('[data-scroll-blur="true"]')).map(el => new ScrollBlur(el));
    addCleanup(() => scrollBlurs.forEach(b => b.destroy()));


    // Live Video Play Button Logic — Inline Player
    (function() {
      var livePlayBtn = document.getElementById('live-play-btn');
      var liveMuxPlayer = document.getElementById('live-mux-player');
      var liveSec = document.querySelector('.live-section');
      if (!livePlayBtn || !liveMuxPlayer || !liveSec) return;

      var isPlaying = false;

      function togglePlay(e) {
        if(e) e.stopPropagation();
        
        if (!isPlaying) {
          // Play and UNMUTE when huge central play button is clicked
          liveMuxPlayer.muted = false;
          liveMuxPlayer.play().then(function() {
            isPlaying = true;
            liveSec.classList.add('is-playing');
            var preview = document.querySelector('.live-preview-overlay');
            if (preview) preview.style.opacity = '0';
            
            livePlayBtn.innerHTML = '<div class="play-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg></div>';
            livePlayBtn.setAttribute('aria-label', 'Pause video');
          }).catch(function(err){ console.error('Play failed', err); });
        } else {
          // Pause
          liveMuxPlayer.pause();
          isPlaying = false;
          liveSec.classList.remove('is-playing');
          var preview = document.querySelector('.live-preview-overlay');
          if (preview) preview.style.opacity = '1';
          
          livePlayBtn.innerHTML = '<div class="play-icon animate-play-ring"><svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" class="ml-1"><path d="M8 5v14l11-7z" /></svg></div>';
          livePlayBtn.setAttribute('aria-label', 'Play video');
        }
      }

      livePlayBtn.addEventListener('click', togglePlay);

      // Auto-pause when scrolling past
      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting && isPlaying) {
            togglePlay(); // pauses it
          }
        });
      }, { threshold: 0.1 });
      obs.observe(liveSec);
      addCleanup(function() { obs.disconnect(); });
    })();

    // EPK Track Playback Logic
    window.toggleEpkTrack = function(cardEl, idx) {
        const audio = cardEl.querySelector('.epk-audio-element');
        if (!audio) return;
        const isPlaying = !audio.paused;
        document.querySelectorAll('.epk-track-card, .track-glitch-card').forEach(otherCard => {
            if (otherCard !== cardEl) {
                const otherAudio = otherCard.querySelector('.epk-audio-element');
                if (otherAudio && !otherAudio.paused) otherAudio.pause();
                otherCard.classList.remove('is-playing');
                const op = otherCard.querySelector('.play-icon'); if(op) op.style.display = '';
                const ou = otherCard.querySelector('.pause-icon'); if(ou) ou.style.display = 'none';
                const ow = otherCard.querySelector('.animate-play-ring'); if(ow) ow.style.display = 'block';
            }
        });
        const playIcon = cardEl.querySelector('.play-icon');
        const pauseIcon = cardEl.querySelector('.pause-icon');
        const pulse = cardEl.querySelector('.animate-play-ring');
        if (isPlaying) {
            audio.pause();
            cardEl.classList.remove('is-playing');
            if(playIcon) playIcon.style.display = '';
            if(pauseIcon) pauseIcon.style.display = 'none';
            if(pulse) pulse.style.display = 'block';
        } else {
            audio.play().catch(e => console.error('Playback failed', e));
            cardEl.classList.add('is-playing');
            if(playIcon) playIcon.style.display = 'none';
            if(pauseIcon) pauseIcon.style.display = 'block';
            if(pulse) pulse.style.display = 'none';
            audio.onended = () => {
                cardEl.classList.remove('is-playing');
                if(playIcon) playIcon.style.display = '';
                if(pauseIcon) pauseIcon.style.display = 'none';
                if(pulse) pulse.style.display = 'block';
            };
        }
    };

// Parallax & Header Optimization
let ticking = false;
let lastScrollY = window.scrollY;

const updateScrollProps = () => {
  document.documentElement.style.setProperty('--scroll-y', lastScrollY.toString());

  const header = document.getElementById('main-header');
  if (header) {
    const threshold = 100;
    const limit = ${brandData.isMobilePreview ? 680 : 800};
    let op = 1;
    if (lastScrollY > threshold) {
      op = 1 - (lastScrollY - threshold) / (limit - threshold);
      if (op < 0) op = 0;
    }
    header.style.opacity = op;
    header.style.pointerEvents = op < 0.1 ? 'none' : 'auto';
  }
  ticking = false;
};

const mainScrollListener = () => {
  lastScrollY = window.scrollY;
  if (!ticking) {
    window.requestAnimationFrame(updateScrollProps);
    ticking = true;
  }
};

window.addEventListener('scroll', mainScrollListener, { passive: true });
addCleanup(() => window.removeEventListener('scroll', mainScrollListener));

// Pre-sync state to prevent jump on first scroll
updateScrollProps();

// Manual loader hide fallback
const ldr = document.getElementById('site-loader');
if (ldr) ldr.addEventListener('click', hideLoader);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInteractiveElements);
  } else {
    initInteractiveElements();
  }

  // PERF: Lazy-load ONLY mux-player via IntersectionObserver
  // mux-background-video is intentionally excluded here — it is loaded eagerly in <head>
  // because it appears in the hero (above the fold) and must be registered before DOMContentLoaded
  // for Mux's ABR (adaptive bitrate) to start at the highest quality.
  // mux-player (live section, below fold) is the real hls.js weight (~154 kB) — this is what we defer.
  (function initMuxLazyLoader() {
    var muxLoaded = false;
    var muxElements = document.querySelectorAll('mux-player');
    if (!muxElements.length) return; // No mux-player on this page — skip entirely

    function loadMuxModules() {
      if (muxLoaded) return;
      muxLoaded = true;
      var s2 = document.createElement('script');
      s2.type = 'module';
      s2.src = 'https://cdn.jsdelivr.net/npm/@mux/mux-player/+esm';
      document.head.appendChild(s2);
    }

    if ('IntersectionObserver' in window) {
      var muxObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            loadMuxModules();
            muxObserver.disconnect();
          }
        });
      }, { rootMargin: '300px' }); // Start loading 300px before element enters viewport

      muxElements.forEach(function(el) { muxObserver.observe(el); });
      addCleanup(function() { muxObserver.disconnect(); });
    } else {
      // Fallback for older browsers — load immediately
      loadMuxModules();
    }
  })();

}) ();
`;

const minifyHTML = (html: string) => {
  return html
    .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
    .replace(/>\s+</g, '><') // Remove space between tags
    .trim();
};

export const generatePageHTML = (page: PageKey, brandData: BrandState, contentOnly = false, isPreview = false) => {
  // ... (existing code for generatePageHTML helper functions) ...
  const hexToRgb = (hex: string) => {
    if (!hex || typeof hex !== 'string') return '69 150 148';
    const cleanHex = hex.split('#').join('').trim();
    if (cleanHex.length !== 6) return '69 150 148';
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `${r} ${g} ${b}`;
  };

  const normalizePath = (p: string) => {
    if (!p) return '';
    if (p.startsWith('http') || p.startsWith('data:')) return p;

    // 💥 FIX: If the path is an exact Mux Playback ID, do NOT prepend serverBaseUrl
    const isPureMuxId = /^[a-zA-Z0-9_-]{15,45}$/.test(p) && !/\.(mp4|m4v|mov|webm|mp3|wav|jpg|jpeg|png|webp)$/i.test(p);
    if (isPureMuxId) return p;

    // Remove leading slash if present to prevent double slashes
    const relativePath = p.replace(/^\/+/, '');

    if (isPreview && brandData.serverBaseUrl) {
      const base = brandData.serverBaseUrl.replace(/\/$/, '');
      return `${base}/${relativePath.replace(/^\//, '')}`;
    }

    return relativePath;
  };

  const isVideo = (url: string) => /\.(mp4|mov|webm|m4v|mkv)$/i.test(url);

  const renderAura = (visuals: any, prefix: string) => {
    if (!visuals?.auraEnabled && !isPreview) return '';
    const auraEnabled = visuals?.auraEnabled ?? false;
    const auraSpeed = visuals?.auraSpeed ?? 20;
    const auraOp = (visuals?.auraOpacity ?? 15) / 100;
    const auraBlend = visuals?.auraBlendMode || 'screen';
    const auraColor = visuals?.auraColor || '';

    return `<div class="hero-aurora" style="
      --aura-display: var(--${prefix}-aura-display, ${auraEnabled ? 'block' : 'none'});
      --aura-speed: var(--${prefix}-aura-speed, ${auraSpeed}s);
      --aura-op: var(--${prefix}-aura-op, ${auraOp});
      --aura-blend: var(--${prefix}-aura-blend, ${auraBlend});
      ${auraColor ? `--aura-color: var(--${prefix}-aura-color, ${auraColor});` : `--aura-color: var(--${prefix}-aura-color);`}
    "></div>`;
  };

  // FONT LOADING LOGIC: Collect all unique fonts
  const getAllUsedFonts = () => {
    const fonts = new Set<string>();

    const fontKeys = ['headingFont', 'bodyFont', 'h1Font', 'h2Font', 'h3Font', 'h4Font', 'h5Font', 'h6Font'];
    fontKeys.forEach(key => {
      const family = brandData[key];
      if (family) {
        const fontName = FONT_OPTIONS.find(f => f.family === family)?.name;
        if (fontName) fonts.add(fontName);
      }
    });

    // Text Styles
    Object.values(brandData.textStyles || {}).forEach((style: any) => {
      if (style.font) {
        const fontName = FONT_OPTIONS.find(f => f.family === style.font)?.name;
        if (fontName) fonts.add(fontName);
      }
    });

    // Fallbacks if nothing found
    if (fonts.size === 0) {
      fonts.add('Montserrat');
      fonts.add('Montserrat');
    }

    return Array.from(fonts);
  };

  const usedFonts = getAllUsedFonts();
  // PERF: font-display:optional eliminates CLS (no layout shift when font swaps in)
  // Montserrat is preloaded separately in <head> to ensure it's always ready in time
  const googleFontsUrl = `https://fonts.googleapis.com/css2?${usedFonts.map(f => `family=${f.replace(/ /g, '+')}:wght@300;400;500;700;800`).join('&')}&display=optional`;

  const headingFontName = usedFonts[0] || 'Montserrat';
  const bodyFontName = usedFonts[1] || 'Montserrat';

  // Shortcuts
  const s = brandData.sections;

  // CONFIG: Map text style keys to their default semantic role (heading vs body)
  // This is required to generate the correct CSS variables globally.
  const STYLE_CONFIG: Record<string, boolean> = {
    homeHeadline: true,
    homeSubheadline: false,
    homeSpotifyTitle: true,
    homeOriginTagline: false,
    homeOriginHeadline: true,
    homeOriginText: false,
    homeOriginDescription: false,
    homeLiveTagline: false,
    homeLiveHeadline: true,
    tagline: true, // About Hero
    story: false,  // About Story
    mission: true, // About Mission
    vaultHeadline: true,
    vaultDescription: false,
    contactHeadline: true,
    contactText: false,
    epkHookTagline: false,
    epkPitchTagline: false,
    epkPitchBio: false,
    epkQuoteText: true,
    epkQuoteAuthor: true,
    epkQuoteRole: false,
    epkMediaTagline: false,
    epkPressTagline: false,
    epkPressHeadline: true,
    epkContactTagline: false,
    epkContactHeadline: true,
    epkContactEmail: true,
    epkContactPhone: false,
    epkTracksHeadline: true,
    epkVideoHeadline: true,
    epkSpotifyHeadline: true
  };

  const computeFontSize = (key: string, style: any, isHeadingDefault: boolean) => {
    if (!style) return '';

    if (style.customSize) {
      return style.customSize;
    }

    const resolvedType = style.semanticType || (isHeadingDefault ? 'h1' : 'body');

    // Map semanticType to the fluid CSS variable (matches InlineText.tsx)
    const getSemanticFsVar = (t: string): string => {
      switch (t) {
        case 'h1': return 'var(--fs-display)';
        case 'h2': return 'var(--fs-h1)';
        case 'h3': return 'var(--fs-h2)';
        case 'h4': return 'var(--fs-h3)';
        case 'h5': return 'var(--fs-h4)';
        case 'h6': return 'var(--fs-h5)';
        case 'body': return 'var(--fs-body)';
        default: return isHeadingDefault ? 'var(--fs-display)' : 'var(--fs-body)';
      }
    };

    const baseVar = getSemanticFsVar(resolvedType);

    return `calc(${baseVar} * var(--scale-${key}, ${style.scale || 1.0}))`;
  };

  const resolveTextStyle = (key: string, isHeading: boolean) => {
    const style = (brandData.textStyles || {})[key];
    if (!style) return '';

    const parts = [];

    // 1. Font Family
    if (style.font || style.semanticType) {
      parts.push(`font-family: var(--font-fam-${key})`);
    }

    // 2. Font Size — computed inline using fluid CSS vars (matches InlineText.tsx)
    const fsValue = computeFontSize(key, style, isHeading);
    if (fsValue) {
      parts.push(`font-size: ${fsValue}`);
    }

    // 3. Color
    if (style.color) {
      parts.push(`color: var(--color-${key})`);
    }

    // 4. Line Height
    if (style.lineHeight) {
      parts.push(`line-height: var(--lh-${key})`);
    }

    return parts.length > 0 ? parts.join('; ') + ';' : '';
  };

  const resolveTextClasses = (key: string, baseClasses: string = '') => {
    const style = (brandData.textStyles || {})[key];
    let final = `${baseClasses} ${(style && style.classes) || ''}`.trim();

    if (style && style.glitchEnabled === false) {
      final = final.replace('glitch-heading', '').trim();
    } else if (style && style.glitchEnabled === true && !final.includes('glitch-heading')) {
      final += ' glitch-heading';
    }

    return final.trim();
  };

  /* AUTOMATED IMAGE OPTIMIZATION (Using wsrv.nl global CDN) */
  const optimizeUrl = (url: string, width: number) => {
    if (isPreview) return url; // BYPASS FOR PREVIEW
    if (!url) return '';
    if (url.includes('wsrv.nl')) return url; // Already optimized
    if (url.match(/\.(mp4|webm|mov|m4v)$/i)) return url; // Skip videos

    // Resolve relative paths to absolute for the external resizer
    let fullUrl = url;
    if (!url.startsWith('http') && !url.startsWith('data:')) {
      // Remove leading slash if present
      const cleanPath = url.startsWith('/') ? url.slice(1) : url;
      fullUrl = `https://kraakefot.com/${cleanPath}`;
    }

    return `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&w=${width}&q=80&output=webp`;
  };

  const renderUniversalMedia = (type: 'image' | 'video' | 'mux' | 'mux-bg' | string, url: string, prefix: string, saturationVar: string, dimVar: string, parallaxVar: string, opacityVar: string, id: string = '', extraClasses: string = '', isHero: boolean = false, config: any = {}) => {
    if (!url || url.trim() === '') return '';

    const scrollZoom = isHero ? ` + (var(--scroll-y, 0) * 0.0001)` : '';

    // Position Logic: Use object-position for framing to avoid clipping
    const objPos = `object-position: calc(50% + var(--${prefix}-x)) calc(50% + var(--${prefix}-y));`;

    // Transform Logic: Only Scale + Parallax Translate (Vertical only)
    const dynamicStyle = `filter:saturate(var(--${prefix}-sat, ${saturationVar})); --target-op: var(--${prefix}-op, ${opacityVar}); ${objPos} transform: scale(calc(var(--${prefix}-zoom)${scrollZoom})) translate3d(0, calc((var(--scroll-y, 0) * 1px * var(--${prefix}-para, 1) * 0.01)), 0);`;

    const cleanUrl = normalizePath(url);

    // Performance Attributes
    const imgAttrs = isHero ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"';
    const vidAttrs = isHero ? 'fetchpriority="high"' : '';

    let mediaHtml = '';

    let finalType = type;
    // 💥 FIX: Use original 'url' for Mux extraction because cleanUrl might be transformed, 
    // although normalizePath is now patched.
    const extractedMuxId = extractMuxId(url);

    if ((type === 'image' || type === 'video') && extractedMuxId && !cleanUrl.toLowerCase().endsWith('.mp4')) {
      finalType = 'mux-bg';
    }

    const isMuxIdInput = /^[a-zA-Z0-9_-]{15,45}$/.test(url) && !/\.(mp4|m4v|mov|webm|jpg|png|webp)$/i.test(url);

    if (finalType === 'mux' || finalType === 'mux-bg' || isMuxIdInput || extractedMuxId) {
      const muxId = extractedMuxId || url;
      const mConfig = (config || {}).mux || {};
      const start = mConfig.startTime || '';

      // MUX BAKGRUNNSVIDEO (Løser HLS og plakat automatisk)
      mediaHtml = `
          <mux-background-video 
               src="https://stream.mux.com/${muxId}.m3u8"
               ${id ? `id="${id}"` : ''} 
               class="universal-media-element absolute inset-0 w-full h-full object-cover block" 
               ${vidAttrs}
               ${start ? `start-time="${start}"` : ''}
               style="${dynamicStyle}">
          </mux-background-video>`;
    } else if (type === 'video') {
      // VIDEO STRATEGY:
      // Show full video with poster for both mobile and desktop
      const posterUrl = cleanUrl.replace(/\.(mp4|webm|mov|m4v)$/i, '.jpg');
      const safePoster = posterUrl === cleanUrl ? 'media/Thief-In-The-Night-Artwork-2-Krakefot-web.png' : posterUrl;
      const desktopPoster = optimizeUrl(safePoster, 1920);

      // Responsive sources: if URL ends in -1080.mp4, serve 480p to mobile
      const videoUrl480 = cleanUrl.replace(/-1080(\.(mp4|m4v|webm|mov))$/i, '-480$1');
      const videoHasResponsive = videoUrl480 !== cleanUrl;
      const videoSources = videoHasResponsive
        ? `<source src="${cleanUrl}" type="video/mp4" media="(min-width: 768px)">
                   <source src="${videoUrl480}" type="video/mp4">`
        : `<source src="${cleanUrl}" type="video/mp4">`;

      mediaHtml = `
            <video ${id ? `id="${id}"` : ''}
                   poster="${desktopPoster}"
                   playsinline webkit-playsinline muted loop autoplay
                   preload="${isHero ? 'auto' : (id?.includes('footer') || id?.includes('contact') ? 'metadata' : 'none')}"
                   class="universal-media-element"

                   ${vidAttrs}
                   style="${dynamicStyle}">
                   ${videoSources}
            </video>`;
    } else {
      // RESPONSIVE IMAGES STRATEGY
      // Always use srcset now that we have the absolute URL resolver
      const srcSet = `${optimizeUrl(cleanUrl, 480)} 480w, ${optimizeUrl(cleanUrl, 800)} 800w, ${optimizeUrl(cleanUrl, 1200)} 1200w, ${optimizeUrl(cleanUrl, 1920)} 1920w`;

      const srcParams = `srcset="${srcSet}" sizes="100vw"`;
      const finalSrc = `src="${optimizeUrl(cleanUrl, 1920)}"`;

      // PERF: Explicit width/height prevents CLS — browser reserves space before image loads
      mediaHtml = `<img ${id ? `id="${id}"` : ''} ${finalSrc} ${srcParams} alt="" role="presentation" width="1920" height="1080" class="universal-media-element" ${imgAttrs} style="${dynamicStyle}">`;
    }

    return `
        <div class="media-container-universal ${extraClasses}">
           <div class="media-internal-wrapper">
              ${mediaHtml}
           </div>
           <div class="absolute inset-0 pointer-events-none" style="opacity:var(${dimVar}); background: linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.7) 70%, #000 100%);"></div>
        </div>`;
  };

  const renderMediaItem = (item: MediaItem) => {
    // PRIORITY SYNC: If item.thumbnail exists, use it regardless of mode (matches MediaCard.tsx)
    const fallbackThumb = 'media/Thief-In-The-Night-Artwork-2-Krakefot-web.png';
    let thumb = '';
    let useVideoThumb = false;

    if (item.thumbnail) {
      thumb = normalizePath(item.thumbnail);
    } else if (item.type === 'youtube') {
      const ytId = item.url.includes('v=')
        ? item.url.split('v=')[1].split(/[&?#]/)[0]
        : (item.url.split('/').pop() ?? '').split('?')[0];
      thumb = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : fallbackThumb;
    } else if (item.type === 'mux' || item.type === 'mux-bg') {
      const muxId = extractMuxId(item.url);
      thumb = muxId ? `https://image.mux.com/${muxId}/thumbnail.jpg?time=0` : fallbackThumb;
    } else if (item.type === 'video' && item.url) {
      // Auto: show first frame via <video> element
      useVideoThumb = true;
      thumb = normalizePath(item.url);
    } else {
      // spotify, audio, soundcloud or missing data
      thumb = fallbackThumb;
    }

    const alt = item.altText || item.title || 'Media item';
    const isAudio = item.type === 'audio';

    // Punkt 2: playingThumbnail for audio
    const playingThumb = (isAudio && item.playingThumbnail) ? normalizePath(item.playingThumbnail) : '';

    // Determine click URL
    let clickUrl = item.url;
    if (item.type === 'youtube' && !item.url.includes('http')) {
      clickUrl = `https://youtube.com/watch?v=${item.url}`;
    } else if (item.type === 'spotify' && !item.url.includes('http')) {
      clickUrl = `https://open.spotify.com/track/${item.url}`;
    } else if (item.type === 'mux' || item.type === 'mux-bg') {
      clickUrl = extractMuxId(item.url) || item.url;
    }

    const configStr = JSON.stringify(item.mediaConfig || {}).replace(/"/g, '&quot;');

    // Thumbnail element: <video> for first-frame auto, <img> otherwise
    const thumbHtml = useVideoThumb
      ? `<video src="${thumb}" muted playsinline preload="metadata"
                class="thumb-default absolute inset-0 w-full h-full object-cover filter grayscale brightness-[0.7] transition-all duration-700"
                onloadeddata="this.currentTime=0.01" style="pointer-events:none"></video>`
      : `<img src="${optimizeUrl(thumb, 640)}"
               srcset="${optimizeUrl(thumb, 320)} 320w, ${optimizeUrl(thumb, 480)} 480w, ${optimizeUrl(thumb, 640)} 640w, ${optimizeUrl(thumb, 960)} 960w"
               sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
               alt="${alt}" loading="lazy"
               class="thumb-default absolute inset-0 w-full h-full object-cover filter grayscale brightness-[0.7] transition-all duration-700"
               onload="this.classList.add('loaded')">`;

    // Playing-thumbnail img (audio only, hidden via CSS until is-playing-audio class)
    const playingThumbHtml = playingThumb
      ? `<img src="${optimizeUrl(playingThumb, 640)}"
               srcset="${optimizeUrl(playingThumb, 320)} 320w, ${optimizeUrl(playingThumb, 640)} 640w, ${optimizeUrl(playingThumb, 960)} 960w"
               sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
               alt="${alt}" loading="lazy"
               class="thumb-playing absolute inset-0 w-full h-full object-cover transition-all duration-700"
               onload="this.classList.add('loaded')">`
      : '';

    return `<div class="media-gallery-item group relative bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-800 transition-all cursor-pointer"
                 style="aspect-ratio: var(--media-aspect-ratio);"
                 onclick="toggleGalleryItem(this, '${item.id}', '${item.type}', '${clickUrl}', '${configStr}')">

            ${thumbHtml}
            ${playingThumbHtml}

            <!-- Scanlines Overlay -->
            <div class="absolute inset-0 z-[5] pointer-events-none transition-opacity duration-500 group-[.is-active-slide]:opacity-0 group-[.is-spotify-active]:opacity-0 group-hover:opacity-0"
                 style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)">
            </div>

            <!-- Embed Container (Loaded on click) -->
            <div class="media-embed-container"></div>

            <!-- Play Overlay -->
            <div class="media-play-overlay absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                <div class="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border-2 border-[var(--accent)] shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-500">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" class="ml-1"><path d="M8 5v14l11-7z"/></svg>
                </div>
            </div>

            <!-- Info Overlay -->
            <div class="media-info-overlay absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-500">
                <h3 class="text-white font-bold text-sm truncate">${item.title}</h3>
                <p class="text-[var(--accent)] text-[10px] font-bold uppercase tracking-widest">${item.artist || ''}</p>
            </div>
        </div>`;
  };

  const footerHTML = `
        <section id="home-footer" data-section="footer" class="w-full bg-black flex flex-col group overflow-hidden" style="margin-bottom:var(--footer-margin)">
            <!-- 1. Independent Tagline Area -->
            <div class="w-full bg-black text-center relative z-20 py-12 px-6">
                ${s.footer.upperTagline ? `
                    <p class="${resolveTextClasses('homeFooterUpperTagline', 'text-[var(--accent)] font-bold text-xs uppercase tracking-[0.4em]')}" style="${resolveTextStyle('homeFooterUpperTagline', false)}" data-text-key="homeFooterUpperTagline">${s.footer.upperTagline}</p>
                ` : ''}
            </div>

            <!-- 2. Main Media & Button Area -->
            <div class="relative w-full flex-grow flex flex-col items-center justify-center overflow-hidden" 
                 style="min-height:var(--footer-section-min-h); padding-top:var(--footer-section-pt); padding-bottom:var(--footer-section-pb)">
                
                <div class="blur-target absolute inset-0 z-0" style="transition: filter 0.1s linear; transform: translate3d(0,0,0);">
                    ${renderUniversalMedia(isVideo(s.footer.videoUrl) ? 'video' : 'image', s.footer.videoUrl, 'footer', '--footer-sat', '--footer-dim', '--footer-para', '--footer-op', 'media-footer', '', false, s.footer.mediaConfig)}
                </div>

                <div class="relative z-10 text-center px-6">
                    <a href="contact.html" class="btn-glass group">
                        <span class="${resolveTextClasses('homeFooterContactText', '')}" style="${resolveTextStyle('homeFooterContactText', false)}" data-text-key="homeFooterContactText">${s.footer.contactText}</span>
                        <svg class="group-hover:translate-x-1 transition-transform inline-block ml-2 mb-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </a>
                </div>
            </div>
        </section>
`;

  const tintColor = brandData.menuTintColor || brandData.accentColor || '#000000';
  const tintAmount = brandData.menuTintAmount ?? 0.1;
  const baseOpacity = brandData.menuOpacity ?? 0.4;
  const rgbLegacy = hexToRgb(tintColor).split(' ').join(', ');
  const tC = { 
    r: parseInt(rgbLegacy.split(',')[0]), 
    g: parseInt(rgbLegacy.split(',')[1]), 
    b: parseInt(rgbLegacy.split(',')[2]) 
  };

  const r = Math.round(tC.r * tintAmount + 10);
  const g = Math.round(tC.g * tintAmount + 10);
  const b = Math.round(tC.b * tintAmount + 10);
  // We use CSS variables for transparency and tint now for better hot-update parity
  // But we still output a fallback string for the initial render
  const bgString = `rgba(${r}, ${g}, ${b}, ${baseOpacity})`;

  const headerHTML = `
      <header id="main-header" style="background-color: var(--header-bg, ${bgString}); transition: opacity 0.1s linear; height: var(--header-h); padding-left: var(--header-px); padding-right: var(--header-px);" class="fixed top-0 left-0 right-0 z-50 backdrop-blur-3xl flex items-center justify-between shadow-lg shadow-black/20">
          <a href="index.html" class="flex items-center gap-3 group" aria-label="Home">
             <div class="w-8 h-8 md:w-10 md:h-10 bg-transparent flex items-center justify-center rotate-45 group-hover:rotate-90 transition-transform duration-500 overflow-hidden relative shrink-0">
                <svg class="-rotate-45 relative z-10 w-6 h-6 md:w-7 md:h-7 text-white group-hover:-rotate-90 transition-transform duration-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 2.5C13.2 2.5 13.5 5.5 13.2 10.5C12.9 15.5 12.5 20.5 12.2 23.5C12 21.5 12.5 15.5 13 10.5C13.5 5.5 12.8 2.5 12.5 2.5Z" fill="currentColor" /><path d="M4 19C7.5 15.5 11.5 11 17 7L18 6C13.5 9.5 8.5 14.5 5 20L4 19Z" fill="currentColor" /><path d="M12.8 11C15 13.5 17.5 16 20 18.5L19 19.5C16.5 17 14 14.5 12.8 11Z" fill="currentColor" /><path d="M17 7L20.5 5L19.5 4L16 6L17 7Z" fill="currentColor" /></svg>
             </div>
             <div class="hidden md:block">
                <span data-text-key="menuLogoName" class="text-base md:text-xl font-bold tracking-tighter uppercase block text-zinc-100">${brandData.menuLogoName}</span>
                <span data-text-key="menuTagline" class="text-[8px] md:text-[10px] text-zinc-500 tracking-[0.2em] font-medium leading-none block uppercase">${brandData.menuTagline}</span>
             </div>
          </a>
          <nav class="hidden md:flex items-center gap-8">
              <a href="index.html" data-text-key="navHome" class="text-sm font-medium transition-colors ${page === 'home' ? 'text-[var(--accent-light)] font-bold' : 'text-zinc-300 hover:text-[var(--accent-light)]'}" style="font-family: var(--font-h1); text-decoration: none;">${brandData.navNames.home}</a>
              ${(brandData.pageVisibility?.about !== false) ? `<a href="about.html" data-text-key="navAbout" class="text-sm font-medium transition-colors ${page === 'about' ? 'text-[var(--accent-light)] font-bold' : 'text-zinc-300 hover:text-[var(--accent-light)]'}" style="font-family: var(--font-h1); text-decoration: none;">${brandData.navNames.about}</a>` : ''}
              ${(brandData.pageVisibility?.contact !== false) ? `<a href="contact.html" data-text-key="navContact" class="text-sm font-medium transition-colors ${page === 'contact' ? 'text-[var(--accent-light)] font-bold' : 'text-zinc-300 hover:text-[var(--accent-light)]'}" style="font-family: var(--font-h1); text-decoration: none;">${brandData.navNames.contact}</a>` : ''}
              ${(brandData.pageVisibility?.vault || brandData.isVaultVisible) ? `<a href="vault.html" data-text-key="navVault" class="text-sm font-medium transition-colors ${page === 'vault' ? 'text-[var(--accent-light)] font-bold' : 'text-zinc-300 hover:text-[var(--accent-light)]'}" style="font-family: var(--font-h1); text-decoration: none;">${brandData.navNames.vault}</a>` : ''}
              ${(brandData.pageVisibility?.epk) ? `<a href="epk.html" data-text-key="navEpk" class="text-sm font-medium transition-colors ${page === 'epk' ? 'text-[var(--accent-light)] font-bold' : 'text-zinc-300 hover:text-[var(--accent-light)]'}" style="font-family: var(--font-h1); text-decoration: none;">${brandData.navNames.epk || 'EPK'}</a>` : ''}
          </nav>
          
          <div class="flex items-center gap-4">
             <button aria-label="Åpne navigasjonsmeny" aria-expanded="false" aria-controls="mobile-menu" class="md:hidden w-10 h-10 flex items-center justify-center text-[var(--accent)] bg-transparent border-0 hover:text-white transition-colors" onclick="const isHidden = document.getElementById('mobile-menu').classList.toggle('hidden'); this.setAttribute('aria-expanded', isHidden ? 'false' : 'true'); this.querySelector('.menu-icon').style.display = isHidden ? 'block' : 'none'; this.querySelector('.close-icon').style.display = isHidden ? 'none' : 'block';">
                 <svg class="menu-icon" style="display:block" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                 <svg class="close-icon" style="display:none" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
             </button>
          </div>
          
      </header>
      
      <!-- Mobile Menu Overlay -->
      <div id="mobile-menu" class="hidden fixed top-20 md:top-24 left-0 right-0 bottom-0 z-[100] p-8 flex flex-col pt-8 gap-6 overflow-y-auto" style="backdrop-filter: blur(var(--menu-overlay-blur, 5px)) brightness(var(--menu-overlay-brightness, 95%)); -webkit-backdrop-filter: blur(var(--menu-overlay-blur, 5px)) brightness(var(--menu-overlay-brightness, 95%)); background-color: var(--menu-overlay-color, rgba(0,0,0,0.05));">
         <a href="index.html" data-text-key="navHome" class="text-lg uppercase text-[var(--accent)] not-italic text-left py-4 border-b border-zinc-900/50 ${page === 'home' ? 'font-bold' : 'font-medium opacity-80'}" style="font-family: var(--font-h1); text-decoration: none;">${brandData.navNames.home}</a>
         ${(brandData.pageVisibility?.about !== false) ? `<a href="about.html" data-text-key="navAbout" class="text-lg uppercase text-[var(--accent)] not-italic text-left py-4 border-b border-zinc-900/50 ${page === 'about' ? 'font-bold' : 'font-medium opacity-80'}" style="font-family: var(--font-h1); text-decoration: none;">${brandData.navNames.about}</a>` : ''}
         ${(brandData.pageVisibility?.contact !== false) ? `<a href="contact.html" data-text-key="navContact" class="text-lg uppercase text-[var(--accent)] not-italic text-left py-4 border-b border-zinc-900/50 ${page === 'contact' ? 'font-bold' : 'font-medium opacity-80'}" style="font-family: var(--font-h1); text-decoration: none;">${brandData.navNames.contact}</a>` : ''}
         ${(brandData.pageVisibility?.vault || brandData.isVaultVisible) ? `<a href="vault.html" data-text-key="navVault" class="text-lg uppercase text-[var(--accent)] not-italic text-left py-4 border-b border-zinc-900/50 ${page === 'vault' ? 'font-bold' : 'font-medium opacity-80'}" style="font-family: var(--font-h1); text-decoration: none;">${brandData.navNames.vault}</a>` : ''}
         ${(brandData.pageVisibility?.epk) ? `<a href="epk.html" data-text-key="navEpk" class="text-lg uppercase text-[var(--accent)] not-italic text-left py-4 border-b border-zinc-900/50 ${page === 'epk' ? 'font-bold' : 'font-medium opacity-80'}" style="font-family: var(--font-h1); text-decoration: none;">${brandData.navNames.epk || 'EPK'}</a>` : ''}
      </div>`;

  let mainContent = '';
  let contactFooterHTML = '';

  // Helper to generate blur attributes
  const getBlurAttrs = (startVisuals: any) => {
    if (!startVisuals) return '';
    const enabled = startVisuals.blurEnabled ?? false;
    const strength = startVisuals.blurStrength ?? 5;
    const radius = startVisuals.blurRadius ?? 0.5;
    return `data-scroll-blur="${enabled}" data-blur-strength="${strength}" data-blur-radius="${radius}"`;
  };

  if (page === 'home') {
    const hHero = s.home.hero;
    const hSpotify = s.home.spotify;
    const hOrigin = s.home.origin;
    const hLive = s.home.live;

    mainContent = `
        <section id="home-hero" data-section="hero" ${getBlurAttrs(hHero.visuals)} class="relative flex flex-col justify-center items-center px-4 overflow-hidden" style="min-height:var(--hero-min-h); padding-top:var(--hero-pt); padding-bottom:var(--hero-pb); margin-bottom:var(--hero-margin)">
            <div class="blur-target absolute inset-0 z-0">
                ${renderUniversalMedia(isVideo(hHero.videoUrl) ? 'video' : 'image', hHero.videoUrl, 'hero', '--hero-sat', '--hero-dim', '--hero-para', '--hero-op', 'media-home-hero', '', true, hHero.mediaConfig)}
            </div>
            ${renderAura(hHero.visuals, 'hero')}
            <div class="scroll-reveal relative z-10 text-center">
                <h1 data-text-key="homeHeadline" class="${resolveTextClasses('homeHeadline', 'font-bold mb-4 uppercase leading-none glitch-heading')}" data-text="${hHero.headline}" style="${resolveTextStyle('homeHeadline', true)}">${hHero.headline}</h1>
                <p data-text-key="homeSubheadline" class="${resolveTextClasses('homeSubheadline', 'text-zinc-300 font-serif italic')}" style="${resolveTextStyle('homeSubheadline', false)}">${hHero.subheadline}</p>
            </div>
        </section>
        <section id="home-gallery" data-section="gallery" ${getBlurAttrs(hSpotify.visuals)} class="scroll-reveal relative z-20 overflow-hidden bg-black" style="min-height:var(--spotify-min-h); padding-top:var(--spotify-pt); padding-bottom:var(--spotify-pb); margin-bottom:var(--spotify-margin)">
            <div class="blur-target absolute inset-0 z-0">
                ${renderUniversalMedia(isVideo(hSpotify.imageUrl) ? 'video' : 'image', hSpotify.imageUrl || '', 'spotify', '--spotify-sat', '--spotify-dim', '--spotify-para', '--spotify-op', 'media-home-gallery', '', false, hSpotify.mediaConfig)}
            </div>
            <div class="relative z-10 w-full">
                <div class="container mx-auto px-4 mb-12 text-center">
                    <h2 data-text-key="homeSpotifyTitle" class="text-[var(--accent)] font-bold text-sm uppercase tracking-[0.4em]" style="${resolveTextStyle('homeSpotifyTitle', true)}">${hSpotify.title}</h2>
                </div>
                <div class="media-gallery-grid" data-carousel="true">
                    ${hSpotify.items.map(item => renderMediaItem(item)).join('')}
                </div>

                <div class="mt-20 flex flex-col items-center gap-8 px-4">
                    <h3 data-text-key="homeSpotifyListenOn" class="${resolveTextClasses('homeSpotifyTitle', 'text-xs md:text-sm font-bold uppercase tracking-[0.4em]')}" style="${resolveTextStyle('homeSpotifyTitle', true)}" data-text="HØR MER">HØR MER</h3>
                    <div class="flex flex-nowrap items-center justify-center gap-4 md:gap-10 text-zinc-400">
                        ${brandData.socials.spotifyUrl ? `
                        <a href="${brandData.socials.spotifyUrl}" target="_blank" class="social-link" aria-label="Spotify">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14.5c2.5-1 5.5-1 8 0"/><path d="M7 11.5c3.5-1.5 7-1.5 10.5 0"/><path d="M6.5 8.5c3.5-2 7.5-2 11 0"/></svg>
                        </a>` : ''}
                        
                        ${brandData.socials.appleUrl ? `
                        <a href="${brandData.socials.appleUrl}" target="_blank" class="social-link" aria-label="Apple Music">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                        </a>` : ''}

                        ${brandData.socials.soundcloudUrl ? `
                        <a href="${brandData.socials.soundcloudUrl}" target="_blank" class="social-link" aria-label="SoundCloud">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.39 12.01a3.01 3.01 0 0 0 0 6h1.22" /><path d="M12.91 18.01h6.63a3.46 3.46 0 0 0 0-6.92 3.39 3.39 0 0 0-2.5 1.1" /><path d="M8.22 18.01h2.46" /><path d="M8.22 11.51v6.5" /><path d="M10.68 10.51v7.5" /><path d="M5.61 12.01v6" /><path d="M12.91 8.01v10" /><path d="M15.37 11.01v7" /><path d="M3.1 14.01v2" /></svg>
                        </a>` : ''}

                        ${brandData.socials.youtubeUrl ? `
                        <a href="${brandData.socials.youtubeUrl}" target="_blank" class="social-link" aria-label="YouTube Music">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>
                        </a>` : ''}
                    </div>
                </div>
            </div>
        </section>
        <section id="home-origin" data-section="origin" ${getBlurAttrs(hOrigin.visuals)} class="scroll-reveal relative overflow-hidden" style="min-height:var(--origin-min-h); padding-top:var(--origin-pt); padding-bottom:var(--origin-pb); margin-bottom:var(--origin-margin)">
            <div class="blur-target absolute inset-0 z-0">
               ${renderUniversalMedia(isVideo(hOrigin.imageUrl) ? 'video' : 'image', hOrigin.imageUrl, 'origin', '--origin-sat', '--origin-dim', '--origin-para', '--origin-op', 'media-home-origin', '', false, hOrigin.mediaConfig)}
            </div>
            <div class="container relative z-10 mx-auto text-center px-4 max-w-4xl">
                <span data-text-key="homeOriginTagline" class="${resolveTextClasses('homeOriginTagline', 'text-[var(--accent)] font-bold text-xs uppercase tracking-[0.4em] block mb-4')}" style="${resolveTextStyle('homeOriginTagline', false)}">${hOrigin.tagline}</span>
                <h2 data-text-key="homeOriginHeadline" class="${resolveTextClasses('homeOriginHeadline', 'font-bold mb-6 tracking-tighter uppercase leading-tight glitch-heading')}" data-text="${hOrigin.headline}" style="${resolveTextStyle('homeOriginHeadline', true)}">${hOrigin.headline}</h2>
                <p data-text-key="homeOriginText" class="${resolveTextClasses('homeOriginText', 'text-lg md:text-3xl leading-relaxed font-serif italic mb-6')}" style="${resolveTextStyle('homeOriginText', false)}">${hOrigin.text}</p>
                <p data-text-key="homeOriginDescription" class="${resolveTextClasses('homeOriginDescription', 'text-zinc-400 text-sm md:text-xl leading-relaxed max-w-3xl mx-auto')}" style="${resolveTextStyle('homeOriginDescription', false)}">${hOrigin.description}</p>
                <a href="about.html" class="mt-12 btn-glass group">
                   <span data-text-key="homeOriginCtaText">${hHero.ctaText}</span>
                   <svg class="group-hover:translate-x-1 transition-transform" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </a>
            </div>
        </section>
        <section id="home-live" data-section="live" ${getBlurAttrs(hLive.visuals)} class="scroll-reveal live-section relative flex flex-col justify-center items-center overflow-x-hidden cursor-pointer" style="min-height:var(--live-min-h); padding-top:var(--live-pt); padding-bottom:var(--live-pb); margin-bottom:var(--live-margin)">
            <div class="blur-target absolute inset-0 z-0 overflow-hidden">
                ${(() => {
        const muxId = extractMuxId(hLive.videoUrl);
        if (muxId) {
          const mConfig = (hLive.mediaConfig?.mux || {}) as any;
          return `
                    <mux-player
                      id="live-mux-player"
                      playback-id="${muxId}"
                      stream-type="${mConfig.streamType || 'on-demand'}"
                      ${mConfig.autoPlay !== false ? `autoplay="${mConfig.autoPlay || 'muted'}" muted` : ''}
                      ${mConfig.loop !== false ? 'loop' : ''}
                      playsinline
                      ${mConfig.accentColor ? `accent-color="${mConfig.accentColor}"` : ''}
                      ${mConfig.primaryColor ? `primary-color="${mConfig.primaryColor}"` : ''}
                      ${mConfig.secondaryColor ? `secondary-color="${mConfig.secondaryColor}"` : ''}
                      style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;--poster:none;--controls:none;transform:scale(var(--live-mux-scale, 1)) translate(var(--live-mux-trans-x, 0), var(--live-mux-trans-y, 0));transform-origin:center;"
                    ></mux-player>`;
        }
        // Fallback for non-Mux URLs
        return renderUniversalMedia(isVideo(hLive.videoUrl) ? 'video' : 'image', hLive.videoUrl, 'live', '--live-sat', '--live-dim', '--live-para', '--live-op', '', '', false, hLive.mediaConfig);
      })()}

                <!-- Preview Layer for smooth playback -->
                <div class="live-preview-overlay absolute inset-0 z-10 transition-opacity duration-1000">
                    ${renderUniversalMedia(isVideo(hLive.previewImageUrl) ? 'video' : 'image', hLive.previewImageUrl, 'live-image', '--live-image-sat', '--live-image-dim', '--live-image-para', '--live-image-op', '', '', false, hLive.mediaConfig)}
                </div>
            </div>
            
            <!-- Centered Content Wrapper -->
            <style>
                .live-section.is-playing .live-fade-out { opacity: 0; pointer-events: none; transform: translateY(-15px); }
            </style>
            <div class="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 pointer-events-none">
                <div class="relative text-center flex flex-col items-center pointer-events-auto">
                    <span data-text-key="homeLiveTagline" class="live-fade-out transition-all duration-1000 ${resolveTextClasses('homeLiveTagline', 'text-[var(--accent)] font-bold text-lg md:text-5xl uppercase tracking-[0.5em] block mb-12 drop-shadow-lg')}" style="${resolveTextStyle('homeLiveTagline', false)}">${hLive.tagline}</span>
                    <h2 data-text-key="homeLiveHeadline" class="live-fade-out transition-all duration-1000 ${resolveTextClasses('homeLiveHeadline', 'font-bold tracking-widest leading-none glitch-heading')}" data-text="${hLive.headline}" style="${resolveTextStyle('homeLiveHeadline', true)}">${hLive.headline}</h2>
                    
                    <button id="live-play-btn" aria-label="Play video" class="relative z-40 mt-12 w-[72px] h-[72px] md:w-24 md:h-24 rounded-full border-2 border-[var(--accent)] flex items-center justify-center text-white bg-white/10 backdrop-blur-2xl shadow-[0_0_30px_rgb(var(--accent-rgb)/0.2)] transition-all duration-500 ease-out font-bold">
                        <div class="play-icon animate-play-ring">
                            <svg class="w-8 h-8 md:w-12 md:h-12" viewBox="0 0 24 24" fill="currentColor" class="ml-1"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                    </button>

                    ${hLive.youtubeUrl ? `
                    <a href="${hLive.youtubeUrl}" target="_blank" rel="noreferrer" class="live-fade-out transition-all duration-1000 relative z-40 mt-8 flex items-center gap-3 text-white/50 hover:text-[var(--accent)] group cursor-pointer">
                        <span data-text-key="homeLiveYoutubeText" class="uppercase tracking-[0.2em] text-xs font-bold">
                            ${hLive.youtubeText || "Watch on YouTube"}
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="transform group-hover:translate-x-1 transition-transform">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </a>
                    ` : ''}
                </div>
            </div>
        </section>`;
  } else if (page === 'about') {
    const aValues = s.about.values;
    const aHero = s.about.hero;
    const aStory = s.about.story;
    const aMission = s.about.mission;
    const STICKY_ENABLED = true;

    mainContent = `
        <!-- ── About Hero: ${STICKY_ENABLED ? '250vh sticky' : 'auto non-sticky'} scroll-animation wrapper ─────────────── -->
        <div class="about-anim-wrapper" style="position:relative;height:${STICKY_ENABLED ? '250vh' : 'auto'};background:#000">
            <div class="about-sticky" data-scroll-seq data-scroll-seq-parallax="${aHero.visuals.parallax}" ${getBlurAttrs(aHero.visuals)}
                 data-zoom-desktop="${aHero.framing?.zoomDesktop ?? 1}"
                 data-x-desktop="${aHero.framing?.xOffsetDesktop ?? 0}"
                 data-y-desktop="${aHero.framing?.yOffsetDesktop ?? 0}"
                 data-zoom-mobile="${aHero.framing?.zoomMobile ?? 1}"
                 data-x-mobile="${aHero.framing?.xOffsetMobile ?? 0}"
                 data-y-mobile="${aHero.framing?.yOffsetMobile ?? 0}"
                 style="position:${STICKY_ENABLED ? 'sticky' : 'relative'};top:0;height:100dvh;overflow:hidden">

                <!-- Canvas + blur-target (ScrollBlur targets .blur-target) -->
                <div class="blur-target" style="position:absolute;inset:0;z-index:0;transition:filter 0.1s linear">
                    <div class="seq-media-wrap" style="filter:saturate(var(--about-hero-sat,100%));position:absolute;inset:0;transform-origin:50% 100%;will-change:transform">
                        <canvas class="scroll-seq-canvas" style="position:absolute;inset:0;width:100%;height:100%;display:block"></canvas>
                    </div>
                </div>

                <!-- Static gradient dim (from visuals.dim) -->
                <div class="seq-dim-overlay" style="position:absolute;inset:0;z-index:1;pointer-events:none;opacity:var(--about-hero-dim,${aHero.visuals.dim / 100});background:linear-gradient(to bottom,#000 0%,rgba(0,0,0,0.7) 30%,rgba(0,0,0,0.15) 50%,rgba(0,0,0,0.7) 70%,#000 100%)"></div>

                <!-- Progressive blackout (JS fills from 80%→100% of scroll) -->
                <div class="seq-blackout" style="position:absolute;inset:0;z-index:2;background:#000;opacity:0;pointer-events:none"></div>

                ${renderAura(aHero.visuals, 'about-hero')}

                <!-- Intro text — visible at start, JS fades out over first 5 frames -->
                <div class="seq-intro-text"
                     style="position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;
                            justify-content:center;align-items:center;text-align:center;
                            opacity:1;
                            padding:1.5rem;padding-top:var(--about-hero-pt);padding-bottom:var(--about-hero-pb);pointer-events:none">
                    <h2 data-text-key="aboutHeroIntroText"
                        class="${resolveTextClasses('aboutHeroIntroText', 'h1-scale font-serif mb-8 leading-tight text-white')}"
                        style="${resolveTextStyle('aboutHeroIntroText', true)}">${aHero.introText || ''}</h2>
                </div>

                <!-- Hero text — hidden at start, JS fades in at end (last 3 frames) -->
                <div class="seq-hero-text"
                     style="position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;
                            justify-content:center;align-items:center;text-align:center;
                            opacity:0;
                            padding:1.5rem;padding-top:var(--about-hero-pt);padding-bottom:var(--about-hero-pb);pointer-events:none">
                    <h2 data-text-key="aboutHeroHeadline"
                        class="${resolveTextClasses('aboutHeroHeadline', 'glitch-heading font-serif mb-8 leading-tight text-white')}"
                        data-text="${aHero.headline}"
                        style="${resolveTextStyle('aboutHeroHeadline', true)}">${aHero.headline}</h2>
                    <span data-text-key="aboutHeroSubheadline"
                          class="${resolveTextClasses('aboutHeroSubheadline', 'inline-block text-[var(--accent-light)] font-bold tracking-[0.4em] text-xs uppercase mb-6 animate-pulse')}"
                          style="${resolveTextStyle('aboutHeroSubheadline', false)}">${aHero.subheadline || 'EST. 2024'}</span>
                    <div class="w-32 h-1 bg-[var(--accent)] mx-auto rounded-full"></div>
                </div>

            </div>
        </div>

        <!-- ── Story section (normal flow — appears after the 200vh animation) ── -->
        <section ${getBlurAttrs(aStory.visuals)} class="scroll-reveal bg-black" style="min-height:var(--story-min-h); padding-top:var(--story-pt); padding-bottom:var(--story-pb); margin-bottom:var(--story-margin)">
            <div class="container mx-auto px-6 md:px-12 max-w-7xl relative flex flex-col gap-12 w-full">
                <div class="blur-target absolute inset-0 z-0 pointer-events-none"></div>
                <div class="w-full">
                    <h3 data-text-key="aboutStoryTagline" class="text-[var(--accent)] text-sm font-bold uppercase tracking-[0.3em] block text-center" style="${resolveTextStyle('aboutStoryTagline', true)}">${aStory.tagline || 'Vår Historie'}</h3>
                </div>
                <div class="w-full grid grid-cols-1 lg:grid-cols-5 gap-16 relative">
                    <div class="lg:col-span-3 blur-target relative z-10">
                        <div data-text-key="story" class="text-zinc-300 italic border-l-2 border-accent pl-8 whitespace-pre-wrap" style="${resolveTextStyle('story', false)}">${aStory.text}</div>
                    </div>
                    <div class="lg:col-span-2 relative overflow-hidden rounded-3xl h-[500px] bg-zinc-900 blur-target z-10">
                        ${renderUniversalMedia(isVideo(aStory.imageUrl) ? 'video' : 'image', aStory.imageUrl, 'story', '100%', '0', '0', '1', 'media-about-story', '', false, aStory.mediaConfig)}
                    </div>
                </div>
            </div>
        </section>

        <!-- ── Mission section ────────────────────────────────────────────────── -->
        <section ${getBlurAttrs(aMission.visuals)} class="scroll-reveal bg-black" style="min-height:var(--mission-min-h); padding-top:var(--mission-pt); padding-bottom:var(--mission-pb); margin-bottom:var(--about-mission-margin)">
            <div class="blur-target container mx-auto px-6 max-w-4xl text-center">
                <h3 data-text-key="aboutMissionTagline" class="${resolveTextClasses('aboutMissionTagline', 'text-[var(--accent)] text-xs font-bold uppercase tracking-[0.4em] mb-12')}" style="${resolveTextStyle('aboutMissionTagline', false)}">${aMission.tagline || 'Misjon'}</h3>
                <p data-text-key="mission" class="${resolveTextClasses('mission', 'h2-scale italic text-white leading-tight')}" style="${resolveTextStyle('mission', true)}">${aMission.text}</p>
            </div>
        </section>`;



  } else if (page === 'vault') {
    const v = s.vault;
    mainContent = `
      <section ${getBlurAttrs(v.visuals)} class="relative flex flex-col justify-center items-center px-6 overflow-hidden" style="min-height:var(--vault-min-h); padding-top:var(--vault-pt); padding-bottom:var(--vault-pb); margin-bottom:var(--vault-margin)">
        <div class="blur-target absolute inset-0 z-0">
          ${renderUniversalMedia(isVideo(v.videoUrl) ? 'video' : 'image', v.videoUrl, 'vault', '--vault-sat', '--vault-dim', '--vault-para', '--vault-op', 'media-vault', '', true, v.mediaConfig)}
        </div>
        ${renderAura(v.visuals, 'vault')}
        <div class="scroll-reveal relative z-10 text-center max-w-4xl">
          <span class="text-[var(--accent)] font-bold text-xs uppercase tracking-[0.4em] block mb-8 animate-pulse">${v.tagline}</span>
          <h1 data-text-key="vaultHeadline" class="${resolveTextClasses('vaultHeadline', 'glitch-heading font-serif text-white mb-8')}" data-text="${v.headline}" style="${resolveTextStyle('vaultHeadline', true)}">${v.headline}</h1>
          <p data-text-key="vaultDescription" class="${resolveTextClasses('vaultDescription', 'text-xl text-zinc-300 max-w-2xl mx-auto')}" style="${resolveTextStyle('vaultDescription', false)}">${v.description}</p>
        </div>
      </section>
      <section class="container mx-auto px-4 pb-32">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  ${v.items.map(item => `
                    <div class="group relative aspect-[4/5] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-[var(--accent)] transition-all">
                        ${item.type === 'video' ?
        `<video src="${normalizePath(item.url)}" muted loop playsinline class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all"></video>` :
        `<img src="${normalizePath(item.url)}" alt="${item.title || ''}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all">`
      }
                        <div class="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                             <h3 class="text-xl font-bold text-white mb-1">${item.title}</h3>
                             <p class="text-xs text-[var(--accent)] uppercase tracking-widest">${item.description}</p>
                        </div>
                    </div>
                `).join('')
      }
    </div>
      </section>`;
  } else if (page === 'contact') {
    const c = s.contact;
    mainContent = `
        <section ${getBlurAttrs(c.visuals)} class="relative flex flex-col justify-center items-center px-4 sm:px-6 overflow-hidden" style="min-height:var(--contact-min-h); padding-top:var(--contact-pt); padding-bottom:var(--contact-pb)">
            <div class="blur-target absolute inset-0 z-0">
                ${renderUniversalMedia(isVideo(c.videoUrl) ? 'video' : 'image', c.videoUrl, 'contact', '--contact-sat', '--contact-dim', '--contact-para', '--contact-op', 'media-contact', '', true, c.mediaConfig)}
            </div>
            ${renderAura(c.visuals, 'contact')}
             <a href="mailto:${s.contact.email}" class="relative z-10 text-center w-full max-w-5xl mx-auto btn-glass !block !whitespace-normal !h-auto p-8 md:p-20 !rounded-[2rem] md:!rounded-[3rem] shadow-2xl transition-all group-card" style="text-decoration:none;">
                 <div class="relative z-10">
                    <span class="${resolveTextClasses('contactTagline', 'text-[var(--accent)] font-bold text-xs uppercase tracking-[0.3em] block mb-6')}" style="${resolveTextStyle('contactTagline', false)}">${s.contact.tagline}</span>
                    <h1 class="${resolveTextClasses('contactHeadline', 'font-serif text-white mb-6 md:mb-8 leading-tight glitch-heading')}" data-text="${s.contact.headline}" style="${resolveTextStyle('contactHeadline', true)}">${s.contact.headline}</h1>
                    <p class="${resolveTextClasses('contactText', 'text-base md:text-xl text-zinc-300 font-light mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed px-2')}" style="${resolveTextStyle('contactText', false)}">${s.contact.text}</p>
                    <div class="inline-flex items-center gap-2 md:gap-3 text-xl md:text-4xl font-bold text-white cursor-pointer break-all px-2">
                        <span class="${resolveTextClasses('contactEmail', '')}" style="${resolveTextStyle('contactEmail', true)}">${s.contact.email}</span>
                    </div>
                 </div>
             </a>

             <div class="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center px-4">
                ${c.addresses.map(addr => `
                    <div class="space-y-2">
                        <span class="${resolveTextClasses('contactAddressLabel', 'block text-[var(--accent-dark)] text-xs font-bold uppercase tracking-widest')}" style="${resolveTextStyle('contactAddressLabel', false)}">${addr.label}</span>
                        <p class="${resolveTextClasses('contactAddressValue', 'text-zinc-500 text-xs uppercase tracking-widest')}" style="${resolveTextStyle('contactAddressValue', false)}">${addr.address}</p>
                    </div>
                `).join('')}
             </div>

             </div>
        </section>
        `;
    // Minimal footer for contact page (now empty of icons as they moved to global footer)
    contactFooterHTML = '';
  } else if (page === 'epk') {
    const epk = s.epk;
    if (!epk) {
      mainContent = '<div class="text-white p-8 text-center">EPK not configured.</div>';
    } else {
      const accentColor = brandData.accentColor || '#5b8b88';

      // Helper to render a media background for EPK sections
      const epkMedia = (url: string, prefix: string, mediaConfig: any = {}, mediaId: string = '') => {
        const type = isVideo(url) ? 'video' : 'image';
        return renderUniversalMedia(type, url, prefix, `--${prefix}-sat`, `--${prefix}-dim`, `--${prefix}-para`, `--${prefix}-op`, mediaId, '', false, mediaConfig);
      };

      mainContent = `
      <!-- EPK: Hook -->
      <section id="epk-hook" class="epk-hook relative flex flex-col justify-end items-center overflow-hidden" style="min-height: var(--epk-hook-min-h); padding-top: var(--epk-hook-pt); padding-bottom: var(--epk-hook-pb); margin-bottom: var(--epk-hook-margin);">
          <div class="absolute inset-0 z-0">
              ${epkMedia(epk.hook.imageUrl, 'epk-hook', epk.hook.mediaConfig, 'media-epk-hook')}
          </div>
          ${renderAura(epk.hook.visuals, 'epk-hook')}
          ${(epk.hook.visuals.glitchIntensity ?? 0) > 0 && epk.hook.imageUrl ? (() => {
          const _gs = epk.hook.imageUrl.startsWith('http') ? epk.hook.imageUrl : `${brandData.serverBaseUrl}/${epk.hook.imageUrl.replace(/^\/+/, '')}`;
          return `<div class="epk-hook-glitch-wrap" style="--hg-play:running"><div class="epk-hook-glitch-inner"><img src="${_gs}" class="epk-hook-glitch-img" alt=""><img src="${_gs}" class="epk-hook-glitch-rgb" alt=""></div></div>`;
        })() : ''}
          <div class="absolute inset-0 z-0" style="background: linear-gradient(to bottom, rgba(0,0,0,0) 90%, rgba(0,0,0,1) 100%)"></div>
          <div class="relative z-10 text-center px-6 max-w-5xl mx-auto">

              <p class="${resolveTextClasses('epkHookTagline', '')}" style="font-weight:700;text-transform:uppercase;letter-spacing:.4em;margin-bottom:3rem; ${resolveTextStyle('epkHookTagline', false)}" data-text-key="epkHookTagline">${epk.hook.tagline}</p>
          <div class="epk-hook-buttons">
            <div class="flex flex-row gap-4 md:gap-14 justify-center items-center">
            ${(() => {
          const configStr = JSON.stringify(epk.hook.mediaConfig || {}).replace(/"/g, '&quot;');
          if (epk.hook.ctaVideoUrl) {
            const mxId = extractMuxId(epk.hook.ctaVideoUrl);
            if (mxId) return `<button onclick="openEpkPlayer('mx', '${mxId}', '${configStr}')" class="btn-glass min-w-[130px] md:min-w-[220px] md:w-[220px]" data-mob="SE VIDEO" style="display:inline-flex;align-items:center;justify-content:center"><span class="btn-text">SE VIDEO</span></button>`;
            return `<button onclick="openEpkPlayer('yt', '${getEmbedUrl(epk.hook.ctaVideoUrl)}', '${configStr}')" class="btn-glass min-w-[130px] md:min-w-[220px] md:w-[220px]" data-mob="SE VIDEO" style="display:inline-flex;align-items:center;justify-content:center"><span class="btn-text">SE VIDEO</span></button>`;
          }
          return '';
        })()}
            ${(() => {
          const configStr = JSON.stringify(epk.hook.mediaConfig || {}).replace(/"/g, '&quot;');
          if (epk.hook.ctaSpotifyUrl) {
            const mxId = extractMuxId(epk.hook.ctaSpotifyUrl);
            if (mxId) return `<button onclick="openEpkPlayer('mx', '${mxId}', '${configStr}')" class="btn-glass min-w-[130px] md:min-w-[220px] md:w-[220px]" data-mob="Soundcloud" style="display:inline-flex;align-items:center;justify-content:center"><span class="btn-text">Soundcloud</span></button>`;
            return `<button onclick="openEpkPlayer('sc', '${getEmbedUrl(epk.hook.ctaSpotifyUrl)}', '${configStr}')" class="btn-glass min-w-[130px] md:min-w-[220px] md:w-[220px]" data-mob="Soundcloud" style="display:inline-flex;align-items:center;justify-content:center"><span class="btn-text">Soundcloud</span></button>`;
          }
          return '';
        })()}
            </div>
        </div>
        <!-- Scroll indicator - REMOVED -->

      </section>

      <!-- EPK: Bio / Pitch -->
      <section id="epk-pitch" class="epk-pitch relative overflow-hidden" style="min-height: var(--epk-pitch-min-h); padding-top: var(--epk-pitch-pt); padding-bottom: var(--epk-pitch-pb); margin-bottom: var(--epk-pitch-margin);">
          <div class="absolute inset-0 z-0">
              ${epkMedia(epk.pitch.imageUrl, 'epk-pitch', epk.pitch.mediaConfig, 'media-epk-pitch')}
          </div>
          <div class="relative z-10 max-w-6xl mx-auto px-6">
          <div style="text-align:center;margin-bottom:3rem">
            <span class="${resolveTextClasses('epkPitchTagline', '')}" style="font-weight:700;text-transform:uppercase;letter-spacing:.4em; ${resolveTextStyle('epkPitchTagline', false)}" data-text-key="epkPitchTagline">${epk.pitch.tagline}</span>
            <div style="height:1px;width:6rem;margin:.75rem auto 0;background:${accentColor}"></div>
          </div>

          <!-- Intro Headline / Lead Text -->
          ${((epk.pitch as any).introHeadline || (epk.pitch as any).introText) ? `
          <div style="max-width:56rem;margin:0 auto 4rem;text-align:center;padding:0 1.5rem">
            ${(epk.pitch as any).introHeadline ? `<h2 class="${resolveTextClasses('epkIntroHeadline', '')}" style="font-weight:700;line-height:1.1;letter-spacing:-.02em;margin-bottom:2rem; ${resolveTextStyle('epkIntroHeadline', true)}" data-text-key="epkIntroHeadline">${(epk.pitch as any).introHeadline}</h2>` : ''}
            ${(epk.pitch as any).introText ? `<p class="${resolveTextClasses('epkIntroText', '')}" style="line-height:1.6;max-width:36rem;margin:0 auto;font-weight:500; ${resolveTextStyle('epkIntroText', false)}" data-text-key="epkIntroText">${(epk.pitch as any).introText}</p>` : ''}
          </div>` : ''}

          <div class="epk-pitch-grid">
               <div class="epk-bio-text">
                  ${(epk.pitch.quotes && epk.pitch.quotes.length > 0)
          ? epk.pitch.quotes.map((q: any) => `
                  <div class="epk-quote-box relative overflow-hidden shadow-2xl p-6 md:p-10 scroll-reveal" 
                       style="background:rgba(0,0,0,0.6);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(var(--accent-rgb), 0.2);transform:translateZ(0);">
                    <div class="epk-quote-glow absolute inset-[-100%] opacity-50 blur-2xl pointer-events-none animate-glow-sweep" style="background:conic-gradient(from 0deg, transparent 45%, var(--accent) 50%, transparent 55%);"></div>
                    <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(to right, transparent, var(--accent), transparent)"></div>
                    <div class="quote-mark" style="line-height:.6;font-family:var(--font-h1);margin-bottom:1rem;font-weight:700;color:var(--accent)">&ldquo;</div>
                    <blockquote class="${resolveTextClasses('epkQuoteText', '')}" style="font-weight:700;line-height:1.4;font-family:var(--font-h1);margin:0 0 2rem;font-style:italic; ${resolveTextStyle('epkQuoteText', true)}">${q.text}</blockquote>
                    <div style="display:flex;align-items:center;gap:1rem">
                      <div style="width:2.5rem;height:1px;background:var(--accent);flex-shrink:0"></div>
                      <div>
                        <div class="${resolveTextClasses('epkQuoteAuthor', '')}" style="font-weight:700;color:var(--accent);margin-bottom:.25rem; ${resolveTextStyle('epkQuoteAuthor', true)}">${q.author}</div>
                        <div class="${resolveTextClasses('epkQuoteRole', '')}" style="text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,0.6); ${resolveTextStyle('epkQuoteRole', false)}">${q.role}</div>
                      </div>
                    </div>
                    <div style="position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(to right, transparent, rgba(var(--accent-rgb), 0.25), transparent)"></div>
                  </div>`).join('')
          : ''
        }
                  ${(epk.pitch.bioText || '').split('\n\n').map(para => `<p class="${resolveTextClasses('epkPitchBio', '')}" style="color:#fff;line-height:1.7;margin-bottom:1rem; ${resolveTextStyle('epkPitchBio', false)}" data-text-key="epkPitchBio">${para}</p>`).join('')}
               </div>

            ${(epk.pitch.keyPoints && epk.pitch.keyPoints.length > 0) ? `
              <div class="epk-key-points" style="margin-top:3rem;padding-top:3rem;border-top:1px solid rgba(255,255,255,.05)">
                <h3 style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.2em;margin-bottom:1.5rem;">At a Glance</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:1.5rem">
                  ${epk.pitch.keyPoints.map(point => `
                    <div style="display:flex;align-items:center;gap:1rem;background:rgba(255,255,255,.03);padding:1rem;border-radius:.75rem;border:1px solid rgba(255,255,255,.05)">
                      <div style="width:.375rem;height:.375rem;border-radius:50%;background:${accentColor};flex-shrink:0"></div>
                      <span style="font-size:.875rem;color:#a1a1aa">${point}</span>
                    </div>
                  `).join('')}
                </div>
              </div>` : ''}
          </div>
        </div>
      </section>

      <!-- EPK: Multimedia -->
      <section id="epk-media" class="epk-media relative bg-black" style="min-height: var(--epk-media-min-h); padding-top: var(--epk-media-pt); padding-bottom: var(--epk-media-pb); margin-bottom: var(--epk-media-margin);">
          <div class="max-w-6xl mx-auto px-6">
              <div class="mb-12 text-center">
                  <span class="${resolveTextClasses('epkMediaTagline', 'text-[10px] font-bold uppercase tracking-[0.4em]')}" style="${resolveTextStyle('epkMediaTagline', false)}" data-text-key="epkMediaTagline">
                      ${epk.media.tagline}
                  </span>
                  <div class="h-px w-24 mx-auto mt-3 opacity-20" style="background: var(--accent);"></div>
              </div>
              ${(epk.media.tracks && epk.media.tracks.length > 0) ? `
              <div class="mb-12">
                  <div class="mt-24 md:text-left text-center">
                      <h3 class="${resolveTextClasses('epkTracksHeadline', 'text-sm font-bold uppercase tracking-widest mb-4 opacity-50')}" style="${resolveTextStyle('epkTracksHeadline', true)}" data-text-key="epkTracksHeadline">
                          ${epk.media.tracksHeadline || 'Selected Tracks'}
                      </h3>
                  </div>
                  <div class="track-glitch-grid">
                      ${epk.media.tracks.map((t: any, i: number) => {
          const num = String(i + 1).padStart(2, '0');
          const titleStr = t.title.replace(/"/g, '&quot;');
          const descStr = t.description.replace(/"/g, '&quot;');

          const mapUrl = (url: string) => url ? encodeURI(url.startsWith('http') ? url : `${brandData.serverBaseUrl}/${url.replace(/^\/+/, '')}`) : null;
          const imgSrc = mapUrl(t.imageUrl);
          const audioSrc = mapUrl(t.audioUrl);

          const cardIdx = (i % 3) + 1;
          return `
                          <div class="track-glitch-card tg-flare-${cardIdx}" onclick="toggleEpkTrack(this, ${i})">
                              <div class="track-glitch-topline"></div>
                              <div style="position:absolute;inset:0;z-index:4;pointer-events:none;background:radial-gradient(ellipse at 50% 0%, rgba(120,200,255,0.07) 0%, rgba(100,170,255,0.03) 50%, transparent 80%)"></div>
                              <div class="track-glitch-aurora"></div>
                              <div class="track-glitch-aurora-2"></div>
                              ${imgSrc ? `
                                <img src="${imgSrc}" class="track-glitch-img tg-img-${cardIdx}" alt="${titleStr}" loading="lazy">
                                <img src="${imgSrc}" class="track-glitch-rgb tg-rgb-${cardIdx}" alt="" loading="lazy">
                              ` : ''}
                              <div class="track-glitch-play">
                                  <div class="track-glitch-play-btn">
                                      <div class="play-icon relative z-10 ml-1">
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                      </div>
                                      <div class="pause-icon relative z-10 hidden">
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
                                      </div>
                                      <div class="animate-play-ring absolute inset-0 rounded-full border border-[var(--accent)]/50"></div>
                                  </div>
                              </div>
                              <div class="track-glitch-content">
                                  <span class="track-glitch-num">${num}</span>
                                  ${audioSrc ? `<audio src="${audioSrc}" preload="metadata" class="epk-audio-element hidden"></audio>` : ''}
                                  <span class="track-glitch-title">${titleStr}</span>
                                  <span class="track-glitch-desc">${descStr}</span>
                                  <div class="track-glitch-bar">
                                      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                      Play
                                  </div>
                              </div>
                          </div>`;
        }).join('')}
                  </div>
              </div>` : ''}
              <style>
                  @keyframes epkBurnIn {
                      0% { opacity:0; transform:scale(0.15); filter:blur(50px); }
                      45% { opacity:0.82; transform:scale(2.2); filter:blur(22px); }
                      100% { opacity:0; transform:scale(3.8); filter:blur(6px); }
                  }
                  @keyframes epkBurnOut {
                      0% { opacity:0; transform:scale(0.5); filter:blur(30px); }
                      35% { opacity:0.55; transform:scale(1.6); filter:blur(20px); }
                      100% { opacity:0; transform:scale(3.2); filter:blur(8px); }
                  }
                  .epk-burn-overlay { position:fixed; inset:0; z-index:9999; display:none; align-items:center; justify-content:center; }
                  .epk-burn-overlay.active { display:flex; }
                  .epk-burn-flash { position:absolute; inset:-20%; background:radial-gradient(ellipse at center, rgba(240,235,215,1) 0%, rgba(230,220,195,0.6) 40%, transparent 72%); border-radius:50%; pointer-events:none; opacity:0; }
                  .epk-burning-in .epk-burn-flash { animation:epkBurnIn 0.805s ease-out forwards; }
                  .epk-burning-out .epk-burn-flash { animation:epkBurnOut 0.55s ease-in forwards; }
                  .epk-player-content { maxWidth:calc(100vw - 32px); width:100%; position:relative; opacity:0; transform:scale(0.97); transition:opacity 0.45s ease 0.15s, transform 0.45s ease 0.15s; pointer-events:none; }
                  .epk-open .epk-player-content { opacity:1; transform:scale(1); pointer-events:all; }
                  .epk-player-btn-pill { display:inline-flex; align-items:center; gap:10px; padding:13px 28px; border-radius:999px; cursor:pointer; font-size:11px; font-weight:700; letter-spacing:0.3em; text-transform:uppercase; border:1px solid rgba(255,255,255,0.18); background:rgba(10,10,12,0.72); color:rgba(255,255,255,0.82); backdrop-filter:blur(14px); transition:all 0.35s ease; position:relative; overflow:hidden; }
                  .epk-player-btn-pill:hover { border-color:rgba(255,255,255,0.35); color:#fff; transform:translateY(-1px); box-shadow:0 6px 28px rgba(0,0,0,0.5); }
                  #epk-bottom-back-wrap { position:fixed; bottom:28px; right:32px; z-index:9999; display:none; }
                  .epk-open #epk-bottom-back-wrap { display:flex; }
                  @media (max-width: 768px) {
                      #epk-sc-iframe-static { height: 166px !important; }
                  }
              </style>

               <div id="epk-players-btn-bar" style="display:flex;justify-content:center;gap:1rem;margin-top:3rem;flex-wrap:wrap">
                  ${(() => {
          const configStr = JSON.stringify(epk.media.mediaConfig || {}).replace(/"/g, '&quot;');
          if (epk.media.videoEmbedUrl) {
            const mxId = extractMuxId(epk.media.videoEmbedUrl);
            if (mxId) return `<button class="btn-glass" onclick="openEpkPlayer('mx', '${mxId}', '${configStr}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>${epk.media.videoHeadline || 'Video'}</button>`;
            return `<button class="btn-glass" onclick="openEpkPlayer('yt', '${getEmbedUrl(epk.media.videoEmbedUrl)}', '${configStr}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>${epk.media.videoHeadline || 'YouTube'}</button>`;
          }
          return '';
        })()}
                  ${(() => {
          const configStr = JSON.stringify(epk.media.mediaConfig || {}).replace(/"/g, '&quot;');
          if (epk.media.spotifyEmbedUrl) {
            const mxId = extractMuxId(epk.media.spotifyEmbedUrl);
            if (mxId) return `<button class="btn-glass" onclick="openEpkPlayer('mx', '${mxId}', '${configStr}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 11.5c2.5-1 5.5-1 8 0M7 14.5c3-1.2 7-1.2 10 0M9 17.5c1.5-.6 4.5-.6 6 0"/></svg>${epk.media.spotifyHeadline || 'Listen'}</button>`;
            return `<button class="btn-glass" onclick="openEpkPlayer('sc', '${getEmbedUrl(epk.media.spotifyEmbedUrl)}', '${configStr}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 11.5c2.5-1 5.5-1 8 0M7 14.5c3-1.2 7-1.2 10 0M9 17.5c1.5-.6 4.5-.6 6 0"/></svg>${epk.media.spotifyHeadline || 'Spotify'}</button>`;
          }
          return '';
        })()}
              </div>

              </div>
          </div>
      </section>

      <!-- EPK: Press Assets -->
      <section id="epk-press" style="background:#000; border-top:1px solid #18181b; min-height:var(--epk-press-min-h); padding-top:var(--epk-press-pt); padding-bottom:var(--epk-press-pb); margin-bottom:var(--epk-press-margin)">
        <div style="max-width:56rem;margin:0 auto;text-align:center;padding:0 1rem">
          <div style="margin-bottom:3rem"><span class="${resolveTextClasses('epkPressTagline', '')}" style="font-weight:700;text-transform:uppercase;letter-spacing:.4em; ${resolveTextStyle('epkPressTagline', false)}" data-text-key="epkPressTagline">${epk.press.tagline}</span><div style="height:1px;width:6rem;margin:0.75rem auto 0;opacity:0.2;background:var(--accent)"></div></div>
          <h2 class="${resolveTextClasses('epkPressHeadline', '')}" style="font-weight:700;color:#fff;margin-bottom:1rem;font-family:var(--font-h2); ${resolveTextStyle('epkPressHeadline', true)}" data-text-key="epkPressHeadline">${epk.press.headline}</h2>
          <p style="color:#71717a;font-size:.875rem;margin-bottom:2rem;max-width:32rem;margin-left:auto;margin-right:auto">Materiealet er klar til bruk for presse, promo, og arrangører</p>
          <div class="press-glitch-grid">
            ${(epk.press.assets || []).map((asset, idx) => {
          const glitchImgSrc = epk.hook.imageUrl
            ? (epk.hook.imageUrl.startsWith('http') ? epk.hook.imageUrl : `${brandData.serverBaseUrl}/${epk.hook.imageUrl.replace(/^\/+/, '')}`)
            : null;
          const fileExt = (asset.label || '').match(/\(([^)]+)\)/)?.[1] || (asset.url || '').split('.').pop()?.toUpperCase() || 'FILE';
          const cardIdx = (idx % 3) + 1;
          return `<a href="${asset.url || '#'}" download class="press-glitch-card pg-flare-${cardIdx}">
                <div class="press-glitch-aurora"></div>
                <div class="press-glitch-aurora-2"></div>
                ${glitchImgSrc ? `
                  <img src="${glitchImgSrc}" class="press-glitch-img pg-img-${cardIdx}" alt="" loading="lazy">
                  <img src="${glitchImgSrc}" class="press-glitch-rgb pg-rgb-${cardIdx}" alt="" loading="lazy">
                ` : ''}
                <div class="press-glitch-content">
                  <span class="press-glitch-badge">${fileExt}</span>
                  <span class="press-glitch-label">${asset.label}</span>
                  <div class="press-glitch-download">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download
                  </div>
                </div>
              </a>`;
        }).join('')}
          </div>
        </div>
      </section>

      <!-- EPK: Contact -->
      <section id="epk-contact" class="w-full bg-black flex flex-col group overflow-hidden" style="margin-bottom:var(--epk-contact-margin)">
        <!-- 1. Independent Tagline Area -->
        <div class="w-full bg-black text-center relative z-20 py-12 px-6">
            <span class="${resolveTextClasses('epkContactTagline', '')}" style="font-weight:700;text-transform:uppercase;letter-spacing:.4em; ${resolveTextStyle('epkContactTagline', false)}" data-text-key="epkContactTagline">${epk.contact.tagline}</span>
        </div>

        <!-- 2. Main Media & Content Area -->
        <div class="relative w-full flex-grow flex flex-col items-center justify-center overflow-hidden" 
             style="min-height:var(--epk-contact-min-h); padding-top:var(--epk-contact-pt); padding-bottom:var(--epk-contact-pb)">
            
            <div class="absolute inset-0 z-0">
                ${epkMedia(epk.contact.imageUrl, 'epk-contact', epk.contact.mediaConfig, 'media-epk-contact')}
            </div>
            ${renderAura(epk.contact.visuals, 'epk-contact')}
            ${(epk.contact.visuals.glitchIntensity ?? 0) > 0 && epk.contact.imageUrl ? (() => {
          const _gs = epk.contact.imageUrl.startsWith('http') ? epk.contact.imageUrl : `${brandData.serverBaseUrl}/${epk.contact.imageUrl.replace(/^\/+/, '')}`;
          return `<div class="epk-contact-glitch-wrap"><div class="epk-contact-glitch-inner"><img src="${_gs}" class="epk-contact-glitch-img" alt=""><img src="${_gs}" class="epk-contact-glitch-rgb" alt=""></div></div>`;
        })() : ''}
            <div class="absolute inset-0 z-0" style="background: linear-gradient(to bottom, rgba(0,0,0,0) 90%, rgba(0,0,0,1) 100%)"></div>
            
            <div class="relative z-10 text-center px-6" style="max-width:48rem;margin:0 auto">
                <h2 class="${resolveTextClasses('epkContactHeadline', '')}" style="font-weight:700;color:#fff;margin-bottom:2rem;line-height:1.1;font-family:var(--font-h2); ${resolveTextStyle('epkContactHeadline', true)}" data-text-key="epkContactHeadline">${epk.contact.headline}</h2>
                <div style="display:flex;flex-direction:column;gap:1rem;align-items:center">
                    <a href="mailto:${epk.contact.email}" class="${resolveTextClasses('epkContactEmail', '')}" style="font-weight:700;color:#fff;text-decoration:none;transition:opacity .2s; ${resolveTextStyle('epkContactEmail', false)}" data-text-key="epkContactEmail">${epk.contact.email}</a>
                    ${epk.contact.phone ? `<a href="tel:${epk.contact.phone}" class="${resolveTextClasses('epkContactPhone', '')}" style="color:#a1a1aa;text-decoration:none;transition:color .2s; ${resolveTextStyle('epkContactPhone', false)}" data-text-key="epkContactPhone">${epk.contact.phone}</a>` : ''}
                </div>
                <div style="margin-top:3rem">
                    <a href="mailto:${epk.contact.email}" class="btn-glass">SEND BOOKING FORESPØRSEL</a>
                </div>

            </div>
        </div>
      </section>

      <div id="epk-burn-overlay" class="epk-burn-overlay">
            <div class="epk-burn-flash"></div>
            <div class="epk-player-content">
                <div id="epk-mux-player-wrap" style="display:none; width:90vw; aspect-ratio:16/9; margin:0 auto; border-radius:8px; overflow:visible;">
                    ${(() => {
          const preloadUrl = epk.hook.ctaVideoUrl || epk.media.videoEmbedUrl || '';
          const preloadMuxId = extractMuxId(preloadUrl) || '';
          return `<mux-player id="epk-mux-player-static" playback-id="${preloadMuxId}" preload="auto" stream-type="on-demand" playsinline style="width:100%; height:100%; display:block; border-radius:8px; --poster: none;"></mux-player>`;
        })()}
                </div>

                <div id="epk-yt-player-wrap" style="display:none; position:relative; width:90vw; aspect-ratio:16/9; max-width:1200px; margin:0 auto">
                    <div style="position:absolute; inset:0; border-radius:8px; overflow:hidden">
                        <iframe id="epk-yt-iframe-static" src="" title="Featured Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute; inset:0; width:100%; height:100%; border:none; border-radius:8px"></iframe>
                    </div>
                </div>
                <div id="epk-sc-player-wrap" style="display:none; position:relative; width:100%; max-width:700px; margin:0 auto">
                    <div style="filter:grayscale(100%) contrast(1.1) brightness(0.85); transition:filter 0.6s ease; border-radius:8px; overflow:hidden">
                        <iframe id="epk-sc-iframe-static" src="" title="SoundCloud Player" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" sandbox="allow-scripts allow-same-origin allow-presentation allow-forms" loading="lazy" style="width:100%; border:none; height:380px; display:block; border-radius:8px"></iframe>
                    </div>
                    <div style="position:absolute; inset:0; pointer-events:none; border-radius:8px; background:radial-gradient(ellipse at 50% 0%, rgba(120,200,255,0.07) 0%, rgba(100,170,255,0.03) 55%, transparent 85%)"></div>
                </div>
            </div>
            <div id="epk-bottom-back-wrap">
                <button class="btn-glass" onclick="handleEpkBack()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                    BACK
                </button>
            </div>
        </div>
        <script>
        (function(){
            var overlay = document.getElementById('epk-burn-overlay');
            var ytWrap = document.getElementById('epk-yt-player-wrap');
            var scWrap = document.getElementById('epk-sc-player-wrap');
            var mxWrap = document.getElementById('epk-mux-player-wrap');
            var ytIframe = document.getElementById('epk-yt-iframe-static');
            var scIframe = document.getElementById('epk-sc-iframe-static');
            var muxPlayer = document.getElementById('epk-mux-player-static');
            var burnPhase = 'idle';

            window.openEpkPlayer = function(which, url, configStr) {
                if (burnPhase !== 'idle') return;
                var config = {};
                try { if(configStr) config = JSON.parse(configStr); } catch(e){}

                overlay.style.display = 'flex';
                overlay.className = 'epk-burn-overlay active epk-burning-in';
                burnPhase = 'burning-in';
                overlay.style.background = 'transparent';

                // Push history state
                window.history.pushState({ epkPlayer: true }, '');

                setTimeout(function() {
                    burnPhase = 'open';
                    overlay.className = 'epk-burn-overlay active epk-open';
                    overlay.style.background = 'rgba(4,4,6,0.97)';
                    
                    if (which === 'mux' || which === 'mx' || (url && /^[a-zA-Z0-9_-]{15,45}$/.test(url) && !url.includes('.'))) {
                        mxWrap.style.display = 'block';
                        ytWrap.style.display = 'none';
                        scWrap.style.display = 'none';
                        if (muxPlayer) {
                            var mux = config.mux || {};
                            
                            // Apply attributes
                            if (muxPlayer.getAttribute('playback-id') !== url) {
                                muxPlayer.setAttribute('playback-id', url);
                            }
                            if (mux.accentColor) muxPlayer.setAttribute('accent-color', mux.accentColor);
                            if (mux.primaryColor) muxPlayer.setAttribute('primary-color', mux.primaryColor);
                            if (mux.secondaryColor) muxPlayer.setAttribute('secondary-color', mux.secondaryColor);
                            if (mux.autoPlay === 'any' || mux.autoPlay === 'muted') muxPlayer.setAttribute('autoplay', mux.autoPlay);
                            else muxPlayer.removeAttribute('autoplay');
                            
                            if (mux.loop) muxPlayer.setAttribute('loop', ''); else muxPlayer.removeAttribute('loop');
                            if (mux.startTime) muxPlayer.setAttribute('start-time', mux.startTime);

                            // Apply CSS Variables for controls
                            var style = muxPlayer.style;
                            style.setProperty('--play-button', mux.showPlayButton === false ? 'none' : '');
                            style.setProperty('--seek-backward-button', mux.showSeekButtons === false ? 'none' : '');
                            style.setProperty('--seek-forward-button', mux.showSeekButtons === false ? 'none' : '');
                            style.setProperty('--mute-button', mux.showMuteButton === false ? 'none' : '');
                            style.setProperty('--captions-button', mux.showCaptionsButton === false ? 'none' : '');
                            style.setProperty('--fullscreen-button', mux.showFullscreenButton === false ? 'none' : '');
                            style.setProperty('--airplay-button', mux.showAirplayButton === false ? 'none' : '');
                            style.setProperty('--cast-button', mux.showCastButton === false ? 'none' : '');
                            style.setProperty('--playback-rate-button', mux.showPlaybackRateButton === false ? 'none' : '');
                            style.setProperty('--volume-range', mux.showVolumeRange === false ? 'none' : '');
                            style.setProperty('--time-range', mux.showTimeRange === false ? 'none' : '');
                            style.setProperty('--time-display', mux.showTimeDisplay === false ? 'none' : '');
                            style.setProperty('--duration-display', mux.showDurationDisplay === false ? 'none' : '');

                            // Apply responsive sizes and position
                            var isMobile = window.innerWidth < 768;
                            mxWrap.style.width = (isMobile ? mux.widthMobile : mux.widthDesktop) || '90vw';
                            mxWrap.style.aspectRatio = (isMobile ? mux.aspectRatioMobile : mux.aspectRatioDesktop) || '16/9';
                            mxWrap.style.transform = 'translateX(' + ((isMobile ? mux.xOffsetMobile : mux.xOffsetDesktop) || 0) + '%)';
                            
                            // Explicitly call play to start immediately without relying on attribute updates
                            try {
                                muxPlayer.play();
                            } catch(e) {}
                        }
                    } else if (which === 'yt') {
                        ytWrap.style.display = 'block';
                        scWrap.style.display = 'none';
                        if (mxWrap) mxWrap.style.display = 'none';
                        var yt = config.youtube || {};
                        var params = 'enablejsapi=1&autoplay=1';
                        if (yt.controls === false) params += '&controls=0';
                        if (yt.modestBranding) params += '&modestbranding=1';
                        ytIframe.src = url + (url.indexOf('?') > -1 ? '&' : '?') + params;
                    } else if (which === 'sc') {
                        ytWrap.style.display = 'none';
                        scWrap.style.display = 'block';
                        if (mxWrap) mxWrap.style.display = 'none';
                        var sc = config.soundcloud || {};
                        var scUrl = url.replace('show_teaser=true', 'show_teaser=false');
                        if (sc.color) scUrl = scUrl.replace(/color=%23[a-fA-F0-9]{6}/, 'color=' + encodeURIComponent(sc.color));
                        if (sc.showUser === false) scUrl = scUrl.replace('show_user=true', 'show_user=false');
                        if (sc.showComments === false) scUrl = scUrl.replace('show_comments=true', 'show_comments=false');
                        scIframe.src = scUrl + (scUrl.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1';
                    }
                }, 805);
            };

            window.closeEpkPlayerUI = function() {
                if (burnPhase === 'idle' || burnPhase === 'burning-out') return;
                burnPhase = 'burning-out';
                overlay.className = 'epk-burn-overlay active epk-burning-out';
                overlay.style.background = 'transparent';

                setTimeout(function() {
                    ytIframe.src = '';
                    scIframe.src = '';
                    if (muxPlayer) {
                        try {
                            muxPlayer.pause();
                            muxPlayer.currentTime = 0;
                        } catch(e) {}
                    }
                }, 250);

                setTimeout(function() {
                    burnPhase = 'idle';
                    overlay.className = 'epk-burn-overlay';
                    overlay.style.display = 'none';
                    ytWrap.style.display = 'none';
                    scWrap.style.display = 'none';
                    if (mxWrap) mxWrap.style.display = 'none';
                }, 700);
            };

            window.handleEpkBack = function() {
                closeEpkPlayerUI();
                if (window.history.state && window.history.state.epkPlayer) {
                    window.history.back();
                }
            };

            // postMessage listener for auto-close
            window.addEventListener('message', function(e){
                try {
                var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
                if (d && d.event === 'onStateChange') {
                    if (d.info === 0) { handleEpkBack(); }
                }
                if (d && (d.soundcloud === true || (typeof e.data === 'string' && e.data.indexOf('soundcloud') > -1))) {
                    if (d.method === 'finish') { handleEpkBack(); }
                }
                } catch(err){}
            });

            window.addEventListener('popstate', function() {
                closeEpkPlayerUI();
            });

            window.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && burnPhase === 'open') {
                    handleEpkBack();
                }
            });
        })();
        </script>
      `;
    }
  }

  const finalFooter = (page === 'contact' || page === 'epk') ? contactFooterHTML : footerHTML.replace('<section', `<section ${getBlurAttrs(s.footer.visuals)}`);

  // NEW GLOBAL FOOTER
  const globalFooterHTML = `
    <footer class="w-full bg-black py-16 flex flex-col items-center justify-center gap-8 border-t border-zinc-900/50">
        <div class="flex flex-nowrap justify-center gap-3 md:gap-8 items-center text-zinc-400">
            ${brandData.socials.youtubeUrl ? `<a href="${brandData.socials.youtubeUrl}" target="_blank" class="social-link" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9V3z" /></svg></a>` : ''}
            ${brandData.socials.instagramUrl ? `<a href="${brandData.socials.instagramUrl}" target="_blank" class="social-link" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg></a>` : ''}
            ${brandData.socials.spotifyUrl ? `<a href="${brandData.socials.spotifyUrl}" target="_blank" class="social-link" aria-label="Spotify"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14.5c2.5-1 5.5-1 8 0" /><path d="M7 11.5c3.5-1.5 7-1.5 10.5 0" /><path d="M6.5 8.5c3.5-2 7.5-2 11 0" /></svg></a>` : ''}
            ${brandData.socials.soundcloudUrl ? `<a href="${brandData.socials.soundcloudUrl}" target="_blank" class="social-link" aria-label="SoundCloud"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.39 12.01a3.01 3.01 0 0 0 0 6h1.22" /><path d="M12.91 18.01h6.63a3.46 3.46 0 0 0 0-6.92 3.39 3.39 0 0 0-2.5 1.1" /><path d="M8.22 18.01h2.46" /><path d="M8.22 11.51v6.5" /><path d="M10.68 10.51v7.5" /><path d="M5.61 12.01v6" /><path d="M12.91 8.01v10" /><path d="M15.37 11.01v7" /><path d="M3.1 14.01v2" /></svg></a>` : ''}
            ${brandData.socials.appleUrl ? `<a href="${brandData.socials.appleUrl}" target="_blank" class="social-link" aria-label="Apple Music"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg></a>` : ''}
            ${brandData.socials.xUrl ? `<a href="${brandData.socials.xUrl}" target="_blank" class="social-link" aria-label="X (Twitter)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l11.733 16H20L8.267 4z" /><path d="M4 20l6.768-6.768m2.46-2.46L20 4" /></svg></a>` : ''}
            ${brandData.socials.facebookUrl ? `<a href="${brandData.socials.facebookUrl}" target="_blank" class="social-link" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg></a>` : ''}
        </div>
        <div class="text-[10px] md:text-xs font-bold tracking-[0.3em] text-zinc-600 uppercase font-sans">
            Er det no' liv her..
        </div>
    </footer>`;

  // PERF: Preload Montserrat (critical font) so font-display:optional keeps it on first render
  const montserratPreloadUrl = `https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;700;800&display=optional`;

  const rawHTML = `<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${generateMetaTags(page, brandData)}
${generateJsonLd(page, brandData)}
<!-- PERF: DNS prefetch for all third-party origins -->
<link rel="dns-prefetch" href="//fonts.googleapis.com">
<link rel="dns-prefetch" href="//fonts.gstatic.com">
<link rel="dns-prefetch" href="//cdn.jsdelivr.net">
<link rel="dns-prefetch" href="//wsrv.nl">
<link rel="dns-prefetch" href="//image.mux.com">
<link rel="dns-prefetch" href="//stream.mux.com">
<!-- PERF: Preload Montserrat so font-display:optional doesn't drop it -->
<link rel="preload" href="${montserratPreloadUrl}" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${montserratPreloadUrl}"></noscript>
<!-- All other fonts (optional display — no layout shift) -->
<link rel="preload" href="${googleFontsUrl}" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${googleFontsUrl}"></noscript>
<style>${generateGlobalCSS(brandData)} @media(max-width:768px){.btn-text{display:none}.btn-glass::after{content:attr(data-mob)}}</style>
</head>
<body class="bg-black text-white kraakefot-site overflow-x-clip">
<div id="site-loader"><div class="loader-content"><div class="loader-spinner"></div><div class="loader-text">Loading</div></div></div>
${headerHTML}
<main id="main-content">
${mainContent}
${finalFooter}
</main>
${globalFooterHTML}

<!-- PERF: Mux scripts loaded lazily via IntersectionObserver in script.js -->
<!-- Do NOT load mux-player/mux-background-video here; script.js handles lazy injection -->

<!-- PERF: mux-background-video MUST be eager — it's in the hero (above fold).
     Late registration breaks ABR startup and degrades video quality.
     mux-player is still lazy-loaded (it's below fold in the live section). -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@mux/mux-background-video/html/+esm"></script>

<!-- PERF: defer ensures script runs after DOM is parsed, no render-blocking -->
<script defer src="script.js?v=${Date.now()}"></script>
</body>
</html>`;

  return contentOnly ? rawHTML : minifyHTML(rawHTML);
};

export const generateStaticHtml = (data: BrandState): string => generatePageHTML('home', data);
