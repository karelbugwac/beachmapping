'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled Global Error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-slate-600 mb-6">
          An unexpected error occurred while loading this page. Our lifeguards are looking into it.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 active:bg-brand-800"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try again</span>
        </button>
      </div>
    </div>
  );
}
