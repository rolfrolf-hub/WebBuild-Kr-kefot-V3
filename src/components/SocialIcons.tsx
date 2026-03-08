
import React from 'react';
import { BrandState } from '../types';

export const SocialIcons: React.FC<{ brandData: BrandState }> = ({ brandData }) => {
  const iconClass = "text-zinc-400 hover:text-[var(--accent)] transition-all hover:scale-110 hover:-translate-y-1 duration-500 cursor-pointer";
  return (
    <div className="flex flex-nowrap justify-center gap-3 md:gap-8 items-center social-icons-container">
      {brandData.socials.youtubeUrl && (
        <a href={brandData.socials.youtubeUrl} target="_blank" rel="noreferrer" className={iconClass} aria-label="YouTube">
          <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z" /></svg>
        </a>
      )}
      {brandData.socials.soundcloudUrl && (
        <a href={brandData.socials.soundcloudUrl} target="_blank" rel="noreferrer" className={iconClass} aria-label="SoundCloud">
          <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 1 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.39 12.01a3.01 3.01 0 0 0 0 6h1.22" /><path d="M12.91 18.01h6.63a3.46 3.46 0 0 0 0-6.92 3.39 3.39 0 0 0-2.5 1.1" /><path d="M8.22 18.01h2.46" /><path d="M8.22 11.51v6.5" /><path d="M10.68 10.51v7.5" /><path d="M5.61 12.01v6" /><path d="M12.91 8.01v10" /><path d="M15.37 11.01v7" /><path d="M3.1 14.01v2" /></svg>
        </a>
      )}
      {brandData.socials.appleUrl && (
        <a href={brandData.socials.appleUrl} target="_blank" rel="noreferrer" className={iconClass} aria-label="Apple Music">
          <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
        </a>
      )}
      {brandData.socials.spotifyUrl && (
        <a href={brandData.socials.spotifyUrl} target="_blank" rel="noreferrer" className={iconClass} aria-label="Spotify">
          <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14.5c2.5-1 5.5-1 8 0" /><path d="M7 11.5c3.5-1.5 7-1.5 10.5 0" /><path d="M6.5 8.5c3.5-2 7.5-2 11 0" /></svg>
        </a>
      )}
      {brandData.socials.instagramUrl && (
        <a href={brandData.socials.instagramUrl} target="_blank" rel="noreferrer" className={iconClass} aria-label="Instagram">
          <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
        </a>
      )}
      {brandData.socials.xUrl && (
        <a href={brandData.socials.xUrl} target="_blank" rel="noreferrer" className={iconClass} aria-label="X (Twitter)">
          <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16H20L8.267 4z" /><path d="M4 20l6.768-6.768m2.46-2.46L20 4" /></svg>
        </a>
      )}
      {brandData.socials.facebookUrl && (
        <a href={brandData.socials.facebookUrl} target="_blank" rel="noreferrer" className={iconClass} aria-label="Facebook">
          <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
        </a>
      )}
    </div>
  );
};
