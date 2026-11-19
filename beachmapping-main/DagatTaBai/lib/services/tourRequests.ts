import { createAdminClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { invalidateBeachesCache } from '@/lib/db/beaches';
import { extractTourEmbedUrl } from '@/lib/utils/tourEmbed';
import { canTransitionTour, TourWorkflowError, type TourActor, type TourStatus } from './tourTransitions';

export interface TourRequestData {
  id: string;
  beach_id: string;
  owner_id: string | null;
  requested_tour_url: string;
  requester_note: string | null;
  status: TourStatus;
  rejection_reason?: string | null;
  status_note: string | null;
  status_updated_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
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
    email: string | null;
  } | null;
}

export interface TourHistoryItem {
  id: string;
  tour_id: string;
  from_status: TourStatus | null;
  to_status: TourStatus;
  note: string | null;
  changed_by: string | null;
  changed_by_name?: string | null;
  changed_by_role?: string | null;
  created_at: string;
}

function getAdminSupabase() {
  return createAdminClient() as unknown as SupabaseClient<Database, 'public', 'public', Database['public']>;
}

export async function getTourBeachOwnerId(beachId: string): Promise<string | null> {
  const { data, error } = await getAdminSupabase().from('beaches')
    .select('owner_id')
    .eq('id', beachId)
    .maybeSingle();
  if (error) throw error;
  return data?.owner_id ?? null;
}

export async function getTourRequestForBeach(beachId: string): Promise<TourRequestData | null> {
  const { data, error } = await getAdminSupabase().from('beach_tour_requests')
    .select('*')
    .eq('beach_id', beachId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as TourRequestData | null;
}

export async function getTourHistory(tourId: string): Promise<TourHistoryItem[]> {
  const admin = getAdminSupabase();
  const { data, error } = await admin.from('beach_tour_status_history')
    .select('*')
    .eq('tour_id', tourId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const history = (data || []) as TourHistoryItem[];
  const userIds = Array.from(new Set(
    history.map((item) => item.changed_by).filter((id): id is string => Boolean(id))
  ));
  if (userIds.length === 0) return history;
  const { data: profiles, error: profileError } = await admin.from('profiles')
    .select('id, full_name, role')
    .in('id', userIds);
  if (profileError) throw profileError;
  const profileMap = new Map(
    (profiles || []).map((profile) => [profile.id, { full_name: profile.full_name, role: profile.role }] as const)
  );
  return history.map((item) => ({
    ...item,
    changed_by_name: item.changed_by ? profileMap.get(item.changed_by)?.full_name || null : null,
    changed_by_role: item.changed_by ? profileMap.get(item.changed_by)?.role || null : null,
  }));
}

export async function getAllTourRequests(): Promise<TourRequestWithBeach[]> {
  const admin = getAdminSupabase();
  const [requestsResult, beachesResult] = await Promise.all([
    admin.from('beach_tour_requests')
      .select('*')
      .order('status_updated_at', { ascending: false }),
    admin.from('beaches')
      .select('id, name, slug, location, virtual_tour_url, owner_id, cover_image')
      .order('name', { ascending: true }),
  ]);
  if (requestsResult.error) throw requestsResult.error;
  if (beachesResult.error) throw beachesResult.error;

  const beaches = new Map(
    (beachesResult.data || []).map((beach) => [beach.id, beach] as const)
  );
  const ownerIds = Array.from(new Set(
    (beachesResult.data || []).map((beach) => beach.owner_id).filter((id): id is string => Boolean(id))
  ));
  const ownerMap = new Map<string, { id: string; full_name: string; email: string | null }>();
  if (ownerIds.length) {
    const { data: profiles, error } = await admin.from('profiles')
      .select('id, full_name, email')
      .in('id', ownerIds);
    if (error) throw error;
    (profiles || []).forEach((profile) => ownerMap.set(profile.id, profile));
  }

  return ((requestsResult.data || []) as TourRequestData[]).map((request) => {
    const beach = beaches.get(request.beach_id) || null;
    return {
      ...request,
      beach: beach ? {
        id: beach.id,
        name: beach.name,
        slug: beach.slug,
        location: beach.location,
        virtual_tour_url: beach.virtual_tour_url,
        owner_id: beach.owner_id,
        cover_image: beach.cover_image,
      } : null,
      owner: beach?.owner_id ? ownerMap.get(beach.owner_id) || null : null,
    };
  });
}

function normalizeTourUrl(input: string): string {
  const cleaned = extractTourEmbedUrl(input);
  if (!cleaned) throw new TourWorkflowError('Add a valid 360° tour link before continuing.');
  let url: URL;
  try {
    url = new URL(cleaned);
  } catch {
    throw new TourWorkflowError('Add a valid 360° tour link before continuing.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new TourWorkflowError('Add a valid 360° tour link before continuing.');
  }
  return url.toString();
}

export async function saveTourDraft(params: {
  beachId: string;
  ownerId: string;
  requestedUrl: string;
  requesterNote?: string | null;
}): Promise<TourRequestData> {
  const admin = getAdminSupabase();
  const current = await getTourRequestForBeach(params.beachId);
  if (current && current.status !== 'in_progress') {
    throw new TourWorkflowError('The tour cannot be edited while it is under review or approved.');
  }

  const now = new Date().toISOString();
  const requestedUrl = normalizeTourUrl(params.requestedUrl);
  const requesterNote = params.requesterNote?.trim() || null;

  if (current) {
    const { data, error } = await admin.from('beach_tour_requests')
      .update({ requested_tour_url: requestedUrl, requester_note: requesterNote, updated_at: now })
      .eq('id', current.id)
      .eq('status', 'in_progress')
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new TourWorkflowError('The tour changed in another session. Refresh and try again.');
    return data as TourRequestData;
  }

  const { data, error } = await admin.from('beach_tour_requests')
    .insert({
      beach_id: params.beachId,
      owner_id: params.ownerId,
      requested_tour_url: requestedUrl,
      requester_note: requesterNote,
      status: 'in_progress',
      status_updated_at: now,
    })
    .select('*')
    .single();
  if (error) throw error;

  return data as TourRequestData;
}

async function createStatusNotifications(
  tour: TourRequestData,
  actor: TourActor,
  toStatus: TourStatus,
  note: string | null
) {
  const admin = getAdminSupabase();
  const { data: beach, error: beachError } = await admin.from('beaches')
    .select('name, owner_id')
    .eq('id', tour.beach_id)
    .single();
  if (beachError) throw beachError;

  const recipients = new Map<string, { title: string; message: string; actionUrl: string }>();
  if (beach.owner_id) {
    recipients.set(beach.owner_id, {
      title: toStatus === 'approved'
        ? 'Your 360° tour is approved'
        : toStatus === 'review'
          ? 'Your 360° tour is under review'
          : 'Changes requested for your 360° tour',
      message: toStatus === 'approved'
        ? `${beach.name}'s 360° tour is now live.`
        : toStatus === 'review'
          ? 'Your tour was submitted to an admin for review.'
          : note || 'Please update your tour and submit it for review again.',
      actionUrl: '/owner/beach',
    });
  }

  if (actor === 'owner' && toStatus === 'review') {
    const { data: admins, error: adminError } = await admin.from('profiles')
      .select('id')
      .eq('role', 'admin');
    if (adminError) throw adminError;
    for (const profile of admins || []) {
      recipients.set(profile.id, {
        title: '360° tour submitted for review',
        message: `${beach.name} submitted a tour for review.`,
        actionUrl: '/admin/beaches',
      });
    }
  }

  if (recipients.size === 0) return;
  const { error } = await admin.from('user_notifications').insert(
    Array.from(recipients, ([user_id, notification]) => ({
      user_id,
      login_device_id: null,
      type: 'tour_status',
      title: notification.title,
      message: notification.message,
      action_url: notification.actionUrl,
    }))
  );
  if (error) throw error;
}

export async function transitionTourRequest(params: {
  requestId: string;
  toStatus: TourStatus;
  actor: TourActor;
  actorId: string;
  note?: string | null;
}): Promise<TourRequestData> {
  const admin = getAdminSupabase();
  const { data: current, error: currentError } = await admin.from('beach_tour_requests')
    .select('*')
    .eq('id', params.requestId)
    .maybeSingle();
  if (currentError) throw currentError;
  if (!current) throw new Error('Tour request not found.');

  const latest = await getTourRequestForBeach(current.beach_id);
  if (!latest || !canTransitionTour({
    actor: params.actor,
    fromStatus: current.status,
    toStatus: params.toStatus,
    requestId: params.requestId,
    currentRequestId: latest.id,
    note: params.note,
  })) {
    throw new TourWorkflowError('This tour status change is not allowed or the request is out of date.');
  }

  const now = new Date().toISOString();
  const note = params.toStatus === 'in_progress' ? params.note!.trim() : null;
  const update = {
    status: params.toStatus,
    status_updated_at: now,
    status_note: note,
    reviewed_by: params.actor === 'admin' ? params.actorId : null,
    reviewed_at: params.actor === 'admin' ? now : null,
    approved_at: params.toStatus === 'approved' ? now : null,
    updated_at: now,
  };
  const { data, error } = await admin.from('beach_tour_requests')
    .update(update)
    .eq('id', params.requestId)
    .eq('status', current.status)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new TourWorkflowError('This tour request changed in another session. Refresh and try again.');

  const tour = data as TourRequestData;
  if (params.toStatus === 'approved') {
    const { error: beachError } = await admin.from('beaches')
      .update({ virtual_tour_url: tour.requested_tour_url, updated_at: now })
      .eq('id', tour.beach_id);
    if (beachError) throw beachError;
  }
  invalidateBeachesCache();
  await createStatusNotifications(tour, params.actor, params.toStatus, note);
  return tour;
}

export async function getTourRequestForAdmin(requestId: string): Promise<TourRequestWithBeach | null> {
  const admin = getAdminSupabase();
  const { data: request, error } = await admin.from('beach_tour_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();
  if (error) throw error;
  if (!request) return null;

  const { data: beach, error: beachError } = await admin.from('beaches')
    .select('id, name, slug, location, virtual_tour_url, owner_id, cover_image')
    .eq('id', request.beach_id)
    .maybeSingle();
  if (beachError) throw beachError;
  let owner: TourRequestWithBeach['owner'] = null;
  if (request.owner_id) {
    const { data, error: ownerError } = await admin.from('profiles')
      .select('id, full_name, email')
      .eq('id', request.owner_id)
      .maybeSingle();
    if (ownerError) throw ownerError;
    owner = data;
  }
  return {
    ...request,
    beach: beach ? {
      id: beach.id,
      name: beach.name,
      slug: beach.slug,
      location: beach.location,
      virtual_tour_url: beach.virtual_tour_url,
      owner_id: beach.owner_id,
      cover_image: beach.cover_image,
    } : null,
    owner,
  } as TourRequestWithBeach;
}

/**
 * Approves a pending tour request: sets beaches.virtual_tour_url and updates request status.
 */
export async function approveTourRequest(params: {
  beachId: string;
  reviewerId?: string | null;
  overrideTourUrl?: string | null;
}): Promise<{ success: boolean; tourUrl: string }> {
  const { beachId, reviewerId, overrideTourUrl } = params;
  const admin = getAdminSupabase();
  const now = new Date().toISOString();

  const currentReq = await getTourRequestForBeach(beachId);
  if (!currentReq || !currentReq.requested_tour_url) {
    throw new Error('No pending 360 tour request found for this beach.');
  }

  const candidateUrl =
    typeof overrideTourUrl === 'string' && overrideTourUrl.trim()
      ? extractTourEmbedUrl(overrideTourUrl.trim()) || overrideTourUrl.trim()
      : currentReq.requested_tour_url;
  const isRecapturePlaceholder = candidateUrl === 'Recapture Request';

  if (!isRecapturePlaceholder) {
    const { error: beachError } = await (admin.from('beaches') as any)
      .update({
        virtual_tour_url: candidateUrl,
        updated_at: now,
      })
      .eq('id', beachId);

    if (beachError) {
      throw beachError;
    }

    invalidateBeachesCache();
  }

  await (admin.from('beach_tour_requests') as any)
    .update({
      status: 'approved',
      reviewed_by: reviewerId || null,
      reviewed_at: now,
      approved_at: now,
      updated_at: now,
    })
    .eq('beach_id', beachId)
    .eq('status', currentReq.status);

  return { success: true, tourUrl: candidateUrl };
}

export async function rejectTourRequest(params: {
  beachId: string;
  rejectionReason: string;
  reviewerId?: string | null;
}): Promise<boolean> {
  const { beachId, rejectionReason, reviewerId } = params;
  const admin = getAdminSupabase();
  const now = new Date().toISOString();

  await (admin.from('beach_tour_requests') as any)
    .update({
      status: 'in_progress',
      status_note: rejectionReason,
      reviewed_by: reviewerId || null,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('beach_id', beachId);

  return true;
}

export async function cancelTourRequest(params: { beachId: string }): Promise<boolean> {
  const admin = getAdminSupabase();
  await (admin.from('beach_tour_requests') as any)
    .delete()
    .eq('beach_id', params.beachId)
    .eq('status', 'in_progress');
  return true;
}
