import React from 'react';
import Link from 'next/link';
import { Users, HeartHandshake, ShieldCheck, MessageCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export default function CommunityGuidelinesPage() {
  const guidelines = [
    {
      num: '1',
      title: 'Reviews Should Reflect Real Experiences',
      desc: 'Share truthful, specific observations from your actual beach visit. Do not post fabricated visits, promotional spam, personal attacks, or links unrelated to your beach experience.',
      icon: MessageCircle,
    },
    {
      num: '2',
      title: 'Keep Disagreements Respectful',
      desc: 'Critique a facility or amenity respectfully without personal harassment of staff or other tourists. Never publish private phone numbers, home addresses, or sensitive legal documents in a review.',
      icon: HeartHandshake,
    },
    {
      num: '3',
      title: 'Owners Cannot Edit Visitor Reviews',
      desc: 'Beach resort owners can read feedback of their destination but cannot alter or delete honest user reviews. If a review appears abusive, fraudulent, or unsafe, report it for impartial administrative review.',
      icon: ShieldCheck,
    },
    {
      num: '4',
      title: 'Safety, Ocean Care & Local Compliance',
      desc: 'Respect Catmon marine sanctuaries, properly dispose of coastal trash, and follow local municipal ordinances. Tides, marine weather, and road conditions can change rapidly—always heed local lifeguard flags.',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1F3F74] dark:text-[#4987BA] text-xs font-bold tracking-wide uppercase shadow-2xs">
          <Users className="w-3.5 h-3.5" />
          <span>Dagat Ta Bai Community Standards</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1F3F74] dark:text-white tracking-tight leading-tight">
          Community Guidelines
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Help keep beach information truthful, respectful, and trustworthy for visitors, locals, and resort caretakers in Binongkalan, Catmon.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-8">
        
        {/* Guidelines List Cards */}
        <div className="space-y-4">
          {guidelines.map((item, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#121215] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex items-start gap-4 transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-2xs">
                {item.num}
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{item.title}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Support Help Banner */}
        <div className="bg-[#1F3F74] dark:bg-[#14284b] text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-bold text-base text-white">Have a safety or community concern?</h3>
            <p className="text-xs text-blue-100/90">Our local administrative team is here to assist with disputes or inquiries.</p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-full bg-white hover:bg-slate-100 text-[#1F3F74] text-xs sm:text-sm font-bold shadow-xs transition-all flex-shrink-0"
          >
            <span>Contact Support</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
