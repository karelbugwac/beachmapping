import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getValidBeachCoordinates } from '@/lib/utils/beach-coordinates';

export interface BeachPhoto {
  category: string;
  caption: string;
  photo_url: string;
  created_at?: string;
  likes?: number;
  price?: string;
  description?: string;
}

export interface BeachExternalLink {
  label: string;
  url: string;
}

export interface BeachCottage {
  id: string;
  name: string;
  description: string;
  price: string | null;
  capacity: string | null;
  image_url: string | null;
  photos?: Array<{
    id?: string;
    image_url: string;
    storage_path?: string;
    sort_order?: number;
  }>;
}

export interface BeachFacility {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string | null;
  image_url: string | null;
}

export interface BeachPost {
  id: string;
  caption: string;
  image_url: string | null;
  created_at: string;
}

export interface BeachRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  cover_image: string | null;
  profile_image?: string | null;
  images: BeachPhoto[];
  virtual_tour_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  peak_days?: string | null;
  peak_hours?: string | null;
  best_visiting_time?: string | null;
  opening_hours: string | Record<string, string>;
  entrance_fee: string | null;
  entrance_fee_adults?: string | null;
  entrance_fee_children?: string | null;
  cottage_fee: string | null;
  rules: string | null;
  status: 'active' | 'suspended';
  average_rating: number;
  amenities: string[];
  activities: string[];
  external_links: BeachExternalLink[];
  cottages?: BeachCottage[];
  facility_items?: BeachFacility[];
  posts?: BeachPost[];
  created_at: string;
  updated_at: string;
}

const BEACH_CACHE_TTL_MS = 15_000; // 15 seconds in-memory cache with instant invalidation on mutations
let allBeachesCache: { data: BeachRecord[]; expiresAt: number } | null = null;
const slugBeachCache = new Map<string, { data: BeachRecord | null; expiresAt: number }>();

function getBeachIdentityKey(beach: BeachRecord): string | null {
  const coordinates = getValidBeachCoordinates(beach.latitude, beach.longitude);
  if (!coordinates) return null;

  const normalizedName = beach.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(beach|resort)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  return normalizedName
    ? `${normalizedName}:${coordinates.latitude.toFixed(6)}:${coordinates.longitude.toFixed(6)}`
    : null;
}

function beachRecordCompleteness(beach: BeachRecord): number {
  return (
    Number(Boolean(beach.location.toLowerCase().includes('binongkalan'))) * 4 +
    Number(Boolean(beach.cover_image)) * 3 +
    Number(Boolean(beach.profile_image)) * 2 +
    Number(Boolean(beach.description)) +
    Number(Boolean(beach.contact_phone || beach.contact_email)) +
    beach.images.length +
    beach.amenities.length +
    beach.activities.length
  );
}

/**
 * Immediately clears the in-memory beaches cache when a beach is created, updated, or deleted.
 */
export function invalidateBeachesCache() {
  allBeachesCache = null;
  slugBeachCache.clear();
}

export async function getAllBeaches(): Promise<BeachRecord[]> {
  const now = Date.now();
  if (allBeachesCache && allBeachesCache.expiresAt > now) {
    return allBeachesCache.data;
  }

  const supabase = await createServerSupabaseClient();
  const pageSize = 500;
  const dbBeaches: any[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('beaches')
      .select(`
        *,
        beach_activities ( name ),
        beach_facilities ( name ),
        beach_external_links ( label, url )
      `)
      .eq('status', 'active')
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data) break;
    dbBeaches.push(...data);
    if (data.length < pageSize) break;
    offset += data.length;
  }

  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const mapped: BeachRecord[] = dbBeaches
    .filter((beach) => {
      const id = String(beach.id || '');
      const slug = String(beach.slug || '').toLowerCase();
      if (!id || seenIds.has(id) || (slug && seenSlugs.has(slug))) return false;
      seenIds.add(id);
      if (slug) seenSlugs.add(slug);
      return true;
    })
    .map((b: any) => {
        // Parse opening_hours if it's a JSON string
        let parsedOpeningHours = b.opening_hours || '';
        if (typeof b.opening_hours === 'string' && b.opening_hours.startsWith('{')) {
          try {
            parsedOpeningHours = JSON.parse(b.opening_hours);
          } catch {
            parsedOpeningHours = b.opening_hours;
          }
        }

        // Split entrance_fee into adults and children
        let entranceFeeAdults = null;
        let entranceFeeChildren = null;
        if (b.entrance_fee && b.entrance_fee.includes('|')) {
          const [adults, children] = b.entrance_fee.split('|');
          entranceFeeAdults = adults;
          entranceFeeChildren = children;
        }

        const coordinates = getValidBeachCoordinates(b.latitude, b.longitude);
        return {
          id: b.id,
          slug: b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          name: b.name,
          description: b.description,
          location: b.location,
          latitude: coordinates?.latitude ?? null,
          longitude: coordinates?.longitude ?? null,
          cover_image: b.cover_image_url || b.cover_image || null,
          profile_image: b.profile_image_url || b.profile_image || null,
          images: Array.isArray(b.images) ? b.images : [],
          virtual_tour_url: b.virtual_tour_url || null,
          contact_phone: b.contact_phone || null,
          contact_email: b.contact_email || null,
          facebook_url: b.facebook_url || null,
          instagram_url: b.instagram_url || null,
          peak_days: b.peak_days || null,
          peak_hours: b.peak_hours || null,
          best_visiting_time: b.best_visiting_time || null,
          opening_hours: parsedOpeningHours,
          entrance_fee: b.entrance_fee,
          entrance_fee_adults: entranceFeeAdults,
          entrance_fee_children: entranceFeeChildren,
          cottage_fee: b.cottage_fee,
          rules: b.rules,
          status: b.status,
          average_rating: Number(b.average_rating || 0),
          activities: b.beach_activities?.map((activity: any) => activity.name).filter(Boolean) || [],
          amenities: b.beach_facilities?.map((facility: any) => facility.name).filter(Boolean) || [],
          external_links: b.beach_external_links?.map((el: any) => ({ label: el.label, url: el.url })) || [],
          created_at: b.created_at,
          updated_at: b.updated_at,
        };
      });

  const uniqueBeaches: BeachRecord[] = [];
  const beachIndexesByIdentity = new Map<string, number>();
  for (const beach of mapped) {
    const identityKey = getBeachIdentityKey(beach);
    const existingIndex = identityKey ? beachIndexesByIdentity.get(identityKey) : undefined;
    if (identityKey && existingIndex !== undefined) {
      if (beachRecordCompleteness(beach) > beachRecordCompleteness(uniqueBeaches[existingIndex])) {
        uniqueBeaches[existingIndex] = beach;
      }
      continue;
    }

    if (identityKey) beachIndexesByIdentity.set(identityKey, uniqueBeaches.length);
    uniqueBeaches.push(beach);
  }

  allBeachesCache = {
    data: uniqueBeaches,
    expiresAt: Date.now() + BEACH_CACHE_TTL_MS,
  };
  return uniqueBeaches;
}

export async function getBeachBySlug(slug: string): Promise<BeachRecord | null> {
  const normalized = decodeURIComponent(slug).toLowerCase().trim();
  const now = Date.now();

  const cachedSlug = slugBeachCache.get(normalized);
  if (cachedSlug && cachedSlug.expiresAt > now) {
    return cachedSlug.data;
  }

  // Also check if it's already in the warm allBeachesCache
  if (allBeachesCache && allBeachesCache.expiresAt > now) {
    const match = allBeachesCache.data.find(
      (b) => b.slug.toLowerCase() === normalized || b.id.toLowerCase() === normalized
    );
    if (match) {
      slugBeachCache.set(normalized, { data: match, expiresAt: allBeachesCache.expiresAt });
      return match;
    }
  }

  try {
    const supabase = await createServerSupabaseClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized);

    const query = supabase
      .from('beaches')
      .select(`
        *,
        beach_activities ( name ),
        beach_facilities ( name ),
        beach_external_links ( label, url )
      `);

    let dbBeach: any = null;
    if (isUuid) {
      const { data, error } = await query.eq('id', normalized).maybeSingle();
      if (!error && data) dbBeach = data;
    } else {
      const { data, error } = await query.eq('slug', normalized).maybeSingle();
      if (!error && data) {
        dbBeach = data;
      } else {
        // Fallback 1: prefix match on slug (e.g. majestique matches majestique-beach)
        const prefixRes = await supabase
          .from('beaches')
          .select(`
            *,
            beach_activities ( name ),
            beach_facilities ( name ),
            beach_external_links ( label, url )
          `)
          .ilike('slug', `${normalized}%`)
          .limit(1)
          .maybeSingle();
        if (!prefixRes.error && prefixRes.data) {
          dbBeach = prefixRes.data;
        } else {
          // Fallback 2: search by resort name
          const cleanName = normalized.replace(/[-_]+/g, ' ').trim();
          const nameRes = await supabase
            .from('beaches')
            .select(`
              *,
              beach_activities ( name ),
              beach_facilities ( name ),
              beach_external_links ( label, url )
            `)
            .ilike('name', `%${cleanName}%`)
            .limit(1)
            .maybeSingle();
          if (!nameRes.error && nameRes.data) {
            dbBeach = nameRes.data;
          }
        }
      }
    }

    if (dbBeach) {
      const b = dbBeach as any;

      // Parse opening_hours if it's a JSON string
      let parsedOpeningHours = b.opening_hours || '';
      if (typeof b.opening_hours === 'string' && b.opening_hours.startsWith('{')) {
        try {
          parsedOpeningHours = JSON.parse(b.opening_hours);
        } catch {
          parsedOpeningHours = b.opening_hours;
        }
      }

      // Split entrance_fee into adults and children
      let entranceFeeAdults = null;
      let entranceFeeChildren = null;
      if (b.entrance_fee && b.entrance_fee.includes('|')) {
        const [adults, children] = b.entrance_fee.split('|');
        entranceFeeAdults = adults;
        entranceFeeChildren = children;
      }

      const coordinates = getValidBeachCoordinates(b.latitude, b.longitude);
      const record: BeachRecord = {
        id: b.id,
        slug: b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        name: b.name,
        description: b.description,
        location: b.location,
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
        cover_image: b.cover_image_url || b.cover_image || null,
        profile_image: b.profile_image_url || b.profile_image || null,
        images: Array.isArray(b.images) ? b.images : [],
        virtual_tour_url: b.virtual_tour_url || null,
        contact_phone: b.contact_phone || null,
        contact_email: b.contact_email || null,
        facebook_url: b.facebook_url || null,
        instagram_url: b.instagram_url || null,
        peak_days: b.peak_days || null,
        peak_hours: b.peak_hours || null,
        best_visiting_time: b.best_visiting_time || null,
        opening_hours: parsedOpeningHours,
        entrance_fee: b.entrance_fee,
        entrance_fee_adults: entranceFeeAdults,
        entrance_fee_children: entranceFeeChildren,
        cottage_fee: b.cottage_fee,
        rules: b.rules,
        status: b.status,
        average_rating: Number(b.average_rating || 0),
        activities: b.beach_activities?.map((activity: any) => activity.name).filter(Boolean) || [],
        amenities: b.beach_facilities?.map((facility: any) => facility.name).filter(Boolean) || [],
        external_links: b.beach_external_links?.map((el: any) => ({ label: el.label, url: el.url })) || [],
        created_at: b.created_at,
        updated_at: b.updated_at,
      };

      slugBeachCache.set(normalized, {
        data: record,
        expiresAt: Date.now() + BEACH_CACHE_TTL_MS,
      });
      return record;
    }
  } catch (err) {
    // Database connection or table initialization fallback
  }

  return null;
}

export async function getBeachById(id: string): Promise<BeachRecord | null> {
  return getBeachBySlug(id);
}
