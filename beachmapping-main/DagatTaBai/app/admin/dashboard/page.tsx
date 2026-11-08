'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Palmtree,
  Clock,
  MessageSquare,
  Users,
  RefreshCw,
} from 'lucide-react';
import { AnalyticsBarChart, type AnalyticsPoint } from '@/components/ui/analytics-bar-chart';
import { showToast } from '@/components/ui/feedback-toasts';
import { useRealtimeSync } from '@/lib/realtime-sync';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    pendingApplications: 0,
    activeBeaches: 0,
    totalReviews: 0,
    totalUsers: 0,
    loading: true,
  });
  const [visitorPoints, setVisitorPoints] = useState<AnalyticsPoint[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const loadStats = async () => {
    if (isFetchingRef.current) return;
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

      const apps = Array.isArray(appData?.applications) ? appData.applications : [];
      const pending = apps.filter((a: any) => a.status === 'pending').length;
      const beaches = Array.isArray(beachData) ? beachData : [];
      const totalReviews = Array.isArray(reviewsData?.reviews)
        ? reviewsData.reviews.filter((r: any) => r.review_type !== 'platform').length
        : 0;
      const totalUsers =
        typeof userData?.stats?.total === 'number'
          ? userData.stats.total
          : Array.isArray(userData?.users)
          ? userData.users.length
          : 0;

      setStats({
        pendingApplications: pending,
        activeBeaches: beaches.length,
        totalReviews,
        totalUsers,
        loading: false,
      });
      setVisitorPoints(Array.isArray(analyticsData?.points) ? analyticsData.points : null);
    } catch (err) {
      console.error('Failed to load admin dashboard stats:', err);
      setStats((prev) => ({ ...prev, loading: false }));
    } finally {
      isFetchingRef.current = false;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
    showToast('Overview refreshed.');
  };

  useEffect(() => {
    void loadStats();
  }, []);

  useRealtimeSync(() => {
    void loadStats();
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F3F74] dark:text-white">
          Overview
        </h1>

        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] hover:border-[#4987BA] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/admin/applications"
          className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-2xs hover:border-yellow-500 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
              Pending Applications
            </span>
            <Clock className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="mt-1 text-2xl font-extrabold text-yellow-500 dark:text-yellow-400">
            {stats.loading ? '...' : stats.pendingApplications}
          </div>
        </Link>

        <Link
          href="/admin/beaches"
          className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-2xs hover:border-sky-500 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
              Active Beaches
            </span>
            <Palmtree className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-1 text-2xl font-extrabold text-sky-500 dark:text-sky-400">
            {stats.loading ? '...' : stats.activeBeaches}
          </div>
        </Link>

        <Link
          href="/admin/beaches"
          className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-2xs hover:border-sky-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
              Total Reviews
            </span>
            <MessageSquare className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-1 text-2xl font-extrabold text-sky-500 dark:text-sky-300">
            {stats.loading ? '...' : stats.totalReviews}
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-2xs hover:border-[#4987BA] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
              Total Users
            </span>
            <Users className="w-4 h-4 text-[#1F3F74] dark:text-[#38BDF8]" />
          </div>
          <div className="mt-1 text-2xl font-extrabold text-[#1F3F74] dark:text-white">
            {stats.loading ? '...' : stats.totalUsers}
          </div>
        </Link>
      </div>

      {/* Platform Visitors Chart */}
      <section className="bg-white dark:bg-neutral-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-2xs">
        {visitorPoints ? (
          <AnalyticsBarChart title="Platform Visitors" points={visitorPoints} />
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-neutral-500">
            Loading visitors...
          </div>
        )}
      </section>
    </div>
  );
}
