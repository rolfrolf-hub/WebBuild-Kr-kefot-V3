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
import { SocialIcons } from './SocialIcons';
import { FloatingControlPanel, ControlTab } from './controls/FloatingControlPanel';
import { useScrollBlur } from '../hooks/useScrollBlur';

interface FooterSectionProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
    scrollY: number;
    scrollContainerRef?: React.RefObject<HTMLDivElement>;
    mode?: 'edit' | 'publish';
}

const TextField: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
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

export const FooterSection: React.FC<FooterSectionProps> = ({ brandData, onUpdate, scrollY, scrollContainerRef, mode = 'edit' }) => {
    const isPublish = mode === 'publish';
    const isMobile = brandData.isMobilePreview;
    const data = brandData.sections.footer;

    if (!data) return <div className="p-10 text-red-500 font-bold text-center">FOOTER DATA MISSING</div>;

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
        onUpdate({ sections: { footer: updates } } as any);
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
            className="w-full bg-black flex flex-col group overflow-hidden"
            style={{
                marginBottom: `${(isMobile ? layout.mobileMarginBottom : layout.marginBottom)}px`,
            }}
        >
            {/* 1. Independent Tagline Area (Always at top, fixed black bg, ignores section padding) */}
            <div className="w-full bg-black text-center relative z-20 py-12 px-6">
                {data.upperTagline && (
                    <InlineText
                        tagName="p"
                        styleKey="homeFooterUpperTagline"
                        brandData={brandData}
                        value={data.upperTagline}
                        onSave={(val) => updateSection({ upperTagline: val })}
                        className="text-[var(--accent)] font-bold text-xs uppercase tracking-[0.4em]"
                        mode={mode}
                    />
                )}
            </div>

            {/* 2. Main Media & Button Area (Follows Height and Padding controls) */}
            <div className="relative w-full flex-grow flex flex-col items-center justify-center overflow-hidden"
                style={{
                    minHeight: (isMobile
                        ? (layout.mobileHeightMode ?? layout.heightMode) !== 'screen'
                        : layout.heightMode !== 'screen') ? '400px' : '100dvh',
                    paddingTop: `${(isMobile ? layout.paddingTopMobile : layout.paddingTopDesktop)}rem`,
                    paddingBottom: `${(isMobile ? layout.paddingBottomMobile : layout.paddingBottomDesktop)}rem`,
                }}
            >
                <div ref={blurRef} className="absolute inset-0 z-0" style={{ transition: 'filter 0.1s linear' }}>
                    <UniversalMedia serverBaseUrl={brandData.serverBaseUrl}
                        url={data.videoUrl}
                        isMobile={isMobile}
                        zoom={isMobile ? (data.framing?.zoomMobile || 100) : (data.framing?.zoomDesktop || 100)}
                        x={isMobile ? (data.framing?.xOffsetMobile || 0) : (data.framing?.xOffsetDesktop || 0)}
                        y={isMobile ? (data.framing?.yOffsetMobile || 0) : (data.framing?.yOffsetDesktop || 0)}
                        saturation={isMobile ? (data.visuals?.mobileSaturation ?? 100) : (data.visuals?.saturation ?? 100)}
                        parallax={isMobile ? (data.visuals?.mobileParallax ?? 0) : (data.visuals?.parallax ?? 0)}
                        dim={isMobile ? (data.visuals?.mobileDim ?? 0) : (data.visuals?.dim ?? 0)}
                        opacity={isMobile ? (data.visuals?.mobileOpacity ?? 100) : (data.visuals?.opacity ?? 100)}
                        scrollY={scrollY}
                        mediaConfig={data.mediaConfig}
                        publishMode={isPublish}
                    />
                </div>

                {!isPublish && (
                <div className="absolute top-0 right-0 z-50 h-full pointer-events-none">
                    <div className="sticky top-6 right-6 pointer-events-auto">
                        <FloatingControlPanel title="Get In Touch" isMobile={brandData.isMobilePreview}>
                            <ControlTab label="Content">
                                <MediaEditControl label="Change Background" value={data.videoUrl} onSave={(val) => updateSection({ videoUrl: val })} brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                                <TypographyEditControl label="Upper Tagline" styleKey="homeFooterUpperTagline" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                                <TypographyEditControl label="Button Text" styleKey="homeFooterContactText" brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                            </ControlTab>
                            <ControlTab label="Visuals">
                                <SaturationControl label={isMobile ? "Get In Touch (Mobile)" : "Get In Touch"} value={isMobile ? visuals.mobileSaturation : visuals.saturation} onSave={(val) => updateVisuals(isMobile ? { mobileSaturation: val } : { saturation: val })} variant="sidebar" />
                                <ParallaxControl label={isMobile ? "Get In Touch (Mobile)" : "Get In Touch"} value={isMobile ? visuals.mobileParallax : visuals.parallax} onSave={(val) => updateVisuals(isMobile ? { mobileParallax: val } : { parallax: val })} variant="sidebar" />
                                <DimControl label={isMobile ? "Get In Touch (Mobile)" : "Get In Touch"} value={isMobile ? visuals.mobileDim : visuals.dim} onSave={(val) => updateVisuals(isMobile ? { mobileDim: val } : { dim: val })} variant="sidebar" />
                                <OpacityControl label={isMobile ? "Get In Touch (Mobile)" : "Get In Touch"} value={isMobile ? visuals.mobileOpacity ?? 100 : visuals.opacity ?? 100} onSave={(val) => updateVisuals(isMobile ? { mobileOpacity: val } : { opacity: val })} variant="sidebar" />
                                <BlurControl label="Get In Touch" enabled={visuals.blurEnabled ?? true} strength={visuals.blurStrength ?? 5} radius={visuals.blurRadius ?? 0.5} onUpdate={(vals) => updateVisuals(vals)} variant="sidebar" />
                                <FramingControl label="Get In Touch" isMobileMode={isMobile} zoom={isMobile ? framing.zoomMobile : framing.zoomDesktop} xOffset={isMobile ? framing.xOffsetMobile : framing.xOffsetDesktop} yOffset={isMobile ? framing.yOffsetMobile : framing.yOffsetDesktop} onUpdate={(vals) => {
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
                                }} variant="sidebar" />
                            </ControlTab>
                            <ControlTab label="Layout">
                                <AtomicLayoutControl label="Layout Settings" layout={layout} onUpdate={(val) => updateSection({ layout: val })} isMobile={isMobile} variant="sidebar" />
                            </ControlTab>
                        </FloatingControlPanel>
                    </div>
                </div>
                )}

                <div className="relative z-10 text-center px-6">
                    <a href="contact.html" className="btn-glass group">
                        <InlineText styleKey="homeFooterContactText" brandData={brandData} value={data.contactText} onSave={(val) => updateSection({ contactText: val })} mode={mode} />
                        <svg className="group-hover:translate-x-1 transition-transform ml-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    );
};
