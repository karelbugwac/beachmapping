import { NextRequest, NextResponse } from 'next/server';
import { getBeachBySlug } from '@/lib/db/beaches';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Beach slug is required.' }, { status: 400 });
    }

    const beach = await getBeachBySlug(slug);
    if (!beach) {
      return NextResponse.json({ error: 'Beach not found.' }, { status: 404 });
    }

    const supabase = await createServerSupabaseClient();
    const { count, error } = await (supabase.from('beach_reviews') as any)
      .select('id', { count: 'exact', head: true })
      .eq('beach_id', beach.id);
    if (error) throw error;

    return NextResponse.json({ ...beach, review_count: count || 0 }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
