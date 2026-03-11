import React, { useState, useCallback, useEffect, useRef, memo, Suspense } from 'react';
import { BrandState, ProjectState } from './types';
import { SEOControl } from './components/SEOControl';
import { TypographyControl } from './components/TypographyControl';
import { GlobalSaveButton } from './components/GlobalSaveButton';
import { CollapsibleSection } from './components/CollapsibleSection';
import { GlobalVisualsControl } from './components/GlobalVisualsControl';
import { GlobalTypographyPanel } from './components/controls/GlobalTypographyPanel';
import { SectionErrorBoundary } from './components/SectionErrorBoundary';
import { PresetButton } from './components/PresetButton';
import projectDefaults from './data/projectDefaults.json';

// ---------------------------------------------------------------------------
// LAZY IMPORTS — only load when first needed, not at startup
// ---------------------------------------------------------------------------
const PublishModal = React.lazy(async () => {
  const mod = await import('./components/PublishModal');
  return { default: mod.PublishModal };
});

// Section control panels — loaded on first visit to each page tab
const HeroControls = React.lazy(async () => {
  const mod = await import('./components/controls/sections/HeroControls');
  return { default: mod.HeroControls };
});
const GalleryControls = React.lazy(async () => {
  const mod = await import('./components/controls/sections/GalleryControls');
  return { default: mod.GalleryControls };
});
const OriginControls = React.lazy(async () => {
  const mod = await import('./components/controls/sections/OriginControls');
  return { default: mod.OriginControls };
});
const LiveControls = React.lazy(async () => {
  const mod = await import('./components/controls/sections/LiveControls');
  return { default: mod.LiveControls };
});
const FooterControls = React.lazy(async () => {
  const mod = await import('./components/controls/sections/FooterControls');
  return { default: mod.FooterControls };
});
const AboutHeroControls = React.lazy(async () => {
  const mod = await import('./components/controls/sections/AboutHeroControls');
  return { default: mod.AboutHeroControls };
});
const AboutStoryControls = React.lazy(async () => {
  const mod = await import('./components/controls/sections/AboutStoryControls');
  return { default: mod.AboutStoryControls };
});
const AboutMissionControls = React.lazy(async () => {
  const mod = await import('./components/controls/sections/AboutMissionControls');
  return { default: mod.AboutMissionControls };
});
const ContactControls = React.lazy(async () => {
  const mod = await import('./components/controls/sections/ContactControls');
  return { default: mod.ContactControls };
});
const EpkControls = React.lazy(async () => {
  const mod = await import('./components/controls/sections/EpkControls');
  return { default: mod.EpkControls };
});

// ---------------------------------------------------------------------------

const STORAGE_KEY = 'kraakefot-v1';
const OLD_STORAGE_KEY = 'kraakefot-data-v2-flat-v5-debug-fix';

// Minimal skeleton shown while a lazy control panel is loading
const ControlFallback: React.FC = () => (
  <div className="space-y-2 pt-2">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-8 bg-zinc-900 rounded animate-pulse" />
    ))}
  </div>
);

// --- UTILITY: DEBOUNCE HOOK ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const deepMerge = (target: any, source: any): any => {
  const output = { ...target };
  const isObject = (item: any) => (item && typeof item === 'object' && !Array.isArray(item));

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const srcVal = source[key];
      // SAFETY: Skip null/undefined values to prevent wiping defaults
      if (srcVal === null || srcVal === undefined) return;

      if (isObject(srcVal)) {
        if (!(key in target)) {
          Object.assign(output, { [key]: srcVal });
        } else {
          output[key] = deepMerge(target[key], srcVal);
        }
      } else {
        Object.assign(output, { [key]: srcVal });
      }
    });
  }
  return output;
};

const INITIAL_DEFAULTS: ProjectState = projectDefaults as unknown as ProjectState;

// --- MEMOIZED PREVIEW COMPONENT ---
// Acts as a "Vault" to prevent iframe reloading during React updates
const PreviewFrame = memo(({
  iframeRef,
  onLoad
}: {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onLoad: () => void;
}) => {
  return (
    <div className="flex-1 bg-zinc-900 relative flex flex-col overflow-hidden">
      <iframe
        ref={iframeRef}
        src="/preview.html"
        title="Live Preview"
        onLoad={onLoad}
        className="w-full h-full bg-zinc-900"
        style={{ border: 'none' }}
      />
    </div>
  );
}, () => true);

const App: React.FC = () => {
  const [brandData, setBrandData] = useState<ProjectState>(INITIAL_DEFAULTS);
  const [activePage, setActivePage] = useState<'home' | 'about' | 'contact' | 'epk'>('home');
  const [activeSection, setActiveSection] = useState<string | null>('home-hero');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishModalTab, setPublishModalTab] = useState<'download' | 'deploy'>('download');
  const [directDeployStatus, setDirectDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [directDeployMessage, setDirectDeployMessage] = useState('');
  // Per-page deploy: null = all pages, otherwise only the listed pages
  const [deployPageFilter, setDeployPageFilter] = useState<string[] | null>(null);
  const [isLiveEnabled, setIsLiveEnabled] = useState(false);

  // Debounce: Wait 80ms after typing before updating preview (near-instant)
  const debouncedBrandData = useDebounce(brandData, 80);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Stable ref for reading latest data inside event listeners without stale closures
  const latestDataRef = useRef({ brandData: debouncedBrandData, activePage });

  // Ref for the current (non-debounced) brandData — used for beforeunload flush
  const currentBrandDataRef = useRef(brandData);

  // Timer refs — stored so we can clear them on unmount (#7)
  const iframeLoadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deployTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    latestDataRef.current = { brandData: debouncedBrandData, activePage };
  }, [debouncedBrandData, activePage]);

  useEffect(() => {
    currentBrandDataRef.current = brandData;
  }, [brandData]);

  // Flush latest data to localStorage when page is closed (#1 safety net)
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentBrandDataRef.current));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Cleanup all timers on unmount (#7)
  useEffect(() => {
    return () => {
      if (iframeLoadTimerRef.current) clearTimeout(iframeLoadTimerRef.current);
      if (deployTimerRef.current) clearTimeout(deployTimerRef.current);
    };
  }, []);

  // --- Data Loading ---
  useEffect(() => {
    let savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
      const oldData = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldData) {
        try {
          JSON.parse(oldData);
          localStorage.setItem(STORAGE_KEY, oldData);
          savedData = oldData;
        } catch (e) {
          console.warn('Old data corrupted');
        }
      }
    }
    if (savedData) {
      try {
        let merged = deepMerge(INITIAL_DEFAULTS, JSON.parse(savedData));

        // --- CRITICAL SAFETY CHECKS ---
        // Ensure ALL vital structures exist to prevent crashes
        if (!merged.sections) merged.sections = INITIAL_DEFAULTS.sections;
        else {
          const requiredSections: (keyof typeof INITIAL_DEFAULTS.sections)[] = ['home', 'about', 'contact', 'footer'];
          requiredSections.forEach(sKey => {
            if (!merged.sections[sKey]) merged.sections[sKey] = INITIAL_DEFAULTS.sections[sKey] as any;
          });
          const vis = merged.pageVisibility || { home: true, about: true, contact: true, epk: false };
          if (vis.epk && !merged.sections.epk) {
            merged.sections.epk = INITIAL_DEFAULTS.sections.epk;
          }
        }
        if (!merged.textStyles) merged.textStyles = INITIAL_DEFAULTS.textStyles;
        if (!merged.seo) merged.seo = INITIAL_DEFAULTS.seo;
        if (!merged.socials) merged.socials = INITIAL_DEFAULTS.socials;

        // --- PAGE NAME MIGRATION ---
        // Force update the old names to the new names if they still exist in local storage
        if (merged.navNames) {
          if (merged.navNames.home === "Hjem") merged.navNames.home = "KRÅKEFOT";
          if (merged.navNames.about === "Om Oss" || merged.navNames.about === "Om oss") merged.navNames.about = "MADE IN NORWAY";
          if (merged.navNames.contact === "Kontakt") merged.navNames.contact = "KONTAKT";
        }

        setBrandData(merged);
      } catch (e) { console.error(e); }
    }
  }, []);

  // updateBrand: defers localStorage write to idle time so UI interactions are never blocked (#1)
  const updateBrand = useCallback((newData: Partial<BrandState>) => {
    setBrandData(prev => {
      const merged = deepMerge(prev, newData);
      const updated = { ...merged, meta: { ...prev.meta, lastModified: Date.now() } };
      // Defer the JSON.stringify + storage write to browser idle time
      // so slider drags / text input never stutter
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)));
      } else {
        setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)), 0);
      }
      return updated;
    });
  }, []);

  const handleClearData = () => {
    if (confirm("Are you sure you want to reset all data?")) {
      localStorage.removeItem(STORAGE_KEY);
      setBrandData(INITIAL_DEFAULTS);
      window.location.reload();
    }
  };

  // handleIframeLoad: timer stored in ref so it can be cleared on unmount (#7)
  const handleIframeLoad = useCallback(() => {
    if (iframeLoadTimerRef.current) clearTimeout(iframeLoadTimerRef.current);
    iframeLoadTimerRef.current = setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'UPDATE',
          payload: latestDataRef.current
        }, window.location.origin); // #8: use explicit origin instead of '*'
      }
    }, 50);
  }, []);

  // --- "THE GHOST PROTOCOL" (Smooth Sync) ---
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE',
        payload: { brandData: debouncedBrandData, activePage }
      }, window.location.origin); // #8
    }
  }, [debouncedBrandData, activePage]);


  // --- EVENT LISTENER: REVERSE SYNC (Mobile/Desktop Switching) ---
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 1. Device Changed (Mobile/Desktop Toggle)
      if (event.data.type === 'DEVICE_CHANGED') {
        const { isMobile } = event.data.payload;
        setBrandData(prev => {
          if (prev.isMobilePreview === isMobile) return prev;
          return { ...prev, isMobilePreview: isMobile };
        });
      }

      // 2. Scroll Sync (Clicking element in preview -> Scrolls Editor)
      if (event.data.type === 'SCROLL_TO_CONTROL') {
        const { sectionId } = event.data.payload;
        setActiveSection(sectionId);
        const el = document.getElementById(`control-${sectionId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // 3. Device Change Notification from Preview
      if (event.data.type === 'DEVICE_CHANGED' && event.data.payload) {
        const { isMobile } = event.data.payload;
        if ((latestDataRef.current as any)?.isMobilePreview !== isMobile) {
          updateBrand({ isMobilePreview: isMobile });
        }
      }

      // 4. Preview Ready (Initial Handshake)
      if (event.data.type === 'PREVIEW_READY') {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'INIT',
            payload: latestDataRef.current
          }, window.location.origin); // #8
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);


  const scrollToPreviewSection = (sectionId: string) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SCROLL_TO_SECTION',
        payload: { sectionId }
      }, window.location.origin); // #8
    }
  };

  const handleDirectDeploy = async (isTestMode = false) => {
    if (directDeployStatus === 'deploying') return;

    setDirectDeployStatus('deploying');
    setDirectDeployMessage(isTestMode ? 'Starting test push to /v3...' : 'Starting live push...');

    try {
      // #3: Dynamic import — generator only loads when Deploy is actually clicked
      const {
        generatePageHTML,
        generateHtaccess,
        generateScriptJS,
        generateSitemap,
        generateRobots,
      } = await import('./components/PublishModalComponents/generator');

      // Collect compiled CSS from Vite-injected <style> elements in the editor DOM
      const collectCompiledCSS = async (): Promise<string> => {
        const parts: string[] = [];
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            if (sheet.href) {
              const text = await fetch(sheet.href).then(r => r.text());
              parts.push(text);
            } else if (sheet.ownerNode instanceof HTMLStyleElement) {
              const content = sheet.ownerNode.textContent || '';
              if (content.length > 200) parts.push(content);
            }
          } catch { /* cross-origin sheets skipped */ }
        }
        return parts.join('\n');
      };

      const targetUrl = brandData.serverBaseUrl || 'https://kraakefot.com';
      const secretKey = brandData.ftpPass || "tryte-999-en-Roste-Draes";
      const baseUrl = targetUrl.endsWith('/') ? targetUrl : `${targetUrl}/`;
      const endpoint = `${baseUrl}deploy.php`;

      // Build file list — respects deployPageFilter (null = all pages)
      const vis = brandData.pageVisibility || { home: true, about: true, contact: true, epk: false };
      const isFiltered = deployPageFilter !== null && deployPageFilter.length > 0;
      const wantsPage = (page: string) => !isFiltered || deployPageFilter!.includes(page);

      // Shared assets are ALWAYS deployed (CSS/JS affect all pages, .htaccess is server config)
      const files: { name: string; content: string }[] = [
        { name: 'style.css', content: await collectCompiledCSS() },
        { name: 'script.js', content: generateScriptJS(brandData) },
        { name: '.htaccess', content: generateHtaccess() },
      ];

      // Page HTMLs — only include pages that pass the filter
      if (wantsPage('home')) files.push({ name: 'index.html', content: generatePageHTML('home', brandData) });
      if (wantsPage('about') && vis.about !== false) files.push({ name: 'about.html', content: generatePageHTML('about', brandData) });
      if (wantsPage('contact') && vis.contact !== false) files.push({ name: 'contact.html', content: generatePageHTML('contact', brandData) });
      if (wantsPage('epk') && vis.epk) files.push({ name: 'epk.html', content: generatePageHTML('epk', brandData) });

      // Sitemap / robots only when deploying all pages (or home is selected as the canonical entry point)
      if (!isFiltered || wantsPage('home')) {
        files.push({ name: 'sitemap.xml', content: generateSitemap(brandData) });
        files.push({ name: 'robots.txt', content: generateRobots(brandData) });
      }

      for (const f of files) {
        const remoteFilename = isTestMode ? `v3/${f.name}` : f.name;
        setDirectDeployMessage(`Pushing ${remoteFilename}...`);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: secretKey,
            filename: remoteFilename,
            content: f.content
          })
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.error || `Failed to save ${f.name}`);
        }
      }

      setDirectDeployStatus('success');
      setDirectDeployMessage(isTestMode ? 'Test version pushed to /v3!' : 'Changes pushed successfully!');

      // #7: Store timer ref so it can be cleared on unmount
      if (deployTimerRef.current) clearTimeout(deployTimerRef.current);
      deployTimerRef.current = setTimeout(() => {
        setDirectDeployStatus('idle');
        setDirectDeployMessage('');
      }, 3000);

    } catch (e: any) {
      console.error("Direct deploy error:", e);
      setDirectDeployStatus('error');
      setDirectDeployMessage(`Push failed: ${e.message}`);

      if (deployTimerRef.current) clearTimeout(deployTimerRef.current);
      deployTimerRef.current = setTimeout(() => {
        setDirectDeployStatus('idle');
        setDirectDeployMessage('');
      }, 5000);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">

      {/* LEFT PANEL */}
      <div className="w-[420px] flex-shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-950 z-20 shadow-2xl">
        <div className="h-14 flex items-center px-6 border-b border-zinc-800 bg-zinc-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <span className="font-bold tracking-widest text-xs text-zinc-400 uppercase">Kråkefot Builder</span>
          </div>
          <div className="ml-auto flex gap-2">
            <div className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800 text-[9px] uppercase font-bold text-zinc-500">
              {brandData.isMobilePreview ? '📱 Mobile Mode' : '🖥️ Desktop Mode'}
            </div>
            <button onClick={handleClearData} className="text-[10px] text-red-900 hover:text-red-500 transition-colors uppercase font-bold">Reset</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="p-6 space-y-8">
            {/* Page Selector */}
            <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              {(['home', 'about', 'contact', 'epk'] as const).map((page) => {
                const vis = brandData.pageVisibility || { home: true, about: true, contact: true, epk: false };
                const isVisible = vis[page] ?? (page === 'epk' ? false : true);
                return (
                  <button
                    key={page}
                    onClick={() => setActivePage(page)}
                    className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-md transition-all flex items-center justify-center gap-1 ${activePage === page
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : isVisible
                        ? 'text-zinc-500 hover:text-zinc-300'
                        : 'text-zinc-700 hover:text-zinc-500'
                      }`}
                  >
                    {!isVisible && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-50">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                    {brandData.navNames[page] || page}
                  </button>
                );
              })}
            </div>

            {/* Global Settings */}
            <CollapsibleSection
              title="⚙️ Global Settings"
              sectionId="global-settings"
              isActive={activeSection === 'global-settings'}
              onClick={() => setActiveSection(activeSection === 'global-settings' ? null : 'global-settings')}
            >
              <div className="grid grid-cols-1 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Company Name</label>
                  <input
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                    value={brandData.companyName}
                    onChange={(e) => updateBrand({ companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Menu Logo Text</label>
                  <input
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                    value={brandData.menuLogoName}
                    onChange={(e) => updateBrand({ menuLogoName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Menu Tagline</label>
                  <input
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                    value={brandData.menuTagline}
                    onChange={(e) => updateBrand({ menuTagline: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold">Accent Color</label>
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded p-1">
                      <input type="color" value={brandData.accentColor} onChange={(e) => updateBrand({ accentColor: e.target.value })} className="h-6 w-6 rounded cursor-pointer bg-transparent border-none" />
                      <span className="text-xs font-mono text-zinc-400">{brandData.accentColor}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800 mt-2">
                  <GlobalVisualsControl brandData={brandData} onUpdate={updateBrand} />
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800 mt-2">
                  <TypographyControl brandData={brandData} onUpdate={updateBrand} />
                  <SEOControl brandData={brandData} onUpdate={updateBrand} />
                </div>

                {/* Page Visibility Toggles */}
                <div className="pt-4 border-t border-zinc-800 mt-2">
                  <h4 className="text-[10px] text-zinc-500 uppercase font-bold mb-3 flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Page Visibility (Publish)
                  </h4>
                  <div className="space-y-2">
                    {(['home', 'about', 'contact', 'epk'] as const).map((page) => {
                      const vis = brandData.pageVisibility || { home: true, about: true, contact: true, epk: false };
                      const isVisible = vis[page] ?? (page === 'epk' ? false : true);
                      const displayName = brandData.navNames[page] || page;
                      return (
                        <div
                          key={page}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all cursor-pointer group ${isVisible
                            ? 'bg-zinc-900/50 border-zinc-800 hover:border-emerald-800'
                            : 'bg-zinc-950/50 border-zinc-900 hover:border-zinc-700'
                            }`}
                          onClick={() => {
                            const current = brandData.pageVisibility || { home: true, about: true, contact: true, epk: false };
                            const newVisibility = { ...current, [page]: !isVisible };
                            updateBrand({ pageVisibility: newVisibility });
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${isVisible ? 'text-zinc-300' : 'text-zinc-600'
                              }`}>
                              {displayName}
                            </span>
                            {page === 'home' && (
                              <span className="text-[8px] text-zinc-700 uppercase tracking-wider">(Required)</span>
                            )}
                          </div>
                          {/* Toggle Switch */}
                          <div className={`relative w-8 h-4 rounded-full transition-all duration-300 ${isVisible
                            ? 'bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                            : 'bg-zinc-800'
                            }`}>
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300 ${isVisible
                              ? 'left-[18px] bg-white'
                              : 'left-0.5 bg-zinc-600'
                              }`} />
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-[9px] text-zinc-700 mt-1 leading-relaxed">
                      Disabled pages will be excluded from navigation, downloads, and deployments.
                    </p>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Typography Master Panel */}
            <CollapsibleSection
              title="🔤 Typography Master"
              sectionId="typography-master"
              isActive={activeSection === 'typography-master'}
              onClick={() => setActiveSection(activeSection === 'typography-master' ? null : 'typography-master')}
            >
              <GlobalTypographyPanel brandData={brandData} onUpdate={updateBrand} />
            </CollapsibleSection>

            <hr className="border-zinc-800/50" />

            {/* Sections */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <span>📝</span> {activePage} Sections
              </h3>
              {activePage === 'home' ? (
                <div className="space-y-2">
                  <div id="control-home-hero">
                    <CollapsibleSection
                      title="Hero Section"
                      sectionId="home-hero"
                      isActive={activeSection === 'home-hero'}
                      onClick={() => { setActiveSection('home-hero'); scrollToPreviewSection('home-hero'); }}
                      actions={<PresetButton path="home.hero" label="Home → Hero" getData={() => brandData.sections.home.hero} onRestore={(d) => updateBrand({ sections: { home: { hero: d } } } as any)} />}
                    >
                      <SectionErrorBoundary sectionName="Hero">
                        <Suspense fallback={<ControlFallback />}>
                          <HeroControls brandData={brandData} onUpdate={updateBrand} isMobile={brandData.isMobilePreview} />
                        </Suspense>
                      </SectionErrorBoundary>
                    </CollapsibleSection>
                  </div>
                  <div id="control-home-gallery">
                    <CollapsibleSection
                      title="Gallery"
                      sectionId="home-gallery"
                      isActive={activeSection === 'home-gallery'}
                      onClick={() => { setActiveSection('home-gallery'); scrollToPreviewSection('home-gallery'); }}
                      actions={<PresetButton path="home.gallery" label="Home → Gallery" getData={() => brandData.sections.home.spotify} onRestore={(d) => updateBrand({ sections: { home: { spotify: d } } } as any)} />}
                    >
                      <SectionErrorBoundary sectionName="Gallery">
                        <Suspense fallback={<ControlFallback />}>
                          <GalleryControls brandData={brandData} onUpdate={updateBrand} isMobile={brandData.isMobilePreview} />
                        </Suspense>
                      </SectionErrorBoundary>
                    </CollapsibleSection>
                  </div>
                  <div id="control-home-origin">
                    <CollapsibleSection
                      title="Origin Story"
                      sectionId="home-origin"
                      isActive={activeSection === 'home-origin'}
                      onClick={() => { setActiveSection('home-origin'); scrollToPreviewSection('home-origin'); }}
                      actions={<PresetButton path="home.origin" label="Home → Origin" getData={() => brandData.sections.home.origin} onRestore={(d) => updateBrand({ sections: { home: { origin: d } } } as any)} />}
                    >
                      <SectionErrorBoundary sectionName="Origin Story">
                        <Suspense fallback={<ControlFallback />}>
                          <OriginControls brandData={brandData} onUpdate={updateBrand} isMobile={brandData.isMobilePreview} />
                        </Suspense>
                      </SectionErrorBoundary>
                    </CollapsibleSection>
                  </div>
                  <div id="control-home-live">
                    <CollapsibleSection
                      title="Live Events"
                      sectionId="home-live"
                      isActive={activeSection === 'home-live'}
                      onClick={() => { setActiveSection('home-live'); scrollToPreviewSection('home-live'); }}
                      actions={<PresetButton path="home.live" label="Home → Live" getData={() => brandData.sections.home.live} onRestore={(d) => updateBrand({ sections: { home: { live: d } } } as any)} />}
                    >
                      <SectionErrorBoundary sectionName="Live Events">
                        <Suspense fallback={<ControlFallback />}>
                          <LiveControls brandData={brandData} onUpdate={updateBrand} isMobile={brandData.isMobilePreview} />
                        </Suspense>
                      </SectionErrorBoundary>
                    </CollapsibleSection>
                  </div>
                  <div id="control-home-footer">
                    <CollapsibleSection
                      title="Footer"
                      sectionId="home-footer"
                      isActive={activeSection === 'home-footer'}
                      onClick={() => { setActiveSection('home-footer'); scrollToPreviewSection('home-footer'); }}
                      actions={<PresetButton path="footer" label="Footer" getData={() => brandData.sections.footer} onRestore={(d) => updateBrand({ sections: { footer: d } } as any)} />}
                    >
                      <SectionErrorBoundary sectionName="Footer">
                        <Suspense fallback={<ControlFallback />}>
                          <FooterControls brandData={brandData} onUpdate={updateBrand} isMobile={brandData.isMobilePreview} />
                        </Suspense>
                      </SectionErrorBoundary>
                    </CollapsibleSection>
                  </div>
                </div>
              ) : activePage === 'about' ? (
                <div className="space-y-2">
                  <div id="control-about-hero">
                    <CollapsibleSection
                      title="Hero"
                      sectionId="about-hero"
                      isActive={activeSection === 'about-hero'}
                      onClick={() => { setActiveSection('about-hero'); scrollToPreviewSection('about-hero'); }}
                      actions={<PresetButton path="about.hero" label="About → Hero" getData={() => brandData.sections.about.hero} onRestore={(d) => updateBrand({ sections: { about: { hero: d } } } as any)} />}
                    >
                      <SectionErrorBoundary sectionName="About Hero">
                        <Suspense fallback={<ControlFallback />}>
                          <AboutHeroControls brandData={brandData} onUpdate={updateBrand} isMobile={brandData.isMobilePreview} />
                        </Suspense>
                      </SectionErrorBoundary>
                    </CollapsibleSection>
                  </div>
                  <div id="control-about-story">
                    <CollapsibleSection
                      title="Story"
                      sectionId="about-story"
                      isActive={activeSection === 'about-story'}
                      onClick={() => { setActiveSection('about-story'); scrollToPreviewSection('about-story'); }}
                      actions={<PresetButton path="about.story" label="About → Story" getData={() => brandData.sections.about.story} onRestore={(d) => updateBrand({ sections: { about: { story: d } } } as any)} />}
                    >
                      <SectionErrorBoundary sectionName="About Story">
                        <Suspense fallback={<ControlFallback />}>
                          <AboutStoryControls brandData={brandData} onUpdate={updateBrand} isMobile={brandData.isMobilePreview} />
                        </Suspense>
                      </SectionErrorBoundary>
                    </CollapsibleSection>
                  </div>
                  <div id="control-about-mission">
                    <CollapsibleSection
                      title="Mission"
                      sectionId="about-mission"
                      isActive={activeSection === 'about-mission'}
                      onClick={() => { setActiveSection('about-mission'); scrollToPreviewSection('about-mission'); }}
                      actions={<PresetButton path="about.mission" label="About → Mission" getData={() => brandData.sections.about.mission} onRestore={(d) => updateBrand({ sections: { about: { mission: d } } } as any)} />}
                    >
                      <SectionErrorBoundary sectionName="About Mission">
                        <Suspense fallback={<ControlFallback />}>
                          <AboutMissionControls brandData={brandData} onUpdate={updateBrand} isMobile={brandData.isMobilePreview} />
                        </Suspense>
                      </SectionErrorBoundary>
                    </CollapsibleSection>
                  </div>
                  <div id="control-about-footer">
                    <CollapsibleSection
                      title="Footer"
                      sectionId="about-footer"
                      isActive={activeSection === 'about-footer'}
                      onClick={() => { setActiveSection('about-footer'); scrollToPreviewSection('about-footer'); }}
                      actions={<PresetButton path="footer" label="Footer" getData={() => brandData.sections.footer} onRestore={(d) => updateBrand({ sections: { footer: d } } as any)} />}
                    >
                      <SectionErrorBoundary sectionName="Footer">
                        <Suspense fallback={<ControlFallback />}>
                          <FooterControls brandData={brandData} onUpdate={updateBrand} isMobile={brandData.isMobilePreview} />
                        </Suspense>
                      </SectionErrorBoundary>
                    </CollapsibleSection>
                  </div>
                </div>
              ) : activePage === 'contact' ? (
                <div className="space-y-2">
                  <div id="control-contact-main">
                    <CollapsibleSection
                      title="Contact"
                      sectionId="contact-main"
                      isActive={activeSection === 'contact-main'}
                      onClick={() => { setActiveSection('contact-main'); scrollToPreviewSection('contact-main'); }}
                      actions={<PresetButton path="contact" label="Contact" getData={() => brandData.sections.contact} onRestore={(d) => updateBrand({ sections: { contact: d } } as any)} />}
                    >
                      <SectionErrorBoundary sectionName="Contact">
                        <Suspense fallback={<ControlFallback />}>
                          <ContactControls brandData={brandData} onUpdate={updateBrand} isMobile={brandData.isMobilePreview} />
                        </Suspense>
                      </SectionErrorBoundary>
                    </CollapsibleSection>
                  </div>
                  <div id="control-contact-footer">
                    <CollapsibleSection
                      title="Footer"
                      sectionId="contact-footer"
                      isActive={activeSection === 'contact-footer'}
                      onClick={() => { setActiveSection('contact-footer'); scrollToPreviewSection('contact-footer'); }}
                      actions={<PresetButton path="footer" label="Footer" getData={() => brandData.sections.footer} onRestore={(d) => updateBrand({ sections: { footer: d } } as any)} />}
                    >
                      <SectionErrorBoundary sectionName="Footer">
                        <Suspense fallback={<ControlFallback />}>
                          <FooterControls brandData={brandData} onUpdate={updateBrand} isMobile={brandData.isMobilePreview} />
                        </Suspense>
                      </SectionErrorBoundary>
                    </CollapsibleSection>
                  </div>
                </div>
              ) : activePage === 'epk' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span className="text-[10px] text-zinc-600 font-mono">epk</span>
                    <PresetButton path="epk" label="EPK" getData={() => brandData.sections.epk} onRestore={(d) => updateBrand({ sections: { epk: d } } as any)} />
                  </div>
                  <div id="control-epk-main">
                    <SectionErrorBoundary sectionName="EPK">
                      <Suspense fallback={<ControlFallback />}>
                        <EpkControls
                          brandData={brandData}
                          onUpdate={updateBrand}
                          isMobile={brandData.isMobilePreview}
                        />
                      </Suspense>
                    </SectionErrorBoundary>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="h-20" />
          </div>
        </div>

        <div className="p-4 bg-zinc-950 border-t border-zinc-800 shrink-0 space-y-3">
          <button
            onClick={() => handleDirectDeploy(true)}
            disabled={directDeployStatus === 'deploying'}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-blue-400 font-bold uppercase tracking-widest text-[10px] rounded transition-all border border-zinc-800 hover:border-blue-500/50 flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
            Test Version ( /v3 )
          </button>

          <button
            onClick={() => { setPublishModalTab('download'); setIsPublishModalOpen(true); }}
            disabled={!isLiveEnabled}
            className={`w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest text-xs rounded transition-all border border-zinc-700 ${!isLiveEnabled ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
          >
            Publish Changes
          </button>

          {/* Per-page deploy selector */}
          {(() => {
            const vis = brandData.pageVisibility || { home: true, about: true, contact: true, epk: false };
            const availablePages: { key: string; label: string }[] = [
              { key: 'home', label: 'Home' },
              ...(vis.about !== false ? [{ key: 'about', label: 'About' }] : []),
              ...(vis.contact !== false ? [{ key: 'contact', label: 'Contact' }] : []),
              ...(vis.epk ? [{ key: 'epk', label: 'EPK' }] : []),
            ];
            const isAll = deployPageFilter === null;
            const toggle = (key: string) => {
              if (key === 'all') { setDeployPageFilter(null); return; }
              setDeployPageFilter(prev => {
                const current = prev ?? availablePages.map(p => p.key);
                const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
                return next.length === availablePages.length ? null : next;
              });
            };
            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Deploy scope</span>
                  {!isAll && (
                    <button onClick={() => setDeployPageFilter(null)} className="text-[9px] text-zinc-500 hover:text-zinc-300 transition-colors">
                      reset
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => toggle('all')}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition-all ${isAll ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'}`}
                  >
                    All
                  </button>
                  {availablePages.map(({ key, label }) => {
                    const active = isAll || (deployPageFilter?.includes(key) ?? false);
                    return (
                      <button
                        key={key}
                        onClick={() => toggle(key)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition-all ${active ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'bg-zinc-900 border-zinc-700 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400'}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="flex items-center justify-between px-1 py-1">
            <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${isLiveEnabled ? 'text-emerald-500' : 'text-zinc-700'}`}>
              Enable Live Deploy
            </span>
            <button
              onClick={() => setIsLiveEnabled(!isLiveEnabled)}
              className={`relative w-8 h-4 rounded-full transition-all duration-300 ${isLiveEnabled ? 'bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-zinc-800'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300 ${isLiveEnabled ? 'left-[18px] bg-white' : 'left-0.5 bg-zinc-600'}`} />
            </button>
          </div>

          <button
            onClick={() => handleDirectDeploy(false)}
            disabled={directDeployStatus === 'deploying' || !isLiveEnabled}
            className={`w-full py-3 font-bold uppercase tracking-widest text-xs rounded transition-all shadow-lg flex items-center justify-center gap-2 ${
              !isLiveEnabled 
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50 border border-zinc-700'
                : directDeployStatus === 'deploying'
                  ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                  : directDeployStatus === 'success'
                    ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                    : directDeployStatus === 'error'
                      ? 'bg-red-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]'
            }`}
          >
            {directDeployStatus === 'deploying' ? (
              <>
                <div className="w-3 h-3 border-2 border-zinc-500 border-t-white rounded-full animate-spin"></div>
                Pushing...
              </>
            ) : directDeployStatus === 'success' ? (
              <>✓ Pushed!</>
            ) : directDeployStatus === 'error' ? (
              <>✕ Failed</>
            ) : deployPageFilter !== null && deployPageFilter.length > 0 ? (
              `Deploy ${deployPageFilter.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' + ')}`
            ) : (
              'Deploy Now (All Pages)'
            )}
          </button>

          {directDeployMessage && (
            <div className={`text-[9px] text-center font-bold uppercase tracking-widest py-1.5 px-3 rounded-md animate-in fade-in slide-in-from-bottom-2 duration-300 ${directDeployStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              directDeployStatus === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-zinc-900 text-zinc-500 border border-zinc-800'
              }`}>
              {directDeployMessage}
            </div>
          )}

          <GlobalSaveButton brandData={brandData} />
        </div>
      </div>

      {/* RIGHT PANEL: MEMOIZED IFRAME */}
      <PreviewFrame iframeRef={iframeRef} onLoad={handleIframeLoad} />

      {/* PublishModal: lazy-loaded — generator only loads when modal is first opened (#3) */}
      <Suspense fallback={null}>
        <PublishModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          brandData={brandData}
          onUpdate={updateBrand}
          activePage={activePage}
          initialTab={publishModalTab}
        />
      </Suspense>
    </div>
  );
};

export default App;
