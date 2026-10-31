'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  ChevronDown,
  Search,
  Compass,
  ShieldCheck,
  Waves,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

interface FaqItem {
  q: string;
  a: string;
  category: 'General' | 'Visitors' | 'Owners' | 'Tides';
}

const FAQS_DATA: FaqItem[] = [
  {
    category: 'Visitors',
    q: 'How are beach GPS coordinates verified on the map?',
    a: 'Every coastal destination on Dagat Ta Bai is physically anchored to permanent GPS waypoints recorded along the shoreline of Barangay Binongkalan, Catmon. This ensures pinpoint accuracy whether navigating by car, motorcycle, or walking along public beach entryways.',
  },
  {
    category: 'Visitors',
    q: 'Are cottage rates and entrance fees up to date?',
    a: 'Yes. Rates, day-use hours, and cottage rental fees are coordinated directly with verified local caretakers and resort operators so you encounter zero surprise fees upon arrival.',
  },
  {
    category: 'Tides',
    q: 'How accurate is the astronomical tide status and weather forecast?',
    a: 'Our tide telemetry uses an anchored astronomical harmonic model calibrated specifically to Catmon coastal coordinates (10.68° N, 124.01° E), while marine weather data is synchronized directly with meteorological APIs to provide real-time wave heights, wind speed, and sea advisories.',
  },
  {
    category: 'Owners',
    q: 'How can beach owners register their resorts on Dagat Ta Bai?',
    a: 'Beach owners and caretakers can apply via our Registration Portal (/apply). After submitting your personal details, establishment info, municipal business permit, and completing the live KYC selfie verification, our team reviews the submission within 1 to 3 business days.',
  },
  {
    category: 'Owners',
    q: 'What permits are required for resort partner verification?',
    a: 'We require a valid Mayor’s or Municipal Business Permit issued by LGU Catmon (or provincial clearance) and Proof of Ownership or a valid Notarized Lease Contract. This safeguards both tourists and legitimate local entrepreneurs.',
  },
  {
    category: 'Owners',
    q: 'How does the live selfie KYC verification work?',
    a: 'During Step 4 of the application, owners take a live camera photo holding their official business permit and proof of ownership. This instant biometric check prevents fraudulent listings and ensures verified ownership.',
  },
  {
    category: 'General',
    q: 'Is Dagat Ta Bai free to use for beachgoers?',
    a: 'Yes, 100% free! Dagat Ta Bai is dedicated to open, honest public beach mapping without paywalls, hidden platform fees, or booking markups.',
  },
  {
    category: 'General',
    q: 'How can I report inaccurate rates, closed roads, or changed beach rules?',
    a: 'You can submit feedback immediately via our Contact Page (/contact) under "Report Inaccurate Info." Our local research team will verify the information on the ground and update the listing promptly.',
  },
  {
    category: 'Visitors',
    q: 'Can I book cottages or pay entrance fees online through the website?',
    a: 'Dagat Ta Bai operates as an honest discovery and navigational guide rather than a commercial middleman. We display verified contact numbers and rates so you can communicate directly with the local resort caretakers.',
  },
];

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const categories = ['All', 'Visitors', 'Owners', 'Tides', 'General'];

  const filteredFaqs = FAQS_DATA.filter((faq) => {
    const matchesCategory =
      selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch =
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-sans transition-colors duration-200">
      
      {/* ── Page Header (Matching Homepage Typography Scale) ──────── */}
      <section className="pt-12 sm:pt-16 pb-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-3">
        <ScrollReveal direction="up" duration={650}>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-[#1F3F74] dark:text-[#4987BA] leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed mt-2">
            Clear answers to common questions about shoreline coordinates, astronomical tides, cottage rates, and owner verification in Catmon.
          </p>
        </ScrollReveal>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8 flex-1 w-full">
        
        {/* ── Search & Filter Bar ──────────────────────────────────── */}
        <div className="space-y-4">
          
          {/* Oblong Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions or keywords (e.g. tides, permits, rates)..."
              className="w-full pl-11 pr-5 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-full text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 focus:outline-none focus:border-[#1F3F74] dark:focus:border-[#4987BA] transition-all"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1F3F74] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-neutral-800'
                  }`}
                >
                  {cat === 'All'
                    ? 'All Questions'
                    : cat === 'Visitors'
                    ? 'Beachgoers'
                    : cat === 'Owners'
                    ? 'Resort Owners'
                    : cat === 'Tides'
                    ? 'Tides & Weather'
                    : 'General'}
                </button>
              );
            })}
          </div>

        </div>

        {/* ── FAQ Accordion List (Frameless, Clean Divided Rows) ─────── */}
        <div className="divide-y divide-slate-200 dark:divide-neutral-800 pt-2">
          {filteredFaqs.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No matching questions found
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Try searching with different terms or select &quot;All Questions&quot;.
              </p>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="py-4 sm:py-5 first:pt-0">
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between text-left gap-4 group focus:outline-none cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-[#1F3F74] dark:group-hover:text-[#4987BA] transition-colors leading-relaxed">
                      {faq.q}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full bg-slate-100 dark:bg-neutral-900 flex items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-300 transition-all duration-200 ${
                        isOpen ? 'rotate-180 bg-[#1F3F74] text-white dark:bg-[#1F3F74]' : ''
                      }`}
                    >
                      <ChevronDown className="w-4 h-4 stroke-[2]" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-0.5 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Bottom Help Direct Link ──────────────────────────────── */}
        <div className="pt-8 border-t border-slate-200 dark:border-neutral-800 text-center space-y-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Still Have Questions?
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Can&apos;t find what you&apos;re looking for? Get in touch with our team directly.
          </p>
          <div className="pt-1">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#1F3F74] hover:bg-[#285091] text-white font-bold text-xs sm:text-sm shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              Contact Support
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
