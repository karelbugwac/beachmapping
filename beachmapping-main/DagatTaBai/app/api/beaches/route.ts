import { NextResponse } from 'next/server';
import { getAllBeaches, invalidateBeachesCache } from '@/lib/db/beaches';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getValidBeachCoordinates } from '@/lib/utils/beach-coordinates';

export async function GET() {
  try {
    const beaches = await getAllBeaches();
    return NextResponse.json(beaches, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch beaches';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      location,
      latitude,
      longitude,
      cover_image,
      profile_image,
      images,
      opening_hours,
      entrance_fee,
      cottage_fee,
      rules,
      contact_phone,
      contact_email,
    } = body;

    if (!name || !location) {
      return NextResponse.json({ error: 'Resort name and location address are required.' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const owner_id = userData?.user?.id || null;

    const coordinates = getValidBeachCoordinates(latitude, longitude);
    if (!coordinates) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude are required. Select the verified beach location on the map.' },
        { status: 400 }
      );
    }

    const beachPayload: any = {
      name: name.trim(),
      slug,
      owner_id: owner_id,
      description: description || '',
      location: location.trim(),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      cover_image: cover_image || null,
      profile_image: profile_image || null,
      images: Array.isArray(images) ? images : [],
      opening_hours: opening_hours || '8:00 AM - 6:00 PM',
      entrance_fee: entrance_fee || null,
      cottage_fee: cottage_fee || null,
      rules: rules || null,
      contact_phone: contact_phone || null,
      contact_email: contact_email || null,
      status: 'active',
      updated_at: new Date().toISOString(),
    };

    if (id) {
      beachPayload.id = id;
    }

    const { data, error } = await (supabase.from('beaches') as any)
      .upsert(beachPayload, { onConflict: id ? 'id' : 'slug' })
      .select()
      .single();

    if (error) {
      console.error('Supabase beach creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    invalidateBeachesCache();
    return NextResponse.json({ success: true, beach: data }, { status: 201 });
  } catch (err: any) {
    console.error('Failed to create beach:', err);
    return NextResponse.json({ error: err?.message || 'Server error creating beach' }, { status: 500 });
  }
}
