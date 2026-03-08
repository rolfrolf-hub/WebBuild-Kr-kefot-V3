#!/bin/bash

# Gå til prosjektmappen
PROJECT_DIR="/Users/rolf-olavringkjob/Desktop/Kr-kefot-V2-Unified"
cd "$PROJECT_DIR" || exit 1

BACKUP_DIR="$PROJECT_DIR/backups_hard_copy"
mkdir -p "$BACKUP_DIR"

echo "Starter lokal auto-backup til backups_hard_copy"
echo "Backup tas hvert 5. minutt. (Trykk Ctrl+C for å stoppe)"
echo "----------------------------------------------------------------------------------"

while true; do
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
  
  echo "[$TIMESTAMP] Oppretter backup..."
  
  # Lag tar.gz og ignorer store mapper/cache for rask og liten backup
  tar -czf "$BACKUP_FILE" \
      --exclude="node_modules" \
      --exclude=".git" \
      --exclude=".vite" \
      --exclude="dist" \
      --exclude="backups_hard_copy" \
      --exclude="backups" \
      --exclude=".npm-cache" \
      --exclude=".claude" \
      .
      
  echo "[$TIMESTAMP] Backup lagret: backup_$TIMESTAMP.tar.gz"
  
  # Kjører retention policy via Python for presis tidsberegning
  python3 << 'EOF'
import os
import time
import glob
from collections import defaultdict

backup_dir = "/Users/rolf-olavringkjob/Desktop/Kr-kefot-V2-Unified/backups_hard_copy"
now = time.time()

files = glob.glob(os.path.join(backup_dir, "backup_*.tar.gz"))

MINUTES_120 = 120 * 60
HOURS_24 = 24 * 3600
DAYS_7 = 7 * 24 * 3600

hourly_groups = defaultdict(list)
daily_groups = defaultdict(list)
to_delete = []

for f in files:
    mtime = os.path.getmtime(f)
    age = now - mtime
    
    if age <= MINUTES_120:
        continue # Behold alle i 0-120 minutter
    elif age <= HOURS_24:
        # Grupper per time
        hour_key = time.strftime("%Y-%m-%d_%H", time.localtime(mtime))
        hourly_groups[hour_key].append(f)
    elif age <= DAYS_7:
        # Grupper per døgn
        day_key = time.strftime("%Y-%m-%d", time.localtime(mtime))
        daily_groups[day_key].append(f)
    else:
        # Eldre enn 7 dager
        to_delete.append(f)

# For 2-24 timer: Behold kun nyeste per time
for group, fs in hourly_groups.items():
    # Sorter med nyeste først
    fs.sort(key=os.path.getmtime, reverse=True)
    # Beholder fs[0], merker resten for sletting
    to_delete.extend(fs[1:])

# For 24 timer - 7 dager: Behold kun nyeste per døgn
for group, fs in daily_groups.items():
    fs.sort(key=os.path.getmtime, reverse=True)
    to_delete.extend(fs[1:])

for f in to_delete:
    try:
        os.remove(f)
        print(f"  -> Retention Policy: Slettet gammel backup {os.path.basename(f)}")
    except Exception as e:
        print(f"  -> Feil ved sletting av {f}: {e}")
EOF

  # Sjekk om det er noen endringer og push til GitHub
  if [[ -n $(git status -s) ]]; then
    echo "[$TIMESTAMP] Fant ucommited endringer! Pusher til GitHub..."
    
    # Legg til alle endrede og nye filer
    git add . || echo "[$TIMESTAMP] ⚠️ Advarsel: 'git add .' feilet. Fortsetter..."
    
    CHANGES=$(git diff --cached --stat | tail -1)
    
    # Prøv å committe, fungerer kun hvis det faktisk er endringer racket av git add
    git commit -m "Auto-backup: $TIMESTAMP | $CHANGES" || echo "[$TIMESTAMP] ⚠️ Advarsel: Fikk ikke committet (kanskje ingen nye endringer). Fortsetter..."
    
    git push origin main || echo "[$TIMESTAMP] ⚠️ Advarsel: 'git push' feilet. Prøver igjen ved neste intervall..."
    echo "[$TIMESTAMP] GitHub push fullført!"
  else
    echo "[$TIMESTAMP] Ingen git-endringer å pushe."
  fi

  echo "[$TIMESTAMP] Backup-syklus fullført! Venter 5 minutter..."
  echo "----------------------------------------------------------------------------------"
  
  sleep 300
done
