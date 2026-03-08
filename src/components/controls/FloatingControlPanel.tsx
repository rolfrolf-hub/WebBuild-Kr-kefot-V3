import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface FloatingControlPanelProps {
    title: string;
    children: React.ReactNode;
    className?: string; // specific panel override
    isMobile?: boolean;
}

interface TabProps {
    label: string;
    children: React.ReactNode;
}

export const ControlTab: React.FC<TabProps> = ({ children }) => <>{children}</>;

export const FloatingControlPanel: React.FC<FloatingControlPanelProps> = ({ title, children, className, isMobile }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    // Filter children to find ControlTabs
    const tabs = React.Children.toArray(children).filter(
        child => React.isValidElement(child) && child.type === ControlTab
    ) as React.ReactElement<TabProps>[];

    if (tabs.length === 0) {
        // Fallback for empty panel if needed, but we mostly care about tabs
        return null;
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed top-6 right-6 w-14 h-14 flex items-center justify-center rounded-lg border border-zinc-700 bg-transparent hover:bg-black/90 hover:border-zinc-500 hover:text-white text-zinc-500 transition-all duration-300 z-[100] backdrop-blur-sm group ${className || ''}`}
                title={`Edit ${title}`}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="group-hover:rotate-90 transition-transform duration-500">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
            </button>
        );
    }

    const panelContent = (
        <div className={`fixed top-24 right-6 w-[320px] bg-black/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl shadow-2xl z-[99999] transition-all duration-300 flex flex-col ${className || ''}`}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 rounded-t-2xl select-none">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--accent)]"><circle cx="12" cy="12" r="10" /></svg>
                    {title}
                </h3>
                <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-500 hover:text-white transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-800">
                    {isOpen ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    )}
                </button>
            </div>

            {isOpen && (
                <>
                    <div className="flex border-b border-zinc-800 overflow-x-auto no-scrollbar">
                        {tabs.map((tab, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveTab(index)}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors relative ${activeTab === index
                                    ? 'text-white bg-zinc-900'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
                                    }`}
                            >
                                {tab.props.label}
                                {activeTab === index && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]"></div>}
                            </button>
                        ))}
                    </div>
                    <div className="p-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
                        {tabs[activeTab]}
                    </div>
                </>
            )}
        </div>
    );

    if (isMobile) {
        return createPortal(panelContent, document.body);
    }

    return panelContent;
};
