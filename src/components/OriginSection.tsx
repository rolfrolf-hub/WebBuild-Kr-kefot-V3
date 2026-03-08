import React from 'react';
import { BrandState } from '../types';
import { UniversalMedia, FadeIn } from './SectionBasics';
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

interface OriginSectionProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
    onNavigate: (page: 'home' | 'about' | 'contact') => void;
    scrollY: number;
    scrollContainerRef?: React.RefObject<HTMLDivElement>;
    mode?: 'edit' | 'publish';
}

export const OriginSection: React.FC<OriginSectionProps> = ({ brandData, onUpdate, onNavigate, scrollY, scrollContainerRef, mode = 'edit' }) => {
    const isPublish = mode === 'publish';
    const isMobile = brandData.isMobilePreview;
    const data = brandData.sections.home.origin;
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
        onUpdate({ sections: { home: { origin: updates } } } as any);
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
            className={`relative ${isMobile ? 'px-4' : 'md:px-6'} border-t border-zinc-900 overflow-hidden group`}
            style={{
                minHeight: (isMobile
                    ? (layout.mobileHeightMode ?? layout.heightMode) !== 'screen'
                    : layout.heightMode !== 'screen') ? 'auto' : '100dvh',
                paddingTop: `${(isMobile ? layout.paddingTopMobile : layout.paddingTopDesktop)}rem`,
                paddingBottom: `${(isMobile ? layout.paddingBottomMobile : layout.paddingBottomDesktop)}rem`,
                marginBottom: `${(isMobile ? layout.mobileMarginBottom : layout.marginBottom)}px`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                ...getFramingVars('origin', isMobile ? framing.zoomMobile : framing.zoomDesktop, isMobile ? framing.xOffsetMobile : framing.xOffsetDesktop, isMobile ? framing.yOffsetMobile : framing.yOffsetDesktop),
                ...getVisualVars('origin', isMobile ? visuals.mobileSaturation : visuals.saturation, isMobile ? visuals.mobileDim : visuals.dim, isMobile ? visuals.mobileParallax : visuals.parallax, isMobile ? visuals.mobileOpacity : visuals.opacity)
            }}
        >
            <div ref={blurRef} className="absolute inset-0" style={{ transition: 'filter 0.1s linear' }}>
                <UniversalMedia serverBaseUrl={brandData.serverBaseUrl}
                    url={data.imageUrl}
                    isMobile={isMobile}
                    zoom={isMobile ? (framing.zoomMobile ?? 100) : (framing.zoomDesktop ?? 100)}
                    x={isMobile ? (framing.xOffsetMobile ?? 0) : (framing.xOffsetDesktop ?? 0)}
                    y={isMobile ? (framing.yOffsetMobile ?? 0) : (framing.yOffsetDesktop ?? 0)}
                    saturation={isMobile ? (visuals.mobileSaturation ?? 100) : (visuals.saturation ?? 100)}
                    parallax={isMobile ? (visuals.mobileParallax ?? 0) : (visuals.parallax ?? 0)}
                    dim={isMobile ? (visuals.mobileDim ?? 0) : (visuals.dim ?? 0)}
                    opacity={isMobile ? (visuals.mobileOpacity ?? 100) : (visuals.opacity ?? 100)}
                    scrollY={scrollY}
                    mediaConfig={data.mediaConfig}
                />
            </div>

            {!isPublish && (
            <div className="absolute top-0 right-0 z-50 h-full pointer-events-none">
                <div className="sticky top-6 right-6 pointer-events-auto">
                    <FloatingControlPanel title="Origin Section" className="absolute top-0 right-0" isMobile={brandData.isMobilePreview}>
                        <ControlTab label="Content">
                            <MediaEditControl
                                label="Change Image"
                                value={data.imageUrl}
                                onSave={(val) => updateSection({ imageUrl: val })}
                                brandData={brandData}
                                onUpdate={onUpdate}
                                variant="sidebar"
                            />
                            <TypographyEditControl label="Tagline" styleKey="homeOriginTagline" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            <TypographyEditControl label="Headline" styleKey="homeOriginHeadline" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            <TypographyEditControl label="Lead Text" styleKey="homeOriginText" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            <TypographyEditControl label="Description" styleKey="homeOriginDescription" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            <TypographyEditControl label="Button Style" styleKey="homeOriginCtaText" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                        </ControlTab>

                        <ControlTab label="Visuals">
                            <SaturationControl
                                label={isMobile ? "Origin (Mobile)" : "Origin"}
                                value={isMobile ? visuals.mobileSaturation : visuals.saturation}
                                onSave={(val) => updateVisuals(isMobile ? { mobileSaturation: val } : { saturation: val })}
                                variant="sidebar"
                            />
                            <ParallaxControl
                                label={isMobile ? "Origin (Mobile)" : "Origin"}
                                value={isMobile ? visuals.mobileParallax : visuals.parallax}
                                onSave={(val) => updateVisuals(isMobile ? { mobileParallax: val } : { parallax: val })}
                                variant="sidebar"
                            />
                            <DimControl
                                label={isMobile ? "Origin (Mobile)" : "Origin"}
                                value={isMobile ? visuals.mobileDim : visuals.dim}
                                onSave={(val) => updateVisuals(isMobile ? { mobileDim: val } : { dim: val })}
                                variant="sidebar"
                            />
                            <OpacityControl
                                label={isMobile ? "Origin (Mobile)" : "Origin"}
                                value={isMobile ? visuals.mobileOpacity ?? 100 : visuals.opacity ?? 100}
                                onSave={(val) => updateVisuals(isMobile ? { mobileOpacity: val } : { opacity: val })}
                                variant="sidebar"
                            />
                            <BlurControl
                                label="Origin"
                                enabled={visuals.blurEnabled ?? true}
                                strength={visuals.blurStrength ?? 5}
                                radius={visuals.blurRadius ?? 0.5}
                                onUpdate={(vals) => updateVisuals(vals)}
                                variant="sidebar"
                            />
                            <FramingControl
                                label="Origin"
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
                                label="Origin Layout"
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

            <FadeIn className="container relative z-10 mx-auto max-w-4xl text-center px-4">
                <InlineText
                    styleKey="homeOriginTagline"
                    brandData={brandData}
                    tagName="span"
                    className="text-[var(--accent)] font-bold text-xs uppercase tracking-[0.4em] block mb-4"
                    value={data.tagline}
                    onSave={(val) => updateSection({ tagline: val })}
                    mode={mode}
                />
                <InlineText
                    styleKey="homeOriginHeadline"
                    brandData={brandData}
                    tagName="h2"
                    className="text-4xl @md:text-7xl @lg:text-9xl font-bold mb-6 tracking-tighter text-white uppercase leading-tight glitch-heading"
                    value={data.headline}
                    onSave={(val) => updateSection({ headline: val })}
                    mode={mode}
                    {...{ "data-text": data.headline } as any}
                />
                <InlineText
                    styleKey="homeOriginText"
                    brandData={brandData}
                    tagName="p"
                    className="text-lg @md:text-3xl leading-relaxed font-serif italic mb-6"
                    value={data.text}
                    onSave={(val) => updateSection({ text: val })}
                    mode={mode}
                />
                <InlineText
                    styleKey="homeOriginDescription"
                    brandData={brandData}
                    tagName="p"
                    multiline
                    className="text-zinc-400 text-sm @md:text-xl leading-relaxed max-w-3xl mx-auto"
                    value={data.description}
                    onSave={(val) => updateSection({ description: val })}
                    mode={mode}
                />
                <button
                    onClick={() => onNavigate('about')}
                    className="mt-12 btn-glass group"
                >
                    <InlineText
                        styleKey="homeOriginCtaText"
                        brandData={brandData}
                        value={brandData.sections.home.hero.ctaText}
                        onSave={(val) => onUpdate({ sections: { home: { hero: { ctaText: val } } } } as any)}
                        mode={mode}
                    />
                    <svg className="group-hover:translate-x-1 transition-transform" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                </button>
            </FadeIn>
        </section>
    );
};
