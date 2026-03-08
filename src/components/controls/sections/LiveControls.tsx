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

interface LiveControlsProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
    isMobile: boolean;
}

export const LiveControls = React.memo<LiveControlsProps>(({ brandData, onUpdate, isMobile }) => {
    const data = brandData.sections.home.live;
    const { layout, visuals, framing } = data;

    const updateSection = (updates: any) => {
        onUpdate({ sections: { home: { live: updates } } } as any);
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
            {/* Content */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Content</h4>

                {/* YouTube Controls - High Priority */}
                <div className="relative w-full">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">YouTube Button URL</label>
                    <input
                        type="text"
                        value={data.youtubeUrl || ""}
                        onChange={(e) => updateSection({ youtubeUrl: e.target.value })}
                        placeholder="https://youtube.com/..."
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded p-2 text-xs focus:border-emerald-500 outline-none"
                    />
                </div>
                <TypographyEditControl
                    label="YouTube Button Text"
                    styleKey="homeLiveYoutubeText"
                    brandData={brandData}
                    onUpdate={onUpdate}
                    variant="sidebar"
                    textValue={data.youtubeText}
                    onTextUpdate={(val) => updateSection({ youtubeText: val })}
                />
                <div className="w-full h-px bg-zinc-800 my-2" />

                <MediaEditControl label="Live Video" value={data.videoUrl} onSave={(val) => updateSection({ videoUrl: val })} brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                <MediaCustomizationControl
                    type={getMediaTypeFromUrl(data.videoUrl)}
                    config={data.mediaConfig || {}}
                    onUpdate={(updates) => updateSection({ mediaConfig: { ...data.mediaConfig, ...updates } })}
                    accentColor={brandData.accentColor}
                />
                <MediaEditControl label="Preview Image" value={data.previewImageUrl} onSave={(val) => updateSection({ previewImageUrl: val })} brandData={brandData} onUpdate={onUpdate} variant="sidebar" />
                <TypographyEditControl
                    label="Tagline"
                    styleKey="homeLiveTagline"
                    brandData={brandData}
                    onUpdate={onUpdate}
                    variant="sidebar"
                    textValue={data.tagline}
                    onTextUpdate={(val) => updateSection({ tagline: val })}
                />
                <TypographyEditControl
                    label="Headline"
                    styleKey="homeLiveHeadline"
                    brandData={brandData}
                    onUpdate={onUpdate}
                    variant="sidebar"
                    textValue={data.headline}
                    onTextUpdate={(val) => updateSection({ headline: val })}
                />
            </div>

            {/* Visuals */}
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
                <BlurControl
                    label="Blur"
                    enabled={visuals.blurEnabled ?? true}
                    strength={visuals.blurStrength ?? 5}
                    radius={visuals.blurRadius ?? 0.5}
                    onUpdate={(vals) => updateVisuals(vals)}
                    variant="sidebar"
                />


                <FramingControl
                    label="Image Framing"
                    isMobileMode={isMobile}
                    zoom={isMobile ? (data.framingImage?.zoomMobile ?? framing.zoomMobile) : (data.framingImage?.zoomDesktop ?? framing.zoomDesktop)}
                    xOffset={isMobile ? (data.framingImage?.xOffsetMobile ?? framing.xOffsetMobile) : (data.framingImage?.xOffsetDesktop ?? framing.xOffsetDesktop)}
                    yOffset={isMobile ? (data.framingImage?.yOffsetMobile ?? framing.yOffsetMobile) : (data.framingImage?.yOffsetDesktop ?? framing.yOffsetDesktop)}
                    onUpdate={(vals) => {
                        const currentFraming = data.framingImage || { ...framing };
                        const updates: any = { ...currentFraming };

                        if (isMobile) {
                            if (vals.zoom !== undefined) updates.zoomMobile = vals.zoom;
                            if (vals.x !== undefined) updates.xOffsetMobile = vals.x;
                            if (vals.y !== undefined) updates.yOffsetMobile = vals.y;
                        } else {
                            if (vals.zoom !== undefined) updates.zoomDesktop = vals.zoom;
                            if (vals.x !== undefined) updates.xOffsetDesktop = vals.x;
                            if (vals.y !== undefined) updates.yOffsetDesktop = vals.y;
                        }
                        updateSection({ framingImage: updates });
                    }}
                    variant="sidebar"
                />
            </div>

            {/* Layout */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Layout</h4>
                <AtomicLayoutControl
                    label="Live Layout"
                    layout={layout}
                    onUpdate={(val) => updateSection({ layout: val })}
                    isMobile={isMobile}
                    variant="sidebar"
                />
            </div>
        </div>
    );
});