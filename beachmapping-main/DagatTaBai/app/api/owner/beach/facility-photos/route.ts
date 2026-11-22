import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };
type AuthorizedAuth = Extract<Awaited<ReturnType<typeof authorizeRoles>>, { authorized: true }>;

async function getOwnedFacility(auth: AuthorizedAuth, beachId: string, facilityId: string) {
  let beachQuery = (auth.adminClient.from('beaches') as any).select('id, ownerid').eq('id', beachId);
  if (auth.role !== 'admin') beachQuery = beachQuery.eq('ownerid', auth.user.id);
  const { data: beach, error: beachError } = await beachQuery.maybeSingle();
  if (beachError) throw beachError;
  if (!beach) {
    return { response: NextResponse.json({ error: 'Beach not found or unauthorized.' }, { status: 404 }) };
  }

  const { data: facility, error: facilityError } = await (auth.adminClient.from('facilities') as any)
    .select('id, beachid, images')
    .eq('id', facilityId)
    .eq('beachid', beach.id)
    .maybeSingle();
  if (facilityError) throw facilityError;
  if (!facility) {
    return { response: NextResponse.json({ error: 'Facility listing not found.' }, { status: 404 }) };
  }
  return { beach, facility };
}

function isOwnedFacilityPath(path: string, ownerId: string, beachId: string) {
  return path.startsWith(`${ownerId}/${beachId}/facilities/`) && !path.includes('..');
}

async function updateLegacyCover(auth: AuthorizedAuth, facilityId: string, beachId: string) {
  const { data: photos, error: photosError } = await (auth.adminClient.from('facilityphotos') as any)
    .select('imageurl')
    .eq('facilityid', facilityId)
    .order('sortorder', { ascending: true })
    .order('createdat', { ascending: true });
  if (photosError) throw photosError;
  const { error } = await (auth.adminClient.from('facilities') as any)
    .update({ images: photos?.length ? [photos[0].imageurl] : [] })
    .eq('id', facilityId)
    .eq('beachid', beachId);
  if (error) throw error;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }

    const body = await request.json();
    if (
      typeof body.beachid !== 'string'
      || typeof body.facilityid !== 'string'
      || typeof body.storagepath !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Beach, facility, and storage path are required.' },
        { status: 400, headers: noStoreHeaders }
      );
    }
    const owned = await getOwnedFacility(auth, body.beachid, body.facilityid);
    if ('response' in owned) return owned.response;
    if (!isOwnedFacilityPath(body.storagepath, owned.beach.ownerid, owned.beach.id)) {
      return NextResponse.json(
        { error: 'The photo storage path does not belong to this facility owner.' },
        { status: 403, headers: noStoreHeaders }
      );
    }

    const storage = auth.adminClient.storage.from('beach-media');
    const imageUrl = storage.getPublicUrl(body.storagepath).data.publicUrl;
    const { data: currentPhotos, error: currentError } = await (auth.adminClient.from('facilityphotos') as any)
      .select('sortorder')
      .eq('facilityid', owned.facility.id);
    if (currentError) throw currentError;
    const sortOrder = currentPhotos?.length
      ? currentPhotos.reduce((max: number, photo: { sortorder: number }) => Math.max(max, photo.sortorder), -1) + 1
      : 0;
    const { data: photo, error } = await (auth.adminClient.from('facilityphotos') as any)
      .insert({
        facilityid: owned.facility.id,
        imageurl: imageUrl,
        storagepath: body.storagepath,
        sortorder: sortOrder,
      })
      .select('id, facilityid, imageurl, storagepath, sortorder, createdat')
      .single();
    if (error) {
      const { error: cleanupError } = await storage.remove([body.storagepath]);
      if (cleanupError) console.error('Failed to clean up an unregistered facility photo:', cleanupError.message);
      throw error;
    }
    try {
      await updateLegacyCover(auth, owned.facility.id, owned.beach.id);
    } catch (coverError) {
      const { error: deleteRowError } = await (auth.adminClient.from('facilityphotos') as any)
        .delete()
        .eq('id', photo.id);
      if (deleteRowError) console.error('Failed to clean up a facility photo row after cover update failed:', deleteRowError.message);
      const { error: cleanupError } = await storage.remove([body.storagepath]);
      if (cleanupError) console.error('Failed to clean up a facility photo file after cover update failed:', cleanupError.message);
      throw coverError;
    }
    return NextResponse.json({ photo }, { status: 201, headers: noStoreHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save facility photo.';
    console.error('Owner facility photo POST error:', message);
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
    if (typeof body.beachid !== 'string' || typeof body.facilityid !== 'string' || !Array.isArray(body.photo_ids)) {
      return NextResponse.json(
        { error: 'Beach, facility, and ordered photo IDs are required.' },
        { status: 400, headers: noStoreHeaders }
      );
    }
    const owned = await getOwnedFacility(auth, body.beachid, body.facilityid);
    if ('response' in owned) return owned.response;

    const { data: photos, error } = await (auth.adminClient.from('facilityphotos') as any)
      .select('id')
      .eq('facilityid', owned.facility.id);
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
      const { error: updateError } = await (auth.adminClient.from('facilityphotos') as any)
        .update({ sortorder: sortOrder })
        .eq('id', photoId)
        .eq('facilityid', owned.facility.id);
      if (updateError) throw updateError;
    }
    await updateLegacyCover(auth, owned.facility.id, owned.beach.id);
    return NextResponse.json({ success: true }, { headers: noStoreHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reorder facility photos.';
    console.error('Owner facility photo PATCH error:', message);
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
    const beachId = params.get('beachid');
    const facilityId = params.get('facilityid');
    const photoId = params.get('photo_id');
    if (!beachId || !facilityId || !photoId) {
      return NextResponse.json(
        { error: 'Beach, facility, and photo IDs are required.' },
        { status: 400, headers: noStoreHeaders }
      );
    }
    const owned = await getOwnedFacility(auth, beachId, facilityId);
    if ('response' in owned) return owned.response;

    const { data: photo, error: photoError } = await (auth.adminClient.from('facilityphotos') as any)
      .select('id, storagepath')
      .eq('id', photoId)
      .eq('facilityid', owned.facility.id)
      .maybeSingle();
    if (photoError) throw photoError;
    if (!photo) {
      return NextResponse.json({ error: 'Facility photo not found.' }, { status: 404, headers: noStoreHeaders });
    }
    if (!isOwnedFacilityPath(photo.storagepath, owned.beach.ownerid, owned.beach.id)) {
      return NextResponse.json(
        { error: 'The photo storage path does not belong to this facility owner.' },
        { status: 403, headers: noStoreHeaders }
      );
    }

    const { error: removeError } = await auth.adminClient.storage.from('beach-media').remove([photo.storagepath]);
    if (removeError) throw removeError;
    const { error: deleteError } = await (auth.adminClient.from('facilityphotos') as any)
      .delete()
      .eq('id', photo.id)
      .eq('facilityid', owned.facility.id);
    if (deleteError) throw deleteError;
    await updateLegacyCover(auth, owned.facility.id, owned.beach.id);
    return NextResponse.json({ success: true }, { headers: noStoreHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove facility photo.';
    console.error('Owner facility photo DELETE error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}
