import React, { useState, useRef } from 'react';
import { BrandState } from '../types';
import { UniversalMedia, isVideo, isMux } from './SectionBasics';
import MuxPlayer from '@mux/mux-player/react';
import { extractMuxId } from '../utils/mediaHelpers';
import { InlineText } from './InlineText';
import { MediaEditControl } from './MediaEditControl';
import { MediaCustomizationControl } from './MediaCustomizationControl';
import { SaturationControl } from './SaturationControl';
import { ParallaxControl } from './ParallaxControl';
import { DimControl } from './DimControl';
import { BlurControl } from './BlurControl';
import { FramingControl } from './FramingControl';
import { OpacityControl } from './OpacityControl';
import { TypographyEditControl } from './TypographyEditControl';

import { AtomicLayoutControl } from './controls/AtomicLayoutControl';
import { FloatingControlPanel, ControlTab } from './controls/FloatingControlPanel';
import { useScrollBlur } from '../hooks/useScrollBlur';

interface LiveSectionProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
    scrollY: number;
    scrollContainerRef?: React.RefObject<HTMLDivElement>;
    mode?: 'edit' | 'publish';
}

export const LiveSection: React.FC<LiveSectionProps> = ({ brandData, onUpdate, scrollY, scrollContainerRef, mode = 'edit' }) => {
    const isPublish = mode === 'publish';
    const liveVideoRef = useRef<any>(null);
    const [isLivePlaying, setIsLivePlaying] = useState(false);
    const isMobile = brandData.isMobilePreview;

    const data = brandData.sections.home.live;
    const { layout, visuals, framing } = data;
    const blurRef = React.useRef<HTMLDivElement>(null);
    const { ref } = useScrollBlur({
        enabled: visuals.blurEnabled ?? true,
        strength: visuals.blurStrength ?? 5,
        radius: visuals.blurRadius ?? 0.5,
        targetRef: blurRef,
        scrollContainer: scrollContainerRef
    });

    const updateSection = (updates: any) => {
        onUpdate({ sections: { home: { live: updates } } } as any);
    };

    const updateVisuals = (updates: any) => {
        updateSection({ visuals: updates });
    };

    const updateFraming = (updates: any) => {
        updateSection({ framing: updates });
    };

    const toggleLivePlay = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const vid = liveVideoRef.current;
        if (!vid) return;

        if (!isLivePlaying) {
            try {
                // vid might be a MuxPlayer or a native video element
                // MuxPlayer exposes .play() directly, native video also has it.
                vid.muted = false;
                setIsLivePlaying(true);
                await vid.play();
            } catch (err) {
                console.error("Live play failed:", err);
                setIsLivePlaying(false);
            }
        } else {
            try {
                vid.pause();
                vid.muted = true;
                setIsLivePlaying(false);
            } catch (err) {
                console.error("Live pause failed:", err);
            }
        }
    };

    // Helper to get framing CSS variables
    const getFramingVars = (prefix: string, zoom: number, x: number, y: number) => {
        return {
            [`--${prefix}-zoom`]: zoom,
            [`--${prefix}-x`]: `${x}%`,
            [`--${prefix}-y`]: `${y}%`
        } as React.CSSProperties;
    };

    const getVisualVars = (prefix: string, sat: number, dim: number, para: number, op: number = 100) => {
        return {
            [`--${prefix}-sat`]: `${sat}%`,
            [`--${prefix}-dim`]: dim / 100,
            [`--${prefix}-para`]: para,
            [`--${prefix}-op`]: op / 100
        } as React.CSSProperties;
    };

    return (
        <section
            ref={ref as any}
            className={`relative flex flex-col justify-center items-center overflow-x-hidden cursor-pointer group live-section ${isLivePlaying ? 'is-playing' : ''}`}

            style={{
                minHeight: (isMobile && layout.mobileHeightMode ? layout.mobileHeightMode === 'screen' : layout.heightMode === 'screen') ? '100dvh' : 'auto',
                paddingTop: `${(isMobile ? layout.paddingTopMobile : layout.paddingTopDesktop)}rem`,
                paddingBottom: `${(isMobile ? layout.paddingBottomMobile : layout.paddingBottomDesktop)}rem`,
                marginBottom: `${(isMobile ? layout.mobileMarginBottom : layout.marginBottom)}px`,
                position: 'relative',
                ...getFramingVars('live', isMobile ? framing.zoomMobile : framing.zoomDesktop, isMobile ? framing.xOffsetMobile : framing.xOffsetDesktop, isMobile ? framing.yOffsetMobile : framing.yOffsetDesktop),
                ...getVisualVars('live', isMobile ? visuals.mobileSaturation : visuals.saturation, isMobile ? visuals.mobileDim : visuals.dim, isMobile ? visuals.mobileParallax : visuals.parallax, isMobile ? visuals.mobileOpacity : visuals.opacity)
            }}
        >
            {/* Blurred content wrapper */}
            {/* Blurred content wrapper */}
            <div
                ref={blurRef}
                className="absolute inset-0"
                style={{
                    transition: 'filter 0.1s linear'
                }}
            >
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 z-0">
                        {/* Live background video — render MuxPlayer directly for Mux IDs (EPK 'Se video' pattern)
                            so liveVideoRef points to the real mux-player element with a working .play()/.muted API */}
                        {isMux(data.videoUrl) ? (() => {
                            const muxId = extractMuxId(data.videoUrl) || '';
                            const mConfig = (data.mediaConfig || {}).mux || {} as any;
                            return (
                                <div className="absolute inset-0 overflow-hidden">
                                    <MuxPlayer
                                        ref={liveVideoRef as any}
                                        playbackId={muxId}
                                        streamType={(mConfig.streamType as any) || 'on-demand'}
                                        autoPlay={mConfig.autoPlay !== false ? (mConfig.autoPlay as any) || 'muted' : undefined}
                                        muted={mConfig.autoPlay !== false ? true : undefined}
                                        loop={mConfig.loop !== false}
                                        playsInline
                                        accentColor={mConfig.accentColor}
                                        primaryColor={mConfig.primaryColor}
                                        secondaryColor={mConfig.secondaryColor}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block',
                                            '--poster': 'none',
                                            '--controls': 'none',
                                            transform: `scale(${parseFloat(isMobile ? (mConfig.widthMobile || '100') : (mConfig.widthDesktop || '100')) / 100}) translate(${isMobile ? (mConfig.xOffsetMobile || 0) : (mConfig.xOffsetDesktop || 0)}%, ${isMobile ? (mConfig.yOffsetMobile || 0) : (mConfig.yOffsetDesktop || 0)}%)`,
                                            transformOrigin: 'center'
                                        } as React.CSSProperties}
                                    />
                                </div>
                            );
                        })() : (
                            <UniversalMedia
                                serverBaseUrl={brandData.serverBaseUrl}
                                id="live-bg-video"
                                url={data.videoUrl}
                                isMobile={isMobile}
                                zoom={isMobile ? framing.zoomMobile : framing.zoomDesktop}
                                x={isMobile ? framing.xOffsetMobile : framing.xOffsetDesktop}
                                y={isMobile ? framing.yOffsetMobile : framing.yOffsetDesktop}
                                saturation={isMobile ? visuals.mobileSaturation : visuals.saturation}
                                parallax={isMobile ? visuals.mobileParallax : visuals.parallax}
                                dim={isMobile ? visuals.mobileDim : visuals.dim}
                                opacity={isMobile ? visuals.mobileOpacity : visuals.opacity}
                                scrollY={scrollY}
                                videoRef={liveVideoRef}
                                autoPlay={false}
                                mediaConfig={data.mediaConfig}
                            />
                        )}
                    </div>
                    <div className={`transition-opacity duration-1000 absolute inset-0 z-10 ${isLivePlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        {(() => {
                            const imgFraming = data.framingImage || framing;
                            return (
                                <UniversalMedia serverBaseUrl={brandData.serverBaseUrl}
                                    id="live-preview-image"
                                    url={data.previewImageUrl}
                                    isMobile={isMobile}
                                    // prefix prop REMOVED
                                    zoom={isMobile ? imgFraming.zoomMobile : imgFraming.zoomDesktop}
                                    x={isMobile ? imgFraming.xOffsetMobile : imgFraming.xOffsetDesktop}
                                    y={isMobile ? imgFraming.yOffsetMobile : imgFraming.yOffsetDesktop}
                                    saturation={isMobile ? visuals.mobileSaturation : visuals.saturation}
                                    parallax={isMobile ? (data.parallaxImage?.mobile ?? visuals.mobileParallax) : (data.parallaxImage?.desktop ?? visuals.parallax)}
                                    dim={0}
                                    opacity={isMobile ? visuals.mobileOpacity : visuals.opacity}
                                    scrollY={scrollY}
                                    mediaConfig={data.mediaConfig}
                                />
                            );
                        })()}
                    </div>
                    <div
                        className={`absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black pointer-events-none transition-opacity duration-1000 z-20 ${isLivePlaying ? 'opacity-0' : 'opacity-100'}`}
                        style={{ opacity: (isMobile ? visuals.mobileDim : visuals.dim) / 100 }}
                    />
                </div>
            </div>

            <div className="relative z-30 text-center transition-opacity duration-1000 flex flex-col items-center justify-center p-8 md:p-0">
                <div className={`transition-all duration-1000 transform ${isLivePlaying ? 'opacity-0 translate-y-[-15px] pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                    <InlineText styleKey="homeLiveTagline" brandData={brandData} tagName="span" className="text-[var(--accent)] font-bold text-lg @md:text-5xl uppercase tracking-[0.5em] block mb-12 drop-shadow-lg" value={data.tagline} onSave={(val) => updateSection({ tagline: val })} mode={mode} />
                </div>

                <div className={`transition-all duration-1000 transform ${isLivePlaying ? 'opacity-0 translate-y-[-15px] pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                    <InlineText
                        styleKey="homeLiveHeadline"
                        brandData={brandData}
                        tagName="h2"
                        className="text-5xl @md:text-8xl @lg:text-[12rem] font-bold tracking-widest text-white leading-none glitch-heading"
                        value={data.headline}
                        onSave={(val) => updateSection({ headline: val })}
                        mode={mode}
                        {...{ "data-text": data.headline } as any}
                    />
                </div>

                <button
                    id="live-play-btn"
                    onClick={toggleLivePlay}
                    aria-label={isLivePlaying ? "Pause video" : "Play video"}
                    className="relative z-40 mt-12 w-[72px] h-[72px] md:w-24 md:h-24 rounded-full border-2 border-[var(--accent)] flex items-center justify-center text-white bg-white/10 backdrop-blur-2xl shadow-[0_0_30px_rgb(var(--accent-rgb)/0.2)] transition-all duration-500 ease-out font-bold"
                >
                    {isLivePlaying ? (
                        <div className="play-icon">
                            <svg width="24" height="24" className="md:w-8 md:h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
                        </div>
                    ) : (
                        <div className="animate-play-ring">
                            <svg width="30" height="30" className="md:w-10 md:h-10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                    )}
                </button>

                {/* Watch on YouTube Button */}
                {data.youtubeUrl && (
                    <div className={`relative z-40 mt-8 transition-all duration-1000 transform ${isLivePlaying ? 'opacity-0 translate-y-[-15px] pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                        <a
                            href={data.youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 text-white/50 hover:text-[var(--accent)] transition-colors group cursor-pointer"
                        >
                            <InlineText
                                styleKey="homeLiveYoutubeText"
                                brandData={brandData}
                                tagName="span"
                                className="uppercase tracking-[0.2em] text-xs font-bold"
                                value={data.youtubeText || "Watch on YouTube"}
                                onSave={(val) => updateSection({ youtubeText: val })}
                                mode={mode}
                            />
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transform group-hover:translate-x-1 transition-transform">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                )}
            </div>

            {/* Controls - NOT blurred */}
            {!isPublish && (
            <div className="absolute top-0 right-0 z-50 h-full pointer-events-none">
                <div className="sticky top-6 right-6 pointer-events-auto">
                    <FloatingControlPanel title="Live Section" className="absolute top-0 right-0" isMobile={brandData.isMobilePreview}>
                        <ControlTab label="Content">
                            <div className="relative w-full mb-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">YouTube Button URL</label>
                                <input
                                    type="text"
                                    value={data.youtubeUrl || ""}
                                    onChange={(e) => updateSection({ youtubeUrl: e.target.value })}
                                    placeholder="https://youtube.com/..."
                                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded p-2 text-xs focus:border-[var(--accent)] outline-none"
                                />
                            </div>
                            <div className="relative w-full mb-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">YouTube Button Text</label>
                                <input
                                    type="text"
                                    value={data.youtubeText || ""}
                                    onChange={(e) => updateSection({ youtubeText: e.target.value })}
                                    placeholder="Watch on YouTube"
                                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded p-2 text-xs focus:border-[var(--accent)] outline-none"
                                />
                            </div>
                            <div className="w-full h-px bg-white/10 my-4"></div>

                            <MediaEditControl label="Change Live Video" value={data.videoUrl} onSave={(val) => updateSection({ videoUrl: val })} brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            <MediaEditControl label="Change Preview Image" value={data.previewImageUrl} onSave={(val) => updateSection({ previewImageUrl: val })} brandData={brandData} onUpdate={onUpdate} variant="sidebar" />

                            <MediaCustomizationControl
                                type={isVideo(data.videoUrl) ? 'video' : 'mux'}
                                config={data.mediaConfig || {}}
                                onUpdate={(updates) => updateSection({ mediaConfig: { ...data.mediaConfig, ...updates } })}
                                accentColor={brandData.accentColor}
                            />

                            <TypographyEditControl label="Live Tagline" styleKey="homeLiveTagline" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            <TypographyEditControl label="Live Headline" styleKey="homeLiveHeadline" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            <TypographyEditControl label="YouTube Text" styleKey="homeLiveYoutubeText" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                        </ControlTab>

                        <ControlTab label="Visuals">
                            <SaturationControl label={isMobile ? "Live (Mobile)" : "Live"} value={isMobile ? visuals.mobileSaturation : visuals.saturation} onSave={(val) => updateVisuals(isMobile ? { mobileSaturation: val } : { saturation: val })} variant="sidebar" />
                            <ParallaxControl label={isMobile ? "Video Parallax (Mobile)" : "Video Parallax"} value={isMobile ? visuals.mobileParallax : visuals.parallax} onSave={(val) => updateVisuals(isMobile ? { mobileParallax: val } : { parallax: val })} variant="sidebar" />
                            <ParallaxControl
                                label={isMobile ? "Image Parallax (Mobile)" : "Image Parallax"}
                                value={isMobile ? (data.parallaxImage?.mobile ?? visuals.mobileParallax) : (data.parallaxImage?.desktop ?? visuals.parallax)}
                                onSave={(val) => {
                                    const current = data.parallaxImage || { desktop: visuals.parallax, mobile: visuals.mobileParallax };
                                    updateSection({ parallaxImage: { ...current, [isMobile ? 'mobile' : 'desktop']: val } });
                                }}
                                variant="sidebar"
                            />
                            <DimControl label={isMobile ? "Live (Mobile)" : "Live"} value={isMobile ? visuals.mobileDim : visuals.dim} onSave={(val) => updateVisuals(isMobile ? { mobileDim: val } : { dim: val })} variant="sidebar" />
                            <OpacityControl
                                label={isMobile ? "Live (Mobile)" : "Live"}
                                value={isMobile ? visuals.mobileOpacity ?? 100 : visuals.opacity ?? 100}
                                onSave={(val) => updateVisuals(isMobile ? { mobileOpacity: val } : { opacity: val })}
                                variant="sidebar"
                            />
                            <BlurControl
                                label="Live"
                                enabled={visuals.blurEnabled ?? true}
                                strength={visuals.blurStrength ?? 5}
                                radius={visuals.blurRadius ?? 0.5}
                                onUpdate={(vals) => updateVisuals(vals)}
                                variant="sidebar"
                            />
                            <FramingControl
                                label="Live Video"
                                isMobileMode={isMobile}
                                zoom={isMobile ? framing.zoomMobile : framing.zoomDesktop}
                                xOffset={isMobile ? framing.xOffsetMobile : framing.xOffsetDesktop}
                                yOffset={isMobile ? framing.yOffsetMobile : framing.yOffsetDesktop}
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
                                    updateFraming(updates);
                                }}
                                variant="sidebar"
                            />
                            <FramingControl
                                label="Preview Image"
                                isMobileMode={isMobile}
                                zoom={isMobile ? (data.framingImage?.zoomMobile ?? framing.zoomMobile) : (data.framingImage?.zoomDesktop ?? framing.zoomDesktop)}
                                xOffset={isMobile ? (data.framingImage?.xOffsetMobile ?? framing.xOffsetMobile) : (data.framingImage?.xOffsetDesktop ?? framing.xOffsetDesktop)}
                                yOffset={isMobile ? (data.framingImage?.yOffsetMobile ?? framing.yOffsetMobile) : (data.framingImage?.yOffsetDesktop ?? framing.yOffsetDesktop)}
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
                                    updateSection({ framingImage: { ...(data.framingImage || framing), ...updates } });
                                }}
                                variant="sidebar"
                            />
                        </ControlTab>

                        <ControlTab label="Layout">
                            <AtomicLayoutControl
                                label="Live Layout"
                                layout={layout}
                                onUpdate={(val) => updateSection({ layout: val })}
                                isMobile={isMobile}
                                variant="sidebar"
                            />
                        </ControlTab>
                    </FloatingControlPanel>
                </div>
            </div>
            )}
        </section>
    );
};
