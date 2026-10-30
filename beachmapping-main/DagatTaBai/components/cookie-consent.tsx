'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

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

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'essential_only');
    } catch {
      // Ignore
    }
    setShowBanner(false);
  };

  const handleDeclineAll = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    } catch {
      // Ignore
    }
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      {/* Straight 90-degree corners: rounded-none */}
      <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md p-4 sm:p-5 rounded-none shadow-2xl border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-100 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          {/* Armor / shield icon removed, Dive color applied */}
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#1F3F74] dark:text-[#4987BA] font-heading">
            Privacy &amp; Cookie Consent
          </h3>
          <button
            type="button"
            onClick={handleEssentialOnly}
            aria-label="Dismiss cookie notice"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Dagat Ta Bai uses strictly essential cookies and local storage to maintain your authentication session and preserve theme preferences in compliance with the Philippine Data Privacy Act (RA 10173). We do not use third-party advertising tracking cookies.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <Link
            href="/privacy"
            className="text-xs font-semibold text-[#1F3F74] dark:text-[#4987BA] hover:underline"
          >
            View Privacy Policy
          </Link>

          {/* Straight 90-degree corners for all buttons with uniform Dive palette */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDeclineAll}
              className="px-3 py-1.5 rounded-none border border-slate-300 dark:border-neutral-700 text-xs font-medium text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Decline All
            </button>
            <button
              type="button"
              onClick={handleEssentialOnly}
              className="px-3 py-1.5 rounded-none border border-[#1F3F74] text-[#1F3F74] dark:text-sky-300 dark:border-sky-400 hover:bg-[#1F3F74]/10 text-xs font-medium transition-colors"
            >
              Essential Only
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="px-4 py-1.5 rounded-none bg-[#1F3F74] hover:bg-[#285091] dark:bg-[#1F3F74] dark:hover:bg-[#285091] text-white text-xs font-bold transition-colors shadow-xs"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
