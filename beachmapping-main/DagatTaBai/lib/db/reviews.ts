import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { invalidateBeachesCache } from '@/lib/db/beaches';

export async function syncBeachAverageRating(beachId: string): Promise<void> {
  if (!beachId || beachId === 'platform') return;
  try {
    const adminSupabase = createAdminClient();
    const { data: rows } = await (adminSupabase.from('beach_reviews') as any)
      .select('rating')
      .eq('beach_id', beachId);

    const ratings = Array.isArray(rows)
      ? rows.map((r: any) => Number(r.rating)).filter((n: number) => Number.isFinite(n) && n > 0)
      : [];

    const avg =
      ratings.length > 0
        ? Math.round((ratings.reduce((sum: number, val: number) => sum + val, 0) / ratings.length) * 10) / 10
        : 0;

    await (adminSupabase.from('beaches') as any)
      .update({ average_rating: avg, updated_at: new Date().toISOString() })
      .eq('id', beachId);

    invalidateBeachesCache();
  } catch {
    // Non-fatal if rating sync fails
  }
}

export interface ReviewRecord {
  id: string;
  beach_id: string;
  beach_slug?: string;
  user_id: string;
  user_name: string;
  beach_name?: string;
  review_type?: 'beach' | 'platform';
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export async function getReviewsForBeach(beachId: string): Promise<ReviewRecord[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await (supabase.from('beach_reviews') as any)
    .select('*, profiles:user_id(full_name)')
    .eq('beach_id', beachId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map((review: any) => ({
    id: review.id,
    beach_id: review.beach_id,
    user_id: review.user_id,
    user_name: review.profiles?.full_name || 'Verified Visitor',
    review_type: 'beach' as const,
    rating: Number(review.rating),
    comment: review.comment,
    created_at: review.created_at,
    updated_at: review.updated_at,
  }));
}

export async function getReviewsByUserId(userId: string): Promise<ReviewRecord[]> {
  const supabase = createAdminClient();

  // 1. Fetch beach reviews
  const { data: beachData } = await (supabase.from('beach_reviews') as any)
    .select('*, beaches:beach_id(name, slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // 2. Fetch platform feedback reviews
  const { data: platformData } = await (supabase.from('platform_reviews') as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const beachReviews: ReviewRecord[] = (beachData || []).map((review: any) => ({
    id: review.id,
    beach_id: review.beach_id,
    beach_slug: review.beaches?.slug,
    user_id: review.user_id,
    user_name: 'You',
    beach_name: review.beaches?.name || 'Beach Destination',
    review_type: 'beach' as const,
    rating: Number(review.rating),
    comment: review.comment,
    created_at: review.created_at,
    updated_at: review.updated_at,
  }));

  const platformReviews: ReviewRecord[] = (platformData || []).map((review: any) => ({
    id: review.id,
    beach_id: 'platform',
    user_id: review.user_id,
    user_name: 'You',
    beach_name: 'Dagat Ta Bai Platform Feedback',
    review_type: 'platform' as const,
    rating: Number(review.rating),
    comment: review.comment,
    created_at: review.created_at,
    updated_at: review.created_at,
  }));

  return [...beachReviews, ...platformReviews].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function createReview(payload: {
  beachId: string;
  userId: string;
  userName: string;
  beachName?: string;
  rating: number;
  comment: string;
}): Promise<ReviewRecord> {
  const rating = Math.max(1, Math.min(5, Math.round(payload.rating)));
  const comment = payload.comment.trim();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await (supabase.from('beach_reviews') as any)
    .insert({
      beach_id: payload.beachId,
      user_id: payload.userId,
      rating,
      comment,
    })
    .select('*, beaches:beach_id(name, slug)')
    .single();
  if (error) throw error;

  await syncBeachAverageRating(payload.beachId);

  return {
    id: data.id,
    beach_id: data.beach_id,
    user_id: data.user_id,
    user_name: payload.userName,
    beach_name: data.beaches?.name || payload.beachName,
    beach_slug: data.beaches?.slug,
    rating: Number(data.rating),
    comment: data.comment,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function deleteReview(reviewId: string, userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  await (supabase.from('beach_review_reports') as any).delete().eq('review_id', reviewId);
  const { data: beachDeleted } = await (supabase.from('beach_reviews') as any)
    .delete()
    .eq('id', reviewId)
    .eq('user_id', userId)
    .select('id, beach_id');
  if (Array.isArray(beachDeleted) && beachDeleted.length > 0) {
    if (beachDeleted[0]?.beach_id) {
      await syncBeachAverageRating(beachDeleted[0].beach_id);
    }
    return true;
  }

  const { data: platformDeleted } = await (supabase.from('platform_reviews') as any)
    .delete()
    .eq('id', reviewId)
    .eq('user_id', userId)
    .select('id');
  return Array.isArray(platformDeleted) && platformDeleted.length > 0;
}
