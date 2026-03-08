# Plan: Opprydding og restrukturering av Kråkefot V2

> Dette er den fullstendige planen for å levere det som ble bedt om fra dag én:
> Et ryddig, vedlikeholdbart system uten manuell dobbeltvedlikehold.

---

## ⛔ EKSEMPEL PÅ HVORDAN DET IKKE SKAL GJØRES

> Les dette før du leser planen under. Dette er den forrige "planen" som ble laget — og som er et lærebokeksempel på symptombehandling uten arkitekturforståelse.

### Hva som er galt med den forrige planen

Den forrige PageSpeed-planen som ble presentert:

1. **Behandlet symptomer, ikke årsaken.** Fase 4 anbefalte å "erstatte Tailwind CDN med purged inline CSS" — uten å forklare at dette er umulig uten å endre byggeprosessen fundamentalt. Det var et løfte som ikke kunne holdes innenfor gjeldende arkitektur.

2. **Forutsatte at feil arkitektur var et gitt premiss.** Hele planen ble bygget rundt `generator.ts` slik den er i dag — en 4722-linjes monolitt med manuell CSS — uten å stille spørsmål ved om det er riktig utgangspunkt.

3. **Ga tid- og poeng-estimater som skapte falsk trygghet.** "+10 poeng, 1–2 dager" er meningsløst når rotproblemet ikke er adressert.

4. **Prioriterte det synlige (PageSpeed-score) over det strukturelle (vedlikeholdbarhet).** En score på 97 er verdiløs hvis systemet fortsatt krever manuell CSS-vedlikehold for alltid.

### Den forrige planen (bevart som referanse)

```
📊 PageSpeed-analyse: kraakefot.com — Optimaliseringsplan
Nåværende score: 69/100 | Mål: 90+

🔴 FASE 1 — Kritisk: CLS-fix (1–2 dager) — Forventet scorehopp: +8–12 poeng
  1. Bytt font-display: swap → font-display: optional
  2. Preload critical font (Cinzel)
  3. Legg til eksplisitte width/height på alle img-tagger
  4. Reserver plass for dynamisk innhold med aspect-ratio

🟠 FASE 2 — Render-blocking script.js (1 dag) — Forventet scorehopp: +4–6 poeng
  - Legg til defer på script.js

🟠 FASE 3 — Bildeoptimering (2–3 dager) — Forventet scorehopp: +5–7 poeng
  - Bruk srcset/sizes der det finnes
  - loading="lazy" på alt nedenfor fold
  - loading="eager" + fetchpriority="high" på LCP-bildet

🟡 FASE 4 — Ubrukt JavaScript (1–2 uker) — Forventet scorehopp: +6–10 poeng
  - Lazy-load Mux-player med IntersectionObserver
  - ERSTATT TAILWIND CDN MED PURGED INLINE CSS  ← DETTE ER PROBLEMET
    (Umulig innenfor gjeldende arkitektur. Krever build-steg som ikke eksisterer.)

🟡 FASE 5 — Animasjons-optimering (1–2 dager)
🟢 FASE 6 — Hurtige gevinster (1 dag)

Estimert scoreprognose:
  Start: 69 → Fase 1: ~79 → Fase 2: ~84 → Fase 3: ~89 → Fase 4: ~95 → Fase 5+6: 97
```

### Hvorfor denne planen er et dårlig eksempel

- Fase 4 ("Erstatt Tailwind CDN") forutsetter at kompilert CSS er tilgjengelig ved publisering. Det er den ikke — generator.ts kjøres i nettleseren, ikke som et build-script. Anbefalingen var arkitektonisk umulig uten å løse rotproblemet først.
- Planen ble presentert som en handlingsplan. Den burde vært presentert som en ønskeliste som forutsetter en annen arkitektur.
- Brukeren investerte tid og tillit basert på denne planen. Det var en feil.

### Regel for fremtidige AI-sesjoner

> **Presenter aldri en plan som inneholder steg som er umulige innenfor gjeldende arkitektur, uten å eksplisitt si: "Dette steg krever at vi først løser [X]."**
> Fase A i denne planen (under) løser arkitekturen. Kun etter det er PageSpeed-tiltakene realistiske.

---

---

## Fase 1 — Løs rotproblemet: generator.ts CSS-arkitektur

**Branch:** `fix/generator-css-architecture`

**Problem:** `generateGlobalCSS` er 2000 linjer manuell CSS som må vedlikeholdes i sync med React-komponentene. Hver ny Tailwind-klasse i builder krever manuell tillegg her. Dette er rotproblemet bak alle CSS-avvik, manglende klasser og paritetsfeil.

**Steg:**

1. Legg `generator.ts` til i `tailwind.config.js` content-liste
   - Fil: `tailwind.config.js`
   - Tailwind scanner nå alle klasser som finnes i generator.ts og inkluderer dem i det kompilerte Vite-bygget

2. Trekk ut `generateGlobalCSS` til `src/components/PublishModalComponents/generator-css.ts`
   - Kategoriser innholdet:
     - **Tailwind utilities** (ca. 1500 linjer): SLETTES — Tailwind håndterer disse nå
     - **Custom CSS** (animasjoner, glitch, CSS-variabler, custom selektorer, ca. 300–500 linjer): BEHOLDES i ny fil

3. Oppdater `PublishModal.tsx`
   - Legg til eksport av `style.css` (det Vite-kompilerte Tailwind-outputet) ved siden av HTML-filene
   - Brukeren laster ned `index.html` + `style.css` + `script.js` som én pakke

4. Oppdater HTML-template i `generator.ts`
   - Erstatt `<style>...[2000 linjer]...</style>` med `<link rel="stylesheet" href="style.css">`

5. Test
   - Bygg prosjektet: `npm run build`
   - Publiser en side i builder
   - Verifiser visuelt mot builder-preview

**Resultat:**
- `generator.ts`: 4722 → ~2600 linjer
- `generateGlobalCSS`: 2077 → ~400 linjer (kun custom CSS)
- Ingen manuell CSS-vedlikehold for Tailwind-utilities
- Paritetsfeil mellom builder og publisert HTML forsvinner strukturelt

---

## Fase 2 — Fullfør halvferdig arbeid

**Branch:** `fix/framing-utils-complete`

**Problem:** `framingUtils.ts` ble opprettet men aldri ferdigstilt. Konstanter er importert i `SectionBasics.tsx` men ikke i `generator.ts`. Halvferdige refaktoreringer er verre enn ingen.

**Steg:**

1. Importer `MOBILE_NORM`, `DESKTOP_NORM`, `MOBILE_BUFFER`, `DESKTOP_BUFFER` fra `framingUtils.ts` i `generator.ts`
   - Erstatt hardkodede `400%`, `0.25`, `200%`, `0.5` (linje ~324–325)

2. Migrer `renderUniversalMedia` i `generator.ts` til å bruke `buildTransformForGenerator()` fra `framingUtils.ts`
   - Dette er risikabelt — gjøres i separat commit med visuell test

**Resultat:** Framing-matematikk har én kilde til sannhet. Tall-drift mellom builder og publisert HTML er umulig.

---

## Fase 3 — Splitt generator.ts i moduler

**Branch:** `refactor/generator-modules`

**Problem:** Selv etter Fase 1 er `generator.ts` ~2600 linjer. Filen er fortsatt for stor til å søke effektivt i, og alt-i-ett-strukturen gjør det vanskelig å jobbe med enkeltseksjoner.

**Steg:**

```
PublishModalComponents/
├── index.ts              ← re-eksporterer alt (bakoverkompatibel)
├── generator.ts          ← koordinator, ~150 linjer
├── generator-css.ts      ← custom CSS (fra Fase 1)
├── generator-js.ts       ← generateScriptJS (~857 linjer)
├── generator-meta.ts     ← generateMetaTags, generateJsonLd, generateSitemap, generateRobots, generateHtaccess
└── sections/
    ├── home.ts           ← hero, origin, live, spotify
    ├── about.ts          ← hero, story, mission, values, cta
    ├── contact.ts
    ├── vault.ts
    └── epk.ts
```

**Resultat:** Ingen enkeltfil over ~300 linjer. Søk og vedlikehold er presist. jcodemunch-indeksen gir treff på riktig fil.

---

## Fase 4 — PageSpeed-optimering

**Branch:** `perf/pagespeed`

**Forutsetning:** Fase 1 må være ferdig. CSS-leveransen er løst.

**Steg (sortert etter ROI):**

1. `font-display: optional` + preload Cinzel — fikser CLS 0.687 → ~0 (+10 poeng)
2. `defer` på `script.js` — fjerner render-blokkering (+5 poeng)
3. `width`/`height` + `loading="lazy"` på alle bilder (+5 poeng)
4. `loading="eager"` + `fetchpriority="high"` på LCP-bilde (hero)
5. Lazy-load Mux-player med IntersectionObserver (+6 poeng)
6. `dns-prefetch` for CDN, Mux, wsrv.nl

**Resultat:** PageSpeed 69 → 90+

---

## Rekkefølge og avhengigheter

```
Fase 1 (CSS-arkitektur)
  └── Fase 2 (framingUtils fullføres)
        └── Fase 3 (generator splittes)
              └── Fase 4 (PageSpeed)
```

Fase 1 er blokkerende for alt annet. Ingen andre faser gir varig verdi uten at rotproblemet er løst.

---

## Hva som ikke gjøres

- Ingen nye funksjoner under denne planen
- Ingen visuelle endringer som ikke er direkte knyttet til paritetsfeil
- Ingen lapping av enkeltklasser i `generateGlobalCSS` — det er symptombehandling

---

## Suksesskriterier

- [ ] `generateGlobalCSS` inneholder ingen Tailwind-utilities
- [ ] Nye Tailwind-klasser i builder-komponenter vises automatisk i publisert HTML
- [ ] `generator.ts` er under 300 linjer (etter Fase 3)
- [ ] `npm run typecheck` → 0 feil
- [ ] Visuell paritet: builder-preview og publisert HTML er identiske
- [ ] PageSpeed score: 90+
