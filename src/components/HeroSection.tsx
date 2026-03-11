import React from 'react';
import { BrandState } from '../types';
import { UniversalMedia } from './SectionBasics';
import { InlineText } from './InlineText';
import { MediaEditControl } from './MediaEditControl';
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

interface HeroSectionProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
    scrollY: number;
    scrollContainerRef?: React.RefObject<HTMLDivElement>;
    mode?: 'edit' | 'publish';
}

export const HeroSection: React.FC<HeroSectionProps> = ({ brandData, onUpdate, scrollY, scrollContainerRef, mode = 'edit' }) => {
    const isPublish = mode === 'publish';
    const isMobile = brandData.isMobilePreview;
    const data = brandData.sections.home.hero;
    const { layout, visuals, framing } = data;
    const blurRef = React.useRef<HTMLDivElement>(null);
    const { ref } = useScrollBlur({
        enabled: visuals.blurEnabled ?? true,
        strength: visuals.blurStrength ?? 5,
        radius: visuals.blurRadius ?? 0.5,
        targetRef: blurRef,
        scrollContainer: scrollContainerRef
    });

    // Helper for Section Updates
    const updateSection = (updates: any) => {
        onUpdate({ sections: { home: { hero: updates } } } as any);
    };

    const updateVisuals = (updates: any) => {
        updateSection({ visuals: updates });
    };

    const updateFraming = (updates: any) => {
        updateSection({ framing: updates });
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
            className="group relative flex flex-col justify-center items-center overflow-hidden"
            style={{
                minHeight: (isMobile
                    ? (layout.mobileHeightMode ?? layout.heightMode) !== 'screen'
                    : layout.heightMode !== 'screen') ? 'auto' : '100dvh',
                paddingTop: `${(isMobile ? layout.paddingTopMobile : layout.paddingTopDesktop)}rem`,
                paddingBottom: `${(isMobile ? layout.paddingBottomMobile : layout.paddingBottomDesktop)}rem`,
                marginBottom: `${(isMobile ? layout.mobileMarginBottom : layout.marginBottom)}px`,
                ...getFramingVars('hero', isMobile ? framing.zoomMobile : framing.zoomDesktop, isMobile ? framing.xOffsetMobile : framing.xOffsetDesktop, isMobile ? framing.yOffsetMobile : framing.yOffsetDesktop),
                ...getVisualVars('hero', isMobile ? visuals.mobileSaturation : visuals.saturation, isMobile ? visuals.mobileDim : visuals.dim, isMobile ? visuals.mobileParallax : visuals.parallax, isMobile ? visuals.mobileOpacity : visuals.opacity)
            }}
        >
            <div ref={blurRef} className="absolute inset-0" style={{ transition: 'filter 0.1s linear' }}>
                <UniversalMedia serverBaseUrl={brandData.serverBaseUrl}
                    url={data.videoUrl}
                    isMobile={isMobile}
                    prefix="hero"
                    zoom={isMobile ? (data.framing?.zoomMobile ?? 100) : (data.framing?.zoomDesktop ?? 100)}
                    x={isMobile ? (data.framing?.xOffsetMobile ?? 0) : (data.framing?.xOffsetDesktop ?? 0)}
                    y={isMobile ? (data.framing?.yOffsetMobile ?? 0) : (data.framing?.yOffsetDesktop ?? 0)}
                    saturation={isMobile ? (data.visuals?.mobileSaturation ?? 100) : (data.visuals?.saturation ?? 100)}
                    parallax={isMobile ? (data.visuals?.mobileParallax ?? 0) : (data.visuals?.parallax ?? 0)}
                    dim={isMobile ? (data.visuals?.mobileDim ?? 0) : (data.visuals?.dim ?? 0)}
                    opacity={isMobile ? (data.visuals?.mobileOpacity ?? 100) : (data.visuals?.opacity ?? 100)}
                    scrollY={scrollY}
                    isHero={true}
                    mediaConfig={data.mediaConfig}
                    publishMode={isPublish}
                />
                {/* Cover image layer — mirrors Live section previewImageUrl pattern.
                    Sits on top of the video and is visible immediately (no WC dependency).
                    This is the LCP element in publish mode. */}
                {data.heroImageUrl && (
                    <div className="hero-cover-overlay absolute inset-0 z-10 transition-opacity duration-1000">
                        <UniversalMedia
                            serverBaseUrl={brandData.serverBaseUrl}
                            url={data.heroImageUrl}
                            isMobile={isMobile}
                            prefix="hero"
                            zoom={isMobile ? (data.framing?.zoomMobile ?? 1) : (data.framing?.zoomDesktop ?? 1)}
                            x={isMobile ? (data.framing?.xOffsetMobile ?? 0) : (data.framing?.xOffsetDesktop ?? 0)}
                            y={isMobile ? (data.framing?.yOffsetMobile ?? 0) : (data.framing?.yOffsetDesktop ?? 0)}
                            saturation={isMobile ? (data.visuals?.mobileSaturation ?? 100) : (data.visuals?.saturation ?? 100)}
                            parallax={isMobile ? (data.visuals?.mobileParallax ?? 0) : (data.visuals?.parallax ?? 0)}
                            dim={isMobile ? (data.visuals?.mobileDim ?? 0) : (data.visuals?.dim ?? 0)}
                            opacity={isMobile ? (data.visuals?.mobileOpacity ?? 100) : (data.visuals?.opacity ?? 100)}
                            scrollY={scrollY}
                            isHero={true}
                            publishMode={isPublish}
                        />
                    </div>
                )}
            </div>

            {!isPublish && (
            <div className="absolute top-0 right-0 z-50 h-full pointer-events-none">
                <div className="sticky top-6 right-6 pointer-events-auto">
                    <FloatingControlPanel title="Hero Section" className="absolute top-0 right-0" isMobile={brandData.isMobilePreview}>
                        <ControlTab label="Content">
                            <MediaEditControl
                                label="Background"
                                value={data.videoUrl}
                                onSave={(val) => updateSection({ videoUrl: val })}
                                brandData={brandData}
                                onUpdate={onUpdate}
                                variant="sidebar"
                            />
                            <MediaEditControl
                                label="Cover Image"
                                value={data.heroImageUrl ?? ''}
                                onSave={(val) => updateSection({ heroImageUrl: val })}
                                brandData={brandData}
                                onUpdate={onUpdate}
                                variant="sidebar"
                            />
                            <TypographyEditControl
                                label="Headline"
                                styleKey="homeHeadline"
                                brandData={brandData}
                                onUpdate={onUpdate}
                                variant="sidebar"
                                textValue={data.headline}
                                onTextUpdate={(val) => updateSection({ headline: val })}
                            />
                            <TypographyEditControl
                                label="Subheadline"
                                styleKey="homeSubheadline"
                                brandData={brandData}
                                onUpdate={onUpdate}
                                variant="sidebar"
                                textValue={data.subheadline}
                                onTextUpdate={(val) => updateSection({ subheadline: val })}
                            />
                        </ControlTab>

                        <ControlTab label="Visuals">
                            <SaturationControl
                                label={isMobile ? "Hero (Mobile)" : "Hero"}
                                value={isMobile ? visuals.mobileSaturation : visuals.saturation}
                                onSave={(val) => updateVisuals(isMobile ? { mobileSaturation: val } : { saturation: val })}
                                variant="sidebar"
                            />
                            <ParallaxControl
                                label={isMobile ? "Hero (Mobile)" : "Hero"}
                                value={isMobile ? visuals.mobileParallax : visuals.parallax}
                                onSave={(val) => updateVisuals(isMobile ? { mobileParallax: val } : { parallax: val })}
                                variant="sidebar"
                            />
                            <DimControl
                                label={isMobile ? "Hero (Mobile)" : "Hero"}
                                value={isMobile ? visuals.mobileDim : visuals.dim}
                                onSave={(val) => updateVisuals(isMobile ? { mobileDim: val } : { dim: val })}
                                variant="sidebar"
                            />
                            <OpacityControl
                                label={isMobile ? "Hero (Mobile)" : "Hero"}
                                value={isMobile ? visuals.mobileOpacity ?? 100 : visuals.opacity ?? 100}
                                onSave={(val) => updateVisuals(isMobile ? { mobileOpacity: val } : { opacity: val })}
                                variant="sidebar"
                            />
                            <BlurControl
                                label="Hero"
                                enabled={visuals.blurEnabled ?? true}
                                strength={visuals.blurStrength ?? 5}
                                radius={visuals.blurRadius ?? 0.5}
                                onUpdate={(vals) => updateVisuals(vals)}
                                variant="sidebar"
                            />
                            <FramingControl
                                label="Hero"
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
                        </ControlTab>

                        <ControlTab label="Layout">
                            <AtomicLayoutControl
                                label="Hero Layout"
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

            <div className="relative z-10 text-center max-w-6xl w-full">
                <InlineText
                    styleKey="homeHeadline"
                    brandData={brandData}
                    tagName="h1"
                    className="text-4xl @md:text-7xl @lg:text-9xl font-bold mb-4 tracking-tighter text-white uppercase leading-none glitch-heading"
                    value={data.headline}
                    onSave={(val) => updateSection({ headline: val })}
                    mode={mode}
                    {...{ "data-text": data.headline } as any}
                />
                <InlineText
                    styleKey="homeSubheadline"
                    brandData={brandData}
                    tagName="p"
                    className={`${isMobile ? 'text-xl' : 'text-2xl'} text-zinc-300 font-serif italic mb-8`}
                    value={data.subheadline}
                    onSave={(val) => updateSection({ subheadline: val })}
                    mode={mode}
                />
                <div className="flex flex-col items-center gap-4">
                    <button className="relative overflow-hidden group/btn px-8 py-4 bg-black/60 backdrop-blur-md border border-[var(--accent)] text-white hover:text-[var(--accent)] transition-all duration-300 rounded-lg">
                        <div className="absolute inset-0 bg-[var(--accent)]/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                        <InlineText
                            styleKey="homeOriginCtaText"
                            brandData={brandData}
                            tagName="span"
                            className="relative z-10 font-bold uppercase tracking-[0.2em] text-sm"
                            value={data.ctaText}
                            onSave={(val) => updateSection({ ctaText: val })}
                            mode={mode}
                        />
                    </button>
                    <div className="mt-8 animate-bounce">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>
        </section>
    );
};
