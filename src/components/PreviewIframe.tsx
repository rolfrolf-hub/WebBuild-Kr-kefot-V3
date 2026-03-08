import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BrandState } from '../types';
import { generateCSSVariableOverrides, generatePageHTML, generateScriptJS } from './PublishModalComponents/generator';

interface PreviewIframeProps {
  brandData: BrandState;
  activePage: 'home' | 'about' | 'contact' | 'vault' | 'epk';
  deviceWidth: number;
  deviceHeight: number;
}

export const PreviewIframe: React.FC<PreviewIframeProps> = ({
  brandData,
  activePage,
  deviceWidth,
  deviceHeight,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rendererReadyRef = useRef(false);
  const iframeReadyRef = useRef(false);
  const lastPageRef = useRef(activePage);
  const lastDeviceWidthRef = useRef(deviceWidth);
  const isFirstRenderRef = useRef(true);
  const lastBrandDataRef = useRef<BrandState>(brandData);

  // Queue for updates that arrive before the iframe is ready
  const pendingUpdatesRef = useRef<any[]>([]);
  const lastScrollYRef = useRef(0);

  // Map of data-text-key to BrandData path
  const getTextContent = useCallback((key: string, data: BrandState): string => {
    if (!data?.sections) return '';
    const s = data.sections;
    switch (key) {
      case 'homeHeadline': return s.home.hero.headline;
      case 'homeSubheadline': return s.home.hero.subheadline;
      case 'homeSpotifyTitle': return s.home.spotify.title;
      case 'homeOriginTagline': return s.home.origin.tagline;
      case 'homeOriginHeadline': return s.home.origin.headline;
      case 'homeOriginText': return s.home.origin.text;
      case 'homeOriginDescription': return s.home.origin.description;
      case 'homeLiveTagline': return s.home.live.tagline;
      case 'homeLiveHeadline': return s.home.live.headline;
      case 'homeLiveYoutubeText': return s.home.live.youtubeText;
      case 'aboutHeroHeadline': return (s.about.hero as any)?.headline ?? '';
      case 'aboutHeroSubheadline': return (s.about.hero as any)?.subheadline ?? '';
      case 'aboutHeroIntroText': return (s.about.hero as any)?.introText ?? '';
      case 'aboutStoryTagline': return (s.about.story as any)?.tagline ?? '';
      case 'story': return (s.about.story as any)?.text ?? '';
      case 'aboutStoryHeadline': return (s.about.story as any)?.headline ?? '';
      case 'aboutStoryBody': return (s.about.story as any)?.body ?? '';
      case 'aboutMissionTagline': return (s.about.mission as any)?.tagline ?? '';
      case 'mission': return (s.about.mission as any)?.text ?? '';
      case 'aboutMissionHeadline': return (s.about.mission as any)?.headline ?? '';
      case 'aboutMissionBody': return (s.about.mission as any)?.body ?? '';
      case 'vaultHeadline': return s.vault?.headline || '';
      case 'vaultDescription': return s.vault?.description || '';
      case 'contactHeadline': return s.contact.headline;
      case 'contactSubheadline': return (s.contact as any)?.subheadline ?? '';
      case 'homeFooterContactText': return s.footer?.contactText || '';
      case 'homeFooterTagline': return s.footer?.tagline || '';
      case 'homeFooterUpperTagline': return s.footer?.upperTagline || '';
      // EPK text keys
      case 'epkHookHeadline': return data.companyName || '';
      case 'epkHookTagline': return s.epk?.hook.tagline ?? '';
      case 'epkPitchTagline': return s.epk?.pitch.tagline ?? '';
      case 'epkPitchBio': return s.epk?.pitch.bioText ?? '';
      case 'epkMediaTagline': return s.epk?.media.tagline ?? '';
      case 'epkTracksHeadline': return s.epk?.media.tracksHeadline ?? '';
      case 'epkVideoHeadline': return s.epk?.media.videoHeadline ?? '';
      case 'epkSpotifyHeadline': return s.epk?.media.spotifyHeadline ?? '';
      case 'epkPressTagline': return s.epk?.press.tagline ?? '';
      case 'epkContactTagline': return s.epk?.contact.tagline ?? '';
      case 'epkContactHeadline': return s.epk?.contact.headline ?? '';
      case 'epkContactEmail': return s.epk?.contact.email ?? '';
      case 'epkContactPhone': return s.epk?.contact.phone ?? '';
      case 'menuLogoName': return data.menuLogoName || '';
      case 'menuTagline': return data.menuTagline || '';
      case 'navHome': return data.navNames.home || '';
      case 'navAbout': return data.navNames.about || '';
      case 'navContact': return data.navNames.contact || '';
      case 'navVault': return data.navNames.vault || '';
      case 'navEpk': return data.navNames.epk || '';
      default: return '';
    }
  }, []);

  const KNOWN_TEXT_KEYS = [
    'homeHeadline', 'homeSubheadline', 'homeSpotifyTitle',
    'homeOriginTagline', 'homeOriginHeadline', 'homeOriginText', 'homeOriginDescription',
    'homeLiveTagline', 'homeLiveHeadline', 'homeLiveYoutubeText',
    'aboutHeroHeadline', 'aboutHeroSubheadline', 'aboutHeroIntroText', 'aboutStoryTagline', 'story', 'aboutStoryHeadline', 'aboutStoryBody',
    'aboutMissionTagline', 'mission', 'aboutMissionHeadline', 'aboutMissionBody',
    'vaultHeadline', 'vaultDescription',
    'contactHeadline', 'contactSubheadline',
    'homeFooterContactText', 'homeFooterTagline', 'homeFooterUpperTagline',
    // EPK
    'epkHookHeadline', 'epkHookTagline', 'epkPitchTagline', 'epkPitchBio',
    'epkMediaTagline', 'epkTracksHeadline', 'epkVideoHeadline', 'epkSpotifyHeadline', 'epkPressTagline', 'epkContactTagline', 'epkContactHeadline', 'epkContactEmail', 'epkContactPhone',
    'menuLogoName', 'menuTagline', 'navHome', 'navAbout', 'navContact', 'navVault', 'navEpk'
  ];

  const sendMessage = useCallback((msg: any) => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow && (rendererReadyRef.current || iframeReadyRef.current)) {
      iframe.contentWindow.postMessage(msg, '*');
    } else {
      pendingUpdatesRef.current.push(msg);
    }
  }, []);

  /**
   * FULL RELOAD — Generates HTML and sends to renderer
   */
  const handleFullReload = useCallback(() => {
    try {
      let html = generatePageHTML(activePage, brandData, false, true);
      const js = generateScriptJS(brandData);

      // Viewport fix (still needed for the shell, though render.html has its own)
      html = html.replace(/<meta\s+name=['"]viewport['"][^>]*>/gi, '');
      const viewportTag = `<meta name="viewport" content="width=${deviceWidth}, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`;
      html = html.replace('<head>', `<head>${viewportTag}`);

      // Inline JS
      if (js) {
        html = html.replace('</body>', `<script>${js}</script></body>`);
      }

      // Preview-specific CSS
      const previewCSS = `
        <style>
          #site-loader { display: none !important; }
          html, body { margin: 0; padding: 0; overflow-x: clip; width: 100%; min-height: 100%; height: auto !important; }
          section, div[class*="section"] { backface-visibility: hidden; transform: translateZ(0); }
        </style>
      `;
      html = html.replace('</head>', `${previewCSS}</head>`);

      // NOTE: We no longer inject the BRIDGE_CODE here because it's now
      // part of the persistent render.tsx bundle.

      iframeReadyRef.current = false;
      sendMessage({ type: 'SET_CONTENT', html });

    } catch (error) {
      console.error('[PreviewIframe] Generation failed:', error);
    }
  }, [brandData, activePage, deviceWidth, sendMessage]);

  // Handle messages from the iframe (both render shell and injected bridge)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // Handshake from src/render.tsx
      if (e.data?.type === 'RENDERER_READY') {
        rendererReadyRef.current = true;
        while (pendingUpdatesRef.current.length > 0) {
          const msg = pendingUpdatesRef.current.shift();
          sendMessage(msg);
        }
      }

      // Handshake from the bridge script injected in the generated page
      if (e.data?.type === 'IFRAME_READY') {
        iframeReadyRef.current = true;

        // Restore scroll if needed
        if (lastScrollYRef.current > 0) {
          sendMessage({ type: 'RESTORE_SCROLL', scrollY: lastScrollYRef.current });
        }

        // Flush any remaining pending updates
        while (pendingUpdatesRef.current.length > 0) {
          const msg = pendingUpdatesRef.current.shift();
          sendMessage(msg);
        }
      }

      if (e.data?.type === 'SCROLL_POSITION') {
        lastScrollYRef.current = e.data.scrollY;
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendMessage]);

  /**
   * MAIN EFFECT — Decides between full render or hot update
   */
  useEffect(() => {
    const pageChanged = activePage !== lastPageRef.current;
    const deviceChanged = deviceWidth !== lastDeviceWidthRef.current;
    const isFirstRender = isFirstRenderRef.current;

    const currentStyleKeys = Object.keys(brandData.textStyles || {}).sort().join(',');
    const previousStyleKeys = Object.keys(lastBrandDataRef.current?.textStyles || {}).sort().join(',');
    const hasStyleStructureChanged = currentStyleKeys !== previousStyleKeys;

    // Structural hash for detecting when we REALLY need a full HTML replacement
    const getStructuralHash = (d: BrandState) => {
      if (!d || !d.sections) return '';
      const s = d.sections;
      // We exclude video URLs from the structural hash if we can patch them
      return JSON.stringify([
        s.home?.spotify?.items, d.pageVisibility, d.navNames, d.menuLogoName
      ]);
    };

    const hasStructuralChanged = getStructuralHash(brandData) !== getStructuralHash(lastBrandDataRef.current);

    if (isFirstRender || pageChanged || deviceChanged || hasStyleStructureChanged || hasStructuralChanged) {
      lastPageRef.current = activePage;
      lastDeviceWidthRef.current = deviceWidth;
      isFirstRenderRef.current = false;
      lastBrandDataRef.current = brandData;
      handleFullReload();
    } else {
      // Hot Update
      const textUpdates: Record<string, string> = {};
      KNOWN_TEXT_KEYS.forEach(key => {
        const newVal = getTextContent(key, brandData);
        const oldVal = getTextContent(key, lastBrandDataRef.current);
        if (newVal !== oldVal) textUpdates[key] = newVal;
      });

      const vars = generateCSSVariableOverrides(brandData, deviceWidth);

      if (Object.keys(textUpdates).length > 0) {
        sendMessage({ type: 'HOT_UPDATE_TEXT', updates: textUpdates });
      }
      sendMessage({ type: 'HOT_UPDATE', vars });

      // Targeted Patching for Video/Image URLs (avoids full SET_CONTENT reload)
      const s = brandData.sections;
      const ls = lastBrandDataRef.current.sections;

      // Helper: resolve a URL to its final src for patching
      const resolveMediaUrl = (url: string): string => {
        if (!url) return '';
        // Mux playback ID or mux.com URL → use HLS src attribute
        if (url.includes('mux.com') || /^[a-zA-Z0-9_-]{15,45}$/.test(url)) {
          const muxId = url.split('/').pop()!.split('.')[0];
          return `https://stream.mux.com/${muxId}.m3u8`;
        }
        return url;
      };

      // Patch helper: send PATCH_ATTRIBUTE if URL changed
      const patchMedia = (newUrl: string | undefined, oldUrl: string | undefined, selector: string) => {
        if (newUrl !== oldUrl && newUrl !== undefined) {
          sendMessage({
            type: 'PATCH_ATTRIBUTE',
            selector,
            attribute: 'src',
            value: resolveMediaUrl(newUrl),
          });
        }
      };

      // Home page sections
      patchMedia(s.home?.hero?.videoUrl, ls.home?.hero?.videoUrl, '#media-home-hero');
      patchMedia(s.home?.spotify?.imageUrl, ls.home?.spotify?.imageUrl, '#media-home-gallery');
      patchMedia(s.home?.origin?.imageUrl, ls.home?.origin?.imageUrl, '#media-home-origin');

      // About page sections
      patchMedia(s.about?.hero?.videoUrl as string | undefined,
        ls.about?.hero?.videoUrl as string | undefined, '#media-about-hero');
      patchMedia((s.about?.story as any)?.imageUrl,
        (ls.about?.story as any)?.imageUrl, '#media-about-story');

      // Other pages
      patchMedia(s.vault?.videoUrl, ls.vault?.videoUrl, '#media-vault');
      patchMedia(s.contact?.videoUrl as string | undefined,
        ls.contact?.videoUrl as string | undefined, '#media-contact');

      // Footer (shared across all pages)
      patchMedia(s.footer?.videoUrl, ls.footer?.videoUrl, '#media-footer');

      // EPK sections
      patchMedia(s.epk?.hook?.imageUrl, ls.epk?.hook?.imageUrl, '#media-epk-hook');
      patchMedia(s.epk?.pitch?.imageUrl, ls.epk?.pitch?.imageUrl, '#media-epk-pitch');
      patchMedia(s.epk?.contact?.imageUrl, ls.epk?.contact?.imageUrl, '#media-epk-contact');

      lastBrandDataRef.current = brandData;
    }
  }, [brandData, activePage, deviceWidth, handleFullReload, getTextContent, sendMessage]);

  return (
    <iframe
      ref={iframeRef}
      src="/render.html"
      style={{
        width: `${deviceWidth}px`,
        height: `${deviceHeight}px`,
        border: 'none',
        display: 'block',
        background: 'black',
      }}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-top-navigation-by-user-activation"
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      title="Preview"
    />
  );
};
