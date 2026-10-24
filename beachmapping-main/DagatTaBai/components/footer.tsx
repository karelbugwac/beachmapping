'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  if (
    pathname === '/map' ||
    pathname?.startsWith('/map') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/owner') ||
    pathname?.startsWith('/staff')
  ) {
    return null;
  }

  return (
    <footer className="bg-[#fcfbf9] dark:bg-[#09090b] border-t border-slate-200/90 dark:border-neutral-800 transition-colors duration-200 pt-10 pb-8 text-slate-800 dark:text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 items-start">

          <div className="lg:col-span-5 space-y-3.5 max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
                <Image
                  src="/images/logo.png"
                  alt="Dagat Ta Bai"
                  width={34}
                  height={34}
                  className="object-contain w-full h-full"
                />
              </div>
              <span className="font-serif font-bold text-xl tracking-tight text-slate-950 dark:text-white">
                Dagat Ta Bai
              </span>
            </Link>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                Find beaches, not filters.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
                Real beaches. Real coastlines. No filters, no pretending. Dagat Ta Bai keeps Binongkalan, Catmon raw, real, and worth discovering.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white font-heading">
                Explore
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/weather" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    Weather
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white font-heading">
                Beach Owners
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  <Link href="/apply" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    Registration Portal
                  </Link>
                </li>
                <li>
                  <Link href="/owner-requirements" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    Listing Guidelines
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white font-heading">
                Community &amp; Legal
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link href="/community-guidelines" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    Community Guidelines
                  </Link>
                </li>
              </ul>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 Dagat Ta Bai. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
}
