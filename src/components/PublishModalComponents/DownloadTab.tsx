
import React from 'react';

interface DownloadTabProps {
  onDownload: () => void;
}

export const DownloadTab: React.FC<DownloadTabProps> = ({ onDownload }) => {
  return (
    <div className="space-y-8">
      <p className="text-zinc-400 text-sm leading-relaxed">Download all pages as standard HTML files. Upload these to your website's root directory via FTP or File Manager.</p>
      <button onClick={onDownload} className="w-full bg-accent hover:bg-accent-dark text-white py-4 rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg">Download ZIP Bundle</button>
    </div>
  );
};
