import React from 'react';
import { FileText, Shield } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sky-600 mb-1">
          <FileText className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Legal Terms</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">Terms of Use</h1>
        <p className="text-xs text-slate-500 mt-1">Last Updated: August 2026</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the <strong>Dagat Ta Bai</strong> website and services, you agree to be bound by these Terms of Use and our Privacy Policy. If you disagree with any part of these terms, you must discontinue using our platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. User Accounts & Responsibilities</h2>
          <p>
            Users are responsible for maintaining the confidentiality of their credentials. Any activity originating from your account is your responsibility. Providing false information or engaging in abusive behavior (e.g. fraudulent reviews or harassment) will result in immediate suspension.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Beach Owner Submissions</h2>
          <p>
            Beach resort operators applying to register listings certify that they hold the legal authority, Mayor&apos;s permit, or land title/lease required to operate and represent the beach property. False documentation is prohibited and punishable by law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. User Reviews & Photo Ownership</h2>
          <p>
            By submitting reviews or uploading photos, you grant Dagat Ta Bai a non-exclusive license to display this content. Uploaded content must not infringe on intellectual property rights or contain explicit, defamatory, or harmful material.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Disclaimer on Weather & Tidal Data</h2>
          <p>
            Weather, heat index, and tidal forecasts provided on the platform are based on external scientific models (Open-Meteo, Stormglass, PAGASA formulas) and are intended for general travel planning. Always follow local Coast Guard (PCG) advisories and lifeguards during inclement sea conditions.
          </p>
        </section>
      </div>
    </div>
  );
}
