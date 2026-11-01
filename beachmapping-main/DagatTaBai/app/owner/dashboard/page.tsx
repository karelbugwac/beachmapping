'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Star,
  Users,
  Compass,
  ChevronRight,
  ExternalLink,
  Eye,
  Building,
} from 'lucide-react';
import type { BeachRecord } from '@/lib/db/beaches';
import { AnalyticsBarChart, type AnalyticsPoint } from '@/components/ui/analytics-bar-chart';

interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  recommendationRate: number;
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    user_name: string;
    created_at: string;
  }>;
}

export default function OwnerDashboardPage() {
  const [beach, setBeach] = useState<BeachRecord | null>(null);
  const [reviews, setReviews] = useState<ReviewAnalytics | null>(null);
  const [visitorPoints, setVisitorPoints] = useState<AnalyticsPoint[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Compute clean date only (e.g. "Sunday, November 1, 2026")
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  useEffect(() => {
    const loadDashboard = () =>
      Promise.all([
        fetch('/api/owner/beach', { cache: 'no-store' }).then((res) => (res.ok ? res.json() : [])),
        fetch('/api/owner/reviews', { cache: 'no-store' }).then((res) => (res.ok ? res.json() : null)),
        fetch('/api/owner/analytics', { cache: 'no-store' }).then((res) => (res.ok ? res.json() : null)),
      ])
        .then(([beaches, reviewData, visitorData]) => {
          if (Array.isArray(beaches) && beaches.length > 0) {
            setBeach(beaches[0]);
          }
          if (reviewData && typeof reviewData.totalReviews === 'number') {
            setReviews(reviewData);
          }
          if (Array.isArray(visitorData?.points)) {
            setVisitorPoints(visitorData.points);
          }
        })
        .catch((err) => {
          console.error('Failed to load dashboard data:', err);
        })
        .finally(() => {
          setLoading(false);
        });

    void loadDashboard();
    // Automatic refresh every 30s
    const interval = window.setInterval(loadDashboard, 30000);
    return () => window.clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1F3F74] border-t-transparent" />
        <p className="text-xs font-semibold text-[#1F3F74] dark:text-[#4987BA]">
          Loading your resort dashboard...
        </p>
      </div>
    );
  }

  const beachName = beach?.name || 'Catmon Beach Resort';
  const rating = reviews?.averageRating || beach?.average_rating || 0;
  const reviewCount = reviews?.totalReviews || 0;
  const hasTour = Boolean(beach?.virtual_tour_url);

  // Total visits calculation
  const totalVisits = visitorPoints
    ? visitorPoints.reduce((acc, p) => acc + p.visitors, 0)
    : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* ── 1. Hero Overview Header (No Manage Listing button, no Binongkalan badge, date ONLY under name) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F3F74] dark:text-[#4987BA] tracking-tight font-sans">
            {beachName}
          </h1>
          {/* Date ONLY under name, no description, no Catmon prefix */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1 font-medium">
            {formattedDate}
          </p>
        </div>

        {beach?.slug && (
          <div className="flex items-center gap-2.5">
            <Link
              href={`/beaches/${beach.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-[#1F3F74] dark:text-[#4987BA] text-xs font-bold rounded-full transition-all border border-slate-200 dark:border-neutral-800 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Public Page</span>
            </Link>
          </div>
        )}
      </div>

      {/* ── 2. Real Metrics KPI Grid (EXACTLY 4 SQUARES) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Visitor Rating */}
        <Link
          href="/owner/reviews"
          className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/90 dark:border-neutral-800 shadow-2xs hover:border-[#1F3F74]/60 dark:hover:border-[#4987BA]/60 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">Visitor Rating</span>
              <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-500">
                <Star className="w-4 h-4 fill-amber-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-[#1F3F74] dark:text-[#4987BA]">
                {rating > 0 ? rating.toFixed(1) : '0.0'}
              </span>
              <span className="text-xs text-slate-400 dark:text-neutral-500 font-medium">/ 5.0</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2 flex items-center gap-1 group-hover:text-[#1F3F74] dark:group-hover:text-[#4987BA] transition-colors font-medium">
            <span>{reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
            <ChevronRight className="w-3 h-3" />
          </p>
        </Link>

        {/* Card 2: Total Page Views */}
        <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/90 dark:border-neutral-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">Total Visits</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#1F3F74] dark:text-[#4987BA]">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-[#1F3F74] dark:text-[#4987BA]">
                {totalVisits}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">+14%</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2 font-medium">
            Last 7 days discovery
          </p>
        </div>

        {/* Card 3: Active Cottages & Units */}
        <Link
          href="/owner/beach"
          className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/90 dark:border-neutral-800 shadow-2xs hover:border-[#1F3F74]/60 dark:hover:border-[#4987BA]/60 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">Cottages &amp; Sheds</span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-[#1F3F74] dark:text-[#4987BA]">
                Available
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2 group-hover:text-[#1F3F74] dark:group-hover:text-[#4987BA] transition-colors flex items-center gap-1 font-medium">
            <span>Manage units &amp; rates</span>
            <ChevronRight className="w-3 h-3" />
          </p>
        </Link>

        {/* Card 4: 360° Virtual Tour */}
        <Link
          href="/owner/beach#tour"
          className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/90 dark:border-neutral-800 shadow-2xs hover:border-[#1F3F74]/60 dark:hover:border-[#4987BA]/60 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">360° Virtual Tour</span>
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${hasTour ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-sm sm:text-base font-bold text-[#1F3F74] dark:text-[#4987BA] truncate">
                {hasTour ? 'Active' : 'Available'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2 group-hover:text-[#1F3F74] dark:group-hover:text-[#4987BA] transition-colors flex items-center gap-1 font-medium">
            <span>Request recapture</span>
            <ChevronRight className="w-3 h-3" />
          </p>
        </Link>

      </div>

      {/* ── 3. Improved Resort Page Views Bar Graph ── */}
      {visitorPoints && (
        <section className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/90 dark:border-neutral-800 shadow-2xs">
          <AnalyticsBarChart
            title="Resort Page Views"
            points={visitorPoints}
          />
        </section>
      )}

      {/* ── 4. Recent Guest Reviews Feed ── */}
      <section className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/90 dark:border-neutral-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans flex items-center gap-2">
            <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
            <span>Recent Guest Reviews</span>
          </h2>
          <Link
            href="/owner/reviews"
            className="text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] hover:underline flex items-center gap-1"
          >
            <span>View All ({reviewCount})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {reviews?.reviews && reviews.reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.reviews.slice(0, 4).map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl bg-slate-50/70 dark:bg-neutral-950 border border-slate-200/70 dark:border-neutral-800 space-y-2 transition-all hover:border-[#1F3F74]/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {r.user_name || 'Verified Visitor'}
                    </span>
                    <div className="flex items-center text-amber-400 text-xs">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                  {r.comment}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-slate-50/50 dark:bg-neutral-950/50 border border-slate-200/50 dark:border-neutral-800">
            <Users className="w-8 h-8 text-slate-400 dark:text-neutral-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              No guest reviews posted yet
            </p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
              When tourists visit your beach and leave reviews, they will automatically appear here.
            </p>
          </div>
        )}
      </section>

    </div>
  );
}
