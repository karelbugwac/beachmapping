import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { invalidateBeachesCache } from '@/lib/db/beaches';

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };

function toOwnerBeach(row: any) {
  const feeParts = typeof row.entrance_fee === 'string' ? row.entrance_fee.split('|') : [];
  const adultFee = row.general_information_fee ?? (feeParts[0] ?? null);
  const childFee = row.child_entrance_fee_value ?? (feeParts[1] ?? null);
  return {
    ...row,
    cover_image: row.cover_image_url || null,
    profile_image: row.profile_image_url || null,
    images: Array.isArray(row.images) ? row.images : [],
    opening_hours: (() => {
      if (typeof row.opening_hours === 'string' && row.opening_hours.startsWith('{')) {
        try {
          return JSON.parse(row.opening_hours);
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
      if (typeof row.opening_hours === 'object') {
        return row.opening_hours;
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
    entrance_fee: adultFee == null && childFee == null ? null : `${adultFee ?? ''}|${childFee ?? ''}`,
    entrance_fee_adults: adultFee == null ? '' : String(adultFee),
    entrance_fee_children: childFee == null ? '' : String(childFee),
    entrance_fee_senior: row.senior_entrance_fee_value == null ? '' : String(row.senior_entrance_fee_value),
    cottage_fee: row.cottage_fee || null,
    rules: row.rules || null,
    average_rating: Number(row.average_rating || 0),
    amenities: [],
    activities: [],
    external_links: [],
  };
}

async function toOwnerBeachWithFees(adminSupabase: ReturnType<typeof createAdminClient>, row: any) {
  const { data: generalInformation, error } = await (adminSupabase
    .from('beach_general_information') as any)
    .select('entrance_fee, child_entrance_fee, senior_entrance_fee')
    .eq('beach_id', row.id)
    .maybeSingle();
  if (error) throw error;

  return toOwnerBeach({
    ...row,
    general_information_fee: generalInformation?.entrance_fee ?? null,
    child_entrance_fee_value: generalInformation?.child_entrance_fee ?? null,
    senior_entrance_fee_value: generalInformation?.senior_entrance_fee ?? null,
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
    const requestedBeachId = url.searchParams.get('beach_id');
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
        query = query.eq('owner_id', ownerId);
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
      query = query.eq('owner_id', ownerId);
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
    if (Number.isNaN(adultFee) || Number.isNaN(childFee)) {
      return NextResponse.json(
        { error: 'Entrance fees must be empty or a non-negative number.' },
        { status: 400, headers: noStoreHeaders }
      );
    }
    const formatFeeString = (adult: number | null, child: number | null) => {
      if (adult == null && child == null) return null;
      return `${adult ?? ''}|${child ?? ''}`;
    };
    const slug = typeof body.slug === 'string' && body.slug.trim()
      ? body.slug.trim()
      : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const adminSupabase = createAdminClient();
    let result;
    if (typeof body.id === 'string' && body.id) {
      // Find existing beach to preserve slug, owner_id, coordinates, and virtual_tour_url if needed
      const { data: existing, error: existingError } = await (adminSupabase.from('beaches') as any)
        .select('slug, owner_id, virtual_tour_url, latitude, longitude, location, opening_hours')
        .eq('id', body.id)
        .maybeSingle();
      if (existingError) throw existingError;
      if (!existing) {
        return NextResponse.json({ error: 'Beach listing not found.' }, { status: 404, headers: noStoreHeaders });
      }

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
        owner_id: existing?.owner_id || ownerId,
        description: body.description || '',
        // Owners may edit the address, but only admins can directly change approved pin coordinates.
        location,
        latitude,
        longitude,
        cover_image_url: body.cover_image || body.cover_image_url || null,
        profile_image_url: body.profile_image || body.profile_image_url || null,
        // Beach owners cannot directly edit 360 virtual tours; only admins can modify directly
        virtual_tour_url: auth.role === 'admin' ? (body.virtual_tour_url || null) : (existing?.virtual_tour_url || null),
        images: Array.isArray(body.images) ? body.images : [],
        opening_hours: typeof body.opening_hours === 'object'
          ? JSON.stringify(body.opening_hours)
          : (body.opening_hours ?? existing?.opening_hours ?? ''),
        entrance_fee: formatFeeString(adultFee, childFee),
        cottage_fee: body.cottage_fee || null,
        rules: body.rules || null,
        contact_phone: body.contact_phone || null,
        contact_email: body.contact_email || null,
        facebook_url: body.facebook_url || null,
        instagram_url: body.instagram_url || null,
        peak_days: body.peak_days || null,
        peak_hours: body.peak_hours || null,
        best_visiting_time: body.best_visiting_time || null,
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      let query = (adminSupabase.from('beaches') as any)
        .update(beachPayload)
        .eq('id', body.id);

      if (auth.role !== 'admin') {
        query = query.eq('owner_id', ownerId);
      }
      result = await query.select('*').maybeSingle();
      if (!result.error && !result.data) {
        return NextResponse.json({ error: 'Beach not found or unauthorized.' }, { status: 404, headers: noStoreHeaders });
      }
    } else {
      const beachPayload = {
        name,
        slug,
        owner_id: ownerId,
        description: body.description || '',
        location,
        latitude: hasValidCoordinatePair ? parsedLatitude : null,
        longitude: hasValidCoordinatePair ? parsedLongitude : null,
        cover_image_url: body.cover_image || body.cover_image_url || null,
        profile_image_url: body.profile_image || body.profile_image_url || null,
        // New beaches created by owners start without a verified virtual tour until admin approves one
        virtual_tour_url: auth.role === 'admin' ? (body.virtual_tour_url || null) : null,
        images: Array.isArray(body.images) ? body.images : [],
        opening_hours: typeof body.opening_hours === 'object' ? JSON.stringify(body.opening_hours) : (body.opening_hours || ''),
        entrance_fee: formatFeeString(adultFee, childFee),
        cottage_fee: body.cottage_fee || null,
        rules: body.rules || null,
        contact_phone: body.contact_phone || null,
        contact_email: body.contact_email || null,
        facebook_url: body.facebook_url || null,
        instagram_url: body.instagram_url || null,
        peak_days: body.peak_days || null,
        peak_hours: body.peak_hours || null,
        best_visiting_time: body.best_visiting_time || null,
        status: 'active',
        updated_at: new Date().toISOString(),
      };
      result = await (adminSupabase.from('beaches') as any)
        .insert(beachPayload)
        .select('*')
        .single();
    }

    if (result.error) throw result.error;

    const savedBeach = result.data;
    const { data: existingGeneralInformation, error: generalInformationReadError } =
      await (adminSupabase.from('beach_general_information') as any)
        .select('general_information, entrance_fee_notes, senior_entrance_fee')
        .eq('beach_id', savedBeach.id)
        .maybeSingle();
    if (generalInformationReadError) throw generalInformationReadError;

    const { error: generalInformationSaveError } = await (adminSupabase
      .from('beach_general_information') as any)
      .upsert(
        {
          beach_id: savedBeach.id,
          entrance_fee: adultFee,
          child_entrance_fee: childFee,
          senior_entrance_fee: childFee,
          general_information: existingGeneralInformation?.general_information ?? null,
          entrance_fee_notes: existingGeneralInformation?.entrance_fee_notes ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'beach_id' }
      );
    if (generalInformationSaveError) throw generalInformationSaveError;

    invalidateBeachesCache();

    return NextResponse.json(
      {
        success: true,
        beach: await toOwnerBeachWithFees(adminSupabase, {
          ...savedBeach,
          entrance_fee: adultFee == null && childFee == null
            ? null
            : `${adultFee ?? ''}|${childFee ?? ''}`,
        }),
      },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save owner beach.';
    console.error('Owner beach POST error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}
