#!/bin/bash
# compare-with-v2.sh
# Sammenlikner Kr-kefot-V3 med Kr-kefot-V2-Unified
# Kjør fra Kr-kefot-V3-mappen: ./compare-with-v2.sh

V2_DIR="/Users/rolf-olavringkjob/Desktop/Kr-kefot-V2-Unified"
V3_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================================"
echo "  Kråkefot V2 vs V3 — Sammenlikningsrapport"
echo "  $(date)"
echo "============================================================"
echo ""

if [ ! -d "$V2_DIR" ]; then
    echo "❌ V2-mappen finnes ikke: $V2_DIR"
    exit 1
fi

# --- 1. Data-sammenlikning (projectDefaults.json) ---
echo "📊 PROSJEKTDATA (projectDefaults.json)"
echo "------------------------------------------------------------"
V2_DATA="$V2_DIR/src/data/projectDefaults.json"
V3_DATA="$V3_DIR/src/data/projectDefaults.json"

if [ -f "$V2_DATA" ] && [ -f "$V3_DATA" ]; then
    V2_SIZE=$(wc -c < "$V2_DATA")
    V3_SIZE=$(wc -c < "$V3_DATA")
    echo "  V2 størrelse: $V2_SIZE bytes"
    echo "  V3 størrelse: $V3_SIZE bytes"

    if diff -q "$V2_DATA" "$V3_DATA" > /dev/null 2>&1; then
        echo "  ✅ Identiske datafiler"
    else
        echo "  ⚠️  Datafiler er FORSKJELLIGE — kjører diff (top-level keys):"
        node -e "
const v2 = JSON.parse(require('fs').readFileSync('$V2_DATA', 'utf8'));
const v3 = JSON.parse(require('fs').readFileSync('$V3_DATA', 'utf8'));
const v2keys = new Set(Object.keys(v2));
const v3keys = new Set(Object.keys(v3));
const onlyV2 = [...v2keys].filter(k => !v3keys.has(k));
const onlyV3 = [...v3keys].filter(k => !v2keys.has(k));
if (onlyV2.length) console.log('  Kun i V2:', onlyV2.join(', '));
if (onlyV3.length) console.log('  Kun i V3:', onlyV3.join(', '));
if (!onlyV2.length && !onlyV3.length) console.log('  Samme nøkler, ulikt innhold');
" 2>/dev/null || echo "  (node ikke tilgjengelig for diff)"
    fi
else
    echo "  ❌ En eller begge datafiler mangler"
fi
echo ""

# --- 2. generator.ts linjeantall ---
echo "📄 GENERATOR.TS STØRRELSE"
echo "------------------------------------------------------------"
V2_GEN="$V2_DIR/src/components/PublishModalComponents/generator.ts"
V3_GEN="$V3_DIR/src/components/PublishModalComponents/generator.ts"

if [ -f "$V2_GEN" ]; then
    echo "  V2: $(wc -l < "$V2_GEN") linjer"
fi
if [ -f "$V3_GEN" ]; then
    echo "  V3: $(wc -l < "$V3_GEN") linjer"
fi
echo ""

# --- 3. API-status ---
echo "🌐 API-STATUS"
echo "------------------------------------------------------------"
V2_HEALTH=$(curl -s --connect-timeout 2 http://localhost:3005/api/health 2>/dev/null)
V3_HEALTH=$(curl -s --connect-timeout 2 http://localhost:3015/api/health 2>/dev/null)

if [ -n "$V2_HEALTH" ]; then
    echo "  V2 API (3005): ✅ $V2_HEALTH"
else
    echo "  V2 API (3005): 🔴 Offline"
fi

if [ -n "$V3_HEALTH" ]; then
    echo "  V3 API (3015): ✅ $V3_HEALTH"
else
    echo "  V3 API (3015): 🔴 Offline"
fi
echo ""

# --- 4. Filer kun i V2 / kun i V3 ---
echo "📁 FILER — ULIKHETER (src/)"
echo "------------------------------------------------------------"
echo "  Filer kun i V2/src (ikke i V3/src):"
diff <(cd "$V2_DIR/src" && find . -name "*.ts" -o -name "*.tsx" | sort) \
     <(cd "$V3_DIR/src" && find . -name "*.ts" -o -name "*.tsx" | sort) \
  | grep "^<" | sed 's/^< /    ❌ /' | head -20

echo ""
echo "  Filer kun i V3/src (ikke i V2/src):"
diff <(cd "$V2_DIR/src" && find . -name "*.ts" -o -name "*.tsx" | sort) \
     <(cd "$V3_DIR/src" && find . -name "*.ts" -o -name "*.tsx" | sort) \
  | grep "^>" | sed 's/^> /    ✅ /' | head -20

echo ""

# --- 5. Hent visuelt innhold fra V2 ---
echo "🎨 VISUELT INNHOLD (fra V2-data)"
echo "------------------------------------------------------------"
if [ -f "$V2_DATA" ]; then
    node -e "
const d = JSON.parse(require('fs').readFileSync('$V2_DATA', 'utf8'));
const s = d.sections;
console.log('  Hero video:', s?.home?.hero?.videoUrl || '(ikke satt)');
console.log('  Headline:  ', s?.home?.hero?.headline || '(ikke satt)');
console.log('  Accent:    ', d.accentColor || d.brandColor || '(ikke satt)');
console.log('  Brand:     ', d.brandName || '(ikke satt)');
" 2>/dev/null || echo "  (node ikke tilgjengelig)"
fi

echo ""
echo "============================================================"
echo "  Rapport ferdig."
echo "============================================================"
