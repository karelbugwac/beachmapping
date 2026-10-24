'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, ChevronDown, HelpCircle, Mail } from 'lucide-react';
import {
  ShorelineMarker,
  CoastalCompass,
  CoastalTides,
} from '@/components/ui/coastal-icons';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      q: 'How are beach coordinates verified?',
      a: 'All coastal coordinates are anchored to verified GPS waypoints along Barangay Binongkalan, Catmon, ensuring pinpoint geolocation accuracy directly on our interactive map.',
    },
    {
      q: 'Are the cottage and entrance fees up to date?',
      a: 'Yes, rates and cottage fees are coordinated directly with verified local caretakers and resort operators so you experience zero surprises upon arrival.',
    },
    {
      q: 'How does the route calculation work?',
      a: 'The route tool calculates the geodesic distance from your current GPS location to the specific beach entry point in Binongkalan, Catmon, giving you straightforward route navigation.',
    },
    {
      q: 'Can I request updates for a beach listing?',
      a: 'Absolutely. Use the inquiry form on this page with the subject "Beach Update" or "Inquiry" and our local team will verify and refresh the information.',
    },
    {
      q: 'Is Dagat Ta Bai free to use for beachgoers?',
      a: 'Yes! Dagat Ta Bai is completely free for visitors seeking authentic local beach discoveries without paywalls or booking markups.',
    },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12 text-ocean-900 dark:text-sand-100">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ocean-950 dark:text-sand-50 tracking-tight font-sans">
          Contact & Community Support
        </h1>
        <p className="text-sm text-sand-700 dark:text-sand-300 max-w-md mx-auto leading-relaxed">
          Have questions, suggestions, or need to report inaccurate beach info? Reach out to the Dagat Ta Bai local team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Column */}
        <div className="space-y-4">
          <div className="bg-sand-100/80 dark:bg-ocean-900/60 p-5 rounded-2xl border border-sand-300/80 dark:border-ocean-800 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-sand-200 dark:bg-ocean-800 text-ocean-800 dark:text-sand-200 flex items-center justify-center">
              <Mail size={16} />
            </div>
            <h3 className="font-bold text-sm text-ocean-950 dark:text-sand-50 font-sans">Email Inquiries</h3>
            <p className="text-xs text-sand-700 dark:text-sand-400">support@dagattabai.ph</p>
          </div>

          <div className="bg-sand-100/80 dark:bg-ocean-900/60 p-5 rounded-2xl border border-sand-300/80 dark:border-ocean-800 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-sand-200 dark:bg-ocean-800 text-ocean-800 dark:text-sand-200 flex items-center justify-center">
              <ShorelineMarker size={16} strokeWidth={2} />
            </div>
            <h3 className="font-bold text-sm text-ocean-950 dark:text-sand-50 font-sans">Location Focus</h3>
            <p className="text-xs text-sand-700 dark:text-sand-400">
              Barangay Binongkalan, Catmon, Northern Cebu, Philippines
            </p>
          </div>

          <div className="bg-sand-50 dark:bg-ocean-950 p-5 rounded-2xl border border-sand-300 dark:border-ocean-800 text-xs text-sand-700 dark:text-sand-300 space-y-1.5">
            <div className="font-bold text-ocean-950 dark:text-sand-50 font-sans">Authentic Community Care</div>
            <p className="leading-relaxed">
              We take pride in keeping local Catmon beach information truthful and transparent for all travelers.
            </p>
          </div>
        </div>

        {/* Contact / Feedback Form */}
        <div className="lg:col-span-2 bg-sand-100/80 dark:bg-ocean-900/60 p-6 sm:p-8 rounded-2xl border border-sand-300/80 dark:border-ocean-800 shadow-xs">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-ocean-950 dark:text-sand-50 font-heading">
                Message Received!
              </h3>
              <p className="text-xs sm:text-sm text-sand-700 dark:text-sand-300 max-w-sm mx-auto">
                Thank you for getting in touch. Our local team will respond to your message promptly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-xs font-semibold text-ocean-700 dark:text-ocean-300 hover:underline pt-2 block mx-auto"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-ocean-950 dark:text-sand-50 font-sans">
                  Send Feedback or Report an Issue
                </h2>
                <p className="text-xs text-sand-600 dark:text-sand-400 mt-0.5">
                  Let us know if you found a fee change, road update, or have a question.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-sand-800 dark:text-sand-200 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-sand-300 dark:border-ocean-700 rounded-xl bg-sand-50 dark:bg-ocean-950 text-ocean-900 dark:text-sand-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                    placeholder="e.g. Maria Santos"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-sand-800 dark:text-sand-200 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-sand-300 dark:border-ocean-700 rounded-xl bg-sand-50 dark:bg-ocean-950 text-ocean-900 dark:text-sand-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-sand-800 dark:text-sand-200 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-sand-300 dark:border-ocean-700 rounded-xl bg-sand-50 dark:bg-ocean-950 text-ocean-900 dark:text-sand-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                  placeholder="e.g. Inaccurate cottage fee, general feedback"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sand-800 dark:text-sand-200 mb-1">
                  Message Details
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-sand-300 dark:border-ocean-700 rounded-xl bg-sand-50 dark:bg-ocean-950 text-ocean-900 dark:text-sand-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                  placeholder="Describe your suggestion, update, or question..."
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-ocean-800 hover:bg-ocean-900 dark:bg-ocean-700 dark:hover:bg-ocean-600 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
              >
                <Send size={14} />
                <span>Submit Feedback</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Accordion / Dropdown Style FAQs */}
      <div className="bg-sand-100/80 dark:bg-ocean-900/60 rounded-2xl border border-sand-300/80 dark:border-ocean-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-sand-200 dark:border-ocean-800 pb-4">
          <HelpCircle size={18} className="text-ocean-700 dark:text-ocean-400" />
          <h2 className="text-lg sm:text-xl font-bold text-ocean-950 dark:text-sand-50 font-sans">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="divide-y divide-sand-200 dark:divide-ocean-800">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={index} className="py-4 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between text-left gap-4 group focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-sm sm:text-base text-ocean-950 dark:text-sand-50 group-hover:text-ocean-700 dark:group-hover:text-ocean-300 transition-colors">
                    {faq.q}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full bg-sand-200 dark:bg-ocean-800 flex items-center justify-center flex-shrink-0 text-ocean-800 dark:text-sand-200 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-ocean-700 text-white dark:bg-ocean-700' : ''
                    }`}
                  >
                    <ChevronDown size={15} />
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-3 text-xs sm:text-sm text-sand-700 dark:text-sand-300 leading-relaxed pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
