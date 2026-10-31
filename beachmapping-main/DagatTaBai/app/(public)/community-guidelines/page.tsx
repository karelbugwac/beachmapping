import React from 'react';

export default function CommunityGuidelinesPage() {
  const guidelines = [
    {
      num: '1',
      title: 'Share Genuine Experiences',
      desc: 'Post honest reviews and ratings based on your actual visits. Avoid fake reviews, misleading information, promotional spam, or unrelated content.',
    },
    {
      num: '2',
      title: 'Respect Everyone',
      desc: "Be respectful when sharing feedback or responding to reviews. Avoid personal attacks, harassment, offensive language, and sharing another person's private information.",
    },
    {
      num: '3',
      title: 'Keep Reviews Honest and Fair',
      desc: 'Resort owners are welcome to respond to visitor feedback but must not pressure visitors to change or remove honest reviews. Reviews that are abusive, misleading, or violate our guidelines may be reported for administrative review.',
    },
    {
      num: '4',
      title: 'Protect Our Beaches and Environment',
      desc: 'Help keep our coastal destinations clean by disposing of waste properly and respecting marine sanctuaries and local environmental rules. Follow local safety instructions and pay attention to changing sea conditions during your visit.',
    },
    {
      num: '5',
      title: 'Be Honest When Representing an Establishment',
      desc: 'Beach and resort owners must keep their listings accurate and up to date. This includes establishment names, rates, amenities, operating hours, and contact details. Misleading information or false claims are not allowed.',
    },
    {
      num: '6',
      title: 'Report Problems Responsibly',
      desc: 'If you encounter fake listings, suspicious activities, inappropriate reviews, or other violations, report them to the Dagat Ta Bai team. Provide accurate information to help us review the concern fairly.',
    },
    {
      num: '7',
      title: 'Help Keep the Community Welcoming',
      desc: 'Treat every visitor, resort owner, and member with kindness and fairness. We encourage everyone to contribute to a positive community where people feel comfortable discovering and sharing coastal destinations.',
    },
    {
      num: '8',
      title: 'Violations and Administrative Action',
      desc: 'Dagat Ta Bai reserves the right to review reported content and take appropriate action when these guidelines are violated. Actions may include removing content, restricting account access, or suspending listings depending on the severity of the violation.',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* ── Page Header (Placed Higher Up, Frameless) ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-6 text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold text-[#1F3F74] dark:text-[#4987BA] tracking-tight leading-tight">
          Community Guidelines
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Last Updated: November 3, 2026
        </p>
      </div>

      {/* ── Frameless Content (Justified Descriptions) ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        
        <p className="text-slate-600 dark:text-slate-400 font-medium" style={{ textAlign: 'justify' }}>
          Dagat Ta Bai is built around a community of travelers and local beach and resort owners. These guidelines help keep our platform respectful, honest, and welcoming to everyone.
        </p>

        {guidelines.map((item) => (
          <section
            key={item.num}
            className="border-t border-slate-200 dark:border-neutral-800 pt-5 space-y-1.5"
          >
            <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
              {item.num}. {item.title}
            </h2>
            <p className="text-slate-600 dark:text-slate-400" style={{ textAlign: 'justify' }}>
              {item.desc}
            </p>
          </section>
        ))}

      </div>
    </div>
  );
}