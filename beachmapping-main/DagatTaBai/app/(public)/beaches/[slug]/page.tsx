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
  ShieldCheck,
  Compass,
  Navigation,
  AlertTriangle,
  MessageSquare,
  Ticket,
} from 'lucide-react';
import type { BeachRecord } from '@/lib/db/beaches';
import { VirtualTourModal } from '@/components/virtual-tour-modal';
import { PhotoViewerModal, type PhotoViewerItem } from '@/components/cottages/cottage-photos-modal';
import { CottageCard } from '@/components/cottages/cottage-card';
import { FacilityCard } from '@/components/FacilityCard';
import { getFacilityCategoryLabel } from '@/lib/utils/facility-categories';
import { OpeningStatusPill } from '@/components/opening-status-pill';
import { formatOpeningHoursGroups } from '@/lib/utils/opening-status';
import { getFacilityFeeItems } from '@/lib/utils/facility-pricing';
import { maskReviewerName } from '@/lib/utils/mask-reviewer-name';
import { showToast } from '@/components/ui/feedback-toasts';

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
  const legacyValues = beach.entrance_fee?.split('|') || [];
  const adultFee = beach.entrance_fee_adults || legacyValues[0] || beach.entrance_fee;
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

  // Review System State (Matches Feedback Page Architecture)
  const [beachReviews, setBeachReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [reviewCategory, setReviewCategory] = useState<'all' | 5 | 4 | 3 | 2 | 1>('all');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/beaches/${encodeURIComponent(slug)}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Beach not found');
        return res.json();
      })
      .then((data) => {
        setBeach(data);
        setReviewCount(Number(data.review_count) || 0);
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  // Load reviews and user authentication state
  useEffect(() => {
    fetch(`/api/beaches/${encodeURIComponent(slug)}/reviews`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setBeachReviews(data);
          setReviewCount(data.length);
        }
      })
      .catch(() => {});

    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((sessionData) => {
        setSignedIn(Boolean(sessionData?.user));
      })
      .catch(() => {});
  }, [slug]);

  // 1st Image Requirement: Spinning indicator only (no text)
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white dark:bg-black text-[#1F3F74] dark:text-[#4987BA]">
        <div className="animate-spin rounded-full h-9 w-9 border-3 border-[#1F3F74] dark:border-[#4987BA] border-t-transparent" />
      </div>
    );
  }

  if (notFound || !beach) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 bg-white dark:bg-black text-center px-4">
        <Compass className="w-12 h-12 text-[#1F3F74] dark:text-[#4987BA] opacity-60" />
        <h2 className="text-xl font-extrabold text-[#1F3F74] dark:text-[#4987BA]">Beach destination not found</h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm">
          We couldn&apos;t locate this beach listing. It may have been updated or moved.
        </p>
        <Link
          href="/map"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1F3F74] hover:bg-[#285091] text-white text-xs font-bold rounded-full transition shadow-md"
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
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-sans transition-colors duration-200">
      
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
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1F3F74] to-[#0c1a30] text-white p-6">
            <Compass className="w-12 h-12 text-sky-300 mb-2" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30" />

        {/* Top Floating Control on Edge-to-Edge Hero */}
        <div className="absolute top-5 left-4 right-4 sm:left-8 sm:right-8 flex items-center justify-between z-20">
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20 transition-all shadow-md group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Map</span>
          </Link>

        </div>

        {/* Clean Hero Bottom: Title & Rating ONLY (No overlay buttons or badges) */}
        <div className="absolute bottom-6 left-4 right-4 sm:left-8 sm:right-8 flex items-end justify-between gap-4 text-white z-20">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-sans text-white drop-shadow-md">
              {beach.name}
            </h1>
            <p className="text-xs sm:text-sm text-sky-200 flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
              <span>{beach.location || 'Location not provided'}</span>
            </p>
          </div>

          {Number(beach.average_rating) > 0 && (
            <div className="bg-black/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 border border-white/20 shadow-md">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{Number(beach.average_rating).toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. ABOUT & CONTACT (BEFORE CATEGORIES) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="space-y-4">
          {/* About / Description of Resort */}
          <p className="max-w-4xl text-justify text-[11px] leading-relaxed text-slate-700 dark:text-neutral-300 sm:text-xs">
            {beach.description || 'No beach description provided yet.'}
          </p>

          {/* Quick Contact & Facebook Link Row */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-xs text-slate-600 dark:text-neutral-400 pt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA] flex-shrink-0" />
              <span>{beach.location || 'Location not provided'}</span>
            </div>

            {beach.contact_phone && (
              <a
                href={`tel:${beach.contact_phone}`}
                className="flex items-center gap-1.5 text-slate-700 dark:text-neutral-300 hover:text-[#1F3F74] dark:hover:text-white transition-colors font-medium"
              >
                <Phone className="w-3.5 h-3.5 text-[#1F3F74] dark:text-[#4987BA] flex-shrink-0" />
                <span>{beach.contact_phone}</span>
              </a>
            )}

            {beach.contact_email && (
              <a
                href={`mailto:${beach.contact_email}`}
                className="flex items-center gap-1.5 text-slate-700 dark:text-neutral-300 hover:text-[#1F3F74] dark:hover:text-white transition-colors font-medium"
              >
                <Mail className="w-3.5 h-3.5 text-[#1F3F74] dark:text-[#4987BA] flex-shrink-0" />
                <span>{beach.contact_email}</span>
              </a>
            )}

            {beach.facebook_url && (
              <a
                href={beach.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#1877F2] font-bold hover:underline"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {beach.instagram_url && (
              <a
                href={beach.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-pink-600 font-bold hover:underline"
              >
                <span>Instagram</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. CATEGORY TABS (Pill Style, Signature Dive Blue) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-neutral-800 no-scrollbar">
          {[
            { id: 'general', label: 'General Info', icon: Info },
            { id: 'posts', label: 'Posts', icon: Images },
            { id: 'cottages', label: 'Cottage & Tables', icon: Home },
            { id: 'facilities', label: 'Facilities', icon: ShieldCheck },
            { id: 'dos', label: "Do's & Don'ts", icon: AlertTriangle },
            { id: 'reviews', label: `Reviews (${reviewCount})`, icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1F3F74] text-white shadow-md shadow-[#1F3F74]/20'
                    : 'bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. MAIN CONTENT (Full-Width Clean Layout; Sidebar Card Removed as Requested) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full space-y-8">
          
          {/* ── TAB 1: GENERAL INFO (Includes 360 Virtual Tour & Highlights) ── */}
          {activeTab === 'general' && (
            <div className="space-y-8">
              <div className="space-y-3">
                {beach.virtual_tour_url ? (
                  <div className="relative w-full h-80 sm:h-96 md:h-[460px] overflow-hidden bg-black border border-slate-200 dark:border-neutral-800 shadow-md">
                    <iframe
                      src={beach.virtual_tour_url}
                      title={`${beach.name} 360 Tour`}
                      className="w-full h-full border-0"
                      allow="accelerometer; gyroscope; magnetometer; fullscreen"
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/30 space-y-2">
                    <Compass className="w-8 h-8 mx-auto text-[#1F3F74] dark:text-[#4987BA] opacity-70" />
                    <p className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                      No virtual tour available yet
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      A virtual tour will appear here when the resort adds one.
                    </p>
                  </div>
                )}
              </div>

              {/* Admission & Schedule Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 sm:p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-[#1F3F74] dark:bg-blue-950/50 dark:text-[#4987BA]">
                      <Ticket className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-200">Entrance Admission</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(getEntranceFeeValues(beach)).map(([label, amount]) => (
                      <div key={label} className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-slate-50 px-2 py-3 text-center dark:bg-neutral-900/60">
                        <span className="text-[11px] leading-tight text-slate-700 dark:text-neutral-300 sm:text-xs">
                          {label === 'adults' ? 'Adult' : 'Children / Senior'}
                        </span>
                        <span className="mt-1 break-words text-xl font-extrabold leading-tight text-[#1F3F74] dark:text-[#4987BA] sm:text-2xl">
                          {amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-[#1F3F74] dark:bg-neutral-900 dark:text-[#4987BA]">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operating Schedule</span>
                  </div>
                  <div className="space-y-1.5">
                    {formatOpeningHoursGroups(beach.opening_hours).map((group) => (
                      <div key={`${group.days}-${group.hours}`} className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3 dark:bg-neutral-900/60 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <span className="block text-[11px] font-medium text-slate-500 dark:text-neutral-400">{group.days}</span>
                          <span className="block text-base font-extrabold text-[#1F3F74] dark:text-[#4987BA]">{group.hours}</span>
                        </div>
                        <OpeningStatusPill hours={beach.opening_hours} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {(beach.peak_days || beach.peak_hours || beach.best_visiting_time) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {beach.peak_days && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Visiting Days</span>
                      <p className="text-sm font-bold text-[#1F3F74] dark:text-[#4987BA]">{beach.peak_days}</p>
                    </div>
                  )}
                  {beach.peak_hours && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Visiting Hours</span>
                      <p className="text-sm font-bold text-[#1F3F74] dark:text-[#4987BA]">{beach.peak_hours}</p>
                    </div>
                  )}
                  {beach.best_visiting_time && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Time to Visit</span>
                      <p className="text-sm font-bold text-[#1F3F74] dark:text-[#4987BA]">{beach.best_visiting_time}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

            {/* ── TAB 2: POSTS (Photos & Resort Updates) ── */}
            {activeTab === 'posts' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-[#1F3F74] dark:text-[#4987BA]">
                    Resort Posts & Visual Feed
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Latest announcements, seaside photos, and shoreline updates directly from {beach.name}.
                  </p>
                </div>

                {/* Facebook-Style Feed Cards */}
                <div className="space-y-5">
                  {resortPosts.length > 0 ? resortPosts.map((post, index) => (
                    <div
                      key={post.id || `${post.image_url}-${index}`}
                      className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 overflow-hidden shadow-xs space-y-3"
                    >
                      <div className="p-4 flex items-center gap-3 border-b border-slate-100 dark:border-neutral-800">
                        <div className="w-9 h-9 rounded-full bg-[#1F3F74] text-white flex items-center justify-center font-bold text-xs">
                          {beach.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{beach.name}</h4>
                          {post.created_at && (
                            <span className="text-[10px] text-slate-400">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {post.caption && (
                        <div className="px-4 text-xs text-slate-800 dark:text-neutral-200 leading-relaxed">
                          {post.caption}
                        </div>
                      )}

                      {post.image_url && (
                        <div className="relative w-full h-72 sm:h-96 bg-slate-900">
                          <Image src={post.image_url} alt="Resort update" fill className="object-cover" sizes="800px" />
                        </div>
                      )}
                    </div>
                  )) : (
                    <p className="rounded-xl border border-dashed border-slate-200 dark:border-neutral-800 p-6 text-center text-xs text-slate-500 dark:text-neutral-400">
                      No resort updates have been posted yet.
                    </p>
                  )}
                </div>

                {/* Photo Gallery Strip */}
                {galleryImages.length > 0 && (
                  <div className="pt-4 space-y-3">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-200">
                      Scenic Photo Gallery
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {galleryImages.map((img, i) => (
                        <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-xs">
                          <Image src={img} alt="Resort photo" fill className="object-cover" sizes="250px" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: COTTAGE ── */}
            {activeTab === 'cottages' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-[#1F3F74] dark:text-[#4987BA]">
                    Cottage &amp; Tables
                  </h2>
                  <p className="text-xs text-justify text-slate-500 dark:text-neutral-400">
                    Day-use shoreline shade and cottage options available at {beach.name}.
                  </p>
                </div>

                {beach.cottage_fee && (
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base Cottage Daily Rate</span>
                      <div className="text-lg font-extrabold text-[#1F3F74] dark:text-[#4987BA]">
                        ₱{beach.cottage_fee}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-neutral-400">Day access per cottage unit</span>
                  </div>
                )}

                {beach.cottages && beach.cottages.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {beach.cottages.map((cottage) => (
                      <CottageCard
                        key={cottage.id}
                        name={cottage.name}
                        imageUrl={cottage.image_url}
                        photoCount={cottage.photos?.length || 0}
                        price={cottage.price}
                        capacity={cottage.capacity}
                        description={cottage.description}
                        onView={() => {
                          setSelectedDetail({
                            name: cottage.name,
                            photos: cottage.photos?.length
                              ? cottage.photos
                              : cottage.image_url
                                ? [{ image_url: cottage.image_url }]
                                : [],
                            description: cottage.description,
                            capacity: cottage.capacity,
                            price: cottage.price,
                            priceUnit: 'day',
                          });
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-14 text-center rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/30 p-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-neutral-800 text-[#1F3F74] dark:text-[#4987BA] flex items-center justify-center mx-auto">
                      <Home className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-200">
                        No individual cottages listed yet
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
                        Specific cottage models, capacities, and rates will appear here once registered by {beach.name}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 4: FACILITIES ── */}
            {activeTab === 'facilities' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-[#1F3F74] dark:text-[#4987BA]">
                    Facilities
                  </h2>
                  <p className="text-xs text-justify text-slate-500 dark:text-neutral-400">
                    Verified guest accommodations, on-site parking, and resort amenities.
                  </p>
                </div>

                {beach.facility_items && beach.facility_items.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {beach.facility_items.map((facility) => (
                      <FacilityCard
                        key={facility.id}
                        name={facility.name}
                        category={facility.category}
                        imageUrl={facility.image_url}
                        description={facility.description}
                        basePrice={facility.price}
                        rates={facility.rates}
                        editable={false}
                        onView={() => {
                          setSelectedDetail({
                            name: facility.name,
                            photos: facility.photos?.length
                              ? facility.photos
                              : facility.image_url
                                ? [{ image_url: facility.image_url }]
                                : [],
                            description: facility.description,
                            infoLabel: getFacilityCategoryLabel(facility.category),
                            price: null,
                            priceLabel: 'Fee',
                            priceUnit: facility.category.toLowerCase() === 'room' ? 'night' : '',
                            feeItems: getFacilityFeeItems(facility.rates?.length ? facility.rates : facility.price),
                          });
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-14 text-center rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/30 p-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-neutral-800 text-[#1F3F74] dark:text-[#4987BA] flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-200">
                        No facilities listed yet
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
                        Guest room accommodations, visitor parking areas, and shoreline amenities will be published here once added.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 5: DO'S & DON'TS ── */}
            {activeTab === 'dos' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-[#1F3F74] dark:text-[#4987BA]">
                    Do&apos;s &amp; Don&apos;ts (Resort Guidelines)
                  </h2>
                  <p className="text-xs text-justify text-slate-500 dark:text-neutral-400">
                    Guidelines provided by {beach.name}.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="font-bold text-sm text-emerald-700 dark:text-emerald-400">
                      <span>Do&apos;s (Recommended Etiquette)</span>
                    </div>

                    <ul className="space-y-3 text-justify text-xs text-slate-700 dark:text-neutral-300">
                      {resortRules.filter((rule) => rule.type === 'do').map((rule) => (
                        <li key={rule.id} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                          <span className="block text-justify">
                            <strong>{rule.title}</strong>
                            {rule.description && `: ${rule.description}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {resortRules.every((rule) => rule.type !== 'do') && (
                      <p className="text-xs text-slate-500 dark:text-neutral-400">No guidelines provided.</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="font-bold text-sm text-rose-700 dark:text-rose-400">
                      <span>Don&apos;ts (Strictly Prohibited)</span>
                    </div>

                    <ul className="space-y-3 text-justify text-xs text-slate-700 dark:text-neutral-300">
                      {resortRules.filter((rule) => rule.type === 'dont').map((rule) => (
                        <li key={rule.id} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                          <span className="block text-justify">
                            <strong>{rule.title}</strong>
                            {rule.description && `: ${rule.description}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {resortRules.every((rule) => rule.type !== 'dont') && (
                      <p className="text-xs text-slate-500 dark:text-neutral-400">No restrictions provided.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 6: REVIEWS (Feedback Page Architecture with Review Form & 6 Rating Categories) ── */}
            {activeTab === 'reviews' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-[#1F3F74] dark:text-[#4987BA]">
                      Guest Community Reviews
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Share your experience and browse authentic visitor feedback for {beach.name}.
                    </p>
                  </div>
                  {Number(beach.average_rating) > 0 && (
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-extrabold">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{Number(beach.average_rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Interactive Review Drop Form (Same as Feedback Page) */}
                {signedIn ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!reviewComment.trim()) {
                        showToast('Please enter your review text.', 'error');
                        return;
                      }
                      setSubmittingReview(true);
                      try {
                        const res = await fetch(`/api/beaches/${encodeURIComponent(slug)}/reviews`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ rating: userRating, comment: reviewComment }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Failed to submit review.');
                        setBeachReviews((prev) => [data, ...prev]);
                        setReviewCount((prev) => prev + 1);
                        setReviewComment('');
                        showToast('Thank you! Your review has been posted.', 'success');
                      } catch (err: unknown) {
                        showToast(err instanceof Error ? err.message : 'Could not submit review.', 'error');
                      } finally {
                        setSubmittingReview(false);
                      }
                    }}
                    className="space-y-4 border-y border-slate-200 dark:border-neutral-800 py-6"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          Your rating
                        </span>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          {hoverRating !== null ? hoverRating : userRating} {(hoverRating !== null ? hoverRating : userRating) === 1 ? 'Star' : 'Stars'} &bull; {RATING_LABELS[hoverRating !== null ? hoverRating : userRating]}
                        </span>
                      </div>

                      {/* Interactive Stars with toggle & hover */}
                      <div
                        className="flex items-center gap-1.5"
                        role="radiogroup"
                        aria-label="Beach rating"
                        onMouseLeave={() => setHoverRating(null)}
                      >
                        {[1, 2, 3, 4, 5].map((value) => {
                          const currentVal = hoverRating !== null ? hoverRating : userRating;
                          const isLit = value <= currentVal;
                          return (
                            <button
                              key={value}
                              type="button"
                              role="radio"
                              aria-checked={userRating === value}
                              aria-label={`${value} stars`}
                              onClick={() => {
                                if (userRating === value) {
                                  setUserRating(Math.max(1, value - 1));
                                } else {
                                  setUserRating(value);
                                }
                              }}
                              onMouseEnter={() => setHoverRating(value)}
                              className="p-1 -m-1 text-slate-300 transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                              title={`Rate ${value} star${value > 1 ? 's' : ''}`}
                            >
                              <Star
                                className={`h-7 w-7 transition-colors duration-150 ${
                                  isLit ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-neutral-700'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="beach-review-comment" className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                        Your review
                      </label>
                      <textarea
                        id="beach-review-comment"
                        rows={3}
                        required
                        minLength={5}
                        maxLength={1000}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder={`Share your experience with cottages, beach swimming, and facilities at ${beach.name}...`}
                        className="w-full rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#1F3F74] dark:focus:border-[#4987BA] focus:outline-none focus:ring-1 focus:ring-[#1F3F74] dark:focus:ring-[#4987BA] transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-6 py-2.5 bg-[#1F3F74] hover:bg-[#285091] dark:bg-[#1F3F74] dark:hover:bg-[#285091] disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                    >
                      {submittingReview ? 'Submitting review...' : 'Submit review'}
                    </button>
                  </form>
                ) : (
                  <div className="py-5 px-6 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Have you visited {beach.name}?</h3>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Sign in to drop your verified rating and review.</p>
                    </div>
                    <Link
                      href="/auth/signin"
                      className="inline-flex items-center justify-center px-5 py-2 bg-[#1F3F74] hover:bg-[#285091] text-white text-xs font-bold rounded-full transition shadow-xs shrink-0"
                    >
                      Sign In to Review
                    </Link>
                  </div>
                )}

                {/* Rating Filter Categories: Equal Width across 6 columns (Matches Feedback Page) */}
                <div className="flex w-full gap-2 overflow-x-auto pt-2 pb-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 5, label: '5 Stars' },
                      { id: 4, label: '4 Stars' },
                      { id: 3, label: '3 Stars' },
                      { id: 2, label: '2 Stars' },
                      { id: 1, label: '1 Star' },
                    ] as const
                  ).map((category) => {
                    const count =
                      category.id === 'all'
                        ? beachReviews.length
                        : beachReviews.filter((r) => Math.round(Number(r.rating)) === category.id).length;
                    const isActive = reviewCategory === category.id;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setReviewCategory(category.id)}
                        className={`shrink-0 snap-start py-2 px-3 text-xs font-bold whitespace-nowrap rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#1F3F74] text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{category.label}</span>
                        <span
                          className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Reviews List or Clean Frameless Empty State (NO CARD CONTAINER) */}
                {(() => {
                  const filtered =
                    reviewCategory === 'all'
                      ? beachReviews
                      : beachReviews.filter((r) => Math.round(Number(r.rating)) === reviewCategory);

                  if (filtered.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-14 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500 mb-2">
                          <Star className="h-6 w-6 stroke-[1.5]" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                          No ratings yet
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="divide-y divide-slate-200 dark:divide-neutral-800">
                      {filtered.map((rev) => (
                        <article key={rev.id} className="py-5 space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {maskReviewerName(rev.user_name || rev.userName)}
                            </span>
                            <div className="flex items-center gap-1" aria-label={`${rev.rating} out of 5 stars`}>
                              {Array.from({ length: 5 }, (_, index) => (
                                <Star
                                  key={index}
                                  className={`h-3.5 w-3.5 ${
                                    index < Number(rev.rating)
                                      ? 'fill-amber-400 text-amber-500'
                                      : 'text-slate-300 dark:text-neutral-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {rev.comment}
                          </p>
                          {rev.created_at && (
                            <time className="block text-[11px] text-slate-400">
                              {new Date(rev.created_at).toLocaleDateString()}
                            </time>
                          )}
                        </article>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
        </div>
      </div>

      {/* ── Fullscreen Virtual Tour Viewer Modal ── */}
      <VirtualTourModal
        isOpen={showTourModal}
        onClose={() => setShowTourModal(false)}
        tourUrl={beach.virtual_tour_url}
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
