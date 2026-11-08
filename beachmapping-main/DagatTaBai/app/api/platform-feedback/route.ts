import { NextResponse } from 'next/server';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentSession } from '@/lib/db/auth';

interface PlatformReviewRow {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: { full_name: string | null; profile_image_url: string | null; role: string | null } | null;
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('platform_reviews') as any)
      .select('id, rating, comment, created_at, profiles:profiles!platform_reviews_user_id_fkey(full_name, profile_image_url, role)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;

    return NextResponse.json((data || []).map((review: PlatformReviewRow) => ({
      id: review.id,
      user_name: review.profiles?.full_name || 'Dagat Ta Bai user',
      profile_image_url: review.profiles?.profile_image_url || null,
      user_role: review.profiles?.role || 'user',
      rating: Number(review.rating),
      comment: review.comment,
      created_at: review.created_at,
    })), { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not load platform feedback.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentSession();
    if (!user) return NextResponse.json({ error: 'Sign in to leave platform feedback.' }, { status: 401 });

    const body = await request.json();
    const rating = Number(body.rating);
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Choose a rating from 1 to 5.' }, { status: 400 });
    }
    if (comment.length < 5 || comment.length > 2000) {
      return NextResponse.json({ error: 'Feedback must be 5 to 2,000 characters.' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('platform_reviews') as any)
      .insert({ user_id: user.id, rating, comment })
      .select('id, rating, comment, created_at')
      .single();
    if (error) throw error;
    return NextResponse.json({
      ...data,
      user_name: user.full_name,
      profile_image_url: user.profile_image_url || null,
      user_role: user.role,
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not save platform feedback.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}