import React, { useState, useRef, useEffect } from 'react';
import { BrandState, MediaItem, MediaType, MuxPlayerConfig } from '../types';
declare global { namespace JSX { interface IntrinsicElements { 'mux-video': any; } } }
import MuxPlayer from '@mux/mux-player-react';
import { InlineText } from './InlineText';
import { MediaEditControl } from './MediaEditControl';
import { MediaCustomizationControl } from './MediaCustomizationControl';
import { getResponsiveSrcSet } from '../utils/mediaProcessing';
import { getEmbedUrl, extractMuxId } from '../utils/mediaHelpers';

interface MediaCardProps {
    item: MediaItem;
    index: number;
    onUpdate: (data: Partial<MediaItem>) => void;
    brandData: BrandState;
    onGlobalUpdate: (data: Partial<BrandState>) => void;
    style?: React.CSSProperties;
    isClone?: boolean;
    isActive?: boolean;
    onToggleActive: (id: string | null) => void;
    sizes?: string;
}

const normalizePath = (url: string) => {
    if (!url) return '';
    if (url.match(/^(https?:)?\/\/(www\.)?(youtube\.com|youtu\.be|spotify\.com|soundcloud\.com|music\\.apple\.com|facebook\.com|instagram\.com|x\.com|twitter\.com)/)) {
        return url;
    }
    return url;
};

/** Resolve the thumbnail URL.
 *  Rule: if item.thumbnail is set → always use it.
 *  Only if unset → auto-generate from media type (YouTube ID, Mux snapshot, video first-frame).
 */
const resolveThumbnail = (item: MediaItem): { url: string; isVideo: boolean } => {
    const fallback = 'https://kraakefot.com/media/Thief-In-The-Night-Artwork-2-Krakefot-web.png';

    // Custom thumbnail takes priority over everything
    if (item.thumbnail) {
        return { url: item.thumbnail, isVideo: false };
    }

    // No custom thumbnail → auto-generate
    if (item.type === 'youtube' && item.url) {
        const ytId = item.url.includes('v=')
            ? item.url.split('v=')[1].split(/[&?#]/)[0]
            : item.url.split('/').pop()?.split('?')[0] ?? '';
        return { url: ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : fallback, isVideo: false };
    }

    if ((item.type === 'mux' || item.type === 'mux-bg') && item.url) {
        const muxId = extractMuxId(item.url);
        if (muxId) return { url: `https://image.mux.com/${muxId}/thumbnail.jpg?time=0`, isVideo: false };
        return { url: fallback, isVideo: false };
    }

    if (item.type === 'video' && item.url) {
        // Render as video element to capture first frame
        return { url: item.url, isVideo: true };
    }

    // Spotify / audio / fallback
    return { url: fallback, isVideo: false };
};

export const MediaCard: React.FC<MediaCardProps> = ({ item, index, onUpdate, brandData, onGlobalUpdate, style, isClone, isActive, onToggleActive, sizes }) => {

    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoThumbRef = useRef<HTMLVideoElement>(null);
    const tapStartedPlayRef = useRef(false);

    const thumb = resolveThumbnail(item);

    // When card becomes inactive, pause audio
    useEffect(() => {
        if (!isActive && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, [isActive]);

    // First-frame capture for video auto-thumbnail
    useEffect(() => {
        const vid = videoThumbRef.current;
        if (!vid) return;
        const onLoaded = () => { vid.currentTime = 0.01; };
        vid.addEventListener('loadeddata', onLoaded);
        return () => vid.removeEventListener('loadeddata', onLoaded);
    }, [thumb.url, thumb.isVideo]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (item.type === 'audio') {
            if (!isActive) {
                // Play first (within user gesture), then toggle state.
                // On mobile: tapStartedPlayRef.current is true (play was already called via onTouchStart)
                if (!tapStartedPlayRef.current) {
                    audioRef.current?.play().catch(() => {});
                }
                tapStartedPlayRef.current = false;
                onToggleActive(item.id);
            }
            // If already active, card body click does nothing — pause/play via overlay button, close via outside click
            return;
        }
        if (isActive) {
            onToggleActive(null);
        } else {
            onToggleActive(item.id);
        }
    };

    const handleAudioPlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(() => {});
        }
    };

    const isAudio = item.type === 'audio';

    const renderEmbed = () => {
        if (!isActive || !item.url) return null;

        if (item.type === 'spotify' || item.type === 'youtube') {
            return (
                <div
                    className="absolute inset-0 z-30 bg-black"
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    <iframe
                        src={getEmbedUrl(item.url)}
                        className="w-full h-full border-0"
                        allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        loading="lazy"
                    />
                </div>
            );
        }

        if (item.type === 'video') {
            const url1080 = item.url;
            const url480 = url1080.replace(/-1080(\.(mp4|m4v|webm|mov))$/i, '-480$1');
            const hasResponsive = url480 !== url1080;
            return (
                <div
                    className="absolute inset-0 z-30 bg-black"
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    <video
                        className="w-full h-full object-cover"
                        autoPlay
                        controls
                        playsInline
                    >
                        {hasResponsive && (
                            <source src={url1080} media="(min-width: 768px)" type="video/mp4" />
                        )}
                        <source src={hasResponsive ? url480 : url1080} type="video/mp4" />
                    </video>
                </div>
            );
        }

        // Audio: handled by always-present <audio> element + active overlay in JSX
        if (item.type === 'audio') {
            return null;
        }

        if (item.type === 'mux' || item.type === 'mux-bg') {
            const muxId = extractMuxId(item.url) || item.url;
            const isBg = item.type === 'mux-bg';
            const mConfig: Partial<MuxPlayerConfig> = item.mediaConfig?.mux ?? {};

            return (
                <div
                    className="absolute inset-0 z-30 bg-black"
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <div style={{
                        width: brandData.isMobilePreview ? (mConfig.widthMobile || '100%') : (mConfig.widthDesktop || '100%'),
                        aspectRatio: brandData.isMobilePreview ? (mConfig.aspectRatioMobile || mConfig.aspectRatioDesktop || '16/9') : (mConfig.aspectRatioDesktop || '16/9'),
                        transform: `translateX(${brandData.isMobilePreview ? (mConfig.xOffsetMobile || 0) : (mConfig.xOffsetDesktop || 0)}%)`,
                        position: 'relative',
                    }}>
                        <MuxPlayer
                            playbackId={muxId}
                            streamType="on-demand"
                            autoPlay={mConfig.autoPlay === 'muted' || mConfig.autoPlay === 'any' ? mConfig.autoPlay : (isBg ? true : false)}
                            muted={isBg || mConfig.autoPlay === 'muted'}
                            loop={isBg || mConfig.loop}
                            accentColor={mConfig.accentColor || brandData.accentColor}
                            primaryColor={mConfig.primaryColor}
                            secondaryColor={mConfig.secondaryColor}
                            forwardSeekOffset={mConfig.forwardSeekOffset}
                            backwardSeekOffset={mConfig.backwardSeekOffset}
                            startTime={mConfig.startTime}
                            playsInline
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'block',
                                ...(isBg ? { '--controls': 'none' } as any : {
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
                                })
                            }}
                        />
                    </div>
                </div>
            );
        }

        return null;
    };

    // Punkt 2: Resolve which thumbnail to display (playingThumbnail when audio plays)
    const displayThumbUrl = (isAudio && isPlaying && item.playingThumbnail)
        ? item.playingThumbnail
        : (thumb.isVideo ? '' : thumb.url);

    const imgProps = !thumb.isVideo
        ? getResponsiveSrcSet(normalizePath(displayThumbUrl), brandData.serverBaseUrl, sizes)
        : {};

    return (
        <div
            className={`group/card media-gallery-item relative bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl border-2 border-transparent hover:border-[var(--accent)] hover:shadow-[0_0_40px_rgb(var(--accent-rgb)/0.4)] transition-all duration-500 cursor-pointer flex-shrink-0 ${isActive ? 'media-active border-[var(--accent)]' : ''}`}
            style={style}
            onClick={handleClick}
            onTouchStart={() => {
                if (item.type === 'audio' && !isActive) {
                    tapStartedPlayRef.current = true;
                    audioRef.current?.play().catch(() => {});
                }
            }}
        >
            {/* Always-present audio element — plays on card tap, pauses on outside click */}
            {isAudio && (
                <audio
                    ref={audioRef}
                    src={item.url}
                    preload="auto"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                />
            )}

            {/* Thumbnail: either <img> or <video> for first-frame auto mode */}
            {thumb.isVideo ? (
                <video
                    ref={videoThumbRef}
                    src={thumb.url}
                    muted
                    playsInline
                    preload="metadata"
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 group-hover/card:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isActive ? 'opacity-0 pointer-events-none' : 'filter grayscale brightness-[0.8] group-hover/card:grayscale-0 group-hover/card:brightness-100'}`}
                    onLoadedData={() => setIsLoaded(true)}
                />
            ) : (
                <img
                    {...imgProps}
                    onLoad={() => setIsLoaded(true)}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 transform group-hover/card:scale-105 ${(isLoaded || (isAudio && isActive)) ? 'opacity-100' : 'opacity-0'} ${!(isActive && isAudio && isPlaying) ? 'filter grayscale brightness-[0.8] group-hover/card:grayscale-0 group-hover/card:brightness-100' : ''} ${isActive && !isAudio ? 'opacity-0 pointer-events-none' : ''}`}
                    style={
                        isAudio && isActive && isPlaying
                            ? { opacity: 1, filter: 'grayscale(0%) brightness(1)' }
                            : isAudio && isActive
                            ? { opacity: 1 }
                            : undefined
                    }
                    onError={(e) => {
                        const t = e.currentTarget;
                        if (!t.dataset.errFallback) {
                            t.dataset.errFallback = '1';
                            t.srcset = '';
                            t.src = 'https://kraakefot.com/media/Thief-In-The-Night-Artwork-2-Krakefot-web.png';
                        }
                    }}
                    alt={item.title}
                />
            )}

            {/* Scanlines overlay */}
            <div
                className={`absolute inset-0 z-[5] pointer-events-none transition-opacity duration-500 group-hover/card:opacity-0 ${isActive ? 'opacity-0' : 'opacity-100'}`}
                style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)'
                }}
            />

            {renderEmbed()}

            {/* Audio active overlay — always-visible play/pause, stops propagation so card body click does nothing */}
            {isAudio && isActive && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <button
                        className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-[var(--accent)] shadow-xl hover:bg-white/20 transition-all duration-300 cursor-pointer pointer-events-auto"
                        onClick={(e) => { e.stopPropagation(); handleAudioPlay(); }}
                    >
                        {isPlaying ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <rect x="6" y="5" width="4" height="14" rx="1" />
                                <rect x="14" y="5" width="4" height="14" rx="1" />
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="ml-1">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>
                </div>
            )}

            {/* Play overlay (hidden when active, always pointer-events-none so it never intercepts clicks/taps) */}
            <div className={`absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none ${isActive ? '!opacity-0' : ''}`}>
                <div className={`w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-[var(--accent)] shadow-xl`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="ml-1"><path d="M8 5v14l11-7z" /></svg>
                </div>
            </div>
            <div className={`absolute bottom-6 left-6 right-6 z-20 pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 ${isActive ? '!opacity-0' : ''}`}>
                <h4 className="text-white font-serif italic text-lg drop-shadow-md truncate">{item.title}</h4>
                <p className="text-[var(--accent)] text-[10px] font-bold uppercase tracking-widest">{item.artist || ''}</p>
            </div>

            {/* Editor controls panel (hover) */}
            {!isClone && (
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-50 opacity-0 group-hover/card:opacity-100 transition-all translate-y-2 group-hover/card:translate-y-0 pointer-events-auto" onClick={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                    <div className="flex flex-col gap-1.5 p-1 border-b border-zinc-800/50 mb-1">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Media Config</span>
                        <select
                            value={item.type}
                            onChange={(e) => onUpdate({ type: e.target.value as MediaType })}
                            className="w-full bg-zinc-800 text-[10px] text-white px-2 py-1.5 rounded-lg border border-zinc-700 uppercase font-bold focus:border-[var(--accent)] outline-none"
                        >
                            <option value="spotify">Spotify / SoundCloud</option>
                            <option value="youtube">YouTube</option>
                            <option value="video">Local Video</option>
                            <option value="audio">Local Audio</option>
                            <option value="mux">Mux Video</option>
                            <option value="mux-bg">Mux Background</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <MediaEditControl
                            label="URL / Media ID"
                            value={item.url}
                            onSave={(val) => onUpdate({ url: val })}
                            brandData={brandData}
                            onUpdate={onGlobalUpdate}
                            variant="sidebar"
                            className="!mb-0"
                        />

                        {/* Thumbnail URL — if set it's shown; leave empty for auto-preview */}
                        {(item.type === 'video' || item.type === 'youtube' || item.type === 'mux' || item.type === 'mux-bg') && (
                            <MediaEditControl
                                label="Thumbnail (empty = auto)"
                                value={item.thumbnail || ''}
                                onSave={(val) => onUpdate({ thumbnail: val || undefined })}
                                brandData={brandData}
                                onUpdate={onGlobalUpdate}
                                variant="sidebar"
                                className="!mb-0"
                            />
                        )}

                        {/* Punkt 2 & 3: For spotify/audio — alltid custom thumbnail + playingThumbnail */}
                        {(item.type === 'spotify' || item.type === 'audio') && (
                            <>
                                <MediaEditControl
                                    label="Thumbnail URL"
                                    value={item.thumbnail || ''}
                                    onSave={(val) => onUpdate({ thumbnail: val })}
                                    brandData={brandData}
                                    onUpdate={onGlobalUpdate}
                                    variant="sidebar"
                                    className="!mb-0"
                                />
                                {item.type === 'audio' && (
                                    <MediaEditControl
                                        label="Playing Image (valgfri)"
                                        value={item.playingThumbnail || ''}
                                        onSave={(val) => onUpdate({ playingThumbnail: val || undefined })}
                                        brandData={brandData}
                                        onUpdate={onGlobalUpdate}
                                        variant="sidebar"
                                        className="!mb-0"
                                    />
                                )}
                            </>
                        )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-zinc-800/50">
                        <MediaCustomizationControl
                            type={item.type}
                            config={item.mediaConfig || {}}
                            onUpdate={(conf) => onUpdate({ mediaConfig: conf })}
                            accentColor={brandData.accentColor}
                        />
                    </div>

                    <div className="mt-2 pt-2 border-t border-zinc-800/50 flex flex-col gap-2">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Title</span>
                            <InlineText value={item.title} onSave={(val) => onUpdate({ title: val })} className="text-xs text-white bg-zinc-800/50 px-2 py-1.5 rounded-lg" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Artist / Subtitle</span>
                            <InlineText value={item.artist || "Artist"} onSave={(val) => onUpdate({ artist: val })} className="text-[10px] text-zinc-400 bg-zinc-800/50 px-2 py-1.5 rounded-lg" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
