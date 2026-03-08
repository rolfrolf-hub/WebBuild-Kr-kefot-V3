# Kr-kefot V3 — Definitiv Arkitekturplan

> **Dette er den autoritative planen. Alt her er basert på grundig analyse av V2-koden,
> fire dager med feilrådgivning som er dokumentert, og kravene som er stilt:
> PageSpeed 100, visuelt magisk, vedlikeholdbart, fremtidsrettet — uten unntak.**

---

## Del 1: Diagnose — Hva er faktisk galt i V2

### Tallene

| Komponent | Linjer | Problem |
|---|---|---|
| `generator.ts` totalt | 4 722 | Monolitt — uleselig, usøkbar |
| `generateGlobalCSS` | 2 076 | Manuell kopi av Tailwind — må vedlikeholdes for hånd |
| `generateCSSVariableOverrides` | 280 | OK — dynamisk, kan beholdes |
| `generateScriptJS` | 858 | Kan splittes ut |
| `generatePageHTML` | 1 339 | Skal erstattes av SSR |

### Rotproblemet (ikke symptomene)

Tailwind kan ikke scanne dynamisk genererte HTML-strenger. Derfor finnes
`generateGlobalCSS` — en manuell speiling av alle Tailwind-klasser brukt i
generert HTML. Enhver ny visuell funksjon i builder = manuell CSS-oppdatering.
Enhver CSS-klasse som mangler = visuell avvik mellom editor og publisert side.

**Konsekvenser:**
- Paritetsfeil mellom builder-preview og publisert HTML
- Teknisk gjeld som vokser eksponensielt med nye funksjoner
- PageSpeed blokkert fordi CSS ikke kan renses automatisk

### Hva som er OK i V2 og beholdes

- `server/schema.ts` — Zod-schema, eneste kilde til sannhet ✅
- `projectDefaults.json` — standarddata, uendret ✅
- `src/data/`, `src/hooks/`, `src/utils/` — beholdes i stor grad ✅
- Deploy-mekanisme (ZIP + deploy.php) — beholdes ✅
- `UniversalMedia` CSS-transformsystem — beholdes ✅
- Mux-videointegrering — beholdes ✅
- Express API — beholdes ✅

---

## Del 2: Den nye arkitekturen

### Kjernebeslutning: React SSR

**Én kodebase. Én render-funksjon. Null manuell CSS.**

```
BUILDER (editor-modus):
React-komponenter → rendres i nettleseren (Vite/React)

PUBLISERT HTML:
Samme React-komponenter → renderToStaticMarkup() → HTML-streng

RESULT: 100% parity per definisjon. Umulig å ha avvik.
```

### Stackoppgradering — Alle til siste versjon

Nåværende versjoner vs. det som skal brukes:

| Pakke | V2 | V3 | Begrunnelse |
|---|---|---|---|
| React | 18.2.0 | **19.2.4** | Bedre SSR, concurrent, compiler |
| react-dom | 18.2.0 | **19.2.4** | Inkl. `renderToStaticMarkup` |
| Vite | 5.4.21 | **7.3.1** | Raskere builds, bedre chunking |
| @vitejs/plugin-react | 4.x | **5.1.4** | React 19 support + React Compiler |
| Tailwind CSS | 3.4.0 | **4.2.1** | CSS-first config, container queries innebygd, 10x raskere |
| TypeScript | 5.9.3 | 5.9.3 | Allerede siste |

### Tailwind v4 — hva endres

Tailwind v4 er en full omskriving. Nøkkelendringer:

```css
/* V3: tailwind.config.js SLETTES — konfigureres i CSS */
/* src/style.css */
@import "tailwindcss";

@theme {
  --font-sans: 'Montserrat', sans-serif;
  --font-serif: 'Montserrat', sans-serif;
  --color-accent: var(--accent);
}
```

Fordeler for oss:
- Container queries innebygd (`@container`, `@sm:`, `@md:`, `@lg:`) — fungerer i generert HTML
- CSS-variables natively i Tailwind — bedre integrasjon med dynamiske brand-variabler
- `@apply` og utilities fungerer i generert HTML via `style.css`-filen

### SSR-flyten

```
publisering:
1. Bruker klikker "Publish" i editor
2. PublishModal kaller renderPage('home', brandData)
3. renderPage() kaller renderToStaticMarkup(<HomePage brandData={...} mode="publish" />)
4. Samme React-komponenter som vises i editor — men uten editor-kontroller
5. Output: ren HTML-streng
6. Legges i ZIP med style.css (Vite-output), script.js, css-vars.css
```

---

## Del 3: Ny filstruktur

```
Kr-kefot-V3/
│
├── src/
│   ├── components/
│   │   │
│   │   ├── sections/               ← RENT VISUELLE komponenter
│   │   │   ├── HeroSection.tsx         Støtter mode='edit'|'publish'
│   │   │   ├── OriginSection.tsx
│   │   │   ├── LiveSection.tsx
│   │   │   ├── MediaGallerySection.tsx
│   │   │   ├── AboutHeroSection.tsx
│   │   │   ├── AboutStorySection.tsx
│   │   │   ├── AboutMissionSection.tsx
│   │   │   ├── ContactSection.tsx
│   │   │   └── FooterSection.tsx
│   │   │
│   │   ├── controls/               ← Editor-kontroller (aldri i publisert HTML)
│   │   │   ├── FloatingControlPanel.tsx
│   │   │   ├── AtomicLayoutControl.tsx
│   │   │   └── sections/
│   │   │       ├── HeroControls.tsx
│   │   │       └── ...
│   │   │
│   │   ├── SectionBasics.tsx       ← UniversalMedia (uendret)
│   │   ├── InlineText.tsx          ← Vises kun i edit-mode
│   │   ├── MediaCard.tsx
│   │   └── ...
│   │
│   ├── publish/                    ← NY MAPPE — alt som handler om publisering
│   │   ├── ssr.ts                      renderPage() med react-dom/server
│   │   ├── css-vars.ts                 Dynamiske CSS-variabler per brand
│   │   ├── script.ts                   Runtime JS (scroll, parallax, Mux)
│   │   └── meta.ts                     MetaTags, JSON-LD, sitemap, robots
│   │
│   ├── publish-modal/              ← Publiseringsgrensesnitt
│   │   ├── PublishModal.tsx
│   │   ├── DownloadTab.tsx
│   │   ├── DeployTab.tsx
│   │   └── TabNavigation.tsx
│   │
│   ├── data/
│   │   └── projectDefaults.json    ← Uendret
│   │
│   ├── hooks/
│   │   └── useScrollBlur.ts        ← Uendret (ikke kalt i publish-mode)
│   │
│   ├── utils/
│   │   ├── mediaHelpers.ts         ← Uendret
│   │   ├── mediaProcessing.ts      ← Uendret
│   │   ├── framingUtils.ts         ← Uendret
│   │   └── styleHelpers.ts         ← Uendret
│   │
│   ├── style.css                   ← Tailwind v4 base + custom animations
│   └── types.ts                    ← Re-eksporterer fra server/schema.ts
│
├── server/
│   └── schema.ts                   ← UENDRET — eneste kilde til sannhet
│
├── .githooks/
│   └── pre-commit                  ← Versjonskontrollert
│
├── ARCHITECTURE.md                 ← Dette dokumentet
├── CLAUDE.md
├── DEVLOG.md
└── push.sh
```

---

## Del 4: `mode` prop-mønsteret

Alle `*Section.tsx` komponenter får én ny prop:

```typescript
type RenderMode = 'edit' | 'publish';

interface HeroSectionProps {
    brandData: BrandState;
    onUpdate?: (newData: Partial<BrandState>) => void; // Valgfri — ikke nødvendig i publish
    scrollY?: number;
    mode?: RenderMode;  // Default: 'edit'
}

export const HeroSection: React.FC<HeroSectionProps> = ({
    brandData,
    onUpdate = () => {},
    scrollY = 0,
    mode = 'edit',
}) => {
    const isPublish = mode === 'publish';

    // Hooks: bare kall browser-avhengige hooks i edit-mode
    const blurRef = React.useRef<HTMLDivElement>(null);
    const { ref } = isPublish
        ? { ref: blurRef }  // Enkel ref — ingen scroll-lytter
        : useScrollBlur({ ... });

    return (
        <section className="...">
            {/* Bakgrunnsmedia — alltid med */}
            <UniversalMedia ... />

            {/* Editor-kontroller — KUN i edit-mode */}
            {!isPublish && (
                <FloatingControlPanel title="Hero Section">
                    {/* ... */}
                </FloatingControlPanel>
            )}

            {/* Innhold — alltid med */}
            <h1>{data.headline}</h1>
            <p>{data.subheadline}</p>
        </section>
    );
};
```

**InlineText i publish-mode**: Rendres som enkel HTML-tag uten editor-funksjonalitet:
```typescript
// InlineText.tsx
const InlineText = ({ tagName: Tag, value, mode, ... }) => {
    if (mode === 'publish') {
        return <Tag className={className}>{value}</Tag>;
    }
    // ... full editor-logikk
};
```

---

## Del 5: SSR-rendereren

```typescript
// src/publish/ssr.ts
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { BrandState } from '../types';
import { HeroSection } from '../components/sections/HeroSection';
import { OriginSection } from '../components/sections/OriginSection';
// ... alle seksjon-imports

import { generateMetaTags } from './meta';
import { generateCSSVars } from './css-vars';
import { generateScriptJS } from './script';

export type PageKey = 'home' | 'about' | 'contact' | 'vault' | 'epk';

function renderHomePage(brandData: BrandState): string {
    return renderToStaticMarkup(
        React.createElement(React.Fragment, null,
            React.createElement(HeroSection, { brandData, mode: 'publish' }),
            React.createElement(OriginSection, { brandData, mode: 'publish' }),
            React.createElement(LiveSection, { brandData, mode: 'publish' }),
            React.createElement(MediaGallerySection, { brandData, mode: 'publish' }),
            React.createElement(FooterSection, { brandData, mode: 'publish' }),
        )
    );
}

export function renderPage(page: PageKey, brandData: BrandState): string {
    const bodyContent = {
        home: () => renderHomePage(brandData),
        about: () => renderAboutPage(brandData),
        contact: () => renderContactPage(brandData),
        vault: () => renderVaultPage(brandData),
        epk: () => renderEpkPage(brandData),
    }[page]?.() ?? '';

    const cssVars = generateCSSVars(brandData);
    const metaTags = generateMetaTags(page, brandData);

    return `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${metaTags}
  <link rel="stylesheet" href="style.css">
  <style>${cssVars}</style>
</head>
<body>
  ${bodyContent}
  <script src="script.js" defer></script>
</body>
</html>`;
}
```

---

## Del 6: `generateGlobalCSS` → `css-vars.ts`

Den ENESTE CSS som fortsatt genereres dynamisk er CSS-variabler basert på brand-data.
All Tailwind håndteres av `style.css` (Vite-output).

```typescript
// src/publish/css-vars.ts — ~200 linjer (ned fra 2076)
export function generateCSSVars(brandData: BrandState): string {
    const { accentColor, sections } = brandData;
    const hero = sections.home.hero;

    return `
    :root {
        --accent: ${accentColor};
        --accent-rgb: ${hexToRgb(accentColor)};

        /* Hero framing */
        --hero-zoom: ${hero.framing?.zoomDesktop ?? 1};
        --hero-x: ${hero.framing?.xOffsetDesktop ?? 0}%;
        --hero-y: ${hero.framing?.yOffsetDesktop ?? 0}%;

        /* Visuals */
        --hero-sat: ${hero.visuals?.saturation ?? 100}%;
        --hero-dim: ${(hero.visuals?.dim ?? 0) / 100};
        --hero-para: ${hero.visuals?.parallax ?? 0};
        --hero-op: ${(hero.visuals?.opacity ?? 100) / 100};

        /* ... alle andre seksjoner ... */
    }

    @media (max-width: 768px) {
        :root {
            --hero-zoom: ${hero.framing?.zoomMobile ?? 1};
            /* ... mobile overrides ... */
        }
    }

    /* Custom animations (glitch, etc.) — beholdes her */
    ${CUSTOM_ANIMATIONS}
    `;
}
```

---

## Del 7: PageSpeed 100 — Konkrete tiltak

### Kritisk path

```html
<head>
  <!-- 1. Preload kritisk font -->
  <link rel="preload" as="font" href="..." crossorigin>
  <link rel="preconnect" href="https://fonts.googleapis.com">

  <!-- 2. Purget Tailwind CSS (bare klasser som er i bruk) -->
  <link rel="stylesheet" href="style.css">

  <!-- 3. Dynamiske CSS-variabler (brand-spesifikke, inline) -->
  <style>/* :root { --accent: #2f9b9d; ... } */</style>

  <!-- 4. DNS-prefetch for eksterne ressurser -->
  <link rel="dns-prefetch" href="https://stream.mux.com">
  <link rel="dns-prefetch" href="https://wsrv.nl">
</head>
<body>
  <!-- 5. Hero: LCP-optimert -->
  <img src="hero.webp" fetchpriority="high" loading="eager" width="1920" height="1080" alt="">

  <!-- 6. Under fold: lazy loading -->
  <img src="below-fold.webp" loading="lazy" width="800" height="600" alt="">

  <!-- 7. Mux-video: lazy via IntersectionObserver -->
  <div data-mux-player data-playback-id="..."></div>

  <!-- 8. Script: defer (aldri blokkerende) -->
  <script src="script.js" defer></script>
</body>
```

### Spesifikke optimaliseringer

| Tiltak | Effekt | Implementering |
|---|---|---|
| Tailwind v4 purging | −150KB CSS | Automatisk med SSR |
| `font-display: optional` | CLS: 0.687 → ~0 | `style.css` |
| Preload kritisk font | LCP −200ms | `<head>` i SSR-template |
| `defer` på script.js | Render-blokkering fjernet | SSR-template |
| `loading="lazy"` på bilder | TTI forbedret | SSR-renderer |
| Eksplisitt `width`/`height` | CLS → 0 | Alle `<img>` tagger |
| Mux IntersectionObserver | JS-payload −30KB | script.ts |
| `fetchpriority="high"` på hero | LCP −300ms | SSR hero-renderer |
| WebP/AVIF srcset | Bildesize −60% | MediaHelpers + SSR |

**Forventet resultat: PageSpeed 95+ desktop, 85+ mobil**
(For 100/100: hosting og server-responstid må også optimeres)

---

## Del 8: Multi-kunde støtte

Schema-endring (minimal, non-breaking):

```typescript
// server/schema.ts — tillegg
const ProjectStateSchema = z.object({
    // ... eksisterende felt ...
    projectId: z.string().optional(),         // NY
    projectName: z.string().optional(),       // NY (display-navn)
    customerSlug: z.string().optional(),      // NY (for filnavn: kraakefot/)
});
```

Filstruktur for multi-kunde:
```
src/data/
├── projectDefaults.json          ← Standard (Kråkefot)
└── customers/                    ← Fremtidig — én fil per kunde
    ├── kraakefot.json
    └── [neste-kunde].json
```

---

## Del 9: Migrasjonsplan — Sekvens og avhengigheter

```
Fase 0: Forberedelse
  └── Installer nye avhengigheter (React 19, Tailwind v4, Vite 7)
        └── Fase 1: Tailwind v4 konfigurasjon
              └── Fase 2: mode-prop på alle seksjoner
                    └── Fase 3: SSR-renderer (ssr.ts)
                          └── Fase 4: generator.ts reduksjon
                                └── Fase 5: PageSpeed-optimering
                                      └── Fase 6: Multi-kunde
```

### Fase 0: Avhengigheter (1 sesjon)

```bash
# React 19
npm install react@19 react-dom@19 @types/react@19 @types/react-dom@19

# Vite 7 + plugin
npm install -D vite@7 @vitejs/plugin-react@5

# Tailwind v4
npm install -D tailwindcss@4 @tailwindcss/vite
```

Tailwind v4 bruker Vite-plugin i stedet for PostCSS:
```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
plugins: [react(), tailwindcss()],
```

```css
/* src/style.css — erstatter tailwind.config.js */
@import "tailwindcss";
@theme {
  --font-sans: 'Montserrat', sans-serif;
}
/* Custom CSS (glitch, animasjoner) beholdes her */
```

### Fase 1: mode-prop på seksjoner (1-2 sesjoner)

For hver `*Section.tsx`:
1. Legg til `mode?: 'edit' | 'publish'` i props interface
2. Wrap `FloatingControlPanel` og `InlineText`-editor-logikk i `{mode !== 'publish' && ...}`
3. Wrap browser-avhengige hooks: `const hook = mode === 'publish' ? noop : useHook()`

Rekkefølge (enkleste til vanskeligste):
1. `FooterSection.tsx` — minimal editor-logikk
2. `ContactSection.tsx`
3. `OriginSection.tsx`
4. `HeroSection.tsx`
5. `LiveSection.tsx` — mest kompleks (direkte DOM-kontroll)
6. `MediaGallerySection.tsx`
7. `AboutHeroSection.tsx`
8. `AboutStorySection.tsx`
9. `AboutMissionSection.tsx`

### Fase 2: SSR-renderer (1 sesjon)

1. Opprett `src/publish/ssr.ts`
2. Opprett `src/publish/css-vars.ts` (trekk ut fra generateGlobalCSS)
3. Opprett `src/publish/meta.ts` (trekk ut generateMetaTags, generateJsonLd, etc.)
4. Opprett `src/publish/script.ts` (trekk ut generateScriptJS)
5. Oppdater `PublishModal.tsx` til å bruke `renderPage()` fra ssr.ts

### Fase 3: generator.ts reduksjon (1 sesjon)

Etter at ssr.ts fungerer og er testet:
1. Erstatt `generatePageHTML` med thin wrapper til `renderPage()`
2. Slett `generateGlobalCSS` (~2076 linjer) — Tailwind håndterer dette nå
3. Slett `generateCSSVariableOverrides` (280 linjer) — erstattet av css-vars.ts

Resultat: generator.ts → ~200 linjer (bare koordinator og evt. overgangslogikk)

### Fase 4: PageSpeed (1 sesjon)

1. Oppdater SSR-template med alle tiltak fra Del 7
2. Fikse font-loading i style.css
3. Legg til IntersectionObserver for Mux i script.ts
4. Test med Lighthouse og PageSpeed Insights

---

## Del 10: Suksesskriterier — IKKE FERDIG FØR DETTE ER GRØNT

```
□ npm run typecheck → 0 feil
□ generator.ts < 250 linjer
□ css-vars.ts < 250 linjer (bare dynamiske variabler og custom CSS)
□ src/publish/ eksisterer og har: ssr.ts, css-vars.ts, meta.ts, script.ts
□ Alle *Section.tsx har mode?: 'edit' | 'publish' prop
□ Visuell paritet: side ved side i browser — editor og publisert HTML er identiske
□ PageSpeed desktop: 90+
□ PageSpeed mobil: 80+
□ Ingen manuell CSS-vedlikehold nødvendig for nye Tailwind-klasser
□ Multi-kunde: projectId i schema (Fase 6 — siste)
□ git log viser forståelige commit-meldinger
□ ./push.sh funksjonerer uten feil
```

---

## Del 11: Regler for alle fremtidige AI-sesjoner i V3

1. **Les denne filen ved oppstart** — spesielt Del 9 (fase-rekkefølge)
2. **Aldri lappe generator.ts** — den skal fjernes, ikke lappes
3. **Aldri legge til CSS i generateGlobalCSS** — den eksisterer ikke i V3
4. **publishMode = mode === 'publish'** — IKKE editor-props til SSR
5. **Test visuell paritet** etter enhver seksjonsendring
6. **Spør kontrollspørsmål** før implementering (se CLAUDE.md)
7. **Push til GitHub** etter hver godkjente fase (`./push.sh`)

---

*Sist oppdatert: 2026-03-09*
*Basert på grundig analyse av V2-kodebasen (4722-linjes generator.ts, 14 seksjonskomponenter)*
*Alle feil fra tidligere sesjoner er dokumentert i CLAUDE.md og DEVLOG.md*
