import React from 'react';
import { UniversalMediaConfig, MuxPlayerConfig, YouTubeConfig, SpotifyConfig, SoundCloudConfig, MediaType } from '../types';

interface MediaCustomizationControlProps {
    type: MediaType;
    config: UniversalMediaConfig;
    onUpdate: (updates: Partial<UniversalMediaConfig>) => void;
    accentColor?: string;
}

export const MediaCustomizationControl: React.FC<MediaCustomizationControlProps> = ({
    type,
    config,
    onUpdate,
    accentColor = '#6366f1',
}) => {
    const updateMux = (updates: Partial<MuxPlayerConfig>) => {
        onUpdate({ mux: { ...config.mux, ...updates } });
    };

    const updateYouTube = (updates: Partial<YouTubeConfig>) => {
        onUpdate({ youtube: { ...config.youtube, ...updates } });
    };

    const updateSpotify = (updates: Partial<SpotifyConfig>) => {
        onUpdate({ spotify: { ...config.spotify, ...updates } });
    };

    const updateSoundCloud = (updates: Partial<SoundCloudConfig>) => {
        onUpdate({ soundcloud: { ...config.soundcloud, ...updates } });
    };

    const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (val: boolean) => void }) => (
        <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/50">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{label}</span>
            <button
                onClick={() => onChange(!value)}
                className={`w-8 h-4 rounded-full transition-colors relative ${value ? 'bg-[var(--accent)]' : 'bg-zinc-700'}`}
                style={{ '--accent': accentColor } as any}
            >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${value ? 'left-4.5' : 'left-0.5'}`} />
            </button>
        </div>
    );

    const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) => (
        <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/50">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{label}</span>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={value || '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-5 h-5 rounded overflow-hidden p-0 border-0 bg-transparent cursor-pointer"
                />
                <input
                    type="text"
                    value={value || ''}
                    placeholder="#HEX"
                    onChange={(e) => onChange(e.target.value)}
                    className="w-16 bg-zinc-800 text-[9px] text-zinc-300 px-1 py-0.5 rounded border border-zinc-700 font-mono"
                />
            </div>
        </div>
    );

    const Slider = ({ label, value, min, max, step, suffix = '', onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (val: number) => void }) => (
        <div className="py-2 border-b border-zinc-800/50">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{label}</span>
                <span className="text-[10px] text-[var(--accent)] font-mono" style={{ '--accent': accentColor } as any}>{value}{suffix}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                style={{ '--accent': accentColor } as any}
            />
        </div>
    );

    const Select = ({ label, options, value, onChange }: { label: string; options: { label: string; value: string }[]; value: string; onChange: (val: string) => void }) => (
        <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/50">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-zinc-800 text-[10px] text-white px-2 py-1 rounded border border-zinc-700 outline-none focus:border-[var(--accent)]"
                style={{ '--accent': accentColor } as any}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );

    if (type === 'mux' || type === 'mux-bg') {
        const mux: Partial<MuxPlayerConfig> = config.mux ?? {};
        return (
            <div className="flex flex-col gap-2 p-1">
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Mux Player Styles</div>
                <ColorPicker label="Accent" value={mux.accentColor || ''} onChange={(val) => updateMux({ accentColor: val })} />
                <ColorPicker label="Primary Icons" value={mux.primaryColor || ''} onChange={(val) => updateMux({ primaryColor: val })} />
                <ColorPicker label="Background" value={mux.secondaryColor || ''} onChange={(val) => updateMux({ secondaryColor: val })} />

                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-2 mb-1">Size (Desktop / Mobile)</div>
                <Select
                    label="Ratio Desk"
                    value={mux.aspectRatioDesktop || '16/9'}
                    onChange={(val) => updateMux({ aspectRatioDesktop: val })}
                    options={[{ label: '16:9', value: '16/9' }, { label: '4:3', value: '4/3' }, { label: '1:1', value: '1/1' }, { label: '21:9', value: '21/9' }]}
                />
                <Select
                    label="Ratio Mob"
                    value={mux.aspectRatioMobile || '16/9'}
                    onChange={(val) => updateMux({ aspectRatioMobile: val })}
                    options={[{ label: '16:9', value: '16/9' }, { label: '9:16', value: '9/16' }, { label: '1:1', value: '1/1' }]}
                />
                <Slider label="Width Desk" min={10} max={200} step={1} value={parseInt(mux.widthDesktop || '100')} suffix="%" onChange={(val) => updateMux({ widthDesktop: `${val}%` })} />
                <Slider label="Width Mob" min={10} max={200} step={1} value={parseInt(mux.widthMobile || '100')} suffix="%" onChange={(val) => updateMux({ widthMobile: `${val}%` })} />
                <Slider label="X-Pos Desk" min={-100} max={100} step={1} value={mux.xOffsetDesktop || 0} suffix="%" onChange={(val) => updateMux({ xOffsetDesktop: val })} />
                <Slider label="X-Pos Mob" min={-100} max={100} step={1} value={mux.xOffsetMobile || 0} suffix="%" onChange={(val) => updateMux({ xOffsetMobile: val })} />
                <Slider label="Y-Pos Desk" min={-100} max={100} step={1} value={mux.yOffsetDesktop || 0} suffix="%" onChange={(val) => updateMux({ yOffsetDesktop: val })} />
                <Slider label="Y-Pos Mob" min={-100} max={100} step={1} value={mux.yOffsetMobile || 0} suffix="%" onChange={(val) => updateMux({ yOffsetMobile: val })} />

                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-2 mb-1">Controls Visibility</div>
                <Select
                    label="Autoplay"
                    value={mux.autoPlay || 'off'}
                    onChange={(val) => updateMux({ autoPlay: val as any })}
                    options={[{ label: 'Off', value: 'off' }, { label: 'Muted', value: 'muted' }, { label: 'Any', value: 'any' }]}
                />
                <Select
                    label="Stream Type"
                    value={mux.streamType || 'on-demand'}
                    onChange={(val) => updateMux({ streamType: val as any })}
                    options={[{ label: 'On Demand', value: 'on-demand' }, { label: 'Live', value: 'live' }, { label: 'LL Live', value: 'll-live' }]}
                />
                <Toggle label="Play Button" value={mux.showPlayButton !== false} onChange={(val) => updateMux({ showPlayButton: val })} />
                <Toggle label="Seek Buttons" value={mux.showSeekButtons !== false} onChange={(val) => updateMux({ showSeekButtons: val })} />
                <Toggle label="Mute" value={mux.showMuteButton !== false} onChange={(val) => updateMux({ showMuteButton: val })} />
                <Toggle label="Fullscreen" value={mux.showFullscreenButton !== false} onChange={(val) => updateMux({ showFullscreenButton: val })} />
                <Toggle label="Loop" value={mux.loop === true} onChange={(val) => updateMux({ loop: val })} />
            </div>
        );
    }

    if (type === 'spotify') {
        const spot: Partial<SpotifyConfig> = config.spotify ?? {};
        return (
            <div className="flex flex-col gap-2 p-1">
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Spotify Theme</div>
                <Select
                    label="Theme"
                    value={spot.theme || '0'}
                    onChange={(val) => updateSpotify({ theme: val as '0' | '1' })}
                    options={[{ label: 'Dark', value: '0' }, { label: 'Light', value: '1' }]}
                />
                <Select
                    label="Size"
                    value={spot.size || 'normal'}
                    onChange={(val) => updateSpotify({ size: val as 'compact' | 'normal' })}
                    options={[{ label: 'Normal', value: 'normal' }, { label: 'Compact', value: 'compact' }]}
                />
            </div>
        );
    }

    if (type === 'soundcloud') {
        const sc: Partial<SoundCloudConfig> = config.soundcloud ?? {};
        return (
            <div className="flex flex-col gap-2 p-1">
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">SoundCloud Config</div>
                <ColorPicker label="Player Color" value={sc.color || '#ff5500'} onChange={(val) => updateSoundCloud({ color: val })} />
                <Toggle label="Show User" value={sc.showUser !== false} onChange={(val) => updateSoundCloud({ showUser: val })} />
                <Toggle label="Show Teaser" value={sc.showTeaser === true} onChange={(val) => updateSoundCloud({ showTeaser: val })} />
                <Toggle label="Show Comments" value={sc.showComments === true} onChange={(val) => updateSoundCloud({ showComments: val })} />
            </div>
        );
    }

    if (type === 'youtube') {
        const yt: Partial<YouTubeConfig> = config.youtube ?? {};
        return (
            <div className="flex flex-col gap-2 p-1">
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">YouTube Config</div>
                <Toggle label="Show Controls" value={yt.controls !== false} onChange={(val) => updateYouTube({ controls: val })} />
                <Toggle label="Modest Branding" value={yt.modestBranding !== false} onChange={(val) => updateYouTube({ modestBranding: val })} />
                <Toggle label="Autoplay" value={yt.autoplay === true} onChange={(val) => updateYouTube({ autoplay: val })} />
            </div>
        );
    }

    return null;
};
