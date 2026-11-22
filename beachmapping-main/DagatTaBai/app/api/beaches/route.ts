import { NextRequest, NextResponse } from 'next/server';
import { getAllBeaches, invalidateBeachesCache } from '@/lib/db/beaches';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getValidBeachCoordinates } from '@/lib/utils/beach-coordinates';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/utils/rate-limit';

export async function GET(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    keyPrefix: 'api-beaches',
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit);
  }

  try {
    const beaches = await getAllBeaches();
    return NextResponse.json(beaches, {
      headers: {
        ...rateLimit.headers,
        'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch beaches';
    return NextResponse.json({ error: msg }, { status: 500, headers: rateLimit.headers });
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
      openinghours,
      entrancefee,
      cottagefee,
      rules,
      contactphone,
      contactemail,
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
    const ownerid = userData?.user?.id || null;

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
      ownerid: ownerid,
      description: description || '',
      location: location.trim(),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      coverimageurl: cover_image || null,
      profileimageurl: profile_image || null,
      images: Array.isArray(images) ? images : [],
      openinghours: openinghours || '8:00 AM - 6:00 PM',
      entrancefee: entrancefee || null,
      cottagefee: cottagefee || null,
      rules: rules || null,
      contactphone: contactphone || null,
      contactemail: contactemail || null,
      status: 'active',
      updatedat: new Date().toISOString(),
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
