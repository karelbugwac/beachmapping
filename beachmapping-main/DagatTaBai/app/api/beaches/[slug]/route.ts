import { NextRequest, NextResponse } from 'next/server';
import { getBeachBySlug } from '@/lib/db/beaches';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type BeachPhotoRow = {
  id: string;
  image_url: string;
  storage_path: string | null;
  sort_order: number | null;
};

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
        .select('id, name, description, price, capacity_label, capacity, images, photos:beach_cottage_photos(id, image_url, storage_path, sort_order, created_at)')
        .eq('beach_id', beach.id)
        .eq('is_available', true)
        .order('display_order')
        .order('sort_order', { referencedTable: 'beach_cottage_photos', ascending: true }),
      (supabase.from('beach_facilities') as any)
        .select('id, name, category, description, price, price_label, images, photos:beach_facility_photos(id, image_url, storage_path, sort_order, created_at)')
        .eq('beach_id', beach.id)
        .eq('is_available', true)
        .order('display_order')
        .order('sort_order', { referencedTable: 'beach_facility_photos', ascending: true }),
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
      cottages: (cottagesResult.data || []).map((item: any) => {
        const photos = Array.isArray(item.photos) && item.photos.length
          ? item.photos
            .sort((left: BeachPhotoRow, right: BeachPhotoRow) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
            .map((photo: BeachPhotoRow) => ({
              id: photo.id,
              image_url: /^https?:\/\//i.test(photo.image_url)
                ? photo.image_url
                : supabase.storage.from('beach-media').getPublicUrl(photo.image_url).data.publicUrl,
              storage_path: photo.storage_path,
              sort_order: photo.sort_order,
            }))
          : (Array.isArray(item.images) ? item.images : []).map((image_url: string, sort_order: number) => ({
            image_url: /^https?:\/\//i.test(image_url)
              ? image_url
              : supabase.storage.from('beach-media').getPublicUrl(image_url).data.publicUrl,
            storage_path: '',
            sort_order,
          }));
        return {
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.price == null ? null : String(item.price),
          capacity: item.capacity_label || (item.capacity ? `${item.capacity} persons` : null),
          image_url: photos[0]?.image_url || null,
          photos,
        };
      }),
      facility_items: (facilitiesResult.data || []).map((item: any) => {
        const photos = Array.isArray(item.photos) && item.photos.length
          ? item.photos
            .sort((left: any, right: any) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
            .map((photo: any) => ({
              id: photo.id,
              image_url: /^https?:\/\//i.test(photo.image_url)
                ? photo.image_url
                : supabase.storage.from('beach-media').getPublicUrl(photo.image_url).data.publicUrl,
              storage_path: photo.storage_path,
              sort_order: photo.sort_order,
            }))
          : (Array.isArray(item.images) ? item.images : [])
            .filter((image_url: unknown): image_url is string => typeof image_url === 'string' && image_url.length > 0)
            .map((image_url: string, sort_order: number) => ({
              image_url: /^https?:\/\//i.test(image_url)
                ? image_url
                : supabase.storage.from('beach-media').getPublicUrl(image_url).data.publicUrl,
              storage_path: '',
              sort_order,
            }));
        return {
          id: item.id,
          name: item.name,
          category: item.category || 'amenity',
          description: item.description || '',
          price: item.price_label ?? (item.price == null ? null : String(item.price)),
          image_url: photos[0]?.image_url || null,
          photos,
        };
      }),
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
