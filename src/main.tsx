import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class RootErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false, message: ''};
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected rendering error occurred.';
    return {hasError: true, message};
  }

  componentDidCatch(error: unknown) {
    console.error('Automate AI root error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="liquid-ambient-canvas app-viewport-height w-full flex items-center justify-center p-6 text-slate-900 dark:text-slate-50">
          <div className="max-w-md w-full rounded-[28px] liquid-glass-elevated p-6 space-y-4 text-center">
            <h1 className="text-lg font-bold">Automate AI encountered an issue</h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-full liquid-glass-cta text-xs font-semibold cursor-pointer"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
