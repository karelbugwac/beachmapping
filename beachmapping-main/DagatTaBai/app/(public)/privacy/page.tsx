import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* ── Page Header (Placed Higher Up, Frameless) ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-6 text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold text-[#1F3F74] dark:text-[#4987BA] tracking-tight leading-tight">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Updated on November 3, 2026
        </p>
      </div>

      {/* ── Frameless Content (Justified Descriptions) ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-7 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-1.5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            1. Personal Information Controller
          </h2>
          <p style={{ textAlign: 'justify' }}>
            The Dagat Ta Bai team serves as the Personal Information Controller (PIC) under Republic Act No. 10173, otherwise known as the Data Privacy Act of 2012 (DPA) of the Philippines.
          </p>
          <p style={{ textAlign: 'justify' }}>
            We are committed to protecting the personal information entrusted to us by visitors, registered users, and beach and resort operators. This Privacy Policy explains what information we collect, how we use it, and how we protect it.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-2 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            2. Personal Information We Collect
          </h2>
          <p style={{ textAlign: 'justify' }}>
            We collect only the information needed to operate our platform and provide its services.
          </p>

          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white">A. Visitor and Account Information</h3>
              <ul className="space-y-1 list-disc pl-5 text-slate-600 dark:text-slate-400">
                <li style={{ textAlign: 'justify' }}>Full legal name</li>
                <li style={{ textAlign: 'justify' }}>Email address</li>
                <li style={{ textAlign: 'justify' }}>Password hashes for account security</li>
                <li style={{ textAlign: 'justify' }}>Optional beach ratings and reviews</li>
                <li style={{ textAlign: 'justify' }}>Account registration and activity information</li>
              </ul>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white">B. Beach and Resort Owner Information</h3>
              <ul className="space-y-1 list-disc pl-5 text-slate-600 dark:text-slate-400">
                <li style={{ textAlign: 'justify' }}>Registered business or corporation name</li>
                <li style={{ textAlign: 'justify' }}>Public beach or resort name</li>
                <li style={{ textAlign: 'justify' }}>Official contact number</li>
                <li style={{ textAlign: 'justify' }}>Municipal business permits</li>
                <li style={{ textAlign: 'justify' }}>Proof of ownership or lease documents</li>
                <li style={{ textAlign: 'justify' }}>Live selfie verification photos</li>
                <li style={{ textAlign: 'justify' }}>Other establishment details submitted during registration</li>
              </ul>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white">C. Device Location Information</h3>
              <p style={{ textAlign: 'justify' }}>
                When users enable location access, their browser may provide device coordinates to help calculate distances and directions to coastal destinations.
              </p>
              <p style={{ textAlign: 'justify' }}>
                Location coordinates are used for navigation purposes and are not stored in our platform&apos;s servers. If an external mapping, weather, or marine service receives coordinates to provide a requested feature, those coordinates may be processed by that service according to its own privacy policy.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-2 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            3. Purpose of Data Collection
          </h2>
          <p style={{ textAlign: 'justify' }}>We collect and process personal information for the following purposes:</p>
          <ul className="space-y-1 list-disc pl-5 text-slate-600 dark:text-slate-400">
            <li style={{ textAlign: 'justify' }}>To create and authenticate user accounts.</li>
            <li style={{ textAlign: 'justify' }}>To verify the identity and legitimacy of beach and resort operators.</li>
            <li style={{ textAlign: 'justify' }}>To review submitted business permits and establishment documents.</li>
            <li style={{ textAlign: 'justify' }}>To prevent fake listings and misleading establishment information.</li>
            <li style={{ textAlign: 'justify' }}>To display beach and resort information to visitors.</li>
            <li style={{ textAlign: 'justify' }}>To calculate distances and provide directions to destinations.</li>
            <li style={{ textAlign: 'justify' }}>To support weather updates and tidal information.</li>
            <li style={{ textAlign: 'justify' }}>To manage user reviews, ratings, and other submitted content.</li>
            <li style={{ textAlign: 'justify' }}>To maintain platform security and prevent fraudulent activities.</li>
            <li style={{ textAlign: 'justify' }}>To improve the overall services and functionality of Dagat Ta Bai.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-2 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            4. Legal Basis for Processing
          </h2>
          <p style={{ textAlign: 'justify' }}>
            Dagat Ta Bai processes personal information in accordance with the Data Privacy Act of 2012 and its Implementing Rules and Regulations.
          </p>
          <p style={{ textAlign: 'justify' }}>Depending on the type of information and purpose, processing may be based on:</p>
          <ul className="space-y-1.5 list-disc pl-5 text-slate-600 dark:text-slate-400">
            <li style={{ textAlign: 'justify' }}>
              <strong>Consent:</strong> When users voluntarily agree to the collection and use of their information.
            </li>
            <li style={{ textAlign: 'justify' }}>
              <strong>Contractual Necessity:</strong> When processing is necessary to provide requested platform services or fulfill registration requirements.
            </li>
            <li style={{ textAlign: 'justify' }}>
              <strong>Legitimate Interests:</strong> When processing is necessary for legitimate platform operations, fraud prevention, and security, provided that the rights of individuals are respected.
            </li>
            <li style={{ textAlign: 'justify' }}>
              <strong>Legal Obligations:</strong> When information must be processed to comply with applicable laws and regulations.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-2 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            5. Third-Party Services and Information Sharing
          </h2>
          <p style={{ textAlign: 'justify' }}>
            Dagat Ta Bai may use third-party services to support its operations and platform functionality.
          </p>
          <p style={{ textAlign: 'justify' }}>These may include:</p>

          <div className="space-y-2.5 pt-1">
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-900 dark:text-white">A. Authentication Providers</h3>
              <p style={{ textAlign: 'justify' }}>
                Third-party authentication services may be used to facilitate account registration and login. Passwords are not stored in plaintext by our platform.
              </p>
            </div>

            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-900 dark:text-white">B. Weather and Marine Information Services</h3>
              <p style={{ textAlign: 'justify' }}>
                External weather and marine service providers may receive geographic coordinates when needed to provide weather updates, tidal forecasts, and related information. Personal identities and account details are not intentionally shared for these requests.
              </p>
            </div>

            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-900 dark:text-white">C. Cloud Storage Providers</h3>
              <p style={{ textAlign: 'justify' }}>
                Establishment permits, verification documents, and other submitted files may be stored through private cloud storage services. Access is limited to authorized personnel who need the information for verification and platform administration.
              </p>
            </div>

            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-900 dark:text-white">D. Legal and Regulatory Authorities</h3>
              <p style={{ textAlign: 'justify' }}>
                Personal information may be disclosed when required by law, valid legal processes, or authorized government requests.
              </p>
            </div>
          </div>

          <p className="pt-1 font-semibold text-slate-800 dark:text-slate-200" style={{ textAlign: 'justify' }}>
            We do not sell personal information to third parties.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-1.5 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            6. Data Storage and Retention
          </h2>
          <p style={{ textAlign: 'justify' }}>
            Dagat Ta Bai keeps personal information only for as long as necessary to fulfill the purposes for which it was collected or as required by applicable laws.
          </p>
          <p style={{ textAlign: 'justify' }}>
            Account information is retained while an account remains active or as needed for legitimate operational purposes.
          </p>
          <p style={{ textAlign: 'justify' }}>
            Establishment verification documents are retained while necessary for verification, platform administration, and applicable legal requirements.
          </p>
          <p style={{ textAlign: 'justify' }}>
            Reviews and ratings may remain visible while they are published on the platform or as otherwise required for legitimate purposes.
          </p>
          <p style={{ textAlign: 'justify' }}>
            Information that is no longer necessary will be securely deleted, destroyed, or anonymized when appropriate.
          </p>
          <p style={{ textAlign: 'justify' }}>
            Users may request account deletion, subject to applicable legal requirements and legitimate retention obligations.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-2 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            7. Data Security and Protection
          </h2>
          <p style={{ textAlign: 'justify' }}>
            We take reasonable steps to protect personal information against unauthorized access, disclosure, alteration, loss, and misuse.
          </p>
          <p style={{ textAlign: 'justify' }}>Our security measures may include:</p>
          <ul className="space-y-1 list-disc pl-5 text-slate-600 dark:text-slate-400">
            <li style={{ textAlign: 'justify' }}>Secure authentication and password hashing.</li>
            <li style={{ textAlign: 'justify' }}>Restricted access to sensitive verification documents.</li>
            <li style={{ textAlign: 'justify' }}>Private cloud storage for submitted establishment files.</li>
            <li style={{ textAlign: 'justify' }}>Technical and administrative safeguards.</li>
            <li style={{ textAlign: 'justify' }}>Access controls for authorized administrators.</li>
            <li style={{ textAlign: 'justify' }}>Monitoring and appropriate action against potential security threats.</li>
          </ul>
          <p className="pt-1 text-slate-600 dark:text-slate-400" style={{ textAlign: 'justify' }}>
            While we take reasonable measures to protect your information, no online platform or electronic storage system can guarantee absolute security.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-2 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            8. Your Rights as a Data Subject
          </h2>
          <p style={{ textAlign: 'justify' }}>
            Under the Data Privacy Act of 2012, you have the right to exercise the following rights, subject to applicable legal conditions:
          </p>
          <div className="space-y-2 pt-1">
            <div>
              <strong className="text-slate-900 dark:text-white">A. Right to Be Informed: </strong>
              <span style={{ textAlign: 'justify' }}>You have the right to know what personal information is collected, why it is collected, and how it is processed.</span>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">B. Right to Access: </strong>
              <span style={{ textAlign: 'justify' }}>You may request access to your personal information held by Dagat Ta Bai.</span>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">C. Right to Rectification: </strong>
              <span style={{ textAlign: 'justify' }}>You may request corrections to inaccurate, incomplete, or outdated personal information.</span>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">D. Right to Erasure or Blocking: </strong>
              <span style={{ textAlign: 'justify' }}>You may request the removal or blocking of your personal information when the conditions under applicable law are met.</span>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">E. Right to Object: </strong>
              <span style={{ textAlign: 'justify' }}>You may object to the processing of your personal information when permitted under the Data Privacy Act.</span>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">F. Right to Data Portability: </strong>
              <span style={{ textAlign: 'justify' }}>You may request a copy of your personal information in a commonly used electronic format when the legal requirements for this right are met.</span>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">G. Right to File a Complaint: </strong>
              <span style={{ textAlign: 'justify' }}>You may file a complaint with the National Privacy Commission if you believe your personal information has been mishandled or your privacy rights have been violated.</span>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">H. Right to Damages: </strong>
              <span style={{ textAlign: 'justify' }}>You may seek compensation for damages sustained due to inaccurate, incomplete, outdated, false, unlawfully obtained, or unauthorized use of your personal information, subject to applicable law.</span>
            </div>
          </div>
        </section>

        {/* Section 9 */}
        <section className="space-y-1.5 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            9. Cookies and Website Technologies
          </h2>
          <p style={{ textAlign: 'justify' }}>
            Dagat Ta Bai may use cookies, browser storage, or similar technologies to support essential website functions, maintain user sessions, and improve platform performance.
          </p>
          <p style={{ textAlign: 'justify' }}>
            These technologies may help the website remember login sessions and maintain basic functionality.
          </p>
          <p style={{ textAlign: 'justify' }}>
            Users may manage or disable cookies through their browser settings. However, disabling certain cookies may affect some website features.
          </p>
        </section>

        {/* Section 10 */}
        <section className="space-y-1.5 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            10. Protection of Children&apos;s Information
          </h2>
          <p style={{ textAlign: 'justify' }}>
            Dagat Ta Bai does not knowingly collect personal information from children without appropriate parental or guardian involvement where required by law.
          </p>
          <p style={{ textAlign: 'justify' }}>
            If we become aware that personal information has been collected from a child inappropriately, we will take reasonable steps to address the situation in accordance with applicable laws.
          </p>
        </section>

        {/* Section 11 */}
        <section className="space-y-1.5 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            11. Data Breach and Security Incidents
          </h2>
          <p style={{ textAlign: 'justify' }}>
            In the event of a personal data breach that meets the notification requirements under applicable law, Dagat Ta Bai will take appropriate steps to investigate, contain, and address the incident.
          </p>
          <p style={{ textAlign: 'justify' }}>
            The National Privacy Commission and affected individuals will be notified when required by law and within the applicable notification period.
          </p>
        </section>

        {/* Section 12 */}
        <section className="space-y-1.5 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            12. Changes to This Privacy Policy
          </h2>
          <p style={{ textAlign: 'justify' }}>
            Dagat Ta Bai may update this Privacy Policy to reflect changes in our platform, services, or legal requirements.
          </p>
          <p style={{ textAlign: 'justify' }}>
            Any revisions will be posted on this page with an updated revision date. Users are encouraged to review this policy regularly to stay informed about how their personal information is handled.
          </p>
        </section>

        {/* Section 13 */}
        <section className="space-y-1.5 border-t border-slate-200 dark:border-neutral-800 pt-5">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            13. Contact Us
          </h2>
          <p style={{ textAlign: 'justify' }}>
            For questions, requests, or concerns regarding your personal information and privacy rights, you may contact the Dagat Ta Bai team through{' '}
            <a href="mailto:support.dagattabai@gmail.com" className="text-[#1F3F74] dark:text-[#4987BA] font-semibold underline">
              support.dagattabai@gmail.com
            </a>
            .
          </p>
          <p style={{ textAlign: 'justify' }}>
            You may also contact the National Privacy Commission through its official website at{' '}
            <a href="https://privacy.gov.ph/" target="_blank" rel="noopener noreferrer" className="text-[#1F3F74] dark:text-[#4987BA] font-semibold underline">
              https://privacy.gov.ph/
            </a>{' '}
            for information about your data privacy rights.
          </p>
        </section>

      </div>
    </div>
  );
}