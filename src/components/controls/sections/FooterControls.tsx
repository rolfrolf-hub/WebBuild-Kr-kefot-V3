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

interface FooterControlsProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
    isMobile: boolean;
}

export const FooterControls = React.memo<FooterControlsProps>(({ brandData, onUpdate, isMobile }) => {
    const data = brandData.sections.footer;
    const { layout, visuals, framing } = data;

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
        <div className="space-y-6">
            <ModuleLibrary
                visuals={visuals}
                layout={layout}
                onApplyVisuals={updateVisuals}
                onApplyLayout={(p) => updateSection({ layout: p })}
                categories={['aurora', 'blur', 'parallax']}
            />
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Content</h4>
                <MediaEditControl label="Background" value={data.videoUrl} onSave={(val) => updateSection({ videoUrl: val })} brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                <MediaCustomizationControl
                    type={getMediaTypeFromUrl(data.videoUrl)}
                    config={data.mediaConfig ?? {}}
                    onUpdate={(updates) => updateSection({ mediaConfig: { ...data.mediaConfig, ...updates } })}
                />
                <TypographyEditControl
                    label="Upper Tagline"
                    styleKey="homeFooterUpperTagline"
                    brandData={brandData}
                    onUpdate={onUpdate}
                    variant="sidebar"
                    textValue={data.upperTagline}
                    onTextUpdate={(val) => updateSection({ upperTagline: val })}
                />
                <TypographyEditControl
                    label="Button Text"
                    styleKey="homeFooterContactText"
                    brandData={brandData}
                    onUpdate={onUpdate}
                    variant="sidebar"
                    textValue={data.contactText}
                    onTextUpdate={(val) => updateSection({ contactText: val })}
                />
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Visuals</h4>
                <SaturationControl label={isMobile ? "Saturation (Mobile)" : "Saturation"} value={isMobile ? visuals.mobileSaturation : visuals.saturation} onSave={(val) => updateVisuals(isMobile ? { mobileSaturation: val } : { saturation: val })} variant="sidebar" />
                <ParallaxControl label={isMobile ? "Parallax (Mobile)" : "Parallax"} value={isMobile ? visuals.mobileParallax : visuals.parallax} onSave={(val) => updateVisuals(isMobile ? { mobileParallax: val } : { parallax: val })} variant="sidebar" />
                <DimControl label={isMobile ? "Dim (Mobile)" : "Dim"} value={isMobile ? visuals.mobileDim : visuals.dim} onSave={(val) => updateVisuals(isMobile ? { mobileDim: val } : { dim: val })} variant="sidebar" />
                <OpacityControl
                    label={isMobile ? "Opacity (Mobile)" : "Opacity"}
                    value={isMobile ? visuals.mobileOpacity ?? 100 : visuals.opacity ?? 100}
                    onSave={(val) => updateVisuals(isMobile ? { mobileOpacity: val } : { opacity: val })}
                    variant="sidebar"
                />
                <div className="space-y-1 pt-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Icon Size</label>
                        <span className="text-[10px] font-mono text-zinc-400">{brandData.socialIconSize || 24}px</span>
                    </div>
                    <input
                        type="range"
                        min="16"
                        max="64"
                        value={brandData.socialIconSize || 24}
                        onChange={(e) => onUpdate({ socialIconSize: parseInt(e.target.value) })}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                    />
                </div>
                <BlurControl
                    label="Blur"
                    enabled={visuals.blurEnabled ?? true}
                    strength={visuals.blurStrength ?? 5}
                    radius={visuals.blurRadius ?? 0.5}
                    onUpdate={(vals) => updateVisuals(vals)}
                    variant="sidebar"
                />
                <FramingControl
                    label="Framing"
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
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Layout</h4>
                <AtomicLayoutControl
                    label="Footer Layout"
                    layout={layout}
                    onUpdate={(val) => updateSection({ layout: val })}
                    isMobile={isMobile}
                    variant="sidebar"
                />
            </div>
        </div>
    );
});