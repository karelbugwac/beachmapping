'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  HeartHandshake,
  Search,
  HandHeart,
  User,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  image?: string;
}

// 9 Team Members with complete roles
const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'Team Member 1',
    role: 'Project Lead',
    image: '',
  },
  {
    id: 2,
    name: 'Team Member 2',
    role: 'Lead UI/UX Designer',
    image: '',
  },
  {
    id: 3,
    name: 'Team Member 3',
    role: 'Full-Stack Developer',
    image: '',
  },
  {
    id: 4,
    name: 'Team Member 4',
    role: 'GIS & Mapping Specialist',
    image: '',
  },
  {
    id: 5,
    name: 'Team Member 5',
    role: 'Marine Data Engineer',
    image: '',
  },
  {
    id: 6,
    name: 'Team Member 6',
    role: 'Frontend Engineer',
    image: '',
  },
  {
    id: 7,
    name: 'Team Member 7',
    role: 'QA & Testing Specialist',
    image: '',
  },
  {
    id: 8,
    name: 'Team Member 8',
    role: 'Community & Field Researcher',
    image: '',
  },
  {
    id: 9,
    name: 'Team Member 9',
    role: 'Content & Media Strategist',
    image: '',
  },
];

export default function AboutPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  const total = teamMembers.length;
  const nextIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (nextIntervalRef.current) clearInterval(nextIntervalRef.current);
      if (prevIntervalRef.current) clearInterval(prevIntervalRef.current);
    };
  }, []);

  // Continuous hover forward stepping: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 1
  const handleMouseEnterRight = () => {
    setActiveIndex((prev) => (prev + 1) % total);
    if (nextIntervalRef.current) clearInterval(nextIntervalRef.current);
    nextIntervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 1100);
  };

  const handleMouseLeaveRight = () => {
    if (nextIntervalRef.current) {
      clearInterval(nextIntervalRef.current);
      nextIntervalRef.current = null;
    }
  };

  // Continuous hover backward stepping: 9 -> 8 -> 7 -> 6 -> 5 -> 4 -> 3 -> 2 -> 1
  const handleMouseEnterLeft = () => {
    setActiveIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
    if (prevIntervalRef.current) clearInterval(prevIntervalRef.current);
    prevIntervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
    }, 1100);
  };

  const handleMouseLeaveLeft = () => {
    if (prevIntervalRef.current) {
      clearInterval(prevIntervalRef.current);
      prevIntervalRef.current = null;
    }
  };

  // Card width constant (in pixels) for smooth horizontal track sliding
  const CARD_WIDTH = 240;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-sans transition-colors duration-200 overflow-x-hidden">
      
      {/* ── SECTION 1: WHAT SETS US APART (WHITE BACKGROUND - HOMEPAGE SECTION 2 STYLE, NO CARDS) ── */}
      <section className="w-full bg-white dark:bg-black border-b border-slate-100 dark:border-neutral-900 transition-colors duration-200 relative">
        <div className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          
          <ScrollReveal direction="up" duration={650}>
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-[#1F3F74] dark:text-[#4987BA] leading-tight">
                What Sets Us Apart
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Our commitment to honest, credible, and community-driven coastal discovery.
              </p>
            </div>
          </ScrollReveal>

          {/* 3 Columns divided by vertical borders with freestanding icons (Homepage Section 2 Structure) */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-neutral-800 text-center">
            
            {/* Pillar 1: Trust Over Trends (Icon: HeartHandshake) */}
            <ScrollReveal direction="up" delay={100} duration={600} className="px-6 sm:px-8 py-6 md:py-2 flex flex-col items-center space-y-3 group">
              <div className="h-10 flex items-center justify-center">
                <HeartHandshake className="w-9 h-9 text-[#1F3F74] dark:text-[#4987BA] stroke-[1.8] transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h2 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-900 dark:text-white font-heading">
                Trust Over Trends
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
                We put credibility before popularity. Destinations deserve recognition based on what they genuinely offer, not just how viral they become.
              </p>
            </ScrollReveal>

            {/* Pillar 2: More Than a Quick Search (Icon: Search) */}
            <ScrollReveal direction="up" delay={200} duration={600} className="px-6 sm:px-8 py-6 md:py-2 flex flex-col items-center space-y-3 group">
              <div className="h-10 flex items-center justify-center">
                <Search className="w-9 h-9 text-[#1F3F74] dark:text-[#4987BA] stroke-[1.8] transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h2 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-900 dark:text-white font-heading">
                More Than a Quick Search
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
                Travel decisions deserve more than scattered posts and random recommendations. We bring meaningful destination information together to help people make informed choices.
              </p>
            </ScrollReveal>

            {/* Pillar 3: Shared Growth, Shared Value (Icon: HandHeart - Matching Image 1) */}
            <ScrollReveal direction="up" delay={300} duration={600} className="px-6 sm:px-8 py-6 md:py-2 flex flex-col items-center space-y-3 group">
              <div className="h-10 flex items-center justify-center">
                <HandHeart className="w-9 h-9 text-[#1F3F74] dark:text-[#4987BA] stroke-[1.8] transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h2 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-900 dark:text-white font-heading">
                Shared Growth, Shared Value
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
                We believe tourism should benefit everyone, creating opportunities for local establishments while making coastal destinations more accessible to visitors.
              </p>
            </ScrollReveal>

          </div>

        </div>
      </section>

      {/* ── SECTION 2: OUR MISSION (DARK DIVE BLUE #1F3F74 - CLEAN, NO ICONS, NO PILLS) ── */}
      <section className="w-full bg-[#1F3F74] dark:bg-[#14284b] text-white transition-colors duration-200 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative z-20">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="up" duration={650} className="space-y-6 flex flex-col items-center">
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-white leading-tight">
              Our Mission
            </h2>

            <div
              className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-2xl mx-auto"
              style={{ textAlign: 'justify', textAlignLast: 'center' }}
            >
              <p>
                Dagat Ta Bai aims to help visitors make informed travel decisions while giving local resort caretakers and owners in Barangay Binongkalan, Catmon, Cebu greater opportunities to showcase their establishments.
              </p>
            </div>

          </ScrollReveal>
        </div>
      </section>

      {/* ── SECTION 3: OUR VISION (WHITE BACKGROUND - CLEAN, NO ICONS, NO PILLS) ───────── */}
      <section className="w-full bg-white dark:bg-black text-slate-900 dark:text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-100 dark:border-neutral-900 relative">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="up" duration={650} className="space-y-6 flex flex-col items-center">
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-[#1F3F74] dark:text-[#4987BA] leading-tight">
              Our Vision
            </h2>

            <div
              className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto"
              style={{ textAlign: 'justify', textAlignLast: 'center' }}
            >
              <p>
                To become a trusted digital platform that makes discovering Binongkalan, Catmon beaches easier for everyone. We envision Dagat Ta Bai becoming a go-to guide for travelers who want reliable information before their trips while helping local beach and resort owners reach more visitors.
              </p>
            </div>

          </ScrollReveal>
        </div>
      </section>

      {/* ── SECTION 4: MEET OUR TEAM (DARK DIVE BLUE #1F3F74 - TRUE HORIZONTAL SLIDING CAROUSEL) ── */}
      <section className="w-full bg-[#1F3F74] dark:bg-[#14284b] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          
          <ScrollReveal direction="up" duration={650}>
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-white leading-tight">
                Meet Our Team
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-blue-100/90">
                Hover to the right or left to smoothly slide through all team members.
              </p>
            </div>
          </ScrollReveal>

          {/* ── Physical Horizontal Slider Viewport with Side Hover Zones ── */}
          <div className="relative w-full max-w-4xl mx-auto overflow-hidden py-8">
            
            {/* Left Hover Zone: Cycles backward smoothly while cursor is over left side */}
            <div
              onMouseEnter={handleMouseEnterLeft}
              onMouseLeave={handleMouseLeaveLeft}
              onClick={() => setActiveIndex((prev) => (prev === 0 ? total - 1 : prev - 1))}
              className="absolute left-0 top-0 bottom-0 w-24 sm:w-36 z-30 cursor-pointer bg-gradient-to-r from-[#1F3F74] via-[#1F3F74]/60 to-transparent flex items-center justify-start pl-2 group"
              title="Hover to slide backward"
            >
              <span className="sr-only">Slide backward</span>
            </div>

            {/* Right Hover Zone: Cycles forward smoothly while cursor is over right side */}
            <div
              onMouseEnter={handleMouseEnterRight}
              onMouseLeave={handleMouseLeaveRight}
              onClick={() => setActiveIndex((prev) => (prev + 1) % total)}
              className="absolute right-0 top-0 bottom-0 w-24 sm:w-36 z-30 cursor-pointer bg-gradient-to-l from-[#1F3F74] via-[#1F3F74]/60 to-transparent flex items-center justify-end pr-2 group"
              title="Hover to slide forward"
            >
              <span className="sr-only">Slide forward</span>
            </div>

            {/* Moving Track: Physically shifts horizontally with cubic-bezier easing */}
            <div
              className="flex items-center transition-transform duration-700 ease-out"
              style={{
                transform: `translateX(calc(50% - ${activeIndex * CARD_WIDTH + CARD_WIDTH / 2}px))`,
              }}
            >
              {teamMembers.map((member, index) => {
                const isActive = index === activeIndex;

                return (
                  <div
                    key={member.id}
                    onClick={() => setActiveIndex(index)}
                    style={{ width: `${CARD_WIDTH}px` }}
                    className="flex-shrink-0 flex flex-col items-center justify-center text-center px-4 cursor-pointer select-none transition-all duration-500"
                  >
                    {/* Circular Avatar */}
                    <div
                      className={`rounded-full overflow-hidden flex items-center justify-center transition-all duration-500 ${
                        isActive
                          ? 'w-28 h-28 sm:w-36 sm:h-36 border-4 border-white shadow-2xl ring-4 ring-white/30 bg-white/20 backdrop-blur-md scale-105 opacity-100'
                          : 'w-20 h-20 sm:w-24 sm:h-24 border-2 border-white/50 bg-white/10 backdrop-blur-xs scale-85 opacity-45 hover:opacity-75'
                      }`}
                    >
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User
                          className={`stroke-[1.6] text-white ${
                            isActive ? 'w-14 h-14 sm:w-18 sm:h-18' : 'w-10 h-10 sm:w-12 sm:h-12 text-white/80'
                          }`}
                        />
                      )}
                    </div>

                    {/* Member Name and Position Directly Underneath */}
                    <div className="mt-3 sm:mt-4 space-y-0.5">
                      <span
                        className={`block font-bold tracking-wide transition-all duration-300 ${
                          isActive
                            ? 'text-base sm:text-lg text-white'
                            : 'text-xs sm:text-sm text-white/70'
                        }`}
                      >
                        {member.name}
                      </span>
                      <span
                        className={`block font-medium transition-all duration-300 ${
                          isActive
                            ? 'text-xs sm:text-sm text-sky-200'
                            : 'text-[10px] text-white/50'
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}