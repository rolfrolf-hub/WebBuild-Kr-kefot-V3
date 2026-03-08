/**
 * framingUtils.ts — Single Source of Truth for UniversalMedia framing math.
 *
 * Imported by:
 *   - SectionBasics.tsx  (React builder — isMobile known at JS runtime)
 *   - generator.ts       (Published HTML — mobile/desktop resolved by CSS @media)
 *
 * No external dependencies. Pure constants and math functions only.
 */

// ─── Buffer Constants ──────────────────────────────────────────────────────────
//
// The media element is sized LARGER than its container to create a pan buffer.
// translate3d percentages are relative to the ELEMENT, not the container.
// NORM converts a user-facing offset (e.g. x=50) into an actual translate3d
// percentage that keeps the image within bounds:
//
//   actual_translate% = offset% × NORM
//
// Mobile:  400% element → NORM = 0.25  (1 ÷ 4)
// Desktop: 200% element → NORM = 0.5   (1 ÷ 2)

export const MOBILE_BUFFER = '400%' as const; // 4× container → allows ±75% pan
export const DESKTOP_BUFFER = '200%' as const; // 2× container → allows ±50% pan
export const MOBILE_NORM = 0.25 as const; // 1 ÷ 4
export const DESKTOP_NORM = 0.5 as const; // 1 ÷ 2

// ─── CSS Variable Names ────────────────────────────────────────────────────────
// Declare these in the generator's <style> block (via getBufferCSSDeclarations).
// The builder can set them inline on the container element if needed.

export const CSS_VAR_BUFFER = '--um-buffer' as const;
export const CSS_VAR_NORM = '--um-norm' as const;

// ─── CSS Declarations (for generator.ts) ──────────────────────────────────────

/**
 * Returns the :root and @media declarations that set --um-buffer and --um-norm.
 * Paste inside the generator's global <style> block.
 */
export function getBufferCSSDeclarations(): string {
    return (
        `${CSS_VAR_BUFFER}: ${MOBILE_BUFFER}; ${CSS_VAR_NORM}: ${MOBILE_NORM};` +
        `@media (min-width: 768px) { :root { ${CSS_VAR_BUFFER}: ${DESKTOP_BUFFER}; ${CSS_VAR_NORM}: ${DESKTOP_NORM}; } }`
    );
}

// ─── Transform Builders ────────────────────────────────────────────────────────

/**
 * Builder (React) transform string.
 * `isMobile` is a JS boolean, so NORM is hardcoded at render time.
 *
 * @param prefix           - CSS variable prefix, e.g. "hero" → reads --hero-zoom, --hero-x, --hero-y, --hero-para
 * @param isMobile         - Whether to use MOBILE_NORM (0.25) or DESKTOP_NORM (0.5)
 * @param fallbackX        - Fallback X offset in % if CSS variable not set
 * @param fallbackY        - Fallback Y offset in %
 * @param fallbackPara     - Fallback parallax strength
 * @param scrollZoomSuffix - Optional scroll-zoom addition, e.g. " + (var(--scroll-y, 0) * 0.0001)"
 */
export function buildTransformForBuilder(
    prefix: string,
    isMobile: boolean,
    fallbackX = 0,
    fallbackY = 0,
    fallbackPara = 1,
    scrollZoomSuffix = ''
): string {
    const norm = isMobile ? MOBILE_NORM : DESKTOP_NORM;
    return (
        `scale(calc(var(--${prefix}-zoom)${scrollZoomSuffix})) ` +
        `translate3d(` +
        `calc(var(--${prefix}-x, ${fallbackX}%) * ${norm}), ` +
        `calc((var(--scroll-y, 0) * 1px * var(--${prefix}-para, ${fallbackPara}) / 100) + calc(var(--${prefix}-y, ${fallbackY}%) * ${norm})), ` +
        `0)`
    );
}

/**
 * Generator (published HTML) transform string.
 * Mobile vs desktop is resolved at browser runtime via CSS @media.
 * Requires `CSS_VAR_NORM` to be declared in the page's <style> block
 * (use getBufferCSSDeclarations() to generate those rules).
 *
 * @param prefix           - CSS variable prefix, e.g. "hero"
 * @param fallbackX        - Fallback X offset in % if CSS variable not set
 * @param fallbackY        - Fallback Y offset in %
 * @param fallbackPara     - Fallback parallax strength
 * @param scrollZoomSuffix - Optional scroll-zoom addition, e.g. " + (var(--scroll-y, 0) * 0.0001)"
 */
export function buildTransformForGenerator(
    prefix: string,
    fallbackX = 0,
    fallbackY = 0,
    fallbackPara = 1,
    scrollZoomSuffix = ''
): string {
    const normExpr = `var(${CSS_VAR_NORM}, ${DESKTOP_NORM})`;
    return (
        `scale(calc(var(--${prefix}-zoom)${scrollZoomSuffix})) ` +
        `translate3d(` +
        `calc(var(--${prefix}-x, ${fallbackX}%) * ${normExpr}), ` +
        `calc((var(--scroll-y, 0) * 1px * var(--${prefix}-para, ${fallbackPara}) / 100) + calc(var(--${prefix}-y, ${fallbackY}%) * ${normExpr})), ` +
        `0)`
    );
}
