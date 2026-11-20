'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const COOKIE_CONSENT_KEY = 'dtb_cookie_consent_v1';

export function CookieConsent() {
  const pathname = usePathname();
  const isDedicatedPortal =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/owner') ||
    pathname?.startsWith('/staff');

  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isDedicatedPortal) return;

    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) {
        // Smooth slide-up after page settles
        const timer = setTimeout(() => setShowBanner(true), 700);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage access blocked
    }
  }, [isDedicatedPortal]);

  if (!mounted || isDedicatedPortal || (!showBanner && !isExiting)) return null;

  const dismissWithAction = (action: 'accepted' | 'essential_only' | 'declined') => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, action);
    } catch {
      // Ignore
    }
    setIsExiting(true);
    setTimeout(() => {
      setShowBanner(false);
      setIsExiting(false);
      setShowSettingsModal(false);
    }, 600);
  };

  return (
    <>
      {/* Full-Width Bottom Cookie Banner with Tall Spacious Container & Silky Smooth Slide-Up */}
      <aside
        aria-label="Cookie and Privacy Consent"
        className={`fixed bottom-0 inset-x-0 w-full z-[9999] pointer-events-auto transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
          showBanner && !isExiting ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="w-full bg-[#0d223a]/98 dark:bg-[#071322]/98 text-white border-t border-sky-400/25 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-6 sm:py-8 lg:py-9 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-8">
            
            {/* Left: Comprehensive Legal Text with ample vertical rhythm */}
            <div className="flex-1 text-xs sm:text-[13px] text-slate-200 leading-relaxed max-w-4xl space-y-1.5">
              <p>
                This site uses cookies and other automated tools to understand and improve our site, provide personalized content and customized experiences, maintain your authentication session, and remember your theme preferences. In compliance with the Philippine Data Privacy Act (RA 10173), we do not sell your personal data or track you across third-party websites. To understand more about how we use cookies or to change your preferences, click on &ldquo;Cookies Settings&rdquo;. By clicking &ldquo;Accept All Cookies&rdquo;, you agree to the storing of cookies on your device consistent with our{' '}
                <Link
                  href="/privacy"
                  className="text-white underline font-semibold hover:text-amber-300 transition-colors"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            {/* Right: Actions Row (Cookies Settings, Decline, Accept All Cookies) */}
            <div className="flex items-center flex-wrap gap-4 sm:gap-7 shrink-0 text-xs sm:text-sm self-end lg:self-center pt-2 lg:pt-0">
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="text-slate-200 hover:text-white font-semibold underline underline-offset-4 hover:text-amber-300 transition-colors cursor-pointer"
              >
                Cookies Settings
              </button>

              <button
                type="button"
                onClick={() => dismissWithAction('declined')}
                className="text-slate-200 hover:text-white font-semibold underline underline-offset-4 hover:text-amber-300 transition-colors cursor-pointer"
              >
                Decline
              </button>

              {/* Bold Amber/Gold Accept Button */}
              <button
                type="button"
                onClick={() => dismissWithAction('accepted')}
                className="px-6 sm:px-8 py-3 rounded-md bg-[#F59E0B] hover:bg-[#D97706] active:scale-95 text-slate-950 font-black text-xs sm:text-sm tracking-tight transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 cursor-pointer"
              >
                Accept All Cookies
              </button>
            </div>

          </div>
        </div>
      </aside>

      {/* Cookies Settings Modal */}
      {showSettingsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white">
            <h3 className="text-base font-bold text-[#1F3F74] dark:text-[#4987BA]">
              Cookie &amp; Privacy Preferences
            </h3>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Dagat Ta Bai respects your privacy rights under Republic Act No. 10173 (Philippine Data Privacy Act). You can choose which cookies to allow:
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-xl flex items-start justify-between gap-3">
                <div>
                  <span className="font-bold block text-slate-900 dark:text-white">Strictly Necessary Cookies</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-tight block mt-0.5">
                    Required for secure login authentication, theme toggling, and interactive map routing. Cannot be disabled.
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full shrink-0">
                  Always Active
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-xl flex items-start justify-between gap-3">
                <div>
                  <span className="font-bold block text-slate-900 dark:text-white">Anonymous Telemetry</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-tight block mt-0.5">
                    Helps us aggregate page visit counts and popular beach searches without identifying individual visitors.
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-neutral-700 px-2 py-0.5 rounded-full shrink-0">
                  Optional
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => dismissWithAction('essential_only')}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Save Essential Only
              </button>
              <button
                type="button"
                onClick={() => dismissWithAction('accepted')}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 transition-colors shadow-xs"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
