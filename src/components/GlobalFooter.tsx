import React from 'react';
import { BrandState } from '../types';
import { SocialIcons } from './SocialIcons';
import { SonarShowcase } from './SonarShowcase';

interface GlobalFooterProps {
    brandData: BrandState;
}

export const GlobalFooter: React.FC<GlobalFooterProps> = ({ brandData }) => {
    return (
        <footer className="w-full bg-black py-16 flex flex-col items-center justify-center gap-8 border-t border-zinc-900/50">
            <SocialIcons brandData={brandData} />

            <SonarShowcase />

            <div className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-zinc-600 uppercase font-sans">
                Er det no' liv her..
            </div>
        </footer>
    );
};
