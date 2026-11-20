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
      {/* Full-Width Bottom Cookie Banner: Light Mode White, Dark Mode Navy Blue */}
      <aside
        aria-label="Cookie and Privacy Consent"
        className={`fixed bottom-0 inset-x-0 w-full z-[9999] pointer-events-auto transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
          showBanner && !isExiting ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="w-full bg-white dark:bg-[#1F3F74] text-slate-900 dark:text-white border-t border-slate-200 dark:border-[#2d5aa3] shadow-[0_-12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_-12px_40px_rgba(0,0,0,0.5)]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-5 sm:py-7 lg:py-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-8">
            
            {/* Left: Justified Legal & Transparency Text */}
            <div className="flex-1 text-xs sm:text-[13px] text-slate-700 dark:text-white leading-relaxed max-w-4xl space-y-1.5">
              <p className="text-justify [text-align-last:left]">
                This site uses essential cookies to keep you signed in and remember your theme mode, plus anonymous page telemetry to count daily beach visits for Catmon resort operators. In compliance with the Philippine Data Privacy Act (RA 10173), we do not sell your personal data or track you across third-party websites. To manage what is stored, click on &ldquo;Cookies Settings&rdquo;. By clicking &ldquo;Accept All Cookies&rdquo;, you agree to our{' '}
                <Link
                  href="/privacy"
                  className="text-[#1F3F74] dark:text-[#F4BF3E] underline font-bold hover:opacity-80 transition-opacity"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            {/* Right: Actions Row with Text-only Settings & Decline, and Oblong Yellow Accept Button */}
            <div className="w-full lg:w-auto flex items-center justify-between sm:justify-end gap-5 sm:gap-7 shrink-0 pt-2 lg:pt-0">
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white font-semibold underline underline-offset-4 transition-colors text-xs cursor-pointer"
              >
                Cookies Settings
              </button>

              <button
                type="button"
                onClick={() => dismissWithAction('declined')}
                className="text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white font-semibold underline underline-offset-4 transition-colors text-xs cursor-pointer"
              >
                Decline
              </button>

              {/* Oblong (pill-shaped) Yellow Accept All Cookies Button with Dark Blue Text */}
              <button
                type="button"
                onClick={() => dismissWithAction('accepted')}
                className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-[#F4BF3E] hover:bg-[#e2af35] active:scale-95 text-[#1F3F74] font-black text-xs sm:text-sm tracking-tight transition-all duration-200 shadow-md text-center cursor-pointer shrink-0"
              >
                Accept All Cookies
              </button>
            </div>

          </div>
        </div>
      </aside>

      {/* Cookies Settings Modal: Sharp Corners (No Rounded Corners), White in Light, Blue in Dark */}
      {showSettingsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-[#132A4A] border border-slate-300 dark:border-[#204578] rounded-none max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 text-slate-900 dark:text-white">
            <h3 className="text-lg font-extrabold text-[#1F3F74] dark:text-white tracking-tight">
              Cookie &amp; Privacy Preferences
            </h3>
            
            <p className="text-xs text-slate-600 dark:text-slate-200 leading-relaxed text-justify">
              Dagat Ta Bai operates under Republic Act No. 10173 (Philippine Data Privacy Act). We only store what is strictly necessary to run this platform and measure aggregate beach interest:
            </p>

            <div className="space-y-3 pt-2 text-xs">
              {/* Essential Storage: Blue outline, no beige container */}
              <div className="p-4 bg-transparent border border-[#1F3F74]/25 dark:border-sky-400/30 rounded-none flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-bold text-sm block text-[#1F3F74] dark:text-white">
                    Login &amp; Site Settings
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed block">
                    Keeps you signed in securely and saves your chosen dark or light theme. Required for the website to function.
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                  Always on
                </span>
              </div>

              {/* Beach & Page Visit Counts: Blue outline, no beige container */}
              <div className="p-4 bg-transparent border border-[#1F3F74]/25 dark:border-sky-400/30 rounded-none flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-bold text-sm block text-[#1F3F74] dark:text-white">
                    Beach &amp; Page Visit Counts
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed block">
                    Counts total visits to beaches and pages so Catmon resort owners know which destinations are popular. No personal identity is saved, and we never track you across other websites.
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 shrink-0">
                  Optional
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => dismissWithAction('essential_only')}
                className="px-4 py-2.5 text-xs font-semibold rounded-none border border-[#1F3F74]/40 dark:border-white/40 text-[#1F3F74] dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Save Essential Only
              </button>
              <button
                type="button"
                onClick={() => dismissWithAction('accepted')}
                className="px-6 py-2.5 text-xs font-black rounded-none bg-[#F4BF3E] hover:bg-[#e2af35] text-[#1F3F74] transition-colors shadow-xs cursor-pointer"
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
