
import React from 'react';

export type TabType = 'download' | 'setup' | 'deploy' | 'wordpress';

interface TabNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex border-b border-zinc-800 bg-zinc-950/50 px-8 gap-8 overflow-x-auto whitespace-nowrap">
      <button onClick={() => setActiveTab('download')} className={`py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'download' ? 'text-accent border-accent' : 'text-zinc-500 border-transparent'}`}>Download Bundle</button>
      <button onClick={() => setActiveTab('wordpress')} className={`py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'wordpress' ? 'text-accent border-accent' : 'text-zinc-500 border-transparent'}`}>WP Snippet</button>
      <button onClick={() => setActiveTab('deploy')} className={`py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'deploy' ? 'text-accent border-accent' : 'text-zinc-500 border-transparent'}`}>FTP Deploy</button>
    </div>
  );
};
