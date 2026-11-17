'use client';

import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { CoastalIllustration } from '@/components/ui/coastal-empty-state';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm">
        <CoastalIllustration variant="error" className="w-52 h-36 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Something Went Wrong</h1>
        <p className="text-sm text-slate-600 dark:text-neutral-400 mb-6">
          An unexpected error occurred while rendering this page.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 active:bg-brand-800"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}
