import React from 'react';
import { BrandState } from '../../../types';
import { MediaEditControl } from '../../MediaEditControl';
import { SaturationControl } from '../../SaturationControl';
import { ParallaxControl } from '../../ParallaxControl';
import { DimControl } from '../../DimControl';
import { BlurControl } from '../../BlurControl';
import { FramingControl } from '../../FramingControl';
import { OpacityControl } from '../../OpacityControl';
import { TypographyEditControl } from '../../TypographyEditControl';
import { AtomicLayoutControl } from '../AtomicLayoutControl';
import { ModuleLibrary } from '../../ModuleLibrary';
import { MediaCustomizationControl } from '../../MediaCustomizationControl';
import { getMediaTypeFromUrl } from '../../../utils/mediaHelpers';

interface AboutStoryControlsProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
    isMobile: boolean;
}

export const AboutStoryControls = React.memo<AboutStoryControlsProps>(({ brandData, onUpdate, isMobile }) => {
    const data = brandData.sections.about.story;
    const { layout, visuals, framing } = data;

    // Helper for Section Updates
    const updateSection = (updates: any) => {
        onUpdate({ sections: { ...brandData.sections, about: { ...brandData.sections.about, story: { ...brandData.sections.about.story, ...updates } } } } as any);
    };

    const updateVisuals = (updates: any) => {
        updateSection({ visuals: { ...visuals, ...updates } });
    };

    const updateFraming = (updates: any) => {
        updateSection({ framing: { ...framing, ...updates } });
    };

    return (
        <div className="space-y-6">
            <ModuleLibrary
                visuals={visuals}
                layout={layout}
                onApplyVisuals={updateVisuals}
                onApplyLayout={(p) => updateSection({ layout: p })}
                categories={['aurora', 'blur', 'parallax']}
            />
            {/* Content Tab */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Content</h4>
                <MediaEditControl
                    label="Image/Video"
                    value={data.imageUrl}
                    onSave={(val) => updateSection({ imageUrl: val })}
                    brandData={brandData}
                    onUpdate={onUpdate}
                    variant="sidebar"
                />
                <MediaCustomizationControl
                    type={getMediaTypeFromUrl(data.imageUrl)}
                    config={data.mediaConfig ?? {}}
                    onUpdate={(updates) => updateSection({ mediaConfig: { ...data.mediaConfig, ...updates } })}
                />

                <TypographyEditControl
                    label="Tagline"
                    styleKey="aboutStoryTagline"
                    brandData={brandData}
                    onUpdate={onUpdate}
                    variant="sidebar"
                    textValue={data.tagline}
                    onTextUpdate={(val) => updateSection({ tagline: val })}
                />
                <TypographyEditControl
                    label="Body Text"
                    styleKey="aboutStoryBody"
                    brandData={brandData}
                    onUpdate={onUpdate}
                    variant="sidebar"
                    textValue={data.text}
                    onTextUpdate={(val) => updateSection({ text: val })}
                />
            </div>

            {/* Visuals Tab */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Visuals</h4>
                <SaturationControl
                    label={isMobile ? "Saturation (Mobile)" : "Saturation"}
                    value={isMobile ? visuals?.mobileSaturation : visuals?.saturation}
                    onSave={(val) => updateVisuals(isMobile ? { mobileSaturation: val } : { saturation: val })}
                    variant="sidebar"
                />
                <ParallaxControl
                    label={isMobile ? "Parallax (Mobile)" : "Parallax"}
                    value={isMobile ? visuals?.mobileParallax : visuals?.parallax}
                    onSave={(val) => updateVisuals(isMobile ? { mobileParallax: val } : { parallax: val })}
                    variant="sidebar"
                />
                <DimControl
                    label={isMobile ? "Dim (Mobile)" : "Dim"}
                    value={isMobile ? visuals?.mobileDim : visuals?.dim}
                    onSave={(val) => updateVisuals(isMobile ? { mobileDim: val } : { dim: val })}
                    variant="sidebar"
                />
                <OpacityControl
                    label={isMobile ? "Opacity (Mobile)" : "Opacity"}
                    value={isMobile ? visuals?.mobileOpacity ?? 100 : visuals?.opacity ?? 100}
                    onSave={(val) => updateVisuals(isMobile ? { mobileOpacity: val } : { opacity: val })}
                    variant="sidebar"
                />
                <BlurControl
                    label="Blur"
                    enabled={visuals?.blurEnabled ?? true}
                    strength={visuals?.blurStrength ?? 5}
                    radius={visuals?.blurRadius ?? 0.5}
                    onUpdate={(vals) => updateVisuals(vals)}
                    variant="sidebar"
                />
                <FramingControl
                    label="Framing"
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
                        updateFraming(updates);
                    }}
                    variant="sidebar"
                />
            </div>

            {/* Layout Tab */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Layout</h4>
                <AtomicLayoutControl
                    label="Story Layout"
                    layout={layout}
                    onUpdate={(val) => updateSection({ layout: val })}
                    isMobile={isMobile}
                    variant="sidebar"
                />
            </div>
        </div>
    );
});