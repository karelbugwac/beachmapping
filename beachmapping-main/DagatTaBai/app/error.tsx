'use client';

import { useEffect } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Global Error:', error);
  }, [error]);

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-black flex items-center justify-center px-4">
      {/* Subtle animated gradient background */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#1F3F74]/5 via-[#16305a]/5 to-[#0c1a30]/5 animate-pulse" />
      </div>

      <div className="relative z-10 text-center max-w-sm w-full">
        {/* Alert icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400/20 blur-xl animate-pulse" />
            <AlertTriangle className="relative w-12 h-12 text-yellow-500 dark:text-yellow-400" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
          Something went wrong
        </h1>
        <p className="text-sm font-display text-slate-600 dark:text-slate-400 mb-4 leading-relaxed max-w-xs mx-auto">
          Our team is investigating.
        </p>

        <div className="flex justify-center mb-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-8 py-3 rounded-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 text-sm font-display font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="font-display">Try again</span>
          </button>
        </div>

        {error.digest && (
          <p className="text-[10px] font-display text-slate-400 dark:text-slate-600 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
