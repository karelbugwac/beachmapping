'use client';

import React, { useState } from 'react';
import {
  HeartHandshake,
  Search,
  HandHeart,
  User,
  ChevronLeft,
  ChevronRight,
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
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const total = teamMembers.length;
  const prevIndex = (activeIndex - 1 + total) % total;
  const nextIndex = (activeIndex + 1) % total;

  const currentMember = teamMembers[activeIndex];
  const prevMember = teamMembers[prevIndex];
  const nextMember = teamMembers[nextIndex];

  // Previous and Next Navigation
  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    // Swiped left -> advance forward
    if (diff > 40) {
      handleNext();
    }
    // Swiped right -> advance backward
    else if (diff < -40) {
      handlePrev();
    }
    setTouchStartX(null);
  };

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

            {/* Pillar 3: Shared Growth, Shared Value (Icon: HandHeart) */}
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

      {/* ── SECTION 4: MEET OUR TEAM (DARK DIVE BLUE #1F3F74 - 3 MEMBERS WITH '<' '>' BUTTONS) ── */}
      <section className="w-full bg-[#1F3F74] dark:bg-[#14284b] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-5xl mx-auto">
          
          <ScrollReveal direction="up" duration={650}>
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-white leading-tight">
                Meet Our Team
              </h2>
            </div>
          </ScrollReveal>

          {/* ── 3-Member Stage with Mobile Touch Swipe & Click Centering ── */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative max-w-2xl sm:max-w-3xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center justify-items-center py-4 select-none touch-pan-y"
          >

            {/* 1. LEFT SIDE PROFILE (Click to center) */}
            <div
              onClick={handlePrev}
              className="w-full flex flex-col items-center justify-center opacity-45 hover:opacity-90 scale-85 hover:scale-95 transition-all duration-300 cursor-pointer text-center group px-1 sm:px-2 max-w-[150px] sm:max-w-[180px]"
              title={prevMember.name}
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white/60 bg-white/10 backdrop-blur-xs flex items-center justify-center shadow-lg transition-transform group-hover:border-white flex-shrink-0">
                {prevMember.image ? (
                  <img src={prevMember.image} alt={prevMember.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 sm:w-12 sm:h-12 stroke-[1.6] text-white/80" />
                )}
              </div>
              <span className="mt-2.5 text-xs text-white/80 font-medium block truncate max-w-full">
                {prevMember.name}
              </span>
              <span className="text-[10px] text-white/60 block mt-0.5 line-clamp-1 max-w-full">
                {prevMember.role}
              </span>
            </div>

            {/* 2. CENTER ACTIVE PROFILE (Prominent, Glowing Ring, Centered, Name & Position Underneath) */}
            <div className="flex flex-col items-center scale-100 transition-all duration-300 text-center px-2 sm:px-6 flex-shrink-0">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-4 ring-white/30 bg-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-300 flex-shrink-0">
                {currentMember.image ? (
                  <img src={currentMember.image} alt={currentMember.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-14 h-14 sm:w-16 sm:h-16 stroke-[1.6] text-white" />
                )}
              </div>

              {/* Name & Position Directly Underneath */}
              <div className="text-center mt-3 sm:mt-4 space-y-1">
                <span className="block text-base sm:text-lg font-bold text-white tracking-wide">
                  {currentMember.name}
                </span>
                <span className="block text-xs sm:text-sm text-sky-200 font-medium">
                  {currentMember.role}
                </span>
              </div>
            </div>

            {/* 3. RIGHT SIDE PROFILE (Click to center) */}
            <div
              onClick={handleNext}
              className="w-full flex flex-col items-center justify-center opacity-45 hover:opacity-90 scale-85 hover:scale-95 transition-all duration-300 cursor-pointer text-center group px-1 sm:px-2 max-w-[150px] sm:max-w-[180px]"
              title={nextMember.name}
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white/60 bg-white/10 backdrop-blur-xs flex items-center justify-center shadow-lg transition-transform group-hover:border-white flex-shrink-0">
                {nextMember.image ? (
                  <img src={nextMember.image} alt={nextMember.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 sm:w-12 sm:h-12 stroke-[1.6] text-white/80" />
                )}
              </div>
              <span className="mt-2.5 text-xs text-white/80 font-medium block truncate max-w-full">
                {nextMember.name}
              </span>
              <span className="text-[10px] text-white/60 block mt-0.5 line-clamp-1 max-w-full">
                {nextMember.role}
              </span>
            </div>

          </div>

          {/* ── '<' and '>' Navigation Buttons ── */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <button
              type="button"
              onClick={handlePrev}
              className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center transition-all backdrop-blur-md shadow-md cursor-pointer border border-white/20"
              title="Previous Member"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center transition-all backdrop-blur-md shadow-md cursor-pointer border border-white/20"
              title="Next Member"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

        </div>
      </section>

    </div>
  );
}