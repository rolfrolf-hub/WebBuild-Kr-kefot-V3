import React from 'react';
import { BrandState } from '../../../types';
import { TypographyEditControl } from '../../TypographyEditControl';
import { MediaEditControl } from '../../MediaEditControl';
import { LayoutControl } from '../../LayoutControl';
import { SaturationControl } from '../../SaturationControl';
import { DimControl } from '../../DimControl';
import { BlurControl } from '../../BlurControl';
import { OpacityControl } from '../../OpacityControl';
import { AtomicLayoutControl } from '../AtomicLayoutControl';
import { ModuleLibrary } from '../../ModuleLibrary';
import { MediaCustomizationControl } from '../../MediaCustomizationControl';
import { MediaListControl } from '../../MediaListControl';
import { getMediaTypeFromUrl } from '../../../utils/mediaHelpers';

interface GalleryControlsProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
    isMobile: boolean;
}

export const GalleryControls = React.memo<GalleryControlsProps>(({ brandData, onUpdate, isMobile }) => {
    const data = brandData.sections.home.spotify;
    const { layout, visuals } = data;

    const updateSection = (updates: any) => {
        onUpdate({ sections: { home: { spotify: updates } } } as any);
    };

    const updateVisuals = (updates: any) => {
        updateSection({ visuals: updates });
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
                <TypographyEditControl
                    label="Section Title"
                    styleKey="homeSpotifyTitle"
                    brandData={brandData}
                    onUpdate={onUpdate}
                    variant="sidebar"
                    textValue={data.title}
                    onTextUpdate={(val) => updateSection({ title: val })}
                />
                <MediaEditControl
                    label="Background Media"
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

                <div className="pt-4 border-t border-zinc-800">
                    <MediaListControl
                        items={data.items}
                        onUpdate={(newItems) => updateSection({ items: newItems })}
                        brandData={brandData}
                        onBrandUpdate={onUpdate}
                    />
                </div>
            </div>

            {/* Layout */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Layout</h4>
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
            </div>

            {/* Visuals */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Visuals</h4>
                <SaturationControl
                    label={isMobile ? "Background (Mobile)" : "Background"}
                    value={isMobile ? visuals.mobileSaturation : visuals.saturation}
                    onSave={(val) => updateVisuals(isMobile ? { mobileSaturation: val } : { saturation: val })}
                    variant="sidebar"
                />
                <DimControl
                    label={isMobile ? "Dim (Mobile)" : "Dim"}
                    value={isMobile ? visuals.mobileDim : visuals.dim}
                    onSave={(val) => updateVisuals(isMobile ? { mobileDim: val } : { dim: val })}
                    variant="sidebar"
                />
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
            </div>
        </div>
    );
});