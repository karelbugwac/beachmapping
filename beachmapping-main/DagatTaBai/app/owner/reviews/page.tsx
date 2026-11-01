'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Star,
  Users,
  ThumbsUp,
  ExternalLink,
  Flag,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface OwnerReviewItem {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_name: string;
}

interface ReviewAnalyticsData {
  beach: {
    id: string;
    name: string;
    slug: string;
  } | null;
  totalReviews: number;
  averageRating: number;
  recommendationRate: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  percentages: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  reviews: OwnerReviewItem[];
}

export default function OwnerReviewsPage() {
  const [data, setData] = useState<ReviewAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | 'all'>('all');

  // Floating Toast State (Centered, green for success, red for error, 5s duration, NO "x")
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Reporting State
  const [reportingReview, setReportingReview] = useState<OwnerReviewItem | null>(null);
  const [reportCategory, setReportCategory] = useState('False or misleading information');
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Automatic data loader (No manual refresh button)
  const fetchAnalytics = (showLoader = false) => {
    if (showLoader) setLoading(true);
    fetch('/api/owner/reviews', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load review analytics');
        return res.json();
      })
      .then((json: ReviewAnalyticsData) => {
        setData(json);
      })
      .catch((err) => {
        console.error(err);
        setError('Could not connect to live reviews database.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(() => fetchAnalytics(), 0);
    // Automatic refresh every 30 seconds
    const interval = window.setInterval(() => fetchAnalytics(), 30000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, []);

  const handleOpenReportModal = (review: OwnerReviewItem) => {
    setReportingReview(review);
    setReportCategory('False or misleading information');
    setReportReason('');
    setReportError('');
  };

  const handleCloseReportModal = () => {
    setReportingReview(null);
    setReportReason('');
    setReportError('');
  };

  const handleSubmitReviewReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReview) return;

    if (reportReason.trim().length < 10) {
      setReportError('Please describe the reason in at least 10 characters.');
      return;
    }

    setSubmittingReport(true);
    try {
      const fullReason = `[Category: ${reportCategory}] ${reportReason.trim()}`;
      const response = await fetch('/api/owner/reviews/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: reportingReview.id, reason: fullReason }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Could not send report.');
      }

      handleCloseReportModal();
      setToast({
        type: 'success',
        message: 'Review report submitted to the administrator for review.',
      });
    } catch (reportError: unknown) {
      const msg = reportError instanceof Error ? reportError.message : 'Could not send report.';
      setToast({ type: 'error', message: msg });
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1F3F74] border-t-transparent" />
        <p className="text-xs font-semibold text-[#1F3F74] dark:text-[#4987BA]">
          Loading visitor review analytics...
        </p>
      </div>
    );
  }

  const beachName = data?.beach?.name || 'Your Resort';
  const totalReviews = data?.totalReviews || 0;
  const avg = data?.averageRating || 0;
  const recommendationRate = data?.recommendationRate || 0;
  const dist = data?.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const pct = data?.percentages || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const allReviews = data?.reviews || [];

  const filteredReviews =
    selectedRatingFilter === 'all'
      ? allReviews
      : allReviews.filter((r) => r.rating === selectedRatingFilter);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      
      {/* ── Floating Message Banner (Centered, solid green/red, white text, 5s duration, NO "x") ── */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-6 py-3.5 rounded-full shadow-2xl max-w-[90vw] animate-in fade-in slide-in-from-top-4 duration-300 text-white font-medium text-xs sm:text-sm tracking-wide ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Top Header (No back arrow, Blue header, No manual refresh button) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F3F74] dark:text-[#4987BA] tracking-tight font-sans">
            Guest Reviews &amp; Feedback
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1 font-medium">
            Verified visitor ratings and genuine experiences for <strong>{beachName}</strong>.
          </p>
        </div>

        {data?.beach?.slug && (
          <div className="flex items-center gap-2.5">
            <Link
              href={`/beaches/${data.beach.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-[#1F3F74] dark:text-[#4987BA] text-xs font-bold transition-all border border-slate-200 dark:border-neutral-800 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Public Page</span>
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl text-xs font-medium text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* ── 1. Top Analytics KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Average Rating Card */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200/90 dark:border-neutral-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">Average Rating</span>
            <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-500">
              <Star className="w-4.5 h-4.5 fill-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1F3F74] dark:text-[#4987BA]">
              {avg > 0 ? avg.toFixed(1) : '0.0'}
            </span>
            <span className="text-xs font-semibold text-slate-400 dark:text-neutral-500">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1 pt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${
                  s <= Math.round(avg)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-200 dark:text-neutral-700'
                }`}
              />
            ))}
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 ml-1.5 font-medium">
              {totalReviews > 0 ? `${totalReviews} total rating${totalReviews > 1 ? 's' : ''}` : 'No ratings yet'}
            </span>
          </div>
        </div>

        {/* Total Reviews Card */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200/90 dark:border-neutral-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">Verified Reviews</span>
            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#1F3F74] dark:text-[#4987BA]">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1F3F74] dark:text-[#4987BA]">
              {totalReviews}
            </span>
            <span className="text-xs font-semibold text-slate-400 dark:text-neutral-500">submissions</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 pt-1 font-medium">
            From verified tourists visiting Catmon
          </p>
        </div>

        {/* Recommendation Rate Card */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200/90 dark:border-neutral-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">Recommendation</span>
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <ThumbsUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {recommendationRate}%
            </span>
            <span className="text-xs font-semibold text-slate-400 dark:text-neutral-500">positive</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 pt-1 font-medium">
            Rated 4 or 5 stars by guests
          </p>
        </div>
      </div>

      {/* ── 2. Rating Breakdown Bar Chart & Oblong Filter Pills ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/90 dark:border-neutral-800 p-6 sm:p-8 space-y-6 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
            Rating Distribution
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Filter customer reviews by specific star rating.
          </p>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="space-y-2 max-w-xl">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = (dist as any)[star] || 0;
            const percentage = (pct as any)[star] || 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold text-slate-600 dark:text-neutral-300 flex items-center gap-1">
                  <span>{star}</span>
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right font-semibold text-slate-500 dark:text-neutral-400">
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Oblong Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2">
          <button
            type="button"
            onClick={() => setSelectedRatingFilter('all')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedRatingFilter === 'all'
                ? 'bg-[#1F3F74] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
            }`}
          >
            All Reviews ({totalReviews})
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedRatingFilter(s)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer ${
                selectedRatingFilter === s
                  ? 'bg-[#1F3F74] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
              }`}
            >
              <span>{s}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>({(dist as any)[s] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Reviews Feed List ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
          Visitor Submissions ({filteredReviews.length})
        </h2>

        {filteredReviews.length > 0 ? (
          <div className="space-y-4">
            {filteredReviews.map((r) => {
              const formattedDate = r.created_at
                ? new Date(r.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recent';

              return (
                <div
                  key={r.id}
                  className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/90 dark:border-neutral-800 shadow-2xs space-y-3 transition-all hover:border-[#1F3F74]/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F3F74] to-[#14284c] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        {(r.user_name || 'V').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {r.user_name || 'Verified Visitor'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-[#1F3F74] dark:text-[#4987BA] border border-blue-200 dark:border-blue-900">
                            Verified Guest
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium">
                          {formattedDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-start sm:self-auto">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-neutral-700'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Report Review Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenReportModal(r)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Report review to municipal admin"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Report</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-neutral-300 leading-relaxed pt-1">
                    {r.comment}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 space-y-2">
            <Users className="w-10 h-10 text-slate-300 dark:text-neutral-700 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No reviews match this filter
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Select another star rating or view all reviews.
            </p>
          </div>
        )}
      </div>

      {/* ── MODAL: REPORT REVIEW TO ADMIN ── */}
      {reportingReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
                Report Review to Municipal Admin
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                If you believe this review violates Dagat Ta Bai community guidelines or contains false claims, submit an investigation request.
              </p>
            </div>

            <form onSubmit={handleSubmitReviewReport} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Violation Category *
                </label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#1F3F74]"
                >
                  <option value="False or misleading information">False or misleading information</option>
                  <option value="Harassment, profanity, or defamatory content">Harassment, profanity, or defamatory content</option>
                  <option value="Fake review / Competitor sabotage">Fake review / Competitor sabotage</option>
                  <option value="Content unrelated to resort experience">Content unrelated to resort experience</option>
                  <option value="Other guideline violation">Other guideline violation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Reason for Investigation *
                </label>
                <textarea
                  rows={3}
                  value={reportReason}
                  onChange={(e) => {
                    setReportReason(e.target.value);
                    if (e.target.value.trim().length >= 10) setReportError('');
                  }}
                  placeholder="Explain why this review should be moderated (minimum 10 characters)..."
                  className={`w-full rounded-2xl border bg-white dark:bg-neutral-950 p-3 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none transition-all ${
                    reportError ? 'border-red-500' : 'border-slate-300 dark:border-neutral-700 focus:border-[#1F3F74]'
                  }`}
                />
                {reportError && (
                  <p className="text-[11px] text-red-500 font-medium pl-2">{reportError}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={handleCloseReportModal}
                  className="rounded-full px-5 py-2 text-xs font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="rounded-full px-6 py-2 bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
