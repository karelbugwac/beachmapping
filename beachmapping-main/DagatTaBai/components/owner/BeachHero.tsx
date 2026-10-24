'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Camera, ExternalLink, Sparkles } from 'lucide-react';
import type { BeachRecord } from '@/lib/db/beaches';

interface BeachHeroProps {
  beach: BeachRecord | null;
  loading?: boolean;
}

export function BeachHero({ beach, loading = false }: BeachHeroProps) {
  const isConfigured = Boolean(beach && beach.name);
  const displayName = isConfigured ? beach!.name : 'Set up your beach';
  const displayLocation = isConfigured ? beach!.location : 'Barangay Binongkalan, Catmon, Cebu';
  const coverImage = beach?.cover_image;
  const profileImage = beach?.profile_image;
  const publicSlug = beach?.slug || beach?.id;

  return (
    <section
      className="relative rounded-2xl overflow-hidden border transition-all"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-sand-200)',
      }}
      aria-label="Beach Overview and Identity"
    >
      {/* 1. COVER BANNER (21:9 aspect ratio with soft bottom scrim or SVG wave fallback) */}
      <div className="relative w-full aspect-[21/9] min-h-[180px] sm:min-h-[220px] max-h-[320px] overflow-hidden">
        {coverImage ? (
          <>
            <Image
              src={coverImage}
              alt={displayName}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1440px) 100vw, 1400px"
            />
            {/* Soft, warm scrim gradient for legible text (sand & sea tones, NOT harsh neon teal) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(180deg, rgba(11, 46, 54, 0.05) 0%, rgba(11, 46, 54, 0.4) 60%, rgba(11, 46, 54, 0.82) 100%)',
              }}
            />
          </>
        ) : (
          /* Flat layered SVG waves in sand and seafoam tones (no gradient wash) */
          <div
            className="w-full h-full flex flex-col justify-end p-6"
            style={{ backgroundColor: 'var(--color-sand-100)' }}
          >
            <svg
              className="w-full h-24"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M0 40C150 70 350 20 500 50C650 80 850 30 1000 60C1100 80 1170 65 1200 60V120H0V40Z"
                fill="var(--color-seafoam-200)"
                fillOpacity="0.4"
              />
              <path
                d="M0 65C180 95 380 45 540 75C700 105 880 55 1040 85C1120 100 1170 90 1200 85V120H0V65Z"
                fill="var(--color-sand-200)"
                fillOpacity="0.6"
              />
              <path
                d="M0 85C200 110 400 70 600 95C800 120 1000 80 1200 100V120H0V85Z"
                fill="var(--color-surface)"
              />
            </svg>
          </div>
        )}

        {/* Floating action on cover */}
        <div className="absolute top-4 right-4 z-10">
          <Link
            href="/owner/beach"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors backdrop-blur-xs border"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: 'var(--color-sea-900)',
              borderColor: 'rgba(0, 0, 0, 0.08)',
            }}
          >
            <Camera className="w-3.5 h-3.5 text-[#CF4530]" strokeWidth={1.75} aria-hidden="true" />
            <span>Change cover</span>
          </Link>
        </div>
      </div>

      {/* 2. IDENTITY BAR (Logo overlaps bottom edge, 40px serif title with proper breathing room) */}
      <div className="px-6 sm:px-8 pb-6 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 -mt-12 sm:-mt-14">
          {/* Left: Overlapping round logo + Serif Name + Stamp badge */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            {/* Round Resort Badge / Logo */}
            <div
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 shadow-sm flex-shrink-0 flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-sand-100)',
                borderColor: 'var(--color-surface)',
              }}
            >
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <span
                  className="text-2xl sm:text-3xl font-serif font-bold text-[var(--color-sea-900)] dark:text-white"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {displayName.charAt(0)}
                </span>
              )}
            </div>

            {/* Name, Location & Stamp Badge */}
            <div className="pb-1 sm:pb-2 space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2
                  className="text-2xl sm:text-3xl lg:text-4xl font-serif font-semibold leading-tight tracking-normal text-[var(--color-text)]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {displayName}
                </h2>

                {/* Boutique Stamp-Style Verified Badge */}
                {isConfigured && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-sans font-medium tracking-wide uppercase border border-dashed"
                    style={{
                      borderColor: 'var(--color-sea-700)',
                      color: 'var(--color-sea-700)',
                      backgroundColor: 'transparent',
                    }}
                    title="Verified local Catmon beach resort operator"
                  >
                    <span>Verified Operator</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-sans text-[var(--color-muted)]">
                <MapPin className="w-3.5 h-3.5 text-[#CF4530] flex-shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>{displayLocation}</span>
                <span className="text-[var(--color-sand-300)]">&bull;</span>
                <span>Philippines</span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center justify-center sm:justify-end gap-3 pb-2">
            {/* Primary Action Button (Coral with white text) */}
            <Link
              href="/owner/beach"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-sans font-semibold text-white transition-colors shadow-xs min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF4530]"
              style={{
                backgroundColor: 'var(--color-coral)',
              }}
            >
              <Sparkles className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              <span>{isConfigured ? 'Edit profile & photos' : 'Configure your beach'}</span>
            </Link>

            {/* Ghost Button: Preview Public Page */}
            {isConfigured && publicSlug && (
              <Link
                href={`/beaches/${publicSlug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-sans font-medium border transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF4530]"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: 'var(--color-sand-200)',
                  color: 'var(--color-text)',
                }}
              >
                <span>Preview public page</span>
                <ExternalLink className="w-3.5 h-3.5 text-[var(--color-muted)]" strokeWidth={1.75} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
