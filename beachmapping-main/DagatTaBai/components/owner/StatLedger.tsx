'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Clock, Image as ImageIcon, ThumbsUp } from 'lucide-react';

interface StatLedgerProps {
  rating?: number;
  reviewCount?: number;
  photoCount?: number;
  openingHours?: string;
  recommendationRate?: number;
}

export function StatLedger({
  rating = 0,
  reviewCount = 0,
  photoCount = 0,
  openingHours = '8:00 AM – 6:00 PM',
  recommendationRate = 0,
}: StatLedgerProps) {
  const hasReviews = reviewCount > 0 && rating > 0;
  const hasPhotos = photoCount > 0;
  const hasRecommendation = reviewCount > 0 && recommendationRate > 0;

  return (
    <section
      className="rounded-2xl border overflow-hidden transition-all shadow-xs"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-sand-200)',
      }}
      aria-label="Resort Performance Ledger"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-sand-200)]">
        {/* SEGMENT 1: RATING */}
        <Link
          href="/owner/reviews"
          className="group p-5 sm:p-6 transition-colors hover:bg-[var(--color-sand-100)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF4530]"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-sans font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Guest Rating
            </span>
            <Star
              className="w-4 h-4"
              strokeWidth={1.75}
              style={{
                color: hasReviews ? 'var(--color-sun)' : 'var(--color-muted)',
                fill: hasReviews ? 'var(--color-sun)' : 'transparent',
              }}
              aria-hidden="true"
            />
          </div>

          <div className="flex items-baseline gap-2">
            {hasReviews ? (
              <>
                <span
                  className="text-2xl sm:text-3xl font-serif font-semibold text-[var(--color-text)] tabular-nums"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {rating.toFixed(1)}
                </span>
                <span className="text-xs font-sans text-[var(--color-muted)]">/ 5.0</span>
              </>
            ) : (
              <span
                className="text-lg sm:text-xl font-serif font-medium text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                No reviews yet
              </span>
            )}
          </div>

          <p className="text-xs font-sans text-[var(--color-muted)] mt-1">
            {hasReviews
              ? `Based on ${reviewCount} verified review${reviewCount === 1 ? '' : 's'}`
              : 'Share your listing link to collect reviews'}
          </p>
        </Link>

        {/* SEGMENT 2: PHOTOS */}
        <Link
          href="/owner/beach"
          className="group p-5 sm:p-6 transition-colors hover:bg-[var(--color-sand-100)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF4530]"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-sans font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Shoreline Gallery
            </span>
            <ImageIcon className="w-4 h-4 text-[var(--color-sea-700)]" strokeWidth={1.75} aria-hidden="true" />
          </div>

          <div className="flex items-baseline gap-2">
            {hasPhotos ? (
              <span
                className="text-2xl sm:text-3xl font-serif font-semibold text-[var(--color-text)] tabular-nums"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {photoCount}
              </span>
            ) : (
              <span
                className="text-lg sm:text-xl font-serif font-medium text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Add first photo
              </span>
            )}
            {hasPhotos && (
              <span className="text-xs font-sans text-[var(--color-muted)]">photos published</span>
            )}
          </div>

          <p className="text-xs font-sans text-[var(--color-muted)] mt-1">
            {hasPhotos ? 'Cottages, shore & drone views' : 'Photos help tourists plan their trip'}
          </p>
        </Link>

        {/* SEGMENT 3: HOURS */}
        <Link
          href="/owner/beach"
          className="group p-5 sm:p-6 transition-colors hover:bg-[var(--color-sand-100)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF4530]"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-sans font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Daily Schedule
            </span>
            <Clock className="w-4 h-4 text-[var(--color-sea-700)]" strokeWidth={1.75} aria-hidden="true" />
          </div>

          <div className="flex items-baseline gap-1.5">
            <span
              className="text-lg sm:text-xl font-serif font-semibold text-[var(--color-text)] truncate"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {openingHours || '8:00 AM – 6:00 PM'}
            </span>
          </div>

          <p className="text-xs font-sans text-[var(--color-muted)] mt-1">
            Standard day-tour operating schedule
          </p>
        </Link>

        {/* SEGMENT 4: RECOMMENDATION */}
        <Link
          href="/owner/reviews"
          className="group p-5 sm:p-6 transition-colors hover:bg-[var(--color-sand-100)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF4530]"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-sans font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Recommendation
            </span>
            <ThumbsUp className="w-4 h-4 text-[var(--color-sea-700)]" strokeWidth={1.75} aria-hidden="true" />
          </div>

          <div className="flex items-baseline gap-2">
            {hasRecommendation ? (
              <>
                <span
                  className="text-2xl sm:text-3xl font-serif font-semibold text-[var(--color-text)] tabular-nums"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {recommendationRate}%
                </span>
                <span className="text-xs font-sans text-[var(--color-sea-700)] font-medium">positive</span>
              </>
            ) : (
              <span
                className="text-lg sm:text-xl font-serif font-medium text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Awaiting visits
              </span>
            )}
          </div>

          <p className="text-xs font-sans text-[var(--color-muted)] mt-1">
            {hasRecommendation
              ? 'Visitors rating 4 stars or above'
              : 'Feedback appears as guests review'}
          </p>
        </Link>
      </div>
    </section>
  );
}
