import React from 'react';
import { BrandState } from '../types';
import { FadeIn } from './SectionBasics';
import { InlineText } from './InlineText';
import { TypographyEditControl } from './TypographyEditControl';
import { AtomicLayoutControl } from './controls/AtomicLayoutControl';
import { FloatingControlPanel, ControlTab } from './controls/FloatingControlPanel';
import { BlurControl } from './BlurControl';
import { useScrollBlur } from '../hooks/useScrollBlur';
import { SaturationControl } from './SaturationControl';
import { DimControl } from './DimControl';
import { ParallaxControl } from './ParallaxControl';

interface AboutMissionSectionProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
    scrollContainerRef?: React.RefObject<HTMLDivElement>;
    mode?: 'edit' | 'publish';
}

export const AboutMissionSection: React.FC<AboutMissionSectionProps> = ({ brandData, onUpdate, scrollContainerRef, mode = 'edit' }) => {
    const isPublish = mode === 'publish';
    const isMobile = brandData.isMobilePreview;
    const data = brandData.sections.about.mission;
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
        onUpdate({ sections: { about: { mission: updates } } } as any);
    };

    const updateVisuals = (updates: any) => {
        updateSection({ visuals: updates });
    };

    return (
        <section
            ref={ref as any}
            className="bg-black group relative z-30"
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
            <div ref={blurRef} className="container mx-auto px-6 max-w-4xl text-center relative z-10"
                style={{ transition: 'filter 0.1s linear' }}
            >
                <FadeIn>
                    <InlineText
                        styleKey="aboutMissionTagline"
                        brandData={brandData}
                        tagName="h3"
                        className="text-[var(--accent)] text-sm font-bold uppercase tracking-[0.3em] mb-12 block"
                        value={data.tagline || "Misjon"}
                        onSave={(val) => updateSection({ tagline: val })}
                        mode={mode}
                    />
                    <div className="relative inline-block w-full">
                        <InlineText
                            styleKey="mission"
                            brandData={brandData}
                            tagName="p"
                            className="text-3xl md:text-5xl font-serif italic text-white leading-tight mb-8 drop-shadow-lg"
                            value={data.text}
                            onSave={(val) => updateSection({ text: val })}
                            mode={mode}
                        />
                    </div>
                    <div className="w-16 h-px bg-zinc-800 mx-auto mt-12" />
                </FadeIn>
            </div>

            {!isPublish && (
            <div className="absolute top-0 right-0 z-50 h-full pointer-events-none">
                <div className="sticky top-6 right-6 pointer-events-auto">
                    <FloatingControlPanel title="Mission Section" isMobile={brandData.isMobilePreview}>
                        <ControlTab label="Content">
                            <div className="relative w-full mb-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Tagline</label>
                                <input
                                    type="text"
                                    value={data.tagline}
                                    onChange={(e) => updateSection({ tagline: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded p-2 text-xs focus:border-[var(--accent)] outline-none"
                                />
                            </div>
                            <TypographyEditControl label="Tagline Style" styleKey="aboutMissionTagline" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            <TypographyEditControl label="Mission Style" styleKey="mission" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                        </ControlTab>
                        <ControlTab label="Visuals">
                            {/* Even without media, blur/dim might be useful or at least consistent */}
                            <BlurControl
                                label="Mission"
                                enabled={visuals.blurEnabled ?? true}
                                strength={visuals.blurStrength ?? 5}
                                radius={visuals.blurRadius ?? 0.5}
                                onUpdate={(vals) => updateVisuals(vals)}
                                variant="sidebar"
                            />
                        </ControlTab>
                        <ControlTab label="Layout">
                            <AtomicLayoutControl
                                label="Mission Layout"
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
