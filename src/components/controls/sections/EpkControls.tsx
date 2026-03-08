import React from 'react';
import { BrandState, EpkQuote } from '../../../types';
import { CollapsibleSection } from '../../CollapsibleSection';
import { MediaEditControl } from '../../MediaEditControl';
import { SaturationControl } from '../../SaturationControl';
import { ParallaxControl } from '../../ParallaxControl';
import { DimControl } from '../../DimControl';
import { BlurControl } from '../../BlurControl';
import { FramingControl } from '../../FramingControl';
import { OpacityControl } from '../../OpacityControl';
import { AtomicLayoutControl } from '../AtomicLayoutControl';
import { TypographyEditControl } from '../../TypographyEditControl';
import { AuraControl } from '../../AuraControl';
import { MuxVideoControl } from '../../MuxVideoControl';
import { MediaCustomizationControl } from '../../MediaCustomizationControl';
import { getMediaTypeFromUrl } from '../../../utils/mediaHelpers';

interface EpkControlsProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
    isMobile: boolean;
}

// ──────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────
function makeUpdater(brandData: BrandState, onUpdate: (d: Partial<BrandState>) => void, key: 'hook' | 'pitch' | 'media' | 'press' | 'contact') {
    const updateSection = (updates: any) => {
        const epk = brandData.sections.epk;
        if (!epk) return;
        onUpdate({
            sections: {
                ...brandData.sections,
                epk: { ...epk, [key]: { ...epk[key], ...updates } }
            } as any
        });
    };
    const updateVisuals = (updates: any) => {
        const epk = brandData.sections.epk;
        if (!epk) return;
        updateSection({ visuals: { ...(epk[key] as any).visuals, ...updates } });
    };
    const updateFraming = (updates: any) => {
        const epk = brandData.sections.epk;
        if (!epk) return;
        updateSection({ framing: { ...(epk[key] as any).framing, ...updates } });
    };
    return { updateSection, updateVisuals, updateFraming };
}

// ──────────────────────────────────────────────
// shared sub-components
// ──────────────────────────────────────────────
function VisualsBlock({ visuals, framing, isMobile, onUpdateVisuals, onUpdateFraming, label }: any) {
    return (
        <div className="space-y-3 pt-4 border-t border-zinc-800">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Visuals</h4>
            <SaturationControl
                label={isMobile ? `${label} (Mobile)` : label}
                value={isMobile ? visuals?.mobileSaturation : visuals?.saturation}
                onSave={(val) => onUpdateVisuals(isMobile ? { mobileSaturation: val } : { saturation: val })}
                variant="sidebar"
            />
            <ParallaxControl
                label={isMobile ? `${label} (Mobile)` : label}
                value={isMobile ? visuals?.mobileParallax : visuals?.parallax}
                onSave={(val) => onUpdateVisuals(isMobile ? { mobileParallax: val } : { parallax: val })}
                variant="sidebar"
            />
            <DimControl
                label={isMobile ? `${label} (Mobile)` : label}
                value={isMobile ? visuals?.mobileDim : visuals?.dim}
                onSave={(val) => onUpdateVisuals(isMobile ? { mobileDim: val } : { dim: val })}
                variant="sidebar"
            />
            <OpacityControl
                label={isMobile ? `${label} (Mobile)` : label}
                value={isMobile ? visuals?.mobileOpacity ?? 100 : visuals?.opacity ?? 100}
                onSave={(val) => onUpdateVisuals(isMobile ? { mobileOpacity: val } : { opacity: val })}
                variant="sidebar"
            />
            <BlurControl
                label={label}
                enabled={visuals?.blurEnabled ?? false}
                strength={visuals?.blurStrength ?? 5}
                radius={visuals?.blurRadius ?? 0.5}
                onUpdate={(vals) => onUpdateVisuals(vals)}
                variant="sidebar"
            />

            {/* Aura/Nordlys Controls */}
            <AuraControl visuals={visuals} onUpdate={onUpdateVisuals} />

            {/* ── Glitch Intensity ── */}
            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Glitch Intensity</span>
                    <span className="text-xs text-zinc-300 font-mono">{visuals?.glitchIntensity ?? 0}%</span>
                </div>
                <input
                    type="range" min={0} max={100} step={1}
                    value={visuals?.glitchIntensity ?? 0}
                    onChange={e => onUpdateVisuals({ glitchIntensity: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[10px] text-zinc-600">0 = off · 100 = max chaos on hero image</p>
            </div>

            {framing && (
                <FramingControl
                    label={label}
                    isMobileMode={isMobile}
                    zoom={isMobile ? framing?.zoomMobile : framing?.zoomDesktop}
                    xOffset={isMobile ? framing?.xOffsetMobile : framing?.xOffsetDesktop}
                    yOffset={isMobile ? framing?.yOffsetMobile : framing?.yOffsetDesktop}
                    onUpdate={(vals) => {
                        const updates: any = {};
                        if (isMobile) {
                            if (vals.zoom !== undefined) updates.zoomMobile = vals.zoom;
                            if (vals.x !== undefined) updates.xOffsetMobile = vals.x;
                            if (vals.y !== undefined) updates.yOffsetMobile = vals.y;
                        } else {
                            if (vals.zoom !== undefined) updates.zoomDesktop = vals.zoom;
                            if (vals.x !== undefined) updates.xOffsetDesktop = vals.x;
                            if (vals.y !== undefined) updates.yOffsetDesktop = vals.y;
                        }
                        onUpdateFraming(updates);
                    }}
                    variant="sidebar"
                />
            )}
            {framing && (
                <MuxVideoControl
                    framing={framing}
                    visuals={visuals}
                    onUpdateFraming={onUpdateFraming}
                    onUpdateVisuals={onUpdateVisuals}
                />
            )}
        </div>
    );
}

/** Reusable single-line text input */
function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase font-bold">{label}</label>
            <input
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}

/** Reusable textarea */
function TextAreaField({ label, value, onChange, rows = 5, hint }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase font-bold">{label}</label>
            <textarea
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none resize-none"
                rows={rows}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {hint && <p className="text-[9px] text-zinc-600">{hint}</p>}
        </div>
    );
}

/** Typography section header */
function TypoHeader() {
    return <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Typografi</h4>;
}

// ──────────────────────────────────────────────
// main component
// ──────────────────────────────────────────────
export const EpkControls = React.memo<EpkControlsProps>(({ brandData, onUpdate, isMobile }) => {
    const epk = brandData.sections.epk;
    if (!epk) return <div className="text-zinc-500 text-sm p-4">No EPK data found. Please reset defaults.</div>;

    const hookUp = makeUpdater(brandData, onUpdate, 'hook');
    const pitchUp = makeUpdater(brandData, onUpdate, 'pitch');
    const mediaUp = makeUpdater(brandData, onUpdate, 'media');
    const pressUp = makeUpdater(brandData, onUpdate, 'press');
    const contactUp = makeUpdater(brandData, onUpdate, 'contact');

    // Typography style updater
    const updateTextStyle = (key: string, updates: any) => {
        onUpdate({
            textStyles: {
                ...brandData.textStyles,
                [key]: { ...(brandData.textStyles?.[key] || {}), ...updates }
            }
        });
    };

    // Quotes helpers
    const quotes: EpkQuote[] = (epk.pitch as any).quotes || [];
    const updateQuotes = (newQuotes: EpkQuote[]) => pitchUp.updateSection({ quotes: newQuotes });

    return (
        <div className="space-y-4">

            {/* ──── 1. HOOK ──── */}
            <CollapsibleSection title="🎯 Hook (Hero)" sectionId="epk-hook" isActive={false} onClick={() => { }}>
                <div className="space-y-6">
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Innhold</h4>
                        <MediaEditControl
                            label="Background Image/Video"
                            value={epk.hook.imageUrl}
                            onSave={(val) => hookUp.updateSection({ imageUrl: val })}
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                        />
                        <TextField
                            label="Tagline"
                            value={epk.hook.tagline}
                            onChange={(v) => hookUp.updateSection({ tagline: v })}
                        />
                        <TextField
                            label="YouTube URL"
                            value={epk.hook.ctaVideoUrl || ''}
                            onChange={(v) => hookUp.updateSection({ ctaVideoUrl: v })}
                            placeholder="https://music.youtube.com/..."
                        />
                        <TextField
                            label="Spotify URL"
                            value={epk.hook.ctaSpotifyUrl || ''}
                            onChange={(v) => hookUp.updateSection({ ctaSpotifyUrl: v })}
                            placeholder="https://open.spotify.com/..."
                        />

                        {/* Customization for the CTA Video/Mux */}
                        {epk.hook.ctaVideoUrl && (
                            <div className="mt-2 pt-2 border-t border-zinc-800/50">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-1 block">Video Button Config</span>
                                <MediaCustomizationControl
                                    type={getMediaTypeFromUrl(epk.hook.ctaVideoUrl)}
                                    config={epk.hook.mediaConfig || {}}
                                    onUpdate={(conf) => hookUp.updateSection({ mediaConfig: conf })}
                                    accentColor={brandData.accentColor}
                                />
                            </div>
                        )}

                        {/* Customization for the CTA Spotify */}
                        {epk.hook.ctaSpotifyUrl && (
                            <div className="mt-2 pt-2 border-t border-zinc-800/50">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-1 block">Spotify Button Config</span>
                                <MediaCustomizationControl
                                    type="spotify"
                                    config={epk.hook.mediaConfig || {}}
                                    onUpdate={(conf) => hookUp.updateSection({ mediaConfig: conf })}
                                    accentColor={brandData.accentColor}
                                />
                            </div>
                        )}
                    </div>

                    {/* Typography */}
                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <TypoHeader />
                        <TypographyEditControl
                            label="Tagline"
                            styleKey="epkHookTagline"
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                        />
                    </div>

                    <VisualsBlock
                        visuals={epk.hook.visuals} framing={epk.hook.framing}
                        isMobile={isMobile} onUpdateVisuals={hookUp.updateVisuals}
                        onUpdateFraming={hookUp.updateFraming} label="Hook"
                    />

                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Layout</h4>
                        <AtomicLayoutControl label="Hook Layout" layout={epk.hook.layout} onUpdate={(val) => hookUp.updateSection({ layout: val })} isMobile={isMobile} variant="sidebar" />
                    </div>
                </div>
            </CollapsibleSection>

            {/* ──── 2. BIO / PITCH ──── */}
            <CollapsibleSection title="📄 Bio / Pitch" sectionId="epk-pitch" isActive={false} onClick={() => { }}>
                <div className="space-y-6">
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Innhold</h4>
                        <MediaEditControl
                            label="Background Image"
                            value={epk.pitch.imageUrl}
                            onSave={(val) => pitchUp.updateSection({ imageUrl: val })}
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                        />
                        <TextField label="Seksjon-tagline" value={epk.pitch.tagline} onChange={(v) => pitchUp.updateSection({ tagline: v })} />
                        <TextField label="Intro-overskrift" value={(epk.pitch as any).introHeadline || ''} onChange={(v) => pitchUp.updateSection({ introHeadline: v })} />
                        <TextAreaField
                            label="Intro-tekst (mellom Hero og Bio)"
                            value={(epk.pitch as any).introText || ''}
                            onChange={(v) => pitchUp.updateSection({ introText: v })}
                            rows={3}
                        />
                        <TextAreaField
                            label="Bio-tekst"
                            value={epk.pitch.bioText}
                            onChange={(v) => pitchUp.updateSection({ bioText: v })}
                            rows={7}
                            hint="Tom linje (Enter×2) = nytt avsnitt."
                        />
                    </div>

                    {/* Typography – bio */}
                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <TypoHeader />
                        <TypographyEditControl
                            label="Seksjon-tagline"
                            styleKey="epkPitchTagline"
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                        />
                        <TypographyEditControl
                            label="Intro-overskrift"
                            styleKey="epkIntroHeadline"
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                        />
                        <TypographyEditControl
                            label="Intro-tekst"
                            styleKey="epkIntroText"
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                        />
                        <TypographyEditControl
                            label="Bio-tekst"
                            styleKey="epkPitchBio"
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                        />
                    </div>

                    {/* ── QUOTES EDITOR ── */}
                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">💬 Sitater</h4>
                        <p className="text-[9px] text-zinc-500">Legg til sitater fra kjente artister, bookers eller pressen. Vises som fremhevede kort på EPK-siden.</p>

                        {quotes.map((q, i) => (
                            <div key={i} className="p-3 bg-zinc-900 border border-amber-900/40 rounded-xl space-y-2 relative">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] text-amber-600 uppercase tracking-wider font-bold">Sitat {i + 1}</span>
                                    <button
                                        className="text-[9px] text-red-700 hover:text-red-500 uppercase font-bold tracking-wider"
                                        onClick={() => {
                                            const n = [...quotes];
                                            n.splice(i, 1);
                                            updateQuotes(n);
                                        }}
                                    >
                                        Slett
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-zinc-500 uppercase font-bold">Sitatets tekst</label>
                                    <textarea
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-amber-500 focus:outline-none resize-none"
                                        rows={3}
                                        value={q.text}
                                        onChange={(e) => {
                                            const n = [...quotes];
                                            n[i] = { ...n[i], text: e.target.value };
                                            updateQuotes(n);
                                        }}
                                        placeholder="«Kråkefot er...»"
                                    />
                                </div>
                                <input
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
                                    placeholder="Navn (f.eks. Lars Lillo-Steberg)"
                                    value={q.author}
                                    onChange={(e) => {
                                        const n = [...quotes];
                                        n[i] = { ...n[i], author: e.target.value };
                                        updateQuotes(n);
                                    }}
                                />
                                <input
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
                                    placeholder="Tittel/rolle (f.eks. Musikant · Årabrot)"
                                    value={q.role}
                                    onChange={(e) => {
                                        const n = [...quotes];
                                        n[i] = { ...n[i], role: e.target.value };
                                        updateQuotes(n);
                                    }}
                                />
                            </div>
                        ))}

                        <button
                            className="w-full py-2 rounded border border-dashed border-amber-800/60 text-[10px] text-amber-600 hover:text-amber-400 hover:border-amber-600 transition-colors uppercase tracking-wider font-bold"
                            onClick={() => updateQuotes([...quotes, { text: '', author: '', role: '' }])}
                        >
                            + Legg til sitat
                        </button>

                        {/* Typography for quotes */}
                        <div className="pt-2 space-y-3">
                            <TypoHeader />
                            <TypographyEditControl label="Sitat-tekst" styleKey="epkQuoteText" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            <TypographyEditControl label="Sitat-navn" styleKey="epkQuoteAuthor" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            <TypographyEditControl label="Sitat-rolle" styleKey="epkQuoteRole" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                        </div>
                    </div>

                    <VisualsBlock
                        visuals={epk.pitch.visuals} framing={epk.pitch.framing}
                        isMobile={isMobile} onUpdateVisuals={pitchUp.updateVisuals}
                        onUpdateFraming={pitchUp.updateFraming} label="Pitch"
                    />

                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Layout</h4>
                        <AtomicLayoutControl label="Pitch Layout" layout={epk.pitch.layout} onUpdate={(val) => pitchUp.updateSection({ layout: val })} isMobile={isMobile} variant="sidebar" />
                    </div>
                </div>
            </CollapsibleSection>

            {/* ──── 3. MULTIMEDIA ──── */}
            <CollapsibleSection title="🎬 Multimedia" sectionId="epk-media" isActive={false} onClick={() => { }}>
                <div className="space-y-6">
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Innhold</h4>
                        <TextField label="Seksjon-tagline" value={epk.media.tagline} onChange={(v) => mediaUp.updateSection({ tagline: v })} />
                        <TextField label="YouTube Embed URL" value={epk.media.videoEmbedUrl} onChange={(v) => mediaUp.updateSection({ videoEmbedUrl: v })} placeholder="https://www.youtube.com/embed/..." />
                        <TextField label="Video-overskrift" value={epk.media.videoHeadline || ''} onChange={(v) => mediaUp.updateSection({ videoHeadline: v })} placeholder="Featured Video" />
                        <TextField label="Spotify Embed URL" value={epk.media.spotifyEmbedUrl} onChange={(v) => mediaUp.updateSection({ spotifyEmbedUrl: v })} placeholder="https://open.spotify.com/embed/..." />
                        <TextField label="Spotify-overskrift" value={epk.media.spotifyHeadline || ''} onChange={(v) => mediaUp.updateSection({ spotifyHeadline: v })} placeholder="Listen" />
                        <TextField label="Låter-overskrift" value={epk.media.tracksHeadline || ''} onChange={(v) => mediaUp.updateSection({ tracksHeadline: v })} placeholder="Selected Tracks" />

                        {/* Video Config */}
                        {epk.media.videoEmbedUrl && (
                            <div className="mt-2 pt-2 border-t border-zinc-800/50">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-1 block">Featured Video Config</span>
                                <MediaCustomizationControl
                                    type={getMediaTypeFromUrl(epk.media.videoEmbedUrl)}
                                    config={epk.media.mediaConfig || {}}
                                    onUpdate={(conf) => mediaUp.updateSection({ mediaConfig: conf })}
                                    accentColor={brandData.accentColor}
                                />
                            </div>
                        )}

                        {/* Spotify Config */}
                        {epk.media.spotifyEmbedUrl && (
                            <div className="mt-2 pt-2 border-t border-zinc-800/50">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-1 block">Spotify Config</span>
                                <MediaCustomizationControl
                                    type="spotify"
                                    config={epk.media.mediaConfig || {}}
                                    onUpdate={(conf) => mediaUp.updateSection({ mediaConfig: conf })}
                                    accentColor={brandData.accentColor}
                                />
                            </div>
                        )}
                        {/* ── TRACKS EDITOR ── */}
                        <div className="space-y-3 pt-4 border-t border-zinc-800">
                            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">🎵 Låter</h4>
                            <p className="text-[9px] text-zinc-500">Legg til låter som skal spilles av på EPK-siden. Velg eget bakgrunnsbilde og opplastet musikkfil.</p>

                            {(epk.media.tracks || []).map((t, i) => (
                                <div key={i} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3 relative">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[9px] text-emerald-500 uppercase tracking-wider font-bold">Låt {i + 1}</span>
                                        <button
                                            className="text-[9px] text-red-700 hover:text-red-500 uppercase font-bold tracking-wider"
                                            onClick={() => {
                                                const n = [...(epk.media.tracks || [])];
                                                n.splice(i, 1);
                                                mediaUp.updateSection({ tracks: n });
                                            }}
                                        >
                                            Slett
                                        </button>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[9px] text-zinc-500 uppercase font-bold">Låttittel</label>
                                        <input
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
                                            placeholder="F.eks. Tøff i Pyjamas"
                                            value={t.title}
                                            onChange={(e) => {
                                                const n = [...(epk.media.tracks || [])];
                                                n[i] = { ...n[i], title: e.target.value };
                                                mediaUp.updateSection({ tracks: n });
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-zinc-500 uppercase font-bold">Beskrivelse</label>
                                        <textarea
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-emerald-500 focus:outline-none resize-none"
                                            rows={2}
                                            value={t.description}
                                            onChange={(e) => {
                                                const n = [...(epk.media.tracks || [])];
                                                n[i] = { ...n[i], description: e.target.value };
                                                mediaUp.updateSection({ tracks: n });
                                            }}
                                            placeholder="F.eks. Raw energy, instant hook..."
                                        />
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-zinc-800/50">
                                        <MediaEditControl
                                            label="Låt-lydfil (Audio)"
                                            value={t.audioUrl || ''}
                                            onSave={(val) => {
                                                const n = [...(epk.media.tracks || [])];
                                                n[i] = { ...n[i], audioUrl: val };
                                                mediaUp.updateSection({ tracks: n });
                                            }}
                                            brandData={brandData}
                                            onUpdate={onUpdate}
                                            variant="sidebar"
                                        />
                                        <MediaEditControl
                                            label="Bakgrunnsbilde (Poster)"
                                            value={t.imageUrl || ''}
                                            onSave={(val) => {
                                                const n = [...(epk.media.tracks || [])];
                                                n[i] = { ...n[i], imageUrl: val };
                                                mediaUp.updateSection({ tracks: n });
                                            }}
                                            brandData={brandData}
                                            onUpdate={onUpdate}
                                            variant="sidebar"
                                        />
                                    </div>
                                </div>
                            ))}

                            <button
                                className="w-full py-2 rounded border border-dashed border-zinc-700 text-[10px] text-emerald-500 hover:text-emerald-400 hover:border-emerald-600 transition-colors uppercase tracking-wider font-bold"
                                onClick={() => {
                                    const n = [...(epk.media.tracks || []), { title: 'Ny Låt', description: '' }];
                                    mediaUp.updateSection({ tracks: n });
                                }}
                            >
                                + Legg til Låt
                            </button>
                        </div>
                    </div>

                    {/* Typography */}
                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <TypoHeader />
                        <TypographyEditControl
                            label="Seksjon-tagline"
                            styleKey="epkMediaTagline"
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                            textValue={epk.media.tagline}
                            onTextUpdate={(val) => mediaUp.updateSection({ tagline: val })}
                        />
                        <TypographyEditControl
                            label="Låter-overskrift"
                            styleKey="epkTracksHeadline"
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                            textValue={epk.media.tracksHeadline || ''}
                            onTextUpdate={(val) => mediaUp.updateSection({ tracksHeadline: val })}
                        />
                        <TypographyEditControl
                            label="Video-overskrift"
                            styleKey="epkVideoHeadline"
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                            textValue={epk.media.videoHeadline || ''}
                            onTextUpdate={(val) => mediaUp.updateSection({ videoHeadline: val })}
                        />
                        <TypographyEditControl
                            label="Spotify-overskrift"
                            styleKey="epkSpotifyHeadline"
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                            textValue={epk.media.spotifyHeadline || ''}
                            onTextUpdate={(val) => mediaUp.updateSection({ spotifyHeadline: val })}
                        />
                    </div>

                    {/* Visuals – Saturation for the whole section */}
                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Visuals</h4>
                        <SaturationControl
                            label={isMobile ? "Multimedia (Mobile)" : "Multimedia"}
                            value={isMobile ? epk.media.visuals?.mobileSaturation ?? 100 : epk.media.visuals?.saturation ?? 100}
                            onSave={(val) => mediaUp.updateVisuals(isMobile ? { mobileSaturation: val } : { saturation: val })}
                            variant="sidebar"
                        />
                    </div>

                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Layout</h4>
                        <AtomicLayoutControl label="Media Layout" layout={epk.media.layout} onUpdate={(val) => mediaUp.updateSection({ layout: val })} isMobile={isMobile} variant="sidebar" />
                    </div>
                </div>
            </CollapsibleSection>

            {/* ──── 4. PRESS & ASSETS ──── */}
            <CollapsibleSection title="📥 Press & Assets" sectionId="epk-press" isActive={false} onClick={() => { }}>
                <div className="space-y-6">
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Innhold</h4>
                        <TextField label="Tagline" value={epk.press.tagline} onChange={(v) => pressUp.updateSection({ tagline: v })} />
                        <TextField label="Overskrift" value={epk.press.headline} onChange={(v) => pressUp.updateSection({ headline: v })} />
                        <div className="space-y-2">
                            <label className="text-[10px] text-zinc-500 uppercase font-bold">Last ned-lenker</label>
                            {(epk.press.assets || []).map((asset, i) => (
                                <div key={i} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Fil {i + 1}</span>
                                        <button
                                            className="text-[9px] text-red-700 hover:text-red-500 uppercase font-bold tracking-wider"
                                            onClick={() => {
                                                const n = [...(epk.press.assets || [])];
                                                n.splice(i, 1);
                                                pressUp.updateSection({ assets: n });
                                            }}
                                        >
                                            Slett
                                        </button>
                                    </div>
                                    <input
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
                                        placeholder="Etikett (f.eks. Pressebilder ZIP)"
                                        value={asset.label}
                                        onChange={(e) => {
                                            const n = [...(epk.press.assets || [])];
                                            n[i] = { ...n[i], label: e.target.value };
                                            pressUp.updateSection({ assets: n });
                                        }}
                                    />
                                    <input
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
                                        placeholder="URL (https://...)"
                                        value={asset.url}
                                        onChange={(e) => {
                                            const n = [...(epk.press.assets || [])];
                                            n[i] = { ...n[i], url: e.target.value };
                                            pressUp.updateSection({ assets: n });
                                        }}
                                    />
                                </div>
                            ))}
                            <button
                                className="w-full py-2 rounded border border-dashed border-zinc-700 text-[10px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors uppercase tracking-wider font-bold"
                                onClick={() => {
                                    const n = [...(epk.press.assets || []), { label: 'Ny fil', url: '' }];
                                    pressUp.updateSection({ assets: n });
                                }}
                            >
                                + Legg til fil
                            </button>
                        </div>
                    </div>

                    {/* Typography */}
                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <TypoHeader />
                        <TypographyEditControl
                            label="Press-tagline"
                            styleKey="epkPressTagline"
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                            textValue={epk.press.tagline}
                            onTextUpdate={(val) => pressUp.updateSection({ tagline: val })}
                        />
                        <TypographyEditControl
                            label="Press-overskrift"
                            styleKey="epkPressHeadline"
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                            textValue={epk.press.headline}
                            onTextUpdate={(val) => pressUp.updateSection({ headline: val })}
                        />
                    </div>

                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Layout</h4>
                        <AtomicLayoutControl label="Press Layout" layout={epk.press.layout} onUpdate={(val) => pressUp.updateSection({ layout: val })} isMobile={isMobile} variant="sidebar" />
                    </div>
                </div>
            </CollapsibleSection>

            {/* ──── 5. BOOKING / CONTACT ──── */}
            <CollapsibleSection title="📞 Book / Kontakt" sectionId="epk-contact" isActive={false} onClick={() => { }}>
                <div className="space-y-6">
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Innhold</h4>
                        <MediaEditControl
                            label="Background Image/Video"
                            value={epk.contact.imageUrl}
                            onSave={(val) => contactUp.updateSection({ imageUrl: val })}
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                        />
                        <TextField label="Tagline" value={epk.contact.tagline} onChange={(v) => contactUp.updateSection({ tagline: v })} />
                        <TextField label="Overskrift" value={epk.contact.headline} onChange={(v) => contactUp.updateSection({ headline: v })} />
                        <TextField label="E-post" value={epk.contact.email} onChange={(v) => contactUp.updateSection({ email: v })} />
                        <TextField label="Telefon (valgfritt)" value={epk.contact.phone || ''} onChange={(v) => contactUp.updateSection({ phone: v })} placeholder="+47 ..." />
                    </div>

                    {/* Typography */}
                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <TypoHeader />
                        <TypographyEditControl
                            label="Kontakt-tagline"
                            styleKey="epkContactTagline"
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                            textValue={epk.contact.tagline}
                            onTextUpdate={(val) => contactUp.updateSection({ tagline: val })}
                        />
                        <TypographyEditControl
                            label="Kontakt-overskrift"
                            styleKey="epkContactHeadline"
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                            textValue={epk.contact.headline}
                            onTextUpdate={(val) => contactUp.updateSection({ headline: val })}
                        />
                        <TypographyEditControl
                            label="E-post-tekst"
                            styleKey="epkContactEmail"
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                            textValue={epk.contact.email}
                            onTextUpdate={(val) => contactUp.updateSection({ email: val })}
                        />
                        <TypographyEditControl
                            label="Telefon-tekst"
                            styleKey="epkContactPhone"
                            brandData={brandData}
                            onUpdate={onUpdate}
                            variant="sidebar"
                            textValue={epk.contact.phone || ''}
                            onTextUpdate={(val) => contactUp.updateSection({ phone: val })}
                        />
                    </div>

                    <VisualsBlock
                        visuals={epk.contact.visuals} framing={epk.contact.framing}
                        isMobile={isMobile} onUpdateVisuals={contactUp.updateVisuals}
                        onUpdateFraming={contactUp.updateFraming} label="Contact"
                    />

                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Layout</h4>
                        <AtomicLayoutControl label="Contact Layout" layout={epk.contact.layout} onUpdate={(val) => contactUp.updateSection({ layout: val })} isMobile={isMobile} variant="sidebar" />
                    </div>
                </div>
            </CollapsibleSection>
        </div>
    );
});