import { NextResponse } from 'next/server';
import { getAllBeaches } from '@/lib/db/beaches';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const beaches = await getAllBeaches();
    console.log('API /api/beaches - Returning beaches:', beaches.map(b => ({
      id: b.id,
      name: b.name,
      opening_hours: b.opening_hours,
      entrance_fee: b.entrance_fee,
      entrance_fee_adults: b.entrance_fee_adults,
      entrance_fee_children: b.entrance_fee_children,
    })));
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

    const beachPayload: any = {
      name: name.trim(),
      slug,
      owner_id: owner_id,
      description: description || '',
      location: location.trim(),
      latitude: parseFloat(latitude) || 10.6348,
      longitude: parseFloat(longitude) || 124.0275,
      cover_image: cover_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85',
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

    return NextResponse.json({ success: true, beach: data }, { status: 201 });
  } catch (err: any) {
    console.error('Failed to create beach:', err);
    return NextResponse.json({ error: err?.message || 'Server error creating beach' }, { status: 500 });
  }
}
