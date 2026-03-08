
(function() {
  // --- HOT RELOAD CLEANUP REGISTRY ---
  // In the persistent DOM preview, scripts are re-executed. We must clean up old listeners.
  if (window._kfCleanups) {
      window._kfCleanups.forEach(fn => { try { fn(); } catch(e){} });
  }
  window._kfCleanups = [];
  const addCleanup = (fn) => window._kfCleanups.push(fn);

  const handleLoad = (el) => {
    if (!el) return;
    el.classList.add('loaded');
  };

  const initMedia = () => {
    const media = document.querySelectorAll('img, video, mux-background-video');
    media.forEach(el => {
      if (el.tagName === 'IMG') {
        if (el.complete) handleLoad(el);
        else el.addEventListener('load', () => handleLoad(el));
      } else if (el.tagName === 'VIDEO' || el.tagName === 'MUX-BACKGROUND-VIDEO') {
        el.muted = true; // Crucial for iOS/mobile autoplay policy compliance

        const setRate = () => {
            if (el.id !== 'live-video' && typeof el.playbackRate !== 'undefined') {
                const rateMap = {"media-home-hero":100,"media-about-hero":100,"media-vault":100,"media-home-origin":100,"media-home-gallery":100,"media-about-story":100,"media-contact":100,"media-footer":100,"media-epk-hook":1,"media-epk-pitch":1,"media-epk-contact":1};
                el.playbackRate = rateMap[el.id] ?? 0.8;
            }
        };

        if (el.tagName === 'MUX-BACKGROUND-VIDEO' || el.readyState >= 2) {
            handleLoad(el);
            setRate();
        }
        el.addEventListener('loadeddata', () => { handleLoad(el); setRate(); });
        el.addEventListener('canplay', () => { handleLoad(el); setRate(); });
        
        // Force play nudge (Silent)
        if (typeof el.play === 'function') {
            const playPromise = el.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Autoplay prevented. Silent fail.
                    // Try simpler load-and-play fallback without logging
                    if (typeof el.load === 'function') el.load();
                    const p2 = el.play();
                    if(p2 !== undefined) p2.catch(() => {}); 
                });
            }
        }

        setTimeout(() => { 
            if (el.tagName === 'MUX-BACKGROUND-VIDEO' || (el.readyState !== undefined && el.readyState >= 1)) handleLoad(el); 
        }, 1000);
      }
      setTimeout(() => handleLoad(el), 3000); // Failsafe

      // IntersectionObserver for Performance (Mux Guidelines)
      // Pauses playback when user scrolls past the video to save CPU/Battery
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              if (typeof el.play === 'function') el.play().catch(() => {});
            } else {
              if (typeof el.pause === 'function') el.pause();
            }
          });
        }, { threshold: 0.1 });
        observer.observe(el);
        addCleanup(() => observer.disconnect());
      }
    });
  };

  const hideLoader = () => {
    const loader = document.getElementById('site-loader');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.pointerEvents = 'none';
        setTimeout(() => {
          loader.style.display = 'none';
        }, 850);
    }
  };

  // Immediate init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initMedia(); });
  } else {
    initMedia();
  }
  window.addEventListener('load', () => { initMedia(); hideLoader(); });
  setTimeout(hideLoader, 2500);

  const initInteractiveElements = () => {
    // Infinite Carousel (Optimized scroll version to prevent cutting off)
    class InfiniteCarousel {
      constructor(element) {
        this.container = element;
        this.isPaused = false;
        // Punkt 4: Desktop 20% raskere enn mobil (0.6 vs 0.5)
        this.speed = window.innerWidth < 768 ? 0.5 : 0.6;
        this._resumeTimeout = null;
        this.scrollPos = 0;
        this.init();
      }
      init() {
        if (!this.container) return;
        const items = Array.from(this.container.children);
        if (this.container.querySelectorAll('[aria-hidden="true"]').length > 0) return;

        items.forEach(item => {
          const clone = item.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          this.container.appendChild(clone);
        });
        
        const setPaused = (val, delay = 0) => {
            if (this._resumeTimeout) clearTimeout(this._resumeTimeout);
            if (val) {
                this.isPaused = true;
            } else {
                this._resumeTimeout = setTimeout(() => {
                    this.isPaused = false;
                    this.scrollPos = this.container.scrollLeft;
                    this._resumeTimeout = null;
                }, delay);
            }
        };
        // Expose setPaused so outsideClickHandler can trigger immediate resume
        this._setPaused = setPaused;

        this.container.addEventListener('mouseenter', () => setPaused(true));
        this.container.addEventListener('mouseleave', () => setPaused(false, 1000));
        this.container.addEventListener('touchstart', () => setPaused(true), {passive: true});
        this.container.addEventListener('touchend', () => setPaused(false, 2000), {passive: true});
        
        // Note: Removed scroll listener to prevent auto-pause loop
        // The isAutoScrolling flag already prevents interference with user scrolling

        this.scrollPos = this.container.scrollLeft;
        this.animate();
      }
      animate() {
        if (this._destroyed) return;
        const hasActiveSlide = this.container.querySelector('.is-active-slide');
        
        if (!this.isPaused && !hasActiveSlide) {
          this.scrollPos += this.speed;
          const halfWidth = this.container.scrollWidth / 2;
          
          if (this.scrollPos >= halfWidth) {
              this.scrollPos -= halfWidth;
          }
          
          this.isAutoScrolling = true;
          this.container.scrollLeft = this.scrollPos;
          // Release flag after browser has likely processed the scroll
          setTimeout(() => { this.isAutoScrolling = false; }, 20);
        } else {
            // While paused or playing video, keep internal scrollPos synced
            this.scrollPos = this.container.scrollLeft;
        }
        requestAnimationFrame(this.animate.bind(this));
      }
      destroy() {
          this._destroyed = true;
      }
    }
    const carousels = Array.from(document.querySelectorAll('[data-carousel="true"]')).map(el => new InfiniteCarousel(el));
    addCleanup(() => carousels.forEach(c => c.destroy()));

    // Inline Media Playback Logic
    window.toggleGalleryItem = function(buttonEl, id, type, url, configStr) {
        const item = buttonEl.closest('.media-gallery-item');
        const isCurrentlyActive = item.classList.contains('is-active-slide');
        
        // STRATEGY FIX: If already active, DO NOTHING. 
        // This allows clicks on the iframe/video to work without closing the slide.
        if (isCurrentlyActive) return;

        // 1. Reset all other items
        document.querySelectorAll('.media-gallery-item').forEach(el => {
            el.classList.remove('is-active-slide');
            el.classList.remove('is-spotify-active');
            el.classList.remove('is-audio-active');
            el.classList.remove('is-mux-playing');
            const embed = el.querySelector('.media-embed-container');
            if(embed) embed.innerHTML = ''; // Stop playback
        });

        if (!isCurrentlyActive) {
            // 2. Activate this item
            item.classList.add('is-active-slide');
            if(type === 'spotify') item.classList.add('is-spotify-active');
            if(type === 'audio' || url.match(/\.(mp3|wav|ogg)$/i)) item.classList.add('is-audio-active');
            
            const embedContainer = item.querySelector('.media-embed-container');
            
            let embedHtml = '';
            
            // Clear previous
            if(embedContainer) embedContainer.innerHTML = '';
            
            // Wrapper to hold the player
            const wrapper = document.createElement('div');
            wrapper.className = 'w-full h-full relative pointer-events-auto'; // Ensure it captures clicks

            if (type === 'spotify') {
                const isMobileV = window.innerWidth < 640;
                const scaleStyle = isMobileV
                    ? 'width:142%; height:142%; transform: scale(0.7); transform-origin: top left;'
                    : 'width:100%; height:100%;';

                // SoundCloud-fix (punkt 7): Detect SoundCloud URL regardless of type label
                if (url.includes('soundcloud.com')) {
                    const scEmbedUrl = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url) + '&color=%23ff5500&auto_play=true&hide_related=false&show_comments=false&show_user=true&show_reposts=false&visual=false';
                    wrapper.innerHTML = '<iframe src="' + scEmbedUrl + '" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media" loading="lazy" scrolling="no" style="border-radius:12px; overflow:hidden; ' + scaleStyle + '"></iframe>';
                } else {
                    // Standard Spotify embed
                    const trackId = url.split('/').pop().split('?')[0];
                    wrapper.innerHTML = '<iframe src="https://open.spotify.com/embed/track/' + trackId + '" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" scrolling="no" style="border-radius:12px; overflow:hidden; ' + scaleStyle + '"></iframe>';
                }
                embedContainer.appendChild(wrapper);
            } 
            else if (type === 'youtube') {
                const vidId = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop().split('?')[0];
                // STRATEGY CHANGE: Auto-play initialized on the primary user tap
                // User already tapped the card, so autoplay is permissible.
                const muteParam = '0'; // Start Unmuted
                wrapper.innerHTML = '<iframe src="https://www.youtube.com/embed/' + vidId + '?autoplay=1&mute=' + muteParam + '&playsinline=1&controls=1&rel=0&modestbranding=1&autohide=1&showinfo=0" class="w-full h-full border-0" allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
                embedContainer.appendChild(wrapper);
            } 
            else if (type === 'video' || url.match(/.(mp4|m4v|webm|ogv)$/i)) {
                // Local Video: Manual creation with aggressive unmuting
                const video = document.createElement('video');
                video.className = 'w-full h-full object-cover';
                video.controls = true;

                // Critical Attributes for iOS
                video.setAttribute('playsinline', '');
                video.setAttribute('webkit-playsinline', '');

                // Properties: Start MUTED for iOS autoplay policy
                video.muted = true;
                video.defaultMuted = true;
                video.volume = 1.0;
                video.preload = 'none'; // Don't preload gallery videos — load only on click

                // Responsive sources: if URL ends in -1080.mp4, add 480p for mobile
                const url480 = url.replace(/-1080(.(mp4|m4v|webm|mov))$/i, '-480$1');
                const hasResponsive = url480 !== url;
                if (hasResponsive) {
                    const src1080 = document.createElement('source');
                    src1080.src = url;
                    src1080.type = 'video/mp4';
                    src1080.media = '(min-width: 768px)';
                    const src480 = document.createElement('source');
                    src480.src = url480;
                    src480.type = 'video/mp4';
                    video.appendChild(src1080);
                    video.appendChild(src480);
                } else {
                    video.src = url;
                }

                wrapper.appendChild(video);
                embedContainer.appendChild(wrapper);
                
                // Play logic
                video.play().then(() => {
                    // Once playing, attempt to unmute
                    video.muted = false;
                    video.volume = 1.0;
                }).catch(e => {
                    // Fallback: If autoplay fails, show controls and ensure it's unmuted for manual play
                    video.muted = false; 
                });
            } 
            else if (type === 'mux' || (url && /^[a-zA-Z0-9_-]{15,45}$/.test(url) && !url.includes('.'))) {
                var config = {};
                try { if(configStr) config = JSON.parse(configStr); } catch(e){}
                var mux = config.mux || {};
                var isMobile = window.innerWidth < 768;

                wrapper.style.cssText = 'width:' + ((isMobile ? mux.widthMobile : mux.widthDesktop) || '100%') + '; aspect-ratio:' + ((isMobile ? mux.aspectRatioMobile : mux.aspectRatioDesktop) || '16/9') + '; transform: translateX(' + ((isMobile ? mux.xOffsetMobile : mux.xOffsetDesktop) || 0) + '%); position:relative; background:#000; margin:0 auto;';
                
                const muxEl = document.createElement('mux-player');
                muxEl.setAttribute('playback-id', url);
                muxEl.setAttribute('stream-type', 'on-demand');
                
                var ap = mux.autoPlay || 'off';
                if (ap === 'muted' || ap === 'any') {
                    muxEl.setAttribute('autoplay', ap);
                }
                
                muxEl.setAttribute('playsinline', '');
                muxEl.setAttribute('crossorigin', '');
                
                if (mux.accentColor) muxEl.setAttribute('accent-color', mux.accentColor);
                if (mux.primaryColor) muxEl.setAttribute('primary-color', mux.primaryColor);
                if (mux.secondaryColor) muxEl.setAttribute('secondary-color', mux.secondaryColor);
                if (mux.startTime) muxEl.setAttribute('start-time', mux.startTime);
                
                // Mux player CSS variables for controls
                muxEl.style.cssText = 'width:100%; height:100%; display:block;';
                muxEl.style.setProperty('--play-button', mux.showPlayButton === false ? 'none' : '');
                muxEl.style.setProperty('--seek-backward-button', mux.showSeekButtons === false ? 'none' : '');
                muxEl.style.setProperty('--seek-forward-button', mux.showSeekButtons === false ? 'none' : '');
                muxEl.style.setProperty('--mut-button', mux.showMuteButton === false ? 'none' : '');
                muxEl.style.setProperty('--captions-button', mux.showCaptionsButton === false ? 'none' : '');
                muxEl.style.setProperty('--fullscreen-button', mux.showFullscreenButton === false ? 'none' : '');
                muxEl.style.setProperty('--poster', 'none');

                
                wrapper.appendChild(muxEl);
                embedContainer.appendChild(wrapper);
            }
            else if (type === 'audio' || url.match(/.(mp3|wav|ogg)$/i)) {
  // Punkt 6 & 7: Custom play/pause knapp — ingen native controls
  // Audio-elementet er skjult; brukeren klikker på custom-knappen (user gesture i iframe)
  wrapper.className = 'w-full h-full relative pointer-events-auto flex items-center justify-center';

  const audio = document.createElement('audio');
  audio.src = url;
  audio.preload = 'auto';
  audio.style.display = 'none'; // Ingen native controls

  // Custom play/pause button — samme stil som play-overlay-knappen
  const btn = document.createElement('button');
  btn.className = 'audio-custom-btn';
  btn.setAttribute('aria-label', 'Play / Pause');

  const playSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="white" style="margin-left:3px"><path d="M8 5v14l11-7z"/></svg>';
  const pauseSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  btn.innerHTML = playSvg;

  audio.addEventListener('play', () => {
    item.classList.add('is-playing-audio');
    btn.innerHTML = pauseSvg;
  });
  audio.addEventListener('pause', () => {
    item.classList.remove('is-playing-audio');
    btn.innerHTML = playSvg;
  });
  audio.addEventListener('ended', () => {
    item.classList.remove('is-playing-audio');
    btn.innerHTML = playSvg;
  });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    // This click IS a user gesture — audio.play() is safe here
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  wrapper.appendChild(audio);
  wrapper.appendChild(btn);
  embedContainer.appendChild(wrapper);
  // First card click IS a user gesture — play immediately, no second tap needed
  audio.play().catch(() => {});
}
        }
    };

// Close active slides when clicking outside
const outsideClickHandler = (e) => {
  if (!e.target.closest('.media-gallery-item')) {
    document.querySelectorAll('.media-gallery-item').forEach(el => {
      el.classList.remove('is-active-slide');
      el.classList.remove('is-spotify-active');
      el.classList.remove('is-audio-active');
      el.classList.remove('is-playing-audio');
      el.classList.remove('is-mux-playing');
      const embed = el.querySelector('.media-embed-container');
      if (embed) embed.innerHTML = '';
    });
    // Punkt 5: Umiddelbar resume — kansel ventende delay og gjenoppta karusellen nå
    carousels.forEach(c => {
      if (c._setPaused) c._setPaused(false, 0);
    });
  }
};
document.addEventListener('click', outsideClickHandler);
addCleanup(() => document.removeEventListener('click', outsideClickHandler));

// Scroll Sequence Animation
class ScrollSequence {
  constructor(sticky) {
    this.sticky  = sticky;
    this.wrapper = sticky.parentElement;
    this.mediaWrap = sticky.querySelector('.seq-media-wrap');
    this.canvas  = sticky.querySelector('.scroll-seq-canvas');
    if (!this.canvas) return;
    this.ctx          = this.canvas.getContext('2d');
    this.blurTarget   = sticky.querySelector('.blur-target');
    this.dimOverlay   = sticky.querySelector('.seq-dim-overlay');
    this.blackout     = sticky.querySelector('.seq-blackout');
    this.heroText     = sticky.querySelector('.seq-hero-text');
    this.parallaxFraction = parseFloat(sticky.dataset.scrollSeqParallax || '7') / 100;
    const isMobile    = window.innerWidth < 768;
    this.frameCount   = 45;
    this.subfolder    = isMobile ? 'mobile' : 'desktop';
    this.frames       = new Array(this.frameCount).fill(null);
    this.loadedCount  = 0;
    this.ticking      = false;
    this.preload();
  }

  getProgress() {
    if (!this.wrapper) return 0;
    const rect = this.wrapper.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    if (scrollable <= 0) return 0;
    return Math.max(0, Math.min(1, -rect.top / scrollable));
  }

  preload() {
    let firstReady = false;
    for (let i = 0; i < this.frameCount; i++) {
      const img = new Image();
      const num = String(i + 1).padStart(2, '0');
      img.src = 'https://kraakefot.com/media/animations/about-hero-v5/' + this.subfolder + '/frame_' + num + '.webp';
      this.frames[i] = img;
      const idx = i;
      img.onload = () => {
        this.loadedCount++;
        if (!firstReady && idx === 0) { firstReady = true; this.requestUpdate(); }
        else this.requestUpdate();
      };
      img.onerror = () => { this.loadedCount++; this.frames[idx] = null; };
    }
  }

  resize() {
    const w = this.sticky.offsetWidth;
    const h = this.sticky.offsetHeight;
    if (w > 0 && h > 0 && (this.canvas.width !== w || this.canvas.height !== h)) {
      this.canvas.width  = w;
      this.canvas.height = h;
    }
  }

  draw() {
    if (!this.canvas || !this.ctx) return;
    const progress = this.getProgress();
    this.resize();

    // ── Frame selection ────────────────────────────────────────────────────
    const frameIndex = Math.min(this.frameCount - 1, Math.floor(progress * this.frameCount));
    let img = null;
    for (let j = frameIndex; j >= 0; j--) {
      const f = this.frames[j];
      if (f && f.complete && f.naturalWidth > 0) { img = f; break; }
    }
    if (img) {
      const pf = this.parallaxFraction;
      const w  = this.canvas.width, h = this.canvas.height;
      const isMobile = window.innerWidth < 768;

        // Absolute Default Scaling: Follow width only. User controls the rest via Zoom.
        const baseScale = this.canvas.width / img.naturalWidth;
      const zoom = parseFloat(this.sticky.dataset[isMobile ? 'zoomMobile' : 'zoomDesktop'] || 1);
      const xOff = parseFloat(this.sticky.dataset[isMobile ? 'xMobile' : 'xDesktop'] || 0);
      const yOff = parseFloat(this.sticky.dataset[isMobile ? 'yMobile' : 'yDesktop'] || 0);
      
      // ── Static zoom (Removed scroll-based zoom) ──────────────────────────
      const scale = baseScale * zoom;
      const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
      const parallaxPx = progress * h * pf;

      const userDx = (xOff / 100) * w;
      const userDy = (yOff / 100) * h;

      // Origin: 0 0 (Top Center) — User can offset down via Position Y
      const dx = (w - dw) / 2 + userDx;
      const dy = userDy - parallaxPx;

      this.ctx.clearRect(0, 0, w, h);
      this.ctx.drawImage(img, dx, dy, dw, dh);
    }

    if (this.mediaWrap) {
        // Remove individual scale — now handled in canvas
        this.mediaWrap.style.transform = '';
    }

    if (this.heroText) {
      // Fade in towards the end (8th to last frame is ~0.82 scroll progress)
      this.heroText.style.opacity = progress < 0.82 ? 0 : (progress - 0.82) / 0.18;
    }

    if (this.dimOverlay) {
      this.dimOverlay.style.opacity = progress < 0.8 ? (progress / 0.8) * (this.targetDim / 100) : (this.targetDim / 100);
    }

    if (this.blackout) {
      this.blackout.style.opacity = progress < 0.8 ? 0 : (progress - 0.8) / 0.2;
    }
  }

  requestUpdate() {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => { this.draw(); this.ticking = false; });
  }

  init() {
    this.scrollHandler = () => this.requestUpdate();
    this.resizeHandler = () => { if (this.canvas) this.canvas.width = 0; this.requestUpdate(); };
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    window.addEventListener('resize', this.resizeHandler, { passive: true });
    this.requestUpdate();
  }

  destroy() {
    if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler);
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
  }
}

// Scroll Blur FX Implementation
class ScrollBlur {
  constructor(element) {
    this.element = element;
    this.target = element.querySelector('.blur-target') || element.firstElementChild;
    // Fallback to first child if no specific target class is found, 
    // though sections usually have a wrapper div as first child for this purpose.

    if (!this.target) return;

    // Read config from data attributes or use defaults
    this.strength = parseFloat(element.dataset.blurStrength || '0');
    this.radius = parseFloat(element.dataset.blurRadius || '0');
    this.enabled = element.dataset.scrollBlur === 'true';

    if (!this.enabled) return;

    this.ticking = false;
    this.init();
  }

  init() {
    this.update();
    this.scrollHandler = () => this.requestUpdate();
    this.resizeHandler = () => this.requestUpdate();
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    window.addEventListener('resize', this.resizeHandler, { passive: true });
  }

  destroy() {
    window.removeEventListener('scroll', this.scrollHandler);
    window.removeEventListener('resize', this.resizeHandler);
  }

  requestUpdate() {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.update();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  update() {
    const rect = this.element.getBoundingClientRect();
    if (rect.height === 0) return; // Guard against zero height during layout

    const windowHeight = window.innerHeight;
    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = windowHeight / 2;

    const distanceFromCenter = Math.abs(elementCenter - viewportCenter);
    const maxDistance = windowHeight / 2;

    const normalizedDistance = Math.min(1, distanceFromCenter / maxDistance);

    let blurAmount = 0;
    if (normalizedDistance > this.radius) {
      const ramp = (normalizedDistance - this.radius) / (1 - this.radius);
      blurAmount = Math.min(this.strength, ramp * this.strength);
    }

    this.target.style.filter = 'blur(' + blurAmount.toFixed(2) + 'px)';
    this.target.style.willChange = 'filter';
  }
}

    // Initialize Scroll Sequences
    const scrollSeqs = Array.from(document.querySelectorAll('[data-scroll-seq]')).map(el => {
      const s = new ScrollSequence(el); s.init(); return s;
    });
    addCleanup(() => scrollSeqs.forEach(s => s.destroy()));

    // Initialize Blur FX
    const scrollBlurs = Array.from(document.querySelectorAll('[data-scroll-blur="true"]')).map(el => new ScrollBlur(el));
    addCleanup(() => scrollBlurs.forEach(b => b.destroy()));


    // Live Video Play Button Logic — Inline Player
    (function() {
      var livePlayBtn = document.getElementById('live-play-btn');
      var liveMuxPlayer = document.getElementById('live-mux-player');
      var liveSec = document.querySelector('.live-section');
      if (!livePlayBtn || !liveMuxPlayer || !liveSec) return;

      var isPlaying = false;

      function togglePlay(e) {
        if(e) e.stopPropagation();
        
        if (!isPlaying) {
          // Play and UNMUTE when huge central play button is clicked
          liveMuxPlayer.muted = false;
          liveMuxPlayer.play().then(function() {
            isPlaying = true;
            liveSec.classList.add('is-playing');
            var preview = document.querySelector('.live-preview-overlay');
            if (preview) preview.style.opacity = '0';
            
            livePlayBtn.innerHTML = '<div class="play-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg></div>';
            livePlayBtn.setAttribute('aria-label', 'Pause video');
          }).catch(function(err){ console.error('Play failed', err); });
        } else {
          // Pause
          liveMuxPlayer.pause();
          isPlaying = false;
          liveSec.classList.remove('is-playing');
          var preview = document.querySelector('.live-preview-overlay');
          if (preview) preview.style.opacity = '1';
          
          livePlayBtn.innerHTML = '<div class="play-icon animate-play-ring"><svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" class="ml-1"><path d="M8 5v14l11-7z" /></svg></div>';
          livePlayBtn.setAttribute('aria-label', 'Play video');
        }
      }

      livePlayBtn.addEventListener('click', togglePlay);

      // Auto-pause when scrolling past
      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting && isPlaying) {
            togglePlay(); // pauses it
          }
        });
      }, { threshold: 0.1 });
      obs.observe(liveSec);
      addCleanup(function() { obs.disconnect(); });
    })();

    // EPK Track Playback Logic
    window.toggleEpkTrack = function(cardEl, idx) {
        const audio = cardEl.querySelector('.epk-audio-element');
        if (!audio) return;
        const isPlaying = !audio.paused;
        document.querySelectorAll('.epk-track-card, .track-glitch-card').forEach(otherCard => {
            if (otherCard !== cardEl) {
                const otherAudio = otherCard.querySelector('.epk-audio-element');
                if (otherAudio && !otherAudio.paused) otherAudio.pause();
                otherCard.classList.remove('is-playing');
                const op = otherCard.querySelector('.play-icon'); if(op) op.style.display = '';
                const ou = otherCard.querySelector('.pause-icon'); if(ou) ou.style.display = 'none';
                const ow = otherCard.querySelector('.animate-play-ring'); if(ow) ow.style.display = 'block';
            }
        });
        const playIcon = cardEl.querySelector('.play-icon');
        const pauseIcon = cardEl.querySelector('.pause-icon');
        const pulse = cardEl.querySelector('.animate-play-ring');
        if (isPlaying) {
            audio.pause();
            cardEl.classList.remove('is-playing');
            if(playIcon) playIcon.style.display = '';
            if(pauseIcon) pauseIcon.style.display = 'none';
            if(pulse) pulse.style.display = 'block';
        } else {
            audio.play().catch(e => console.error('Playback failed', e));
            cardEl.classList.add('is-playing');
            if(playIcon) playIcon.style.display = 'none';
            if(pauseIcon) pauseIcon.style.display = 'block';
            if(pulse) pulse.style.display = 'none';
            audio.onended = () => {
                cardEl.classList.remove('is-playing');
                if(playIcon) playIcon.style.display = '';
                if(pauseIcon) pauseIcon.style.display = 'none';
                if(pulse) pulse.style.display = 'block';
            };
        }
    };

// Parallax & Header Optimization
let ticking = false;
let lastScrollY = window.scrollY;

const updateScrollProps = () => {
  document.documentElement.style.setProperty('--scroll-y', lastScrollY.toString());

  const header = document.getElementById('main-header');
  if (header) {
    const threshold = 100;
    const limit = 680;
    let op = 1;
    if (lastScrollY > threshold) {
      op = 1 - (lastScrollY - threshold) / (limit - threshold);
      if (op < 0) op = 0;
    }
    header.style.opacity = op;
    header.style.pointerEvents = op < 0.1 ? 'none' : 'auto';
  }
  ticking = false;
};

const mainScrollListener = () => {
  lastScrollY = window.scrollY;
  if (!ticking) {
    window.requestAnimationFrame(updateScrollProps);
    ticking = true;
  }
};

window.addEventListener('scroll', mainScrollListener, { passive: true });
addCleanup(() => window.removeEventListener('scroll', mainScrollListener));

// Pre-sync state to prevent jump on first scroll
updateScrollProps();

// Manual loader hide fallback
const ldr = document.getElementById('site-loader');
if (ldr) ldr.addEventListener('click', hideLoader);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInteractiveElements);
  } else {
    initInteractiveElements();
  }
}) ();
