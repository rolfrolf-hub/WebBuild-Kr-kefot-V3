import React, { useState } from 'react';
import Portal from './Portal';
import { BrandState } from '../types';
import { PageKey } from './PublishModalComponents/generator';

interface SEOControlProps {
    brandData: BrandState;
    onUpdate: (data: Partial<BrandState>) => void;
}

export const SEOControl: React.FC<SEOControlProps> = ({ brandData, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'Global' | 'Socials' | 'Home' | 'About' | 'Contact'>('Global');

    const updateGlobal = (key: string, value: string) => {
        const newGlobal = { ...(brandData.seo?.global || {}), [key]: value };
        onUpdate({ seo: { ...(brandData.seo || {}), global: newGlobal } } as any);
    };

    const updatePage = (pageKey: PageKey, key: string, value: string) => {
        const currentPage = brandData.seo?.pages?.[pageKey] || {};
        const newPage = { ...currentPage, [key]: value };
        const newPages = { ...(brandData.seo?.pages || {}), [pageKey]: newPage };
        onUpdate({ seo: { ...(brandData.seo || {}), pages: newPages } } as any);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`px-4 py-2 rounded-full border flex items-center gap-2 transition-all ${isOpen ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-zinc-800 bg-black text-zinc-400 hover:text-white'
                    }`}
                title="SEO Settings"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                <span className="text-[10px] font-bold uppercase tracking-widest">SEO & Links</span>
            </button>

            {isOpen && (
                <Portal>
                    <div className="fixed inset-0 z-[9999]" onClick={() => setIsOpen(false)} />
                    <div className="fixed top-20 right-96 z-[10000] w-96 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-white">
                        <div className="flex border-b border-zinc-800 overflow-x-auto no-scrollbar">
                            {['Global', 'Socials', 'Home', 'About', 'Contact'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`flex-none px-4 py-3 text-[9px] font-bold uppercase tracking-widest ${activeTab === tab ? 'bg-zinc-900 text-[var(--accent)]' : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="p-5 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
                            {activeTab === 'Global' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Site Name</label>
                                        <input
                                            value={brandData.seo?.global?.siteName || ''}
                                            onChange={(e) => updateGlobal('siteName', e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:border-[var(--accent)] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Favicon URL</label>
                                        <input
                                            value={brandData.seo?.global?.favicon || ''}
                                            onChange={(e) => updateGlobal('favicon', e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:border-[var(--accent)] outline-none"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Robots.txt Content</label>
                                        <textarea
                                            value={brandData.seo?.global?.robotsTxt || ''}
                                            onChange={(e) => updateGlobal('robotsTxt', e.target.value)}
                                            rows={4}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:border-[var(--accent)] outline-none font-mono"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Socials' && (
                                <div className="space-y-4">
                                    <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest border-b border-zinc-900 pb-2">Streaming Platforms</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Spotify</label>
                                            <input
                                                value={brandData.socials?.spotifyUrl || ''}
                                                onChange={(e) => onUpdate({ socials: { ...brandData.socials, spotifyUrl: e.target.value } })}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:border-[var(--accent)] outline-none"
                                                placeholder="Link..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Apple Music</label>
                                            <input
                                                value={brandData.socials?.appleUrl || ''}
                                                onChange={(e) => onUpdate({ socials: { ...brandData.socials, appleUrl: e.target.value } })}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:border-[var(--accent)] outline-none"
                                                placeholder="Link..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">SoundCloud</label>
                                            <input
                                                value={brandData.socials?.soundcloudUrl || ''}
                                                onChange={(e) => onUpdate({ socials: { ...brandData.socials, soundcloudUrl: e.target.value } })}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:border-[var(--accent)] outline-none"
                                                placeholder="Link..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">YouTube Music</label>
                                            <input
                                                value={brandData.socials?.youtubeUrl || ''}
                                                onChange={(e) => onUpdate({ socials: { ...brandData.socials, youtubeUrl: e.target.value } })}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:border-[var(--accent)] outline-none"
                                                placeholder="Link..."
                                            />
                                        </div>
                                    </div>

                                    <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest border-b border-zinc-900 pb-2 mt-4">Social Media</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Instagram</label>
                                            <input
                                                value={brandData.socials?.instagramUrl || ''}
                                                onChange={(e) => onUpdate({ socials: { ...brandData.socials, instagramUrl: e.target.value } })}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:border-[var(--accent)] outline-none"
                                                placeholder="Link..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">X (Twitter)</label>
                                            <input
                                                value={brandData.socials?.xUrl || ''}
                                                onChange={(e) => onUpdate({ socials: { ...brandData.socials, xUrl: e.target.value } })}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:border-[var(--accent)] outline-none"
                                                placeholder="Link..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Facebook</label>
                                            <input
                                                value={brandData.socials?.facebookUrl || ''}
                                                onChange={(e) => onUpdate({ socials: { ...brandData.socials, facebookUrl: e.target.value } })}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:border-[var(--accent)] outline-none"
                                                placeholder="Link..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(activeTab === 'Home' || activeTab === 'About' || activeTab === 'Contact') && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Page Title</label>
                                        <input
                                            value={brandData.seo?.pages?.[activeTab.toLowerCase() as PageKey]?.title || ''}
                                            onChange={(e) => updatePage(activeTab.toLowerCase() as PageKey, 'title', e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:border-[var(--accent)] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                                        <textarea
                                            value={brandData.seo?.pages?.[activeTab.toLowerCase() as PageKey]?.description || ''}
                                            onChange={(e) => updatePage(activeTab.toLowerCase() as PageKey, 'description', e.target.value)}
                                            rows={3}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:border-[var(--accent)] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">OG Image URL</label>
                                        <input
                                            value={brandData.seo?.pages?.[activeTab.toLowerCase() as PageKey]?.ogImage || ''}
                                            onChange={(e) => updatePage(activeTab.toLowerCase() as PageKey, 'ogImage', e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:border-[var(--accent)] outline-none"
                                            placeholder="Leave empty to use default"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
};
