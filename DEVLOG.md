# Kråkefot V3 — Development Log

> Kronologisk logg over alle endringer. Oppdateres ved hver sesjon.
> **Dette dokumentet leses automatisk ved oppstart av hver AI-sesjon.**
> **V3-porter: Vite 3010, API 3015**

---

## 🟢 NÅVÆRENDE TILSTAND (per 2026-03-11) — oppdatert pagespeed-branch

### PageSpeed-fikser (branch: pagespeed)
| Hva | Fil | Rollback |
|---|---|---|
| Ny felt `heroImageUrl` (optional) i `HomeHeroSchema` | `server/schema.ts:163` | Fjern linjen |
| `heroImageUrl: ""` lagt til i projectDefaults.json | `src/data/projectDefaults.json` | Fjern linjen |
| Cover image-lag (z-10) over video i `HeroSection.tsx` | `HeroSection.tsx:85-120` | Fjern `<div class="hero-cover-overlay...">` blokken |
| "Cover Image" kontroll lagt til i Hero Content-tab | `HeroSection.tsx` | Fjern den andre `MediaEditControl` |
| Cover image-lag i `generator.ts` (publisert HTML) | `generator.ts:1822-1830` | Fjern `${hHero.heroImageUrl ? ...}` blokken |
| Hero preload-tag fikset: `as="video"` → `as="image"` med prioriteringskjede | `generator.ts:27-42` | Tilbake til gammel `isHeroVideo` logikk |
| `site-loader` overlay fjernet fra HTML | `generator.ts:2615` | Legg tilbake `<div id="site-loader">...` |
| `hideLoader()` funksjon og kall fjernet fra script.js | `generator.ts:555-573` | Legg tilbake hele hideLoader-blokken |
| `Date.now()` → FNV-1a content hash for script.js cache-busting | `generator.ts:1302-1320, 2617` | Bytt tilbake til `${Date.now()}` |
| `<link rel="preload" href="style.css" as="style">` lagt til | `generator.ts:2611` | Fjern preload-linjen |

---

## 🟢 NÅVÆRENDE TILSTAND (per 2026-03-11)

**Stack:** React 19, Vite 7, Tailwind v4, TypeScript strict, Express API
**Arkitektur:** React SSR — `renderToStaticMarkup()` erstatter generator.ts-monolitten
**Status:** Fase 0–4 fullført. SSR-arkitekturen er på plass.

### Hva som er gjort i V3 (oppsummert)
| Fase | Commit | Hva |
|---|---|---|
| Fase 0 | `bcdd7b7` | Stack-oppgradering: React 19, Vite 7, Tailwind v4 |
| Fase 1 | `7b7b91f` | `publishMode`-prop på alle `*Section.tsx` + InlineText |
| Fase 2 | `9759601` | SSR-renderer: `src/publish/ssr.ts` |
| Fase 3 | `ae7e9a6` | SSR-kobling + slettet `generateGlobalCSS` (−2071 linjer) |
| Fase 4 | `b42e47d` | PageSpeed-optimering i UniversalMedia (publish mode) |
| — | `08924b8` | Vault-siden slettet |
| — | `d1be440` | v3-testside publisert |
| — | `69cdb41` | Link-oppdateringer |

### Kritiske filer (nåværende state)
| Fil | Status | Merknad |
|---|---|---|
| `src/publish/ssr.ts` | ✅ Aktiv | SSR-renderer — erstatter generator.ts sin HTML-generator |
| `src/components/PublishModalComponents/generator.ts` | ✅ Aktiv (redusert) | Uten generateGlobalCSS — CSS håndteres av Tailwind |
| `src/utils/framingUtils.ts` | ✅ Aktiv | Delte framing-konstanter (MOBILE_NORM, DESKTOP_NORM, etc.) |
| `server/schema.ts` | ✅ Aktiv | Eneste kilde til typer (Zod) |
| `src/data/projectDefaults.json` | ✅ Aktiv | Standard prosjektdata |

### Kjente utestående oppgaver
- `framingUtils.ts` Trinn 2/3 i `generator.ts` ikke fullført: hardkodede verdier (`400%`, `0.25`, `200%`, `0.5`) gjenstår i generator
- PageSpeed-test etter SSR-migrering er ikke gjennomført

---

## 📋 ENDRINGSLOGG

---

### [2026-03-11] Dokumentasjonsoppdatering: branch-policy og panic mode

**Branch:** `docs/branch-policy`

**Hva:** Oppdatert alle prosjektdokumenter med nye absolutte regler.

**Nye regler innført:**
1. **Alltid branch — aldri main.** Spør alltid bruker hvilken branch ved sesjonstart.
2. **`git reset --hard` er absolutt forbudt.** Bruk `git revert`, `git checkout <hash> -- <fil>`, `git stash`.
3. **Panic mode:** Ved krasj/uventet tilstand — stopp, beskriv, still kontrollspørsmål, vent på bruker.
4. **jcodemunch** indeksert og integrert som primær søkemetode (89 filer, 467 symboler).

**Filer endret:**
- `CLAUDE.md`: Oppdatert tittel, porter, filstier, lagt til regler 9+10, rollback revidert, jcodemunch-seksjon
- `# KRAAKEFOT V3 TEKNISK OPERASJONSPROTOKOLL.md`: Fullstendig revidert
- `# AGENT-INSTRUKSER OPERASJONELLE RAMMER.md`: Branch-kontroll og panic mode lagt til
- `DEVLOG.md`: Omskrevet til å reflektere nåværende V3-tilstand

**Ny fil:** `OVERSIKT.md` — tydelig prosjektoversikt (git-regler, arkitektur, sjekklister)

**Rollback:** `git revert` commits i `docs/branch-policy` for å angre dokumentasjonsendringer.

---

### [2026-03-11] Branch-synkronisering og fiks av backup-stier

**Branch:** `main` (hotfix)

**Problem:** `push.sh` og `auto_backup.sh` var hardkodet til `main`-branchen. `auto_backup.sh` pekte på V2-mappen.

**Løsning:**
1. `push.sh` og `auto_backup.sh`: `git push origin main` → `git push origin HEAD`
2. `auto_backup.sh`: `PROJECT_DIR` og `backup_dir` oppdatert til `/Users/rolf-olavringkjob/Desktop/Kr-kefot-V3`

**Filer endret:** `push.sh`, `auto_backup.sh`

**Rollback:** Sett `git push origin HEAD` tilbake til `git push origin main`. Reverter stier til V2-Unified.

---

### [2026-03-09] V3 Fase 0–4: SSR-arkitektur implementert

**Branch:** `main` (direkte — før branch-policy)

**Hva:** Full implementering av React SSR-arkitekturen fra ARCHITECTURE.md.

**Fase 0 — Stack-oppgradering** (`bcdd7b7`)
- React 18 → React 19
- Vite 5 → Vite 7
- Tailwind v3 → Tailwind v4

**Fase 1 — publishMode-prop** (`7b7b91f`)
- Alle `*Section.tsx`-komponenter fikk `publishMode: boolean`-prop
- `InlineText`-komponent oppdatert

**Fase 2 — SSR-renderer** (`9759601`)
- Ny fil: `src/publish/ssr.ts`
- `renderToStaticMarkup()` fra React DOM server

**Fase 3 — SSR-kobling og CSS-rydding** (`ae7e9a6`)
- SSR-renderer koblet til PublishModal
- `generateGlobalCSS` slettet (−2071 linjer)
- CSS håndteres nå av Tailwind (scanner komponentene)

**Fase 4 — PageSpeed-optimering** (`b42e47d`)
- UniversalMedia optimert for publish mode
- Lazy-loading og srcset i generert HTML

**Rollback:** `git checkout bcdd7b7~1 -- <fil>` for å hente V2-versjoner av enkeltfiler.

---

### [2026-03-09] V3-oppstart: Klonet fra V2, separate porter

**Branch:** `main`

**Hva:** `Kr-kefot-V2-Unified` klonet til `Kr-kefot-V3` med separate porter.

**Porter-endringer:**
- Vite: 3000 → 3010
- API: 3005 → 3015

**Filer endret:** `vite.config.ts`, `server/index.ts`, `package.json`, `.env`, `ServerMediaBrowser.tsx`, `HealthStatus.tsx`, `GlobalSaveButton.tsx`

**Nye filer:** `compare-with-v2.sh`, `ARCHITECTURE.md`

**Status ved oppstart:** TypeScript 0 feil, datafiler identiske med V2 (38798 bytes)
