#!/bin/bash
# push.sh — Lagre alt til GitHub med én kommando
# Kjør: ./push.sh
# Kjør med melding: ./push.sh "Beskrivelse av endring"

set -e

MSG="${1:-Checkpoint: $(date '+%Y-%m-%d %H:%M')}"

git add -A
git status --short

if git diff --cached --quiet; then
  echo "✅ Ingen endringer å committe."
  exit 0
fi

git commit -m "$MSG

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

git push origin HEAD
echo ""
echo "✅ Pushet til GitHub: github.com/rolfrolf-hub/WebBuild-Kr-kefot-V3"
