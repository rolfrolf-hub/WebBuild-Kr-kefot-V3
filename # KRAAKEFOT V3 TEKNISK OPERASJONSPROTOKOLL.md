# KRAAKEFOT V3: TEKNISK OPERASJONSPROTOKOLL

## 1. ISOLASJON VIA BRANCHING — ABSOLUTT REGEL
- **Null arbeid på `main`.** `main` er kun for ferdig, testet kode.
- **Ved sesjonstart:** Kjør `git branch` og vis gjeldende branch til bruker. Spør: "Hvilken branch skal vi jobbe i?" Vent på svar.
- **Feature Isolation:** Opprett ny gren (f.eks. `feature/ny-funksjon`) via statuslinjen eller `git checkout -b <branch>` før hver oppgave.
- **Navngivning:** `feature/`, `fix/`, `docs/`, `test/` — alltid beskrivende navn.
- **Merge-kontroll:** Testing av kombinert kode skjer i `staging` før fletting til `main`.
- **Merge til main:** Kun etter eksplisitt bruker-godkjenning. Aldri autonomt.

## 2. FORBUDTE GIT-KOMMANDOER
- **`git reset --hard <commit-hash>`** — ABSOLUTT FORBUDT. Irreversibelt. Historisk bevist destruktivt (8+ timers arbeid tapt, 4. mars 2026).
- **`git push --force`** på `main` — FORBUDT.
- **`git commit --no-verify`** — kun med eksplisitt bruker-tillatelse.

Sikre alternativer: `git revert`, `git stash`, `git checkout <hash> -- <fil>`.

## 3. PANIC MODE — PROTOKOLL VED KRASJ ELLER UVENTET TILSTAND
**Trigger:** Krasj, uventet tilstand, rollback-behov, feilmelding som stopper fremdrift.

**Protokoll:**
1. **STOPP umiddelbart** — ingen nye kommandoer
2. **Beskriv** situasjonen nøyaktig til bruker
3. **Still kontrollspørsmål** — minst to alternativer med konsekvenser
4. **Vent** på brukers beslutning. Null autonomi.

## 4. VERIFISERINGSKRAV (PRE-EDIT AUDIT)
- Før hver filendring: oppgi filsti og hva som endres. Vent på bekreftelse.
- Bruker kan manuelt verifisere tilstand via Source Control-fanen i VSCode.

## 5. GRENSESNITT-KONTROLL
- **Source Control:** Bruk tabben til venstre for å overvåke endringer i sanntid.
- **Untracked filer (U):** Filer som ikke tilhører kildekoden slettes kun etter bruker-godkjenning.

## 6. CHECKPOINT-COMMITS
- Lag alltid en commit (checkpoint) FØR større endringer.
- Commit-melding: tydelig beskrivelse av hva som er gjort og hvorfor.
- Format: `git commit -m "Checkpoint: <beskrivelse>"`
