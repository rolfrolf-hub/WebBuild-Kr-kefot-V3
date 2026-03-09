declare module 'https://esm.sh/jszip' {
    const JSZip: any;
    export default JSZip;
}

declare module '@mux/mux-player/react' {
    import MuxPlayer from '@mux/mux-player-react';
    export default MuxPlayer;
}

// Mux Web Components — used in publish-mode SSR output
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'mux-background-video': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
                src?: string; autoplay?: boolean | string; muted?: boolean | string;
                loop?: boolean | string; playbackid?: string; 'stream-type'?: string;
                style?: React.CSSProperties;
            }, HTMLElement>;
            'mux-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
                'playback-id'?: string; 'stream-type'?: string; autoplay?: boolean | string;
                muted?: boolean | string; loop?: boolean | string;
                style?: React.CSSProperties;
            }, HTMLElement>;
        }
    }
}
