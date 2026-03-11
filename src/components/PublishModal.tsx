
import React, { useState } from 'react';
import { BrandState } from '../types';
// Generator is imported dynamically — only loads when the modal is actually used
type GeneratorModule = typeof import('./PublishModalComponents/generator');
let _cachedGenerator: GeneratorModule | null = null;
async function getGenerator(): Promise<GeneratorModule> {
  if (!_cachedGenerator) {
    _cachedGenerator = await import('./PublishModalComponents/generator');
  }
  return _cachedGenerator;
}
import type { PageKey } from './PublishModalComponents/generator';
import { TabNavigation, TabType } from './PublishModalComponents/TabNavigation';
import { DownloadTab } from './PublishModalComponents/DownloadTab';

import { DeployTab } from './PublishModalComponents/DeployTab';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandData: BrandState;
  onUpdate: (newData: Partial<BrandState>) => void;
  activePage: 'home' | 'about' | 'contact' | 'epk';
  initialTab?: TabType;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, brandData, onUpdate, activePage, initialTab }) => {
  const [activeTab, setActiveTab] = useState<TabType>('download');
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [deployLog, setDeployLog] = useState<string[]>([]);
  const [targetUrl, setTargetUrl] = useState('https://kraakefot.com');
  const [secretKey, setSecretKey] = useState(brandData.ftpPass || "tryte-999-en-Roste-Draes"); // Auto-fill with known pass
  const [includeHtaccess, setIncludeHtaccess] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  // Update tab when modal opens if initialTab is provided
  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Collects compiled Tailwind CSS from Vite's injected <style> elements in the editor DOM.
  // In dev mode, @tailwindcss/vite injects the compiled CSS as inline style elements.
  // In production, it falls back to fetching the linked stylesheet.
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
      } catch { /* cross-origin sheets are skipped */ }
    }
    return parts.join('\n');
  };

  // Build file list respecting page visibility (async — generator loaded on demand)
  const getEnabledPageFiles = async () => {
    const { generatePageHTML, generateScriptJS, generateSitemap, generateRobots } = await getGenerator();
    const vis = brandData.pageVisibility || { home: true, about: true, contact: true };
    const files: { name: string; content: string }[] = [
      { name: 'index.html', content: generatePageHTML('home', brandData) },
    ];
    if (vis.about !== false) {
      files.push({ name: 'about.html', content: generatePageHTML('about', brandData) });
    }
    if (vis.contact !== false) {
      files.push({ name: 'contact.html', content: generatePageHTML('contact', brandData) });
    }
    // Always include shared assets
    files.push(
      { name: 'style.css', content: await collectCompiledCSS() },
      { name: 'script.js', content: generateScriptJS(brandData) },
      { name: 'sitemap.xml', content: generateSitemap(brandData) },
      { name: 'robots.txt', content: generateRobots(brandData) },
    );
    return files;
  };

  const handleDownloadAll = async () => {
    try {
      const JSZip = (await import('https://esm.sh/jszip')).default;
      const zip = new JSZip();

      const files = await getEnabledPageFiles();

      if (includeHtaccess) {
        const { generateHtaccess } = await getGenerator();
        files.push({ name: '.htaccess', content: generateHtaccess() });
      }

      files.forEach(file => {
        zip.file(file.name, file.content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `kraakefot_site_bundle_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

    } catch (error) {
      console.error("ZIP-bundle feil:", error);
      alert("Kunne ikke generere ZIP. Prøv igjen.");
    }
  };

  const handleCopyWP = async () => {
    const { generatePageHTML } = await getGenerator();
    const content = generatePageHTML(activePage, brandData, true);
    navigator.clipboard.writeText(content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handleDeploy = async (isTestMode: boolean = false) => {
    setDeployStatus('deploying');
    setDeployLog([]);
    const log = (msg: string) => setDeployLog(prev => [...prev, msg]);

    // PEKER TIL deploy.php
    const baseUrl = targetUrl.endsWith('/') ? targetUrl : `${targetUrl}/`;
    const endpoint = `${baseUrl}deploy.php`;

    log(isTestMode ? `Klargjør filer for TEST ( /v3 )...` : `Klargjør filer for Kråkefot...`);

    const { generateHtaccess } = await getGenerator();
    const files = await getEnabledPageFiles();
    files.push({ name: '.htaccess', content: generateHtaccess() });

    const vis = brandData.pageVisibility || { home: true, about: true, contact: true };
    const enabledPages = Object.entries(vis).filter(([_, v]) => v).map(([k]) => k);
    log(`Publiserer sider: ${enabledPages.join(', ').toUpperCase()}`);

    let branchName = 'main';
    try {
      const branchRes = await fetch('http://localhost:3015/api/branch');
      const branchData = await branchRes.json();
      if (branchData.branch) branchName = branchData.branch;
    } catch (e) {
      console.warn('Could not fetch branch name for deploy path', e);
    }
    const testSubPath = branchName === 'main' ? 'main' : branchName;

    try {
      let successCount = 0;
      for (const f of files) {
        const remoteFilename = isTestMode ? `v3/${testSubPath}/${f.name}` : f.name;
        log(`Laster opp ${remoteFilename}...`);

        await new Promise(r => setTimeout(r, 200));

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: secretKey,
            filename: remoteFilename,
            content: f.content
          })
        });

        const resultText = await response.text();
        let result;
        try {
          result = JSON.parse(resultText);
        } catch (e) {
          throw new Error(`Server svarte ikke med JSON: ${resultText.substring(0, 50)}`);
        }

        if (!response.ok) {
          throw new Error(`${f.name}: ${result.error || 'Kunne ikke lagre fil'}`);
        }

        log(`✓ ${f.name} lagret.`);
        successCount++;
      }

      setDeployStatus('success');
      log(`------------------------------`);
      const finalUrl = isTestMode ? `${baseUrl}v3/` : targetUrl;
      log(`VELLYKKET: ${successCount} filer er nå live på ${finalUrl}`);
    } catch (e: any) {
      console.error("Deployment feil:", e);
      let msg = e.message;
      if (msg.includes('Failed to fetch')) {
        msg = "Connection failed. Please ensure you have re-uploaded the 'deploy.php' script to your server root. (CORS/Network Error)";
      }
      log(`!!! FEIL: ${msg}`);
      setDeployStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-full">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <div className="p-8 border-b border-zinc-800">
          <h2 className="text-3xl font-bold uppercase tracking-widest text-white mb-2 font-serif italic">Publish to Site</h2>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">Active Page: {activePage}</p>
        </div>

        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 p-8 overflow-y-auto min-h-[400px]">
          {activeTab === 'download' ? (
            <DownloadTab onDownload={handleDownloadAll} />
          ) : (
            <DeployTab
              targetUrl={targetUrl}
              setTargetUrl={setTargetUrl}
              deployStatus={deployStatus}
              deployLog={deployLog}
              onDeploy={() => handleDeploy(false)}
              onDeployTest={() => handleDeploy(true)}
              password={secretKey}
              setPassword={setSecretKey}
            />
          )}
        </div>
      </div>
    </div>
  );
};
