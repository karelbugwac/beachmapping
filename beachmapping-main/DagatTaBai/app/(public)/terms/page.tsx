import React from 'react';
import Link from 'next/link';
import { FileText, Shield, AlertCircle, Scale, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1F3F74] dark:text-[#4987BA] text-xs font-bold tracking-wide uppercase shadow-2xs">
          <Scale className="w-3.5 h-3.5" />
          <span>Legal Agreement &amp; Platform Rules</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1F3F74] dark:text-white tracking-tight leading-tight">
          Terms of Use
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Last Updated: August 2026 · Barangay Binongkalan, Catmon, Cebu
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-8">
        
        <div className="bg-white dark:bg-[#121215] p-6 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-8 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 text-xs flex items-center justify-center font-bold">1</span>
              <span>Acceptance of Terms</span>
            </h2>
            <p>
              By accessing or using the <strong>Dagat Ta Bai</strong> website, mobile views, and services, you agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree with any part of these terms, you must discontinue using our platform.
            </p>
          </section>

          <section className="space-y-2.5 border-t border-slate-100 dark:border-neutral-800 pt-6">
            <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 text-xs flex items-center justify-center font-bold">2</span>
              <span>User Accounts &amp; Conduct</span>
            </h2>
            <p>
              Users are responsible for maintaining the confidentiality of their credentials and actions originating from their account. Abusive behavior, fraudulent reviews, spamming, harassment of local operators, or attempting to compromise platform security will result in immediate termination of account access.
            </p>
          </section>

          <section className="space-y-2.5 border-t border-slate-100 dark:border-neutral-800 pt-6">
            <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 text-xs flex items-center justify-center font-bold">3</span>
              <span>Beach Owner Verification &amp; Listings</span>
            </h2>
            <p>
              Resort operators applying to list destinations certify under penalty of law that they hold the legal authority, Mayor&apos;s permit, or land title/lease required to operate the beach property. Submitting fraudulent documentation is prohibited and subject to legal prosecution under Philippine laws.
            </p>
          </section>

          <section className="space-y-2.5 border-t border-slate-100 dark:border-neutral-800 pt-6">
            <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 text-xs flex items-center justify-center font-bold">4</span>
              <span>User Content &amp; Review Ownership</span>
            </h2>
            <p>
              By posting reviews, feedback, or photographs, you grant Dagat Ta Bai a non-exclusive, royalty-free license to display this content on the platform. Content must reflect real visits and not infringe on intellectual property or privacy rights.
            </p>
          </section>

          <section className="space-y-2.5 border-t border-slate-100 dark:border-neutral-800 pt-6">
            <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 text-xs flex items-center justify-center font-bold">5</span>
              <span>Disclaimer on Weather &amp; Tidal Information</span>
            </h2>
            <p>
              Weather, wave swell, and tidal cycle telemetry on Dagat Ta Bai are provided for general trip-planning purposes. Always follow official Philippine Coast Guard (PCG) advisories, LGU notices, and on-site resort lifeguards during inclement sea conditions.
            </p>
          </section>

          <div className="pt-4 border-t border-slate-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <span className="text-slate-500">Have questions about these terms?</span>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#1F3F74] hover:bg-[#285091] text-white font-bold transition-all shadow-xs"
            >
              Contact Legal Support
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
