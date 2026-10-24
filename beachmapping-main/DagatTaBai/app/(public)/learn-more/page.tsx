import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Users,
  Building,
  Thermometer,
  Waves,
  Bot,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export default function LearnMorePage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          How Dagat Ta Bai Works
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          An in-depth guide to our features, user roles, tidal modeling, and grounded AI assistant.
        </p>
      </div>

      {/* 1. FOR TOURISTS VS OWNERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">For Tourists & Visitors</h2>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2">
            <li>• Explore verified beaches with entrance & cottage rates.</li>
            <li>• Real-time GPS distance calculation via Haversine formula.</li>
            <li>• Monitor live temperature and PAGASA danger heat indices.</li>
            <li>• Real-time tidal curve to catch peak high or low tides.</li>
            <li>• Submit verified reviews and upload beach photos.</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Building className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">For Beach Resort Owners</h2>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2">
            <li>• Apply with business permits and proof of ownership.</li>
            <li>• Automated account provisioning and secure 6-digit staff PIN.</li>
            <li>• Dedicated Beach Owner Dashboard to manage rates and hours.</li>
            <li>• Link external resort websites and official social media.</li>
            <li>• Direct moderation review oversight by platform admins.</li>
          </ul>
        </div>
      </div>

      {/* 2. SYSTEM INTELLIGENCE DETAILS */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
          System Intelligence & Safety Features
        </h2>

        <div className="space-y-4 text-xs sm:text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <Thermometer className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900">PAGASA Heat Index Integration</h3>
              <p className="text-slate-600 mt-0.5">
                The platform calculates the exact Rothfusz heat index from relative humidity and ambient temperature, alerting visitors when exposure levels enter Caution, Extreme Caution, Danger, or Extreme Danger.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Waves className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900">Cosine Harmonic Tide Interpolation</h3>
              <p className="text-slate-600 mt-0.5">
                Because oceanic tide APIs have strict query limits, tide extremes are cached daily. Real-time water height is computed continuously on the client using cosine harmonic interpolation between the closest high and low peaks.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Bot className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900">Grounded Gemini AI Assistant</h3>
              <p className="text-slate-600 mt-0.5">
                Our chatbot is grounded in our active database using Retrieval-Augmented Generation (RAG). It will never hallucinate outside beaches or inaccurate fees, answering only with verified Catmon data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Call to Action */}
      <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 text-center space-y-3">
        <h3 className="text-lg font-bold text-sky-900">Ready to register your beach?</h3>
        <p className="text-xs sm:text-sm text-sky-700 max-w-md mx-auto">
          Submit your resort details and official permits to join our verified Catmon coastal directory.
        </p>
        <div>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-md transition-colors"
          >
            <span>Apply as Beach Owner</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
