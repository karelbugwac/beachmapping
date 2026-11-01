'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Palmtree,
  Clock,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
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

      const appData = appRes.ok ? await appRes.json() : null;
      const beachData = beachRes.ok ? await beachRes.json() : null;
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;
      const tourData = tourRes.ok ? await tourRes.json() : null;
      const coordData = coordRes.ok ? await coordRes.json() : null;
      const userData = userRes.ok ? await userRes.json() : null;

      const apps = Array.isArray(appData?.applications) ? appData.applications : [];
      const pending = apps.filter((a: any) => a.status === 'pending').length;
      const beaches = Array.isArray(beachData) ? beachData : [];
      const totalVisitors = analyticsData?.totalVisitors || 0;
      const pendingTours = typeof tourData?.pendingCount === 'number' ? tourData.pendingCount : 0;
      const pendingCoords = typeof coordData?.pendingCount === 'number' ? coordData.pendingCount : 0;
      const totalUsers =
        typeof userData?.stats?.total === 'number'
          ? userData.stats.total
          : Array.isArray(userData?.users)
          ? userData.users.length
          : 0;

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
      console.error('Failed to load admin dashboard stats:', err);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    void loadStats();
    // Automatic background refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans">
      {/* Frameless Hero Header: Pure Dive Blue with no containers */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1F3F74]/10 dark:bg-[#4987BA]/15 text-[#1F3F74] dark:text-[#4987BA] text-xs font-bold uppercase tracking-wider">
          <span>Barangay Binongkalan</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1F3F74] dark:text-[#4987BA]">
          Barangay Admin Overview
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
          Oversee resort applications, verified beach listings, 360° virtual tours, and citizen accounts across Barangay Binongkalan.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Applications */}
        <Link
          href="/admin/applications"
          className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-[#1F3F74] dark:hover:border-[#4987BA] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">
              Pending Applications
            </span>
            <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-amber-600 leading-none">
            {stats.loading ? '...' : stats.pendingApplications}
          </div>
          <span className="mt-3 block text-xs font-semibold text-slate-400 group-hover:text-[#1F3F74] dark:group-hover:text-[#4987BA] transition-colors">
            Permit review required →
          </span>
        </Link>

        {/* Active Beach Listings */}
        <Link
          href="/admin/beaches"
          className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-[#1F3F74] dark:hover:border-[#4987BA] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">
              Active Beach Listings
            </span>
            <div className="w-9 h-9 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center">
              <Palmtree className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-[#1F3F74] dark:text-[#4987BA] leading-none">
            {stats.loading ? '...' : stats.activeBeaches}
          </div>
          <span className="mt-3 block text-xs font-semibold text-slate-400 group-hover:text-[#1F3F74] dark:group-hover:text-[#4987BA] transition-colors">
            Live coastal listings →
          </span>
        </Link>

        {/* Registered Users */}
        <Link
          href="/admin/users"
          className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-[#1F3F74] dark:hover:border-[#4987BA] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">
              Registered Accounts
            </span>
            <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-indigo-600 leading-none">
            {stats.loading ? '...' : stats.totalUsers}
          </div>
          <span className="mt-3 block text-xs font-semibold text-slate-400 group-hover:text-[#1F3F74] dark:group-hover:text-[#4987BA] transition-colors">
            Manage citizens &amp; owners →
          </span>
        </Link>

        {/* 360 Tours & Coordinates */}
        <Link
          href="/admin/beaches"
          className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-[#1F3F74] dark:hover:border-[#4987BA] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">
              Pending 360 / Coordinates
            </span>
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-emerald-600 leading-none">
            {stats.loading ? '...' : stats.pendingTours + stats.pendingCoords}
          </div>
          <span className="mt-3 block text-xs font-semibold text-slate-400 group-hover:text-[#1F3F74] dark:group-hover:text-[#4987BA] transition-colors">
            Admin approvals pending →
          </span>
        </Link>
      </div>

      {/* Analytics Chart */}
      <section className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-xs">
        {visitorPoints ? (
          <AnalyticsBarChart title="Barangay Platform Visitors" points={visitorPoints} />
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-neutral-500">
            Platform visitor statistics loading...
          </div>
        )}
      </section>

      {/* Primary Action Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/applications"
          className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-[#1F3F74] dark:hover:border-[#4987BA] hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-[#1F3F74] dark:text-[#4987BA]">
              Owner Applications
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Review submitted legal permits and proof of ownership. Approving automatically generates and dispatches credentials to the proprietor.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] group-hover:translate-x-1 transition-transform">
            <span>Open Applications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/admin/beaches"
          className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-[#1F3F74] dark:hover:border-[#4987BA] hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center">
              <Palmtree className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-[#1F3F74] dark:text-[#4987BA]">
              Manage Beaches &amp; 360° Tours
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Admin-exclusive virtual tour embedding, coordinates positioning, and listing management with dedicated Edit Info modals for each beach.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] group-hover:translate-x-1 transition-transform">
            <span>Manage Beaches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-[#1F3F74] dark:hover:border-[#4987BA] hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-[#1F3F74] dark:text-[#4987BA]">
              User Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Oversee registered tourists, citizens, and resort proprietors. Manage account roles, activation status, and community security.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] group-hover:translate-x-1 transition-transform">
            <span>Manage Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
