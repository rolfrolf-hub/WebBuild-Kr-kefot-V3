import React, { useEffect, useRef, useState } from 'react';
import { BrandState, MediaItem } from '../types';
import { MediaCard } from './MediaCard';
import { InlineText } from './InlineText';
import { TypographyEditControl } from './TypographyEditControl';
import { MediaEditControl } from './MediaEditControl';
import { LayoutControl } from './LayoutControl';
import { SaturationControl } from './SaturationControl';
import { DimControl } from './DimControl';
import { BlurControl } from './BlurControl';
import { OpacityControl } from './OpacityControl';
import { AtomicLayoutControl } from './controls/AtomicLayoutControl';
import { FloatingControlPanel, ControlTab } from './controls/FloatingControlPanel';
import { UniversalMedia } from './SectionBasics';
import { useScrollBlur } from '../hooks/useScrollBlur';

interface MediaGallerySectionProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
    scrollContainerRef?: React.RefObject<HTMLDivElement>;
    mode?: 'edit' | 'publish';
}

export const MediaGallerySection: React.FC<MediaGallerySectionProps> = ({ brandData, onUpdate, scrollContainerRef, mode = 'edit' }) => {
    const isPublish = mode === 'publish';
    const galleryRef = useRef<HTMLDivElement>(null);
    const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
    const animationRef = useRef<number | null>(null);
    const isPausedRef = useRef(false);
    const isVideoPlayingRef = useRef(false);
    const isMobile = brandData.isMobilePreview;
    // Exposed so global click handler can cancel pending resume and resume immediately
    const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const data = brandData.sections.home.spotify;
    const { layout, visuals } = data;
    const blurRef = React.useRef<HTMLDivElement>(null);
    const { ref } = useScrollBlur({
        enabled: visuals.blurEnabled ?? true,
        strength: visuals.blurStrength ?? 5,
        radius: visuals.blurRadius ?? 0.5,
        targetRef: blurRef,
        scrollContainer: scrollContainerRef
    });

    const updateSection = (updates: any) => {
        onUpdate({ sections: { home: { spotify: updates } } } as any);
    };

    const updateVisuals = (updates: any) => {
        updateSection({ visuals: updates });
    };

    const activeMediaIdRef = useRef<string | null>(null);
    useEffect(() => { activeMediaIdRef.current = activeMediaId; }, [activeMediaId]);

    useEffect(() => {
        const gallery = galleryRef.current;
        if (!gallery) return;

        const setPaused = (val: boolean, delay: number = 0) => {
            if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
            if (val) {
                isPausedRef.current = true;
            } else {
                resumeTimeoutRef.current = setTimeout(() => {
                    isPausedRef.current = false;
                }, delay);
            }
        };

        const handleMouseEnter = () => setPaused(true);
        const handleMouseLeave = () => setPaused(false, 1000);
        const handleTouchStart = () => setPaused(true);
        const handleTouchEnd = () => setPaused(false, 2000);
        const handleScroll = () => {
            // If scrolling happens while not paused, it's either user or momentum
            // We pause to allow it to finish smoothly
            setPaused(true);
            setPaused(false, 3000);
        };

        gallery.addEventListener('mouseenter', handleMouseEnter);
        gallery.addEventListener('mouseleave', handleMouseLeave);
        gallery.addEventListener('touchstart', handleTouchStart, { passive: true });
        gallery.addEventListener('touchend', handleTouchEnd);

        let scrollPos = gallery.scrollLeft;
        // Punkt 4: Desktop 20% raskere enn mobil (0.6 vs 0.5) for lik opplevd hastighet
        const speed = isMobile ? 0.5 : 0.6;
        const glide = () => {
            if (!gallery) return;
            // PAUSE LOGIC: Stop if hovered OR if a media item is active
            if (!isPausedRef.current && !activeMediaIdRef.current) {
                scrollPos += speed;
                const halfWidth = gallery.scrollWidth / 2;
                if (scrollPos >= halfWidth) scrollPos -= halfWidth;
                gallery.scrollLeft = scrollPos;
            } else {
                // Keep scrollPos synced with user interaction or current spot
                scrollPos = gallery.scrollLeft;
            }
            animationRef.current = requestAnimationFrame(glide);
        };

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                if (!animationRef.current) animationRef.current = requestAnimationFrame(glide);
            } else {
                if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = null; }
                // Close active media when scrolling past section
                setActiveMediaId(null);
            }
        }, { threshold: 0 });

        observer.observe(gallery);
        return () => {
            observer.disconnect();
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            gallery.removeEventListener('mouseenter', handleMouseEnter);
            gallery.removeEventListener('mouseleave', handleMouseLeave);
            gallery.removeEventListener('touchstart', handleTouchStart);
            gallery.removeEventListener('touchend', handleTouchEnd);
            if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        };
    }, [data.items.length, data.gapDesktop, brandData.mediaImgSizeDesktop, activeMediaId]);

    useEffect(() => { isVideoPlayingRef.current = !!activeMediaId; }, [activeMediaId]);

    const cols = isMobile ? data.columnsMobile : data.columnsDesktop;
    const gap = isMobile ? data.gapMobile : data.gapDesktop;
    const scale = isMobile ? data.scaleMobile : data.scaleDesktop;
    const imgSize = isMobile ? brandData.mediaImgSizeMobile : brandData.mediaImgSizeDesktop;
    const itemWidthPercent = imgSize / cols;
    const aspectRatio = isMobile ? (data.aspectRatioMobile || '1/1') : (data.aspectRatioDesktop || '1/1');
    const displayItems = [...data.items, ...data.items];
    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.media-gallery-item')) {
                setActiveMediaId(null);
                // Punkt 5: Umiddelbar resume — kansel ventende delay og gjenoppta nå
                if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
                isPausedRef.current = false;
            }
        };
        window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, []);

    return (
        <section
            ref={ref as any}
            className="relative z-20 overflow-hidden group"
            style={{
                minHeight: (isMobile || layout.heightMode !== 'screen') ? 'auto' : '100dvh',
                paddingTop: `${(isMobile ? layout.paddingTopMobile : layout.paddingTopDesktop)}rem`,
                paddingBottom: `${(isMobile ? layout.paddingBottomMobile : layout.paddingBottomDesktop)}rem`,
                marginBottom: `${(isMobile ? layout.mobileMarginBottom : layout.marginBottom)}px`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative'
            }}
        >
            {!isPublish && (
            <div className="absolute top-0 right-0 z-50 h-full pointer-events-none">
                <div className="sticky top-6 right-6 pointer-events-auto">
                    <FloatingControlPanel title="Gallery Section" className="absolute top-0 right-0" isMobile={brandData.isMobilePreview}>
                        <ControlTab label="Content">
                            <TypographyEditControl
                                label="Section Title"
                                styleKey="homeSpotifyTitle"
                                brandData={brandData}
                                onUpdate={onUpdate}
                                variant="sidebar"
                            />
                            <MediaEditControl
                                label="Change Media BG"
                                value={data.imageUrl}
                                onSave={(val) => updateSection({ imageUrl: val })}
                                brandData={brandData}
                                onUpdate={onUpdate}
                                variant="sidebar"
                            />
                        </ControlTab>

                        <ControlTab label="Layout">
                            <LayoutControl
                                label="Grid Layout"
                                columns={isMobile ? data.columnsMobile : data.columnsDesktop}
                                gap={isMobile ? data.gapMobile : data.gapDesktop}
                                scale={isMobile ? data.scaleMobile : data.scaleDesktop}
                                itemSize={isMobile ? brandData.mediaImgSizeMobile : brandData.mediaImgSizeDesktop}
                                aspectRatio={isMobile ? data.aspectRatioMobile : data.aspectRatioDesktop}
                                isMobileMode={isMobile}
                                brandData={brandData}
                                onUpdate={(updates) => {
                                    const changes: any = {};
                                    if (updates.columns !== undefined) isMobile ? changes.columnsMobile = updates.columns : changes.columnsDesktop = updates.columns;
                                    if (updates.gap !== undefined) isMobile ? changes.gapMobile = updates.gap : changes.gapDesktop = updates.gap;
                                    if (updates.scale !== undefined) isMobile ? changes.scaleMobile = updates.scale : changes.scaleDesktop = updates.scale;
                                    if (updates.itemSize !== undefined) isMobile ? onUpdate({ mediaImgSizeMobile: updates.itemSize }) : onUpdate({ mediaImgSizeDesktop: updates.itemSize });
                                    if (updates.aspectRatio !== undefined) isMobile ? changes.aspectRatioMobile = updates.aspectRatio : changes.aspectRatioDesktop = updates.aspectRatio;
                                    updateSection(changes);
                                }}
                                variant="sidebar"
                            />
                            <AtomicLayoutControl
                                label="Section Padding"
                                layout={layout}
                                onUpdate={(val) => updateSection({ layout: val })}
                                isMobile={isMobile}
                                variant="sidebar"
                            />
                        </ControlTab>

                        <ControlTab label="Visuals">
                            <SaturationControl
                                label={isMobile ? "Media BG (Mobile)" : "Media BG"}
                                value={isMobile ? visuals.mobileSaturation : visuals.saturation}
                                onSave={(val) => updateVisuals(isMobile ? { mobileSaturation: val } : { saturation: val })}
                                variant="sidebar"
                            />
                            <DimControl
                                label={isMobile ? "Media BG (Mobile)" : "Media BG"}
                                value={isMobile ? visuals.mobileDim : visuals.dim}
                                onSave={(val) => updateVisuals(isMobile ? { mobileDim: val } : { dim: val })}
                                variant="sidebar"
                            />
                            <OpacityControl
                                label={isMobile ? "Media BG (Mobile)" : "Media BG"}
                                value={isMobile ? visuals.mobileOpacity ?? 100 : visuals.opacity ?? 100}
                                onSave={(val) => updateVisuals(isMobile ? { mobileOpacity: val } : { opacity: val })}
                                variant="sidebar"
                            />
                            <BlurControl
                                label="Section"
                                enabled={visuals.blurEnabled ?? true}
                                strength={visuals.blurStrength ?? 5}
                                radius={visuals.blurRadius ?? 0.5}
                                onUpdate={(vals) => updateVisuals(vals)}
                                variant="sidebar"
                            />
                        </ControlTab>
                    </FloatingControlPanel>
                </div>
            </div>
            )}

            <div ref={blurRef} className="absolute inset-0 z-0" style={{ transition: 'filter 0.1s linear' }}>
                <UniversalMedia serverBaseUrl={brandData.serverBaseUrl}
                    url={data.imageUrl}
                    isMobile={isMobile}
                    zoom={isMobile ? data.framing?.zoomMobile : data.framing?.zoomDesktop}
                    x={isMobile ? data.framing?.xOffsetMobile : data.framing?.xOffsetDesktop}
                    y={isMobile ? data.framing?.yOffsetMobile : data.framing?.yOffsetDesktop}
                    saturation={isMobile ? visuals.mobileSaturation : visuals.saturation}
                    parallax={isMobile ? visuals.mobileParallax : visuals.parallax}
                    dim={isMobile ? visuals.mobileDim : visuals.dim}
                    opacity={isMobile ? visuals.mobileOpacity : visuals.opacity}
                    scrollY={0}
                    mediaConfig={data.mediaConfig}
                />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 w-full">
                <div className="text-center mb-16 container mx-auto">
                    <InlineText
                        styleKey="homeSpotifyTitle"
                        brandData={brandData}
                        tagName="h2"
                        className="text-[var(--accent)] font-bold text-xs md:text-sm uppercase tracking-[0.4em]"
                        value={data.title}
                        onSave={(val) => updateSection({ title: val })}
                        mode={mode}
                    />
                </div>
            </div>

            <div className="w-full relative z-10 cq-gallery">

                <div
                    ref={galleryRef}
                    className="media-gallery-grid"
                    data-carousel="true"
                    style={{
                        display: 'flex',
                        flexWrap: 'nowrap',
                        overflowX: 'auto',
                        gap: `${gap * 4}px`,
                        justifyContent: 'flex-start',
                        padding: '0 max(1rem, 5vw) 2rem',
                        scrollBehavior: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        ['--media-size' as any]: `${itemWidthPercent}%`,
                        transform: `scale(${scale})`,
                        transformOrigin: 'center'
                    }}
                >
                    {displayItems.map((item, i) => (
                        <MediaCard
                            key={`${item.id}-${i}`}
                            item={item}
                            index={i}
                            brandData={brandData}
                            onGlobalUpdate={onUpdate}
                            isClone={i >= data.items.length}
                            isActive={activeMediaId === item.id}
                            onToggleActive={setActiveMediaId}
                            sizes={isMobile ? `${Math.round(100 / (data.columnsMobile || 2))}vw` : `${Math.round(100 / (data.columnsDesktop || 4))}vw`}
                            style={{
                                flex: `0 0 ${itemWidthPercent}%`,
                                width: `${itemWidthPercent}%`,
                                aspectRatio: isMobile ? (data.aspectRatioMobile || '1/1') : (data.aspectRatioDesktop || '1/1')
                            }}
                            onUpdate={(updated) => {
                                const newItems = [...data.items];
                                newItems[i % data.items.length] = { ...item, ...updated };
                                updateSection({ items: newItems });
                            }}
                        />
                    ))}
                    {!isPublish && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            updateSection({ items: [...data.items, { id: `m${Date.now()}`, type: 'spotify', url: '', title: 'New Media', artist: 'Artist' }] });
                        }}
                        className="media-gallery-item rounded-[2rem] border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-600 hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-pointer transition-all flex-shrink-0"
                        style={{
                            flex: `0 0 ${itemWidthPercent}%`,
                            width: `${itemWidthPercent}%`,
                            aspectRatio: isMobile ? (data.aspectRatioMobile || '1/1') : (data.aspectRatioDesktop || '1/1')
                        }}
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest mt-2">Add Media</span>
                    </div>
                    )}
                </div>

                {/* Listen On Section (Parity Fix) */}
                <div className="mt-20 flex flex-col items-center gap-8 px-4">
                    <InlineText
                        styleKey="homeSpotifyTitle"
                        brandData={brandData}
                        tagName="h3"
                        className="text-[var(--accent)] font-bold text-xs md:text-sm uppercase tracking-[0.4em]"
                        value="HØR MER"
                        onSave={() => { }}
                        mode={mode}
                    />
                    <div className="flex flex-nowrap items-center justify-center gap-4 md:gap-10 text-zinc-400">
                        {brandData.socials.spotifyUrl && (
                            <a href={brandData.socials.spotifyUrl} target="_blank" className="hover:text-[var(--accent)] hover:scale-110 transition-all duration-500" aria-label="Spotify">
                                <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14.5c2.5-1 5.5-1 8 0" /><path d="M7 11.5c3.5-1.5 7-1.5 10.5 0" /><path d="M6.5 8.5c3.5-2 7.5-2 11 0" /></svg>
                            </a>
                        )}
                        {brandData.socials.appleUrl && (
                            <a href={brandData.socials.appleUrl} target="_blank" className="hover:text-[var(--accent)] hover:scale-110 transition-all duration-500" aria-label="Apple Music">
                                <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                            </a>
                        )}
                        {brandData.socials.soundcloudUrl && (
                            <a href={brandData.socials.soundcloudUrl} target="_blank" className="hover:text-[var(--accent)] hover:scale-110 transition-all duration-500" aria-label="SoundCloud">
                                <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.39 12.01a3.01 3.01 0 0 0 0 6h1.22" /><path d="M12.91 18.01h6.63a3.46 3.46 0 0 0 0-6.92 3.39 3.39 0 0 0-2.5 1.1" /><path d="M8.22 18.01h2.46" /><path d="M8.22 11.51v6.5" /><path d="M10.68 10.51v7.5" /><path d="M5.61 12.01v6" /><path d="M12.91 8.01v10" /><path d="M15.37 11.01v7" /><path d="M3.1 14.01v2" /></svg>
                            </a>
                        )}
                        {brandData.socials.youtubeUrl && (
                            <a href={brandData.socials.youtubeUrl} target="_blank" className="hover:text-[var(--accent)] hover:scale-110 transition-all duration-500" aria-label="YouTube Music">
                                <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z" /></svg>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </section >
    );
};
