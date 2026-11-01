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
  ChevronRight,
  Images,
  Home,
  Info,
  ShieldCheck,
  Compass,
  Navigation,
  Share2,
  CheckCircle2,
  XCircle,
  Users,
  AlertTriangle,
  Heart,
  MessageSquare,
  Sparkles,
  UtensilsCrossed,
  Volume2,
  Flame,
  Zap,
} from 'lucide-react';
import type { BeachRecord } from '@/lib/db/beaches';
import { VirtualTourModal } from '@/components/virtual-tour-modal';
import { showToast } from '@/components/ui/feedback-toasts';

interface CottageItem {
  id: string;
  name: string;
  price: string;
  capacity: string;
  description: string;
  image_url: string;
}

interface FacilityItem {
  id: string;
  title: string;
  category: 'parking' | 'equipment' | 'amenity' | 'safety';
  price: string;
  description: string;
  image_url: string;
}

interface ResortPostItem {
  id: string;
  caption: string;
  image_url?: string;
  created_at: string;
  likes: number;
}

const DEFAULT_COTTAGES_AND_ROOMS: CottageItem[] = [
  {
    id: 'cot-1',
    name: 'Open Air Bamboo Cottage',
    price: '500',
    capacity: '10 - 15 persons',
    description: 'Shaded shoreline cottage made of natural bamboo with wooden picnic table and direct beach access.',
    image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'cot-2',
    name: 'Family Umbrella Gazebo',
    price: '800',
    capacity: '15 - 20 persons',
    description: 'Spacious octagonal gazebo with electrical outlets, grilling station access, and panoramic ocean views.',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'cot-3',
    name: 'Air-Conditioned Day-Use Room',
    price: '1,500',
    capacity: '4 - 6 persons',
    description: 'Air-conditioned private room with queen bed, en-suite bathroom, fresh towels, and seaside veranda.',
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'cot-4',
    name: 'Sunset Oceanfront Shed',
    price: '1,200',
    capacity: '20 - 25 persons',
    description: 'Prime waterfront cottage right by the shoreline, ideal for day tours, birthdays, and family gatherings.',
    image_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80',
  },
];

const DEFAULT_FACILITIES: FacilityItem[] = [
  {
    id: 'fac-1',
    title: 'Secured Visitor Parking',
    category: 'parking',
    price: 'Free',
    description: 'Wide, well-lit parking area accommodating cars, motorcycles, and tourist vans with staff monitoring.',
    image_url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'fac-2',
    title: 'Snorkeling Gear & Life Vests',
    category: 'equipment',
    price: '150',
    description: 'Clean, sanitized life vests (adult & kids sizes) and underwater snorkeling masks available for daily rental.',
    image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'fac-3',
    title: 'Freshwater Showers & Restrooms',
    category: 'amenity',
    price: '20',
    description: 'Clean, well-maintained rinsing stations and private changing cabins with fresh running water.',
    image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'fac-4',
    title: 'Lifeguard & First Aid Station',
    category: 'safety',
    price: 'Included',
    description: 'Trained coastal lifeguard post and certified emergency first-aid station operational during swimming hours.',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  },
];

const DEFAULT_RESORT_POSTS: ResortPostItem[] = [
  {
    id: 'post-1',
    caption: 'Sunny morning tide here in Binongkalan! Crystal clear water and cool gentle breeze for all guests today.',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    created_at: '2 days ago',
    likes: 18,
  },
  {
    id: 'post-2',
    caption: 'Newly renovated family bamboo cottages now open for weekend bookings. Message us or call for inquiries!',
    image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    created_at: '5 days ago',
    likes: 24,
  },
];

function formatEntranceFeeSummary(beach: BeachRecord): string {
  if (beach.entrance_fee_adults && beach.entrance_fee_children) {
    if (beach.entrance_fee_adults === beach.entrance_fee_children) {
      return `₱${beach.entrance_fee_adults}`;
    }
    return `₱${beach.entrance_fee_adults} / ₱${beach.entrance_fee_children}`;
  }
  if (beach.entrance_fee) {
    if (beach.entrance_fee.includes('|')) {
      const [adults, children] = beach.entrance_fee.split('|');
      if (adults && children && adults === children) return `₱${adults}`;
      if (adults && children) return `₱${adults} / ₱${children}`;
      if (adults) return `₱${adults}`;
    }
    return beach.entrance_fee.startsWith('₱') ? beach.entrance_fee : `₱${beach.entrance_fee}`;
  }
  return 'Contact resort';
}

function formatOpeningHoursSummary(openingHours: string | Record<string, string> | null | undefined): string {
  if (!openingHours) return 'Daily: 8:00 AM - 6:00 PM';
  if (typeof openingHours === 'string') {
    if (openingHours.startsWith('{')) {
      try {
        const parsed = JSON.parse(openingHours);
        return formatOpeningHoursSummary(parsed);
      } catch {
        return openingHours;
      }
    }
    return openingHours;
  }
  if (typeof openingHours === 'object') {
    const sample = openingHours['Mon'] || openingHours['Sat'] || Object.values(openingHours)[0];
    return sample ? `Daily: ${sample}` : 'Daily: 8:00 AM - 6:00 PM';
  }
  return 'Daily: 8:00 AM - 6:00 PM';
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
  const [activeFacilityCategory, setActiveFacilityCategory] = useState<string>('all');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

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

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share && beach) {
      try {
        await navigator.share({
          title: beach.name,
          text: `Check out ${beach.name} on Dagat Ta Bai in Binongkalan, Catmon, Cebu!`,
          url: window.location.href,
        });
      } catch {}
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Beach link copied to clipboard!', 'success');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-white dark:bg-black text-[#1F3F74] dark:text-[#4987BA]">
        <div className="animate-spin rounded-full h-9 w-9 border-3 border-[#1F3F74] dark:border-[#4987BA] border-t-transparent" />
        <p className="text-xs font-bold tracking-wide">Loading beach profile...</p>
      </div>
    );
  }

  if (notFound || !beach) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 bg-white dark:bg-black text-center px-4">
        <Compass className="w-12 h-12 text-[#1F3F74] dark:text-[#4987BA] opacity-60" />
        <h2 className="text-xl font-extrabold text-[#1F3F74] dark:text-[#4987BA]">Beach destination not found</h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm">
          We couldn&apos;t locate this beach listing in Barangay Binongkalan. It may have been updated or moved.
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

  const filteredFacilities = activeFacilityCategory === 'all'
    ? DEFAULT_FACILITIES
    : DEFAULT_FACILITIES.filter((f) => f.category === activeFacilityCategory);

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

        {/* Top Floating Controls on Edge-to-Edge Hero: Back to Map & Share */}
        <div className="absolute top-5 left-4 right-4 sm:left-8 sm:right-8 flex items-center justify-between z-20">
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20 transition-all shadow-md group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Map</span>
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20 transition-all shadow-md cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-300" />
            <span>Share</span>
          </button>
        </div>

        {/* Clean Hero Bottom: Title & Rating ONLY (No overlay buttons or badges) */}
        <div className="absolute bottom-6 left-4 right-4 sm:left-8 sm:right-8 flex items-end justify-between gap-4 text-white z-20">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-sans text-white drop-shadow-md">
              {beach.name}
            </h1>
            <p className="text-xs sm:text-sm text-sky-200 flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
              <span>{beach.location || 'Barangay Binongkalan, Catmon, Cebu'}</span>
            </p>
          </div>

          <div className="bg-black/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 border border-white/20 shadow-md">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{(Number(beach.average_rating) || 5.0).toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* ── 2. RESORT DETAILS, HOURS, ABOUT & CONTACT (BEFORE CATEGORIES) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="space-y-4">
          {/* Top Status Line: Open Now Badge + Opening Schedule + Entrance Admission */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Open Now</span>
            </span>

            <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-neutral-300 font-semibold">
              <Clock className="w-3.5 h-3.5 text-[#1F3F74] dark:text-[#4987BA]" />
              <span>{formatOpeningHoursSummary(beach.opening_hours)}</span>
            </div>

            {beach.entrance_fee && (
              <>
                <span className="text-slate-300 dark:text-neutral-700">•</span>
                <span className="text-xs font-bold text-[#1F3F74] dark:text-[#4987BA]">
                  Entrance: {formatEntranceFeeSummary(beach)}
                </span>
              </>
            )}
          </div>

          {/* About / Description of Resort */}
          <p className="text-xs sm:text-sm text-slate-700 dark:text-neutral-300 leading-relaxed max-w-4xl">
            {beach.description ||
              `${beach.name} is a certified coastal haven situated in Barangay Binongkalan, Catmon, Cebu. It features refreshing ocean tides, safe swimming zones, clean shoreline cottages, and authentic Cebuano coastal ambiance for tourists and families.`}
          </p>

          {/* Quick Contact & Facebook Link Row */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-xs text-slate-600 dark:text-neutral-400 pt-1 border-t border-slate-100 dark:border-neutral-900">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA] flex-shrink-0" />
              <span>{beach.location || 'Barangay Binongkalan, Catmon, Cebu'}</span>
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

            {beach.facebook_url ? (
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
            ) : (
              <a
                href={`https://www.facebook.com/search/top?q=${encodeURIComponent(beach.name + ' Catmon')}`}
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

            <Link
              href={`/map?beach=${beach.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#1F3F74] hover:bg-[#285091] text-white text-xs font-bold rounded-full transition shadow-xs sm:ml-auto"
            >
              <Navigation className="w-3 h-3" />
              <span>Navigate in Map</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3. CATEGORY TABS (Pill Style, Signature Dive Blue) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-neutral-800 no-scrollbar">
          {[
            { id: 'general', label: 'General Info', icon: Info },
            { id: 'posts', label: 'Posts', icon: Images },
            { id: 'cottages', label: 'Cottages', icon: Home },
            { id: 'facilities', label: 'Facilities & Rooms', icon: ShieldCheck },
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
              {/* 360° Virtual Tour Experience */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#1F3F74] dark:text-[#4987BA] flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA]" />
                    <span>360° Virtual Tour Experience</span>
                  </h3>
                  {beach.virtual_tour_url && (
                    <button
                      type="button"
                      onClick={() => setShowTourModal(true)}
                      className="text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] hover:underline cursor-pointer"
                    >
                      Fullscreen Tour ↗
                    </button>
                  )}
                </div>

                {beach.virtual_tour_url ? (
                  <div className="relative w-full h-80 sm:h-96 md:h-[460px] rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-neutral-800 shadow-md">
                    <iframe
                      src={beach.virtual_tour_url}
                      title={`${beach.name} 360 Tour`}
                      className="w-full h-full border-0"
                      allow="accelerometer; gyroscope; magnetometer; fullscreen"
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/30 space-y-2">
                    <Compass className="w-8 h-8 mx-auto text-[#1F3F74] dark:text-[#4987BA] opacity-70" />
                    <p className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                      360° Panoramic Tour Scheduled
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      High-definition drone and ground 360° spheres are being captured by Municipal Tourism for this beach resort.
                    </p>
                  </div>
                )}
              </div>

              {/* Admission & Schedule Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entrance Admission</span>
                  <div className="text-base font-extrabold text-[#1F3F74] dark:text-[#4987BA]">
                    {formatEntranceFeeSummary(beach)}
                  </div>
                  <p className="text-[11px] text-slate-500">Day access per guest</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operating Schedule</span>
                  <div className="text-base font-extrabold text-[#1F3F74] dark:text-[#4987BA]">
                    {formatOpeningHoursSummary(beach.opening_hours)}
                  </div>
                  <p className="text-[11px] text-slate-500">Daily beach & swimming hours</p>
                </div>
              </div>
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
                  {DEFAULT_RESORT_POSTS.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 overflow-hidden shadow-xs space-y-3"
                    >
                      <div className="p-4 flex items-center gap-3 border-b border-slate-100 dark:border-neutral-800">
                        <div className="w-9 h-9 rounded-full bg-[#1F3F74] text-white flex items-center justify-center font-bold text-xs">
                          {beach.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{beach.name}</h4>
                          <span className="text-[10px] text-slate-400">{post.created_at}</span>
                        </div>
                      </div>

                      <div className="px-4 text-xs text-slate-800 dark:text-neutral-200 leading-relaxed">
                        {post.caption}
                      </div>

                      {post.image_url && (
                        <div className="relative w-full h-72 sm:h-96 bg-slate-900">
                          <Image src={post.image_url} alt="Post image" fill className="object-cover" sizes="800px" />
                        </div>
                      )}

                      <div className="px-4 py-2.5 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 dark:border-neutral-800">
                        <div className="flex items-center gap-1.5 text-rose-500 font-semibold">
                          <Heart className="w-4 h-4 fill-rose-500" />
                          <span>{post.likes} Likes</span>
                        </div>
                      </div>
                    </div>
                  ))}
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

            {/* ── TAB 3: COTTAGES ── */}
            {activeTab === 'cottages' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-[#1F3F74] dark:text-[#4987BA]">
                    Cottages &amp; Rates
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
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

                {/* Clean authentic empty state when individual cottage catalog is not yet populated */}
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
              </div>
            )}

            {/* ── TAB 4: FACILITIES & ROOMS ── */}
            {activeTab === 'facilities' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-[#1F3F74] dark:text-[#4987BA]">
                    Facilities &amp; Rooms
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Verified guest accommodations, on-site parking, and resort amenities.
                  </p>
                </div>

                {beach.amenities && beach.amenities.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {beach.amenities.map((amenity, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-neutral-200"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA] flex-shrink-0" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-14 text-center rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/30 p-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-neutral-800 text-[#1F3F74] dark:text-[#4987BA] flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-200">
                        No facilities or rooms listed yet
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
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Important rules and safety etiquette to keep Barangay Binongkalan beaches clean and enjoyable for everyone.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* DO'S (Allowed & Recommended) */}
                  <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>Do&apos;s (Recommended Etiquette)</span>
                    </div>

                    <ul className="space-y-3 text-xs text-slate-700 dark:text-neutral-300">
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <span><strong>Wear appropriate swimwear:</strong> Standard bathing suits and rash guards are encouraged for swimming safety.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <span><strong>Use life vests:</strong> Non-swimmers and children should wear life jackets when wading into deep or coral areas.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <span><strong>Dispose trash responsibly:</strong> Place all plastic containers and wrappers into designated segregation bins.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <span><strong>Park in designated lots:</strong> Coordinate with the entrance staff to park motorbikes and cars in safe allocated spaces.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <span><strong>Supervise children:</strong> Always keep children within arm&apos;s reach when near tidal waters.</span>
                      </li>
                    </ul>
                  </div>

                  {/* DON'TS (Strictly Prohibited) */}
                  <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 space-y-4">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
                      <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <span>Don&apos;ts (Strictly Prohibited)</span>
                    </div>

                    <ul className="space-y-3 text-xs text-slate-700 dark:text-neutral-300">
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                        <span><strong>No glass bottles on the beach:</strong> Breakable glass containers are strictly barred on sand to prevent tourist injuries.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                        <span><strong>No open sand bonfires:</strong> Open ground fires without grilling equipment are prohibited under local barangay ordinances.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                        <span><strong>No loud noise past curfew:</strong> High-volume videoke and sound systems must be lowered after 9:00 PM.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                        <span><strong>No marine disturbance:</strong> Do not break coral heads, collect sea creatures, or remove natural shoreline rocks.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                        <span><strong>No unleashed pets in dining areas:</strong> Pets must be leashed in shared cottage walkways.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 6: REVIEWS (No hardcoded reviews; clean empty state with icon) ── */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-[#1F3F74] dark:text-[#4987BA]">
                      Guest Community Reviews
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Ratings and feedback from tourists who visited {beach.name}.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-extrabold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{(Number(beach.average_rating) || 5.0).toFixed(1)}</span>
                  </div>
                </div>

                {/* Clean, authentic empty state with icon */}
                <div className="py-14 text-center rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/30 p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-neutral-800 text-[#1F3F74] dark:text-[#4987BA] flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-200">
                      No reviews yet
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
                      Be the first visitor to share your beach experience and cottage rating for {beach.name}!
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/map"
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#1F3F74] hover:bg-[#285091] text-white text-xs font-bold rounded-full transition shadow-md"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Explore in Map</span>
                    </Link>
                  </div>
                </div>
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
    </div>
  );
}
