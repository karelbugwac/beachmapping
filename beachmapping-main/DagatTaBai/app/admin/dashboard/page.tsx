'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileCheck,
  Palmtree,
  MessageSquare,
  ArrowRight,
  Clock,
  CheckCircle2,
  RefreshCw,
  Users,
} from 'lucide-react';
import { AnalyticsBarChart, type AnalyticsPoint } from '@/components/ui/analytics-bar-chart';
import { showToast } from '@/components/ui/feedback-toasts';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    pendingApplications: 0,
    totalApplications: 0,
    activeBeaches: 0,
    totalVisitors: 0,
    pendingTours: 0,
    pendingCoords: 0,
    totalUsers: 0,
    loading: true,
  });
  const [visitorPoints, setVisitorPoints] = useState<AnalyticsPoint[] | null>(null);

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('AdminDashboardPage mounted');
    console.log('Current URL:', window.location.href);
  }, []);

  const loadStats = async () => {
    try {
      const [appRes, beachRes, analyticsRes, tourRes, coordRes, userRes] = await Promise.all([
        fetch('/api/applications', { cache: 'no-store' }),
        fetch('/api/beaches', { cache: 'no-store' }),
        fetch('/api/admin/analytics/visitors', { cache: 'no-store' }),
        fetch('/api/admin/beaches/tour-requests', { cache: 'no-store' }),
        fetch('/api/admin/beaches/coordinate-requests', { cache: 'no-store' }),
        fetch('/api/admin/users', { cache: 'no-store' }),
      ]);

      const appData = await appRes.json();
      const beachData = await beachRes.json();
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;
      const tourData = tourRes.ok ? await tourRes.json() : null;
      const coordData = coordRes.ok ? await coordRes.json() : null;
      const userData = userRes.ok ? await userRes.json() : null;

      const apps = Array.isArray(appData.applications) ? appData.applications : [];
      const pending = apps.filter((a: any) => a.status === 'pending').length;
      const beaches = Array.isArray(beachData) ? beachData : [];
      const totalVisitors = analyticsData?.totalVisitors || 0;
      const pendingTours = typeof tourData?.pendingCount === 'number' ? tourData.pendingCount : 0;
      const pendingCoords = typeof coordData?.pendingCount === 'number' ? coordData.pendingCount : 0;
      const totalUsers = typeof userData?.stats?.total === 'number' ? userData.stats.total : (Array.isArray(userData?.users) ? userData.users.length : 0);

      setStats({
        pendingApplications: pending,
        totalApplications: apps.length,
        activeBeaches: beaches.length,
        totalVisitors,
        pendingTours,
        pendingCoords,
        totalUsers,
        loading: false,
      });
      setVisitorPoints(Array.isArray(analyticsData?.points) ? analyticsData.points : null);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      showToast(err instanceof Error ? err.message : 'Failed to load dashboard data.', 'error');
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadStats(), 0);
    const interval = window.setInterval(loadStats, 30000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-slate-900 dark:bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 text-[11px] font-bold uppercase tracking-[0.14em]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Municipality Administrator Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Municipal Admin Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Manage resort owner applications, verify legal permits, and oversee certified beach listings across Catmon, Cebu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadStats}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${stats.loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>

          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-sky-600/30"
          >
            <FileCheck className="w-4 h-4" />
            <span>Review Applications</span>
          </Link>
        </div>
      </div>

      <section className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        {visitorPoints ? (
          <AnalyticsBarChart title="Platform Visitors" points={visitorPoints} />
        ) : (
          <p className="text-sm text-slate-500">Platform visitor analytics are unavailable.</p>
        )}
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link
          href="/admin/applications"
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-sky-400 transition-all duration-150 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pending Applications
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-amber-600 leading-none">
            {stats.loading ? '...' : stats.pendingApplications}
          </div>
          <span className="mt-2 block text-[11px] text-slate-400 group-hover:text-sky-600 transition-colors">
            Permit review required →
          </span>
        </Link>

        <Link
          href="/admin/beaches"
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-sky-400 transition-all duration-150 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Active Beach Listings
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center">
              <Palmtree className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-sky-600 leading-none">
            {stats.loading ? '...' : stats.activeBeaches}
          </div>
          <span className="mt-2 block text-[11px] text-slate-400 group-hover:text-sky-600 transition-colors">
            Live in Catmon map →
          </span>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-sky-400 transition-all duration-150 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Registered Users
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-indigo-600 leading-none">
            {stats.loading ? '...' : stats.totalUsers}
          </div>
          <span className="mt-2 block text-[11px] text-slate-400 group-hover:text-sky-600 transition-colors">
            Manage citizens &amp; owners →
          </span>
        </Link>

        <Link
          href="/admin/applications"
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-sky-400 transition-all duration-150 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Applications
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-emerald-600 leading-none">
            {stats.loading ? '...' : stats.totalApplications}
          </div>
          <span className="mt-2 block text-[11px] text-slate-400 group-hover:text-sky-600 transition-colors">
            Total submissions →
          </span>
        </Link>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Visitors
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-purple-600 leading-none">
            {stats.loading ? '...' : stats.totalVisitors.toLocaleString()}
          </div>
          <span className="mt-2 block text-[11px] text-slate-400">
            Platform visits tracked
          </span>
        </div>
      </div>

      {/* Primary Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-150 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Owner Applications
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review permits &amp; ownership
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Review incoming submissions from resort proprietors. Approving an application automatically generates and emails a randomized 6-digit PIN pass.
          </p>
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            <span>Open Applications List</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-150 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 flex items-center justify-center">
                <Palmtree className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                  Manage Beaches
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Directory, Coordinates &amp; Tours
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {stats.pendingCoords > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white animate-pulse">
                  {stats.pendingCoords} coord
                </span>
              )}
              {stats.pendingTours > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-600 text-white animate-pulse">
                  {stats.pendingTours} tour
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Moderate beach listings, review and approve map pin coordinate changes and 360° virtual tours from beach owners, or update publication statuses.
          </p>
          <Link
            href="/admin/beaches"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            <span>Open Manage Beaches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-150 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                User Management
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Accounts, Roles &amp; Status
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            View all registered users and details. Edit credentials, activate/deactivate/suspend accounts, or delete accounts under municipal policy.
          </p>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            <span>Manage User Accounts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-150 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Review Moderation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Keep community standards high
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Moderate visitor reviews, flags, and tourist feedback. Ensure constructive comments, resolve reports, and enforce content guidelines.
          </p>
          <Link
            href="/admin/reviews"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            <span>Moderate Reviews</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
