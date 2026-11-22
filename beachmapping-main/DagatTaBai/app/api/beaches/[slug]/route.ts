import { NextRequest, NextResponse } from 'next/server';
import { getBeachBySlug } from '@/lib/db/beaches';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type BeachPhotoRow = {
  id: string;
  imageurl: string;
  storagepath: string | null;
  sortorder: number | null;
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
    const { count, error } = await (supabase.from('beachreviews') as any)
      .select('id', { count: 'exact', head: true })
      .eq('beachid', beach.id);
    if (error) throw error;

    const [cottagesResult, facilitiesResult, postsResult] = await Promise.all([
      (supabase.from('cottages') as any)
        .select('id, name, description, price, capacitylabel, capacity, images, photos:cottagephotos(id, imageurl, storagepath, sortorder, createdat)')
        .eq('beachid', beach.id)
        .eq('isavailable', true)
        .order('displayorder')
        .order('sortorder', { referencedTable: 'cottagephotos', ascending: true }),
      (supabase.from('facilities') as any)
        .select('id, name, category, description, price, pricelabel, rates, images, photos:facilityphotos(id, imageurl, storagepath, sortorder, createdat)')
        .eq('beachid', beach.id)
        .eq('isavailable', true)
        .order('displayorder')
        .order('sortorder', { referencedTable: 'facilityphotos', ascending: true }),
      (supabase.from('beachposts') as any)
        .select('id, caption, imagepath, createdat')
        .eq('beachid', beach.id)
        .eq('status', 'published')
        .order('createdat', { ascending: false }),
    ]);
    if (cottagesResult.error) throw cottagesResult.error;
    if (facilitiesResult.error) throw facilitiesResult.error;
    if (postsResult.error) throw postsResult.error;

    return NextResponse.json({
      ...beach,
      cottages: (cottagesResult.data || []).map((item: any) => {
        const photos = Array.isArray(item.photos) && item.photos.length
          ? item.photos
            .sort((left: BeachPhotoRow, right: BeachPhotoRow) => Number(left.sortorder || 0) - Number(right.sortorder || 0))
            .map((photo: BeachPhotoRow) => ({
              id: photo.id,
              imageurl: /^https?:\/\//i.test(photo.imageurl)
                ? photo.imageurl
                : supabase.storage.from('beach-media').getPublicUrl(photo.imageurl).data.publicUrl,
              storagepath: photo.storagepath,
              sortorder: photo.sortorder,
            }))
          : (Array.isArray(item.images) ? item.images : []).map((imageurl: string, sortorder: number) => ({
            imageurl: /^https?:\/\//i.test(imageurl)
              ? imageurl
              : supabase.storage.from('beach-media').getPublicUrl(imageurl).data.publicUrl,
            storagepath: '',
            sortorder,
          }));
        return {
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.price == null ? null : String(item.price),
          capacity: item.capacitylabel || (item.capacity ? `${item.capacity} persons` : null),
          imageurl: photos[0]?.imageurl || null,
          photos,
        };
      }),
      facility_items: (facilitiesResult.data || []).map((item: any) => {
        const photos = Array.isArray(item.photos) && item.photos.length
          ? item.photos
            .sort((left: any, right: any) => Number(left.sortorder || 0) - Number(right.sortorder || 0))
            .map((photo: any) => ({
              id: photo.id,
              imageurl: /^https?:\/\//i.test(photo.imageurl)
                ? photo.imageurl
                : supabase.storage.from('beach-media').getPublicUrl(photo.imageurl).data.publicUrl,
              storagepath: photo.storagepath,
              sortorder: photo.sortorder,
            }))
          : (Array.isArray(item.images) ? item.images : [])
            .filter((imageurl: unknown): imageurl is string => typeof imageurl === 'string' && imageurl.length > 0)
            .map((imageurl: string, sortorder: number) => ({
              imageurl: /^https?:\/\//i.test(imageurl)
                ? imageurl
                : supabase.storage.from('beach-media').getPublicUrl(imageurl).data.publicUrl,
              storagepath: '',
              sortorder,
            }));
        return {
          id: item.id,
          name: item.name,
          category: item.category || 'amenity',
          description: item.description || '',
          price: item.pricelabel ?? (item.price == null ? null : String(item.price)),
          rates: Array.isArray(item.rates) ? item.rates : [],
          imageurl: photos[0]?.imageurl || null,
          photos,
        };
      }),
      posts: (postsResult.data || []).map((item: any) => ({
        id: item.id,
        caption: item.caption || '',
        imageurl: item.imagepath || null,
        createdat: item.createdat,
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
