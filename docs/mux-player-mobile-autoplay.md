# MuxPlayer på EPK — Autoplay på mobil

> Dokumentert 2026-03-01. Refererer til `generator.ts` og `server/schema.ts`.

Autoplay på mobil fungerer faktisk for MuxPlayer i EPK-siden (i burn-overlay). Dette er uvanlig fordi mobilnettlesere normalt blokkerer lyd-autoplay. Her er en fullstendig oversikt over **hvorfor det fungerer**, og **hvilke ingredienser som er nødvendige** for å gjenskape det.

---

## Kontekst: Hvor skjer dette?

EPK-siden har et "burn overlay" — en fullskjermsoverlay som åpnes når brukeren trykker på et mediakort. Mux-spilleren lever her som et **statisk, forhåndsrendet HTML-element** som konfigureres dynamisk via JavaScript.

Relevant kode i `generator.ts`:
- **HTML-elementet** (linje ~3888): den statiske `<mux-player>`
- **JavaScript-konfigurasjonen** (linje ~3941–3980): `openEpkPlayer()`-funksjonen
- **CDN-lasteren** (linje ~4104): `<script type="module" ...>`

---

## De 6 ingrediensene som gjør mobil-autoplay mulig

### 1. Statisk DOM-element — ikke dynamisk skapt

```html
<mux-player
  id="epk-mux-player-static"
  playback-id=""
  stream-type="on-demand"
  playsinline
  style="width:100%; height:100%; display:block; border-radius:8px;">
</mux-player>
```

Elementet eksisterer i HTML-en fra start, med tomt `playback-id`. Dette er **kritisk forskjell** fra galleriet (der Mux-player opprettes dynamisk via `document.createElement`). Nettleseren har allerede initialisert Web Component-ens interne tilstand før avspilling starter.

### 2. `autoplay="any"` — aggressiv men grasiøs nedfall

```javascript
// Fra schema.ts — MuxPlayerConfigSchema:
autoPlay: z.enum(['off', 'muted', 'any']).optional().default('off')

// Fra generator.ts — openEpkPlayer():
if (mux.autoPlay === 'any' || mux.autoPlay === 'muted') {
    muxPlayer.setAttribute('autoplay', mux.autoPlay);
} else {
    muxPlayer.removeAttribute('autoplay');
}
```

| Verdi | Oppførsel |
|-------|-----------|
| `'off'` | Ingen autoplay — brukeren må trykke play |
| `'muted'` | Starter alltid dempet (iOS-trygt) |
| `'any'` | Prøver å spille med lyd; faller tilbake til dempet hvis blokkert |

`'any'` er nøkkelen. Mux Player håndterer nedfall internt: den prøver `play()` med lyd, og hvis nettleseren blokkerer det, starter den automatisk muted i stedet. Brukeren opplever alltid at videoen starter — enten med eller uten lyd.

### 3. Rekkefølge: `autoplay` settes **før** `playback-id`

```javascript
// Viktig: autoplay-attributtet settes FØRST
if (mux.autoPlay === 'any' || mux.autoPlay === 'muted') {
    muxPlayer.setAttribute('autoplay', mux.autoPlay);  // <-- FØR
}

// DERETTER settes playback-id — dette trigget lasting + avspilling
muxPlayer.setAttribute('playback-id', url);  // <-- ETTER
```

Når `playback-id` endres på et `<mux-player>` som allerede har `autoplay`-attributtet, tolker Mux-spilleren dette som "last denne videoen og start automatisk". Rekkefølgen er ikke tilfeldig.

### 4. `playsinline` — obligatorisk for iOS

```html
<mux-player ... playsinline ...>
```

Uten `playsinline` vil iOS tvinge videoen til fullskjerm-modus, eller nekte avspilling helt i inline-kontekster. Dette attributtet må alltid være der.

### 5. Brukerinteraksjons-kjedet — setTimeout innenfor aktiveringsvinduet

```javascript
window.openEpkPlayer = function(which, url, configStr) {
    // Kalt direkte fra onclick på et kort

    setTimeout(function() {
        // 805ms forsinkelse — fortsatt innenfor brukerens
        // aktiveringsvindu i de fleste mobilnettlesere
        muxPlayer.setAttribute('playback-id', url);
    }, 805);
};
```

Nettlesere tillater `play()` hvis det skjer som del av en brukerinteraksjon (eller nært nok etter). 805ms er bevisst — det gir tid til burn-animasjonen å fullføre, men er i de fleste tilfeller innenfor nettleserens "user activation" buffer (som typisk er 1–5 sekunder etter siste brukerinteraksjon).

### 6. Korrekt CDN-lasting som ES-modul

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@mux/mux-player/+esm"></script>
```

Mux Player er lastet som en ES-modul (`type="module"`), ikke CommonJS. Dette er det offisielt anbefalte oppsettet for Web Component i publisert HTML. Bruker `+esm`-endepunktet hos jsDelivr for korrekt MIME-type.

---

## Gallerikort (ikke-EPK): Dynamisk oppretting

For gallerikort (MediaGallerySection) opprettes Mux-spilleren dynamisk via JavaScript:

```javascript
const muxEl = document.createElement('mux-player');
muxEl.setAttribute('playback-id', url);
muxEl.setAttribute('stream-type', 'on-demand');
muxEl.setAttribute('playsinline', '');
muxEl.setAttribute('crossorigin', '');

var ap = mux.autoPlay || 'off';
if (ap === 'muted' || ap === 'any') {
    muxEl.setAttribute('autoplay', ap);
}
```

Her settes `playback-id` og `autoplay` i umiddelbar sekvens på et nytt element, direkte trigget av et korttrykk. Dette fungerer fordi `toggleGalleryItem` kalles fra en `click`-handler — dvs. et sant brukerinteraksjonsøyeblikk.

---

## Tilleggsattributter som konfigureres

```javascript
// Farger
if (mux.accentColor) muxPlayer.setAttribute('accent-color', mux.accentColor);
if (mux.primaryColor) muxPlayer.setAttribute('primary-color', mux.primaryColor);
if (mux.secondaryColor) muxPlayer.setAttribute('secondary-color', mux.secondaryColor);

// Avspillingsoppsett
if (mux.loop) muxPlayer.setAttribute('loop', '');
if (mux.startTime) muxPlayer.setAttribute('start-time', mux.startTime);

// CSS-variabler for å skjule kontroller
style.setProperty('--play-button',            mux.showPlayButton === false ? 'none' : '');
style.setProperty('--seek-backward-button',   mux.showSeekButtons === false ? 'none' : '');
style.setProperty('--seek-forward-button',    mux.showSeekButtons === false ? 'none' : '');
style.setProperty('--mute-button',            mux.showMuteButton === false ? 'none' : '');
style.setProperty('--captions-button',        mux.showCaptionsButton === false ? 'none' : '');
style.setProperty('--fullscreen-button',      mux.showFullscreenButton === false ? 'none' : '');
style.setProperty('--airplay-button',         mux.showAirplayButton === false ? 'none' : '');
style.setProperty('--cast-button',            mux.showCastButton === false ? 'none' : '');
style.setProperty('--playback-rate-button',   mux.showPlaybackRateButton === false ? 'none' : '');
style.setProperty('--volume-range',           mux.showVolumeRange === false ? 'none' : '');
style.setProperty('--time-range',             mux.showTimeRange === false ? 'none' : '');
style.setProperty('--time-display',           mux.showTimeDisplay === false ? 'none' : '');
style.setProperty('--duration-display',       mux.showDurationDisplay === false ? 'none' : '');

// Responsivt størrelse og posisjon (EPK-overlay)
var isMobile = window.innerWidth < 768;
mxWrap.style.width       = (isMobile ? mux.widthMobile : mux.widthDesktop) || '90vw';
mxWrap.style.aspectRatio = (isMobile ? mux.aspectRatioMobile : mux.aspectRatioDesktop) || '16/9';
mxWrap.style.transform   = 'translateX(' + ((isMobile ? mux.xOffsetMobile : mux.xOffsetDesktop) || 0) + '%)';
```

---

## Opprydding ved lukking

Spilleren stoppes ved å tømme `playback-id` (ikke ved å kalle `.pause()` eller fjerne elementet):

```javascript
muxPlayer.setAttribute('playback-id', ''); // CLEARS MUX VIDEO
```

Dette er den korrekte måten å stoppe og nullstille en `<mux-player>` Web Component på uten å ødelegge DOM-strukturen.

---

## Sjekkliste for å gjenskape mobil-autoplay med Mux

```
□ <mux-player> er et statisk element i HTML (ikke dynamisk createElement)
□ playsinline er satt som attributt
□ autoplay="any" settes FØR playback-id endres
□ CDN-lastes som <script type="module" .../+esm>
□ Konfigurasjonen skjer innenfor ~1 sekund etter en brukerinteraksjon
□ stream-type="on-demand" er satt (for VOD-innhold)
□ mux.autoPlay er satt til 'any' i MuxPlayerConfigSchema (ikke 'off')
```

---

## Relevante filer

| Fil | Hva |
|-----|-----|
| `server/schema.ts` linje 14–41 | `MuxPlayerConfigSchema` — alle konfigurerbare felter |
| `generator.ts` linje ~3888–3889 | Statisk HTML-element for EPK |
| `generator.ts` linje ~3941–3980 | `openEpkPlayer()` — konfigurasjonsfunksjon |
| `generator.ts` linje ~2503–2538 | Dynamisk Mux-oppsett for gallerikort |
| `generator.ts` linje ~4104 | CDN-importering via ES-modul |
| `src/components/MediaCustomizationControl.tsx` | UI for å endre `autoPlay` i editor |
