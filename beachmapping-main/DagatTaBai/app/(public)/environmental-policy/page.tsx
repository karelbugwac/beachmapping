import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Leaf, Waves, Trash2, HeartHandshake, Eye } from 'lucide-react';

export const metadata = {
  title: 'Environmental & Privacy Policy | Dagat Ta Bai',
  description:
    'Our commitment to coastal conservation, marine ecosystem protection, and visitor privacy in Barangay Binongkalan, Catmon, Cebu.',
};

export default function EnvironmentalPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* ── Page Header ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Coastal Stewardship &amp; Data Ethics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-[#1F3F74] dark:text-white tracking-tight leading-tight">
          Privacy &amp; Environmental Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Protecting the shores of Barangay Binongkalan, Catmon, Cebu while safeguarding your personal privacy.
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Last revised: November 2026 • In accordance with RA 9003 &amp; RA 10173
        </p>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-8 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        
        {/* Guiding Principles */}
        <section className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-3">
          <h2 className="text-sm sm:text-base font-bold text-[#1F3F74] dark:text-[#F4BF3E] flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-[#F4BF3E]" />
            Our Coastal Commitment
          </h2>
          <p className="text-justify [text-align-last:left]">
            Dagat Ta Bai was built to showcase the natural beauty of Barangay Binongkalan, Catmon. With that mission comes an equal responsibility: ensuring our coastal destinations remain clean, ecologically thriving, and respectful to both the local community and our visitors.
          </p>
        </section>

        {/* Section 1: Environmental Protection & Waste Management */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-white">
              1. Ecological Solid Waste Management (RA 9003)
            </h2>
          </div>

          <p className="text-justify [text-align-last:left]">
            In strict compliance with Philippine Republic Act No. 9003 (Ecological Solid Waste Management Act of 2000) and Municipal Ordinances of Catmon, Cebu:
          </p>

          <ul className="space-y-2 list-disc pl-5 text-slate-600 dark:text-slate-300">
            <li className="text-justify">
              <strong className="text-slate-900 dark:text-white">Clean As You Go (CLAYGO):</strong> Every visitor and cottage renter is expected to clean up their eating and recreational areas before departure.
            </li>
            <li className="text-justify">
              <strong className="text-slate-900 dark:text-white">Shoreline Plastic Prevention:</strong> We actively discourage single-use plastic wrappers, straws, and disposable containers on the beach. Resort operators provide segregated receptacles for biodegradable, recyclable, and residual waste.
            </li>
            <li className="text-justify">
              <strong className="text-slate-900 dark:text-white">Zero Coastal Dumping:</strong> Disposal of garbage, bottles, cigarette butts, or food waste into the sea or onto sand dunes is strictly prohibited and subject to barangay penalties.
            </li>
          </ul>
        </section>

        {/* Section 2: Marine Sanctuary & Coral Reef Etiquette */}
        <section className="space-y-3 border-t border-slate-200 dark:border-neutral-800 pt-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
              <Waves className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-white">
              2. Marine Life &amp; Coral Sanctuary Preservation
            </h2>
          </div>

          <p className="text-justify [text-align-last:left]">
            Binongkalan’s coastline is home to vibrant reef habitats, marine flora, and seasonal sea creatures:
          </p>

          <ul className="space-y-2 list-disc pl-5 text-slate-600 dark:text-slate-300">
            <li className="text-justify">
              <strong className="text-slate-900 dark:text-white">Look, Don&apos;t Touch:</strong> Swimmers and snorkelers must never stand, walk, or anchor boats on live coral colonies or seagrass beds.
            </li>
            <li className="text-justify">
              <strong className="text-slate-900 dark:text-white">Reef-Safe Sunscreen Recommended:</strong> We encourage sunscreen free from oxybenzone and octinoxate to prevent coral bleaching in shallow swimming coves.
            </li>
            <li className="text-justify">
              <strong className="text-slate-900 dark:text-white">Wildlife Protection:</strong> Harassing, capturing, or disturbing marine turtles, crabs, or coastal wildlife is forbidden under national wildlife protection laws.
            </li>
          </ul>
        </section>

        {/* Section 3: Digital Privacy & Responsible Imagery */}
        <section className="space-y-3 border-t border-slate-200 dark:border-neutral-800 pt-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#1F3F74] dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-white">
              3. Privacy Rights on the Shore &amp; Online (RA 10173)
            </h2>
          </div>

          <p className="text-justify [text-align-last:left]">
            In alignment with Republic Act No. 10173 (Philippine Data Privacy Act of 2012):
          </p>

          <ul className="space-y-2 list-disc pl-5 text-slate-600 dark:text-slate-300">
            <li className="text-justify">
              <strong className="text-slate-900 dark:text-white">Cottage &amp; Changing Privacy:</strong> Resort owners are prohibited from installing recording devices or cameras facing private cottage interiors, restrooms, or shower rooms.
            </li>
            <li className="text-justify">
              <strong className="text-slate-900 dark:text-white">360° Virtual Tour Privacy:</strong> Our official 360° panoramic captures focus solely on public scenery, landscape terrain, and general facilities. Any incidental personal faces or vehicle plates are blurred prior to publishing.
            </li>
            <li className="text-justify">
              <strong className="text-slate-900 dark:text-white">No Invasive Telemetry:</strong> Dagat Ta Bai only aggregates anonymous visit counts to support local beach operators. We never sell your data or track you across third-party networks.
            </li>
          </ul>
        </section>

        {/* Section 4: Community Inquiries & Reporting */}
        <section className="space-y-3 border-t border-slate-200 dark:border-neutral-800 pt-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-[#F4BF3E] flex items-center justify-center font-bold text-xs shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-white">
              4. Reporting &amp; Inquiries
            </h2>
          </div>

          <p className="text-justify [text-align-last:left]">
            If you witness environmental violations or have questions regarding data privacy in Barangay Binongkalan, you may reach out directly to our team or the local barangay council:
          </p>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-1 text-xs">
            <p className="font-semibold text-slate-900 dark:text-white">Dagat Ta Bai Environmental Support</p>
            <p>
              Email:{' '}
              <a
                href="mailto:support.dagattabai@gmail.com"
                className="text-[#1F3F74] dark:text-[#F4BF3E] font-bold hover:underline"
              >
                support.dagattabai@gmail.com
              </a>
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Barangay Binongkalan, Catmon, Cebu 6006, Philippines
            </p>
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#F4BF3E] hover:bg-[#e2af35] text-[#1F3F74] font-black text-xs transition-colors shadow-sm"
            >
              Back to Home
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
