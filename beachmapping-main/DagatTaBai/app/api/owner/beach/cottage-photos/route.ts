import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };
type AuthorizedAuth = Extract<Awaited<ReturnType<typeof authorizeRoles>>, { authorized: true }>;

async function getOwnedCottage(auth: AuthorizedAuth, beachId: string, cottageId: string) {
  let beachQuery = (auth.adminClient.from('beaches') as any).select('id, owner_id').eq('id', beachId);
  if (auth.role !== 'admin') beachQuery = beachQuery.eq('owner_id', auth.user.id);
  const { data: beach, error: beachError } = await beachQuery.maybeSingle();
  if (beachError) throw beachError;
  if (!beach) return { response: NextResponse.json({ error: 'Beach not found or unauthorized.' }, { status: 404 }) };

  const { data: cottage, error: cottageError } = await (auth.adminClient.from('beach_cottages') as any)
    .select('id, beach_id, images')
    .eq('id', cottageId)
    .eq('beach_id', beach.id)
    .maybeSingle();
  if (cottageError) throw cottageError;
  if (!cottage) return { response: NextResponse.json({ error: 'Cottage listing not found.' }, { status: 404 }) };
  return { beach, cottage };
}

function isOwnedCottagePath(path: string, ownerId: string, beachId: string) {
  return path.startsWith(`${ownerId}/${beachId}/cottages/`) && !path.includes('..');
}

async function updateLegacyCover(auth: AuthorizedAuth, cottageId: string, beachId: string) {
  const { data: photos, error: photosError } = await (auth.adminClient.from('beach_cottage_photos') as any)
    .select('image_url')
    .eq('cottage_id', cottageId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (photosError) throw photosError;
  const { error } = await (auth.adminClient.from('beach_cottages') as any)
    .update({ images: photos?.length ? [photos[0].image_url] : [] })
    .eq('id', cottageId)
    .eq('beach_id', beachId);
  if (error) throw error;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }

    const body = await request.json();
    if (typeof body.beach_id !== 'string' || typeof body.cottage_id !== 'string' || typeof body.storage_path !== 'string') {
      return NextResponse.json({ error: 'Beach, cottage, and storage path are required.' }, { status: 400, headers: noStoreHeaders });
    }
    const owned = await getOwnedCottage(auth, body.beach_id, body.cottage_id);
    if ('response' in owned) return owned.response;
    if (!isOwnedCottagePath(body.storage_path, owned.beach.owner_id, owned.beach.id)) {
      return NextResponse.json({ error: 'The photo storage path does not belong to this cottage owner.' }, { status: 403, headers: noStoreHeaders });
    }

    const storage = auth.adminClient.storage.from('beach-media');
    const imageUrl = storage.getPublicUrl(body.storage_path).data.publicUrl;
    const { data: currentPhotos, error: currentError } = await (auth.adminClient.from('beach_cottage_photos') as any)
      .select('id, sort_order')
      .eq('cottage_id', owned.cottage.id)
      .order('sort_order', { ascending: true });
    if (currentError) throw currentError;
    if (!currentPhotos?.length) {
      body.sort_order = 0;
    } else {
      body.sort_order = currentPhotos.reduce((max: number, photo: { sort_order: number }) => Math.max(max, photo.sort_order), -1) + 1;
    }

    const { data: photo, error } = await (auth.adminClient.from('beach_cottage_photos') as any)
      .insert({
        cottage_id: owned.cottage.id,
        image_url: imageUrl,
        storage_path: body.storage_path,
        sort_order: body.sort_order,
      })
      .select('id, cottage_id, image_url, storage_path, sort_order, created_at')
      .single();
    if (error) {
      const { error: cleanupError } = await storage.remove([body.storage_path]);
      if (cleanupError) console.error('Failed to clean up an unregistered cottage photo:', cleanupError.message);
      throw error;
    }
    try {
      await updateLegacyCover(auth, owned.cottage.id, owned.beach.id);
    } catch (coverError) {
      const { error: deleteRowError } = await (auth.adminClient.from('beach_cottage_photos') as any)
        .delete()
        .eq('id', photo.id);
      if (deleteRowError) console.error('Failed to clean up a cottage photo row after cover update failed:', deleteRowError.message);
      const { error: cleanupError } = await storage.remove([body.storage_path]);
      if (cleanupError) console.error('Failed to clean up a cottage photo file after cover update failed:', cleanupError.message);
      throw coverError;
    }
    return NextResponse.json({ photo }, { status: 201, headers: noStoreHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save cottage photo.';
    console.error('Owner cottage photo POST error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }
    const body = await request.json();
    if (typeof body.beach_id !== 'string' || typeof body.cottage_id !== 'string' || !Array.isArray(body.photo_ids)) {
      return NextResponse.json({ error: 'Beach, cottage, and ordered photo IDs are required.' }, { status: 400, headers: noStoreHeaders });
    }
    const owned = await getOwnedCottage(auth, body.beach_id, body.cottage_id);
    if ('response' in owned) return owned.response;

    const { data: photos, error } = await (auth.adminClient.from('beach_cottage_photos') as any)
      .select('id')
      .eq('cottage_id', owned.cottage.id);
    if (error) throw error;
    const requestedIds = new Set(body.photo_ids);
    if (
      photos.length !== body.photo_ids.length
      || requestedIds.size !== body.photo_ids.length
      || photos.some((photo: { id: string }) => !requestedIds.has(photo.id))
    ) {
      return NextResponse.json({ error: 'The photo list changed. Refresh and try again.' }, { status: 409, headers: noStoreHeaders });
    }

    for (const [sortOrder, photoId] of body.photo_ids.entries()) {
      const { error: updateError } = await (auth.adminClient.from('beach_cottage_photos') as any)
        .update({ sort_order: sortOrder })
        .eq('id', photoId)
        .eq('cottage_id', owned.cottage.id);
      if (updateError) throw updateError;
    }
    await updateLegacyCover(auth, owned.cottage.id, owned.beach.id);
    return NextResponse.json({ success: true }, { headers: noStoreHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reorder cottage photos.';
    console.error('Owner cottage photo PATCH error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }
    const params = request.nextUrl.searchParams;
    const beachId = params.get('beach_id');
    const cottageId = params.get('cottage_id');
    const photoId = params.get('photo_id');
    if (!beachId || !cottageId || !photoId) {
      return NextResponse.json({ error: 'Beach, cottage, and photo IDs are required.' }, { status: 400, headers: noStoreHeaders });
    }
    const owned = await getOwnedCottage(auth, beachId, cottageId);
    if ('response' in owned) return owned.response;

    const { data: photo, error: photoError } = await (auth.adminClient.from('beach_cottage_photos') as any)
      .select('id, storage_path')
      .eq('id', photoId)
      .eq('cottage_id', owned.cottage.id)
      .maybeSingle();
    if (photoError) throw photoError;
    if (!photo) return NextResponse.json({ error: 'Cottage photo not found.' }, { status: 404, headers: noStoreHeaders });
    if (!isOwnedCottagePath(photo.storage_path, owned.beach.owner_id, owned.beach.id)) {
      return NextResponse.json({ error: 'The photo storage path does not belong to this cottage owner.' }, { status: 403, headers: noStoreHeaders });
    }

    const { error: removeError } = await auth.adminClient.storage.from('beach-media').remove([photo.storage_path]);
    if (removeError) throw removeError;
    const { error: deleteError } = await (auth.adminClient.from('beach_cottage_photos') as any)
      .delete()
      .eq('id', photo.id)
      .eq('cottage_id', owned.cottage.id);
    if (deleteError) throw deleteError;
    await updateLegacyCover(auth, owned.cottage.id, owned.beach.id);
    return NextResponse.json({ success: true }, { headers: noStoreHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove cottage photo.';
    console.error('Owner cottage photo DELETE error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}
