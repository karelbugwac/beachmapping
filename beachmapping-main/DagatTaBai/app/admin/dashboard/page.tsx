'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Palmtree,
  Clock,
  Compass,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { AnalyticsBarChart, type AnalyticsPoint } from '@/components/ui/analytics-bar-chart';

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
  const isFetchingRef = useRef(false);

  const loadStats = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const [appRes, beachRes, analyticsRes, tourRes, coordRes, userRes] = await Promise.all([
        fetch('/api/applications', { cache: 'no-store' }),
        fetch('/api/beaches', { cache: 'no-store' }),
        fetch('/api/admin/analytics/visitors', { cache: 'no-store' }),
        fetch('/api/admin/beaches/tour-requests', { cache: 'no-store' }),
        fetch('/api/admin/beaches/coordinate-requests', { cache: 'no-store' }),
        fetch('/api/admin/users?summary=true', { cache: 'no-store' }),
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
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    void loadStats();
    // Automatic background refresh every 60 seconds when tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadStats();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans">
      {/* Frameless Hero Header: Pure Dive Blue with no containers */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1F3F74] dark:text-white">
          Admin Overview
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
          Manage resort records, beach listings, virtual tours, and community accounts in one place.
        </p>
      </div>

      {/* KPI Cards Grid: Yellow, Sky Blue, and Dive Blue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Pending Applications (Yellow) */}
        <Link
          href="/admin/applications"
          className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-yellow-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">
              Pending Applications
            </span>
            <Clock className="w-5 h-5 text-yellow-500" strokeWidth={2.5} />
          </div>
          <div className="mt-4 text-3xl font-black text-yellow-500 dark:text-yellow-400 leading-none">
            {stats.loading ? '...' : stats.pendingApplications}
          </div>
          <span className="mt-3 block text-xs font-semibold text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
            Permit review required →
          </span>
        </Link>

        {/* 2. Active Beaches (Sky Blue) */}
        <Link
          href="/admin/beaches"
          className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-sky-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">
              Active Beaches
            </span>
            <Palmtree className="w-5 h-5 text-sky-500" strokeWidth={2.5} />
          </div>
          <div className="mt-4 text-3xl font-black text-sky-500 dark:text-sky-400 leading-none">
            {stats.loading ? '...' : stats.activeBeaches}
          </div>
          <span className="mt-3 block text-xs font-semibold text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
            Live coastal listings →
          </span>
        </Link>

        {/* 3. 360 Capture Requests (Sky Blue / Dive) */}
        <Link
          href="/admin/beaches"
          className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-sky-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">
              360 Capture Requests
            </span>
            <Compass className="w-5 h-5 text-sky-400" strokeWidth={2.5} />
          </div>
          <div className="mt-4 text-3xl font-black text-sky-500 dark:text-sky-300 leading-none">
            {stats.loading ? '...' : stats.pendingTours}
          </div>
          <span className="mt-3 block text-xs font-semibold text-slate-400 group-hover:text-sky-500 transition-colors">
            Tour scanning queue →
          </span>
        </Link>

        {/* 4. Review Moderation (Dive Blue) */}
        <Link
          href="/admin/users"
          className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-[#1F3F74] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">
              Review Moderation
            </span>
            <ShieldCheck className="w-5 h-5 text-[#1F3F74] dark:text-[#38BDF8]" strokeWidth={2.5} />
          </div>
          <div className="mt-4 text-3xl font-black text-[#1F3F74] dark:text-white leading-none">
            {stats.loading ? '...' : stats.totalUsers}
          </div>
          <span className="mt-3 block text-xs font-semibold text-slate-400 group-hover:text-[#1F3F74] dark:group-hover:text-[#38BDF8] transition-colors">
            Moderate community reviews →
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
        {/* Owner Applications (Yellow) */}
        <Link
          href="/admin/applications"
          className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-yellow-500 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <FileCheck className="w-6 h-6 text-yellow-500" strokeWidth={2.5} />
            <h2 className="font-bold text-base text-[#1F3F74] dark:text-white">
              Owner Applications
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Review submitted legal permits and proof of ownership. Approving automatically generates and dispatches credentials to the proprietor. Ensure all documents are valid before approval.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-yellow-600 dark:text-yellow-400 group-hover:translate-x-1 transition-transform">
            <span>Open Applications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Manage Beaches & 360 Tours (Sky Blue) */}
        <Link
          href="/admin/beaches"
          className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-sky-500 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <Palmtree className="w-6 h-6 text-sky-500" strokeWidth={2.5} />
            <h2 className="font-bold text-base text-[#1F3F74] dark:text-white">
              Manage Beaches &amp; 360° Tours
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Admin-exclusive virtual tour embedding, coordinates positioning, and listing management with dedicated Edit Info modals for each beach. Control all beach-related content and ensure accuracy.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:translate-x-1 transition-transform">
            <span>Manage Beaches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* User Management & Review Moderation (Dive Blue) */}
        <Link
          href="/admin/users"
          className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-[#1F3F74] hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <ShieldCheck className="w-6 h-6 text-[#1F3F74] dark:text-[#38BDF8]" strokeWidth={2.5} />
            <h2 className="font-bold text-base text-[#1F3F74] dark:text-white">
              User &amp; Review Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Oversee registered tourists, citizens, and resort proprietors. Moderate community reviews, handle removal requests, and maintain a safe and organized user ecosystem.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#1F3F74] dark:text-[#38BDF8] group-hover:translate-x-1 transition-transform">
            <span>Manage Users &amp; Reviews</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
