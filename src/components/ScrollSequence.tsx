import React, { useEffect, useRef, useState, useCallback } from 'react';
import { UniversalMedia } from './SectionBasics';
import { SectionFraming } from '../types';

const FRAME_COUNT = 45;
const FRAME_BASE_PATH = 'https://kraakefot.com/media/animations/about-hero-v5';
const FRAME_SIZES = [320, 480, 640, 960, 1920] as const;

/** Pick the smallest available frame size that covers the effective viewport width (viewport × DPR). */
const getBestFrameSize = (): number => {
    const effectiveWidth = window.innerWidth * (window.devicePixelRatio || 1);
    for (const s of FRAME_SIZES) {
        if (s >= effectiveWidth) return s;
    }
    return 1920;
};

interface ScrollSequenceProps {
    isMobile: boolean;
    scrollProgress: number;   // 0–1: 0=section top at viewport top, 1=section fully scrolled past
    parallax: number;         // same units as visuals.parallax (e.g. 7 means 7%)
    saturation: number;       // 0–200 (100 = normal)
    fallbackUrl?: string;     // shown if frames fail to load
    serverBaseUrl?: string;
    framing?: SectionFraming;
    mediaConfig?: any;
}

export const ScrollSequence: React.FC<ScrollSequenceProps> = ({
    isMobile,
    scrollProgress,
    parallax,
    saturation,
    fallbackUrl,
    serverBaseUrl,
    framing,
    mediaConfig
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const framesRef = useRef<(HTMLImageElement | null)[]>([]);
    const rafRef = useRef<number | null>(null);
    const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

    // ─── Draw function (kept in a ref so onload/resize always calls latest version) ───
    const drawFnRef = useRef<() => void>(() => { /* will be set on every render */ });

    drawFnRef.current = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // DP Sync: Get device pixel ratio for sharpness
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;

        if (w === 0 || h === 0) return;

        // Sync canvas internal resolution to its CSS display size * DPR
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.scale(dpr, dpr);
        }

        const frames = framesRef.current;
        if (frames.length === 0) return;

        // Select target frame, walk backward to find nearest loaded frame
        const targetIndex = Math.min(frames.length - 1, Math.floor(scrollProgress * frames.length));
        let img: HTMLImageElement | null = null;
        for (let j = targetIndex; j >= 0; j--) {
            const f = frames[j];
            if (f && f.complete && f.naturalWidth > 0) { img = f; break; }
        }
        if (!img) return;

        const parallaxFraction = parallax / 100;

        // Absolute Default Scaling: Follow width only (Width-Fit).
        // Technically this is "cover" but fixed to width. User controls zoom via Framing.
        const baseScale = w / img.naturalWidth;

        // Extract framing values for scale, x, y
        const zoomLevel = framing ? (isMobile ? (framing.zoomMobile ?? 1) : (framing.zoomDesktop ?? 1)) : 1;
        const xOffset = framing ? (isMobile ? (framing.xOffsetMobile ?? 0) : (framing.xOffsetDesktop ?? 0)) : 0;
        const yOffset = framing ? (isMobile ? (framing.yOffsetMobile ?? 0) : (framing.yOffsetDesktop ?? 0)) : 0;

        const scale = baseScale * zoomLevel;
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;

        // Parallax: as scroll advances, image moves UP inside the canvas
        const parallaxPx = scrollProgress * h * parallaxFraction;

        // Apply user offsets (convert % of wrapper width/height to px, mirroring how CSS transform works)
        const userDx = (xOffset / 100) * w;
        const userDy = (yOffset / 100) * h;

        const dx = (w - dw) / 2 + userDx;
        // Origin Sync: Top-Center (0). Image starts at top by default; use Position Y to move down.
        const dy = 0 - parallaxPx + userDy;

        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, dx, dy, dw, dh);
    };

    // ─── Stable schedule function ─────────────────────────────────────────────────────
    const scheduleDraw = useCallback(() => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            drawFnRef.current();
            rafRef.current = null;
        });
    }, []);

    // ─── Preload frames ───────────────────────────────────────────────────────────────
    useEffect(() => {
        setLoadState('loading');
        const size = getBestFrameSize();
        const count = FRAME_COUNT;
        const frames: (HTMLImageElement | null)[] = new Array(count).fill(null);
        framesRef.current = frames;

        let errorCount = 0;

        // Fallback: if no frames at all after 3s, show fallback UI
        const timeoutId = setTimeout(() => {
            const loaded = frames.filter(f => f && f.complete && f.naturalWidth > 0).length;
            if (loaded === 0) setLoadState('error');
        }, 3000);

        for (let i = 0; i < count; i++) {
            const img = new Image();
            const num = String(i + 1).padStart(2, '0');
            img.src = `${FRAME_BASE_PATH}/${size}/frame_${num}-${size}.webp`;
            frames[i] = img;

            img.onload = () => {
                // Mark ready as soon as first frame is available
                if (i === 0) setLoadState('ready');
                // Redraw with any newly loaded frame
                scheduleDraw();
            };

            img.onerror = () => {
                frames[i] = null;
                errorCount++;
                // If >80% of frames fail → show fallback
                if (errorCount > count * 0.8) setLoadState('error');
            };
        }

        return () => {
            clearTimeout(timeoutId);
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
        // Re-run when scheduleDraw changes (stable) — size is recalculated inside
    }, [scheduleDraw]);

    // ─── Redraw when scrollProgress or parallax changes ──────────────────────────────
    useEffect(() => {
        if (loadState !== 'ready') return;
        scheduleDraw();
    }, [scrollProgress, parallax, loadState, scheduleDraw]);

    // ─── Redraw on window resize ──────────────────────────────────────────────────────
    useEffect(() => {
        window.addEventListener('resize', scheduleDraw, { passive: true });
        return () => window.removeEventListener('resize', scheduleDraw);
    }, [scheduleDraw]);

    // ─── Fallback: show UniversalMedia if frames could not be loaded ──────────────────
    if (loadState === 'error' && fallbackUrl) {
        return (
            <UniversalMedia
                url={fallbackUrl}
                isMobile={isMobile}
                zoom={1}
                x={0}
                y={0}
                saturation={saturation}
                parallax={parallax}
                dim={0}
                opacity={100}
                scrollY={0}
                serverBaseUrl={serverBaseUrl ?? ''}
                mediaConfig={mediaConfig}
            />
        );
    }

    return (
        <div style={{ position: 'absolute', inset: 0, filter: `saturate(${saturation}%)` }}>
            {loadState === 'loading' && (
                <div style={{ position: 'absolute', inset: 0, background: '#000' }} />
            )}
            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
            />
        </div>
    );
};

export default ScrollSequence;
