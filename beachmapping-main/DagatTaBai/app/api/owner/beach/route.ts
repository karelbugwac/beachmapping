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

export async function GET() {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }
    const ownerId = auth.user.id;

    const adminSupabase = createAdminClient();
    const { data, error } = await (adminSupabase.from('beaches') as any)
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json(data ? [toOwnerBeach(data)] : [], { headers: noStoreHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load owner beach.';
    console.error('Owner beach GET error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager']);
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

    const parsedLatitude = Number(body.latitude);
    const parsedLongitude = Number(body.longitude);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
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

    console.log('API /api/owner/beach - Saving to database:', {
      opening_hours: beachPayload.opening_hours,
      entrance_fee: beachPayload.entrance_fee,
    });

    const adminSupabase = createAdminClient();
    let result;
    if (typeof body.id === 'string' && body.id) {
      result = await (adminSupabase.from('beaches') as any)
        .update(beachPayload)
        .eq('id', body.id)
        .eq('owner_id', ownerId)
        .select('*')
        .maybeSingle();
      if (!result.error && !result.data) {
        return NextResponse.json({ error: 'Owner beach not found.' }, { status: 404, headers: noStoreHeaders });
      }
    } else {
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