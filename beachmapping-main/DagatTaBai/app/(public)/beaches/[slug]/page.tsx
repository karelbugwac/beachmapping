'use client';

import React, { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Clock,
  MapPin,
  Star,
  ChevronLeft,
  Phone,
  Mail,
  ExternalLink,
  Images,
  Home,
  Info,
  Compass,
  Navigation,
  MessageSquare,
  Ticket,
  Calendar,
  Route,
  Sun,
} from 'lucide-react';
import type { BeachRecord } from '@/lib/db/beaches';
import { VirtualTourModal } from '@/components/vtmodal';
import { PhotoViewerModal, type PhotoViewerItem } from '@/components/cottages/cottagephotos';
import { CottageCard } from '@/components/cottages/cottagecard';
import { FacilityCard } from '@/components/facilitycard';
import { getFacilityCategoryLabel } from '@/lib/utils/facility-categories';
import { formatOpeningHoursGroups } from '@/lib/utils/opening-status';
import { getFacilityFeeItems } from '@/lib/utils/facility-pricing';
import { maskReviewerName } from '@/lib/utils/mask-reviewer-name';
import { showToast } from '@/components/ui/feedback-toasts';
import { useRealtimeSync, notifyRealtimeSync } from '@/lib/realtime-sync';

interface ResortRuleItem {
  id: string;
  type: 'do' | 'dont';
  title: string;
  description: string;
  category: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

function parseResortRules(value: string | null): ResortRuleItem[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((rule): rule is ResortRuleItem =>
      typeof rule === 'object'
      && rule !== null
      && 'id' in rule
      && typeof rule.id === 'string'
      && 'type' in rule
      && (rule.type === 'do' || rule.type === 'dont')
      && 'title' in rule
      && typeof rule.title === 'string'
      && 'description' in rule
      && typeof rule.description === 'string'
      && 'category' in rule
      && typeof rule.category === 'string'
    );
  } catch (error) {
    console.error('Failed to parse beach guidelines:', error);
    return [];
  }
}

function getEntranceFeeValues(beach: BeachRecord) {
  const legacyValues = beach.entrancefee?.split('|') || [];
  const adultFee = beach.entrance_fee_adults || legacyValues[0] || beach.entrancefee;
  const childFee = beach.entrance_fee_children || legacyValues[1];
  const formatFee = (value: string | null | undefined) =>
    value ? (value.startsWith('₱') ? value : `₱${value}`) : 'Contact resort';

  return {
    adults: formatFee(adultFee),
    children: formatFee(childFee),
  };
}

export default function BeachProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [beach, setBeach] = useState<BeachRecord | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'posts' | 'cottages' | 'facilities' | 'dos' | 'reviews'>('general');
  const [showTourModal, setShowTourModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<PhotoViewerItem | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Review System State (Matches Feedback Page Architecture)
  const [beachReviews, setBeachReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [reviewCategory, setReviewCategory] = useState<'all' | 5 | 4 | 3 | 2 | 1>('all');

  const refreshBeachAndReviews = (initialLoad = false) => {
    if (initialLoad) setLoading(true);
    fetch(`/api/beaches/${encodeURIComponent(slug)}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Beach not found');
        return res.json();
      })
      .then((data) => {
        setBeach(data);
        setNotFound(false);
        setReviewCount(Number(data.review_count) || 0);
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => {
        if (initialLoad) setLoading(false);
      });

    fetch(`/api/beaches/${encodeURIComponent(slug)}/reviews`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setBeachReviews(data);
          setReviewCount(data.length);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshBeachAndReviews(true);

    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((sessionData) => {
        setSignedIn(Boolean(sessionData?.user));
      })
      .catch(() => {});
  }, [slug]);

  useRealtimeSync(() => {
    refreshBeachAndReviews(false);
  });

  // 1st Image Requirement: Spinning indicator only (no text)
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white dark:bg-black text-brand-navy-500 dark:text-brand-teal-300">
        <div className="animate-spin rounded-full h-9 w-9 border-3 border-brand-navy-500 dark:border-brand-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (notFound || !beach) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 bg-white dark:bg-black text-center px-4">
        <Compass className="w-12 h-12 text-brand-navy-500 dark:text-brand-teal-300 opacity-60" />
        <h2 className="text-xl font-extrabold text-brand-navy-500 dark:text-brand-teal-300">Beach destination not found</h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm">
          We couldn&apos;t locate this beach listing. It may have been updated or moved.
        </p>
        <Link
          href="/map"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-navy-500 hover:bg-brand-navy-600 text-white text-xs font-bold rounded-full transition shadow-md"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Explore Live Map</span>
        </Link>
      </div>
    );
  }

  const galleryImages = beach.images && beach.images.length > 0
    ? beach.images.map((img) => img.photo_url)
    : beach.cover_image
    ? [beach.cover_image]
    : [];

  const resortRules = parseResortRules(beach.rules);
  const resortPosts = beach.posts || [];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-display transition-colors duration-200">
      
      {/* ── 1. FULL-WIDTH HERO COVER (Flat corners, edge-to-edge backdrop, NO badges or buttons on cover) ── */}
      <div className="relative w-full h-72 sm:h-84 md:h-96 rounded-none overflow-hidden bg-slate-950">
        {beach.cover_image || galleryImages[0] ? (
          <Image
            src={beach.cover_image || galleryImages[0]}
            alt={beach.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-brand-navy-500 to-brand-teal-600 text-white p-6">
            <Compass className="w-12 h-12 text-brand-teal-300 mb-2" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30" />

        {/* Top Floating Control on Edge-to-Edge Hero */}
        <div className="absolute top-5 left-2 right-4 sm:left-4 sm:right-8 flex items-center justify-between z-20">
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-white text-xs font-bold transition-all group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Map</span>
          </Link>
        </div>

        {/* Clean Hero Bottom: Title & Rating ONLY (No overlay buttons or badges) */}
        <div className="absolute bottom-6 left-4 right-4 sm:left-8 sm:right-8 flex items-end justify-between gap-4 text-white z-20">
          <div className="space-y-1">
            <h1 className="font-display text-xl font-semibold tracking-tight text-white drop-shadow-md sm:text-2xl">
              {beach.name}
            </h1>
            <p className="font-display text-[11px] sm:text-xs text-brand-teal-200 flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-brand-teal-300 flex-shrink-0" />
              <span>{beach.location || 'Location not provided'}</span>
            </p>
          </div>

          {Number(beach.averagerating) > 0 && (
            <div className="bg-black/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-extrabold flex items-center gap-1.5 border border-white/20 shadow-md">
              <Star className="w-4 h-4 fill-brand-sun-400 text-brand-sun-700" />
              <span>{Number(beach.averagerating).toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. CATEGORY TABS (Pill Style, Signature Dive Blue) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'general', label: 'General Info' },
            { id: 'posts', label: 'Posts' },
            { id: 'cottages', label: 'Cottage & Tables' },
            { id: 'facilities', label: 'Facilities' },
            { id: 'dos', label: "Do's & Don'ts" },
            { id: 'reviews', label: `Reviews (${reviewCount})` },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 font-display text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all cursor-pointer relative ${
                  isActive
                    ? 'text-brand-navy-500 dark:text-brand-teal-300'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-brand-navy-500 dark:hover:text-brand-teal-300'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-navy-500 dark:bg-brand-teal-300" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. MAIN CONTENT (Two-Column Layout: Left Content + Right Sidebar) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid grid-cols-1 w-full ${activeTab === 'general' ? 'lg:grid-cols-3 gap-8' : 'lg:grid-cols-1'}`}>
          
          {/* RIGHT COLUMN: Sidebar - First on Mobile, Only on General Info Tab */}
          {activeTab === 'general' && (
          <div className="space-y-6 order-1 lg:order-2">
            {/* Operating Schedule */}
            <div className="space-y-3">
              <h3 className="font-display text-base font-semibold text-brand-navy-500 dark:text-brand-teal-300">Operating Hours</h3>
              <div className="space-y-2">
                {formatOpeningHoursGroups(beach.openinghours).map((group) => (
                  <div key={`${group.days}-${group.hours}`} className="flex justify-between items-center">
                    <span className="font-display text-[11px] sm:text-xs font-medium text-slate-600 dark:text-neutral-300">{group.days}</span>
                    <span className="font-display text-[11px] sm:text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300">{group.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Entrance Fees */}
            <div className="space-y-3">
              <h3 className="font-display text-base font-semibold text-brand-navy-500 dark:text-brand-teal-300">Entrance Fees</h3>
              <div className="space-y-2">
                {Object.entries(getEntranceFeeValues(beach)).map(([label, amount]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="font-display text-[11px] sm:text-xs font-medium text-slate-600 dark:text-neutral-300">
                      {label === 'adults' ? 'Adult' : 'Children / Senior'}
                    </span>
                    <span className="font-display text-[11px] sm:text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300">{amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact & Social */}
            <div className="space-y-4">
              <h3 className="font-display text-base font-semibold text-brand-navy-500 dark:text-brand-teal-300">Contact & Social</h3>
              
              {beach.contactphone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-navy-500 dark:text-brand-teal-300" />
                  <a
                    href={`tel:${beach.contactphone}`}
                    className="font-display text-[11px] sm:text-xs text-brand-navy-500 dark:text-brand-teal-300 hover:underline font-medium"
                  >
                    {beach.contactphone}
                  </a>
                </div>
              )}

              {beach.contactemail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-navy-500 dark:text-brand-teal-300" />
                  <a
                    href={`mailto:${beach.contactemail}`}
                    className="font-display text-[11px] sm:text-xs text-brand-navy-500 dark:text-brand-teal-300 hover:underline font-medium"
                  >
                    {beach.contactemail}
                  </a>
                </div>
              )}

              {beach.facebookurl && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 fill-brand-navy-500 dark:fill-brand-teal-300" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <a
                    href={beach.facebookurl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-display text-[11px] sm:text-xs text-brand-navy-500 dark:text-brand-teal-300 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    Visit Facebook Page
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {beach.instagramurl && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 fill-pink-600" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <a
                    href={beach.instagramurl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-display text-[11px] sm:text-xs text-pink-600 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    Visit Instagram
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Plan Your Visit - Desktop Only */}
            <div className="hidden lg:block space-y-3">
              <h3 className="font-display text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white">Plan Your Visit</h3>
              <div className="space-y-3">
                <Link
                  href={`/map?beach=${encodeURIComponent(beach.slug)}&route=true`}
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full bg-[#F4BF3E] hover:bg-[#e0a835] text-white text-[11px] sm:text-xs font-bold transition shadow-sm font-display"
                >
                  <Route className="w-4 h-4" />
                  <span>Get Directions</span>
                </Link>

                <Link
                  href="/weather"
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full bg-white dark:bg-neutral-900 border-2 border-[#F4BF3E] hover:bg-[#F4BF3E]/10 text-[#F4BF3E] text-[11px] sm:text-xs font-bold transition font-display"
                >
                  <Sun className="w-4 h-4" />
                  <span>View Weather</span>
                </Link>
              </div>
            </div>

            {/* Weather & Tide Preview - REMOVED */}
          </div>
          )}

          {/* LEFT COLUMN: Main Content */}
          <div className={`w-full min-w-0 space-y-8 order-2 ${activeTab === 'general' ? 'lg:col-span-2' : 'lg:col-span-1'}`}>
          
          {/* ── TAB 1: GENERAL INFO (Includes 360 Virtual Tour & Highlights) ── */}
          {activeTab === 'general' && (
            <div className="space-y-8">
              {/* About Section */}
              <div className="space-y-3">
                <h2 className="font-display text-base font-semibold text-brand-navy-500 dark:text-brand-teal-300">
                  About {beach.name}
                </h2>
                <div className="font-display text-[11px] sm:text-xs leading-relaxed text-slate-700 dark:text-neutral-300 text-justify">
                  {(() => {
                    const description = beach.description || 'No beach description provided yet.';
                    if (description.length <= 150) {
                      return <p>{description}</p>;
                    }
                    if (showFullDescription) {
                      return (
                        <>
                          <p>{description}</p>
                          <button
                            onClick={() => setShowFullDescription(false)}
                            className="text-brand-navy-500 dark:text-brand-teal-300 font-bold hover:underline"
                          >
                            See less
                          </button>
                        </>
                      );
                    }
                    const sentences = description
                      .split(/(?<=[.!?])\s+/)
                      .filter(s => s.trim().length > 0);
                    const preview = sentences.slice(0, 2).join(' ');
                    return (
                      <>
                        <p>{preview}. </p>
                        <button
                          onClick={() => setShowFullDescription(true)}
                          className="text-brand-navy-500 dark:text-brand-teal-300 font-bold hover:underline"
                        >
                          See more
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* 360 Virtual Tour */}
              <div className="space-y-3">
                <h2 className="font-display text-base font-semibold text-brand-navy-500 dark:text-brand-teal-300">
                  360° Virtual Tour
                </h2>
                {beach.virtualtoururl ? (
                  <div className="relative w-full h-80 sm:h-96 md:h-[460px] overflow-hidden bg-black border border-slate-200 dark:border-neutral-800 shadow-md">
                    <iframe
                      src={beach.virtualtoururl}
                      title={`${beach.name} 360 Tour`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; magnetometer; picture-in-picture; web-share; vr; xr-spatial-tracking"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white/50 dark:bg-neutral-900/30 space-y-2">
                    <Compass className="w-8 h-8 mx-auto text-brand-navy-500 dark:text-brand-teal-300 opacity-70" />
                    <p className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                      No virtual tour available yet
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      A virtual tour will appear here when the resort adds one.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Facts */}
              <div className="space-y-3">
                <h2 className="font-display text-base font-semibold text-brand-navy-500 dark:text-brand-teal-300">
                  Quick Facts
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800">
                    <p className="font-display text-[10px] font-bold text-slate-400 uppercase">Shoreline</p>
                    <p className="font-display text-[11px] sm:text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300">Sandy & Pebble</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800">
                    <p className="font-display text-[10px] font-bold text-slate-400 uppercase">Best For</p>
                    <p className="font-display text-[11px] sm:text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300">Swim & Sunset</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800">
                    <p className="font-display text-[10px] font-bold text-slate-400 uppercase">Parking</p>
                    <p className="font-display text-[11px] sm:text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300">On-site Area</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800">
                    <p className="font-display text-[10px] font-bold text-slate-400 uppercase">Vibe</p>
                    <p className="font-display text-[11px] sm:text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300">Family Friendly</p>
                  </div>
                </div>
              </div>

              {/* Plan Your Visit - Mobile Only */}
              <div className="lg:hidden space-y-3 pt-4 border-t border-slate-200 dark:border-neutral-800">
                <h3 className="font-display text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white">Plan Your Visit</h3>
                <div className="space-y-3">
                  <Link
                    href={`/map?beach=${encodeURIComponent(beach.slug)}&route=true`}
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full bg-[#F4BF3E] hover:bg-[#e0a835] text-white text-[11px] sm:text-xs font-bold transition shadow-sm font-display"
                  >
                    <Route className="w-4 h-4" />
                    <span>Get Directions</span>
                  </Link>

                  <Link
                    href="/weather"
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full bg-white dark:bg-neutral-900 border-2 border-[#F4BF3E] hover:bg-[#F4BF3E]/10 text-[#F4BF3E] text-[11px] sm:text-xs font-bold transition font-display"
                  >
                    <Sun className="w-4 h-4" />
                    <span>View Weather</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: POSTS (Photos & Resort Updates) ── */}
            {activeTab === 'posts' && (
              <div className="space-y-6">
                {/* Facebook-Style Feed Cards */}
                <div className="space-y-5">
                  {resortPosts.length > 0 ? resortPosts.map((post, index) => (
                    <div
                      key={post.id || `${post.imageurl}-${index}`}
                      className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 overflow-hidden shadow-xs space-y-3"
                    >
                      <div className="p-4 flex items-center gap-3 border-b border-slate-100 dark:border-neutral-800">
                        <div className="w-9 h-9 rounded-full bg-brand-navy-500 text-white flex items-center justify-center font-bold text-xs">
                          {beach.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{beach.name}</h4>
                          {post.createdat && (
                            <span className="text-[10px] text-slate-400">
                              {new Date(post.createdat).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {post.caption && (
                        <div className="px-4 text-xs text-slate-800 dark:text-neutral-200 leading-relaxed">
                          {post.caption}
                        </div>
                      )}

                      {post.imageurl && (
                        <div className="relative w-full h-72 sm:h-96 bg-slate-900">
                          <Image src={post.imageurl} alt="Resort update" fill className="object-cover" sizes="800px" />
                        </div>
                      )}
                    </div>
                  )) : (
                    <p className="text-center text-xs text-slate-500 dark:text-neutral-400 py-8 w-full">
                      No resort updates have been posted yet.
                    </p>
                  )}
                </div>

              </div>
            )}

            {/* ── TAB 3: COTTAGE ── */}
            {activeTab === 'cottages' && (
              <div className="space-y-6">
                {beach.cottagefee && (
                  <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base Cottage Daily Rate</span>
                      <div className="text-lg font-extrabold text-brand-navy-500 dark:text-brand-teal-300">
                        {beach.cottagefee.startsWith('₱') ? beach.cottagefee : `₱${beach.cottagefee}`}
                      </div>
                    </div>
                    <Ticket className="w-10 h-10 text-brand-navy-500 dark:text-brand-teal-300 opacity-60" />
                  </div>
                )}

                {beach.cottages && beach.cottages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 w-full">
                    {beach.cottages.map((cottage) => (
                      <CottageCard
                        key={cottage.id}
                        name={cottage.name}
                        imageUrl={cottage.imageurl}
                        photoCount={cottage.photos?.length || 0}
                        price={cottage.price}
                        priceSuffix="/day"
                        capacity={cottage.capacity}
                        description={cottage.description}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-slate-500 dark:text-neutral-400 py-8">
                    No cottage details available yet.
                  </p>
                )}
              </div>
            )}

            {/* ── TAB 4: FACILITIES ── */}
            {activeTab === 'facilities' && (
              <div className="space-y-6">
                {beach.facility_items && beach.facility_items.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 w-full">
                    {beach.facility_items.map((facility) => (
                      <FacilityCard
                        key={facility.id}
                        name={facility.name}
                        category={facility.category}
                        imageUrl={facility.imageurl}
                        description={facility.description}
                        basePrice={facility.price}
                        rates={facility.rates}
                        onView={() => setSelectedDetail({
                          name: facility.name,
                          photos: facility.photos?.map((p) => ({
                            imageurl: p.imageurl,
                            sortorder: p.sortorder,
                          })) || [],
                        })}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-slate-500 dark:text-neutral-400 py-8">
                    No facility details available yet.
                  </p>
                )}
              </div>
            )}

            {/* ── TAB 5: DO'S & DON'TS ── */}
            {activeTab === 'dos' && (
              <div className="space-y-6">
                {resortRules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pl-4">
                    <div className="space-y-3">
                      <h3 className="font-display text-base font-semibold text-emerald-600 dark:text-emerald-400">
                        Do&apos;s
                      </h3>
                      {resortRules.filter((rule) => rule.type === 'do').map((rule, index) => (
                        <div key={rule.id} className="space-y-1">
                          <h4 className="font-display text-base font-semibold text-emerald-900 dark:text-emerald-300">
                            <span className="mr-2">{index + 1}.</span>{rule.title}
                          </h4>
                          <p className="font-display text-[11px] sm:text-xs text-emerald-800 dark:text-emerald-400">{rule.description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-display text-base font-semibold text-red-600 dark:text-red-400">
                        Don&apos;ts
                      </h3>
                      {resortRules.filter((rule) => rule.type === 'dont').map((rule, index) => (
                        <div key={rule.id} className="space-y-1">
                          <h4 className="font-display text-base font-semibold text-red-900 dark:text-red-300">
                            <span className="mr-2">{index + 1}.</span>{rule.title}
                          </h4>
                          <p className="font-display text-[11px] sm:text-xs text-red-800 dark:text-red-400">{rule.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-xs text-slate-500 dark:text-neutral-400 py-8">
                    No guidelines available yet.
                  </p>
                )}
              </div>
            )}

            {/* ── TAB 6: REVIEWS (Feedback Page Architecture with Review Form & 6 Rating Categories) ── */}
            {activeTab === 'reviews' && (
              <div className="w-full space-y-6">
                {/* Interactive Review Drop Form (Same as Feedback Page) */}
                <div className="w-full space-y-4">
                  <h3 className="font-display text-base font-semibold text-brand-navy-500 dark:text-brand-teal-300">Leave a Review</h3>
                  {!signedIn ? (
                    <div className="text-center py-4">
                      <p className="font-display text-[11px] sm:text-xs text-slate-600 dark:text-neutral-400 mb-3">
                        Sign in to share your experience
                      </p>
                      <Link
                        href={`/login?redirect=/beaches/${encodeURIComponent(beach.slug)}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-navy-500 hover:bg-brand-navy-600 text-white text-[11px] sm:text-xs font-bold rounded-full transition font-display"
                      >
                        Sign In
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!signedIn) {
                        showToast('Please sign in to submit a review', 'error');
                        return;
                      }
                      setSubmittingReview(true);
                      try {
                        const res = await fetch(`/api/beaches/${encodeURIComponent(beach.slug)}/reviews`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            rating: userRating,
                            comment: reviewComment,
                          }),
                        });
                        if (res.ok) {
                          showToast('Review submitted successfully', 'success');
                          setReviewComment('');
                          setUserRating(5);
                          refreshBeachAndReviews(false);
                        } else {
                          showToast('Failed to submit review', 'error');
                        }
                      } catch {
                        showToast('Failed to submit review', 'error');
                      } finally {
                        setSubmittingReview(false);
                      }
                    }} className="w-full space-y-4">
                      <div>
                        <label className="block font-display text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Overall Rating</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setUserRating(value)}
                              onMouseEnter={() => setHoverRating(value)}
                              onMouseLeave={() => setHoverRating(null)}
                              className="text-2xl transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  (hoverRating !== null ? hoverRating : userRating) >= value
                                    ? 'fill-brand-sun-400 text-brand-sun-700'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-display text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Experience</label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Share what you loved about this beach..."
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white font-display text-[11px] sm:text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-navy-500"
                          rows={3}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="w-full px-4 py-3 bg-[#F4BF3E] hover:bg-[#e0a835] disabled:bg-slate-300 dark:disabled:bg-neutral-700 text-black text-[11px] sm:text-xs font-bold rounded-full transition shadow-md font-display"
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Rating Filter Categories: Equal Width across 6 columns (Matches Feedback Page) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full">
                  <button
                    onClick={() => setReviewCategory('all')}
                    className={`px-4 py-2 rounded-full font-display text-[11px] sm:text-xs font-bold whitespace-nowrap transition ${
                      reviewCategory === 'all'
                        ? 'bg-brand-navy-500 text-white'
                        : 'bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-800'
                    }`}
                  >
                    All ({beachReviews.length})
                  </button>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setReviewCategory(rating as any)}
                      className={`px-4 py-2 rounded-full font-display text-[11px] sm:text-xs font-bold whitespace-nowrap transition ${
                        reviewCategory === rating
                          ? 'bg-brand-navy-500 text-white'
                          : 'bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-800'
                      }`}
                    >
                      {rating}★ ({beachReviews.filter((r) => r.rating === rating).length})
                    </button>
                  ))}
                </div>

                {/* Reviews List */}
                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-navy-500 border-t-transparent" />
                  </div>
                ) : (
                  <div className="w-full space-y-4">
                    {(() => {
                      const filtered = reviewCategory === 'all'
                        ? beachReviews
                        : beachReviews.filter((r) => r.rating === reviewCategory);
                      return filtered.length > 0 ? (
                        filtered.map((rev) => (
                          <div key={rev.id} className="w-full p-4 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-brand-navy-500 text-white flex items-center justify-center font-display font-bold text-[11px] sm:text-xs">
                                  {maskReviewerName(rev.reviewer_name || 'A').charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-display text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white">
                                    {maskReviewerName(rev.reviewer_name || 'Anonymous')}
                                  </h4>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-3 h-3 ${
                                          star <= rev.rating
                                            ? 'fill-brand-sun-400 text-brand-sun-700'
                                            : 'text-slate-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              {rev.createdat && (
                                <span className="font-display text-[10px] text-slate-400">
                                  {new Date(rev.createdat).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {rev.comment && (
                              <p className="font-display text-[11px] sm:text-xs text-slate-700 dark:text-neutral-300 leading-relaxed">
                                {rev.comment}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="font-display text-center text-[11px] sm:text-xs text-slate-500 dark:text-neutral-400 py-8">
                          No reviews yet for this category.
                        </p>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Fullscreen Virtual Tour Viewer Modal ── */}
      <VirtualTourModal
        isOpen={showTourModal}
        onClose={() => setShowTourModal(false)}
        tourUrl={beach.virtualtoururl}
        beachName={beach.name}
      />
      {selectedDetail && (
        <PhotoViewerModal
          item={selectedDetail}
          onClose={() => setSelectedDetail(null)}
        />
      )}
    </div>
  );
}
