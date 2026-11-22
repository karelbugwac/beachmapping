import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { invalidateBeachesCache } from '@/lib/db/beaches';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/utils/image-upload-config';

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };

function toOwnerBeach(row: any) {
  const feeParts = typeof row.entrancefee === 'string' ? row.entrancefee.split('|') : [];
  const adultFee = row.general_information_fee ?? (feeParts[0] ?? null);
  const childFee = row.child_entrance_fee_value ?? (feeParts[1] ?? null);
  const seniorFee = row.senior_entrance_fee_value ?? (feeParts[2] ?? null);
  return {
    ...row,
    cover_image: row.coverimageurl || null,
    profile_image: row.profileimageurl || null,
    images: Array.isArray(row.images) ? row.images : [],
    openinghours: (() => {
      if (typeof row.openinghours === 'string' && row.openinghours.startsWith('{')) {
        try {
          return JSON.parse(row.openinghours);
        } catch {
          return {
            Mon: '',
            Tue: '',
            Wed: '',
            Thu: '',
            Fri: '',
            Sat: '',
            Sun: ''
          };
        }
      }
      if (typeof row.openinghours === 'object') {
        return row.openinghours;
      }
      return {
        Mon: '',
        Tue: '',
        Wed: '',
        Thu: '',
        Fri: '',
        Sat: '',
        Sun: ''
      };
    })(),
    entrancefee: adultFee == null && childFee == null && seniorFee == null ? null : `${adultFee ?? ''}|${childFee ?? ''}|${seniorFee ?? ''}`,
    entrance_fee_adults: adultFee == null ? '' : String(adultFee),
    entrance_fee_children: childFee == null ? '' : String(childFee),
    entrance_fee_senior: seniorFee == null ? '' : String(seniorFee),
    cottagefee: row.cottagefee || null,
    rules: row.rules || null,
    averagerating: Number(row.averagerating || 0),
    amenities: [],
    activities: [],
    external_links: [],
  };
}

function getImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === 'string') return [item];
    if (!item || typeof item !== 'object') return [];
    const url = (item as { photo_url?: unknown; url?: unknown }).photo_url
      || (item as { url?: unknown }).url;
    return typeof url === 'string' ? [url] : [];
  });
}

function getOwnedGalleryStoragePath(
  publicRoot: string,
  imageUrl: string,
  ownerId: string,
  beachId: string
): string | null {
  if (!imageUrl.startsWith(publicRoot)) return null;
  let path: string;
  try {
    path = decodeURIComponent(imageUrl.slice(publicRoot.length).split('?')[0]);
  } catch {
    return null;
  }
  const ownerBeachPrefix = `${ownerId}/${beachId}/`;
  if (
    !path.startsWith(ownerBeachPrefix) ||
    path.includes('..') ||
    !/^[^/]+\.(?:webp|jpg)$/i.test(path.slice(ownerBeachPrefix.length))
  ) {
    return null;
  }
  return path;
}

async function toOwnerBeachWithFees(adminSupabase: ReturnType<typeof createAdminClient>, row: any) {
  const { data: generalInformation, error } = await (adminSupabase
    .from('beachinfo') as any)
    .select('entrancefee, childentrancefee, seniorentrancefee')
    .eq('beachid', row.id)
    .maybeSingle();
  if (error) throw error;

  return toOwnerBeach({
    ...row,
    general_information_fee: generalInformation?.entrancefee ?? null,
    child_entrance_fee_value: generalInformation?.childentrancefee ?? null,
    senior_entrance_fee_value: generalInformation?.seniorentrancefee ?? null,
  });
}

export async function GET(request: Request) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }
    const ownerId = auth.user.id;
    const url = new URL(request.url);
    const requestedBeachId = url.searchParams.get('beachid');
    const requestedSlug = url.searchParams.get('slug');

    const adminSupabase = createAdminClient();

    // If a specific beach is requested by id or slug:
    if (requestedBeachId || requestedSlug) {
      let query = (adminSupabase.from('beaches') as any).select('*');
      if (requestedBeachId) {
        query = query.eq('id', requestedBeachId);
      } else if (requestedSlug) {
        query = query.eq('slug', requestedSlug);
      }
      if (auth.role !== 'admin') {
        query = query.eq('ownerid', ownerId);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return NextResponse.json(
        data ? [await toOwnerBeachWithFees(adminSupabase, data)] : [],
        { headers: noStoreHeaders }
      );
    }

    // Otherwise, fetch all beaches belonging to this owner (or all beaches if admin)
    let query = (adminSupabase.from('beaches') as any).select('*');
    if (auth.role !== 'admin') {
      query = query.eq('ownerid', ownerId);
    }
    const { data, error } = await query.order('name');

    if (error) throw error;

    return NextResponse.json(
      Array.isArray(data)
        ? await Promise.all(data.map((row: any) => toOwnerBeachWithFees(adminSupabase, row)))
        : [],
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load owner beach.';
    console.error('Owner beach GET error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }
    const ownerId = auth.user.id;

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const location = typeof body.location === 'string' ? body.location.trim() : '';
    if (!name || !location) {
      return NextResponse.json(
        { error: 'Resort name and location address are required.' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const rawLatitude = body.latitude == null ? '' : String(body.latitude).trim();
    const rawLongitude = body.longitude == null ? '' : String(body.longitude).trim();
    const hasCoordinateInput = rawLatitude !== '' || rawLongitude !== '';
    const parsedLatitude = rawLatitude ? Number.parseFloat(rawLatitude) : Number.NaN;
    const parsedLongitude = rawLongitude ? Number.parseFloat(rawLongitude) : Number.NaN;
    const isValidLatitude = Number.isFinite(parsedLatitude) && parsedLatitude >= -90 && parsedLatitude <= 90;
    const isValidLongitude = Number.isFinite(parsedLongitude) && parsedLongitude >= -180 && parsedLongitude <= 180;
    const hasValidCoordinatePair = isValidLatitude && isValidLongitude;
    if (hasCoordinateInput && !hasValidCoordinatePair) {
      return NextResponse.json(
        { error: 'Enter both valid map coordinates or leave both empty until a pin is set.' },
        { status: 400, headers: noStoreHeaders }
      );
    }
    const parseOptionalFee = (value: unknown) => {
      if (value === null || value === undefined || String(value).trim() === '') return null;
      const fee = Number(value);
      if (!Number.isFinite(fee) || fee < 0) return Number.NaN;
      return fee;
    };
    const adultFee = parseOptionalFee(body.entrance_fee_adults);
    const childFee = parseOptionalFee(body.entrance_fee_children);
    const seniorFee = parseOptionalFee(body.entrance_fee_senior);
    if (Number.isNaN(adultFee) || Number.isNaN(childFee) || Number.isNaN(seniorFee)) {
      return NextResponse.json(
        { error: 'Entrance fees must be empty or a non-negative number.' },
        { status: 400, headers: noStoreHeaders }
      );
    }
    const formatFeeString = (adult: number | null, child: number | null, senior: number | null) => {
      if (adult == null && child == null && senior == null) return null;
      return `${adult ?? ''}|${child ?? ''}|${senior ?? ''}`;
    };
    const slug = typeof body.slug === 'string' && body.slug.trim()
      ? body.slug.trim()
      : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const adminSupabase = createAdminClient();
    let result;
    let removedGalleryStoragePaths: string[] = [];
    if (typeof body.id === 'string' && body.id) {
      // Find existing beach to preserve slug, ownerid, coordinates, and virtualtoururl if needed
      const { data: existing, error: existingError } = await (adminSupabase.from('beaches') as any)
        .select('slug, ownerid, virtualtoururl, latitude, longitude, location, openinghours, images, coverimageurl, profileimageurl')
        .eq('id', body.id)
        .maybeSingle();
      if (existingError) throw existingError;
      if (!existing) {
        return NextResponse.json({ error: 'Beach listing not found.' }, { status: 404, headers: noStoreHeaders });
      }
      const submittedImages = Array.isArray(body.images) ? body.images : [];
      const oldImageCount = Array.isArray(existing.images) ? existing.images.length : 0;
      if (
        submittedImages.length > IMAGE_UPLOAD_CONFIG.maxPhotosPerItem &&
        submittedImages.length > oldImageCount
      ) {
        return NextResponse.json(
          { error: `A beach gallery can have up to ${IMAGE_UPLOAD_CONFIG.maxPhotosPerItem} photos.` },
          { status: 400, headers: noStoreHeaders }
        );
      }
      const retainedImageUrls = new Set([
        ...getImageUrls(submittedImages),
        body.cover_image || body.coverimageurl || null,
        body.profile_image || body.profileimageurl || null,
      ].filter((url): url is string => typeof url === 'string' && url.length > 0));
      const oldImageUrls = [
        ...getImageUrls(existing.images),
        existing.coverimageurl,
        existing.profileimageurl,
      ].filter((url): url is string => typeof url === 'string' && url.length > 0);
      const beachMediaPublicRoot = adminSupabase.storage.from('beach-media').getPublicUrl('').data.publicUrl;
      removedGalleryStoragePaths = [...new Set(
        oldImageUrls
          .filter((url) => !retainedImageUrls.has(url))
          .map((url) => getOwnedGalleryStoragePath(
            beachMediaPublicRoot,
            url,
            existing.ownerid,
            body.id
          ))
          .filter((storagePath): storagePath is string => Boolean(storagePath))
      )];

      const existingLatitude = existing.latitude == null ? null : Number(existing.latitude);
      const existingLongitude = existing.longitude == null ? null : Number(existing.longitude);
      const latitude = auth.role === 'admin' && hasValidCoordinatePair
        ? parsedLatitude
        : existingLatitude;
      const longitude = auth.role === 'admin' && hasValidCoordinatePair
        ? parsedLongitude
        : existingLongitude;

      const beachPayload = {
        name,
        slug: existing?.slug || slug,
        ownerid: existing?.ownerid || ownerId,
        description: body.description || '',
        // Owners may edit the address, but only admins can directly change approved pin coordinates.
        location,
        latitude,
        longitude,
        coverimageurl: body.cover_image || body.coverimageurl || null,
        profileimageurl: body.profile_image || body.profileimageurl || null,
        // Beach owners cannot directly edit 360 virtual tours; only admins can modify directly
        virtualtoururl: auth.role === 'admin' ? (body.virtualtoururl || null) : (existing?.virtualtoururl || null),
        images: Array.isArray(body.images) ? body.images : [],
        openinghours: typeof body.openinghours === 'object'
          ? JSON.stringify(body.openinghours)
          : (body.openinghours ?? existing?.openinghours ?? ''),
        entrancefee: formatFeeString(adultFee, childFee, seniorFee),
        cottagefee: body.cottagefee || null,
        rules: body.rules || null,
        contactphone: body.contactphone || null,
        contactemail: body.contactemail || null,
        facebookurl: body.facebookurl || null,
        instagramurl: body.instagramurl || null,
        peakdays: body.peakdays || null,
        peakhours: body.peakhours || null,
        bestvisitingtime: body.bestvisitingtime || null,
        status: 'active',
        updatedat: new Date().toISOString(),
      };

      let query = (adminSupabase.from('beaches') as any)
        .update(beachPayload)
        .eq('id', body.id);

      if (auth.role !== 'admin') {
        query = query.eq('ownerid', ownerId);
      }
      result = await query.select('*').maybeSingle();
      if (!result.error && !result.data) {
        return NextResponse.json({ error: 'Beach not found or unauthorized.' }, { status: 404, headers: noStoreHeaders });
      }
    } else {
      const submittedImages = Array.isArray(body.images) ? body.images : [];
      if (submittedImages.length > IMAGE_UPLOAD_CONFIG.maxPhotosPerItem) {
        return NextResponse.json(
          { error: `A beach gallery can have up to ${IMAGE_UPLOAD_CONFIG.maxPhotosPerItem} photos.` },
          { status: 400, headers: noStoreHeaders }
        );
      }
      const beachPayload = {
        name,
        slug,
        ownerid: ownerId,
        description: body.description || '',
        location,
        latitude: hasValidCoordinatePair ? parsedLatitude : null,
        longitude: hasValidCoordinatePair ? parsedLongitude : null,
        coverimageurl: body.cover_image || body.coverimageurl || null,
        profileimageurl: body.profile_image || body.profileimageurl || null,
        // New beaches created by owners start without a verified virtual tour until admin approves one
        virtualtoururl: auth.role === 'admin' ? (body.virtualtoururl || null) : null,
        images: Array.isArray(body.images) ? body.images : [],
        openinghours: typeof body.openinghours === 'object' ? JSON.stringify(body.openinghours) : (body.openinghours || ''),
        entrancefee: formatFeeString(adultFee, childFee, seniorFee),
        cottagefee: body.cottagefee || null,
        rules: body.rules || null,
        contactphone: body.contactphone || null,
        contactemail: body.contactemail || null,
        facebookurl: body.facebookurl || null,
        instagramurl: body.instagramurl || null,
        peakdays: body.peakdays || null,
        peakhours: body.peakhours || null,
        bestvisitingtime: body.bestvisitingtime || null,
        status: 'active',
        updatedat: new Date().toISOString(),
      };
      result = await (adminSupabase.from('beaches') as any)
        .insert(beachPayload)
        .select('*')
        .single();
    }

    if (result.error) throw result.error;

    const savedBeach = result.data;
    const { data: existingGeneralInformation, error: generalInformationReadError } =
      await (adminSupabase.from('beachinfo') as any)
        .select('generalinformation, entrancefeenotes, seniorentrancefee')
        .eq('beachid', savedBeach.id)
        .maybeSingle();
    if (generalInformationReadError) throw generalInformationReadError;

    const { error: generalInformationSaveError } = await (adminSupabase
      .from('beachinfo') as any)
      .upsert(
        {
          beachid: savedBeach.id,
          entrancefee: adultFee,
          childentrancefee: childFee,
          seniorentrancefee: seniorFee,
          generalinformation: existingGeneralInformation?.generalinformation ?? null,
          entrancefeenotes: existingGeneralInformation?.entrancefeenotes ?? null,
          updatedat: new Date().toISOString(),
        },
        { onConflict: 'beachid' }
      );
    if (generalInformationSaveError) throw generalInformationSaveError;

    let storageCleanupWarnings: string[] = [];
    if (removedGalleryStoragePaths.length) {
      const { error: cleanupError } = await adminSupabase.storage
        .from('beach-media')
        .remove(removedGalleryStoragePaths);
      if (cleanupError) {
        console.error('Failed to remove deleted beach gallery images:', cleanupError);
        storageCleanupWarnings = [
          'Beach changes were saved, but one or more removed image files could not be deleted from Storage.',
        ];
      }
    }

    invalidateBeachesCache();

    return NextResponse.json(
      {
        success: true,
        beach: await toOwnerBeachWithFees(adminSupabase, {
          ...savedBeach,
          entrancefee: adultFee == null && childFee == null && seniorFee == null
            ? null
            : `${adultFee ?? ''}|${childFee ?? ''}|${seniorFee ?? ''}`,
        }),
        storage_cleanup_warnings: storageCleanupWarnings,
      },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save owner beach.';
    console.error('Owner beach POST error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}
