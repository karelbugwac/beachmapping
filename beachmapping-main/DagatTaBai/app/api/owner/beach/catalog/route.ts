import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };
const tableByType = {
  cottage: 'beach_cottages',
  facility: 'beach_facilities',
  post: 'beach_posts',
} as const;
type CatalogType = keyof typeof tableByType;
type AuthorizedAuth = Extract<Awaited<ReturnType<typeof authorizeRoles>>, { authorized: true }>;

function isCatalogType(value: string | null): value is CatalogType {
  return value === 'cottage' || value === 'facility' || value === 'post';
}

async function getAuthorizedBeach(
  auth: AuthorizedAuth,
  beachId: string | null
) {
  let query = (auth.adminClient.from('beaches') as any).select('id, name, owner_id');
  if (beachId) query = query.eq('id', beachId);
  else if (auth.role !== 'admin') query = query.eq('owner_id', auth.user.id);

  const { data: beach, error } = await query.maybeSingle();
  if (error) throw error;
  if (!beach || (auth.role !== 'admin' && beach.owner_id !== auth.user.id)) {
    return { response: NextResponse.json({ error: 'Beach not found or unauthorized.' }, { status: 404 }) };
  }
  return { beach, auth };
}

function getCottageImageUrl(storage: ReturnType<AuthorizedAuth['adminClient']['storage']['from']>, image: unknown) {
  if (typeof image !== 'string' || !image) return '';
  if (/^https?:\/\//i.test(image)) return image;
  return storage.getPublicUrl(image).data.publicUrl;
}

function getOwnedCottageImagePath(
  storage: ReturnType<AuthorizedAuth['adminClient']['storage']['from']>,
  imageUrl: unknown,
  ownerId: string,
  beachId: string
) {
  if (typeof imageUrl !== 'string' || !imageUrl) return null;
  const rawPath = imageUrl.trim();
  const bucketRoot = storage.getPublicUrl('').data.publicUrl.replace(/\/$/, '');
  const candidate = rawPath.startsWith(bucketRoot)
    ? rawPath.slice(bucketRoot.length)
    : rawPath;
  const normalized = candidate.replace(/^\//, '');
  return normalized.startsWith(`${ownerId}/${beachId}/`)
    ? normalized
    : (normalized.startsWith(`public/${ownerId}/${beachId}/`)
      ? normalized.replace(/^public\//, '')
      : null);
}

function toCatalogItem(type: CatalogType, row: Record<string, any>, auth?: AuthorizedAuth) {
  if (type === 'cottage') {
    const image = Array.isArray(row.images) ? row.images[0] : '';
    return {
      id: row.id,
      name: row.name,
      price: row.price == null ? '' : String(row.price),
      capacity: row.capacity_label || (row.capacity ? `${row.capacity} persons` : ''),
      description: row.description || '',
      image_url: auth ? getCottageImageUrl(auth.adminClient.storage.from('beach-media'), image) : '',
    };
  }
  if (type === 'facility') {
    return {
      id: row.id,
      title: row.name,
      category: row.category || 'amenity',
      price: row.price_label ?? (row.price == null ? '' : String(row.price)),
      description: row.description || '',
      image_url: row.images?.[0] || '',
    };
  }
  return {
    id: row.id,
    caption: row.caption || '',
    image_url: row.image_path || '',
    created_at: row.created_at,
    likes: 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }
    const beachResult = await getAuthorizedBeach(auth, request.nextUrl.searchParams.get('beach_id'));
    if ('response' in beachResult) return beachResult.response;
    const { beach } = beachResult;

    const entries = await Promise.all(
      (Object.entries(tableByType) as Array<[CatalogType, string]>).map(async ([type, table]) => {
        const { data, error } = await (auth.adminClient.from(table) as any)
          .select('*')
          .eq('beach_id', beach.id)
          .order('created_at', { ascending: type === 'post' });
        if (error) throw error;
        return [type, (data || []).map((row: Record<string, any>) => toCatalogItem(type, row, auth))] as const;
      })
    );

    return NextResponse.json(
      { beach_id: beach.id, items: Object.fromEntries(entries) },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load beach listings.';
    console.error('Owner beach catalog GET error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }
    const body = await request.json();
    const beachResult = await getAuthorizedBeach(
      auth,
      typeof body.beach_id === 'string' ? body.beach_id : null
    );
    if ('response' in beachResult) return beachResult.response;
    const { beach } = beachResult;

    if (!isCatalogType(body.type)) {
      return NextResponse.json({ error: 'A valid catalog type is required.' }, { status: 400, headers: noStoreHeaders });
    }

    const type: CatalogType = body.type;
    const parsedPriceValue = body.price === '' || body.price == null ? null : Number(body.price);
    const isValidPrice = parsedPriceValue == null || (Number.isFinite(parsedPriceValue) && parsedPriceValue >= 0);
    if (body.price !== '' && body.price != null && body.price !== undefined && !isValidPrice) {
      return NextResponse.json({ error: 'Cottage and facility prices must be empty or a non-negative number.' }, { status: 400, headers: noStoreHeaders });
    }
    const row = type === 'cottage'
      ? {
          beach_id: beach.id,
          name: typeof body.name === 'string' ? body.name.trim() : '',
          description: typeof body.description === 'string' ? body.description.trim() : null,
          price: parsedPriceValue == null ? null : parsedPriceValue,
          price_unit: 'per day',
          capacity_label: typeof body.capacity === 'string' ? body.capacity.trim() || null : null,
          images: typeof body.image_url === 'string' && body.image_url ? [body.image_url] : [],
        }
      : type === 'facility'
        ? {
            beach_id: beach.id,
            name: typeof body.title === 'string' ? body.title.trim() : '',
            description: typeof body.description === 'string' ? body.description.trim() || null : null,
            category: ['parking', 'equipment', 'amenity', 'safety'].includes(body.category) ? body.category : 'amenity',
            price: parsedPriceValue == null ? null : parsedPriceValue,
            price_label: typeof body.price === 'string' ? body.price.trim() || null : null,
            price_unit: null,
            images: typeof body.image_url === 'string' && body.image_url ? [body.image_url] : [],
          }
        : {
            beach_id: beach.id,
            author_id: auth.user.id,
            caption: typeof body.caption === 'string' ? body.caption.trim() || null : null,
            image_path: typeof body.image_url === 'string' ? body.image_url : null,
            status: 'published',
          };

    if ((type === 'cottage' || type === 'facility') && !row.name) {
      return NextResponse.json({ error: 'A name is required.' }, { status: 400, headers: noStoreHeaders });
    }
    if (type === 'post' && !row.caption && !row.image_path) {
      return NextResponse.json({ error: 'A caption or photo is required.' }, { status: 400, headers: noStoreHeaders });
    }

    const id = typeof body.id === 'string' ? body.id : null;
    let existingCottageImage: unknown = null;
    if (type === 'cottage' && id) {
      const { data: existingCottage, error: existingCottageError } = await (auth.adminClient
        .from('beach_cottages') as any)
        .select('id, images')
        .eq('id', id)
        .eq('beach_id', beach.id)
        .maybeSingle();
      if (existingCottageError) throw existingCottageError;
      if (!existingCottage) {
        return NextResponse.json({ error: 'Cottage listing not found.' }, { status: 404, headers: noStoreHeaders });
      }
      existingCottageImage = Array.isArray(existingCottage.images) ? existingCottage.images[0] : null;
    }

    const table = auth.adminClient.from(tableByType[type]) as any;
    const query = id && type === 'cottage'
      ? table.update(row).eq('id', id).eq('beach_id', beach.id)
      : table.insert(row);
    const { data, error } = await query.select('*').single();
    if (error) throw error;

    const newCottageImage = type === 'cottage' && Array.isArray(row.images)
      ? row.images[0]
      : null;
    if (type === 'cottage' && existingCottageImage && existingCottageImage !== newCottageImage) {
      const oldPath = getOwnedCottageImagePath(
        auth.adminClient.storage.from('beach-media'),
        existingCottageImage,
        beach.owner_id,
        beach.id
      );
      if (oldPath) {
        const { error: removeError } = await auth.adminClient.storage.from('beach-media').remove([oldPath]);
        if (removeError) throw removeError;
      }
    }

    return NextResponse.json(
      { item: toCatalogItem(type, data, auth) },
      { status: id && type === 'cottage' ? 200 : 201, headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save beach listing.';
    console.error('Owner beach catalog POST error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }
    const typeParam = request.nextUrl.searchParams.get('type');
    const id = request.nextUrl.searchParams.get('id');
    const beachId = request.nextUrl.searchParams.get('beach_id');
    if (!isCatalogType(typeParam) || !id) {
      return NextResponse.json({ error: 'A valid catalog type and item ID are required.' }, { status: 400, headers: noStoreHeaders });
    }

    const beachResult = await getAuthorizedBeach(auth, beachId);
    if ('response' in beachResult) return beachResult.response;

    const table = auth.adminClient.from(tableByType[typeParam]) as any;
    let cottageImage: unknown = null;
    if (typeParam === 'cottage') {
      const { data: cottage, error: cottageError } = await table
        .select('images')
        .eq('id', id)
        .eq('beach_id', beachResult.beach.id)
        .maybeSingle();
      if (cottageError) throw cottageError;
      if (!cottage) {
        return NextResponse.json({ error: 'Listing not found.' }, { status: 404, headers: noStoreHeaders });
      }
      cottageImage = Array.isArray(cottage.images) ? cottage.images[0] : null;
    }

    const { data, error } = await table
      .delete()
      .eq('id', id)
      .eq('beach_id', beachResult.beach.id)
      .select('id');
    if (error) throw error;
    if (!data?.length) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404, headers: noStoreHeaders });
    }

    if (typeParam === 'cottage' && cottageImage) {
      const path = getOwnedCottageImagePath(
        auth.adminClient.storage.from('beach-media'),
        cottageImage,
        beachResult.beach.owner_id,
        beachResult.beach.id
      );
      if (path) {
        const { error: removeError } = await auth.adminClient.storage.from('beach-media').remove([path]);
        if (removeError) throw removeError;
      }
    }

    return NextResponse.json({ success: true }, { headers: noStoreHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove beach listing.';
    console.error('Owner beach catalog DELETE error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}
