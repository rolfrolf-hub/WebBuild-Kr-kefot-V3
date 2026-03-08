import '@mux/mux-player';
import '@mux/mux-video';
import '@mux/mux-background-video/html';
import './style.css';

/**
 * GOLD STANDARD RENDERER (2026)
 * This script manages the preview lifecycle using a persistent DOM model.
 * It avoids document.write to preserve Web Component registrations and state.
 */

class PreviewRenderer {
    private root: HTMLElement | null = null;
    private currentHtml: string = '';

    constructor() {
        this.root = document.getElementById('render-root');
        this.setupListeners();

        console.log('[Preview Renderer] Persistent bridge active');
        window.parent.postMessage({ type: 'RENDERER_READY' }, window.location.origin);
    }

    private setupListeners() {
        window.addEventListener('message', (e) => {
            if (!e.data) return;

            switch (e.data.type) {
                case 'SET_CONTENT':
                    this.setContent(e.data.html);
                    break;
                case 'HOT_UPDATE':
                    this.handleHotUpdate(e.data.vars);
                    break;
                case 'HOT_UPDATE_TEXT':
                    this.handleTextUpdate(e.data.updates);
                    break;
                case 'RESTORE_SCROLL':
                    window.scrollTo({ top: e.data.scrollY, behavior: 'instant' });
                    break;
                case 'PATCH_ATTRIBUTE':
                    this.patchAttribute(e.data.selector, e.data.attribute, e.data.value);
                    break;
            }
        });

        // Click Interception (Page Switching)
        document.addEventListener('click', (e) => {
            const a = (e.target as HTMLElement).closest('a');
            if (a) {
                const href = a.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('#')) {
                    const page = this.mapHrefToPage(href);
                    if (page) {
                        e.preventDefault();
                        window.parent.postMessage({ type: 'PAGE_CHANGED', payload: { page } }, window.location.origin);
                    }
                }
            }
        }, true);

        // Scroll position reporting
        let lastSentScroll = 0;
        window.addEventListener('scroll', () => {
            if (Math.abs(window.scrollY - lastSentScroll) > 50) {
                lastSentScroll = window.scrollY;
                window.parent.postMessage({ type: 'SCROLL_POSITION', scrollY: window.scrollY }, window.location.origin);
            }
        }, { passive: true });
    }

    private setContent(html: string) {
        if (!this.root) return;

        console.log('[Preview Renderer] Starting content sync...');

        // 1. Parse the incoming HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 2. Sync Head Elements (Styles, Links, Scripts)
        // Keep track of external scripts to avoid re-running Tailwind/Mux multiple times
        const existingExternalScripts = new Set(
            Array.from(document.querySelectorAll('script[src]')).map(s => (s as HTMLScriptElement).src)
        );
        const existingExternalLinks = new Set(
            Array.from(document.querySelectorAll('link[href]')).map(l => (l as HTMLLinkElement).href)
        );

        // Remove old dynamic head elements (like the synced styles)
        document.querySelectorAll('head [data-preview-dynamic]').forEach(el => el.remove());

        const headElements = doc.head.querySelectorAll('style, link, script');
        headElements.forEach(el => {
            // Handle Scripts
            if (el.tagName.toLowerCase() === 'script') {
                const scriptEl = el as HTMLScriptElement;
                if (scriptEl.hasAttribute('src') && existingExternalScripts.has(scriptEl.src)) {
                    return; // Already loaded
                }
                const newScript = document.createElement('script');
                newScript.setAttribute('data-preview-dynamic', 'true');
                Array.from(el.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.textContent = el.textContent;
                document.head.appendChild(newScript);
                if (scriptEl.hasAttribute('src')) existingExternalScripts.add(scriptEl.src);
            }
            // Handle Links (Fonts)
            else if (el.tagName.toLowerCase() === 'link') {
                const linkEl = el as HTMLLinkElement;
                if (linkEl.hasAttribute('href') && existingExternalLinks.has(linkEl.href)) {
                    return; // Already loaded
                }
                const newLink = document.createElement('link');
                newLink.setAttribute('data-preview-dynamic', 'true');
                Array.from(el.attributes).forEach(attr => {
                    // special hack to handle Google fonts with onload properly
                    if (attr.name !== 'onload') newLink.setAttribute(attr.name, attr.value);
                });
                if (linkEl.hasAttribute('onload')) {
                    newLink.onload = () => { newLink.onload = null; newLink.rel = 'stylesheet'; };
                }
                document.head.appendChild(newLink);
                if (linkEl.hasAttribute('href')) existingExternalLinks.add(linkEl.href);
            }
            // Handle Styles
            else if (el.tagName.toLowerCase() === 'style') {
                const newStyle = document.createElement('style');
                newStyle.setAttribute('data-preview-dynamic', 'true');
                newStyle.textContent = el.textContent;
                document.head.appendChild(newStyle);
            }
        });

        // 3. Sync Body Attributes and Content to the current document body
        const newBody = doc.body;

        // Copy body attributes to document.body (preserving any existing ones safely or overwriting)
        Array.from(newBody.attributes).forEach(attr => {
            document.body.setAttribute(attr.name, attr.value);
        });

        this.root.innerHTML = newBody.innerHTML;
        this.currentHtml = html;

        // 4. Manually execute <script> tags within the body
        // Since innerHTML doesn't run scripts, we must create new script elements
        const scripts = Array.from(this.root.querySelectorAll('script'));
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            newScript.setAttribute('data-preview-dynamic', 'true');

            // Copy attributes
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });

            // Copy content
            newScript.textContent = oldScript.textContent;

            // Replace old with new to trigger execution
            oldScript.parentNode?.replaceChild(newScript, oldScript);
        });

        // Signal readiness
        window.parent.postMessage({ type: 'IFRAME_READY' }, window.location.origin);
        console.log('[Preview Renderer] Sync complete');
    }

    private handleHotUpdate(vars: Record<string, string>) {
        const root = document.documentElement;
        Object.entries(vars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }

    private handleTextUpdate(updates: Record<string, string>) {
        Object.keys(updates).forEach((key) => {
            const elements = document.querySelectorAll(`[data-text-key="${key}"]`);
            elements.forEach((el) => {
                (el as HTMLElement).innerText = updates[key];
            });
        });
    }

    private patchAttribute(selector: string, attribute: string, value: string) {
        try {
            const el = document.querySelector(selector);
            if (el) {
                el.setAttribute(attribute, value);
                console.log(`[Preview Renderer] Patched ${selector} ${attribute}=${value}`);
            } else {
                console.warn(`[Preview Renderer] Element not found for patching: ${selector}`);
            }
        } catch (e) {
            console.error('[Preview Renderer] Patch failed:', e);
        }
    }

    private mapHrefToPage(href: string): string | null {
        const filename = href.split('/').pop()?.split('?')[0];
        if (filename === 'index.html' || filename === '' || filename === 'home.html') return 'home';
        if (filename === 'about.html') return 'about';
        if (filename === 'contact.html') return 'contact';
        if (filename === 'vault.html') return 'vault';
        if (filename === 'epk.html') return 'epk';
        return null;
    }
}

// Initialize
try {
    new PreviewRenderer();

    // Send RENDERER_READY multiple times to ensure the parent catches it (race condition fix)
    let readyInterval = setInterval(() => {
        window.parent.postMessage({ type: 'RENDERER_READY' }, window.location.origin);
    }, 500);

    // Stop resending after 5 seconds or when content is received (indicated by further logs)
    setTimeout(() => clearInterval(readyInterval), 5000);

    console.log('[render.tsx] Persistent Renderer module loaded and ready');
} catch (e) {
    console.error('[render.tsx] Initialization failed:', e);
}
