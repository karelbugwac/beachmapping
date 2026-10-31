import { createAdminClient } from '@/lib/supabase/server';

export interface CoordinateRequestData {
  id?: string;
  beach_id: string;
  owner_id?: string | null;
  requested_latitude: number;
  requested_longitude: number;
  requested_location: string;
  requester_note?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoordinateRequestWithBeach extends CoordinateRequestData {
  beach?: {
    id: string;
    name: string;
    slug: string;
    location: string;
    latitude: number;
    longitude: number;
    owner_id: string | null;
    cover_image?: string | null;
  } | null;
  owner?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

interface GeneralInfoJson {
  tour_request?: any;
  tour_history?: any[];
  coordinate_request?: CoordinateRequestData | null;
  coordinate_history?: CoordinateRequestData[];
  [key: string]: any;
}

/**
 * Checks if optional dedicated table `beach_coordinate_requests` exists.
 */
async function hasDedicatedTable(adminSupabase: any): Promise<boolean> {
  try {
    const { error } = await adminSupabase.from('beach_coordinate_requests').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

function parseGeneralInfo(raw: any): GeneralInfoJson {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Retrieves the current coordinate request for a beach.
 */
export async function getCoordinateRequestForBeach(beachId: string): Promise<CoordinateRequestData | null> {
  const adminSupabase = createAdminClient();

  // Try dedicated table first
  if (await hasDedicatedTable(adminSupabase)) {
    const { data, error } = await (adminSupabase.from('beach_coordinate_requests') as any)
      .select('*')
      .eq('beach_id', beachId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as CoordinateRequestData;
    }
  }

  // Fallback to beach_general_information
  const { data, error } = await (adminSupabase.from('beach_general_information') as any)
    .select('general_information, updated_at')
    .eq('beach_id', beachId)
    .maybeSingle();

  if (error || !data) return null;

  const parsed = parseGeneralInfo(data.general_information);
  return (parsed.coordinate_request as CoordinateRequestData) || null;
}

/**
 * Retrieves all coordinate requests across all beaches, enriched with beach and owner details.
 */
export async function getAllCoordinateRequests(): Promise<CoordinateRequestWithBeach[]> {
  const adminSupabase = createAdminClient();

  // Fetch all beaches
  const { data: beachesData, error: beachError } = await (adminSupabase.from('beaches') as any)
    .select('id, name, slug, location, latitude, longitude, owner_id, cover_image_url')
    .order('name', { ascending: true });

  if (beachError || !Array.isArray(beachesData)) return [];

  const beachMap = new Map<string, any>();
  beachesData.forEach((b: any) => beachMap.set(b.id, b));

  // Fetch owner profiles
  const ownerIds = beachesData.map((b: any) => b.owner_id).filter(Boolean);
  const ownerMap = new Map<string, any>();
  if (ownerIds.length > 0) {
    const { data: profiles } = await (adminSupabase.from('profiles') as any)
      .select('id, full_name, email')
      .in('id', ownerIds);
    if (Array.isArray(profiles)) {
      profiles.forEach((p: any) => ownerMap.set(p.id, p));
    }
  }

  const results: CoordinateRequestWithBeach[] = [];

  // Dedicated table first
  if (await hasDedicatedTable(adminSupabase)) {
    const { data, error } = await (adminSupabase.from('beach_coordinate_requests') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      return data.map((req: any) => {
        const beach = beachMap.get(req.beach_id) || null;
        const owner = req.owner_id ? ownerMap.get(req.owner_id) : (beach?.owner_id ? ownerMap.get(beach.owner_id) : null);
        return {
          ...req,
          beach: beach ? {
            id: beach.id,
            name: beach.name,
            slug: beach.slug,
            location: beach.location,
            latitude: Number(beach.latitude),
            longitude: Number(beach.longitude),
            owner_id: beach.owner_id,
            cover_image: beach.cover_image_url,
          } : null,
          owner: owner || null,
        };
      });
    }
  }

  // Fallback: Read from beach_general_information
  const { data: generalInfos, error: infoError } = await (adminSupabase.from('beach_general_information') as any)
    .select('beach_id, general_information, updated_at');

  if (!infoError && Array.isArray(generalInfos)) {
    for (const info of generalInfos) {
      const parsed = parseGeneralInfo(info.general_information);
      if (parsed.coordinate_request) {
        const req = parsed.coordinate_request as CoordinateRequestData;
        const beach = beachMap.get(info.beach_id) || null;
        const owner = beach?.owner_id ? ownerMap.get(beach.owner_id) : null;
        results.push({
          ...req,
          beach_id: info.beach_id,
          beach: beach ? {
            id: beach.id,
            name: beach.name,
            slug: beach.slug,
            location: beach.location,
            latitude: Number(beach.latitude),
            longitude: Number(beach.longitude),
            owner_id: beach.owner_id,
            cover_image: beach.cover_image_url,
          } : null,
          owner: owner || null,
        });
      }
    }
  }

  // Sort: pending first, then by updated_at descending
  results.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
  });

  return results;
}

/**
 * Submits or updates a coordinate/location request for a beach.
 */
export async function submitCoordinateRequest(params: {
  beachId: string;
  ownerId?: string | null;
  requestedLatitude: number | string;
  requestedLongitude: number | string;
  requestedLocation?: string;
  requesterNote?: string;
}): Promise<CoordinateRequestData> {
  const { beachId, ownerId, requestedLatitude, requestedLongitude, requestedLocation, requesterNote } = params;

  const lat = parseFloat(String(requestedLatitude));
  const lng = parseFloat(String(requestedLongitude));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Valid numeric latitude and longitude coordinates are required.');
  }

  const now = new Date().toISOString();
  const requestData: CoordinateRequestData = {
    id: `coord-req-${Date.now()}`,
    beach_id: beachId,
    owner_id: ownerId || null,
    requested_latitude: lat,
    requested_longitude: lng,
    requested_location: requestedLocation ? requestedLocation.trim() : 'Barangay Binongkalan, Catmon, Cebu',
    requester_note: requesterNote ? requesterNote.trim() : null,
    status: 'pending',
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: now,
    updated_at: now,
  };

  const adminSupabase = createAdminClient();

  if (await hasDedicatedTable(adminSupabase)) {
    const { data, error } = await (adminSupabase.from('beach_coordinate_requests') as any)
      .insert({
        beach_id: beachId,
        owner_id: ownerId,
        requested_latitude: lat,
        requested_longitude: lng,
        requested_location: requestData.requested_location,
        requester_note: requestData.requester_note,
        status: 'pending',
      })
      .select('*')
      .single();

    if (!error && data) {
      return data as CoordinateRequestData;
    }
  }

  // Fallback to beach_general_information
  const { data: existing } = await (adminSupabase.from('beach_general_information') as any)
    .select('general_information')
    .eq('beach_id', beachId)
    .maybeSingle();

  const currentParsed = parseGeneralInfo(existing?.general_information);
  const history = Array.isArray(currentParsed.coordinate_history) ? currentParsed.coordinate_history : [];
  if (currentParsed.coordinate_request) {
    history.unshift(currentParsed.coordinate_request);
  }

  const updatedJson: GeneralInfoJson = {
    ...currentParsed,
    coordinate_request: requestData,
    coordinate_history: history.slice(0, 10),
  };

  const { error: upsertError } = await (adminSupabase.from('beach_general_information') as any)
    .upsert(
      {
        beach_id: beachId,
        general_information: JSON.stringify(updatedJson),
        updated_at: now,
      },
      { onConflict: 'beach_id' }
    );

  if (upsertError) {
    throw upsertError;
  }

  return requestData;
}

/**
 * Cancels a pending coordinate request.
 */
export async function cancelCoordinateRequest(params: {
  beachId: string;
  ownerId?: string | null;
}): Promise<boolean> {
  const { beachId } = params;
  const adminSupabase = createAdminClient();

  if (await hasDedicatedTable(adminSupabase)) {
    await (adminSupabase.from('beach_coordinate_requests') as any)
      .delete()
      .eq('beach_id', beachId)
      .eq('status', 'pending');
    return true;
  }

  const { data: existing } = await (adminSupabase.from('beach_general_information') as any)
    .select('general_information')
    .eq('beach_id', beachId)
    .maybeSingle();

  if (!existing) return true;

  const currentParsed = parseGeneralInfo(existing.general_information);
  if (!currentParsed.coordinate_request) return true;

  const updatedJson: GeneralInfoJson = {
    ...currentParsed,
    coordinate_request: null,
  };

  await (adminSupabase.from('beach_general_information') as any)
    .update({
      general_information: JSON.stringify(updatedJson),
      updated_at: new Date().toISOString(),
    })
    .eq('beach_id', beachId);

  return true;
}

/**
 * Approves a pending coordinate request: updates beaches.latitude, beaches.longitude, beaches.location.
 */
export async function approveCoordinateRequest(params: {
  beachId: string;
  reviewerId?: string | null;
}): Promise<{ success: boolean; latitude: number; longitude: number; location: string }> {
  const { beachId, reviewerId } = params;
  const adminSupabase = createAdminClient();
  const now = new Date().toISOString();

  // 1. Get the current request
  const currentReq = await getCoordinateRequestForBeach(beachId);
  if (!currentReq) {
    throw new Error('No pending coordinates request found for this beach.');
  }

  const { requested_latitude, requested_longitude, requested_location } = currentReq;

  // 2. Update beaches table
  const { error: beachError } = await (adminSupabase.from('beaches') as any)
    .update({
      latitude: requested_latitude,
      longitude: requested_longitude,
      location: requested_location,
      updated_at: now,
    })
    .eq('id', beachId);

  if (beachError) {
    throw beachError;
  }

  // 3. Update status in dedicated table or beach_general_information
  if (await hasDedicatedTable(adminSupabase)) {
    await (adminSupabase.from('beach_coordinate_requests') as any)
      .update({
        status: 'approved',
        reviewed_by: reviewerId || null,
        reviewed_at: now,
        updated_at: now,
      })
      .eq('beach_id', beachId)
      .eq('status', 'pending');
  } else {
    const { data: existing } = await (adminSupabase.from('beach_general_information') as any)
      .select('general_information')
      .eq('beach_id', beachId)
      .maybeSingle();

    const currentParsed = parseGeneralInfo(existing?.general_information);
    const updatedRequest: CoordinateRequestData = {
      ...currentReq,
      status: 'approved',
      reviewed_by: reviewerId || null,
      reviewed_at: now,
      updated_at: now,
    };

    const history = Array.isArray(currentParsed.coordinate_history) ? currentParsed.coordinate_history : [];
    history.unshift(updatedRequest);

    const updatedJson: GeneralInfoJson = {
      ...currentParsed,
      coordinate_request: updatedRequest,
      coordinate_history: history.slice(0, 10),
    };

    await (adminSupabase.from('beach_general_information') as any)
      .upsert(
        {
          beach_id: beachId,
          general_information: JSON.stringify(updatedJson),
          updated_at: now,
        },
        { onConflict: 'beach_id' }
      );
  }

  return {
    success: true,
    latitude: requested_latitude,
    longitude: requested_longitude,
    location: requested_location,
  };
}

/**
 * Rejects a coordinate request with an optional reason.
 */
export async function rejectCoordinateRequest(params: {
  beachId: string;
  rejectionReason?: string;
  reviewerId?: string | null;
}): Promise<boolean> {
  const { beachId, rejectionReason, reviewerId } = params;
  const adminSupabase = createAdminClient();
  const now = new Date().toISOString();

  const currentReq = await getCoordinateRequestForBeach(beachId);
  if (!currentReq) {
    throw new Error('No coordinates request found for this beach.');
  }

  if (await hasDedicatedTable(adminSupabase)) {
    await (adminSupabase.from('beach_coordinate_requests') as any)
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason || 'Coordinates could not be verified by Admin.',
        reviewed_by: reviewerId || null,
        reviewed_at: now,
        updated_at: now,
      })
      .eq('beach_id', beachId)
      .eq('status', 'pending');
  } else {
    const { data: existing } = await (adminSupabase.from('beach_general_information') as any)
      .select('general_information')
      .eq('beach_id', beachId)
      .maybeSingle();

    const currentParsed = parseGeneralInfo(existing?.general_information);
    const updatedRequest: CoordinateRequestData = {
      ...currentReq,
      status: 'rejected',
      rejection_reason: rejectionReason || 'Coordinates could not be verified by Admin.',
      reviewed_by: reviewerId || null,
      reviewed_at: now,
      updated_at: now,
    };

    const history = Array.isArray(currentParsed.coordinate_history) ? currentParsed.coordinate_history : [];
    history.unshift(updatedRequest);

    const updatedJson: GeneralInfoJson = {
      ...currentParsed,
      coordinate_request: updatedRequest,
      coordinate_history: history.slice(0, 10),
    };

    await (adminSupabase.from('beach_general_information') as any)
      .upsert(
        {
          beach_id: beachId,
          general_information: JSON.stringify(updatedJson),
          updated_at: now,
        },
        { onConflict: 'beach_id' }
      );
  }

  return true;
}

/**
 * Direct Admin update: Admin directly sets, modifies, or corrects latitude, longitude, and location on a beach.
 */
export async function adminSetBeachCoordinates(params: {
  beachId: string;
  latitude: number | string;
  longitude: number | string;
  location?: string;
  reviewerId?: string | null;
}): Promise<boolean> {
  const { beachId, latitude, longitude, location, reviewerId } = params;
  const adminSupabase = createAdminClient();
  const now = new Date().toISOString();

  const lat = parseFloat(String(latitude));
  const lng = parseFloat(String(longitude));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Valid numeric coordinates are required.');
  }

  const payload: Record<string, any> = {
    latitude: lat,
    longitude: lng,
    updated_at: now,
  };
  if (typeof location === 'string' && location.trim()) {
    payload.location = location.trim();
  }

  const { error: beachError } = await (adminSupabase.from('beaches') as any)
    .update(payload)
    .eq('id', beachId);

  if (beachError) {
    throw beachError;
  }

  // Resolve any pending request for this beach
  try {
    const currentReq = await getCoordinateRequestForBeach(beachId);
    if (currentReq && currentReq.status === 'pending') {
      await approveCoordinateRequest({ beachId, reviewerId });
    }
  } catch {
    // Non-critical if request sync fails
  }

  return true;
}
