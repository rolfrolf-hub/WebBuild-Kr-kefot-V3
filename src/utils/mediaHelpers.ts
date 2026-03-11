/**
 * Converts various media URLs (YouTube, Spotify, SoundCloud) into their proper embed formats.
 */
export const getEmbedUrl = (url: string): string => {
    if (!url) return '';

    // 1. YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';

        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split(/[?#/]/)[0];
        } else if (url.includes('v=')) {
            videoId = url.split('v=')[1].split(/[&?#]/)[0];
        } else if (url.includes('embed/')) {
            return url; // Already an embed URL
        } else if (url.includes('shorts/')) {
            videoId = url.split('shorts/')[1].split(/[?#]/)[0];
        }

        if (videoId) {
            // Preserve timestamp if it exists (t= or start=)
            const timestampMatch = url.match(/[?&](t|start)=(\d+)/);
            const start = timestampMatch ? `&start=${timestampMatch[2]}` : '';
            return `https://www.youtube.com/embed/${videoId}?rel=0${start}`;
        }
    }

    // 2. Spotify
    if (url.includes('open.spotify.com')) {
        if (url.includes('/embed/')) return url; // Already an embed URL
        // Replace the main domain with /embed/ path
        return url.replace('open.spotify.com/', 'open.spotify.com/embed/');
    }

    // 3. SoundCloud
    if (url.includes('soundcloud.com')) {
        if (url.includes('w.soundcloud.com/player')) return url; // Already an embed URL
        // SoundCloud requires the full player URL with the track URL as a parameter
        return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=false&visual=false`;
    }

    return url;
};

/**
 * Extracts a Mux Playback ID from a raw ID, URL, or embed snippet.
 * Recognizes common Mux ID formats (alphanumeric, 20+ chars) from stream.mux.com, image.mux.com, player.mux.com, or raw input.
 */
export const extractMuxId = (input: string): string | null => {
    if (!input) return null;

    // Remove any surrounding whitespace
    const cleanInput = input.trim();

    // 1. Exact extraction from known Mux domains (stream.mux.com/ID, image.mux.com/ID, player.mux.com/ID)
    const muxUrlMatch = cleanInput.match(/(?:stream|image|player)\.mux\.com\/([a-zA-Z0-9_-]{15,30})/);
    if (muxUrlMatch && muxUrlMatch[1]) {
        return muxUrlMatch[1];
    }

    // 2. Exact extraction from a playback-id attribute in an iframe or custom element string
    const attrMatch = cleanInput.match(/playback-?id=["']?([a-zA-Z0-9_-]{15,40})/i);
    if (attrMatch && attrMatch[1]) {
        return attrMatch[1];
    }

    // 3. Fallback: If it's a pure raw string (no slashes, no spaces) and length is between 15 and 45.
    // Spotify track IDs are 22 chars, so we explicitly exclude inputs that seem to belong to known players
    // or end in media extensions.
    const isPureId = /^[a-zA-Z0-9_-]{15,45}$/.test(cleanInput);
    const hasKnownDomain = /spotify|youtube|youtu\.be|vimeo|soundcloud/.test(cleanInput.toLowerCase());
    const isLocalFile = /\.(mp4|m4v|mov|webm|mp3|wav|ogg|jpg|jpeg|png|webp|gif)$/i.test(cleanInput);

    if (isPureId && !hasKnownDomain && !isLocalFile) {
        // We assume this raw long ID is a Mux ID since YouTube is 11 chars, and Spotify embeds shouldn't be raw IDs here.
        return cleanInput;
    }

    // MANDATORY FIX: Eksplisitt retur for å forhindre undefined i React State
    return null;
};

/**
 * Returns a Mux HLS stream URL from a playback ID or Mux URL.
 * Use this as the `src` for a <video> or <mux-video> element.
 */
export const getMuxStreamUrl = (input: string): string | null => {
    const id = extractMuxId(input);
    if (!id) return null;
    return `https://stream.mux.com/${id}.m3u8`;
};

/**
 * Returns true if the given string is a Mux URL or playback ID.
 */
export const isMuxUrl = (input: string): boolean => {
    if (!input) return false;
    return !!extractMuxId(input);
};

/**
 * Determines the media type from a URL. Returns a valid MediaType.
 */
export const getMediaTypeFromUrl = (url: string): import('../types').MediaType => {
    if (!url) return 'video';
    const cleanUrl = url.toLowerCase();
    if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) return 'youtube';
    if (cleanUrl.includes('open.spotify.com')) return 'spotify';
    if (cleanUrl.includes('soundcloud.com')) return 'soundcloud';
    if (isMuxUrl(url)) return 'mux';
    if (/\.(mp4|mov|webm|m4v|mkv)$/i.test(url)) return 'video';
    if (/\.(mp3|wav|ogg|aac|flac)$/i.test(url)) return 'audio';
    return 'video';
};

export const isVideo = (url: string) => /\.(mp4|mov|webm|m4v|mkv)$/i.test(url);
