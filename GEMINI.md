# Kråkefot V3 — Gemini CLI Instruksjoner

> **Les dette FØR du gjør noe i dette prosjektet.**
> Disse instruksjonene er bindende for alle AI-agenter, inkludert Gemini-modeller.
> Globale regler i `~/.gemini/GEMINI.md` gjelder i tillegg.

---

## 📚 OBLIGATORISK LESNING VED SESJONSTART

Les i denne rekkefølgen:
1. `OVERSIKT.md` — teknisk miljø, git-regler, sjekkliste
2. `CLAUDE.md` — fullstendige instruksjoner og arkitektur (autoritativ)
3. `DEVLOG.md` — nåværende tilstand og siste endringer

**Disse dokumentene er identiske kilde til sannhet for alle AI-agenter.**

---

## 🌿 BRANCH-REGLER (ABSOLUTT)

```
✅ Alltid branch — aldri main
✅ Sjekk ved sesjonstart: git branch
✅ Spør bruker: "Hvilken branch?" — vent på svar
✅ Lag checkpoint-commit FØR større endringer

❌ Aldri: git reset --hard  (forbudt uten unntak)
❌ Aldri: arbeid direkte på main
❌ Aldri: git push --force på main
```

---

## 🔍 KODEBASE-SØK — BRUK JCODEMUNCH

Prosjektet er indeksert. Bruk jcodemunch FØR du leser filer manuelt.

**Repo-ID:** `local/Kr-kefot-V3-e87e128c`

Tilgjengelig via MCP (konfigurert i `~/.gemini/antigravity/mcp_config.json`):
- `search_symbols` — finn funksjoner/klasser/metoder
- `search_text` — finn strenger og kommentarer
- `get_file_outline` — se alle symboler i en fil
- `get_symbol` — hent full kildekode
- `get_symbols` — hent multiple symboler i ett kall (effektivt)

---

## 🏗️ TEKNISK MILJØ

| | |
|---|---|
| Vite (editor) | `localhost:3010` |
| Express API | `localhost:3015` |
| Start | `npm run dev` |
| Stack | React 19, Vite 7, Tailwind v4, TypeScript strict |
| Arkitektur | React SSR — `renderToStaticMarkup()` i `src/publish/ssr.ts` |

**Kildekoden er i `src/`. Eneste type-kilde: `server/schema.ts` (Zod).**

---

## 🚨 PANIC MODE

**Trigger:** Krasj, uventet tilstand, rollback-behov, feilmelding, eller "noe ser galt ut".

**Protokoll:**
1. STOPP — ingen nye kommandoer
2. Beskriv situasjonen nøyaktig
3. Still kontrollspørsmål — minst to alternativer med konsekvenser
4. Vent på brukers beslutning. Null autonomi.

---

## 🔄 ROLLBACK — SIKKER PROTOKOLL

> ⛔ `git reset --hard` er ABSOLUTT FORBUDT.

Sikre metoder:
```bash
git revert <hash>                      # bevarer historikk
git checkout <hash> -- <fil>           # enkeltfil
git stash push -m "beskrivelse"        # midlertidig
git diff <hash> HEAD                   # alltid sjekk FØR rollback
```

**Rollback-protokoll: Panic Mode gjelder. Aldri autonomt.**

---

## 🚫 FORBUDTE HANDLINGER

- `git reset --hard` — ABSOLUTT FORBUDT
- Arbeid direkte på `main`
- Endre/slette MediaType-verdier i `server/schema.ts`
- Typedefinisjoner utenfor `server/schema.ts`
- `npm install/update` uten eksplisitt tillatelse
- Improviser løsninger — stopp og spør

---

## ✅ SESJONSTART-SJEKKLISTE

```
□ git branch  →  er vi IKKE på main?
□ Spurt bruker: "Hvilken branch?"
□ Lest DEVLOG.md (øverste seksjon: nåværende tilstand)
□ jcodemunch tilgjengelig og indeksert?
□ Kontrollspørsmål stilt og besvart
```
