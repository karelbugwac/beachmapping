import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Privacy Policy</h1>
        <p className="text-xs text-slate-500 mt-1">Effective: August 2026</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Personal Information Controller</h2>
          <p>
            The <strong>Dagat Ta Bai</strong> team serves as the Personal Information Controller (PIC) under the Republic Act No. 10173, otherwise known as the <strong>Data Privacy Act of 2012 (DPA)</strong> of the Philippines. We are committed to safeguarding personal data entrusted to us by tourists and beach operators.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Personal Data We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Tourist Accounts:</strong> Name, email address, password hash, and voluntarily uploaded review photos.</li>
            <li><strong>Beach Owner Applications (Sensitive Personal Information):</strong> Business/resort name, contact number, uploaded government-issued Mayor&apos;s permits, and land ownership documents.</li>
            <li><strong>Device & Geolocation:</strong> Browser GPS coordinates (processed locally on your device for distance calculation).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Purpose and Legal Basis for Processing</h2>
          <p>
            Data is collected to facilitate user authentication, provide accurate beach navigation, process beach listing applications, prevent fraud, and comply with safety regulations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Third-Party Disclosures & Security Discipline</h2>
          <p>
            We strictly limit sharing with external service providers:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Google OAuth:</strong> Facilitates secure user sign-in.</li>
            <li><strong>Open-Meteo & Stormglass APIs:</strong> Only receive beach GPS coordinates (no personal identity is shared).</li>
            <li><strong>Google Gemini API:</strong> Only queries beach database records for assistant responses (never user profiles).</li>
            <li><strong>Encrypted Private Storage:</strong> Sensitive permit documents are stored in private buckets accessible strictly to authorized administrators.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Your Rights as a Data Subject</h2>
          <p>
            Under RA 10173, you possess the right to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Right to be Informed</strong> about data processing activities.</li>
            <li><strong>Right to Access</strong> your personal information stored in our database.</li>
            <li><strong>Right to Rectification</strong> to correct inaccurate or outdated records.</li>
            <li><strong>Right to Erasure or Blocking</strong> (removal of your profile and data).</li>
            <li><strong>Right to Damages & Right to File a Complaint</strong> with the National Privacy Commission (NPC).</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
