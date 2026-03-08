import React from 'react';
import { BrandState } from '../types';
import { FadeIn } from './SectionBasics';

interface AboutTeamSectionProps {
    brandData: BrandState;
    onUpdate: (newData: Partial<BrandState>) => void;
}

export const AboutTeamSection: React.FC<AboutTeamSectionProps> = ({ brandData, onUpdate }) => {
    const team = brandData.team || [];

    return (
        <section className="bg-black py-24 md:py-32 border-b border-zinc-900 relative z-30">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="text-center mb-16">
                    <h3 className="text-[var(--accent)] text-sm font-bold uppercase tracking-[0.4em] mb-4">Team</h3>
                    <h2 className="text-3xl md:text-5xl font-serif text-white uppercase tracking-tight">Vokterne av ekkoet</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {team.map((member, i) => (
                        <FadeIn key={i} className="group/team text-center">
                            <div className="aspect-[3/4] overflow-hidden rounded-3xl mb-6 relative bg-zinc-900">
                                <img src={member.image} className="w-full h-full object-cover transition-all duration-700 group-hover/team:scale-110 grayscale group-hover/team:grayscale-0" alt={member.name} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            </div>
                            <h4 className="text-white font-bold text-2xl mb-1 uppercase tracking-wider">{member.name}</h4>
                            <p className="text-[var(--accent)] font-bold text-xs uppercase tracking-[0.2em]">{member.role}</p>
                        </FadeIn>
                    ))}
                    <div
                        className="flex items-center justify-center p-8 border-2 border-dashed border-zinc-800 rounded-3xl group/add cursor-pointer hover:border-[var(--accent)] transition-all"
                        onClick={() => {
                            const newTeam = [...team, { name: "Navn Navnesen", role: "Rolle", image: "https://kraakefot.com/media/Birdman%20profile%203.webp" }];
                            onUpdate({ team: newTeam });
                        }}
                    >
                        <div className="text-center">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4 text-zinc-600 group-hover/add:scale-110 transition-transform"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Legg til teammedlem</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
