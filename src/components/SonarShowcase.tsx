import React from 'react';

export const SonarShowcase: React.FC = () => {
    return (
        <div className="flex flex-col items-center gap-12 py-12 border-y border-zinc-800 my-8 w-full bg-black/50 backdrop-blur-sm rounded-3xl">
            <div className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold mb-4 opacity-50">Animation Mockups</div>

            <div className="flex flex-col items-center gap-4">
                <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">1. The Deep Pulse</span>
                <div className="sonar-pulse-container">
                    <div className="text-[12px] md:text-sm font-bold font-sans tracking-[0.3em] text-zinc-400 uppercase">
                        Er det no' liv her..
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-4">
                <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">2. The Northern Sweep</span>
                <div className="aurora-sweep-text text-[12px] md:text-sm font-bold font-sans tracking-[0.3em] uppercase">
                    Er det no' liv her..
                </div>
            </div>

            <div className="flex flex-col items-center gap-4">
                <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">3. The Nordic Noir Ping</span>
                <div className="radar-ping-container">
                    <div className="radar-ping-text text-[12px] md:text-sm font-bold font-sans tracking-[0.3em] uppercase" data-text="Er det no' liv her..">
                        Er det no' liv her..
                    </div>
                </div>
            </div>
        </div>
    );
};
