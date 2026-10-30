'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  Waves,
  ShieldCheck,
  Users,
  Camera,
  MapPin,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  image?: string; // Path to image (e.g., '/team/member1.jpg' or external URL)
  bio?: string;
}

// 9 Team Members Array - Easy to update with real names, roles, and photos
const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'Team Member 1',
    role: 'Project Lead',
    image: '',
    bio: 'Oversees platform vision, local Catmon community partnerships, and project direction.',
  },
  {
    id: 2,
    name: 'Team Member 2',
    role: 'Lead UI/UX Designer',
    image: '',
    bio: 'Designs intuitive coastal interfaces, component systems, and responsive user flows.',
  },
  {
    id: 3,
    name: 'Team Member 3',
    role: 'Full-Stack Developer',
    image: '',
    bio: 'Builds core web features, authentication flows, and real-time database endpoints.',
  },
  {
    id: 4,
    name: 'Team Member 4',
    role: 'GIS & Mapping Specialist',
    image: '',
    bio: 'Manages shoreline GPS coordinates, route calculations, and interactive map layers.',
  },
  {
    id: 5,
    name: 'Team Member 5',
    role: 'Marine Data Engineer',
    image: '',
    bio: 'Integrates tidal telemetry, wave forecasts, and Open-Meteo meteorological models.',
  },
  {
    id: 6,
    name: 'Team Member 6',
    role: 'Frontend Engineer',
    image: '',
    bio: 'Specializes in responsive components, animations, and high-performance client rendering.',
  },
  {
    id: 7,
    name: 'Team Member 7',
    role: 'QA & Testing Specialist',
    image: '',
    bio: 'Ensures platform stability, browser cross-compatibility, and usability testing.',
  },
  {
    id: 8,
    name: 'Team Member 8',
    role: 'Community & Field Researcher',
    image: '',
    bio: 'Coordinates on-ground resort verifications and caretaker interview data.',
  },
  {
    id: 9,
    name: 'Team Member 9',
    role: 'Content & Media Strategist',
    image: '',
    bio: 'Curates authentic beach photography, 360° virtual tours, and visitor guidelines.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1F3F74] dark:text-[#4987BA] text-xs font-bold tracking-wide uppercase shadow-2xs">
          <Compass className="w-3.5 h-3.5" />
          <span>About Dagat Ta Bai</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1F3F74] dark:text-white tracking-tight leading-tight">
          See Beyond the Pictures
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A dedicated local beach discovery platform presenting northern Cebu&apos;s coastlines with integrity, verified data, and direct map navigation.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12">
        
        {/* ── Core Mission & Value Cards (Bento 3-Card Grid) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Honest Representation */}
          <div className="bg-white dark:bg-[#121215] p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 flex items-center justify-center shadow-2xs">
              <Compass className="w-5 h-5 stroke-[2]" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Find Beaches, Not Filters
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Unlike generic travel portals that bury genuine spots under sponsored rankings, Dagat Ta Bai emphasizes honest representation. We provide direct access to verified entrance fees, realistic cottages, genuine photos, and live marine tides.
            </p>
          </div>

          {/* Card 2: Coastal Heritage */}
          <div className="bg-white dark:bg-[#121215] p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 flex items-center justify-center shadow-2xs">
              <Waves className="w-5 h-5 stroke-[2]" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Heritage of Binongkalan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Situated 50 km north of Cebu City, Barangay Binongkalan in Catmon possesses some of northern Cebu&apos;s most peaceful coastlines. From calm family swimming sanctuaries to marine feeding grounds, we map every entry point accurately.
            </p>
          </div>

          {/* Card 3: Verified Local Listings */}
          <div className="bg-white dark:bg-[#121215] p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-5 h-5 stroke-[2]" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Verified Local Partners
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Every beach listing corresponds to a real, physically anchored shoreline destination with permanent GPS coordinates. Operators manage their rates, schedules, and beach rules so travelers encounter zero surprises on arrival.
            </p>
          </div>

        </div>

        {/* ── THE 9-MEMBER TEAM SHOWCASE (Meet the Team) ─────── */}
        <section className="space-y-6 pt-4">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1F3F74] dark:text-[#4987BA] text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>The Team Behind Dagat Ta Bai</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F3F74] dark:text-white tracking-tight">
              Meet Our Team
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              We are a team of 9 passionate developers, designers, and researchers dedicated to making coastal travel in Catmon transparent, accurate, and accessible.
            </p>
          </div>

          {/* 3x3 Responsive Grid for 9 Team Members */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white dark:bg-[#121215] rounded-3xl border border-slate-200/80 dark:border-neutral-800 p-5 sm:p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center space-y-4 group"
              >
                {/* Photo / Avatar Container */}
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-neutral-900 border-2 border-slate-200/80 dark:border-neutral-700/80 relative flex items-center justify-center group-hover:border-[#1F3F74] dark:group-hover:border-[#4987BA] transition-colors shadow-2xs">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* Elegant placeholder with initials and camera upload indicator */
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 dark:from-neutral-900 dark:to-neutral-800 text-[#1F3F74] dark:text-[#4987BA] p-3 space-y-1">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center shadow-xs">
                        <Camera className="w-5 h-5 text-[#1F3F74] dark:text-sky-300 stroke-[1.8]" />
                      </div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-neutral-500">
                        Photo #{member.id}
                      </span>
                    </div>
                  )}
                </div>

                {/* Member Info */}
                <div className="space-y-1 w-full">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {member.name}
                  </h3>
                  
                  {/* Role pill badge in Dive Blue tint */}
                  <div className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 text-xs font-semibold">
                    {member.role}
                  </div>

                  {member.bio && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-2 px-1">
                      {member.bio}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Tip for the Team */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-center text-xs text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            <span>💡 To insert your own pictures, place your photos in the </span>
            <code className="font-mono text-[#1F3F74] dark:text-sky-300 font-bold">/public/team/</code>
            <span> folder and update the names and image paths in </span>
            <code className="font-mono text-[#1F3F74] dark:text-sky-300 font-bold">app/(public)/about/page.tsx</code>.
          </div>
        </section>

        {/* ── Call to Action Banner (Dive Blue #1F3F74) ──────── */}
        <div className="bg-[#1F3F74] dark:bg-[#14284b] text-white rounded-3xl p-8 sm:p-10 shadow-md text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Explore Barangay Binongkalan Today
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl mx-auto leading-relaxed">
            Plan your next beach trip with real-time wave telemetry, tide conditions, and authentic cottage details.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/map"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white hover:bg-slate-100 text-[#1F3F74] font-bold text-xs sm:text-sm shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Explore Coastal Map
            </Link>
            <Link
              href="/weather"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all"
            >
              Check Live Tides
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
