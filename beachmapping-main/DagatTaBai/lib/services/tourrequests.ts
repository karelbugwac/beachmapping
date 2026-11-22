import { createAdminClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { invalidateBeachesCache } from '@/lib/db/beaches';
import { extractTourEmbedUrl } from '@/lib/utils/tourEmbed';
import { canTransitionTour, TourWorkflowError, type TourActor, type TourStatus } from './tourtransitions';

export interface TourRequestData {
  id: string;
  beachid: string;
  ownerid: string | null;
  requestedtoururl: string;
  requesternote: string | null;
  status: TourStatus;
  rejectionreason?: string | null;
  statusnote: string | null;
  statusupdatedat: string;
  reviewedby: string | null;
  reviewedat: string | null;
  approvedat: string | null;
  createdat: string;
  updatedat: string;
}

export interface TourRequestWithBeach extends TourRequestData {
  beach?: {
    id: string;
    name: string;
    slug: string;
    location: string;
    virtualtoururl: string | null;
    ownerid: string | null;
    cover_image?: string | null;
  } | null;
  owner?: {
    id: string;
    fullname: string;
    email: string | null;
  } | null;
}

export interface TourHistoryItem {
  id: string;
  tourid: string;
  fromstatus: TourStatus | null;
  tostatus: TourStatus;
  note: string | null;
  changedby: string | null;
  changed_by_name?: string | null;
  changed_by_role?: string | null;
  createdat: string;
}

function getAdminSupabase() {
  return createAdminClient() as unknown as SupabaseClient<Database, 'public', 'public', Database['public']>;
}

export async function getTourBeachOwnerId(beachId: string): Promise<string | null> {
  const { data, error } = await getAdminSupabase().from('beaches')
    .select('ownerid')
    .eq('id', beachId)
    .maybeSingle();
  if (error) throw error;
  return data?.ownerid ?? null;
}

export async function getTourRequestForBeach(beachId: string): Promise<TourRequestData | null> {
  const { data, error } = await getAdminSupabase().from('tourrequests')
    .select('*')
    .eq('beachid', beachId)
    .order('createdat', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as TourRequestData | null;
}

export async function getTourHistory(tourId: string): Promise<TourHistoryItem[]> {
  const admin = getAdminSupabase();
  const { data, error } = await admin.from('tourstatushistory')
    .select('*')
    .eq('tourid', tourId)
    .order('createdat', { ascending: false });

  if (error) throw error;
  const history = (data || []) as TourHistoryItem[];
  const userIds = Array.from(new Set(
    history.map((item) => item.changedby).filter((id): id is string => Boolean(id))
  ));
  if (userIds.length === 0) return history;
  const { data: profiles, error: profileError } = await admin.from('profiles')
    .select('id, fullname, role')
    .in('id', userIds);
  if (profileError) throw profileError;
  const profileMap = new Map(
    (profiles || []).map((profile) => [profile.id, { fullname: profile.fullname, role: profile.role }] as const)
  );
  return history.map((item) => ({
    ...item,
    changed_by_name: item.changedby ? profileMap.get(item.changedby)?.fullname || null : null,
    changed_by_role: item.changedby ? profileMap.get(item.changedby)?.role || null : null,
  }));
}

export async function getAllTourRequests(): Promise<TourRequestWithBeach[]> {
  const admin = getAdminSupabase();
  const [requestsResult, beachesResult] = await Promise.all([
    admin.from('tourrequests')
      .select('*')
      .order('statusupdatedat', { ascending: false }),
    admin.from('beaches')
      .select('id, name, slug, location, virtualtoururl, ownerid, coverimageurl')
      .order('name', { ascending: true }),
  ]);
  if (requestsResult.error) throw requestsResult.error;
  if (beachesResult.error) throw beachesResult.error;

  const beaches = new Map(
    (beachesResult.data || []).map((beach) => [beach.id, beach] as const)
  );
  const ownerIds = Array.from(new Set(
    (beachesResult.data || []).map((beach) => beach.ownerid).filter((id): id is string => Boolean(id))
  ));
  const ownerMap = new Map<string, { id: string; fullname: string; email: string | null }>();
  if (ownerIds.length) {
    const { data: profiles, error } = await admin.from('profiles')
      .select('id, fullname, email')
      .in('id', ownerIds);
    if (error) throw error;
    (profiles || []).forEach((profile) => ownerMap.set(profile.id, profile));
  }

  return ((requestsResult.data || []) as TourRequestData[]).map((request) => {
    const beach = beaches.get(request.beachid) || null;
    return {
      ...request,
      beach: beach ? {
        id: beach.id,
        name: beach.name,
        slug: beach.slug,
        location: beach.location,
        virtualtoururl: beach.virtualtoururl,
        ownerid: beach.ownerid,
        cover_image: beach.coverimageurl,
      } : null,
      owner: beach?.ownerid ? ownerMap.get(beach.ownerid) || null : null,
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
    const { data, error } = await admin.from('tourrequests')
      .update({ requestedtoururl: requestedUrl, requesternote: requesterNote, updatedat: now })
      .eq('id', current.id)
      .eq('status', 'in_progress')
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new TourWorkflowError('The tour changed in another session. Refresh and try again.');
    return data as TourRequestData;
  }

  const { data, error } = await admin.from('tourrequests')
    .insert({
      beachid: params.beachId,
      ownerid: params.ownerId,
      requestedtoururl: requestedUrl,
      requesternote: requesterNote,
      status: 'in_progress',
      statusupdatedat: now,
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
    .select('name, ownerid')
    .eq('id', tour.beachid)
    .single();
  if (beachError) throw beachError;

  const recipients = new Map<string, { title: string; message: string; actionUrl: string }>();
  if (beach.ownerid) {
    recipients.set(beach.ownerid, {
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
  const { error } = await admin.from('usernotifications').insert(
    Array.from(recipients, ([userid, notification]) => ({
      userid,
      logindeviceid: null,
      type: 'tour_status',
      title: notification.title,
      message: notification.message,
      actionurl: notification.actionUrl,
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
  const { data: current, error: currentError } = await admin.from('tourrequests')
    .select('*')
    .eq('id', params.requestId)
    .maybeSingle();
  if (currentError) throw currentError;
  if (!current) throw new Error('Tour request not found.');

  const latest = await getTourRequestForBeach(current.beachid);
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
    statusupdatedat: now,
    statusnote: note,
    reviewedby: params.actor === 'admin' ? params.actorId : null,
    reviewedat: params.actor === 'admin' ? now : null,
    approvedat: params.toStatus === 'approved' ? now : null,
    updatedat: now,
  };
  const { data, error } = await admin.from('tourrequests')
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
      .update({ virtualtoururl: tour.requestedtoururl, updatedat: now })
      .eq('id', tour.beachid);
    if (beachError) throw beachError;
  }
  invalidateBeachesCache();
  await createStatusNotifications(tour, params.actor, params.toStatus, note);
  return tour;
}

export async function getTourRequestForAdmin(requestId: string): Promise<TourRequestWithBeach | null> {
  const admin = getAdminSupabase();
  const { data: request, error } = await admin.from('tourrequests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();
  if (error) throw error;
  if (!request) return null;

  const { data: beach, error: beachError } = await admin.from('beaches')
    .select('id, name, slug, location, virtualtoururl, ownerid, coverimageurl')
    .eq('id', request.beachid)
    .maybeSingle();
  if (beachError) throw beachError;
  let owner: TourRequestWithBeach['owner'] = null;
  if (request.ownerid) {
    const { data, error: ownerError } = await admin.from('profiles')
      .select('id, fullname, email')
      .eq('id', request.ownerid)
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
      virtualtoururl: beach.virtualtoururl,
      ownerid: beach.ownerid,
      cover_image: beach.coverimageurl,
    } : null,
    owner,
  } as TourRequestWithBeach;
}

/**
 * Approves a pending tour request: sets beaches.virtualtoururl and updates request status.
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
  if (!currentReq || !currentReq.requestedtoururl) {
    throw new Error('No pending 360 tour request found for this beach.');
  }

  const candidateUrl =
    typeof overrideTourUrl === 'string' && overrideTourUrl.trim()
      ? extractTourEmbedUrl(overrideTourUrl.trim()) || overrideTourUrl.trim()
      : currentReq.requestedtoururl;
  const isRecapturePlaceholder = candidateUrl === 'Recapture Request';

  if (!isRecapturePlaceholder) {
    const { error: beachError } = await (admin.from('beaches') as any)
      .update({
        virtualtoururl: candidateUrl,
        updatedat: now,
      })
      .eq('id', beachId);

    if (beachError) {
      throw beachError;
    }

    invalidateBeachesCache();
  }

  await (admin.from('tourrequests') as any)
    .update({
      status: 'approved',
      reviewedby: reviewerId || null,
      reviewedat: now,
      approvedat: now,
      updatedat: now,
    })
    .eq('beachid', beachId)
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

  await (admin.from('tourrequests') as any)
    .update({
      status: 'in_progress',
      statusnote: rejectionReason,
      reviewedby: reviewerId || null,
      reviewedat: now,
      updatedat: now,
    })
    .eq('beachid', beachId);

  return true;
}

export async function cancelTourRequest(params: { beachId: string }): Promise<boolean> {
  const admin = getAdminSupabase();
  await (admin.from('tourrequests') as any)
    .delete()
    .eq('beachid', params.beachId)
    .eq('status', 'in_progress');
  return true;
}
