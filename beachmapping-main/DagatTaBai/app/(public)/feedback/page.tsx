'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';

interface PlatformReview {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function PlatformFeedbackPage() {
  const [reviews, setReviews] = useState<PlatformReview[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [reviewsResponse, sessionResponse] = await Promise.all([
        fetch('/api/platform-feedback', { cache: 'no-store' }),
        fetch('/api/auth/session', { cache: 'no-store' }),
      ]);
      if (!reviewsResponse.ok) throw new Error('Could not load platform feedback.');
      const data = await reviewsResponse.json();
      setReviews(Array.isArray(data) ? data : []);
      const session = await sessionResponse.json();
      setSignedIn(Boolean(session.user));
    };
    void load().catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Could not load feedback.', 'error'));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/platform-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not submit feedback.');
      setReviews((current) => [data, ...current]);
      setComment('');
      showToast('Your platform feedback was submitted.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not submit feedback.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Platform Feedback</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Share your experience using Dagat Ta Bai. Feedback is visible to the platform administrator.</p>
      </header>

      {signedIn ? (
        <form onSubmit={submit} className="space-y-4 border-y border-slate-200 py-6 dark:border-slate-800">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Your rating</legend>
            <div className="flex gap-1" role="radiogroup" aria-label="Platform rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} stars`} onClick={() => setRating(value)} className="p-1">
                  <Star className={`h-6 w-6 ${value <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block space-y-2 text-sm font-semibold">
            <span>Your feedback</span>
            <textarea required minLength={5} maxLength={2000} rows={4} value={comment} onChange={(event) => setComment(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white p-3 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
          </label>
          <button disabled={submitting} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900">
            {submitting ? 'Submitting…' : 'Submit feedback'}
          </button>
        </form>
      ) : (
        <p className="border-y border-slate-200 py-6 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">Sign in to submit platform feedback.</p>
      )}

      <section className="space-y-4" aria-label="Recent platform feedback">
        <h2 className="text-lg font-semibold">Recent feedback ({reviews.length})</h2>
        {reviews.map((review) => (
          <article key={review.id} className="space-y-2 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-semibold">{review.user_name}</span>
              <span className="text-amber-600">{review.rating} / 5</span>
            </div>
            <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{review.comment}</p>
            <time className="text-xs text-slate-500" dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString()}</time>
          </article>
        ))}
      </section>
    </div>
  );
}