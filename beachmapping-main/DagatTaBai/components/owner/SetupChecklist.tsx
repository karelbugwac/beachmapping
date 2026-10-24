'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight, Camera, FileText, Clock, Image as ImageIcon, Star } from 'lucide-react';
import type { BeachRecord } from '@/lib/db/beaches';

interface SetupChecklistProps {
  beach: BeachRecord | null;
  reviewCount?: number;
}

export function SetupChecklist({ beach, reviewCount = 0 }: SetupChecklistProps) {
  const hasCover = Boolean(beach?.cover_image);
  const hasDescription = Boolean(beach?.description && beach.description.length > 20);
  const hasHoursAndRates = Boolean(beach?.opening_hours && (beach?.entrance_fee || beach?.cottage_fee));
  const photoCount = Array.isArray(beach?.images) ? beach.images.length : 0;
  const hasFivePhotos = photoCount >= 5;
  const hasReview = reviewCount > 0;

  const steps = [
    {
      id: 'cover',
      title: 'Upload a panoramic cover photo',
      unlocks: 'Unlocks rich preview on the Catmon interactive map and tourist search results.',
      completed: hasCover,
      actionLabel: hasCover ? 'Change photo' : 'Add cover photo',
      href: '/owner/beach',
      icon: Camera,
    },
    {
      id: 'description',
      title: 'Write your resort bio and highlights',
      unlocks: 'Helps day-tour visitors and snorkeling enthusiasts understand what makes your shore unique.',
      completed: hasDescription,
      actionLabel: hasDescription ? 'Edit description' : 'Write bio',
      href: '/owner/beach',
      icon: FileText,
    },
    {
      id: 'hours',
      title: 'Specify operating hours and entrance fees',
      unlocks: "Activates the live 'Open to visitors' indicator and day-tour budget calculators.",
      completed: hasHoursAndRates,
      actionLabel: hasHoursAndRates ? 'Adjust rates' : 'Set hours & rates',
      href: '/owner/beach',
      icon: Clock,
    },
    {
      id: 'photos',
      title: `Publish 5 or more gallery photos (${photoCount}/5)`,
      unlocks: 'Unlocks the full photographic editorial layout on your verified destination page.',
      completed: hasFivePhotos,
      actionLabel: hasFivePhotos ? 'Manage gallery' : 'Upload photos',
      href: '/owner/beach',
      icon: ImageIcon,
    },
    {
      id: 'review',
      title: 'Receive your first verified guest review',
      unlocks: 'Activates the public star rating badge and recommendation score for your resort.',
      completed: hasReview,
      actionLabel: hasReview ? 'View reviews' : 'Share review link',
      href: '/owner/reviews',
      icon: Star,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <section
      className="rounded-2xl border p-6 sm:p-7 transition-all shadow-xs"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-sand-200)',
      }}
      aria-label="Resort Setup Progress"
    >
      {/* Header & Progress Status */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b pb-4 mb-5 border-[var(--color-sand-200)]">
        <div>
          <span className="text-[11px] font-sans font-medium uppercase tracking-wider text-[var(--color-muted)] block mb-0.5">
            Checklist
          </span>
          <h3
            className="text-xl sm:text-2xl font-serif font-semibold text-[var(--color-text)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Get your beach ready
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-sans font-medium text-[var(--color-muted)]">
            <strong className="text-[var(--color-text)] font-semibold">{completedCount}</strong> of{' '}
            {steps.length} completed
          </span>

          {/* Progress Pill */}
          <div className="w-24 h-2 rounded-full overflow-hidden bg-[var(--color-sand-100)] border border-[var(--color-sand-200)]">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: progressPercent === 100 ? 'var(--color-sea-700)' : 'var(--color-coral)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Step Rows */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`p-4 sm:p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[60px] sm:min-h-auto ${
                step.completed
                  ? 'bg-[var(--color-sand-100)]/30 border-[var(--color-sand-200)]'
                  : 'bg-[var(--color-surface)] border-[var(--color-sand-200)] hover:border-[var(--color-sand-300)]'
              }`}
            >
              {/* Left: Indicator + Title + Unlocks Note */}
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 flex-shrink-0">
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <Circle className="w-5 h-5 text-[var(--color-sand-300)]" strokeWidth={1.75} aria-hidden="true" />
                  )}
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs sm:text-sm font-sans font-semibold ${
                        step.completed
                          ? 'text-[var(--color-text)] line-through decoration-[var(--color-muted)]/50'
                          : 'text-[var(--color-text)]'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>

                  <p className="text-xs font-sans text-[var(--color-muted)] leading-relaxed">
                    {step.unlocks}
                  </p>
                </div>
              </div>

              {/* Right: Clean Action Button */}
              <Link
                href={step.href}
                className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors border flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF4530]"
                style={{
                  backgroundColor: step.completed ? 'transparent' : 'var(--color-sand-100)',
                  borderColor: 'var(--color-sand-200)',
                  color: 'var(--color-text)',
                }}
              >
                <span>{step.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--color-muted)]" strokeWidth={1.75} aria-hidden="true" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
