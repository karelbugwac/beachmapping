import { createAdminClient } from '@/lib/supabase/server';
import { invalidateBeachesCache } from '@/lib/db/beaches';

export interface CoordinateRequestData {
  id?: string;
  beachid: string;
  ownerid?: string | null;
  requestedlatitude: number;
  requestedlongitude: number;
  requestedlocation: string;
  requesternote?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionreason?: string | null;
  reviewedby?: string | null;
  reviewedat?: string | null;
  createdat: string;
  updatedat: string;
}

export interface CoordinateRequestWithBeach extends CoordinateRequestData {
  beach?: {
    id: string;
    name: string;
    slug: string;
    location: string;
    latitude: number;
    longitude: number;
    ownerid: string | null;
    cover_image?: string | null;
  } | null;
  owner?: {
    id: string;
    fullname: string;
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

let dedicatedTableExists: boolean | null = null;

/**
 * Checks if optional dedicated table `coordinaterequests` exists (cached in memory).
 */
async function hasDedicatedTable(adminSupabase: any): Promise<boolean> {
  if (dedicatedTableExists !== null) {
    return dedicatedTableExists;
  }
  try {
    const { error } = await adminSupabase.from('coordinaterequests').select('id').limit(1);
    dedicatedTableExists = !error;
    return dedicatedTableExists;
  } catch {
    dedicatedTableExists = false;
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
    const { data, error } = await (adminSupabase.from('coordinaterequests') as any)
      .select('*')
      .eq('beachid', beachId)
      .order('createdat', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as CoordinateRequestData;
    }
  }

  // Fallback to beachinfo
  const { data, error } = await (adminSupabase.from('beachinfo') as any)
    .select('generalinformation, updatedat')
    .eq('beachid', beachId)
    .maybeSingle();

  if (error || !data) return null;

  const parsed = parseGeneralInfo(data.generalinformation);
  return (parsed.coordinate_request as CoordinateRequestData) || null;
}

/**
 * Retrieves all coordinate requests across all beaches, enriched with beach and owner details.
 */
export async function getAllCoordinateRequests(): Promise<CoordinateRequestWithBeach[]> {
  const adminSupabase = createAdminClient();

  const fetchRequestsSource = async () => {
    if (await hasDedicatedTable(adminSupabase)) {
      const { data, error } = await (adminSupabase.from('coordinaterequests') as any)
        .select('*')
        .order('createdat', { ascending: false });
      if (!error && Array.isArray(data)) {
        return { source: 'dedicated' as const, rows: data };
      }
    }
    const { data: generalInfos, error: infoError } = await (adminSupabase.from('beachinfo') as any)
      .select('beachid, generalinformation, updatedat');
    return {
      source: 'fallback' as const,
      rows: !infoError && Array.isArray(generalInfos) ? generalInfos : [],
    };
  };

  // Run beaches query and coordinate requests query in parallel
  const [beachesResult, requestsResult] = await Promise.all([
    (adminSupabase.from('beaches') as any)
      .select('id, name, slug, location, latitude, longitude, ownerid, coverimageurl')
      .order('name', { ascending: true }),
    fetchRequestsSource(),
  ]);

  const beachesData = beachesResult.data;
  if (beachesResult.error || !Array.isArray(beachesData)) return [];

  const beachMap = new Map<string, any>();
  beachesData.forEach((b: any) => beachMap.set(b.id, b));

  // Fetch owner profiles only if there are actual requests to enrich
  const hasRequests =
    requestsResult.source === 'dedicated'
      ? requestsResult.rows.length > 0
      : requestsResult.rows.some((info: any) => Boolean(parseGeneralInfo(info.generalinformation).coordinate_request));

  const ownerIds = hasRequests
    ? Array.from(new Set(beachesData.map((b: any) => b.ownerid).filter(Boolean)))
    : [];
  const ownerMap = new Map<string, any>();
  if (ownerIds.length > 0) {
    const { data: profiles } = await (adminSupabase.from('profiles') as any)
      .select('id, fullname, email')
      .in('id', ownerIds);
    if (Array.isArray(profiles)) {
      profiles.forEach((p: any) => ownerMap.set(p.id, p));
    }
  }

  if (requestsResult.source === 'dedicated') {
    return requestsResult.rows.map((req: any) => {
      const beach = beachMap.get(req.beachid) || null;
      const owner = req.ownerid ? ownerMap.get(req.ownerid) : (beach?.ownerid ? ownerMap.get(beach.ownerid) : null);
      return {
        ...req,
        beach: beach ? {
          id: beach.id,
          name: beach.name,
          slug: beach.slug,
          location: beach.location,
          latitude: Number(beach.latitude),
          longitude: Number(beach.longitude),
          ownerid: beach.ownerid,
          cover_image: beach.coverimageurl,
        } : null,
        owner: owner || null,
      };
    });
  }

  const results: CoordinateRequestWithBeach[] = [];
  for (const info of requestsResult.rows) {
    const parsed = parseGeneralInfo(info.generalinformation);
    if (parsed.coordinate_request) {
      const req = parsed.coordinate_request as CoordinateRequestData;
      const beach = beachMap.get(info.beachid) || null;
      const owner = beach?.ownerid ? ownerMap.get(beach.ownerid) : null;
      results.push({
        ...req,
        beachid: info.beachid,
        beach: beach ? {
          id: beach.id,
          name: beach.name,
          slug: beach.slug,
          location: beach.location,
          latitude: Number(beach.latitude),
          longitude: Number(beach.longitude),
          ownerid: beach.ownerid,
          cover_image: beach.coverimageurl,
        } : null,
        owner: owner || null,
      });
    }
  }

  // Sort: pending first, then by updatedat descending
  results.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.updatedat || b.createdat).getTime() - new Date(a.updatedat || a.createdat).getTime();
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
    beachid: beachId,
    ownerid: ownerId || null,
    requestedlatitude: lat,
    requestedlongitude: lng,
    requestedlocation: requestedLocation ? requestedLocation.trim() : 'Barangay Binongkalan, Catmon, Cebu',
    requesternote: requesterNote ? requesterNote.trim() : null,
    status: 'pending',
    rejectionreason: null,
    reviewedby: null,
    reviewedat: null,
    createdat: now,
    updatedat: now,
  };

  const adminSupabase = createAdminClient();

  if (await hasDedicatedTable(adminSupabase)) {
    const { data, error } = await (adminSupabase.from('coordinaterequests') as any)
      .insert({
        beachid: beachId,
        ownerid: ownerId,
        requestedlatitude: lat,
        requestedlongitude: lng,
        requestedlocation: requestData.requestedlocation,
        requesternote: requestData.requesternote,
        status: 'pending',
      })
      .select('*')
      .single();

    if (!error && data) {
      return data as CoordinateRequestData;
    }
  }

  // Fallback to beachinfo
  const { data: existing } = await (adminSupabase.from('beachinfo') as any)
    .select('generalinformation')
    .eq('beachid', beachId)
    .maybeSingle();

  const currentParsed = parseGeneralInfo(existing?.generalinformation);
  const history = Array.isArray(currentParsed.coordinate_history) ? currentParsed.coordinate_history : [];
  if (currentParsed.coordinate_request) {
    history.unshift(currentParsed.coordinate_request);
  }

  const updatedJson: GeneralInfoJson = {
    ...currentParsed,
    coordinate_request: requestData,
    coordinate_history: history.slice(0, 10),
  };

  const { error: upsertError } = await (adminSupabase.from('beachinfo') as any)
    .upsert(
      {
        beachid: beachId,
        generalinformation: JSON.stringify(updatedJson),
        updatedat: now,
      },
      { onConflict: 'beachid' }
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
    await (adminSupabase.from('coordinaterequests') as any)
      .delete()
      .eq('beachid', beachId)
      .eq('status', 'pending');
    return true;
  }

  const { data: existing } = await (adminSupabase.from('beachinfo') as any)
    .select('generalinformation')
    .eq('beachid', beachId)
    .maybeSingle();

  if (!existing) return true;

  const currentParsed = parseGeneralInfo(existing.generalinformation);
  if (!currentParsed.coordinate_request) return true;

  const updatedJson: GeneralInfoJson = {
    ...currentParsed,
    coordinate_request: null,
  };

  await (adminSupabase.from('beachinfo') as any)
    .update({
      generalinformation: JSON.stringify(updatedJson),
      updatedat: new Date().toISOString(),
    })
    .eq('beachid', beachId);

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

  const { requestedlatitude, requestedlongitude, requestedlocation } = currentReq;

  // 2. Update beaches table
  const { error: beachError } = await (adminSupabase.from('beaches') as any)
    .update({
      latitude: requestedlatitude,
      longitude: requestedlongitude,
      location: requestedlocation,
      updatedat: now,
    })
    .eq('id', beachId);

  if (beachError) {
    throw beachError;
  }

  invalidateBeachesCache();

  // 3. Update status in dedicated table or beachinfo
  if (await hasDedicatedTable(adminSupabase)) {
    await (adminSupabase.from('coordinaterequests') as any)
      .update({
        status: 'approved',
        reviewedby: reviewerId || null,
        reviewedat: now,
        updatedat: now,
      })
      .eq('beachid', beachId)
      .eq('status', 'pending');
  } else {
    const { data: existing } = await (adminSupabase.from('beachinfo') as any)
      .select('generalinformation')
      .eq('beachid', beachId)
      .maybeSingle();

    const currentParsed = parseGeneralInfo(existing?.generalinformation);
    const updatedRequest: CoordinateRequestData = {
      ...currentReq,
      status: 'approved',
      reviewedby: reviewerId || null,
      reviewedat: now,
      updatedat: now,
    };

    const history = Array.isArray(currentParsed.coordinate_history) ? currentParsed.coordinate_history : [];
    history.unshift(updatedRequest);

    const updatedJson: GeneralInfoJson = {
      ...currentParsed,
      coordinate_request: updatedRequest,
      coordinate_history: history.slice(0, 10),
    };

    await (adminSupabase.from('beachinfo') as any)
      .upsert(
        {
          beachid: beachId,
          generalinformation: JSON.stringify(updatedJson),
          updatedat: now,
        },
        { onConflict: 'beachid' }
      );
  }

  return {
    success: true,
    latitude: requestedlatitude,
    longitude: requestedlongitude,
    location: requestedlocation,
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
    await (adminSupabase.from('coordinaterequests') as any)
      .update({
        status: 'rejected',
        rejectionreason: rejectionReason || 'Coordinates could not be verified by Admin.',
        reviewedby: reviewerId || null,
        reviewedat: now,
        updatedat: now,
      })
      .eq('beachid', beachId)
      .eq('status', 'pending');
  } else {
    const { data: existing } = await (adminSupabase.from('beachinfo') as any)
      .select('generalinformation')
      .eq('beachid', beachId)
      .maybeSingle();

    const currentParsed = parseGeneralInfo(existing?.generalinformation);
    const updatedRequest: CoordinateRequestData = {
      ...currentReq,
      status: 'rejected',
      rejectionreason: rejectionReason || 'Coordinates could not be verified by Admin.',
      reviewedby: reviewerId || null,
      reviewedat: now,
      updatedat: now,
    };

    const history = Array.isArray(currentParsed.coordinate_history) ? currentParsed.coordinate_history : [];
    history.unshift(updatedRequest);

    const updatedJson: GeneralInfoJson = {
      ...currentParsed,
      coordinate_request: updatedRequest,
      coordinate_history: history.slice(0, 10),
    };

    await (adminSupabase.from('beachinfo') as any)
      .upsert(
        {
          beachid: beachId,
          generalinformation: JSON.stringify(updatedJson),
          updatedat: now,
        },
        { onConflict: 'beachid' }
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
    updatedat: now,
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

  invalidateBeachesCache();

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
