import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface ReviewRecord {
  id: string;
  beach_id: string;
  beach_slug?: string;
  user_id: string;
  user_name: string;
  beach_name?: string;
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
    rating: Number(review.rating),
    comment: review.comment,
    created_at: review.created_at,
    updated_at: review.updated_at,
  }));
}

export async function getReviewsByUserId(userId: string): Promise<ReviewRecord[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await (supabase.from('beach_reviews') as any)
    .select('*, beaches:beach_id(name, slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map((review: any) => ({
    id: review.id,
    beach_id: review.beach_id,
    beach_slug: review.beaches?.slug,
    user_id: review.user_id,
    user_name: 'You',
    beach_name: review.beaches?.name || 'Beach Destination',
    rating: Number(review.rating),
    comment: review.comment,
    created_at: review.created_at,
    updated_at: review.updated_at,
  }));
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
  const supabase = await createServerSupabaseClient();
  const { data, error } = await (supabase.from('beach_reviews') as any)
    .delete()
    .eq('id', reviewId)
    .eq('user_id', userId)
    .select('id');
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}
