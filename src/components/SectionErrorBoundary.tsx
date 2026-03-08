import React from 'react';

interface Props {
  children: React.ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary for individual control panel sections.
 * Catches render errors so a broken control doesn't crash the whole editor.
 */
export class SectionErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[SectionErrorBoundary] "${this.props.sectionName}" crashed:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-3 rounded-md bg-red-950/30 border border-red-900/50 text-xs text-red-400 mt-2">
          <p className="font-bold uppercase tracking-wider mb-1">⚠ Panel Error</p>
          <p className="text-red-500/70 font-mono text-[10px] break-all">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-2 text-[10px] uppercase font-bold text-red-400 hover:text-red-300 underline"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
