'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home,
  MapPin,
  Star,
  Clock,
  Image as ImageIcon,
  Users,
  TrendingUp,
  Phone,
  ExternalLink,
  ChevronRight,
  Plus,
  Edit,
  Settings,
} from 'lucide-react';
import type { BeachRecord } from '@/lib/db/beaches';
import { AnalyticsBarChart, type AnalyticsPoint } from '@/components/ui/analytics-bar-chart';

interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  recommendationRate: number;
}

function parseOpeningHoursForDisplay(openingHours: string | Record<string, string>): string {
  if (typeof openingHours === 'string') {
    return openingHours;
  }
  if (typeof openingHours === 'object' && openingHours !== null) {
    const hours = Object.values(openingHours).filter(h => h && h !== 'CLOSE');
    if (hours.length > 0) {
      return String(hours[0]);
    }
    return 'Closed';
  }
  return 'Not set';
}

export default function OwnerDashboardPage() {
  const [beach, setBeach] = useState<BeachRecord | null>(null);
  const [reviews, setReviews] = useState<ReviewAnalytics | null>(null);
  const [visitorPoints, setVisitorPoints] = useState<AnalyticsPoint[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = () => Promise.all([
      fetch('/api/owner/beach', { cache: 'no-store' }).then((res) => (res.ok ? res.json() : [])),
      fetch('/api/owner/reviews', { cache: 'no-store' }).then((res) => (res.ok ? res.json() : null)),
      fetch('/api/owner/analytics', { cache: 'no-store' }).then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([beaches, reviewData, visitorData]) => {
        if (Array.isArray(beaches) && beaches.length > 0) {
          setBeach(beaches[0]);
        }
        if (reviewData && typeof reviewData.totalReviews === 'number') {
          setReviews({
            totalReviews: reviewData.totalReviews,
            averageRating: reviewData.averageRating,
            recommendationRate: reviewData.recommendationRate,
          });
        }
        if (Array.isArray(visitorData?.points)) setVisitorPoints(visitorData.points);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    void loadDashboard();
    const interval = window.setInterval(loadDashboard, 30000);
    return () => window.clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!beach) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Beach Found</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You haven't created your beach listing yet. Start by adding your beach information.
          </p>
          <Link
            href="/owner/beach"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            <span>Create Beach Listing</span>
          </Link>
        </div>
      </div>
    );
  }

  const photoCount = Array.isArray(beach?.images) ? beach.images.length : 0;
  const rating = reviews?.averageRating || beach?.average_rating || 0;
  const reviewCount = reviews?.totalReviews || 0;

  const quickActions = [
    { label: 'Map Coordinates', icon: MapPin, href: '/owner/beach?tab=location', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { label: 'Add Photos', icon: ImageIcon, href: '/owner/beach#photos', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Edit Info', icon: Edit, href: '/owner/beach', color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    { label: 'Manage Cottages', icon: Home, href: '/owner/beach#cottages', color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    { label: 'Settings', icon: Settings, href: '/owner/account', color: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  ];

  const statsCards = [
    { label: 'Total Reviews', value: reviewCount.toString(), icon: Users, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30' },
    { label: 'Average Rating', value: rating.toFixed(1), icon: Star, color: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30' },
    { label: 'Total Photos', value: photoCount.toString(), icon: ImageIcon, color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30' },
    { label: 'Status', value: beach?.status || 'Active', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, {beach?.name || 'Beach Owner'}
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus size={16} />
          <span>Quick Add</span>
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className={`p-2 rounded-lg ${stat.color} w-fit mb-3`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {visitorPoints && (
        <section className="p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <AnalyticsBarChart title="Beach Profile Visitors" points={visitorPoints} />
        </section>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className={`p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors ${action.color}`}
              >
                <Icon size={24} className="mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">{action.label}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Activity & Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Beach Overview Card */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Beach Overview</h2>
              <Link
                href="/owner/beach"
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1"
              >
                Edit
                <ChevronRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-gray-500" />
                <span className="text-gray-900 dark:text-white">{beach?.location}</span>
              </div>
              <div className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Map Coordinates:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {beach?.latitude}° N, {beach?.longitude}° E
                  </span>
                </div>
                <Link
                  href="/owner/beach?tab=location"
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Change Pin</span>
                  <ChevronRight size={12} />
                </Link>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-gray-500" />
                <span className="text-gray-900 dark:text-white">{parseOpeningHoursForDisplay(beach?.opening_hours)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-gray-500" />
                <span className="text-gray-900 dark:text-white">{beach?.contact_phone || 'Not set'}</span>
              </div>
            </div>
          </div>

          {/* Recent Reviews Preview */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Reviews</h2>
              <Link
                href="/owner/reviews"
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1"
              >
                View All
                <ChevronRight size={14} />
              </Link>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center text-sm text-gray-500 dark:text-gray-400">
              {reviewCount > 0 ? 'Loading recent reviews...' : 'No reviews yet'}
            </div>
          </div>
        </div>

        {/* Right: Sidebar Info (Consistent with public profile) */}
        <div className="space-y-6">
          {/* General Information - Same as public profile sidebar */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg sticky top-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">General Information</h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Opening Hours</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{parseOpeningHoursForDisplay(beach?.opening_hours)}</p>
              </div>

              {beach?.entrance_fee && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Entrance Fee</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{beach.entrance_fee}</p>
                </div>
              )}

              {beach?.cottage_fee && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cottage Rates</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{beach.cottage_fee}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Location</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{beach?.location}</p>
                <button className="text-blue-600 dark:text-blue-400 text-xs font-medium hover:underline flex items-center gap-1">
                  <ExternalLink size={12} />
                  View on Map
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/beaches/${beach?.slug || beach?.id}`}
                  target="_blank"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <ExternalLink size={16} />
                  <span>View Public Profile</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Beach Status</h3>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${beach?.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{beach?.status || 'Active'}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your beach is visible to visitors
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
