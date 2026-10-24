'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ReviewCard } from '@/components/review-card';
import { showToast } from '@/components/ui/feedback-toasts';

interface AdminReview {
  id: string;
  beach_id: string | null;
  user_id: string | null;
  review_type: 'beach' | 'platform';
  user_name: string;
  beach_name: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

interface ReviewReport {
  id: string;
  reason: string;
  created_at: string;
  reporter: string;
  beach: string;
  review: { id: string; comment: string; rating: number } | null;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [reports, setReports] = useState<ReviewReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = () => fetch('/api/admin/reviews', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load reviews.');
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setReports(Array.isArray(data.reports) ? data.reports : []);
      })
      .catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Failed to load reviews.', 'error'))
      .finally(() => setLoading(false));
    void loadReviews();
    const interval = window.setInterval(loadReviews, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const handleDelete = async (review: AdminReview) => {
    try {
      const response = await fetch(`/api/admin/reviews?id=${encodeURIComponent(review.id)}&type=${review.review_type}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete review.');
      setReviews((current) => current.filter((item) => item.id !== review.id || item.review_type !== review.review_type));
      showToast('Review deleted.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to delete review.', 'error');
    }
  };

  const handleReportDecision = async (id: string, decision: 'remove' | 'dismiss') => {
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, decision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not process report.');
      setReports((current) => current.filter((report) => report.id !== id));
      const reportedReviewId = reports.find((report) => report.id === id)?.review?.id;
      if (decision === 'remove' && reportedReviewId) setReviews((current) => current.filter((review) => review.id !== reportedReviewId));
      showToast(decision === 'remove' ? 'Reported review removed.' : 'Report dismissed.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not process report.', 'error');
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-white dark:hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Admin Dashboard</span>
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Moderate Reviews</h1>
          <p className="text-xs text-slate-500 dark:text-gray-300">
            Inspect all visitor comments across beaches and delete inappropriate submissions.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <section className="space-y-3 border-b border-slate-200 pb-6 dark:border-black">
          <h2 className="text-lg font-semibold dark:text-white">Owner reports awaiting review ({reports.length})</h2>
          {reports.map((report) => (
            <article key={report.id} className="space-y-3 border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/30 dark:border-black dark:bg-black">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <strong className="dark:text-white">{report.beach}</strong>
                <span className="text-xs text-slate-500 dark:text-gray-400">Reported by {report.reporter} · {new Date(report.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm dark:text-gray-300">{report.reason}</p>
              {report.review && <blockquote className="border-l-2 border-slate-300 pl-3 text-sm text-slate-600 dark:text-gray-300 dark:border-gray-600">{report.review.comment}</blockquote>}
              <div className="flex gap-2">
                <button type="button" onClick={() => void handleReportDecision(report.id, 'remove')} className="rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white">Remove review</button>
                <button type="button" onClick={() => void handleReportDecision(report.id, 'dismiss')} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-black dark:bg-gray-800 dark:text-white">Dismiss report</button>
              </div>
            </article>
          ))}
          {!loading && reports.length === 0 && <p className="text-sm text-slate-500 dark:text-gray-300">No pending owner reports.</p>}
        </section>
        {loading && <div className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>}
        {!loading && reviews.length === 0 && <p className="py-10 text-center text-sm text-slate-500 dark:text-gray-300">No visitor reviews yet.</p>}
        {reviews.map((r) => (
          <ReviewCard key={`${r.review_type}:${r.id}`} review={r} canDelete={true} onDelete={() => void handleDelete(r)} />
        ))}
      </div>
    </div>
  );
}
