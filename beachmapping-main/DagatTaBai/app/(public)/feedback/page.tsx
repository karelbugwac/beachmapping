'use client';

import { useEffect, useState, useMemo } from 'react';
import { Star } from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';
import { maskReviewerName } from '@/lib/utils/mask-reviewer-name';

interface PlatformReview {
  id: string;
  user_name: string;
  profile_image_url?: string | null;
  user_role?: string;
  rating: number;
  comment: string;
  created_at: string;
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
    void load().catch((error: unknown) =>
      showToast(error instanceof Error ? error.message : 'Could not load feedback.', 'error')
    );
  }, []);

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
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 font-sans">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F3F74] dark:text-white tracking-tight">
          Platform Feedback
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Share your experience using Dagat Ta Bai.
        </p>
      </header>

      {signedIn ? (
        <form onSubmit={submit} className="space-y-5 border-y border-slate-200 dark:border-neutral-800 py-6">
          <fieldset>
            <div className="flex items-center gap-3 mb-2">
              <legend className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Your rating
              </legend>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
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
                    className="p-1 -m-1 text-slate-300 transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                    title={`Rate ${value} star${value > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={`h-7 w-7 transition-colors duration-150 ${
                        isLit ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-neutral-700'
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
              className="w-full rounded-2xl border border-slate-300 dark:border-neutral-800 bg-white dark:bg-black p-3.5 text-xs sm:text-sm font-normal text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F3F74] placeholder:italic"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full bg-[#1F3F74] hover:bg-[#285091] px-6 py-2.5 text-xs font-bold text-white transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Submitting…' : 'Submit feedback'}
          </button>
        </form>
      ) : (
        <p className="border-y border-slate-200 dark:border-neutral-800 py-6 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Sign in to submit feedback.
        </p>
      )}

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
                className={`shrink-0 snap-start py-2.5 px-3 whitespace-nowrap rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs ${
                  isSelected
                    ? 'bg-[#1F3F74] text-white'
                    : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-800'
                }`}
              >
                <span>{cat === 'all' ? 'All' : `${cat} Star${cat > 1 ? 's' : ''}`}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback List or Frameless Empty State (No card box, no subtitle) */}
        {filteredReviews.length === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center text-center space-y-2">
            <Star className="w-8 h-8 text-slate-300 dark:text-neutral-700 stroke-1" />
            <p className="text-sm font-bold text-slate-700 dark:text-neutral-300">
              No ratings yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <article
                key={review.id}
                className="space-y-2 border-b border-slate-200 dark:border-neutral-800 pb-4"
              >
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#edf3fa] text-sm font-bold text-[#1F3F74] dark:bg-blue-950/60 dark:text-[#9fc8ee]">
                      {review.user_name?.trim().charAt(0).toUpperCase() || 'U'}
                      {review.profile_image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={review.profile_image_url}
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
                    className="flex items-center gap-1 text-amber-400"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < review.rating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-200 dark:text-neutral-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="whitespace-pre-line text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {review.comment}
                </p>

                <time className="text-[11px] text-slate-400 block" dateTime={review.created_at}>
                  {new Date(review.created_at).toLocaleDateString()}
                </time>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
