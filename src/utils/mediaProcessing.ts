export interface ProcessedMedia {
    file: File;
    name: string;
    width: number;
    url: string; // Object URL for preview purposes
}

export const TARGET_WIDTHS = [320, 480, 640, 960, 1920];

/**
 * Reads an image file and converts it into responsive WebP sizes.
 */
export const processImage = async (file: File, customName?: string): Promise<ProcessedMedia[]> => {
    return new Promise((resolve, reject) => {
        // Only process images
        if (!file.type.startsWith('image/')) {
            reject(new Error('File is not an image'));
            return;
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = async () => {
            try {
                const results: ProcessedMedia[] = [];

                // Extract base name without extension
                let baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                if (customName) {
                    baseName = customName;
                }
                const cleanBaseName = baseName.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').toLowerCase();

                // Sort widths ascending
                for (const width of TARGET_WIDTHS) {
                    // Don't upscale unnecessarily unless the image is smaller than the smallest target
                    if (img.width < width && width !== TARGET_WIDTHS[0]) {
                        continue;
                    }

                    // Create canvas
                    const canvas = document.createElement('canvas');

                    // Calculate height maintaining aspect ratio
                    const scaleFactor = width / img.width;
                    const height = Math.round(img.height * scaleFactor);

                    canvas.width = Math.min(width, img.width); // Cap at max original width
                    canvas.height = Math.round(img.height * (canvas.width / img.width));

                    const ctx = canvas.getContext('2d');
                    if (!ctx) throw new Error("Could not get canvas context");

                    // Draw scaled image
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Convert to WebP blob
                    const webpBlob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/webp', 0.85));

                    if (webpBlob) {
                        const newName = `${cleanBaseName}-${canvas.width}.webp`;
                        const newFile = new File([webpBlob], newName, { type: 'image/webp' });
                        results.push({
                            file: newFile,
                            name: newName,
                            width: canvas.width,
                            url: URL.createObjectURL(webpBlob)
                        });
                    }
                }

                // If no results (extremely small image?), fallback to original size as webp
                if (results.length === 0) {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                    const webpBlob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/webp', 0.85));
                    if (webpBlob) {
                        const newName = `${cleanBaseName}-${img.width}.webp`;
                        const newFile = new File([webpBlob], newName, { type: 'image/webp' });
                        results.push({
                            file: newFile,
                            name: newName,
                            width: img.width,
                            url: URL.createObjectURL(webpBlob)
                        });
                    }
                }

                URL.revokeObjectURL(objectUrl);
                resolve(results);

            } catch (err) {
                URL.revokeObjectURL(objectUrl);
                reject(err);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image for processing'));
        }

        img.src = objectUrl;
    });
};

/**
 * Resolves a responsive image srcset given a base URL.
 * Assumes the naming convention `basename-WIDTH.webp`.
 * @param baseUrl e.g. "https://domain.com/media/hero-1920.webp" or "media/images/hero-1920.webp"
 */
export const getResponsiveSrcSet = (url: string, serverBaseUrl: string = '', customSizes?: string): { src: string, srcSet?: string, sizes?: string } => {
    // If the URL is relative and we have a serverBaseUrl, prepend it
    const absoluteUrl = (url.startsWith('http') || !serverBaseUrl) ? url : `${serverBaseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;

    // Check if it matches our pattern exactly `-WIDTH.webp`
    const webpMatch = absoluteUrl.match(/^(.*)-(\d+)\.webp$/i);
    if (!webpMatch) {
        return { src: absoluteUrl }; // Return as-is
    }

    const basePath = webpMatch[1];
    const detectedWidth = parseInt(webpMatch[2], 10);

    // Only include widths that are less than or equal to the detected width, 
    // UNLESS the detected width is smaller than our smallest target (e.g. 240px).
    const availableWidths = TARGET_WIDTHS.filter(w => w <= detectedWidth);
    if (availableWidths.length === 0) availableWidths.push(detectedWidth);

    const srcSet = availableWidths.map(w => `${basePath}-${w}.webp ${w}w`).join(', ');

    // Priority: customSizes > calculated responsive sizes > default fallback
    const sizes = customSizes || `(max-width: 480px) 320px, (max-width: 960px) 640px, ${detectedWidth}px`;

    return {
        src: absoluteUrl,
        srcSet,
        sizes
    };
}
