'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ReviewCard } from '@/components/review';

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get current session
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          window.location.href = '/login?redirect=/profile/reviews';
          return;
        }

        // Fetch user reviews
        return fetch(`/api/profile/reviews?userId=${encodeURIComponent(data.user.id)}`);
      })
      .then((res) => (res ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setReviews(data);
        }
      })
      .catch(() => {
        // Safe fallback
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/profile/reviews?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      // Offline fallback
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 text-slate-900 dark:text-brand-sand-100">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Profile</span>
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading">
            My Posted Reviews
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage and view the reviews you&apos;ve shared with other visitors.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-teal-100 dark:bg-brand-teal-700 text-brand-teal-700 dark:text-brand-teal-300">
          {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
        </span>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-brand-teal-600" />
          <span className="text-xs">Loading your reviews...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="space-y-2">
              <div className="text-xs font-bold text-brand-teal-700 dark:text-brand-teal-400">
                Review on{' '}
                <Link href={`/beaches/${r.beach_slug || r.beachid}`} className="underline">
                  {r.beachname || 'Beach Resort'}
                </Link>
              </div>
              <ReviewCard review={r} canDelete={true} onDelete={handleDelete} />
            </div>
          ))}

          {reviews.length === 0 && (
            <div className="py-12 bg-white dark:bg-brand-navy-900 rounded-2xl border border-slate-200 dark:border-brand-navy-800 text-center text-xs text-slate-500 dark:text-slate-400 space-y-3 p-6">
              <p>You haven&apos;t posted any reviews yet.</p>
              <Link
                href="/map"
                className="inline-block px-4 py-2 bg-brand-teal-600 text-white rounded-xl font-semibold hover:bg-brand-teal-700 transition-colors"
              >
                Explore Catmon Beaches
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
