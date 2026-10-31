import { createAdminClient } from '@/lib/supabase/server';
import { extractTourEmbedUrl } from '@/lib/utils/tourEmbed';

export interface TourRequestData {
  id?: string;
  beach_id: string;
  owner_id?: string | null;
  requested_tour_url: string;
  requester_note?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TourRequestWithBeach extends TourRequestData {
  beach?: {
    id: string;
    name: string;
    slug: string;
    location: string;
    virtual_tour_url: string | null;
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
  tour_request?: TourRequestData | null;
  tour_history?: TourRequestData[];
  [key: string]: any;
}

/**
 * Checks if the optional dedicated table `beach_tour_requests` exists.
 */
async function hasDedicatedTable(adminSupabase: any): Promise<boolean> {
  try {
    const { error } = await adminSupabase.from('beach_tour_requests').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Parses JSON general_information from beach_general_information table.
 */
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
 * Retrieves the current tour request for a specific beach.
 */
export async function getTourRequestForBeach(beachId: string): Promise<TourRequestData | null> {
  const adminSupabase = createAdminClient();

  // Try dedicated table first if available
  if (await hasDedicatedTable(adminSupabase)) {
    const { data, error } = await (adminSupabase.from('beach_tour_requests') as any)
      .select('*')
      .eq('beach_id', beachId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as TourRequestData;
    }
  }

  // Fallback to beach_general_information
  const { data, error } = await (adminSupabase.from('beach_general_information') as any)
    .select('general_information, updated_at')
    .eq('beach_id', beachId)
    .maybeSingle();

  if (error || !data) return null;

  const parsed = parseGeneralInfo(data.general_information);
  return (parsed.tour_request as TourRequestData) || null;
}

/**
 * Retrieves all tour requests across all beaches, enriched with beach and owner details.
 */
export async function getAllTourRequests(): Promise<TourRequestWithBeach[]> {
  const adminSupabase = createAdminClient();

  // Fetch all beaches
  const { data: beachesData, error: beachError } = await (adminSupabase.from('beaches') as any)
    .select('id, name, slug, location, virtual_tour_url, owner_id, cover_image_url')
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

  const results: TourRequestWithBeach[] = [];

  // Check dedicated table first
  if (await hasDedicatedTable(adminSupabase)) {
    const { data, error } = await (adminSupabase.from('beach_tour_requests') as any)
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
            virtual_tour_url: beach.virtual_tour_url,
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
      if (parsed.tour_request) {
        const req = parsed.tour_request as TourRequestData;
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
            virtual_tour_url: beach.virtual_tour_url,
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
 * Submits or updates a 360 tour request for a beach.
 */
export async function submitTourRequest(params: {
  beachId: string;
  ownerId?: string | null;
  requestedUrl: string;
  requesterNote?: string;
}): Promise<TourRequestData> {
  const { beachId, ownerId, requestedUrl, requesterNote } = params;
  const cleanUrl = extractTourEmbedUrl(requestedUrl) || requestedUrl.trim();

  if (!cleanUrl) {
    throw new Error('A valid 360 Virtual Tour link or embed code is required.');
  }

  const now = new Date().toISOString();
  const requestData: TourRequestData = {
    id: `tour-req-${Date.now()}`,
    beach_id: beachId,
    owner_id: ownerId || null,
    requested_tour_url: cleanUrl,
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
    const { data, error } = await (adminSupabase.from('beach_tour_requests') as any)
      .insert({
        beach_id: beachId,
        owner_id: ownerId,
        requested_tour_url: cleanUrl,
        requester_note: requestData.requester_note,
        status: 'pending',
      })
      .select('*')
      .single();

    if (!error && data) {
      return data as TourRequestData;
    }
  }

  // Fallback to beach_general_information
  const { data: existing } = await (adminSupabase.from('beach_general_information') as any)
    .select('general_information')
    .eq('beach_id', beachId)
    .maybeSingle();

  const currentParsed = parseGeneralInfo(existing?.general_information);
  const history = Array.isArray(currentParsed.tour_history) ? currentParsed.tour_history : [];
  if (currentParsed.tour_request) {
    history.unshift(currentParsed.tour_request);
  }

  const updatedJson: GeneralInfoJson = {
    ...currentParsed,
    tour_request: requestData,
    tour_history: history.slice(0, 10), // keep last 10
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
 * Cancels a pending tour request.
 */
export async function cancelTourRequest(params: {
  beachId: string;
  ownerId?: string | null;
}): Promise<boolean> {
  const { beachId } = params;
  const adminSupabase = createAdminClient();

  if (await hasDedicatedTable(adminSupabase)) {
    await (adminSupabase.from('beach_tour_requests') as any)
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
  if (!currentParsed.tour_request) return true;

  const updatedJson: GeneralInfoJson = {
    ...currentParsed,
    tour_request: null,
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
 * Approves a pending tour request: sets beaches.virtual_tour_url and updates request status.
 */
export async function approveTourRequest(params: {
  beachId: string;
  reviewerId?: string | null;
}): Promise<{ success: boolean; tourUrl: string }> {
  const { beachId, reviewerId } = params;
  const adminSupabase = createAdminClient();
  const now = new Date().toISOString();

  // 1. Get the current request
  const currentReq = await getTourRequestForBeach(beachId);
  if (!currentReq || !currentReq.requested_tour_url) {
    throw new Error('No pending 360 tour request found for this beach.');
  }

  const tourUrl = currentReq.requested_tour_url;

  // 2. Update beaches table
  const { error: beachError } = await (adminSupabase.from('beaches') as any)
    .update({
      virtual_tour_url: tourUrl,
      updated_at: now,
    })
    .eq('id', beachId);

  if (beachError) {
    throw beachError;
  }

  // 3. Update dedicated table or beach_general_information
  if (await hasDedicatedTable(adminSupabase)) {
    await (adminSupabase.from('beach_tour_requests') as any)
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
    const updatedRequest: TourRequestData = {
      ...currentReq,
      status: 'approved',
      reviewed_by: reviewerId || null,
      reviewed_at: now,
      updated_at: now,
    };

    const history = Array.isArray(currentParsed.tour_history) ? currentParsed.tour_history : [];
    history.unshift(updatedRequest);

    const updatedJson: GeneralInfoJson = {
      ...currentParsed,
      tour_request: updatedRequest,
      tour_history: history.slice(0, 10),
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

  return { success: true, tourUrl };
}

/**
 * Rejects a tour request with an optional reason.
 */
export async function rejectTourRequest(params: {
  beachId: string;
  rejectionReason?: string;
  reviewerId?: string | null;
}): Promise<boolean> {
  const { beachId, rejectionReason, reviewerId } = params;
  const adminSupabase = createAdminClient();
  const now = new Date().toISOString();

  const currentReq = await getTourRequestForBeach(beachId);
  if (!currentReq) {
    throw new Error('No 360 tour request found for this beach.');
  }

  if (await hasDedicatedTable(adminSupabase)) {
    await (adminSupabase.from('beach_tour_requests') as any)
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason || 'Tour did not meet publication standards.',
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
    const updatedRequest: TourRequestData = {
      ...currentReq,
      status: 'rejected',
      rejection_reason: rejectionReason || 'Tour did not meet publication standards.',
      reviewed_by: reviewerId || null,
      reviewed_at: now,
      updated_at: now,
    };

    const history = Array.isArray(currentParsed.tour_history) ? currentParsed.tour_history : [];
    history.unshift(updatedRequest);

    const updatedJson: GeneralInfoJson = {
      ...currentParsed,
      tour_request: updatedRequest,
      tour_history: history.slice(0, 10),
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
 * Direct Admin update: Admin directly sets, modifies, or clears the virtual_tour_url on a beach.
 */
export async function adminSetBeachTour(params: {
  beachId: string;
  virtualTourUrl: string | null;
  reviewerId?: string | null;
}): Promise<boolean> {
  const { beachId, virtualTourUrl, reviewerId } = params;
  const adminSupabase = createAdminClient();
  const now = new Date().toISOString();

  const cleanUrl = virtualTourUrl ? (extractTourEmbedUrl(virtualTourUrl) || virtualTourUrl.trim()) : null;

  const { error: beachError } = await (adminSupabase.from('beaches') as any)
    .update({
      virtual_tour_url: cleanUrl,
      updated_at: now,
    })
    .eq('id', beachId);

  if (beachError) {
    throw beachError;
  }

  // If there was any pending request for this beach, mark it as resolved / approved
  try {
    const currentReq = await getTourRequestForBeach(beachId);
    if (currentReq && currentReq.status === 'pending') {
      if (cleanUrl) {
        await approveTourRequest({ beachId, reviewerId });
      } else {
        await cancelTourRequest({ beachId });
      }
    }
  } catch {
    // Non-critical if request sync fails
  }

  return true;
}
