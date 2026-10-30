'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, ChevronDown, HelpCircle, Mail, MapPin, MessageSquare, Phone } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1F3F74] dark:text-[#4987BA] text-xs font-bold tracking-wide uppercase shadow-2xs">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Get in Touch</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1F3F74] dark:text-white tracking-tight leading-tight">
          Contact &amp; Community Support
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Have questions, suggestions, or need to report inaccurate beach info? Reach out to the Dagat Ta Bai local team.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-10">
        
        {/* ── 2-Column Contact Info + Form Grid ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (4 cols): Quick Contacts */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Email Tile */}
            <div className="bg-white dark:bg-[#121215] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 flex items-center justify-center shadow-2xs">
                <Mail className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Email Inquiries</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">support@dagattabai.ph</p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Send us an email anytime for technical assistance or business partnerships.
              </p>
            </div>

            {/* Location Tile */}
            <div className="bg-white dark:bg-[#121215] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 flex items-center justify-center shadow-2xs">
                <MapPin className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Location Focus</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Barangay Binongkalan</p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Catmon, Northern Cebu, 6006 Philippines
              </p>
            </div>

            {/* Trust Tile in Dive Blue */}
            <div className="bg-[#1F3F74] dark:bg-[#14284b] text-white p-6 rounded-3xl shadow-md space-y-2">
              <h4 className="font-bold text-sm text-white">Authentic Community Care</h4>
              <p className="text-xs text-blue-100/90 leading-relaxed">
                We take pride in keeping local Catmon beach information truthful and transparent for all travelers.
              </p>
            </div>

          </div>

          {/* Right Column (8 cols): Contact Form */}
          <div className="lg:col-span-8 bg-white dark:bg-[#121215] p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  Message Received!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Thank you for getting in touch. Our local team will respond to your message promptly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#1F3F74] hover:bg-[#285091] text-white text-xs font-bold transition-all shadow-xs"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Send Feedback or Report an Issue
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Let us know if you found a fee change, road update, or have general feedback.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/20 focus:border-[#1F3F74] text-slate-900 dark:text-white transition-all"
                      placeholder="e.g. Maria Santos"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/20 focus:border-[#1F3F74] text-slate-900 dark:text-white transition-all"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/20 focus:border-[#1F3F74] text-slate-900 dark:text-white transition-all"
                    placeholder="e.g. Inaccurate cottage fee, general feedback"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Message Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/20 focus:border-[#1F3F74] text-slate-900 dark:text-white transition-all"
                    placeholder="Describe your suggestion, update, or question..."
                  />
                </div>

                {/* Submit button in Dive Blue (#1F3F74) */}
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#1F3F74] hover:bg-[#285091] text-white font-bold text-xs sm:text-sm shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <Send className="w-4 h-4 stroke-[2]" />
                  <span>Submit Feedback</span>
                </button>
              </form>
            )}
          </div>

        </div>

        {/* ── FAQ Accordion Section ─────────────────────────── */}
        <div className="bg-white dark:bg-[#121215] rounded-3xl border border-slate-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-neutral-800 pb-4">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#1F3F74] dark:text-white">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Everything you need to know about our beach mapping platform.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-neutral-800">
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
                    <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white group-hover:text-[#1F3F74] dark:group-hover:text-sky-300 transition-colors">
                      {faq.q}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-300 transition-all duration-200 ${
                        isOpen ? 'rotate-180 bg-[#1F3F74] text-white dark:bg-[#1F3F74]' : ''
                      }`}
                    >
                      <ChevronDown className="w-4 h-4 stroke-[2]" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-0.5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
