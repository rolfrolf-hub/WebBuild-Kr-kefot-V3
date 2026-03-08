# Kr-kefot-V3 — Arkitekturplan

> Dette dokumentet beskriver den korrekte moderne arkitekturen for V3.
> Rotproblemet i V2 er identifisert og løst strukturelt — ikke lappet.

---

## Rotproblemet som løses

### V2-situasjonen (feil)

```
React-komponenter (src/components/*Section.tsx)
  → Rendres av Vite/React i nettleseren (editor-preview)

generator.ts (4722 linjer, manuell CSS)
  → Rendres som HTML-strenger (publisert HTML)

Resultat: To parallelle systemer som MÅ holdes manuelt i sync.
          Enhver ny CSS-klasse i builder krever manuell tillegg i
          generateGlobalCSS (~2077 linjer).
```

### V3-løsningen (riktig)

```
React-komponenter (src/components/*Section.tsx)
  → Rendres av React i nettleseren (editor-preview)       ← SAMME kode
  → Rendres av react-dom/server (publisert HTML)          ← SAMME kode

Resultat: Én kilde til sannhet. Parity er strukturelt garantert.
          Ingen manuell CSS-vedlikehold. Ingen to systemer å holde sync.
```

---

## Arkitektur: React SSR (Server-Side Rendering)

### Kjerneprinsipp

`react-dom/server.renderToStaticMarkup()` tar en React-komponent og returnerer en HTML-streng.
**Samme komponent, samme output — alltid.**

```typescript
// Dagens generator.ts (FEIL tilnærming):
function generateHeroHTML(data: HeroData): string {
  return `<section class="relative flex flex-col...">
    <h1 class="text-4xl...">${data.headline}</h1>
  </section>`;
}

// V3 SSR-tilnærming (RIKTIG):
import { renderToStaticMarkup } from 'react-dom/server';
import { HeroSection } from '../components/HeroSection';

function generateHeroHTML(brandData: BrandState): string {
  return renderToStaticMarkup(<HeroSection brandData={brandData} publishMode={true} />);
}
```

### generateGlobalCSS — beholdes, forenkles

`generateGlobalCSS` er IKKE redundant — den genererer dynamiske CSS-variabler basert på brukerens brand-innstillinger (farger, fonter etc.). Den MÅ beholdes. Men den kan reduseres fra ~2077 til ~200 linjer fordi:

- Tailwind-utilities: **SLETTES** — Tailwind håndterer disse via Vite-bygget
- CSS-variabler (`--accent`, `--hero-zoom` etc.): **BEHOLDES** — dynamiske, brukerbasert
- Custom CSS (glitch, animasjoner, keyframes): **BEHOLDES** — ikke Tailwind

### Tailwind-scanning i V3

Legg til `generator.ts` (eller det som erstatter den) i `tailwind.config.js`:

```javascript
content: [
  "./index.html",
  "./preview.html",
  "./src/**/*.{js,ts,jsx,tsx}",
  // Ingen generator.ts lenger — SSR bruker samme komponenter
],
```

CSS-en som genereres av Vite (`style.css`) inkluderes i den publiserte HTML via `<link>`.
`PublishModal.tsx` inkluderer allerede `style.css` som separat fil (linje 64 i V2) — dette er korrekt.

---

## Filstruktur V3

```
Kr-kefot-V3/
├── src/
│   ├── components/
│   │   ├── *Section.tsx          ← Brukes av BÅDE editor og SSR-renderer
│   │   └── PublishModalComponents/
│   │       ├── generator.ts      ← REDUSERT: kun koordinator + CSS-vars (~300 linjer)
│   │       ├── generator-css.ts  ← Custom CSS (glitch, animasjoner, variabler)
│   │       ├── generator-ssr.ts  ← NY: react-dom/server rendering
│   │       └── generator-meta.ts ← Sitemap, robots, htaccess
│   └── ...
├── ARCHITECTURE.md               ← Dette dokumentet
├── compare-with-v2.sh            ← Sammenlikner V3 mot V2
└── ...
```

---

## Multi-kunde-arkitektur

V3 er designet for **flere kunder**, ikke bare Kråkefot.

### Prinsipp

Hvert "prosjekt" er én `ProjectState`-instans (samme Zod-schema som i dag).
Kundeisolering skjer via `projectId` i state + separate `projectDefaults.json`-filer per kunde.

```typescript
// Fremtidig multi-kunde state-struktur (ikke implementert ennå):
interface MultiProjectState {
  activeProjectId: string;
  projects: Record<string, ProjectState>;
}
```

### Deployment

- Kunden laster ned ZIP (index.html + style.css + script.js + sitemap + robots + .htaccess)
- Alternativt: deploy direkte til kundens server via `deploy.php`-endepunkt
- Begge metodene beholdes fra V2

---

## Migrasjonsplan

### Fase 1 — React SSR-renderer (prioritet 1)

**Fil:** `src/components/PublishModalComponents/generator-ssr.ts`

1. Lag `generator-ssr.ts` med `renderPageToHTML(page, brandData)` som kaller `renderToStaticMarkup`
2. Legg til `publishMode` prop på alle `*Section.tsx` — skjuler editor-kontroller ved `publishMode=true`
3. Erstatt `generatePageHTML` i `generator.ts` med SSR-kall
4. Test: publisert HTML skal matche builder-preview piksel for piksel

**Risiko:** `*Section.tsx` bruker hooks og browser-API-er som ikke finnes i server-context.
**Løsning:** `publishMode`-prop disabler alt som ikke er relevant for statisk HTML.

### Fase 2 — Reduser generateGlobalCSS

Etter at Tailwind-scanning er konfigurert:
1. Slett alle Tailwind-utilities fra `generateGlobalCSS` (~1800 linjer)
2. Behold dynamiske CSS-variabler (~200 linjer)
3. Flytt custom CSS til `generator-css.ts`

### Fase 3 — PageSpeed-optimering

Forutsetter Fase 1 og 2:
1. `font-display: optional` + preload Cinzel
2. `defer` på script.js
3. `loading="lazy"` + eksplisitte dimensjoner på bilder
4. `fetchpriority="high"` på LCP-bilde (hero)

---

## Hva endres IKKE

- Zod-schema (`server/schema.ts`) — uendret
- `projectDefaults.json` — uendret
- Deploy-mekanismen (ZIP + deploy.php) — uendret
- MediaType-verdier — uendret
- UniversalMedia CSS-transformsystem — uendret (men nå delt mellom builder og SSR)

---

## Porter

| | Vite | API |
|---|---|---|
| **V2 (original)** | 3000 | 3005 |
| **V3 (dette prosjektet)** | 3010 | 3015 |

Begge kan kjøre samtidig uten konflikt.

---

## Kontrollspørsmål før implementering av Fase 1

1. Hvilke browser-API-er bruker `*Section.tsx`-komponentene? (`useRef`, `window`, `document` etc.)
2. Har alle seksjoner `props`-basert rendering, eller er noen avhengige av global state?
3. Skal `publishMode` skjule bare editor-kontroller, eller også animasjoner?

Disse spørsmålene besvares **før** kode skrives.
