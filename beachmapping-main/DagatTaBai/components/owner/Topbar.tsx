'use client';

import React, { useMemo } from 'react';
import { Menu, Bell } from 'lucide-react';

interface TopbarProps {
  onOpenMobileNav: () => void;
  operatorName?: string;
  isOpenNow?: boolean;
  openingHours?: string;
}

export function Topbar({
  onOpenMobileNav,
  operatorName = 'Resort Operator',
  isOpenNow = true,
  openingHours = '8:00 AM – 6:00 PM',
}: TopbarProps) {
  // Compute Cebuano time-of-day greeting
  const { greetingCebuano, formattedDate } = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();

    let greeting = 'Maayong buntag'; // Morning (midnight to 11:59 AM)
    if (hour >= 12 && hour < 18) {
      greeting = 'Maayong hapon'; // Afternoon (12 PM to 5:59 PM)
    } else if (hour >= 18 || hour < 5) {
      greeting = 'Maayong gabii'; // Evening / Night (6 PM onwards)
    }

    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      greetingCebuano: greeting,
      formattedDate: dateStr,
    };
  }, []);

  return (
    <header
      className="sticky top-0 z-30 px-6 sm:px-8 py-3.5 flex items-center justify-between border-b transition-colors"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-sand-200)',
      }}
    >
      {/* Left: Mobile menu toggle + Cebuano greeting & date */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-sand-100)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF4530]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" strokeWidth={1.75} />
        </button>

        <div>
          <span className="block text-[11px] font-sans font-medium uppercase tracking-wider text-[var(--color-muted)]">
            {formattedDate} &bull; Catmon, Cebu
          </span>
          <h1
            className="text-sm sm:text-base font-serif font-semibold text-[var(--color-text)] leading-snug"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {greetingCebuano}, <span className="font-normal">{operatorName}</span>
          </h1>
        </div>
      </div>

      {/* Right: Operational Status Pill + Notifications (NO second Sign Out!) */}
      <div className="flex items-center gap-3">
        {/* Open Now / Closed Status Pill */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sans font-medium border"
          style={{
            backgroundColor: 'var(--color-sand-100)',
            borderColor: 'var(--color-sand-200)',
            color: 'var(--color-text)',
          }}
          title={`Standard operating hours: ${openingHours}`}
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
            style={{
              backgroundColor: isOpenNow ? 'var(--color-sun)' : 'var(--color-muted)',
            }}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">
            {isOpenNow ? 'Open to visitors' : 'Closed today'}
          </span>
          <span className="sm:hidden font-mono text-[11px]">
            {isOpenNow ? 'Open' : 'Closed'}
          </span>
        </div>

        {/* Notifications Icon Button */}
        <button
          type="button"
          className="relative p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-sand-100)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF4530] transition-colors"
          aria-label="View notifications"
          title="Notifications"
        >
          <Bell className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#CF4530]"
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  );
}
