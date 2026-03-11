import React, { useEffect, useRef, useState, useCallback } from 'react';


import { getResponsiveSrcSet } from '../utils/mediaProcessing';
import { isMuxUrl, getMuxStreamUrl, extractMuxId } from '../utils/mediaHelpers';
import { MOBILE_NORM, DESKTOP_NORM, MOBILE_BUFFER, DESKTOP_BUFFER } from '../utils/framingUtils';
import MuxPlayer from '@mux/mux-player-react';
import { UniversalMediaConfig, MuxPlayerConfig } from '../types';

export const isVideo = (url: string) => /\.(mp4|mov|webm|m4v|mkv)$/i.test(url);
export const isMux = (url: string) => isMuxUrl(url);

export const FadeIn: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className = "", style }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                ref.current?.classList.add('opacity-100', 'translate-y-0');
                ref.current?.classList.remove('opacity-0', 'translate-y-8');
            }
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    return (
        <div ref={ref} className={`${className} transition - all duration - 1000 ease - out opacity - 0 translate - y - 8`} style={style}>
            {children}
        </div>
    );
};

interface UniversalMediaProps {
    url: string;
    isMobile: boolean;
    zoom: number;
    x: number;
    y: number;
    saturation: number;
    parallax: number;
    dim: number;
    opacity?: number;
    scrollY: number;
    className?: string;
    style?: React.CSSProperties;
    videoRef?: React.RefObject<HTMLVideoElement | null>;
    isLivePlaying?: boolean;
    id?: string;
    muted?: boolean;
    autoPlay?: boolean;
    isHero?: boolean;
    serverBaseUrl?: string; // Add serverBaseUrl to props to resolve relative URLs in builder preview
    mediaConfig?: UniversalMediaConfig;
    publishMode?: boolean;
}

// wsrv.nl CDN image optimizer — used in publish mode to serve WebP at the right size
const wsrvSrc = (imgUrl: string, width: number): string => {
    if (!imgUrl || imgUrl.startsWith('data:') || imgUrl.includes('wsrv.nl')) return imgUrl;
    if (/\.(mp4|webm|mov|m4v)$/i.test(imgUrl)) return imgUrl;
    const fullUrl = imgUrl.startsWith('http') ? imgUrl : `https://kraakefot.com/${imgUrl.replace(/^\//, '')}`;
    return `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&w=${width}&q=80&output=webp`;
};

export const UniversalMedia: React.FC<UniversalMediaProps & { prefix?: string }> = ({
    url, isMobile, zoom, x, y, saturation, parallax, dim, opacity = 100, scrollY,
    className, style, videoRef, isLivePlaying, id,
    muted = true,
    autoPlay,
    prefix,
    isHero = false,
    serverBaseUrl = '',
    mediaConfig,
    publishMode = false
}) => {
    if (!url) return null;

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(false);
    }, [url]);

    // Publish mode: skip fade-in loading state — media is visible immediately in static HTML
    let baseOpacity: number;
    if (publishMode) {
        baseOpacity = 1;
    } else {
        baseOpacity = isLoaded ? 1 : 0;
        if (isVideo(url)) {
            baseOpacity = isLoaded ? 0.4 : 0;
            if (id === 'live-video' && isLivePlaying) baseOpacity = 1;
        }
    }

    const finalOpacity = baseOpacity * (opacity / 100);

    const scrollZoomFactor = isHero ? (scrollY * 0.0001) : 0;
    const finalZoom = prefix ? `calc(var(--${prefix}-zoom) + ${scrollZoomFactor})` : (zoom + scrollZoomFactor);

    // PARITY: Use EXACT same CSS calculation as generator.ts
    // On mobile, the media element is 400% wide to create a pan buffer.
    // translate3d percentages are relative to the ELEMENT, not the container.
    // We normalize so that x=50 visually moves 50% of the viewport:
    //   actual_translate = x / (buffer_ratio) where buffer_ratio = 4 (400%/100%)
    // This prevents edges from showing when panning.
    const mobileNorm = isMobile ? MOBILE_NORM : DESKTOP_NORM;
    const transformStyle: React.CSSProperties = prefix ? {
        '--scroll-y': scrollY,
        filter: `saturate(var(--${prefix}-sat, ${saturation}%))`,
        '--target-op': `var(--${prefix}-op, ${opacity / 100})`,
        transform: isMobile
            ? `scale(${finalZoom}) translate3d(calc(var(--${prefix}-x, ${x}%) * ${mobileNorm}), calc((var(--scroll-y, 0) * 1px * var(--${prefix}-para, ${parallax}) / 100) + calc(var(--${prefix}-y, ${y}%) * ${mobileNorm})), 0)`
            : `scale(${finalZoom}) translate3d(calc(var(--${prefix}-x, ${x}%) * ${mobileNorm}), calc((var(--scroll-y, 0) * 1px * var(--${prefix}-para, ${parallax}) / 100) + calc(var(--${prefix}-y, ${y}%) * ${mobileNorm})), 0)`,
        transformOrigin: 'center center',
        willChange: 'transform',
        opacity: finalOpacity,
        transition: 'opacity 1.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transitionProperty: 'opacity'
    } as React.CSSProperties : {
        filter: `saturate(${saturation / 100})`,
        '--scroll-y': scrollY,
        transform: isMobile
            ? `scale(${finalZoom}) translate3d(${x * mobileNorm}%, calc(calc(var(--scroll-y, 0) * 1px * ${parallax / 100}) + ${y * mobileNorm}%), 0)`
            : `scale(${finalZoom}) translate3d(${x * mobileNorm}%, calc(calc(var(--scroll-y, 0) * 1px * ${parallax / 100}) + ${y * mobileNorm}%), 0)`,
        transformOrigin: 'center center',
        willChange: 'transform',
        opacity: finalOpacity,
        transition: 'opacity 1.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transitionProperty: 'opacity'
    } as any;

    const baseStyle: React.CSSProperties = isMobile
        ? {
            minWidth: '100%',
            minHeight: '100%',
            maxWidth: 'none',
            maxHeight: 'none',
            width: MOBILE_BUFFER,
            height: MOBILE_BUFFER,
            objectFit: 'cover'
        }
        : {
            minWidth: '100%',
            minHeight: '100%',
            maxWidth: 'none',
            maxHeight: 'none',
            width: DESKTOP_BUFFER,
            height: DESKTOP_BUFFER,
            objectFit: 'cover'
        };

    const handleLoad = () => setIsLoaded(true);
    const shouldAutoPlay = autoPlay !== undefined ? autoPlay : !videoRef;

    // Resolve proper URL if relative and serverBaseUrl is present
    const videoUrl = (isVideo(url) && !url.startsWith('http') && serverBaseUrl)
        ? `${serverBaseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
        : url;

    return (
        <div className={`media-container-universal absolute inset-0 flex items-center justify-center overflow-hidden bg-zinc-950 ${className}`} style={style}>
            <div className="media-internal-wrapper relative w-full h-full flex items-center justify-center">
                {isMux(url) ? (() => {
                    const muxId = extractMuxId(url);
                    const mConfig: Partial<MuxPlayerConfig> = mediaConfig?.mux ?? {};
                    const aspect = isMobile ? mConfig.aspectRatioMobile : mConfig.aspectRatioDesktop;
                    const widthOverride = isMobile ? mConfig.widthMobile : mConfig.widthDesktop;
                    const wrapStyle = {
                        ...baseStyle,
                        ...transformStyle,
                        width: widthOverride || baseStyle.width,
                        aspectRatio: aspect || (isMobile ? '9/16' : '16/9'),
                        transform: `${transformStyle.transform} translateX(${isMobile ? (mConfig.xOffsetMobile || 0) : (mConfig.xOffsetDesktop || 0)}%)`,
                        background: '#000'
                    };

                    // PUBLISH MODE: use native web components (no React overhead in static HTML)
                    if (publishMode) {
                        return isHero
                            // Hero background — mux-background-video (eager, no controls)
                            ? React.createElement('mux-background-video', {
                                src: `https://stream.mux.com/${muxId}.m3u8`,
                                id,
                                autoplay: true,
                                muted: true,
                                loop: true,
                                style: { ...wrapStyle, width: '100%', height: '100%' }
                            })
                            // Below-fold — mux-player (lazy-loaded by script.js IntersectionObserver)
                            : React.createElement('mux-player', {
                                'playback-id': muxId || '',
                                'stream-type': mConfig.streamType || 'on-demand',
                                style: wrapStyle
                            });
                    }

                    return (
                        <div style={wrapStyle}>
                            <MuxPlayer
                                ref={videoRef as any}
                                playbackId={muxId || ''}
                                streamType={mConfig.streamType || "on-demand"}
                                autoPlay={autoPlay !== undefined ? autoPlay : (mConfig.autoPlay === 'any' || mConfig.autoPlay === 'muted' ? mConfig.autoPlay : (id?.includes('bg') || id?.includes('live') ? true : false))}
                                muted={(muted || mConfig.autoPlay === 'muted') && mConfig.autoPlay !== 'any'}
                                loop={id?.includes('bg') || mConfig.loop}
                                accentColor={mConfig.accentColor}
                                primaryColor={mConfig.primaryColor}
                                secondaryColor={mConfig.secondaryColor}
                                playsInline
                                onLoadedData={handleLoad}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'block',
                                    ...((id?.includes('bg') || id?.includes('live')) ? { '--controls': 'none' } as any : {
                                        '--play-button': mConfig.showPlayButton === false ? 'none' : undefined,
                                        '--seek-backward-button': mConfig.showSeekButtons === false ? 'none' : undefined,
                                        '--seek-forward-button': mConfig.showSeekButtons === false ? 'none' : undefined,
                                        '--mute-button': mConfig.showMuteButton === false ? 'none' : undefined,
                                        '--captions-button': mConfig.showCaptionsButton === false ? 'none' : undefined,
                                        '--fullscreen-button': mConfig.showFullscreenButton === false ? 'none' : undefined,
                                        '--airplay-button': mConfig.showAirplayButton === false ? 'none' : undefined,
                                        '--cast-button': mConfig.showCastButton === false ? 'none' : undefined,
                                        '--playback-rate-button': mConfig.showPlaybackRateButton === false ? 'none' : undefined,
                                        '--volume-range': mConfig.showVolumeRange === false ? 'none' : undefined,
                                        '--time-range': mConfig.showTimeRange === false ? 'none' : undefined,
                                        '--time-display': mConfig.showTimeDisplay === false ? 'none' : undefined,
                                        '--duration-display': mConfig.showDurationDisplay === false ? 'none' : undefined,
                                        '--poster': 'none'
                                    })
                                }}
                            />
                        </div>
                    );
                })() : isVideo(url) ? (
                    <video
                        id={id}
                        ref={videoRef as any}
                        src={videoUrl}
                        autoPlay={shouldAutoPlay}
                        loop
                        muted={muted}
                        playsInline
                        preload={publishMode && !isHero ? 'none' : 'auto'}
                        onLoadedData={publishMode ? undefined : handleLoad}
                        className="universal-media-element"
                        style={{ ...baseStyle, ...transformStyle }}
                    />
                ) : publishMode ? (
                    // PUBLISH MODE image: wsrv.nl WebP + fetchpriority + lazy loading
                    <img
                        id={id}
                        src={wsrvSrc(url, 1920)}
                        srcSet={`${wsrvSrc(url, 320)} 320w, ${wsrvSrc(url, 640)} 640w, ${wsrvSrc(url, 960)} 960w, ${wsrvSrc(url, 1920)} 1920w`}
                        sizes="100vw"
                        fetchPriority={isHero ? 'high' : 'auto'}
                        loading={isHero ? 'eager' : 'lazy'}
                        className="universal-media-element"
                        style={{ ...baseStyle, ...transformStyle }}
                        alt="Background"
                    />
                ) : (
                    <img
                        id={id}
                        {...getResponsiveSrcSet(url, serverBaseUrl, "100vw")}
                        onLoad={handleLoad}
                        className="universal-media-element"
                        style={{ ...baseStyle, ...transformStyle }}
                        alt="Background"
                    />
                )}
            </div>
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    opacity: prefix ? `var(--${prefix}-dim)` : dim / 100,
                    background: 'linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.7) 70%, #000 100%)'
                }}
            />
        </div>
    );
};
