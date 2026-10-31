import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* ── Page Header (Placed Higher Up, Frameless) ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-6 text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold text-[#1F3F74] dark:text-[#4987BA] tracking-tight leading-tight">
          Terms of Use
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Updated on November 3, 2026
        </p>
      </div>

      {/* ── Frameless Content (Justified Paragraph Descriptions) ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-7 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-1.5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            1. Acceptance of Terms
          </h2>
          <p style={{ textAlign: 'justify' }}>
            By accessing or using the Dagat Ta Bai website and services, you agree to follow these Terms of Use. If you do not agree with these terms, please stop using the platform.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-1.5 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            2. User Accounts and Responsibilities
          </h2>
          <p style={{ textAlign: 'justify' }}>
            Users are responsible for keeping their login credentials secure and for all activities under their accounts. Users must provide accurate information and must not engage in fraudulent reviews, spamming, harassment, or activities that may harm the platform or other users.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-1.5 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            3. Establishment Registration and Verification
          </h2>
          <p style={{ textAlign: 'justify' }}>
            Beach and resort owners must submit valid business permits and accurate establishment details when applying for registration. Dagat Ta Bai reserves the right to reject, suspend, or remove listings that contain false information or fail to meet verification requirements.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-1.5 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            4. Reviews and User-Submitted Content
          </h2>
          <p style={{ textAlign: 'justify' }}>
            Reviews, ratings, and photographs must be honest and based on actual experiences. Users must not post misleading, offensive, fraudulent, or copyrighted content without permission. By submitting content, users grant Dagat Ta Bai permission to display it on the platform.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-1.5 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            5. Accuracy of Establishment Listings
          </h2>
          <p style={{ textAlign: 'justify' }}>
            Dagat Ta Bai aims to provide accurate establishment information. However, resort owners are responsible for keeping their listings updated, including rates, amenities, operating hours, and available services. Visitors are encouraged to confirm important details directly with the establishment before visiting.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-1.5 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            6. Weather and Tidal Information Disclaimer
          </h2>
          <p style={{ textAlign: 'justify' }}>
            Weather updates and tidal forecasts are provided for general travel planning only. These forecasts do not guarantee safe swimming or boating conditions. Users must follow official weather advisories, local government warnings, and safety instructions from resort staff or lifeguards.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-1.5 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            7. Platform Availability and Changes
          </h2>
          <p style={{ textAlign: 'justify' }}>
            Dagat Ta Bai aims to keep its services accessible and working properly. However, temporary interruptions may occur due to maintenance, technical issues, or circumstances beyond our control. We reserve the right to update, modify, or discontinue any part of the platform when necessary.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-2 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            8. Prohibited Activities
          </h2>
          <p style={{ textAlign: 'justify' }}>Users must not:</p>
          <ul className="space-y-1 list-disc pl-5 text-slate-600 dark:text-slate-400">
            <li style={{ textAlign: 'justify' }}>Submit fake reviews or false establishment information.</li>
            <li style={{ textAlign: 'justify' }}>Upload harmful, misleading, or unauthorized content.</li>
            <li style={{ textAlign: 'justify' }}>Impersonate another person or business.</li>
            <li style={{ textAlign: 'justify' }}>Attempt to access restricted areas or interfere with platform security.</li>
            <li style={{ textAlign: 'justify' }}>Use the platform for scams, spam, or other unlawful activities.</li>
          </ul>
          <p className="pt-1 text-slate-600 dark:text-slate-400" style={{ textAlign: 'justify' }}>
            Violations may result in account suspension, listing removal, or termination of access.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-1.5 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            9. Limitation of Liability
          </h2>
          <p style={{ textAlign: 'justify' }}>
            Dagat Ta Bai is a platform for discovering coastal destinations and accessing travel information. We are not responsible for disputes between visitors and establishments, changes in resort services or prices, or incidents that occur during visits. Users are responsible for making informed decisions and observing proper safety precautions.
          </p>
        </section>

        {/* Section 10 */}
        <section className="space-y-1.5 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            10. Changes to These Terms
          </h2>
          <p style={{ textAlign: 'justify' }}>
            Dagat Ta Bai may update these Terms of Use when necessary. Any changes will be posted on this page. Continued use of the platform after changes are published means you accept the updated terms.
          </p>
        </section>

        {/* Section 11 */}
        <section className="space-y-1.5 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            11. Contact and Concerns
          </h2>
          <p style={{ textAlign: 'justify' }}>
            For questions, concerns, or reports regarding these Terms of Use, users may contact the Dagat Ta Bai team through our official contact channels.
          </p>
        </section>

      </div>
    </div>
  );
}