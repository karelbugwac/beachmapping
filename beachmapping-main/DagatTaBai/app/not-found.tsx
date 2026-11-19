import Link from 'next/link';
import { Home } from 'lucide-react';
import { CoastalIllustration } from '@/components/ui/coastal-empty-state';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <CoastalIllustration variant="not-found" className="w-60 h-40 mx-auto mb-3" />
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Coast Not Found</h2>
        <p className="text-sm text-slate-600 dark:text-neutral-400 mb-6">
          The beach or page you are looking for has drifted away or does not exist.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 active:bg-brand-800"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
