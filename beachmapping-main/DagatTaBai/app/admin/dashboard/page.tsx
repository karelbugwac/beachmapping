'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Users,
  MessageSquareText,
  RefreshCw,
} from 'lucide-react';
import { AnalyticsBarChart, type AnalyticsPoint } from '@/components/ui/analytics-bar-chart';
import { showToast } from '@/components/ui/feedback-toasts';
import { useRealtimeSync } from '@/lib/realtime-sync';
import { CoastalEmptyState } from '@/components/ui/coastal-empty-state';
import { BeachCottage, VerifiedSanctuary } from '@/components/ui/coastal-icons';

interface DashboardStats {
  pendingApplications: number | null;
  activeBeaches: number | null;
  totalReviews: number | null;
  totalUsers: number | null;
  loading: boolean;
}

function isAnalyticsPoint(point: unknown): point is AnalyticsPoint {
  return (
    typeof point === 'object' &&
    point !== null &&
    'date' in point &&
    'visitors' in point &&
    typeof point.date === 'string' &&
    Number.isFinite(new Date(`${point.date}T12:00:00`).getTime()) &&
    typeof point.visitors === 'number' &&
    Number.isFinite(point.visitors) &&
    point.visitors >= 0
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingApplications: null,
    activeBeaches: null,
    totalReviews: null,
    totalUsers: null,
    loading: true,
  });
  const [visitorPoints, setVisitorPoints] = useState<AnalyticsPoint[] | null>(null);
  const [visitorStatus, setVisitorStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const loadStats = async (): Promise<boolean | null> => {
    if (isFetchingRef.current) return null;
    isFetchingRef.current = true;
    try {
      const [appRes, beachRes, analyticsRes, reviewsRes, userRes] = await Promise.all([
        fetch('/api/applications', { cache: 'no-store' }),
        fetch('/api/beaches', { cache: 'no-store' }),
        fetch('/api/admin/analytics/visitors', { cache: 'no-store' }),
        fetch('/api/admin/reviews', { cache: 'no-store' }),
        fetch('/api/admin/users?summary=true', { cache: 'no-store' }),
      ]);

      const appData = appRes.ok ? await appRes.json() : null;
      const beachData = beachRes.ok ? await beachRes.json() : null;
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;
      const reviewsData = reviewsRes.ok ? await reviewsRes.json() : null;
      const userData = userRes.ok ? await userRes.json() : null;

      const apps = Array.isArray(appData?.applications)
        ? appData.applications as { status?: string }[]
        : null;
      const pending = apps?.filter((application) => application.status === 'pending').length ?? null;
      const beaches = Array.isArray(beachData) ? beachData : null;
      const reviews = Array.isArray(reviewsData?.reviews)
        ? reviewsData.reviews as { review_type?: string }[]
        : null;
      const totalReviews = reviews?.filter((review) => review.review_type !== 'platform').length ?? null;
      const totalUsers =
        typeof userData?.stats?.total === 'number'
          ? userData.stats.total
          : Array.isArray(userData?.users)
          ? userData.users.length
          : null;

      setStats({
        pendingApplications: pending,
        activeBeaches: beaches?.length ?? null,
        totalReviews,
        totalUsers,
        loading: false,
      });
      const rawPoints: unknown = analyticsData?.points;
      const points = Array.isArray(rawPoints) ? rawPoints.filter(isAnalyticsPoint) : null;
      const analyticsValid =
        analyticsRes.ok &&
        Array.isArray(rawPoints) &&
        points !== null &&
        points.length === rawPoints.length;
      if (!analyticsValid || points === null) {
        setVisitorPoints(null);
        setVisitorStatus('error');
      } else {
        setVisitorPoints(points);
        setVisitorStatus(points.length > 0 ? 'ready' : 'empty');
      }
      return (
        appRes.ok &&
        beachRes.ok &&
        reviewsRes.ok &&
        userRes.ok &&
        pending !== null &&
        beaches !== null &&
        totalReviews !== null &&
        totalUsers !== null &&
        analyticsValid
      );
    } catch (err) {
      console.error('Failed to load admin dashboard stats:', err);
      setStats({
        pendingApplications: null,
        activeBeaches: null,
        totalReviews: null,
        totalUsers: null,
        loading: false,
      });
      setVisitorPoints(null);
      setVisitorStatus('error');
      return false;
    } finally {
      isFetchingRef.current = false;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const refreshed = await loadStats();
    setRefreshing(false);
    if (refreshed === null) return;
    showToast(
      refreshed ? 'Overview refreshed.' : 'Some overview data could not be loaded. Please try again.',
      refreshed ? 'success' : 'error'
    );
  };

  useEffect(() => {
    void loadStats();
  }, []);

  useRealtimeSync(() => {
    void loadStats();
  });

  return (
    <div className="max-w-7xl mx-auto space-y-7 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Administration
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-neutral-400">
            Review ownership applications, listings, and community activity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-brand-700 shadow-2xs transition-colors hover:border-brand-500 active:bg-sand-100 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-sky-300 dark:active:bg-neutral-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      {stats.loading && (
        <p role="status" className="text-sm text-slate-600 dark:text-neutral-400">
          Loading dashboard metrics...
        </p>
      )}

      <div
        className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]"
        aria-busy={stats.loading}
      >
        <Link
          href="/admin/applications"
          className="group flex min-h-52 flex-col justify-between border-l-4 border-brand-600 bg-brand-700 p-5 text-white transition-colors hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-y dark:border-r dark:border-neutral-800 dark:border-l-4 dark:bg-neutral-900 dark:hover:bg-neutral-800 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wide text-white/75">
                Needs review
              </span>
              <div className="mt-4 text-4xl font-extrabold tabular-nums sm:text-5xl">
                {stats.loading ? '...' : stats.pendingApplications?.toLocaleString() ?? 'Unavailable'}
              </div>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-amber-300">
              <VerifiedSanctuary size={23} aria-hidden="true" />
            </span>
          </div>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <p className="max-w-xs text-sm leading-5 text-white/80">
              Owner applications waiting for an administrator decision.
            </p>
            <span className="rounded-lg border border-white/30 px-3 py-2 text-xs font-bold text-white transition-colors group-hover:bg-white/10">
              Review applications
            </span>
          </div>
        </Link>

        <div className="grid grid-cols-1 divide-y divide-slate-200 border-y border-slate-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:border">
          <Link
            href="/admin/beaches"
            className="group flex min-h-32 flex-col justify-between p-5 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sky-600 dark:hover:bg-neutral-800"
          >
            <BeachCottage size={22} className="text-sky-700 dark:text-sky-300" aria-hidden="true" />
            <div>
              <div className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {stats.loading ? '...' : stats.activeBeaches?.toLocaleString() ?? 'Unavailable'}
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-neutral-400">Active beaches</p>
            </div>
          </Link>
          <Link
            href="/admin/reviews"
            className="group flex min-h-32 flex-col justify-between p-5 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sky-600 dark:hover:bg-neutral-800"
          >
            <MessageSquareText className="h-[22px] w-[22px] text-brand-700 dark:text-sky-300" aria-hidden="true" />
            <div>
              <div className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {stats.loading ? '...' : stats.totalReviews?.toLocaleString() ?? 'Unavailable'}
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-neutral-400">Total reviews</p>
            </div>
          </Link>
          <Link
            href="/admin/users"
            className="group flex min-h-32 flex-col justify-between p-5 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sky-600 dark:hover:bg-neutral-800"
          >
            <Users className="h-[22px] w-[22px] text-brand-700 dark:text-sky-300" aria-hidden="true" />
            <div>
              <div className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {stats.loading ? '...' : stats.totalUsers?.toLocaleString() ?? 'Unavailable'}
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-neutral-400">Community members</p>
            </div>
          </Link>
        </div>
      </div>

      <section className="border-t border-slate-200 pt-6 dark:border-neutral-800">
        {visitorStatus === 'ready' && visitorPoints ? (
          <AnalyticsBarChart title="Visitors, last 7 days" points={visitorPoints} />
        ) : visitorStatus === 'loading' ? (
          <div className="py-14 text-center text-xs text-slate-500 dark:text-neutral-400">
            Loading visitor activity...
          </div>
        ) : (
          <CoastalEmptyState
            variant={visitorStatus === 'error' ? 'error' : 'empty'}
            title={visitorStatus === 'error' ? 'Visitor activity is unavailable' : 'No visitor activity yet'}
            description={
              visitorStatus === 'error'
                ? 'Visitor activity could not be loaded. Try refreshing the overview.'
                : 'Daily visitor activity will appear here as people explore Dagat Ta Bai.'
            }
            className="py-5"
          />
        )}
      </section>
    </div>
  );
}
