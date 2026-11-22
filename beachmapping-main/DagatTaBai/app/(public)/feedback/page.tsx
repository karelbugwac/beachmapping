'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';
import { maskReviewerName } from '@/lib/utils/mask-reviewer-name';
import { notifyRealtimeSync, useRealtimeSync } from '@/lib/realtime-sync';

interface PlatformReview {
  id: string;
  user_name: string;
  profileimageurl?: string | null;
  user_role?: string;
  rating: number;
  comment: string;
  createdat: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export default function PlatformFeedbackPage() {
  const [reviews, setReviews] = useState<PlatformReview[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 5 | 4 | 3 | 2 | 1>('all');

  const loadFeedback = async (silent = false) => {
    try {
      const [reviewsResponse, sessionResponse] = await Promise.all([
        fetch('/api/platform-feedback', { cache: 'no-store' }),
        fetch('/api/auth/session', { cache: 'no-store' }),
      ]);
      if (!reviewsResponse.ok) throw new Error('Could not load platform feedback.');
      const data = await reviewsResponse.json();
      setReviews(Array.isArray(data) ? data : []);
      const session = await sessionResponse.json();
      setSignedIn(Boolean(session.user));
    } catch (error: unknown) {
      if (!silent) {
        showToast(error instanceof Error ? error.message : 'Could not load feedback.', 'error');
      }
    }
  };

  useEffect(() => {
    void loadFeedback(false);
  }, []);

  useRealtimeSync(() => {
    void loadFeedback(true);
  });

  // Handle star clicking and toggling:
  // If the user clicks the current rating, it unselects down to value - 1 (min 1 star).
  // If user clicks another star, it sets to that star.
  const handleStarClick = (value: number) => {
    if (rating === value) {
      setRating(Math.max(1, value - 1));
    } else {
      setRating(value);
    }
  };

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
      notifyRealtimeSync('feedback');
      showToast('Feedback submitted successfully!', 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not submit feedback.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered reviews by rating category
  const filteredReviews = useMemo(() => {
    if (activeCategory === 'all') return reviews;
    return reviews.filter((r) => Math.round(r.rating) === activeCategory);
  }, [reviews, activeCategory]);

  const activeDisplayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="min-h-screen bg-white font-display dark:bg-black">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6">
      <header className="space-y-1 text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight text-brand-navy-500 dark:text-brand-teal-300 sm:text-2xl">
          Platform Feedback
        </h1>
        <p className="text-xs text-slate-600 dark:text-white sm:text-sm">
          Share your experience using Dagat Ta Bai.
        </p>
      </header>

      {signedIn ? (
        <form onSubmit={submit} className="space-y-5">
          <fieldset>
            <div className="flex items-center gap-3 mb-2">
              <legend className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Your rating
              </legend>
              <span className="text-xs font-bold text-brand-navy-700 dark:text-brand-sun-400">
                {activeDisplayRating} {activeDisplayRating === 1 ? 'Star' : 'Stars'} &bull; {RATING_LABELS[activeDisplayRating]}
              </span>
            </div>

            {/* Interactive Stars with toggle & hover */}
            <div
              className="flex items-center gap-1.5"
              role="radiogroup"
              aria-label="Platform rating"
              onMouseLeave={() => setHoverRating(null)}
            >
              {[1, 2, 3, 4, 5].map((value) => {
                const isLit = value <= activeDisplayRating;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} stars`}
                    onClick={() => handleStarClick(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    className="p-1 -m-1 text-slate-300 transition-transform hover:scale-110 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400"
                    title={`Rate ${value} star${value > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={`h-7 w-7 transition-colors duration-150 ${
                        isLit ? 'fill-brand-sun-400 text-brand-navy-700' : 'text-slate-300 dark:text-neutral-700'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block space-y-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            <span>Your feedback</span>
            <textarea
              required
              minLength={5}
              maxLength={2000}
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Tell us what you liked, what can be improved, or suggestions for the platform..."
              className="w-full rounded-2xl border border-slate-300 dark:border-neutral-800 bg-white dark:bg-black p-3.5 text-xs sm:text-sm font-normal text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:ring-2 focus:ring-brand-teal-400 placeholder:italic"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full bg-[#F4BF3E] px-6 py-2.5 text-xs font-display font-medium normal-case text-black transition shadow-md hover:bg-[#e0a92e] disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Submitting…' : 'Submit feedback'}
          </button>
        </form>
      ) : null}

      {/* Platform Feedback Categories & Feed */}
      <section className="space-y-6" aria-label="Platform feedback list">
        {/* Expanded Equal Sectioning Category Filter Pills (Responsive on Mobile and Desktop) */}
        <div className="flex w-full gap-2 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {(['all', 5, 4, 3, 2, 1] as const).map((cat) => {
            const count = cat === 'all'
              ? reviews.length
              : reviews.filter((r) => Math.round(r.rating) === cat).length;
            const isSelected = activeCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 snap-start whitespace-nowrap rounded-full px-3 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs sm:flex-1 sm:snap-none ${
                  isSelected
                    ? 'bg-brand-navy-500 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-neutral-800 dark:bg-black dark:text-white dark:hover:bg-neutral-900'
                }`}
              >
                <span>{cat === 'all' ? 'All' : `${cat} Star${cat > 1 ? 's' : ''}`}</span>
                <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400 dark:text-zinc-400'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback List or Frameless Empty State (No card box, no subtitle) */}
        {filteredReviews.length === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center text-center space-y-2">
            <Star className="w-8 h-8 text-slate-300 dark:text-neutral-700 stroke-1" />
            <p className="text-sm font-bold text-slate-700 dark:text-white">
              No ratings yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <article
                key={review.id}
                className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-black"
              >
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-navy-50 text-sm font-bold text-brand-navy-500 dark:bg-brand-navy-900/60 dark:text-brand-navy-200">
                      {review.user_name?.trim().charAt(0).toUpperCase() || 'U'}
                      {review.profileimageurl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={review.profileimageurl}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <span className="truncate font-bold text-slate-900 dark:text-white">
                      {maskReviewerName(review.user_name)}
                    </span>
                  </div>

                  {/* Star Icons instead of "5 / 5" */}
                  <div
                    className="flex items-center gap-1 text-brand-sun-700"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < review.rating
                            ? 'fill-brand-sun-400 text-brand-navy-700'
                            : 'text-slate-200 dark:text-neutral-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="whitespace-pre-line text-xs text-slate-700 dark:text-white sm:text-sm leading-relaxed">
                  {review.comment}
                </p>

                <time className="block text-[11px] text-slate-400 dark:text-zinc-400" dateTime={review.createdat}>
                  {new Date(review.createdat).toLocaleDateString()}
                </time>
              </article>
            ))}
          </div>
        )}
      </section>

      {!signedIn && (
        <div className="flex justify-center pb-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full bg-[#F4BF3E] px-8 py-3 text-xs font-display font-medium normal-case text-black shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e0a92e] active:translate-y-0 sm:text-sm"
          >
            Sign up to submit feedback
          </Link>
        </div>
      )}
      </div>
    </div>
  );
}
