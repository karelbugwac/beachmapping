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

    const [cottagesResult, facilitiesResult, postsResult] = await Promise.all([
      (supabase.from('beach_cottages') as any)
        .select('id, name, description, price, capacity_label, capacity, images')
        .eq('beach_id', beach.id)
        .eq('is_available', true)
        .order('display_order'),
      (supabase.from('beach_facilities') as any)
        .select('id, name, category, description, price, price_label, images')
        .eq('beach_id', beach.id)
        .eq('is_available', true)
        .order('display_order'),
      (supabase.from('beach_posts') as any)
        .select('id, caption, image_path, created_at')
        .eq('beach_id', beach.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false }),
    ]);
    if (cottagesResult.error) throw cottagesResult.error;
    if (facilitiesResult.error) throw facilitiesResult.error;
    if (postsResult.error) throw postsResult.error;

    return NextResponse.json({
      ...beach,
      cottages: (cottagesResult.data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: item.price == null ? null : String(item.price),
        capacity: item.capacity_label || (item.capacity ? `${item.capacity} persons` : null),
        image_url: item.images?.[0] || null,
      })),
      facility_items: (facilitiesResult.data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category || 'amenity',
        description: item.description || '',
        price: item.price_label ?? (item.price == null ? null : String(item.price)),
        image_url: item.images?.[0] || null,
      })),
      posts: (postsResult.data || []).map((item: any) => ({
        id: item.id,
        caption: item.caption || '',
        image_url: item.image_path || null,
        created_at: item.created_at,
      })),
      review_count: count || 0,
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
