import React, { useState } from 'react';
import { FONT_OPTIONS } from '../TypographyControl';

interface GlobalTypographyPanelProps {
    brandData: any;
    onUpdate: (data: any) => void;
}

const FontSelect = ({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) => (
    <div>
        <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</label>
        <select
            value={FONT_OPTIONS.find(f => f.family === value)?.name || FONT_OPTIONS[0].name}
            onChange={(e) => {
                const font = FONT_OPTIONS.find(f => f.name === e.target.value);
                if (font) onChange(font.family);
            }}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-[var(--accent)] outline-none"
        >
            {FONT_OPTIONS.map(f => (
                <option key={f.name} value={f.name}>{f.name}</option>
            ))}
        </select>
    </div>
);

const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) => (
    <div className="flex items-center justify-between">
        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
        <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full border border-zinc-700 overflow-hidden relative">
                <input
                    type="color"
                    value={value || '#ffffff'}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute -top-2 -left-2 w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
                />
            </div>
            <span className="text-[9px] text-zinc-500 font-mono">{value}</span>
        </div>
    </div>
);

const ScaleSlider = ({ label, value, onChange, min = 0.5, max = 3.0, step = 0.05, suffix = "x" }: { label: string; value: number; onChange: (val: number) => void; min?: number; max?: number; step?: number; suffix?: string; }) => (
    <div>
        <div className="flex justify-between items-center mb-0.5">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
            <span className="text-[9px] text-[var(--accent)] font-mono">{value.toFixed(2)}{suffix}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full accent-[var(--accent)] cursor-pointer h-1 bg-zinc-800 rounded-lg appearance-none"
        />
    </div>
);

type HeadingLevel = 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6' | 'Body';

export const GlobalTypographyPanel: React.FC<GlobalTypographyPanelProps> = ({ brandData, onUpdate }) => {
    const [activeLevel, setActiveLevel] = useState<HeadingLevel>('H1');

    const levels: HeadingLevel[] = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Body'];

    const getFontKey = (level: HeadingLevel) => {
        if (level === 'Body') return 'bodyFont';
        return `${level.toLowerCase()}Font`;
    };

    const getColorKey = (level: HeadingLevel) => {
        if (level === 'Body') return 'bodyColor';
        return `${level.toLowerCase()}Color`;
    };

    const getSizeKey = (level: HeadingLevel) => {
        const base = level === 'Body' ? 'bodySize' : `${level.toLowerCase()}Size`;
        return brandData.isMobilePreview ? `${base}Mobile` : `${base}Desktop`;
    };

    // Use typical default rem sizes if not defined
    const getDefaultSize = (level: HeadingLevel) => {
        if (brandData.isMobilePreview) {
            if (level === 'H1') return 4;
            if (level === 'H2') return 3;
            if (level === 'H3') return 2;
            if (level === 'H4') return 1.5;
            if (level === 'H5') return 1.25;
            if (level === 'H6') return 1;
            return 1;
        } else {
            if (level === 'H1') return 6;
            if (level === 'H2') return 4.5;
            if (level === 'H3') return 3;
            if (level === 'H4') return 2;
            if (level === 'H5') return 1.5;
            if (level === 'H6') return 1.25;
            return 1.125;
        }
    };

    const currentFont = brandData[getFontKey(activeLevel)] || brandData.headingFont;
    const currentColor = brandData[getColorKey(activeLevel)] || '#eae8e8';
    const currentSize = brandData[getSizeKey(activeLevel)] || getDefaultSize(activeLevel);

    return (
        <div className="space-y-3">
            {/* Level Tabs */}
            <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                {levels.map(level => (
                    <button
                        key={level}
                        onClick={() => setActiveLevel(level)}
                        className={`flex-1 py-1 text-[8px] font-bold uppercase tracking-widest rounded-md transition-all ${activeLevel === level
                            ? 'bg-zinc-800 text-[var(--accent)] shadow-sm'
                            : 'text-zinc-600 hover:text-zinc-400'
                            }`}
                    >
                        {level}
                    </button>
                ))}
            </div>

            {/* Font + Color for Active Level */}
            <FontSelect
                label={`${activeLevel} Font`}
                value={currentFont}
                onChange={(val) => onUpdate({ [getFontKey(activeLevel)]: val })}
            />
            <ColorPicker
                label={`${activeLevel} Color`}
                value={currentColor}
                onChange={(val) => onUpdate({ [getColorKey(activeLevel)]: val })}
            />
            <ScaleSlider
                label={`${activeLevel} Size (${brandData.isMobilePreview ? 'Mobile' : 'Desktop'})`}
                value={currentSize}
                onChange={(val) => onUpdate({ [getSizeKey(activeLevel)]: val })}
                suffix="rem"
                min={0.5}
                max={15}
                step={0.1}
            />
        </div>
    );
};
