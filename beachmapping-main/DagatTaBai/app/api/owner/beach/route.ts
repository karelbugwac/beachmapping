import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { authorizeRoles } from '@/lib/supabase/authorization';

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };

function toOwnerBeach(row: any) {
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
    entrance_fee: row.entrance_fee || null,
    cottage_fee: row.cottage_fee || null,
    rules: row.rules || null,
    average_rating: Number(row.average_rating || 0),
    amenities: [],
    activities: [],
    external_links: [],
  };
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
      return NextResponse.json(data ? [toOwnerBeach(data)] : [], { headers: noStoreHeaders });
    }

    // Otherwise, fetch all beaches belonging to this owner (or all beaches if admin)
    let query = (adminSupabase.from('beaches') as any).select('*');
    if (auth.role !== 'admin') {
      query = query.eq('owner_id', ownerId);
    }
    const { data, error } = await query.order('name');

    if (error) throw error;

    return NextResponse.json(
      Array.isArray(data) ? data.map(toOwnerBeach) : [],
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

    const parsedLatitude = parseFloat(String(body.latitude));
    const parsedLongitude = parseFloat(String(body.longitude));
    const slug = typeof body.slug === 'string' && body.slug.trim()
      ? body.slug.trim()
      : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const adminSupabase = createAdminClient();
    let result;
    if (typeof body.id === 'string' && body.id) {
      // Find existing beach to preserve slug and owner_id if needed
      const { data: existing } = await (adminSupabase.from('beaches') as any)
        .select('slug, owner_id')
        .eq('id', body.id)
        .maybeSingle();

      const beachPayload = {
        name,
        slug: existing?.slug || slug,
        owner_id: existing?.owner_id || ownerId,
        description: body.description || '',
        location,
        latitude: Number.isFinite(parsedLatitude) ? parsedLatitude : 10.6348,
        longitude: Number.isFinite(parsedLongitude) ? parsedLongitude : 124.0275,
        cover_image_url: body.cover_image || body.cover_image_url || null,
        profile_image_url: body.profile_image || body.profile_image_url || null,
        virtual_tour_url: body.virtual_tour_url || null,
        images: Array.isArray(body.images) ? body.images : [],
        opening_hours: typeof body.opening_hours === 'object' ? JSON.stringify(body.opening_hours) : (body.opening_hours || '8:00 AM - 6:00 PM'),
        entrance_fee: `${body.entrance_fee_adults || ''}|${body.entrance_fee_children || ''}`,
        cottage_fee: body.cottage_fee || null,
        rules: body.rules || null,
        contact_phone: body.contact_phone || null,
        contact_email: body.contact_email || null,
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
        latitude: Number.isFinite(parsedLatitude) ? parsedLatitude : 10.6348,
        longitude: Number.isFinite(parsedLongitude) ? parsedLongitude : 124.0275,
        cover_image_url: body.cover_image || body.cover_image_url || null,
        profile_image_url: body.profile_image || body.profile_image_url || null,
        virtual_tour_url: body.virtual_tour_url || null,
        images: Array.isArray(body.images) ? body.images : [],
        opening_hours: typeof body.opening_hours === 'object' ? JSON.stringify(body.opening_hours) : (body.opening_hours || '8:00 AM - 6:00 PM'),
        entrance_fee: `${body.entrance_fee_adults || ''}|${body.entrance_fee_children || ''}`,
        cottage_fee: body.cottage_fee || null,
        rules: body.rules || null,
        contact_phone: body.contact_phone || null,
        contact_email: body.contact_email || null,
        status: 'active',
        updated_at: new Date().toISOString(),
      };
      result = await (adminSupabase.from('beaches') as any)
        .insert(beachPayload)
        .select('*')
        .single();
    }

    if (result.error) throw result.error;

    return NextResponse.json(
      { success: true, beach: toOwnerBeach(result.data) },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save owner beach.';
    console.error('Owner beach POST error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}