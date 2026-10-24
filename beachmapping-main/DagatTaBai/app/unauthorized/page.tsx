import Link from 'next/link';
import { ShieldAlert, Home, LogIn } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">403 — Access Restricted</h1>
        <p className="text-sm text-slate-600 mb-6">
          You do not have the required permissions to view this portal or dashboard. Please sign in with an authorized account.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 transition-colors text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
          <Link
            href="/owner/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white font-medium rounded-md hover:bg-sky-700 transition-colors text-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>Owner Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
