import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentSession } from '@/lib/db/auth';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await (supabase.from('platform_reviews') as any)
      .select('id, rating, comment, created_at, profiles:user_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;

    return NextResponse.json((data || []).map((review: any) => ({
      id: review.id,
      user_name: review.profiles?.full_name || 'Dagat Ta Bai user',
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
    const { data, error } = await (supabase.from('platform_reviews') as any)
      .insert({ user_id: user.id, rating, comment })
      .select('id, rating, comment, created_at')
      .single();
    if (error) throw error;
    return NextResponse.json({ ...data, user_name: user.full_name }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not save platform feedback.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}