'use client';

import React, { useMemo } from 'react';
import { Menu } from 'lucide-react';

interface TopbarProps {
  onOpenMobileNav: () => void;
  operatorName?: string;
  beachName?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Topbar({
  onOpenMobileNav,
}: TopbarProps) {
  // Compute Cebuano time-of-day greeting
  const greetingCebuano = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 12 && hour < 18) {
      return 'Maayong hapon'; // Afternoon
    } else if (hour >= 18 || hour < 5) {
      return 'Maayong gabii'; // Evening / Night
    }
    return 'Maayong buntag'; // Morning
  }, []);

  return (
    <header className="sticky top-0 z-30 px-6 sm:px-8 py-3.5 flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 bg-white/95 dark:bg-black/95 backdrop-blur-md transition-colors">
      {/* Left: Mobile hamburger trigger + As-is Greeting in Blue */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* As-is Greeting in Dive Blue (No resort name, no date) */}
        <h1 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans tracking-tight">
          {greetingCebuano}
        </h1>
      </div>

      {/* Right side: Clean, uncluttered navbar */}
      <div className="flex items-center gap-3" />
    </header>
  );
}
