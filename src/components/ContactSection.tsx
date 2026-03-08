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
import { SocialIcons } from './SocialIcons';

interface ContactSectionProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
    scrollY: number;
    scrollContainerRef?: React.RefObject<HTMLDivElement>;
    mode?: 'edit' | 'publish';
}

export const ContactSection: React.FC<ContactSectionProps> = ({ brandData, onUpdate, scrollY, scrollContainerRef, mode = 'edit' }) => {
    const isPublish = mode === 'publish';
    const isMobile = brandData.isMobilePreview;
    const data = brandData.sections.contact;
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
        onUpdate({ sections: { contact: updates } } as any);
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
            className="relative flex-1 flex flex-col justify-center items-center px-4 sm:px-6 overflow-hidden min-h-[80vh] group"
            style={{
                minHeight: (isMobile || layout.heightMode !== 'screen') ? 'auto' : '100dvh',
                paddingTop: `${(isMobile ? layout.paddingTopMobile : layout.paddingTopDesktop)}rem`,
                paddingBottom: `${(isMobile ? layout.paddingBottomMobile : layout.paddingBottomDesktop)}rem`,
                marginBottom: `${(isMobile ? layout.mobileMarginBottom : layout.marginBottom)}px`,
                position: 'relative',
            }}
        >
            <div ref={blurRef} className="absolute inset-0 z-0" style={{ transition: 'filter 0.1s linear' }}>
                <UniversalMedia serverBaseUrl={brandData.serverBaseUrl}
                    url={data.videoUrl}
                    isMobile={isMobile}
                    zoom={isMobile ? data.framing?.zoomMobile || 100 : data.framing?.zoomDesktop || 100}
                    x={isMobile ? data.framing?.xOffsetMobile || 0 : data.framing?.xOffsetDesktop || 0}
                    y={isMobile ? data.framing?.yOffsetMobile || 0 : data.framing?.yOffsetDesktop || 0}
                    saturation={isMobile ? data.visuals?.mobileSaturation ?? 100 : data.visuals?.saturation ?? 100}
                    parallax={isMobile ? data.visuals?.mobileParallax ?? 0 : data.visuals?.parallax ?? 0}
                    dim={isMobile ? data.visuals?.mobileDim ?? 0 : data.visuals?.dim ?? 0}
                    opacity={isMobile ? data.visuals?.mobileOpacity ?? 100 : data.visuals?.opacity ?? 100}
                    scrollY={scrollY}
                    isHero
                    mediaConfig={data.mediaConfig}
                />
            </div>

            {!isPublish && (
            <div className="absolute top-0 right-0 z-50 h-full pointer-events-none">
                <div className="sticky top-6 right-6 pointer-events-auto">
                    <FloatingControlPanel title="Contact Section" isMobile={brandData.isMobilePreview}>
                        <ControlTab label="Content">
                            <MediaEditControl
                                label="Change BG"
                                value={data.videoUrl}
                                onSave={(val) => updateSection({ videoUrl: val })}
                                brandData={brandData}
                                onUpdate={onUpdate}
                                variant="sidebar"
                            />
                            <TypographyEditControl label="Contact Headline" styleKey="contactHeadline" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            <TypographyEditControl label="Contact Tagline" styleKey="contactTagline" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            <TypographyEditControl label="Contact Text" styleKey="contactText" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            <TypographyEditControl label="Contact Email" styleKey="contactEmail" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            <TypographyEditControl label="Address Label" styleKey="contactAddressLabel" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            <TypographyEditControl label="Address Value" styleKey="contactAddressValue" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                        </ControlTab>

                        <ControlTab label="Visuals">
                            <SaturationControl
                                label={isMobile ? "Contact (Mobile)" : "Contact"}
                                value={isMobile ? visuals.mobileSaturation : visuals.saturation}
                                onSave={(val) => updateVisuals(isMobile ? { mobileSaturation: val } : { saturation: val })}
                                variant="sidebar"
                            />
                            <ParallaxControl
                                label={isMobile ? "Contact (Mobile)" : "Contact"}
                                value={isMobile ? visuals.mobileParallax : visuals.parallax}
                                onSave={(val) => updateVisuals(isMobile ? { mobileParallax: val } : { parallax: val })}
                                variant="sidebar"
                            />
                            <DimControl
                                label={isMobile ? "Contact (Mobile)" : "Contact"}
                                value={isMobile ? visuals.mobileDim : visuals.dim}
                                onSave={(val) => updateVisuals(isMobile ? { mobileDim: val } : { dim: val })}
                                variant="sidebar"
                            />
                            <OpacityControl
                                label={isMobile ? "Contact (Mobile)" : "Contact"}
                                value={isMobile ? visuals.mobileOpacity ?? 100 : visuals.opacity ?? 100}
                                onSave={(val) => updateVisuals(isMobile ? { mobileOpacity: val } : { opacity: val })}
                                variant="sidebar"
                            />
                            <BlurControl
                                label="Contact"
                                enabled={visuals.blurEnabled ?? true}
                                strength={visuals.blurStrength ?? 5}
                                radius={visuals.blurRadius ?? 0.5}
                                onUpdate={(vals) => updateVisuals(vals)}
                                variant="sidebar"
                            />
                            <FramingControl
                                label="Contact"
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
                                label="Contact Layout"
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

            <a
                href={`mailto:${data.email}`}
                className={`relative z-10 text-center w-full max-w-5xl mx-auto btn-glass !block !whitespace-normal !h-auto ${isMobile ? '!p-8' : '!p-12 md:!p-20'} !rounded-[2rem] md:!rounded-[3rem] shadow-2xl transition-all group/card`}
                onClick={(e) => {
                    // Prevent navigation if clicking on an input or specific editor elements
                    if ((e.target as HTMLElement).closest('.inline-text-input')) {
                        e.preventDefault();
                    }
                }}
            >
                <div className="relative z-10">
                    <InlineText
                        styleKey="contactTagline"
                        brandData={brandData}
                        tagName="span"
                        className="text-[var(--accent)] font-bold text-xs uppercase tracking-[0.3em] block mb-6"
                        value={data.tagline}
                        onSave={(val) => updateSection({ tagline: val })}
                        mode={mode}
                    />
                    <InlineText
                        styleKey="contactHeadline"
                        brandData={brandData}
                        tagName="h1"
                        className={`${isMobile ? 'text-3xl sm:text-4xl' : 'text-5xl md:text-6xl lg:text-7xl'} font-serif text-white mb-6 md:mb-8 leading-tight glitch-heading`}
                        value={data.headline}
                        onSave={(val) => updateSection({ headline: val })}
                        mode={mode}
                        {...{ "data-text": data.headline } as any}
                    />
                    <InlineText
                        styleKey="contactText"
                        brandData={brandData}
                        tagName="p"
                        className={`${isMobile ? 'text-base sm:text-lg' : 'text-lg md:text-xl'} text-zinc-300 font-light mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed px-2`}
                        value={data.text}
                        onSave={(val) => updateSection({ text: val })}
                        mode={mode}
                    />
                    <div className={`inline-flex items-center gap-2 md:gap-3 ${isMobile ? 'text-xl sm:text-2xl' : 'text-2xl md:text-3xl lg:text-4xl'} font-bold text-white group-hover/card:text-[var(--accent-light)] transition-all cursor-pointer break-all px-2`}>
                        <InlineText
                            styleKey="contactEmail"
                            brandData={brandData}
                            value={data.email}
                            onSave={(val) => updateSection({ email: val })}
                            className="pointer-events-none"
                            mode={mode}
                        />
                    </div>
                </div>
            </a>

            <div className={`mt-12 md:mt-16 grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3'} gap-6 md:gap-8 text-center px-4`}>
                {data.addresses.map((addr, idx) => (
                    <div key={idx} className="space-y-2">
                        <InlineText
                            styleKey="contactAddressLabel"
                            brandData={brandData}
                            tagName="span"
                            className="block text-[var(--accent-dark)] text-xs font-bold uppercase tracking-widest"
                            value={addr.label}
                            onSave={(val) => {
                                const newAddrs = [...data.addresses];
                                newAddrs[idx].label = val;
                                updateSection({ addresses: newAddrs });
                            }}
                            mode={mode}
                        />
                        <InlineText
                            styleKey="contactAddressValue"
                            brandData={brandData}
                            tagName="p"
                            className="text-zinc-500 text-xs uppercase tracking-widest"
                            value={addr.address}
                            onSave={(val) => {
                                const newAddrs = [...data.addresses];
                                newAddrs[idx].address = val;
                                updateSection({ addresses: newAddrs });
                            }}
                            mode={mode}
                        />
                    </div>
                ))}
            </div>

            {/* Social Icons & Credit */}
            <div className="mt-20 flex flex-col items-center gap-8 border-t border-zinc-800/50 pt-12 w-full max-w-lg mx-auto">
                <SocialIcons brandData={brandData} />
                <div className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-zinc-600 uppercase flex flex-col items-center gap-2">
                    <span>Er det no' liv her..</span>

                </div>
            </div>
        </section>
    );
};
