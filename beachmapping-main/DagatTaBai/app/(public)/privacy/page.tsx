import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, UserCheck, Eye, Database, FileText } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1F3F74] dark:text-[#4987BA] text-xs font-bold tracking-wide uppercase shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Data Privacy Act Compliance (RA 10173)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1F3F74] dark:text-white tracking-tight leading-tight">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Effective: August 2026 · Barangay Binongkalan, Catmon, Cebu
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-8">
        
        <div className="bg-white dark:bg-[#121215] p-6 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-8 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          
          <section className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 text-xs flex items-center justify-center font-bold">1</span>
              <span>Personal Information Controller</span>
            </h2>
            <p>
              The <strong>Dagat Ta Bai</strong> team serves as the Personal Information Controller (PIC) under Republic Act No. 10173, otherwise known as the <strong>Data Privacy Act of 2012 (DPA)</strong> of the Philippines. We are committed to safeguarding personal data entrusted to us by tourists, visitors, and beach operators.
            </p>
          </section>

          <section className="space-y-2.5 border-t border-slate-100 dark:border-neutral-800 pt-6">
            <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 text-xs flex items-center justify-center font-bold">2</span>
              <span>Personal Data We Collect</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-100 dark:border-neutral-800/80 space-y-1">
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#1F3F74] dark:text-sky-300" />
                  <span>Tourist &amp; Visitor Accounts</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Full name, email address, password hash, and voluntary beach ratings and reviews.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-100 dark:border-neutral-800/80 space-y-1">
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#1F3F74] dark:text-sky-300" />
                  <span>Beach Owner Verification</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Business name, contact mobile, uploaded Mayor&apos;s permit, and legal proof of ownership.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              <strong>Device Geolocation:</strong> Browser GPS coordinates are processed strictly client-side on your device for distance and direction navigation.
            </p>
          </section>

          <section className="space-y-2.5 border-t border-slate-100 dark:border-neutral-800 pt-6">
            <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 text-xs flex items-center justify-center font-bold">3</span>
              <span>Purpose and Legal Basis for Processing</span>
            </h2>
            <p>
              Data is collected to facilitate user authentication, provide route calculations to Catmon shorelines, verify authentic beach listings, prevent fraudulent representations, and comply with local tourism and safety regulations.
            </p>
          </section>

          <section className="space-y-2.5 border-t border-slate-100 dark:border-neutral-800 pt-6">
            <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 text-xs flex items-center justify-center font-bold">4</span>
              <span>Third-Party Disclosures &amp; Security Measures</span>
            </h2>
            <ul className="space-y-2 list-disc pl-5 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
              <li><strong>Google OAuth:</strong> Facilitates secure single sign-on without storing plaintext passwords.</li>
              <li><strong>Open-Meteo &amp; Marine Services:</strong> Only receive beach GPS coordinates; no personal identities are transmitted.</li>
              <li><strong>Encrypted Private Storage:</strong> Sensitive verification documents (permits, titles) are stored in encrypted cloud buckets accessible strictly to authorized administrators via Row Level Security (RLS).</li>
            </ul>
          </section>

          <section className="space-y-2.5 border-t border-slate-100 dark:border-neutral-800 pt-6">
            <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 text-xs flex items-center justify-center font-bold">5</span>
              <span>Your Rights as a Data Subject</span>
            </h2>
            <p>Under RA 10173, you hold the following rights regarding your data:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {[
                { title: 'Right to be Informed', desc: 'Clear notice about data collection and uses.' },
                { title: 'Right to Access', desc: 'Request copies of your personal data on file.' },
                { title: 'Right to Rectification', desc: 'Correct inaccurate or incomplete profile records.' },
                { title: 'Right to Erasure', desc: 'Request removal or deletion of your account.' },
              ].map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-100 dark:border-neutral-800">
                  <div className="font-bold text-xs text-[#1F3F74] dark:text-sky-300">{r.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{r.desc}</div>
                </div>
              ))}
            </div>
          </section>

          <div className="pt-4 border-t border-slate-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <span className="text-slate-500">Need to exercise your data privacy rights?</span>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#1F3F74] hover:bg-[#285091] text-white font-bold transition-all shadow-xs"
            >
              Contact Data Protection Team
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
