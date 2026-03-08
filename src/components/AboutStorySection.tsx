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

interface AboutStorySectionProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
    scrollY: number;
    scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export const AboutStorySection: React.FC<AboutStorySectionProps> = ({ brandData, onUpdate, scrollY, scrollContainerRef }) => {
    const isMobile = brandData.isMobilePreview;
    const data = brandData.sections.about.story;
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
        onUpdate({ sections: { about: { story: updates } } } as any);
    };

    const updateVisuals = (updates: any) => {
        updateSection({ visuals: updates });
    };

    const updateFraming = (updates: any) => {
        updateSection({ framing: updates });
    };

    return (
        <section
            ref={ref as any}
            className="bg-black group relative z-20"
            style={{
                minHeight: (isMobile || layout.heightMode !== 'screen') ? 'auto' : '100dvh',
                paddingTop: `${(isMobile ? layout.paddingTopMobile : layout.paddingTopDesktop)}rem`,
                paddingBottom: `${(isMobile ? layout.paddingBottomMobile : layout.paddingBottomDesktop)}rem`,
                marginBottom: `${(isMobile ? layout.mobileMarginBottom : layout.marginBottom)}px`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                overflow: 'visible'
            }}
        >
            <div className="absolute inset-0 z-0" style={{ pointerEvents: 'none' }}>
            </div>

            <div ref={blurRef} className={`container mx-auto ${isMobile ? 'px-6' : 'px-12'} max-w-7xl relative z-10 flex flex-col gap-12 w-full`}
                style={{ transition: 'filter 0.1s linear' }}
            >
                <FadeIn className="w-full">
                    <InlineText
                        styleKey="aboutStoryTagline"
                        brandData={brandData}
                        tagName="h3"
                        className="text-[var(--accent)] text-sm font-bold uppercase tracking-[0.3em] block text-center"
                        value={data.tagline || "Vår Historie"}
                        onSave={(val) => updateSection({ tagline: val })}
                    />
                </FadeIn>

                <div className={`w-full grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-5'} gap-16 items-start`}>
                    <FadeIn className={isMobile ? '' : 'lg:col-span-3'}>
                        <InlineText
                            styleKey="story"
                            brandData={brandData}
                            tagName="div"
                            multiline
                            className={`text-zinc-300 ${isMobile ? 'text-xl' : 'text-2xl'} leading-relaxed font-light italic border-l-2 border-accent pl-8 whitespace-pre-wrap`}
                            value={data.text}
                            onSave={(val) => updateSection({ text: val })}
                        />
                    </FadeIn>

                    <FadeIn className={isMobile ? 'relative aspect-square' : 'lg:col-span-2 relative group/image overflow-hidden rounded-3xl h-[600px] flex items-center justify-center bg-zinc-900'}>
                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                            <UniversalMedia serverBaseUrl={brandData.serverBaseUrl}
                                url={data.imageUrl}
                                isMobile={isMobile}
                                zoom={isMobile ? (data.framing?.zoomMobile ?? 100) : (data.framing?.zoomDesktop ?? 100)}
                                x={isMobile ? (data.framing?.xOffsetMobile ?? 0) : (data.framing?.xOffsetDesktop ?? 0)}
                                y={isMobile ? (data.framing?.yOffsetMobile ?? 0) : (data.framing?.yOffsetDesktop ?? 0)}
                                saturation={isMobile ? (data.visuals?.mobileSaturation ?? 100) : (data.visuals?.saturation ?? 100)}
                                parallax={isMobile ? (data.visuals?.mobileParallax ?? 0) : (data.visuals?.parallax ?? 0)}
                                dim={isMobile ? (data.visuals?.mobileDim ?? 0) : (data.visuals?.dim ?? 0)}
                                opacity={isMobile ? (data.visuals?.mobileOpacity ?? 100) : (data.visuals?.opacity ?? 100)}
                                scrollY={scrollY}
                                mediaConfig={data.mediaConfig}
                            />
                        </div>
                    </FadeIn>
                </div>

                <div className="absolute top-0 right-0 z-50 h-full pointer-events-none">
                    <div className="sticky top-6 right-6 pointer-events-auto">
                        <FloatingControlPanel title="Story Section" isMobile={brandData.isMobilePreview}>
                            <ControlTab label="Content">
                                <MediaEditControl
                                    label="Change Image"
                                    value={data.imageUrl}
                                    onSave={(val) => updateSection({ imageUrl: val })}
                                    brandData={brandData}
                                    onUpdate={onUpdate}
                                    variant="sidebar"
                                />
                                <TypographyEditControl label="Story Tagline" styleKey="aboutStoryTagline" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                                <TypographyEditControl label="Story Style" styleKey="story" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            </ControlTab>

                            <ControlTab label="Visuals">
                                <SaturationControl
                                    label={isMobile ? "Story (Mobile)" : "Story"}
                                    value={isMobile ? visuals.mobileSaturation : visuals.saturation}
                                    onSave={(val) => updateVisuals(isMobile ? { mobileSaturation: val } : { saturation: val })}
                                    variant="sidebar"
                                />
                                <ParallaxControl
                                    label={isMobile ? "Story (Mobile)" : "Story"}
                                    value={isMobile ? visuals.mobileParallax : visuals.parallax}
                                    onSave={(val) => updateVisuals(isMobile ? { mobileParallax: val } : { parallax: val })}
                                    variant="sidebar"
                                />
                                <DimControl
                                    label={isMobile ? "Story (Mobile)" : "Story"}
                                    value={isMobile ? visuals.mobileDim : visuals.dim}
                                    onSave={(val) => updateVisuals(isMobile ? { mobileDim: val } : { dim: val })}
                                    variant="sidebar"
                                />
                                <OpacityControl
                                    label={isMobile ? "Story (Mobile)" : "Story"}
                                    value={isMobile ? visuals.mobileOpacity ?? 100 : visuals.opacity ?? 100}
                                    onSave={(val) => updateVisuals(isMobile ? { mobileOpacity: val } : { opacity: val })}
                                    variant="sidebar"
                                />
                                <BlurControl
                                    label="Story"
                                    enabled={visuals.blurEnabled ?? true}
                                    strength={visuals.blurStrength ?? 5}
                                    radius={visuals.blurRadius ?? 0.5}
                                    onUpdate={(vals) => updateVisuals(vals)}
                                    variant="sidebar"
                                />
                                <FramingControl
                                    label="Story"
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
                                    label="Story Layout"
                                    layout={layout}
                                    onUpdate={(val) => updateSection({ layout: val })}
                                    isMobile={isMobile}
                                    variant="sidebar"
                                />
                            </ControlTab>
                        </FloatingControlPanel>
                    </div>
                </div>
            </div>
        </section>
    );
};
