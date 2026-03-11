# KRÅKEFOT V3 — PROSJEKTOVERSIKT

> Autoritativ oversikt. Leses ved start av ny sesjon, ny branch, eller ved tvil.
> Sist oppdatert: 2026-03-11

---

## 🌐 TEKNISK MILJØ

| | V3 |
|---|---|
| Vite (editor) | `localhost:3010` |
| Express API | `localhost:3015` |
| Start | `npm run dev` |
| Node | 24.13.0 (pinnet i `.nvmrc`) |
| Stack | React 19, Vite 7, Tailwind v4, TypeScript strict |

---

## 🌿 GIT-REGLER (ABSOLUTTE)

```
✅ Alltid branch — aldri main
✅ Sjekk branch ved sesjonstart: git branch
✅ Spør bruker hvilken branch som skal brukes
✅ Lag checkpoint-commit FØR større endringer
✅ Merge til main: kun etter eksplisitt bruker-godkjenning

❌ Aldri: git reset --hard  (irreversibelt — historisk destruktivt)
❌ Aldri: arbeid direkte på main
❌ Aldri: git push --force på main
```

**Aktive branches:**
| Branch | Formål |
|---|---|
| `main` | Produksjonskode. Kun merge hit. Aldri direkte arbeid. |
| `working-11.03.26` | Arbeids-branch |
| `v3-testside` | Testside-branch |
| `test2`, `test3`, `test-branch` | Eksperiment/test |
| `staging` | Pre-merge testing |
| `docs/branch-policy` | Dokumentasjonsoppdatering (denne branchen) |

---

## 🚨 PANIC MODE

**Trigger:** Krasj, uventet tilstand, rollback-behov, eller noe som ikke ser riktig ut.

```
1. STOPP — ingen nye kommandoer
2. BESKRIV situasjonen nøyaktig
3. STILL kontrollspørsmål — minst to alternativer med konsekvenser
4. VENT på brukers beslutning
```

---

## 🔄 ROLLBACK — SIKKER PROTOKOLL

| ✅ Tillatt | ❌ Forbudt |
|---|---|
| `git revert <hash>` | `git reset --hard` |
| `git checkout <hash> -- <fil>` | `git push --force` |
| `git stash` | |
| `git diff <hash> HEAD` (alltid gjør dette FØR rollback) | |

**Ved rollback-behov: Panic Mode gjelder. Aldri autonomt.**

---

## 📁 PROSJEKTSTRUKTUR

```
Kr-kefot-V3/
├── server/
│   ├── schema.ts          ← ENESTE kilde til sannhet for typer (Zod)
│   └── index.ts           ← Express API (port 3015)
├── src/
│   ├── App.tsx            ← Rot-editor, all state management
│   ├── publish/
│   │   └── ssr.ts         ← SSR-renderer (ny i V3)
│   ├── types.ts           ← Re-eksporterer alt fra server/schema.ts
│   ├── style.css          ← Global CSS + Tailwind base
│   ├── preview.css        ← Preview-spesifikk CSS
│   ├── data/
│   │   └── projectDefaults.json
│   ├── components/
│   │   ├── SectionBasics.tsx    ← UniversalMedia (KRITISK)
│   │   ├── PublishModalComponents/
│   │   │   └── generator.ts    ← Publisert HTML/CSS/JS (kritisk)
│   │   └── [*Section.tsx]
│   └── utils/, hooks/
├── CLAUDE.md              ← Autoritativ. Les dette FØR alt annet.
├── ARCHITECTURE.md        ← SSR-arkitekturplan
├── DEVLOG.md              ← Endringslogg
├── OVERSIKT.md            ← Dette dokumentet
├── PLAN.md                ← Faseplan
├── # AGENT-INSTRUKSER OPERASJONELLE RAMMER.md
└── # KRAAKEFOT V3 TEKNISK OPERASJONSPROTOKOLL.md
```

---

## 🏗️ ARKITEKTUR — KJERNEVALG

**V3: React SSR erstatter generator.ts-monolitten**

```
BUILDER:  React-komponenter → nettleser (Vite/React)
PUBLISH:  Samme komponenter → renderToStaticMarkup() → HTML

Resultat: 100% paritet per definisjon. Ingen manuell CSS.
```

**Det kritiske rotproblemet fra V2 (løst i V3):**
- `generateGlobalCSS` (2076 linjer manuell CSS) er fjernet
- Tailwind kan nå scanne komponentene direkte
- Ingen manuell oppdatering av CSS-klasser ved nye funksjoner

---

## 🔐 KRITISKE INVARIANTER (kortversjon)

| | Regel |
|---|---|
| **I-1** | `server/schema.ts` er eneste kilde til typer |
| **I-2** | Schema-endring = oppdater schema + defaults + generator |
| **I-3** | MediaType-verdier slettes/renames ALDRI |
| **I-4** | UniversalMedia CSS-transform: builder og generator MÅ ha paritet |
| **I-5** | LiveSection bruker `<video>` direkte — ikke MuxPlayer |
| **I-6** | Visuell endring i builder = tilsvarende i generator.ts |
| **I-7** | Nye kontrollpaneler: lazy-load i App.tsx |

---

## ✅ SESJONSTART-SJEKKLISTE

```
□ git branch                   → bekrefter at vi IKKE er på main
□ Spurt bruker: "Hvilken branch?"
□ Les DEVLOG.md (siste oppføring)
□ Les CLAUDE.md ved tvil
□ Kontrollspørsmål stilt og besvart
□ Full filsti oppgitt ved hver endring
```

---

## 🚫 ABSOLUTT FORBUDT — KORTLISTE

```
❌ git reset --hard
❌ Arbeid på main
❌ git push --force på main
❌ npm install/update uten eksplisitt tillatelse
❌ Slette/rename MediaType-verdier i schema
❌ Typedefinisjoner utenfor server/schema.ts
❌ Improvisere løsninger — STOPP og SPØR
```

---

## 🔍 JCODEMUNCH — KODEBASE-SØK

Prosjektet er indeksert. Bruk alltid jcodemunch FØR du leser filer manuelt.

**Repo-ID:** `local/Kr-kefot-V3-e87e128c` | 89 filer | 467 symboler

```
search_symbols  → finn funksjoner/klasser
search_text     → finn strenger og kommentarer
get_file_outline → se alle symboler i en fil
get_symbol      → hent full kildekode
get_symbols     → hent multiple symboler i ett kall (effektivt)
```

Re-indekser etter større endringer (incremental=true).

---

## 📚 DOKUMENTHIERARKI

Les i denne rekkefølgen ved oppstart:

1. `OVERSIKT.md` (dette dokumentet) — hurtigoversikt
2. `CLAUDE.md` — fullstendige instruksjoner og atferdsregler
3. `DEVLOG.md` — siste endringer og kontekst
4. `ARCHITECTURE.md` — teknisk arkitekturplan (ved arkitekturarbeid)
5. `PLAN.md` — faseplan (ved planlegging)
