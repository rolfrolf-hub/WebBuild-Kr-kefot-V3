import React, { useState } from 'react';
import { MediaItem, MediaType, BrandState } from '../types';
import { MediaEditControl } from './MediaEditControl';
import { ServerMediaBrowser } from './ServerMediaBrowser';

interface MediaListControlProps {
    items: MediaItem[];
    onUpdate: (newItems: MediaItem[]) => void;
    brandData: BrandState;
    onBrandUpdate: (newData: Partial<BrandState>) => void;
}

export const MediaListControl: React.FC<MediaListControlProps> = ({ items, onUpdate, brandData, onBrandUpdate }) => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [browserOpenForId, setBrowserOpenForId] = useState<string | null>(null);
    // Tracks which audio items have a separate background image (vs. same as thumbnail)
    const [separateBackgroundIds, setSeparateBackgroundIds] = useState<Set<string>>(
        () => new Set(items.filter(i => i.playingThumbnail).map(i => i.id))
    );

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedIds(newSet);
    };

    const updateItem = (id: string, updates: Partial<MediaItem>) => {
        const newItems = items.map(item => item.id === id ? { ...item, ...updates } : item);
        onUpdate(newItems);
    };

    const addItem = () => {
        const newItem: MediaItem = {
            id: `m${Date.now()}`,
            type: 'spotify',
            url: '',
            title: 'New Media Item',
            thumbnail: '',
        };
        onUpdate([...items, newItem]);
        setExpandedIds(new Set([...expandedIds, newItem.id]));
    };

    const removeItem = (id: string) => {
        onUpdate(items.filter(item => item.id !== id));
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === items.length - 1) return;

        const newItems = [...items];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
        onUpdate(newItems);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Media Items ({items.length})</h5>
                <button
                    onClick={addItem}
                    className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded border border-zinc-700 transition-colors uppercase font-bold"
                >
                    + Add Item
                </button>
            </div>

            <div className="space-y-2">
                {items.map((item, index) => {
                    const isExpanded = expandedIds.has(item.id);
                    return (
                        <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center gap-3 p-3 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors cursor-pointer group" onClick={() => toggleExpand(item.id)}>
                                <div className="text-zinc-500 cursor-move flex flex-col gap-0.5">
                                    <button onClick={(e) => { e.stopPropagation(); moveItem(index, 'up'); }} className="hover:text-white disabled:opacity-30" disabled={index === 0}>▲</button>
                                    <button onClick={(e) => { e.stopPropagation(); moveItem(index, 'down'); }} className="hover:text-white disabled:opacity-30" disabled={index === items.length - 1}>▼</button>
                                </div>
                                <div className="w-10 h-10 bg-zinc-800 rounded border border-zinc-700 overflow-hidden shrink-0 relative">
                                    {item.thumbnail ? (
                                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 right-0 bg-black/80 px-1 py-0.5 text-[6px] uppercase font-bold text-white border-tl-md">
                                        {item.type}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-zinc-300 truncate">{item.title}</div>
                                    <div className="text-[10px] text-zinc-600 truncate font-mono">{item.url || 'No URL set'}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                                        className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-red-900/20 transition-colors"
                                        title="Remove"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                    </button>
                                    <svg
                                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                        className={`text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="p-3 border-t border-zinc-800 space-y-3 bg-black/20">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-zinc-500 uppercase">Title</label>
                                            <input
                                                value={item.title}
                                                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-zinc-600 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-zinc-500 uppercase">Type</label>
                                            <select
                                                value={item.type}
                                                onChange={(e) => updateItem(item.id, { type: e.target.value as MediaType })}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-zinc-600 outline-none appearance-none"
                                            >
                                                <option value="spotify">Spotify</option>
                                                <option value="youtube">YouTube</option>
                                                <option value="video">Video File</option>
                                                <option value="audio">Audio File</option>
                                                <option value="mux">Mux Video</option>
                                                <option value="mux-bg">Mux Background</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-white uppercase flex items-center justify-between">
                                            <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">URL / Embed Link</span>
                                            {(item.type === 'video' || item.type === 'audio') && (
                                                <button
                                                    onClick={() => setBrowserOpenForId(item.id)}
                                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-2 py-0.5 rounded transition-colors border border-zinc-700 flex items-center gap-1 text-[9px]"
                                                >
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                                    BROWSE LIBRARY
                                                </button>
                                            )}
                                        </label>
                                        <input
                                            value={item.url}
                                            onChange={(e) => updateItem(item.id, { url: e.target.value })}
                                            className="w-full bg-black border border-zinc-700/50 rounded px-2 py-2 text-xs text-emerald-300 font-mono focus:border-emerald-500/50 focus:bg-emerald-950/10 outline-none placeholder-zinc-700"
                                            placeholder="https://..."
                                        />
                                        <p className="text-[9px] text-zinc-600">
                                            {item.type === 'spotify' && 'Paste Spotify track/album URL'}
                                            {item.type === 'youtube' && 'Paste YouTube video URL'}
                                            {(item.type === 'video' || item.type === 'audio') && 'Paste direct file URL or select form library'}
                                            {(item.type === 'mux' || item.type === 'mux-bg') && 'Paste Mux Playback ID or URL'}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <MediaEditControl
                                            label="Thumbnail Image"
                                            value={item.thumbnail || ''}
                                            onSave={(val) => updateItem(item.id, { thumbnail: val })}
                                            brandData={brandData}
                                            onUpdate={onBrandUpdate}
                                            variant="sidebar"
                                        />
                                    </div>

                                    {/* Background image — audio only */}
                                    {item.type === 'audio' && (
                                        <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={!separateBackgroundIds.has(item.id)}
                                                    onChange={(e) => {
                                                        const next = new Set(separateBackgroundIds);
                                                        if (e.target.checked) {
                                                            next.delete(item.id);
                                                            updateItem(item.id, { playingThumbnail: undefined });
                                                        } else {
                                                            next.add(item.id);
                                                        }
                                                        setSeparateBackgroundIds(next);
                                                    }}
                                                    className="w-3 h-3 rounded border-zinc-600 bg-zinc-800 accent-emerald-500 cursor-pointer"
                                                />
                                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Use same pic for background</span>
                                            </label>
                                            {separateBackgroundIds.has(item.id) && (
                                                <MediaEditControl
                                                    label="Background (while playing)"
                                                    value={item.playingThumbnail || ''}
                                                    onSave={(val) => updateItem(item.id, { playingThumbnail: val || undefined })}
                                                    brandData={brandData}
                                                    onUpdate={onBrandUpdate}
                                                    variant="sidebar"
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {items.length === 0 && (
                <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg text-zinc-600 text-xs">
                    No media items yet. Click "+ Add Item" to start.
                </div>
            )}

            {browserOpenForId && (
                <ServerMediaBrowser
                    isOpen={true}
                    onClose={() => setBrowserOpenForId(null)}
                    brandData={brandData}
                    onSelect={(url) => {
                        updateItem(browserOpenForId, { url });
                        setBrowserOpenForId(null);
                    }}
                />
            )}
        </div>
    );
};
