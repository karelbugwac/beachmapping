import React from 'react';

export const metadata = {
  title: 'Environmental Policy | Dagat Ta Bai',
  description:
    'Our commitment to coastal conservation, marine ecosystem protection, and visitor privacy in Barangay Binongkalan, Catmon, Cebu.',
};

export default function EnvironmentalPolicyPage() {
  return (
    <div className="min-h-screen bg-white font-display dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* ── Page Header ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6 text-center space-y-2">
        <h1 className="font-display text-xl sm:text-2xl font-semibold text-[#1F3F74] dark:text-brand-teal-300 tracking-tight leading-tight">
          Environmental Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Updated on November 22, 2026
        </p>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-8 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        
        {/* Section 1: Environmental Protection & Waste Management */}
        <section className="space-y-3">
          <h2 className="font-display text-base font-medium text-[#1F3F74] dark:text-brand-teal-300 sm:text-lg">
            1. Ecological Solid Waste Management (RA 9003)
          </h2>

          <p className="text-justify [text-align-last:left]">
            In strict compliance with Philippine Republic Act No. 9003 (Ecological Solid Waste Management Act of 2000) and Municipal Ordinances of Catmon, Cebu:
          </p>

          <ul className="space-y-2 list-disc pl-5 text-slate-500 dark:text-slate-400">
            <li className="text-justify">
              <strong className="text-slate-900 dark:text-white">Clean As You Go (CLAYGO):</strong> Every visitor and cottage renter is expected to clean up their eating and recreational areas before departure.
            </li>
            <li className="text-justify">
              <strong className="text-slate-900 dark:text-white">Shoreline Plastic Prevention:</strong> We actively discourage single-use plastic wrappers, straws, and disposable containers on the beach. Resort operators provide segregated receptacles for biodegradable, recyclable, and residual waste.
            </li>
            <li className="text-justify">
              <strong className="text-slate-900 dark:text-white">Zero Coastal Dumping:</strong> Disposal of garbage, bottles, cigarette butts, or food waste into the sea is strictly prohibited and subject to penalties.
            </li>
          </ul>
        </section>

        {/* Section 2: Marine Sanctuary & Coral Reef Etiquette */}
        <section className="space-y-3 border-t border-slate-200 dark:border-neutral-800 pt-6">
          <h2 className="font-display text-base font-medium text-[#1F3F74] dark:text-brand-teal-300 sm:text-lg">
            2. Marine Life &amp; Coral Sanctuary Preservation
          </h2>

          <p className="text-justify [text-align-last:left]">
            Binongkalan’s coastline is home to vibrant reef habitats, marine flora, and seasonal sea creatures:
          </p>

          <ul className="space-y-2 list-disc pl-5 text-slate-500 dark:text-slate-400">
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

        {/* Section 3: Report Inquiries */}
        <section className="space-y-3 border-t border-slate-200 dark:border-neutral-800 pt-6">
          <h2 className="font-display text-base font-medium text-[#1F3F74] dark:text-brand-teal-300 sm:text-lg">
            3. Report Inquiries
          </h2>

          <p className="text-justify [text-align-last:left]">
            If you see someone violating our environmental policies, feel free to report it to our team directly at:
          </p>

          <p>
            <a
              href="mailto:contact.dagattabai@gmail.com"
              className="font-semibold text-[#1F3F74] dark:text-brand-teal-300 hover:underline break-all"
            >
              contact.dagattabai@gmail.com
            </a>
          </p>
        </section>

      </div>
    </div>
  );
}
