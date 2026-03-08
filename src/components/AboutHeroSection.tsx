import React from 'react';
import { BrandState } from '../types';
import { InlineText } from './InlineText';
import { MediaEditControl } from './MediaEditControl';
import { SaturationControl } from './SaturationControl';
import { ParallaxControl } from './ParallaxControl';
import { DimControl } from './DimControl';
import { BlurControl } from './BlurControl';
import { OpacityControl } from './OpacityControl';
import { TypographyEditControl } from './TypographyEditControl';
import { AtomicLayoutControl } from './controls/AtomicLayoutControl';
import { FloatingControlPanel, ControlTab } from './controls/FloatingControlPanel';
import { useScrollBlur } from '../hooks/useScrollBlur';
import { UniversalMedia } from './SectionBasics';

// Lazy load the frame animation component
const ScrollSequence = React.lazy(() => import('./ScrollSequence').then(m => ({ default: m.ScrollSequence })));

interface AboutHeroSectionProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
    scrollY: number;
    scrollContainerRef?: React.RefObject<HTMLDivElement>;
    mode?: 'edit' | 'publish';
}

export const AboutHeroSection: React.FC<AboutHeroSectionProps> = ({ brandData, onUpdate, scrollY, scrollContainerRef, mode = 'edit' }) => {
    const isPublish = mode === 'publish';
    const isMobile = brandData.isMobilePreview;
    const data = brandData.sections.about.hero;
    const story = brandData.sections.about.story;
    const { layout, visuals } = data;

    // wrapperRef: the 400vh outer div — used for scroll progress calculation
    const wrapperRef = React.useRef<HTMLDivElement | null>(null);
    // blurTargetRef: the .blur-target div inside the sticky section — receives ScrollBlur filter
    const blurTargetRef = React.useRef<HTMLDivElement>(null);
    // stickyRef: the sticky section — used by ScrollBlur for position tracking
    const stickyRef = React.useRef<HTMLElement | null>(null);

    const { ref: scrollBlurRef } = useScrollBlur({
        enabled: visuals.blurEnabled ?? false,
        strength: visuals.blurStrength ?? 5,
        radius: visuals.blurRadius ?? 0.5,
        targetRef: blurTargetRef,
        scrollContainer: scrollContainerRef
    });

    // Assign both scrollRef and stickyRef to the same sticky element
    const setStickyRef = (el: HTMLElement | null) => {
        (scrollBlurRef as React.MutableRefObject<HTMLElement | null>).current = el;
        stickyRef.current = el;
    };

    // ── Wrapper height: 250vh matches live site for better scroll feel ──
    const WRAPPER_HEIGHT = '250vh';

    // Scroll progress: 0 when wrapper top = container top, 1 when wrapper fully scrolled through
    const getScrollMetrics = () => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return { progress: 0 };
        const wrapperRect = wrapper.getBoundingClientRect();
        const viewportH = scrollContainerRef?.current?.offsetHeight ?? window.innerHeight;

        const scrollable = wrapperRect.height - viewportH;
        if (scrollable <= 0) return { progress: 0 };
        const containerTop = scrollContainerRef?.current?.getBoundingClientRect().top ?? 0;
        const adjustedTop = wrapperRect.top - containerTop; // top relative to scroll container

        const progress = Math.max(0, Math.min(1, -adjustedTop / scrollable));
        return { progress };
    };
    const { progress: scrollProgress } = getScrollMetrics(); // refreshes on every render (scrollY drives re-renders)

    // Text Opacity: Hidden at start, fades in between 8th-to-last frame and end
    // (37/45 frames = ~0.82 scroll progress)
    const textOpacity = scrollProgress < 0.82 ? 0 : (scrollProgress - 0.82) / 0.18;

    // Intro Text Opacity: Visible at start, fades out over first 5 frames
    // (5/45 frames = ~0.11 scroll progress)
    const introOpacity = Math.max(0, 1 - scrollProgress / 0.11);

    const sat = isMobile ? (visuals.mobileSaturation ?? 100) : (visuals.saturation ?? 100);
    const dim = isMobile ? visuals.mobileDim : visuals.dim;
    const parallax = isMobile ? visuals.mobileParallax : visuals.parallax;

    const updateSection = (updates: any) => {
        onUpdate({ sections: { about: { hero: updates } } } as any);
    };
    const updateVisuals = (updates: any) => updateSection({ visuals: updates });

    return (
        /* ── Wrapper: provides the scroll distance for the sticky animation ── */
        <div
            ref={wrapperRef}
            style={{ position: 'relative', height: WRAPPER_HEIGHT, background: '#000' }}
        >
            {/* ── Sticky section: stays at viewport top during the scroll ── */}
            <section
                ref={setStickyRef as React.RefCallback<HTMLElement>}
                className="group relative z-10 overflow-hidden"
                style={{
                    position: 'sticky',
                    top: 0,
                    height: '100dvh',
                }}
            >
                {/* ── Canvas background + blur-target ── */}
                <div
                    ref={blurTargetRef}
                    className="blur-target absolute inset-0 z-0 pointer-events-none"
                    style={{ transition: 'filter 0.1s linear' }}
                >
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        filter: `saturate(${sat}%)`,
                        willChange: 'transform'
                    }}>
                        <React.Suspense fallback={null}>
                            <ScrollSequence
                                isMobile={isMobile}
                                scrollProgress={scrollProgress}
                                fallbackUrl={data.videoUrl}
                                saturation={sat}
                                serverBaseUrl={brandData.serverBaseUrl}
                                parallax={parallax}
                                framing={data.framing}
                                mediaConfig={data.mediaConfig}
                            />
                        </React.Suspense>
                    </div>
                </div>

                {/* ── Static gradient dim overlay ── */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        zIndex: 1,
                        opacity: dim / 100,
                        background: 'linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.7) 70%, #000 100%)'
                    }}
                />

                {/* ── Progressive blackout (starts exactly when sliding up at 0.8) ── */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        zIndex: 2,
                        background: '#000',
                        opacity: scrollProgress < 0.8 ? 0 : (scrollProgress - 0.8) / 0.2
                    }}
                />

                {/* ── Floating control panel ── */}
                {!isPublish && (
                <div className="absolute top-0 right-0 z-50 h-full pointer-events-none">
                    <div className="sticky top-6 right-6 pointer-events-auto">
                        <FloatingControlPanel title="About Hero" isMobile={brandData.isMobilePreview}>
                            <ControlTab label="Content">
                                <MediaEditControl
                                    label="Fallback BG"
                                    value={data.videoUrl}
                                    onSave={(val) => updateSection({ videoUrl: val })}
                                    brandData={brandData}
                                    onUpdate={onUpdate}
                                    variant="sidebar"
                                />
                                <TypographyEditControl
                                    label="Headline"
                                    styleKey="aboutHeroHeadline"
                                    brandData={brandData}
                                    onUpdate={onUpdate}
                                    variant="sidebar"
                                    textValue={data.headline}
                                    onTextUpdate={(val) => updateSection({ headline: val })}
                                />
                                <TypographyEditControl
                                    label="Subheadline"
                                    styleKey="aboutHeroSubheadline"
                                    brandData={brandData}
                                    onUpdate={onUpdate}
                                    variant="sidebar"
                                    textValue={data.subheadline}
                                    onTextUpdate={(val) => updateSection({ subheadline: val })}
                                />
                            </ControlTab>

                            <ControlTab label="Visuals">
                                <SaturationControl
                                    label={isMobile ? "Hero (Mobile)" : "Hero"}
                                    value={isMobile ? visuals.mobileSaturation : visuals.saturation}
                                    onSave={(val) => updateVisuals(isMobile ? { mobileSaturation: val } : { saturation: val })}
                                    variant="sidebar"
                                />
                                <ParallaxControl
                                    label={isMobile ? "Hero (Mobile)" : "Hero"}
                                    value={isMobile ? visuals.mobileParallax : visuals.parallax}
                                    onSave={(val) => updateVisuals(isMobile ? { mobileParallax: val } : { parallax: val })}
                                    variant="sidebar"
                                />
                                <DimControl
                                    label={isMobile ? "Hero (Mobile)" : "Hero"}
                                    value={isMobile ? visuals.mobileDim : visuals.dim}
                                    onSave={(val) => updateVisuals(isMobile ? { mobileDim: val } : { dim: val })}
                                    variant="sidebar"
                                />
                                <OpacityControl
                                    label={isMobile ? "Hero (Mobile)" : "Hero"}
                                    value={isMobile ? visuals.mobileOpacity ?? 100 : visuals.opacity ?? 100}
                                    onSave={(val) => updateVisuals(isMobile ? { mobileOpacity: val } : { opacity: val })}
                                    variant="sidebar"
                                />
                                <BlurControl
                                    label="Hero"
                                    enabled={visuals.blurEnabled ?? false}
                                    strength={visuals.blurStrength ?? 5}
                                    radius={visuals.blurRadius ?? 0.5}
                                    onUpdate={(vals) => updateVisuals(vals)}
                                    variant="sidebar"
                                />
                            </ControlTab>

                            <ControlTab label="Layout">
                                <AtomicLayoutControl
                                    label="Hero Layout"
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

                {/* ── Intro text — visible at start, fades out over first 5 frames ── */}
                <div
                    className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 pointer-events-none"
                    style={{ zIndex: 5, opacity: introOpacity, paddingTop: 'var(--about-hero-pt)', paddingBottom: 'var(--about-hero-pb)' }}
                >
                    <div className="max-w-5xl mx-auto">
                        <InlineText
                            styleKey="aboutHeroIntroText"
                            brandData={brandData}
                            tagName="h2"
                            className="text-4xl md:text-8xl font-serif mb-8 leading-tight md:leading-tight drop-shadow-2xl text-white"
                            value={data.introText || ''}
                            onSave={(val) => updateSection({ introText: val })}
                            mode={mode}
                        />
                    </div>
                </div>

                {/* ── Hero text — hidden at start, fades in at end (last 3 frames) ── */}
                <div
                    className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 pointer-events-none"
                    style={{ zIndex: 5, opacity: textOpacity, paddingTop: 'var(--about-hero-pt)', paddingBottom: 'var(--about-hero-pb)' }}
                >
                    <div className="max-w-5xl mx-auto">
                        <InlineText
                            styleKey="aboutHeroHeadline"
                            brandData={brandData}
                            tagName="h2"
                            className="text-4xl md:text-8xl font-serif mb-8 leading-tight md:leading-tight drop-shadow-2xl text-white glitch-heading"
                            value={data.headline}
                            onSave={(val) => updateSection({ headline: val })}
                            mode={mode}
                        />
                        <InlineText
                            styleKey="aboutHeroSubheadline"
                            brandData={brandData}
                            tagName="span"
                            className="inline-block text-[var(--accent-light)] font-bold tracking-[0.4em] text-xs uppercase mb-6 animate-pulse"
                            value={data.subheadline || "EST. 2024"}
                            onSave={(val) => updateSection({ subheadline: val })}
                            mode={mode}
                        />
                        <div className="w-32 h-1 bg-[var(--accent-dark)] mx-auto rounded-full shadow-[0_0_20px_rgb(var(--accent-rgb)/0.6)]" />
                    </div>
                </div>

            </section>
        </div>
    );
};
