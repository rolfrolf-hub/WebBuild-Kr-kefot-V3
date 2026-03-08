import { BrandState } from '../types';

export const resolveTextClasses = (key: string, baseClasses: string = '', brandData: BrandState) => {
    const style = (brandData.textStyles || {})[key];
    let final = `${baseClasses} ${(style && style.classes) || ''}`.trim();

    if (style && style.glitchEnabled === false) {
        final = final.replace('glitch-heading', '').trim();
    } else if (style && style.glitchEnabled === true && !final.includes('glitch-heading')) {
        final += ' glitch-heading';
    }

    return final.trim();
};

export const resolveTextStyle = (key: string, isHeading: boolean, brandData: BrandState): any => {
    const style = (brandData.textStyles || {})[key];
    if (!style) return {};

    const styles: any = {};
    const resolvedType = style.semanticType || (isHeading ? 'h1' : 'body');

    // 1. Font Family
    if (style.font || style.semanticType) {
        styles['fontFamily'] = `var(--font-fam-${key})`;
    }

    // 2. Font Size
    styles['fontSize'] = `var(--fs-${key})`;

    // 3. Color
    if (style.color) {
        styles['color'] = `var(--color-${key})`;
    }

    // 4. Line Height
    if (style.lineHeight) {
        styles['lineHeight'] = `var(--lh-${key})`;
    }

    return styles;
};
