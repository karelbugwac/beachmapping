'use client';

import React from 'react';
import Link from 'next/link';
import {
  Camera,
  Coins,
  MessageSquare,
  Share2,
  Lock,
  ChevronRight,
} from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      title: 'Update Shoreline Photos & Cover',
      description: 'Upload high-resolution images of cottages, shallow waters, and sunsets.',
      href: '/owner/beach',
      icon: Camera,
    },
    {
      title: 'Adjust Cottage Rates & Day-Tour Fees',
      description: 'Keep entrance prices, table rentals, and family cabana rates current.',
      href: '/owner/beach',
      icon: Coins,
    },
    {
      title: 'Review Authentic Visitor Feedback',
      description: 'Read newly submitted ratings and feedback from verified beachgoers.',
      href: '/owner/reviews',
      icon: MessageSquare,
    },
    {
      title: 'Connect Official Facebook Page & Links',
      description: 'Link your resort Facebook page, Instagram profile, and direct booking links.',
      href: '/owner/links',
      icon: Share2,
    },
    {
      title: 'Manage Staff Login 6-Digit PIN',
      description: 'Update the 6-digit access code used by resort staff on-site in Catmon.',
      href: '/owner/account',
      icon: Lock,
    },
  ];

  return (
    <section
      className="rounded-2xl border p-6 sm:p-7 transition-all shadow-xs space-y-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-sand-200)',
      }}
      aria-label="Resort Operations Actions"
    >
      <div className="border-b pb-3.5 border-[var(--color-sand-200)]">
        <span className="text-[11px] font-sans font-medium uppercase tracking-wider text-[var(--color-muted)] block mb-0.5">
          Shortcuts
        </span>
        <h3
          className="text-lg sm:text-xl font-serif font-semibold text-[var(--color-text)]"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Resort Operations
        </h3>
      </div>

      {/* List Rows with icon, title, description, and chevron */}
      <div className="divide-y divide-[var(--color-sand-200)]">
        {actions.map((action, idx) => {
          const Icon = action.icon;

          return (
            <Link
              key={idx}
              href={action.href}
              className="group flex items-center justify-between py-4 px-3 -mx-3 rounded-xl transition-colors hover:bg-[var(--color-sand-100)]/40 min-h-[52px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF4530]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors border"
                  style={{
                    backgroundColor: 'var(--color-sand-100)',
                    borderColor: 'var(--color-sand-200)',
                    color: 'var(--color-sea-700)',
                  }}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                </div>

                <div className="min-w-0 space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-sans font-semibold text-[var(--color-text)] group-hover:text-[var(--color-sea-900)] dark:group-hover:text-white transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-xs font-sans text-[var(--color-muted)] truncate">
                    {action.description}
                  </p>
                </div>
              </div>

              <ChevronRight
                className="w-4 h-4 text-[var(--color-muted)] group-hover:text-[var(--color-text)] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-3"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
