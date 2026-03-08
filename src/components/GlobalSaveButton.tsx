
import React, { useState } from 'react';
import { BrandState } from '../types';

interface GlobalSaveButtonProps {
  brandData: BrandState;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3015';

export const GlobalSaveButton: React.FC<GlobalSaveButtonProps> = ({ brandData }) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; details?: any[] } | null>(null);
  const [backupFilename, setBackupFilename] = useState<string>('');

  const handleSaveDefaults = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/update-defaults`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brandData }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update settings';
        let errorDetails: any = null;

        try {
          const errorData = await response.json();
          // If details exist (Zod issues), use that. Otherwise use error message.
          if (errorData.details && Array.isArray(errorData.details)) {
            errorDetails = errorData.details;
            errorMessage = "Validation failed for one or more fields.";
          } else {
            errorMessage = errorData.error || errorData.details || errorMessage;
          }
        } catch {
          errorMessage = `Server Error: ${response.status} ${response.statusText}`;
        }

        // Pass both message and details to state
        throw { message: errorMessage, details: errorDetails };
      }

      const result = await response.json();

      // CRITICAL: Clear local storage after successful manual save 
      // This prevents stale merged data from ghosting over the new file defaults on reload
      localStorage.removeItem('kraakefot-v1');

      setBackupFilename(result.backup);
      setShowModal(true);

      // Reload page after short delay to apply new defaults
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      console.error('Error saving defaults:', err);
      // Determine if it's our structured error or a generic Error object
      const errorObj = err.details ? err : { message: err.message || 'Failed to connect to API. Make sure the server is running.' };
      setError(errorObj);
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyJSON = () => {
    const jsonString = JSON.stringify(brandData, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      alert("JSON kopiert til utklippstavlen!");
    });
  };

  return (
    <>
      <button
        onClick={handleSaveDefaults}
        disabled={isLoading}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-[220px] sm:h-auto bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white font-bold py-4 rounded-full sm:rounded-xl shadow-[0_8px_30px_rgb(var(--accent-rgb)/0.4)] z-[9999] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 group animate-in slide-in-from-bottom-10 fade-in duration-500 ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
        aria-label="Lagre Alle Endringer"
      >
        <div className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors shrink-0">
          {isLoading ? (
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          )}
        </div>
        <span className="hidden sm:inline uppercase tracking-widest text-[11px] whitespace-nowrap">
          {isLoading ? 'Lagrer...' : 'Lagre Alle Endringer'}
        </span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-2xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            {error ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-500">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Feil ved lagring</h3>
                    <p className="text-sm text-zinc-400">Kunne ikke oppdatere innstillinger</p>
                  </div>
                </div>

                <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 mb-4 max-h-[200px] overflow-y-auto">
                  <p className="text-sm text-red-400 font-bold mb-2">{error.message}</p>
                  {error.details && (
                    <ul className="list-disc pl-5 text-xs text-red-300 space-y-1">
                      {error.details.map((issue: any, idx: number) => (
                        <li key={idx}>
                          <span className="font-mono bg-red-950/50 px-1 rounded">{issue.path.join('.')}</span>: {issue.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-4">
                  <p className="text-xs text-zinc-400 mb-2">Sørg for at API-serveren kjører:</p>
                  <code className="text-xs text-[var(--accent)] font-mono">npm run dev</code>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCopyJSON}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors"
                  >
                    Kopier JSON (Manuell)
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors"
                  >
                    Lukk
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-500">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Innstillinger Lagret!</h3>
                    <p className="text-sm text-zinc-400">App.tsx er oppdatert. Siden laster på nytt...</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                    <p className="text-sm text-zinc-300 mb-3">
                      ✅ Backup opprettet: <code className="text-[var(--accent)] font-mono text-xs">{backupFilename}</code>
                    </p>
                    <p className="text-sm text-zinc-300 mb-3">
                      ✅ INITIAL_DEFAULTS oppdatert i App.tsx
                    </p>
                    <p className="text-xs text-zinc-500">
                      Siden laster på nytt om 2 sekunder...
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
