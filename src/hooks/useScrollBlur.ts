import { useEffect, useRef } from 'react';

interface ScrollBlurOptions {
    enabled?: boolean;
    strength?: number;
    radius?: number; // 0-1: Normalized distance from center where blur starts
    targetRef?: React.RefObject<HTMLElement>; // The element to apply blur TO
    scrollContainer?: React.RefObject<HTMLElement>; // The container that scrolls
}

/**
 * Custom hook that applies a blur effect based on scroll position using direct DOM manipulation
 * for high performance (avoids React re-renders).
 */
export const useScrollBlur = (options: ScrollBlurOptions = {}) => {
    const { enabled = false, strength = 5, radius = 0.5, targetRef, scrollContainer } = options;
    const containerRef = useRef<HTMLElement>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const element = containerRef.current;
        const target = targetRef?.current;
        const scrollTarget = scrollContainer?.current || window;

        if (!element || !target || !enabled) {
            if (target) {
                target.style.filter = 'blur(0px)';
                target.style.transform = 'translate3d(0,0,0)'; // Force hardware acceleration
            }
            return;
        }

        const updateBlur = () => {
            const rect = element.getBoundingClientRect();
            if (rect.height === 0) return; // Guard against zero height during layout

            let viewportHeight, viewportCenter, elementCenter;

            if (scrollContainer && scrollContainer.current) {
                // Calculation relative to custom container
                const containerRect = scrollContainer.current.getBoundingClientRect();
                viewportHeight = containerRect.height;
                viewportCenter = containerRect.top + viewportHeight / 2;
                // Element center relative to viewport/screen, same as containerRect.top
                elementCenter = rect.top + rect.height / 2;
            } else {
                // Window calculation
                viewportHeight = window.innerHeight;
                viewportCenter = viewportHeight / 2;
                elementCenter = rect.top + rect.height / 2;
            }

            // Calculate distance from center
            const distanceFromCenter = Math.abs(elementCenter - viewportCenter);
            const maxDistance = viewportHeight / 2;

            // Normalized distance (0 at center, 1 at edge)
            const normalizedDistance = Math.min(1, distanceFromCenter / maxDistance);

            let blurAmount = 0;
            if (normalizedDistance > radius) {
                // Map interval [radius, 1] to [0, strength]
                const ramp = (normalizedDistance - radius) / (1 - radius);
                blurAmount = Math.min(strength, ramp * strength);
            }

            // Apply directly to DOM
            target.style.filter = `blur(${blurAmount.toFixed(2)}px)`;
        };

        const onScroll = () => {
            if (rafRef.current) return;
            rafRef.current = requestAnimationFrame(() => {
                updateBlur();
                rafRef.current = null;
            });
        };

        // Initial calculation
        updateBlur();

        target.style.willChange = 'filter';
        scrollTarget.addEventListener('scroll', onScroll, { passive: true });
        scrollTarget.addEventListener('resize', onScroll, { passive: true });

        return () => {
            scrollTarget.removeEventListener('scroll', onScroll);
            scrollTarget.removeEventListener('resize', onScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (target) {
                target.style.filter = '';
                target.style.willChange = '';
            }
        };
    }, [enabled, strength, radius, targetRef, scrollContainer]);

    return { ref: containerRef };
};
