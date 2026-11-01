import { createServerSupabaseClient } from '@/lib/supabase/server';

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

export interface BeachRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  cover_image: string | null;
  profile_image?: string | null;
  images: BeachPhoto[];
  virtual_tour_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
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
  created_at: string;
  updated_at: string;
}

/**
 * Empty verified beaches repository.
 * User requested to delete all existing mock beaches so they can input real data via the Beach Owner portal.
 */
const VERIFIED_CATMON_BEACHES: BeachRecord[] = [];

export async function getAllBeaches(): Promise<BeachRecord[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: dbBeaches, error } = await supabase
      .from('beaches')
      .select(`
        *,
        beach_activities ( name ),
        beach_facilities ( name ),
        beach_external_links ( label, url )
      `)
      .eq('status', 'active');

    if (!error && Array.isArray(dbBeaches)) {
      return dbBeaches.map((b: any) => {
        // Parse opening_hours if it's a JSON string
        let parsedOpeningHours = b.opening_hours || '8:00 AM - 6:00 PM';
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

        return {
          id: b.id,
          slug: b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          name: b.name,
          description: b.description,
          location: b.location,
          latitude: Number(b.latitude),
          longitude: Number(b.longitude),
          cover_image: b.cover_image_url || b.cover_image || null,
          profile_image: b.profile_image_url || b.profile_image || null,
          images: Array.isArray(b.images) ? b.images : [],
          virtual_tour_url: b.virtual_tour_url || null,
          contact_phone: b.contact_phone || null,
          contact_email: b.contact_email || null,
          facebook_url: b.facebook_url || null,
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
    }
  } catch (err) {
    // Database connection or table initialization fallback
  }

  return VERIFIED_CATMON_BEACHES;
}

export async function getBeachBySlug(slug: string): Promise<BeachRecord | null> {
  const normalized = decodeURIComponent(slug).toLowerCase().trim();

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
      let parsedOpeningHours = b.opening_hours || '8:00 AM - 6:00 PM';
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

      return {
        id: b.id,
        slug: b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        name: b.name,
        description: b.description,
        location: b.location,
        latitude: Number(b.latitude),
        longitude: Number(b.longitude),
        cover_image: b.cover_image_url || b.cover_image || null,
        profile_image: b.profile_image_url || b.profile_image || null,
        images: Array.isArray(b.images) ? b.images : [],
        virtual_tour_url: b.virtual_tour_url || null,
        contact_phone: b.contact_phone || null,
        contact_email: b.contact_email || null,
        facebook_url: b.facebook_url || null,
        instagram_url: b.instagram_url || null,
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
    }
  } catch (err) {
    // Database connection or table initialization fallback
  }

  return null;
}

export async function getBeachById(id: string): Promise<BeachRecord | null> {
  return getBeachBySlug(id);
}
