import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { isSuspensionActive } from '@/lib/utils/account-status';
import { resolveEffectiveAccountStatus } from '@/lib/server/accountstatus';
import { getValidBeachCoordinates } from '@/lib/utils/beach-coordinates';

export interface BeachPhoto {
  category: string;
  caption: string;
  photo_url: string;
  createdat?: string;
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
  imageurl: string | null;
  photos?: Array<{
    id?: string;
    imageurl: string;
    storagepath?: string;
    sortorder?: number;
  }>;
}

export interface FacilityRate {
  key: string;
  label: string;
  amount: number | null;
}

export interface BeachFacility {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string | null;
  imageurl: string | null;
  rates?: FacilityRate[];
  photos?: Array<{
    imageurl: string;
    sortorder?: number;
  }>;
}

export interface BeachPost {
  id: string;
  caption: string;
  imageurl: string | null;
  createdat: string;
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
  virtualtoururl: string | null;
  contactphone: string | null;
  contactemail: string | null;
  facebookurl?: string | null;
  instagramurl?: string | null;
  peakdays?: string | null;
  peakhours?: string | null;
  bestvisitingtime?: string | null;
  openinghours: string | Record<string, string>;
  entrancefee: string | null;
  entrance_fee_adults?: string | null;
  entrance_fee_children?: string | null;
  entrance_fee_senior?: string | null;
  cottagefee: string | null;
  rules: string | null;
  status: 'active' | 'suspended';
  averagerating: number;
  amenities: string[];
  activities: string[];
  external_links: BeachExternalLink[];
  cottages?: BeachCottage[];
  facility_items?: BeachFacility[];
  posts?: BeachPost[];
  createdat: string;
  updatedat: string;
}

// In-memory cache TTL: 60s prevents repeated DB roundtrips during burst traffic
// Cache is automatically invalidated upon updates via invalidateBeachesCache()
const BEACH_CACHE_TTL_MS = 60_000;
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
    Number(Boolean(beach.contactphone || beach.contactemail)) +
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

async function getApprovedTourUrls(beachIds: string[]): Promise<Map<string, string>> {
  if (beachIds.length === 0) return new Map();
  try {
    const supabase = await createServerSupabaseClient() as unknown as SupabaseClient<Database, 'public', 'public', Database['public']>;
    const { data, error } = await supabase.from('beach_published_tours')
      .select('beach_id, requested_tour_url')
      .in('beach_id', beachIds);
    if (error?.code === 'PGRST205' && error.message.includes('beach_published_tours')) {
      console.warn('Approved beach tours are unavailable because beach_published_tours is missing from the Supabase schema cache.');
      return new Map();
    }
    if (error) {
      console.error('beach_published_tours query error:', error);
      throw error;
    }
    console.log('Approved tours data:', data);
    return new Map((data || []).map((tour) => [tour.beach_id, tour.requested_tour_url]));
  } catch (err) {
    console.error('getApprovedTourUrls failed:', err);
    return new Map(); // Return empty map on error to not break the main query
  }
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

  try {
    while (true) {
      const { data, error } = await supabase
        .from('beaches')
        .select(`
          *,
          beachactivities ( name ),
          facilities ( name ),
          externallinks ( label, url )
        `)
        .eq('status', 'active')
        .order('id', { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error('Beaches query error:', error);
        throw error;
      }
      if (!data) break;
      dbBeaches.push(...data);
      if (data.length < pageSize) break;
      offset += data.length;
    }
  } catch (err) {
    console.error('Failed to fetch beaches:', err);
    throw err;
  }

  try {
    const adminClient = createAdminClient();
    const [{ data: profiles, error: profileError }, { data: authUsersData }] = await Promise.all([
      (adminClient.from('profiles') as any)
        .select('id, accountstatus, suspendeduntil, statuschangedat')
        .in('role', ['beach_owner', 'beach_manager']),
      adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (profileError) {
      console.error('Profiles query error:', profileError);
      throw profileError;
    }
    const authUserById = new Map<string, any>();
    for (const u of authUsersData?.users || []) {
      authUserById.set(u.id, u);
    }
    const suspendedOwners = new Set<string>();
    for (const profile of profiles || []) {
      const effective = resolveEffectiveAccountStatus(profile, authUserById.get(profile.id));
      if (effective.accountstatus === 'suspended') {
        suspendedOwners.add(profile.id);
      }
    }
    for (const u of authUsersData?.users || []) {
      if (u.app_metadata?.accountstatus === 'suspended') {
        const effective = resolveEffectiveAccountStatus(null, u);
        if (effective.accountstatus === 'suspended') {
          suspendedOwners.add(u.id);
        }
      }
    }

    const approvedTours = new Map<string, string>(); // Virtual tours are stored directly on beaches table
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const mapped: BeachRecord[] = dbBeaches
    .filter((beach) => {
      const id = String(beach.id || '');
      const slug = String(beach.slug || '').toLowerCase();
      if (!id || (beach.ownerid && suspendedOwners.has(beach.ownerid)) || seenIds.has(id) || (slug && seenSlugs.has(slug))) return false;
      seenIds.add(id);
      if (slug) seenSlugs.add(slug);
      return true;
    })
    .map((b: any) => {
        // Parse openinghours if it's a JSON string
        let parsedOpeningHours = b.openinghours || '';
        if (typeof b.openinghours === 'string' && b.openinghours.startsWith('{')) {
          try {
            parsedOpeningHours = JSON.parse(b.openinghours);
          } catch {
            parsedOpeningHours = b.openinghours;
          }
        }

        // Split entrancefee into adults, children, and senior
        let entranceFeeAdults = null;
        let entranceFeeChildren = null;
        let entranceFeeSenior = null;
        if (b.entrancefee && b.entrancefee.includes('|')) {
          const [adults, children, senior] = b.entrancefee.split('|');
          entranceFeeAdults = adults || null;
          entranceFeeChildren = children || null;
          entranceFeeSenior = senior || null;
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
          cover_image: b.coverimageurl || b.cover_image || null,
          profile_image: b.profileimageurl || b.profile_image || null,
          images: Array.isArray(b.images) ? b.images : [],
          virtualtoururl: b.virtualtoururl || null,
          contactphone: b.contactphone || null,
          contactemail: b.contactemail || null,
          facebookurl: b.facebookurl || null,
          instagramurl: b.instagramurl || null,
          peakdays: b.peakdays || null,
          peakhours: b.peakhours || null,
          bestvisitingtime: b.bestvisitingtime || null,
          openinghours: parsedOpeningHours,
          entrancefee: b.entrancefee,
          entrance_fee_adults: entranceFeeAdults,
          entrance_fee_children: entranceFeeChildren,
          entrance_fee_senior: entranceFeeSenior,
          cottagefee: b.cottagefee,
          rules: b.rules,
          status: b.status,
          averagerating: Number(b.averagerating || 0),
          activities: b.beachactivities?.map((activity: any) => activity.name).filter(Boolean) || [],
          amenities: b.facilities?.map((facility: any) => facility.name).filter(Boolean) || [],
          external_links: b.externallinks?.map((el: any) => ({ label: el.label, url: el.url })) || [],
          createdat: b.createdat,
          updatedat: b.updatedat,
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
  } catch (err) {
    console.error('getAllBeaches failed:', err);
    throw err;
  }
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
        beachactivities ( name ),
        facilities ( name ),
        externallinks ( label, url )
      `);

    let dbBeach: any = null;
    if (isUuid) {
      const { data, error } = await query.eq('id', normalized).eq('status', 'active').maybeSingle();
      if (!error && data) dbBeach = data;
    } else {
      const { data, error } = await query.eq('slug', normalized).eq('status', 'active').maybeSingle();
      if (!error && data) {
        dbBeach = data;
      } else {
        // Fallback 1: prefix match on slug (e.g. majestique matches majestique-beach)
        const prefixRes = await supabase
          .from('beaches')
          .select(`
            *,
            beachactivities ( name ),
            facilities ( name ),
            externallinks ( label, url )
          `)
          .eq('status', 'active')
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
              beachactivities ( name ),
              facilities ( name ),
              externallinks ( label, url )
            `)
            .eq('status', 'active')
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
      if (b.ownerid) {
        const adminClient = createAdminClient();
        const [{ data: ownerProfile, error: ownerError }, { data: ownerAuth }] = await Promise.all([
          (adminClient.from('profiles') as any)
            .select('accountstatus, suspendeduntil, statuschangedat')
            .eq('id', b.ownerid)
            .maybeSingle(),
          adminClient.auth.admin.getUserById(b.ownerid),
        ]);
        if (ownerError) throw ownerError;
        const effectiveOwner = resolveEffectiveAccountStatus(ownerProfile, ownerAuth?.user);
        if (effectiveOwner.accountstatus === 'suspended') {
          slugBeachCache.set(normalized, { data: null, expiresAt: now + BEACH_CACHE_TTL_MS });
          return null;
        }
      }
      const approvedTours = new Map<string, string>(); // Virtual tours are stored directly on beaches table

      // Parse openinghours if it's a JSON string
      let parsedOpeningHours = b.openinghours || '';
      if (typeof b.openinghours === 'string' && b.openinghours.startsWith('{')) {
        try {
          parsedOpeningHours = JSON.parse(b.openinghours);
        } catch {
          parsedOpeningHours = b.openinghours;
        }
      }

      // Split entrancefee into adults, children, and senior
      let entranceFeeAdults = null;
      let entranceFeeChildren = null;
      let entranceFeeSenior = null;
      if (b.entrancefee && b.entrancefee.includes('|')) {
        const [adults, children, senior] = b.entrancefee.split('|');
        entranceFeeAdults = adults || null;
        entranceFeeChildren = children || null;
        entranceFeeSenior = senior || null;
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
        cover_image: b.coverimageurl || b.cover_image || null,
        profile_image: b.profileimageurl || b.profile_image || null,
        images: Array.isArray(b.images) ? b.images : [],
        virtualtoururl: b.virtualtoururl || null,
        contactphone: b.contactphone || null,
        contactemail: b.contactemail || null,
        facebookurl: b.facebookurl || null,
        instagramurl: b.instagramurl || null,
        peakdays: b.peakdays || null,
        peakhours: b.peakhours || null,
        bestvisitingtime: b.bestvisitingtime || null,
        openinghours: parsedOpeningHours,
        entrancefee: b.entrancefee,
        entrance_fee_adults: entranceFeeAdults,
        entrance_fee_children: entranceFeeChildren,
        entrance_fee_senior: entranceFeeSenior,
        cottagefee: b.cottagefee,
        rules: b.rules,
        status: b.status,
        averagerating: Number(b.averagerating || 0),
        activities: b.beachactivities?.map((activity: any) => activity.name).filter(Boolean) || [],
        amenities: b.facilities?.map((facility: any) => facility.name).filter(Boolean) || [],
        external_links: b.externallinks?.map((el: any) => ({ label: el.label, url: el.url })) || [],
        createdat: b.createdat,
        updatedat: b.updatedat,
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
