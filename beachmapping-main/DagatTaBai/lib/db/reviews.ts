import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { invalidateBeachesCache } from '@/lib/db/beaches';

export async function syncBeachAverageRating(beachId: string): Promise<void> {
  if (!beachId || beachId === 'platform') return;
  try {
    const adminSupabase = createAdminClient();
    const { data: rows } = await (adminSupabase.from('beachreviews') as any)
      .select('rating')
      .eq('beachid', beachId);

    const ratings = Array.isArray(rows)
      ? rows.map((r: any) => Number(r.rating)).filter((n: number) => Number.isFinite(n) && n > 0)
      : [];

    const avg =
      ratings.length > 0
        ? Math.round((ratings.reduce((sum: number, val: number) => sum + val, 0) / ratings.length) * 10) / 10
        : 0;

    await (adminSupabase.from('beaches') as any)
      .update({ averagerating: avg, updatedat: new Date().toISOString() })
      .eq('id', beachId);

    invalidateBeachesCache();
  } catch {
    // Non-fatal if rating sync fails
  }
}

export interface ReviewRecord {
  id: string;
  beachid: string;
  beach_slug?: string;
  userid: string;
  user_name: string;
  beachname?: string;
  review_type?: 'beach' | 'platform';
  rating: number;
  comment: string;
  createdat: string;
  updatedat: string;
}

export async function getReviewsForBeach(beachId: string): Promise<ReviewRecord[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await (supabase.from('beachreviews') as any)
    .select('*, profiles:userid(fullname)')
    .eq('beachid', beachId)
    .order('createdat', { ascending: false });
  if (error) throw error;

  return (data || []).map((review: any) => ({
    id: review.id,
    beachid: review.beachid,
    userid: review.userid,
    user_name: review.profiles?.fullname || 'Verified Visitor',
    review_type: 'beach' as const,
    rating: Number(review.rating),
    comment: review.comment,
    createdat: review.createdat,
    updatedat: review.updatedat,
  }));
}

export async function getReviewsByUserId(userId: string): Promise<ReviewRecord[]> {
  const supabase = createAdminClient();

  // 1. Fetch beach reviews
  const { data: beachData } = await (supabase.from('beachreviews') as any)
    .select('*, beaches:beachid(name, slug)')
    .eq('userid', userId)
    .order('createdat', { ascending: false });

  // 2. Fetch platform feedback reviews
  const { data: platformData } = await (supabase.from('platformreviews') as any)
    .select('*')
    .eq('userid', userId)
    .order('createdat', { ascending: false });

  const beachReviews: ReviewRecord[] = (beachData || []).map((review: any) => ({
    id: review.id,
    beachid: review.beachid,
    beach_slug: review.beaches?.slug,
    userid: review.userid,
    user_name: 'You',
    beachname: review.beaches?.name || 'Beach Destination',
    review_type: 'beach' as const,
    rating: Number(review.rating),
    comment: review.comment,
    createdat: review.createdat,
    updatedat: review.updatedat,
  }));

  const platformReviews: ReviewRecord[] = (platformData || []).map((review: any) => ({
    id: review.id,
    beachid: 'platform',
    userid: review.userid,
    user_name: 'You',
    beachname: 'Dagat Ta Bai Platform Feedback',
    review_type: 'platform' as const,
    rating: Number(review.rating),
    comment: review.comment,
    createdat: review.createdat,
    updatedat: review.createdat,
  }));

  return [...beachReviews, ...platformReviews].sort(
    (a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime()
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
  const { data, error } = await (supabase.from('beachreviews') as any)
    .insert({
      beachid: payload.beachId,
      userid: payload.userId,
      rating,
      comment,
    })
    .select('*, beaches:beachid(name, slug)')
    .single();
  if (error) throw error;

  await syncBeachAverageRating(payload.beachId);

  return {
    id: data.id,
    beachid: data.beachid,
    userid: data.userid,
    user_name: payload.userName,
    beachname: data.beaches?.name || payload.beachName,
    beach_slug: data.beaches?.slug,
    rating: Number(data.rating),
    comment: data.comment,
    createdat: data.createdat,
    updatedat: data.updatedat,
  };
}

export async function deleteReview(reviewId: string, userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  await (supabase.from('reviewreports') as any).delete().eq('reviewid', reviewId);
  const { data: beachDeleted } = await (supabase.from('beachreviews') as any)
    .delete()
    .eq('id', reviewId)
    .eq('userid', userId)
    .select('id, beachid');
  if (Array.isArray(beachDeleted) && beachDeleted.length > 0) {
    if (beachDeleted[0]?.beachid) {
      await syncBeachAverageRating(beachDeleted[0].beachid);
    }
    return true;
  }

  const { data: platformDeleted } = await (supabase.from('platformreviews') as any)
    .delete()
    .eq('id', reviewId)
    .eq('userid', userId)
    .select('id');
  return Array.isArray(platformDeleted) && platformDeleted.length > 0;
}
