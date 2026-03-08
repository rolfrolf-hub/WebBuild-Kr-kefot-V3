
import React from 'react';

interface WordpressTabProps {
  onCopy: () => void;
  copySuccess: boolean;
  activePage: string;
}

export const WordpressTab: React.FC<WordpressTabProps> = ({ onCopy, copySuccess, activePage }) => {
  return (
    <div className="space-y-8">
      <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
        <h4 className="text-white font-bold mb-4 uppercase tracking-[0.2em] text-[10px]">WordPress Integration</h4>
        <ul className="text-xs text-zinc-400 space-y-4 list-decimal pl-4">
          <li>Open your WordPress page in the editor.</li>
          <li>Add a <strong>"Custom HTML"</strong> block.</li>
          <li>Paste the generated snippet into the block.</li>
          <li>Change the block alignment to <strong>"Full Width"</strong> (if your theme supports it) for the best experience.</li>
          <li>Publish or update the page to see the mystical Kråkefot experience.</li>
        </ul>
      </div>
      <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-lg flex gap-3 items-start">
        <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <p className="text-[10px] text-blue-300 leading-relaxed">
          The snippet includes its own scoped styles to ensure it looks exactly like the preview without breaking your existing WordPress theme.
        </p>
      </div>
      <button 
        onClick={onCopy} 
        className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-900 hover:bg-white'}`}
      >
        {copySuccess ? (
          <span className="flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            Snippet Copied!
          </span>
        ) : `Copy ${activePage} WordPress Snippet`}
      </button>
    </div>
  );
};
