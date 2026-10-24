import React from 'react';
import {
  CoastalCompass,
  CoastalTides,
  VerifiedSanctuary,
} from '@/components/ui/coastal-icons';

export default function AboutPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 text-ocean-900 dark:text-sand-100">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ocean-950 dark:text-sand-50 tracking-tight font-sans">
          About Dagat Ta Bai
        </h1>
        <p className="text-sm text-sand-700 dark:text-sand-300 max-w-xl mx-auto leading-relaxed">
          A dedicated local beach discovery platform presenting northern Cebu&apos;s coastlines with integrity, verified data, and direct map navigation.
        </p>
      </div>

      {/* Core Mission & Value Card */}
      <div className="bg-sand-100/80 dark:bg-ocean-900/60 p-6 sm:p-10 rounded-3xl border border-sand-300/80 dark:border-ocean-800 shadow-xs space-y-8 text-sm text-sand-800 dark:text-sand-200 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ocean-950 dark:text-sand-50 flex items-center gap-2 font-sans">
            <CoastalCompass size={19} className="text-ocean-700 dark:text-ocean-400" />
            <span>&ldquo;Find Beaches, Not Filters&rdquo;</span>
          </h2>
          <p>
            <strong>Dagat Ta Bai</strong> is designed to help everyday beach lovers, locals, and visitors discover the authentic shoreline of <strong>Barangay Binongkalan</strong> in the coastal municipality of Catmon, Cebu.
          </p>
          <p>
            Unlike generic travel portals that bury genuine local spots under aggressive sponsored rankings, 
            Dagat Ta Bai emphasizes honest representation. We provide direct access to verified entrance fees, 
            realistic cottage accommodations, genuine photographs, 360° virtual tours, and live oceanic tides.
          </p>
        </section>

        <section className="space-y-3 border-t border-sand-200 dark:border-ocean-800/80 pt-6">
          <h2 className="text-lg font-bold text-ocean-950 dark:text-sand-50 flex items-center gap-2 font-sans">
            <CoastalTides size={19} className="text-ocean-700 dark:text-ocean-400" />
            <span>Coastal Heritage of Binongkalan, Catmon</span>
          </h2>
          <p>
            Situated approximately 50 kilometers north of Cebu City, the coastal barangay of Binongkalan possesses some of northern Cebu&apos;s most peaceful beach waters. From calm family swimming sanctuaries to marine habitats where sea turtles feed, our platform accurately maps every entry point to ensure visitors navigate respectfully and safely.
          </p>
        </section>

        <section className="space-y-3 border-t border-sand-200 dark:border-ocean-800/80 pt-6">
          <h2 className="text-lg font-bold text-ocean-950 dark:text-sand-50 flex items-center gap-2 font-sans">
            <VerifiedSanctuary size={19} className="text-ocean-700 dark:text-ocean-400" />
            <span>Verified Local Representation</span>
          </h2>
          <p>
            Every beach listing on Dagat Ta Bai corresponds to a real, physically anchored shoreline destination with permanent GPS coordinates. Operators and caretakers manage their rates, schedules, and beach rules so travelers encounter zero surprises on arrival.
          </p>
        </section>
      </div>
    </div>
  );
}
