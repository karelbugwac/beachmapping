import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-brand-teal-100 text-brand-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Coast Not Found</h2>
        <p className="text-sm text-slate-600 mb-6">
          The beach or page you are looking for has drifted away or does not exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-teal-600 text-white font-medium rounded-md hover:bg-brand-teal-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
