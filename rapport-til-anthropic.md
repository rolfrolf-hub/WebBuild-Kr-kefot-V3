# Klage: Claude Code — Feilrådgivning over fire dager

**Dato:** 2026-03-08
**Produkt:** Claude Code (claude-sonnet-4-6)
**Prosjekt:** Kråkefot V2 — kraakefot.com

---

## Sammendrag

Jeg har brukt fire dager og betydelige ressurser på Claude Code, fulgt alle anbefalinger som ble gitt, og endt opp med et system som har det samme grunnleggende arkitekturproblemet som da jeg startet — fordi ingen AI-sesjon identifiserte rotproblemet eller adresserte det.

---

## Hva jeg ba om

- Et ryddig, vedlikeholdbart system
- Fjerning av alt gammelt og ubrukt
- Ingen snarveier — ordentlige løsninger

## Hva AI-assistenten anbefalte og jeg fulgte

**Sesjon 1 — Rydde git-worktrees og branches:**
- 3 worktrees og branches slettet
- Resultat: korrekt, men overfladisk

**Sesjon 2 — Kode-opprydding:**
- 13 døde React-komponenter slettet
- 10 utdaterte shell-scripts slettet
- Markdown-filer, PDF-er, backup-binærfiler slettet
- Resultat: korrekt for de filene som ble slettet

**Sesjon 3 — TypeScript-opprydding:**
- ~100 TypeScript-feil fikset
- Schema-endringer i `server/schema.ts`
- 8 kontroll-filer refaktorert
- Resultat: korrekt isolert sett

**Sesjon 4 — PageSpeed-analyse:**
- Plan for ytelsesoptimering laget
- Anbefalt å erstatte Tailwind CDN med purged inline CSS
- Resultat: symptombehandling av et arkitekturproblem

---

## Hva som aldri ble gjort — og burde ha vært gjort fra dag én

`src/components/PublishModalComponents/generator.ts` er **4722 linjer** og inneholder:
- En manuelt vedlikeholdt CSS-blokk på **~2000 linjer** (`generateGlobalCSS`)
- All JavaScript for publisert HTML (~857 linjer)
- All HTML-generering for alle sider (~1338 linjer)

Dette er et grunnleggende arkitekturproblem. CSS-blokken eksisterer fordi Tailwind ikke kan scanne dynamisk genererte HTML-strenger — så alle CSS-regler må skrives manuelt og holdes synkronisert med React-komponentene for hånd.

**Ingen AI-sesjon identifiserte dette som rotproblemet.**
**Ingen AI-sesjon sa: "Før vi gjør noe — denne arkitekturen er feil."**

I stedet ble CSS-klasser lappet inn enkeltvis, TypeScript-feil fikset i komponenter som bygger på en feilaktig struktur, og ytelsesoptimering planlagt oppå et fundament som trenger å omstruktureres.

---

## Konkret skade

- **Tid brukt:** 4 dager
- **Ressurser:** Claude Code Pro-abonnement + tid
- **Status:** Systemet fungerer, men rotproblemet er uløst og vil fortsette å generere nye symptomer

---

## Vedlagte filer (fra prosjektet)

Disse filene dokumenterer tilstanden og historikken:

| Fil | Beskrivelse |
|---|---|
| `DEVLOG.md` | Komplett logg over alle AI-sesjoner og endringer |
| `CLAUDE.md` | Prosjektinstruksjoner AI-assistenten fikk |
| `src/components/PublishModalComponents/generator.ts` | 4722-linjes monolitt som er rotproblemet |
| `server/schema.ts` | Zod-schema som ble endret uten fullstendig oppfølging |

---

## Hvor du finner filene

Alle filer ligger i git-repoet:
```
/Users/rolf-olavringkjob/Desktop/Kr-kefot-V2-Unified/
```

For å lage en zip med de viktigste filene, kjør i terminal:
```bash
zip -j rapport-vedlegg.zip \
  ~/Desktop/Kr-kefot-V2-Unified/DEVLOG.md \
  ~/Desktop/Kr-kefot-V2-Unified/CLAUDE.md \
  ~/Desktop/Kr-kefot-V2-Unified/src/components/PublishModalComponents/generator.ts \
  ~/Desktop/Kr-kefot-V2-Unified/server/schema.ts
```

---

## Send til

**GitHub Issues (offentlig):**
https://github.com/anthropics/claude-code/issues

**Anthropic support (privat):**
https://support.anthropic.com

---

*Rapporten er skrevet av Claude Code selv, på brukerens forespørsel, som en ærlig beskrivelse av hva som gikk galt.*
