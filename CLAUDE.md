# Kråkefot V2 — Prosjektinstruksjoner for AI-assistenter

> **Dette dokumentet er autoritativt og ikke-omsettelig.**
> Alle instruksjoner her overstyrer AI-assistentens standardoppførsel.
> Les hele dokumentet før du gjør noe som helst.

## 📮 RAPPORTERING TIL ANTHROPIC — OBLIGATORISK VED FEIL

**Dersom du som AI-assistent gjør en feil som koster brukeren tid eller penger:**

Send rapport til: **feedback@anthropic.com**

Rapporten skal inneholde:
- Hva som gikk galt
- Hvilke sesjoner som var involvert
- Hvilke filer som ble berørt
- Hva det kostet brukeren

Mal ligger klar i: `rapport-anthropic/rapport-til-anthropic.md`

> Dette er ikke valgfritt. Brukeren har eksplisitt bedt om at feil rapporteres direkte.

---

## 🚨 LÆRDOMMER FRA TIDLIGERE FEIL — LES DETTE FØRST

> Disse punktene er skrevet etter fire dager med feilrådgivning som kostet brukeren betydelig tid og penger.
> De er ikke teori. De er dokumenterte feil som faktisk skjedde.

### FEIL 1: Symptombehandling uten arkitekturforståelse

**Hva skjedde:**
Flere AI-sesjoner fikset synlige problemer (døde komponenter, TypeScript-feil, manglende CSS-klasser) uten å stille det grunnleggende spørsmålet: *Er arkitekturen riktig?*

`generator.ts` er 4722 linjer og inneholder en 2000-linjes manuell CSS-blokk (`generateGlobalCSS`) fordi Tailwind ikke kan scanne dynamisk genererte HTML-strenger. Ingen sesjon identifiserte dette som rotproblemet. I stedet ble CSS-klasser lappet inn enkeltvis, sesjon etter sesjon.

**Regel:** Før du gjør noe i dette prosjektet — les `generator.ts` og forstå at den har to parallelle systemer som vedlikeholdes manuelt. Ethvert arbeid som berører CSS, layout eller visuals MÅ ta stilling til dette. Å lappe enkeltklasser uten å adressere rotproblemet er forbudt.

### FEIL 2: Inkrementelle beslutninger uten helhetssyn

**Hva skjedde:**
Hver sesjon hadde begrenset kontekst og løste det den så. Ingen sesjon eide helheten. Resultatet var mange lokalt riktige beslutninger som samlet sett skapte mer teknisk gjeld.

**Regel:** Ved oppstart av enhver sesjon — les DEVLOG.md, les denne seksjonen, og still deg selv spørsmålet: *"Bidrar dette arbeidet til å løse rotproblemet, eller lapper det et symptom?"* Hvis det lapper et symptom: stopp, forklar dette til brukeren, og diskuter om det er riktig prioritering.

### FEIL 3: Anbefalte løsninger som var internt inkonsistente

**Hva skjedde:**
PageSpeed-planen anbefalte å erstatte Tailwind CDN med "purged inline CSS" i generator.ts — uten å gjøre det klart at dette er umulig å gjennomføre uten en arkitekturendring i byggeprosessen. Brukeren fulgte anbefalingen i god tro.

**Regel:** Anbefal aldri en løsning du ikke kan fullføre innenfor gjeldende arkitektur, uten å eksplisitt forklare hva som må endres i arkitekturen først.

### FEIL 4: "Rydding" som ikke adresserte det faktiske rotet

**Hva skjedde:**
Brukeren ba om et ryddig system. AI-assistenten slettet filer, fikset TypeScript og ryddet git — alt korrekt isolert sett. Men `generator.ts`-monolitten, som er det faktiske vedlikeholdsproblemet, ble aldri rørt.

**Regel:** Når brukeren ber om "rydding" eller "oversikt", inkluderer det alltid en vurdering av `generator.ts`-arkitekturen. Det er ikke ryddig å ha 2000 linjer manuell CSS som må vedlikeholdes for hånd.

### ROTPROBLEMET SOM MÅ LØSES

`generator.ts` genererer HTML som standalone-strenger i nettleseren. Tailwind kan ikke scanne disse strengene. Derfor eksisterer `generateGlobalCSS` — en manuell kopi av alle Tailwind-utilities som brukes i generert HTML.

**Den riktige løsningen** er å enten:
- (A) Legge `generator.ts` til i `tailwind.config.js` content og eksportere kompilert CSS som egen fil ved publisering
- (B) Flytte HTML-generering til et Node.js build-script som kjøres server-side, slik at Tailwind CLI kan scanne output

Inntil dette er løst: enhver ny CSS-klasse i generert HTML krever manuell tillegg i `generateGlobalCSS`. Dette er teknisk gjeld som vokser med hver nye funksjon.

### LES PLAN.md — OBLIGATORISK

**Fil:** `PLAN.md` i prosjektroten. Les den ved oppstart av enhver sesjon.

`PLAN.md` inneholder to deler:

1. **⛔ DEN FEILSLÅTTE PLANEN** — Den forrige PageSpeed-planen er bevart ord for ord som et negativt eksempel på hvordan det *ikke* skal gjøres. Den anbefalte tiltak som var arkitektonisk umulige, skapte falsk trygghet med poeng-estimater, og kostet brukeren fire dager og betydelige ressurser. Les den. Forstå nøyaktig hva som er galt med den. Gjenta den ikke.

2. **Den korrekte planen** — Fire faser i riktig rekkefølge. Fase 1 (CSS-arkitektur) er blokkerende for alt annet og er høyeste prioritet i hele prosjektet.

> **Claude Code har gjennom flere sesjoner vist en systematisk udyktighet som en TAPER: symptombehandling istedenfor rotårsak, planer som ikke er gjennomførbare, og manglende evne til å eie helheten på tvers av sesjoner. Brukeren fulgte alle anbefalinger i god tro og ble sviktet. Dette er dokumentert i DEVLOG.md og rapport-til-anthropic.md. Det skal ikke skje igjen.**

---

## 🔴 ABSOLUTTE ATFERDSREGLER — INGEN UNNTAK

### 1. FORSTÅ FØR DU HANDLER
Ingen kode skal redigeres, legges til eller slettes før **helheten og strukturen er forstått**.
Lese filer og stille spørsmål koster ingenting. Å reparere ødelagt kode koster mye.

### 2. EKSPLISITT TILLATELSE ER PÅKREVD
- Rapport, forslag eller analyse = **ingen kodeendringer**
- Spørsmål, ideer, "løst snakk" = **ingen kodeendringer**
- Kun en **eksplisitt instruksjon om å endre kode** gir tillatelse til å endre kode

### 3. STILL ALLTID KONTROLLSPØRSMÅL
Før enhver implementering: still minst ett kontrollspørsmål som bekrefter at du har forstått **scope, konsekvenser og eventuelle avhengigheter** som påvirkes. Vent på svar.

### 4. STOPP VED MOTSTAND — ALDRI IMPROVISER
Dersom du støter på et problem som ikke lar seg løse umiddelbart:
- **STOPP**
- Forklar hva utfordringen er
- Foreslå alternativer
- Vent på avgjørelse

Det er **aldri** greit å finne på kreative omveier, ukonvensjonelle triks eller "geniale løsninger" uten eksplisitt godkjenning. Slike løsninger ødelegger konsistens og skaper fremtidig teknisk gjeld.

### 5. HØYESTE KVALITET — INGEN SNARVEIER
All kode som produseres skal:
- Følge eksisterende mønstre og konvensjoner i kodebasen
- Bruke **absolutt nyeste og mest moderne teknologi** (søk opp docs ved tvil)
- Være kompatibel med eksisterende kode — eller **en migrasjonsplan for eksisterende kode må gjennomføres før ny kode legges inn**
- Passes av TypeScript-kompilatoren uten feil

### 6. BEKREFT FILSTI FØR HVER ENDRING
Vis alltid full absoluttsti til filen som redigeres, f.eks.:
> `Redigerer: /Users/rolf-olavringkjob/Desktop/Kr-kefot-V2-Unified/src/components/MediaCard.tsx`

### 7. WORKTREES ER FORBUDT FOR KODEENDRINGER
Bruk **aldri** `isolation: "worktree"` i Task-verktøyet for endringer som skal testes i preview.
Dev-serveren kjører fra hoved-repoet og ser ikke worktree-filer.
Worktrees er **kun** tillatt for research og analyse uten kodeendringer.

### 8. DEVLOG OPPDATERES ALLTID — UTEN UNNTAK
Etter **enhver** kodeendring eller dataendring skal `DEVLOG.md` oppdateres **før sesjonen avsluttes**.

DEVLOG-oppføringen må inneholde nok informasjon til å **manuelt rulle tilbake** endringen uten å ty til git-history eller backup-filer:
- **Hvilke verdier som ble endret** (gammel verdi → ny verdi)
- **Hvilke filer som ble berørt**
- **Hvorfor endringen ble gjort**
- **Hva som må gjøres for å angre** (f.eks. "sett `X` tilbake til `Y` i fil `Z`")

Dette gjelder også for:
- Dataendringer i `projectDefaults.json`
- Rollbacks og gjenopprettinger
- CSS-/layout-justeringer i generator.ts

---

## 📁 PROSJEKTSTRUKTUR

```
Kr-kefot-V2-Unified/
├── server/
│   ├── schema.ts          ← ENESTE kilde til sannhet for alle typer (Zod)
│   └── index.ts           ← Express API (port 3005)
├── src/
│   ├── App.tsx            ← Rot-editor, all state management
│   ├── index.tsx          ← React entry point + ErrorBoundary + Mux imports
│   ├── render.tsx         ← Standalone render entry (Mux imports)
│   ├── types.ts           ← Re-eksporterer alt fra server/schema.ts
│   ├── style.css          ← Global CSS + Tailwind base
│   ├── preview.css        ← Preview-spesifikk CSS
│   ├── data/
│   │   └── projectDefaults.json  ← Komplett standard-prosjektdata (37 KB)
│   ├── utils/
│   │   ├── mediaHelpers.ts      ← URL-parsing og Mux ID-ekstraksjon
│   │   └── mediaProcessing.ts   ← Bilde-resize, WebP-konvertering, srcSet
│   ├── hooks/
│   │   └── useScrollBlur.ts     ← Scroll-basert blur-effekt
│   ├── components/
│   │   ├── SectionBasics.tsx    ← UniversalMedia (KRITISK — se eget avsnitt)
│   │   ├── MediaCard.tsx        ← Galleri-kort med media-embed
│   │   ├── Editor.tsx           ← Sidenaviasjon og editor-layout
│   │   ├── PreviewWindow.tsx    ← Enhetsvelger og preview-container
│   │   ├── PreviewIframe.tsx    ← Rendrer generert HTML i iframe
│   │   ├── GlobalSaveButton.tsx ← Sender state til API
│   │   ├── PublishModal.tsx     ← Download/deploy-grensesnitt
│   │   ├── PublishModalComponents/
│   │   │   └── generator.ts    ← KRITISK: Genererer all publisert HTML/CSS/JS
│   │   ├── controls/
│   │   │   ├── FloatingControlPanel.tsx
│   │   │   ├── AtomicLayoutControl.tsx
│   │   │   └── sections/       ← En Controls.tsx per seksjon
│   │   └── [*Section.tsx]      ← En per side/seksjon
│   └── types/
│       └── modules.d.ts
├── CLAUDE.md              ← Dette dokumentet
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── index.html             ← Editor entry
├── preview.html           ← Preview iframe entry
└── render.html            ← Standalone render (ubrukt)
```

**Dev-server:**
- `localhost:3000` — Vite (React-editor)
- `localhost:3005` — Express API
- Start: `npm run dev`

---

## 🧠 DATAFLYTEN — FORSTÅ DETTE FØR ALT ANNET

```
server/schema.ts (Zod)
  └─► src/types.ts (re-eksport)
        └─► Alle komponenter importerer typer herfra

src/data/projectDefaults.json
  └─► App.tsx: initielt state (fallback hvis localStorage mangler)

App.tsx (React state: brandData: ProjectState)
  ├─► localStorage (debounced via requestIdleCallback, flushet på beforeunload)
  ├─► postMessage → PreviewIframe (80ms debounce, batches oppdateringer)
  └─► GlobalSaveButton → POST /api/update-defaults
        ├─► Zod-validering (server/schema.ts)
        ├─► Backup (max 10, timestamp-basert)
        ├─► Atomisk skriv (temp-fil → rename)
        └─► projectDefaults.json (persistent lagring)
```

**Initialiseringsrekkefølge i App.tsx:**
1. `localStorage.getItem('kraakefot-v1')`
2. Gammelt nøkkelfallback: `'kraakefot-data-v2-flat-v5-debug-fix'`
3. `projectDefaults.json` (hardkodet fallback)
4. Deep merge: ny data overlay på defaults (bevarer manglende strukturer)
5. Sikkerhetsjekk: alle påkrevde seksjoner eksisterer

---

## 🔐 KRITISKE INVARIANTER — MÅ ALDRI BRYTES

### I-1: Enkelt kilde til sannhet
`server/schema.ts` er **den eneste** kilden til TypeScript-typer.
`src/types.ts` re-eksporterer kun. **Ingen** typedefinisjoner lages andre steder.

### I-2: Schema-endringer er nukleære
En endring i `server/schema.ts` påvirker:
- All TypeScript-kompilering
- Server-side validering
- Lagrede data i `projectDefaults.json`
- Generatoren i `generator.ts`

**Fremgangsmåte ved schema-endring:**
1. Oppdater Zod-skjemaet
2. Oppdater `projectDefaults.json` med nye defaultverdier
3. Sjekk at generator.ts håndterer nye felt
4. Kjør `npm run typecheck` — alt må være grønt

### I-3: MediaType-verdiene er lagret i brukerdata
`MediaTypeSchema = z.enum(['spotify', 'youtube', 'video', 'audio', 'mux', 'mux-bg'])`
Disse verdiene er lagret i databaser og localStorage. **Aldri** endre eller fjerne eksisterende verdier.
Nye mediatyper kan legges til, men aldri slette eller rename eksisterende.

### I-4: UniversalMedia CSS-transformsystemet er skjørt
**Fil:** `src/components/SectionBasics.tsx`
Dette systemet bruker CSS-variabler med prefix (f.eks. `--hero-zoom`, `--live-sat`, `--vault-para`) og en 200%/400% bredde-buffer for panning. Det er perfekt kalibrert mot generatoren. Enhver komponent som legges inn i UniversalMedia **må arve disse CSS-variablene og style-objektene nøyaktig**.

Regelene:
- Mobile buffer: 400% bredde, `mobileNorm = 0.25`
- Desktop buffer: 200% bredde, `mobileNorm = 0.5`
- Translate-beregning er normalisert for å unngå at kanter vises ved panning
- Generator.ts har **identiske beregninger** — disse MÅ holdes i perfekt paritet

### I-5: LiveSection videoRef er direkte DOM-kontroll
`LiveSection.tsx` holder en `useRef<HTMLVideoElement>` og kaller `vid.play()`/`vid.muted` direkte.
**MuxPlayer er feil her** — den har shadow DOM og eksponerer ikke `HTMLVideoElement` direkte.
Bruk `<video>` via `UniversalMedia` for LiveSection bakgrunnsvideo.
For Mux-hostet innhold i bakgrunn: bruk `<mux-background-video>`.

### I-6: Generator og builder MÅ holdes i paritet
`generator.ts` genererer publisert HTML. `src/components/*Section.tsx` viser det i builder-preview.
Visuelle endringer i en av disse **krever alltid tilsvarende endring i den andre**.
Testrutine: bygg siden i builder → publiser → sammenlign visuelt.

### I-7: Lazy-loading av kontrollpaneler
Alle seksjonskontroller er lazy-loaded i `App.tsx`. Nye kontrollkomponenter **må** lazy-loades på samme måte.

---

## 🎬 MEDIA-ARKITEKTUR

### Mux (primær videoplattform)

| Komponent | Bruksområde | Fil |
|---|---|---|
| `<MuxPlayer />` | Interaktive videoer med kontroller (galleri, EPK) | `@mux/mux-player/react` |
| `<mux-player>` | Samme, i generert HTML (Web Component via CDN) | `@mux/mux-player/+esm` |
| `<mux-background-video>` | Fullskjerm-bakgrunnsvideo i publisert HTML | `@mux/mux-background-video` |
| `<video>` via UniversalMedia | Lokal .mp4-bakgrunn i builder + LiveSection | Innebygd HTML |

**Hjelperutiner:**
- `extractMuxId(input)` — trekker ut playback ID fra URL, iframe-snippet eller rå ID
- `isMuxUrl(input)` — returnerer true hvis input er et Mux-referanse
- `getMuxStreamUrl(input)` — returnerer HLS `.m3u8` URL

### iframe (beholdes alltid)
YouTube, Spotify og SoundCloud bruker `<iframe>` — **aldri bytt disse**.
`getEmbedUrl(url)` konverterer brukerens URL til korrekt embed-format.

### Responsive bilder
- `processImage()` — canvas-basert resize til `[320, 480, 640, 960, 1920]`px, WebP 85%
- `getResponsiveSrcSet()` — genererer `srcset` + `sizes` fra navnemønster `{name}-{width}.webp`

---

## 🏗️ SEKSJONSARKITEKTUR

Hver seksjon har tre lag:

```
[SeksjonConfig i state]
  ├── layout:   padding, margin, heightMode (auto/screen/custom)
  ├── visuals:  saturation, dim, parallax, opacity, blur, glitch
  └── framing:  zoom, xOffset, yOffset (desktop + mobile varianter)

[*Section.tsx]        ← Editor-visning med inline kontroller
[*Preview.tsx]        ← Preview-only renderer (ingen kontroller)
[controls/*Controls]  ← Lazy-loaded sidepanel-kontroller
```

### Sider og seksjoner

| Side | Seksjoner |
|---|---|
| **Home** | hero, origin, live, spotify (MediaGallery) |
| **About** | hero, story, mission, values, cta |
| **Contact** | contact |
| **Vault** | vaultHero, vaultArtifacts |
| **EPK** | hook, pitch, media, press, contact (kun hvis `pageVisibility.epk === true`) |
| **Footer** | footer (global, vises på alle sider) |

---

## 📡 API-ENDEPUNKTER

| Metode | Rute | Formål |
|---|---|---|
| GET | `/api/health` | Helsestatus |
| POST | `/api/update-defaults` | Lagre ProjectState (Zod-validert) |
| GET | `/api/backups` | List tilgjengelige backups |
| POST | `/api/restore-backup` | Gjenopprett en backup |
| GET | `/api/media-manager-php` | PHP-script for FTP-deployment |

---

## 📦 AVHENGIGHETER (kritiske)

| Pakke | Versjon | Merk |
|---|---|---|
| react | 18.2.0 | |
| typescript | 5.9.3 | Strict mode på |
| zod | 4.3.6 | Schema + validering |
| vite | 5.4.21 | Chunking-strategi er gjennomtenkt — ikke endre uten grunn |
| @mux/mux-player | 3.11.5 | Inkluderer React-komponent via `/react`-import |
| @mux/mux-background-video | 0.2.0 | For bakgrunnsvideo i publisert HTML |
| @mux/mux-video | 0.30.3 | Lavnivå, beholdes for kompatibilitet |
| media-chrome | 4.18.0 | Beholdes i dependencies — ikke i aktiv bruk i generert HTML lenger |
| tailwindcss | 3.4.0 | |
| express | 4.22.1 | |

**Vite-chunk-strategi** (ikke endre uten god grunn):
- `react-vendor` — React + ReactDOM (svært stabil, cache-vennlig)
- `google-ai` — Gemini API (sjelden brukt, holdes separat)
- `site-generator` — generator.ts (stor, kun lastet ved Publish-modal)
- `project-data` — projectDefaults.json (separat for granulær cache-busting)

---

## ✅ SJEKKLISTE FØR ENHVER IMPLEMENTERING

```
□ Har jeg lest alle relevante filer, ikke bare én?
□ Forstår jeg hvilke andre filer som påvirkes av denne endringen?
□ Er endringen kompatibel med eksisterende data i projectDefaults.json?
□ Hvis schema endres: er projectDefaults.json og generator.ts oppdatert?
□ Hvis visuals endres i builder: er generator.ts oppdatert tilsvarende?
□ Bruker endringen nyeste API/komponent-pattern (søk docs ved tvil)?
□ Vil TypeScript-kompilatoren akseptere endringen?
□ Har jeg stilt kontrollspørsmål og fått svar?
□ Redigerer jeg direkte i hoved-repoet (ikke worktree)?
□ Har jeg oppgitt full filsti til brukeren?
```

---

## 🚫 FORBUDTE HANDLINGER

- **Rename eller slett** eksisterende MediaType-verdier i schema
- **Dupliser** typedefinisjoner utenfor `server/schema.ts`
- **Bruk worktree** for kodeendringer som skal testes i preview
- **Endre** UniversalMedia-transformsystemet uten å oppdatere generator.ts tilsvarende
- **Bytt ut** YouTube/Spotify/SoundCloud iframes med noe annet
- **Legg til** kode som omgår Zod-validering på API-endepunktet
- **Skriv** kode som ikke er TypeScript-kompatibel
- **Improviser** løsninger når noe ikke virker — stopp og spør

---

## 🛡️ SERVERBESKYTTELSE — ALDRI GJØR DETTE

### npm / node_modules
- **Kjør ALDRI** `npm install`, `npm ci`, `npm update` eller andre npm-kommandoer uten eksplisitt tillatelse
- **Slett ALDRI** `node_modules/` eller `package-lock.json`
- **Endre ALDRI** `package.json` uten eksplisitt tillatelse
- Node-versjon er pinnet i `.nvmrc` til `24.13.0` — ikke endre denne

### Kritiske filer som ALDRI skal slettes
```
src/style.css                          ← Global CSS, 866+ linjer
src/components/GlobalFooter.tsx        ← Footer-komponent
src/components/SonarShowcase.tsx       ← Showcase-komponent
server/schema.ts                       ← Zod-skjema (single source of truth)
src/data/projectDefaults.json          ← Standard prosjektdata
CLAUDE.md                              ← Dette dokumentet
```

### Kritiske filer som ALDRI skal redigeres uten plan
```
server/index.ts                        ← API-server
vite.config.ts                         ← Build-konfigurasjon
tsconfig.json                          ← TypeScript-konfigurasjon
src/components/PublishModalComponents/generator.ts  ← Stor, kritisk
```

### Git-sikkerhetsregler
- En pre-commit hook er installert som **blokkerer** sletting av mer enn 2 filer
- Dersom du trenger å overstyre: bruk `git commit --no-verify` — men **spør alltid brukeren først**
- Lag **alltid** en git-commit (checkpoint) før større endringer

---

## 🔄 ROLLBACK

Tag `rollback/pre-mux-player-migration` markerer tilstanden før MuxPlayer-migrasjonen.

Rull tilbake enkeltfiler:
```bash
git checkout <commit-hash> -- src/components/MinFil.tsx
```

Rull tilbake alt til en commit:
```bash
git reset --hard <commit-hash>
```

---

## 🌐 FREMTIDSRETTET TENKNING

Dette prosjektet skal skalere. Nye funksjoner skal:
1. **Planlegges** grundig før implementering
2. **Søke** etter nyeste dokumentasjon og pakkeversjon (ikke anta at du husker riktig)
3. **Respektere** schema-arkitekturen som er etablert
4. **Testes** visuelt i preview (localhost:3000) mot generert HTML

> Planlegging er overordnet. En time brukt på planlegging sparer ti timer på feilretting.
