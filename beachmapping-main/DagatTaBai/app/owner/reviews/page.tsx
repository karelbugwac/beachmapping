'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  Users,
  ThumbsUp,
  MessageSquare,
  Loader2,
  ExternalLink,
  Calendar,
  Sparkles,
  Flag,
} from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';

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
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

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
    const interval = window.setInterval(() => fetchAnalytics(), 30000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, []);

  const submitReviewReport = async (reviewId: string) => {
    if (reportReason.trim().length < 10) {
      showToast('Please describe the concern in at least 10 characters.', 'error');
      return;
    }
    setSubmittingReport(true);
    try {
      const response = await fetch('/api/owner/reviews/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, reason: reportReason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not send report.');
      setReportingReviewId(null);
      setReportReason('');
      showToast('Report sent to the administrator for review.');
    } catch (reportError: unknown) {
      showToast(reportError instanceof Error ? reportError.message : 'Could not send report.', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600 dark:text-sky-400" />
        <p className="text-xs font-semibold">Calculating live visitor review analytics...</p>
      </div>
    );
  }

  const beachName = data?.beach?.name || 'Your Resort';
  const totalReviews = data?.totalReviews || 0;
  const avg = data?.averageRating || 0;
  const recommendationRate = data?.recommendationRate || 0;
  const dist = data?.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const pct = data?.percentages || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const reviews = data?.reviews || [];

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/owner/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Owner Dashboard</span>
        </Link>

        {data?.beach?.slug && (
          <Link
            href={`/beaches/${data.beach.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 text-xs font-bold transition-all shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Reviews on Listing</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl text-xs font-medium text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Live Visitor Sentiment</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading">
          Guest Reviews &amp; Rating Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Real-time metrics computed directly from authentic reviews left by visitors on <strong>{beachName}</strong>.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP ANALYTICS KPI CARDS (Real & Dynamic)                               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Average Rating Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Average Rating</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-500">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {avg > 0 ? avg.toFixed(1) : '0.0'}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1 pt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${
                  s <= Math.round(avg)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-200 dark:text-slate-700'
                }`}
              />
            ))}
            <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
              {totalReviews > 0 ? `${totalReviews} total rating${totalReviews > 1 ? 's' : ''}` : 'No ratings yet'}
            </span>
          </div>
        </div>

        {/* Total Reviews Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Verified Reviews</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {totalReviews}
            </span>
            <span className="text-xs font-semibold text-slate-400">submissions</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            {totalReviews > 0
              ? 'From tourists who visited Catmon shoreline'
              : 'Awaiting first tourist feedback'}
          </p>
        </div>

        {/* Recommendation Rate Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Recommendation</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {recommendationRate}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">positive</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            {totalReviews > 0
              ? '4-star & 5-star positive satisfaction rate'
              : 'Calculated once reviews are posted'}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STAR DISTRIBUTION BREAKDOWN (Live Dynamic Bars)                        */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
            Rating Distribution Breakdown
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">
            Live Database Sync
          </span>
        </div>

        <div className="space-y-2.5 pt-1">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = dist[stars as keyof typeof dist] || 0;
            const percentage = pct[stars as keyof typeof pct] || 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-10 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>{stars}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stars >= 4
                        ? 'bg-amber-400'
                        : stars === 3
                        ? 'bg-sky-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-12 text-right font-medium text-slate-400 text-[11px]">
                  {count} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Read-Only Notice */}
      <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800/80 text-xs text-sky-900 dark:text-sky-300 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Transparent Visitor Feedback Policy</p>
          <p className="text-[11px] text-sky-800 dark:text-sky-400 mt-0.5 leading-relaxed">
            In accordance with Dagat Ta Bai community standards, beach owners cannot alter or erase visitor reviews to maintain honest tourism ratings. If you notice abusive or inappropriate content, report it to the municipal tourism administrator.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. AUTHENTIC VISITOR REVIEWS FEED                                         */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
            Visitor Feedback Feed ({reviews.length})
          </h3>
          <button
            type="button"
            onClick={() => fetchAnalytics(true)}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            Refresh Feed
          </button>
        </div>

        {reviews.length === 0 ? (
          <div className="py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 p-6 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              No tourist reviews posted yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              When visitors view your beach on Dagat Ta Bai and submit their ratings and experiences, their reviews and dynamic satisfaction scores will automatically populate here.
            </p>
            {data?.beach?.slug && (
              <div className="pt-2">
                <Link
                  href={`/beaches/${data.beach.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Visit Your Public Page to Test Reviewing</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => {
              const formattedDate = r.created_at
                ? new Date(r.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recent';

              const initial = (r.user_name || 'T').charAt(0).toUpperCase();

              return (
                <div
                  key={r.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                        {initial}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {r.user_name}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                            Verified Tourist
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{formattedDate}</span>
                        </span>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-xl">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        {r.rating}.0
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-12">
                    {r.comment}
                  </p>
                  <div className="pl-12">
                    {reportingReviewId === r.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          maxLength={1000}
                          value={reportReason}
                          onChange={(event) => setReportReason(event.target.value)}
                          placeholder="Explain why this review should be checked"
                          className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                        />
                        <div className="flex gap-2">
                          <button type="button" disabled={submittingReport} onClick={() => void submitReviewReport(r.id)} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{submittingReport ? 'Sending…' : 'Send report'}</button>
                          <button type="button" onClick={() => { setReportingReviewId(null); setReportReason(''); }} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setReportingReviewId(r.id)} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-700">
                        <Flag className="h-3.5 w-3.5" />Report to admin
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
