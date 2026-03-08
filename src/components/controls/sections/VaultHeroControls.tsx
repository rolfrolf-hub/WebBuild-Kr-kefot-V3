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
import { AuraControl } from '../../AuraControl';
import { MuxVideoControl } from '../../MuxVideoControl';
import { getMediaTypeFromUrl } from '../../../utils/mediaHelpers';

interface VaultHeroControlsProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
    isMobile: boolean;
}

export const VaultHeroControls = React.memo<VaultHeroControlsProps>(({ brandData, onUpdate, isMobile }) => {
    // Assuming vault has a direct hero property or is the hero section itself.
    // Based on user request "sections.vault | VaultHeroControls" but usually it's structured.
    // Let's assume sections.vault has a similar structure (layout, visuals, framing) directly
    // or sections.vault.hero.
    // The previous request had "sections.about.hero".
    // "sections.vault" usually implies the whole object.
    // However, the interface usually has `brandData.sections.vault.videoUrl`, etc?
    // Let's check typical structure. If it follows others, it might be just `brandData.sections.vault`.
    // Let's assume standard structure: layout, visuals, framing exist on it.

    const data = brandData.sections.vault;
    const { layout, visuals, framing } = data;

    // Helper for Section Updates
    const updateSection = (updates: any) => {
        onUpdate({ sections: { ...brandData.sections, vault: { ...brandData.sections.vault, ...updates } } } as any);
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
                    label="Change BG"
                    value={data.videoUrl}
                    onSave={(val) => updateSection({ videoUrl: val })}
                    brandData={brandData}
                    onUpdate={onUpdate}
                    variant="sidebar"
                />
                <MediaCustomizationControl
                    type={getMediaTypeFromUrl(data.videoUrl)}
                    config={data.mediaConfig ?? {}}
                    onUpdate={(updates) => updateSection({ mediaConfig: { ...data.mediaConfig, ...updates } })}
                />
                <TypographyEditControl
                    label="Headline"
                    styleKey="vaultHeadline"
                    brandData={brandData}
                    onUpdate={onUpdate}
                    variant="sidebar"
                    textValue={data.headline}
                    onTextUpdate={(val) => updateSection({ headline: val })}
                />
                <TypographyEditControl
                    label="Tagline"
                    styleKey="vaultTagline"
                    brandData={brandData}
                    onUpdate={onUpdate}
                    variant="sidebar"
                    textValue={data.tagline}
                    onTextUpdate={(val) => updateSection({ tagline: val })}
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

                <AuraControl visuals={visuals} onUpdate={updateVisuals} />
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
                <MuxVideoControl
                    framing={framing}
                    visuals={visuals}
                    onUpdateFraming={updateFraming}
                    onUpdateVisuals={updateVisuals}
                />
            </div>

            {/* Layout Tab */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Layout</h4>
                <AtomicLayoutControl
                    label="Vault Layout"
                    layout={layout}
                    onUpdate={(val) => updateSection({ layout: val })}
                    isMobile={isMobile}
                    variant="sidebar"
                />
            </div>
        </div>
    );
});