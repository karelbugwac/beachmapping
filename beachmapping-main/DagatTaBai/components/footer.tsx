'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Mail, MapPin, Clock } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();

  if (
    pathname === '/map' ||
    pathname?.startsWith('/map') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/owner') ||
    pathname?.startsWith('/staff') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'
  ) {
    return null;
  }

  return (
    <footer className="bg-white dark:bg-black border-t border-slate-200/80 dark:border-neutral-900 transition-colors duration-200 pt-12 pb-8 text-slate-800 dark:text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* ── Main Footer Grid (5 Balanced Columns) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

          {/* Col 1 (4 cols): Brand Info */}
          <div className="lg:col-span-4 space-y-3.5 max-w-sm">
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
              <span className="font-sans font-extrabold text-xl tracking-tight text-[#1F3F74] dark:text-[#4987BA]">
                Dagat Ta Bai
              </span>
            </Link>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                See beyond pictures
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Real beaches. Real coastlines. No filters, no pretending. Dagat Ta Bai keeps Binongkalan, Catmon authentic, transparent, and worth discovering.
              </p>
            </div>
          </div>

          {/* Col 2 (2 cols): Explore */}
          <div className="lg:col-span-2 space-y-3">
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
                  Weather &amp; Tides
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Feedback
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 (2 cols): Beach Owners */}
          <div className="lg:col-span-2 space-y-3">
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
                <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 (4 cols): Get in Touch (Relocated from Contact Page) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white font-heading">
              Get in Touch
            </h4>
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2.5">
                <Mail className="w-3.5 h-3.5 text-[#1F3F74] dark:text-[#4987BA] flex-shrink-0 mt-0.5" />
                <a
                  href="mailto:support@dagattabai.ph"
                  className="hover:text-[#1F3F74] dark:hover:text-sky-300 font-medium transition-colors"
                >
                  support@dagattabai.ph
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-[#1F3F74] dark:text-[#4987BA] flex-shrink-0 mt-0.5" />
                <span>Barangay Binongkalan, Catmon, Cebu 6006</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-3.5 h-3.5 text-[#1F3F74] dark:text-[#4987BA] flex-shrink-0 mt-0.5" />
                <span>Monday – Friday: 8:00 AM – 5:00 PM (PST)</span>
              </div>
              <div className="pt-1.5 flex items-center gap-3">
                <Link
                  href="/contact"
                  className="font-bold text-[#1F3F74] dark:text-[#4987BA] hover:underline"
                >
                  Contact Form
                </Link>
                <span>•</span>
                <Link
                  href="/faq"
                  className="font-bold text-[#1F3F74] dark:text-[#4987BA] hover:underline"
                >
                  FAQs
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* ── Bottom Copyright Bar ── */}
        <div className="pt-6 border-t border-slate-200/80 dark:border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 Dagat Ta Bai. All rights reserved.</p>
          <p>Coastal Discovery Platform for Barangay Binongkalan, Catmon, Cebu.</p>
        </div>

      </div>
    </footer>
  );
}