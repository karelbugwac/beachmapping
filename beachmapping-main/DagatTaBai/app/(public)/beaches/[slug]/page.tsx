'use client';

import React, { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Clock,
  MapPin,
  Star,
  ArrowLeft,
  Phone,
  ExternalLink,
  ChevronRight,
  Images,
  Home,
  Info,
  ShieldCheck,
  Activity,
  Coffee,
  MessageSquare,
} from 'lucide-react';
import type { BeachRecord } from '@/lib/db/beaches';

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
  const [activeTab, setActiveTab] = useState('overview');

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (notFound || !beach) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Beach not found</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'general', label: 'General Info', icon: Home },
    { id: 'cottages', label: 'Cottages', icon: Home },
    { id: 'facilities', label: 'Facilities', icon: ShieldCheck },
    { id: 'activities', label: 'Activities', icon: Activity },
    { id: 'dos', label: "Do's & Don'ts", icon: ShieldCheck },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
            Dagat Ta Bai
          </Link>

          {/* Menu Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              Home
            </Link>
            <Link href="/weather" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              Weather
            </Link>
            <Link href="/about" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              Contact
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Sign Up
            </button>
            <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section (Split Layout) */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Beach Info */}
          <div className="space-y-6">
            <Link href="/beaches" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
              <ArrowLeft size={16} />
              <span>Back to Beaches</span>
            </Link>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{beach.location}</p>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">{beach.name}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{beach.description}</p>
              {beach.virtual_tour_url && (
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Explore 360° Tour
                </button>
              )}
            </div>
          </div>

          {/* Right: Image Carousel */}
          <div className="relative h-64 lg:h-96 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800">
            {beach.cover_image ? (
              <Image
                src={beach.cover_image}
                alt={beach.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Images size={48} />
              </div>
            )}
            {/* Carousel Controls */}
            <button className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 dark:bg-gray-900/90 rounded-full hover:bg-white dark:hover:bg-gray-900 transition-colors">
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 dark:bg-gray-900/90 rounded-full hover:bg-white dark:hover:bg-gray-900 transition-colors">
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
              1/6
            </div>
          </div>
        </div>
      </div>

      {/* Quick-Facts Strip */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">{beach.average_rating.toFixed(1)}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">{beach.entrance_fee || 'Not listed'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Entrance Fee</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">{beach.opening_hours}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Opening Hours</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1 truncate">{beach.location}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation (Pill Style) */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area (Two-Column Layout) */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Section */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Overview Block: Text + Image Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Text */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Overview</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{beach.description}</p>
                  </div>

                  {/* Right: Image Gallery */}
                  {beach.images && beach.images.length > 0 && (
                    <div className="space-y-2">
                      <div className="relative aspect-video rounded-lg bg-gray-200 dark:bg-gray-800 overflow-hidden">
                        {beach.images[0] && (
                          <Image
                            src={beach.images[0].photo_url}
                            alt={beach.images[0].caption}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {beach.images.slice(1, 5).map((img, idx) => (
                          <div key={idx} className="aspect-square rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
                            <Image
                              src={img.photo_url}
                              alt={img.caption}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* What's Available Here (Swipeable Cards) */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">What's available here?</h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {['Cottages', 'Facilities', 'Activities', 'Food & Drinks'].map((category) => (
                      <div key={category} className="flex-shrink-0 w-48 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{category}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Swipe to explore →</p>
                </div>

                {/* Guest Reviews */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Guest Reviews</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-gray-900 dark:text-white">{beach.average_rating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Based on {reviewCount} reviews</span>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-6">
                    {['All', '5★', '4★', '3★', '2★', '1★', 'With Photos'].map((filter) => (
                      <button
                        key={filter}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                  {/* Review Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((idx) => (
                      <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600" />
                          <div>
                            <p className="text-xs font-medium text-gray-900 dark:text-white">Guest {idx}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">2 days ago</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={12} className="text-yellow-500 fill-yellow-500" />
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Great beach experience!</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>❤️</span>
                          <span>12</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs placeholder */}
            {activeTab !== 'overview' && (
              <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-400">{activeTab} content coming soon</p>
              </div>
            )}
          </div>

          {/* Right Column (1/3) - Sidebar */}
          <div className="space-y-6">
            {/* General Information Card */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">General Information</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Opening Hours</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{beach.opening_hours}</p>
                </div>

                {beach.entrance_fee && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Entrance Fee</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{beach.entrance_fee}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Location</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{beach.location}</p>
                  <Link
                    href={`/map?beach=${beach.id}`}
                    className="text-blue-600 dark:text-blue-400 text-xs font-medium hover:underline flex items-center gap-1"
                  >
                    <ExternalLink size={12} />
                    View on Map
                  </Link>
                </div>

                {beach.contact_phone && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Contact</p>
                    <a
                      href={`tel:${beach.contact_phone}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Phone size={14} />
                      {beach.contact_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Cottage Rates Card */}
            {beach.cottage_fee && (
              <div className="p-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Cottage Rates</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">From {beach.cottage_fee}</p>
                <button className="text-blue-600 dark:text-blue-400 text-xs font-medium hover:underline mt-2">
                  View Cottage Details →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
