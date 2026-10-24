'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'dtb_cookie_consent_v1';

export function CookieConsent() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/owner') || pathname?.startsWith('/staff')) {
    return null;
  }

  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) {
        // Show after a brief delay for smoother UX
        const timer = setTimeout(() => setShowBanner(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage access blocked
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    } catch {
      // Ignore
    }
    setShowBanner(false);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'essential_only');
    } catch {
      // Ignore
    }
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      <div className="bg-white/95 dark:bg-ocean-900/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-2xl border border-slate-200 dark:border-ocean-800 text-slate-800 dark:text-sand-100 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <h3 className="font-bold text-xs uppercase tracking-wider font-heading">
              Privacy &amp; Cookie Consent
            </h3>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss cookie notice"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Dagat Ta Bai uses strictly essential cookies and local storage to maintain your authentication session and preserve theme preferences in compliance with the Philippine Data Privacy Act (RA 10173). We do not use third-party advertising tracking cookies.
        </p>

        <div className="flex items-center justify-between gap-3 pt-1">
          <Link
            href="/privacy"
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
          >
            View Privacy Policy
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-ocean-700 text-xs font-medium text-slate-700 dark:text-sand-200 hover:bg-slate-100 dark:hover:bg-ocean-800 transition-colors"
            >
              Essential Only
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="px-4 py-1.5 rounded-xl bg-ocean-900 hover:bg-ocean-950 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-bold transition-colors shadow-xs"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
