import React, { useState } from 'react';

interface CollapsibleSectionProps {
    title: string;
    sectionId: string;
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    /** Optional action buttons rendered in the header (e.g. PresetButton) */
    actions?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    sectionId,
    isActive,
    onClick,
    children,
    defaultExpanded = false,
    actions,
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
        onClick();
    };

    return (
        <div className={`border rounded-lg transition-all ${isActive
            ? 'border-emerald-500 bg-emerald-950/20'
            : 'border-zinc-800 bg-zinc-900'
        }`}>
            {/* Header — div instead of button so we can place real buttons inside */}
            <div className={`flex items-center justify-between hover:bg-zinc-800/50 transition-colors ${isExpanded ? 'rounded-t-lg' : 'rounded-lg'}`}>

                {/* Left: expand/collapse toggle — takes up all remaining space */}
                <button
                    onClick={handleToggle}
                    className="flex items-center gap-3 flex-1 text-left px-4 py-3 min-w-0"
                >
                    {isActive && (
                        <div className="shrink-0 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    )}
                    <svg
                        className={`shrink-0 w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className={`font-medium text-sm truncate ${isActive ? 'text-emerald-400' : 'text-zinc-300'}`}>
                        {title}
                    </span>
                </button>

                {/* Right: optional actions + section ID badge */}
                <div className="flex items-center gap-1 pr-3 shrink-0">
                    {actions}
                    <span className="text-[10px] text-zinc-600 font-mono">
                        {sectionId}
                    </span>
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="px-4 py-4 border-t border-zinc-800">
                    {children}
                </div>
            )}
        </div>
    );
};
