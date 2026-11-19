/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { validateAdminMutationRequest, noStoreHeaders } from '@/lib/server/admin-request';
import { isCurrentStatusVersion, isForbiddenSuspensionTarget, validateSuspensionEndDate } from '@/lib/server/suspension-policy';
import { persistExpiredSuspension } from '@/lib/server/account-status';
import { canTransitionAccountStatus, isSuspensionActive, type AccountStatus } from '@/lib/utils/account-status';
import { validateAdminSearch, validateSafeText } from '@/lib/validation/safe-text';
import { ADMIN_MESSAGES, SUSPENSION_REASON_TYPES } from '@/lib/validation/admin-messages';
import { invalidateBeachesCache } from '@/lib/db/beaches';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

const pageSizes = [10, 20] as const;
const statusValues = ['all', 'active', 'under_review', 'suspended'] as const;
const roleValues = ['users', 'beach_owner'] as const;

interface ProfileRow {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  account_status: AccountStatus;
  status_reason: string | null;
  status_reason_type: string | null;
  suspended_until: string | null;
  status_changed_by: string | null;
  status_changed_at: string | null;
  pin_reset_required: boolean;
  created_at: string;
}

interface AccountListRow {
  id: string;
  name: string;
  email: string;
  role: string;
  account_status: AccountStatus;
  status_reason: string | null;
  status_reason_type: string | null;
  suspended_until: string | null;
  status_changed_by: string | null;
  status_changed_by_name: string | null;
  status_changed_at: string | null;
  pin_reset_required: boolean;
  joined: string;
  beach_names: string[];
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: ADMIN_MESSAGES.notAllowed }, { status: auth.status, headers: noStoreHeaders() });
    }

    const params = request.nextUrl.searchParams;
    const role = params.get('role') || 'users';
    const status = params.get('status') || 'all';
    const pageRaw = params.get('page') || '1';
    const pageSizeRaw = params.get('pageSize') || '10';
    const queryRaw = params.get('q') || '';
    const query = validateAdminSearch(queryRaw);

    if (!roleValues.includes(role as (typeof roleValues)[number])) {
      return NextResponse.json({ error: 'Invalid account role filter.' }, { status: 400, headers: noStoreHeaders() });
    }
    if (!statusValues.includes(status as (typeof statusValues)[number])) {
      return NextResponse.json({ error: 'Invalid account status filter.' }, { status: 400, headers: noStoreHeaders() });
    }
    if (!/^[1-9]\d{0,4}$/.test(pageRaw)) {
      return NextResponse.json({ error: 'Invalid page number.' }, { status: 400, headers: noStoreHeaders() });
    }
    if (!pageSizes.includes(Number(pageSizeRaw) as (typeof pageSizes)[number])) {
      return NextResponse.json({ error: 'Invalid page size.' }, { status: 400, headers: noStoreHeaders() });
    }
    if (!query.ok) {
      return NextResponse.json({ error: query.error }, { status: 400, headers: noStoreHeaders() });
    }

    const admin = auth.adminClient;
    const [{ count: userRoleCount, error: userCountError }, { count: ownerRoleCount, error: ownerCountError }] = await Promise.all([
      (admin.from('profiles') as any).select('id', { count: 'exact', head: true }).neq('role', 'beach_owner'),
      (admin.from('profiles') as any).select('id', { count: 'exact', head: true }).eq('role', 'beach_owner'),
    ]);
    if (userCountError) throw userCountError;
    if (ownerCountError) throw ownerCountError;
    const roleCounts = {
      users: userRoleCount || 0,
      beach_owner: ownerRoleCount || 0,
    };

    const filterRole = (queryBuilder: any) => role === 'beach_owner'
      ? queryBuilder.eq('role', 'beach_owner')
      : queryBuilder.neq('role', 'beach_owner');

    // Normalize expired suspensions before calculating the filtered counts.
    let suspendedQuery = (admin.from('profiles') as any)
      .select('id, suspended_until')
      .eq('account_status', 'suspended');
    suspendedQuery = role === 'beach_owner'
      ? suspendedQuery.eq('role', 'beach_owner')
      : suspendedQuery.in('role', ['user', 'beach_manager']);
    const { data: suspendedProfiles, error: suspendedProfilesError } = await suspendedQuery;
    if (suspendedProfilesError) throw suspendedProfilesError;
    for (const profile of suspendedProfiles || []) {
      if (!isSuspensionActive('suspended', profile.suspended_until)) {
        await persistExpiredSuspension(admin, profile.id);
      }
    }

    let matchingIds: string[] | null = null;
    if (query.value) {
      const pattern = `%${query.value.replace(/[\\%_]/gu, '\\$&')}%`;
      const [{ data: nameMatches, error: nameError }, { data: emailMatches, error: emailError }] = await Promise.all([
        filterRole((admin.from('profiles') as any).select('id')).ilike('full_name', pattern),
        filterRole((admin.from('profiles') as any).select('id')).ilike('email', pattern),
      ]);
      if (nameError) throw nameError;
      if (emailError) throw emailError;
      const ids = new Set<string>();
      for (const profile of [...(nameMatches || []), ...(emailMatches || [])]) ids.add(profile.id);
      if (role === 'beach_owner') {
        const { data: beachMatches, error: beachSearchError } = await (admin.from('beaches') as any)
          .select('owner_id')
          .ilike('name', pattern)
          .not('owner_id', 'is', null);
        if (beachSearchError) throw beachSearchError;
        for (const beach of beachMatches || []) {
          if (beach.owner_id) ids.add(beach.owner_id);
        }
      }
      matchingIds = [...ids];
    }

    const countForStatus = async (countStatus: (typeof statusValues)[number]) => {
      if (matchingIds && matchingIds.length === 0) return 0;
      let countQuery = (admin.from('profiles') as any)
        .select('id', { count: 'exact', head: true });
      countQuery = filterRole(countQuery);
      if (countStatus !== 'all') countQuery = countQuery.eq('account_status', countStatus);
      if (matchingIds) countQuery = countQuery.in('id', matchingIds);
      const { count, error } = await countQuery;
      if (error) throw error;
      return count || 0;
    };
    const [allCount, activeCount, reviewCount, suspendedCount] = await Promise.all([
      countForStatus('all'),
      countForStatus('active'),
      countForStatus('under_review'),
      countForStatus('suspended'),
    ]);
    const counts = {
      all: allCount,
      active: activeCount,
      under_review: reviewCount,
      suspended: suspendedCount,
    };

    if (matchingIds?.length === 0) {
      return NextResponse.json({
        accounts: [],
        counts,
        roleCounts,
        page: Number(pageRaw),
        pageSize: Number(pageSizeRaw),
        total: 0,
        currentAdminId: auth.user.id,
      }, { headers: noStoreHeaders() });
    }

    const pageSize = Number(pageSizeRaw);
    const page = Number(pageRaw);
    const start = (page - 1) * pageSize;
    let profilesQuery = (admin.from('profiles') as any)
      .select('id, full_name, email, role, account_status, status_reason, status_reason_type, suspended_until, status_changed_by, status_changed_at, pin_reset_required, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, start + pageSize - 1);
    profilesQuery = filterRole(profilesQuery);
    if (status !== 'all') profilesQuery = profilesQuery.eq('account_status', status);
    if (matchingIds) profilesQuery = profilesQuery.in('id', matchingIds);
    const { data: profiles, error: profilesError, count: filteredCount } = await profilesQuery;
    if (profilesError) throw profilesError;
    const records = (profiles || []) as ProfileRow[];
    const ids = records.map((profile) => profile.id);
    const changerIds = [...new Set(records.map((profile) => profile.status_changed_by).filter((id): id is string => Boolean(id)))];
    const [{ data: beaches, error: beachError }, { data: changers, error: changersError }] = await Promise.all([
      role === 'beach_owner' && ids.length
        ? (admin.from('beaches') as any).select('owner_id, name').in('owner_id', ids)
        : Promise.resolve({ data: [], error: null }),
      changerIds.length
        ? (admin.from('profiles') as any).select('id, full_name, email').in('id', changerIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (beachError) throw beachError;
    if (changersError) throw changersError;

    const changerById = new Map<string, string>();
    for (const profile of (changers || []) as Array<{ id: string; full_name: string | null; email: string | null }>) {
      changerById.set(profile.id, profile.full_name || profile.email || 'Administrator');
    }
    const beachesByOwner = new Map<string, string[]>();
    for (const beach of beaches || []) {
      if (!beach.owner_id) continue;
      beachesByOwner.set(beach.owner_id, [...(beachesByOwner.get(beach.owner_id) || []), beach.name]);
    }

    const accounts: AccountListRow[] = records.map((profile) => ({
        id: profile.id,
        name: profile.full_name || 'User',
        email: profile.email || '',
        role: profile.role || 'unknown',
        account_status: profile.account_status as AccountStatus,
        status_reason: profile.status_reason,
        status_reason_type: profile.status_reason_type,
        suspended_until: profile.suspended_until,
        status_changed_by: profile.status_changed_by,
        status_changed_by_name: profile.status_changed_by ? changerById.get(profile.status_changed_by) || 'Administrator' : null,
        status_changed_at: profile.status_changed_at,
        pin_reset_required: Boolean(profile.pin_reset_required),
        joined: profile.created_at,
        beach_names: beachesByOwner.get(profile.id) || [],
      }));

    return NextResponse.json({
      accounts,
      counts,
      roleCounts,
      page,
      pageSize,
      total: filteredCount || 0,
      currentAdminId: auth.user.id,
    }, { headers: noStoreHeaders() });
  } catch (error: unknown) {
    console.error('Failed to load admin account list:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: noStoreHeaders() });
  }
}

export async function POST(request: NextRequest) {
  const originError = validateAdminMutationRequest(request);
  if (originError) return originError;

  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: ADMIN_MESSAGES.notAllowed }, { status: auth.status, headers: noStoreHeaders() });
    }

    const body = await request.json();
    const action = body?.action;
    const id = body?.id;
    if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404, headers: noStoreHeaders() });
    }
    const isReasonEdit = action === 'reason_edit';
    if ((!isReasonEdit && action !== 'status_change') || !['active', 'under_review', 'suspended'].includes(body?.to_status)) {
      return NextResponse.json({ error: ADMIN_MESSAGES.notAllowed }, { status: 403, headers: noStoreHeaders() });
    }

    const { data: target, error: targetError } = await (auth.adminClient.from('profiles') as any)
      .select('id, email, role, account_status, status_changed_at, suspended_until')
      .eq('id', id)
      .maybeSingle();
    if (targetError) throw targetError;
    if (!target || isForbiddenSuspensionTarget(target, auth.user.id)) {
      return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403, headers: noStoreHeaders() });
    }
    if (!['user', 'beach_owner', 'beach_manager'].includes(target.role)) {
      return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403, headers: noStoreHeaders() });
    }

    if (target.account_status === 'suspended' && !isSuspensionActive('suspended', target.suspended_until)) {
      await persistExpiredSuspension(auth.adminClient, id);
      return NextResponse.json({ error: ADMIN_MESSAGES.staleChange }, { status: 409, headers: noStoreHeaders() });
    }

    const expected = body?.expected_status_changed_at;
    if (!isCurrentStatusVersion(target.status_changed_at || null, expected)) {
      return NextResponse.json({ error: ADMIN_MESSAGES.staleChange }, { status: 409, headers: noStoreHeaders() });
    }

    const from = target.account_status as AccountStatus;
    const to = body.to_status as AccountStatus;
    if (isReasonEdit && (from !== 'suspended' || to !== 'suspended')) {
      return NextResponse.json({ error: ADMIN_MESSAGES.staleChange }, { status: 409, headers: noStoreHeaders() });
    }
    if (!isReasonEdit && !canTransitionAccountStatus(from, to)) {
      return NextResponse.json({ error: ADMIN_MESSAGES.notAllowed }, { status: 403, headers: noStoreHeaders() });
    }

    const reason = typeof body.reason === 'string' ? body.reason : '';
    const suspending = to === 'suspended';
    const validation = validateSafeText(reason, {
      min: suspending ? 10 : 0,
      max: 500,
      maxLines: 5,
      invalidMessage: suspending ? ADMIN_MESSAGES.suspensionReasonInvalid : undefined,
      tooShortMessage: ADMIN_MESSAGES.reasonTooShort,
      tooLongMessage: ADMIN_MESSAGES.reasonTooLong,
      tooManyLinesMessage: ADMIN_MESSAGES.reasonTooManyLines,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400, headers: noStoreHeaders() });
    }
    if (suspending && !SUSPENSION_REASON_TYPES.includes(body.reason_type)) {
      return NextResponse.json({ error: ADMIN_MESSAGES.reasonTypeRequired }, { status: 400, headers: noStoreHeaders() });
    }
    const reasonText = validation.value || null;

    let suspendedUntil: string | null = null;
    if (to === 'suspended') {
      const dateValidation = validateSuspensionEndDate(body.suspended_until);
      if (!dateValidation.ok) {
        return NextResponse.json({ error: ADMIN_MESSAGES.suspensionDateInvalid }, { status: 400, headers: noStoreHeaders() });
      }
      suspendedUntil = dateValidation.value;
    }

    const statusLimitRpc = auth.adminClient.rpc as unknown as (
      functionName: 'reserve_admin_status_change',
      args: { p_admin_id: string }
    ) => Promise<{ data: number | null; error: unknown | null }>;
    const { data: retryAfter, error: rateLimitError } = await statusLimitRpc('reserve_admin_status_change', {
      p_admin_id: auth.user.id,
    });
    if (rateLimitError) throw rateLimitError;
    if (Number(retryAfter) > 0) {
      return NextResponse.json({ error: ADMIN_MESSAGES.rateLimited }, {
        status: 429,
        headers: { ...noStoreHeaders(), 'Retry-After': String(retryAfter) },
      });
    }

    const now = new Date().toISOString();
    let update = (auth.adminClient.from('profiles') as any)
      .update({
        account_status: to,
        status_reason: to === 'suspended' ? reasonText : to === 'under_review' ? reasonText : null,
        status_reason_type: to === 'suspended' ? body.reason_type : null,
        suspended_until: to === 'suspended' ? suspendedUntil : null,
        status: to === 'suspended' ? 'suspended' : 'active',
        suspension_reason: to === 'suspended' ? reasonText : null,
        suspended_at: to === 'suspended' ? now : null,
        suspension_ends_at: to === 'suspended' ? suspendedUntil : null,
        status_changed_by: auth.user.id,
        status_changed_at: now,
        updated_at: now,
      })
      .eq('id', id)
      .eq('account_status', from);
    update = expected
      ? update.eq('status_changed_at', expected)
      : update.is('status_changed_at', null);
    const { data: changed, error: updateError } = await update.select('id').maybeSingle();
    if (updateError) throw updateError;
    if (!changed) {
      return NextResponse.json({ error: ADMIN_MESSAGES.staleChange }, { status: 409, headers: noStoreHeaders() });
    }

    const { data: adminProfile } = await (auth.adminClient.from('profiles') as any)
      .select('full_name, email')
      .eq('id', auth.user.id)
      .maybeSingle();
    const adminName = adminProfile?.full_name || adminProfile?.email || auth.user.email || 'Administrator';

    const { error: auditError } = await (auth.adminClient.from('admin_audit_log') as any).insert({
      admin_id: auth.user.id,
      target_user_id: id,
      action: isReasonEdit ? 'reason_edit' : 'status_change',
      from_status: from,
      to_status: to,
      reason: reasonText,
      reason_type: to === 'suspended' ? body.reason_type : null,
    });
    if (auditError) throw auditError;

    const owner = target.role === 'beach_owner' || target.role === 'beach_manager';
    if (owner) {
      invalidateBeachesCache();
      revalidatePath('/', 'layout');
      revalidatePath('/map');
    }
    const title = to === 'suspended' ? 'Account suspended' : to === 'under_review' ? 'Account under review' : 'Account reinstated';
    const message = to === 'suspended'
      ? `Your account has been suspended. Reason: ${body.reason_type}: ${reasonText}${suspendedUntil ? ` Until ${new Date(suspendedUntil).toLocaleDateString()}.` : ' Until further notice.'}`
      : to === 'under_review'
        ? 'Your account is under review. You can continue to use your account.'
        : 'Your account has been reinstated and is active again.';
    const { error: notificationError } = await (auth.adminClient.from('user_notifications') as any).insert({
      user_id: id,
      login_device_id: null,
      type: 'account_status',
      title,
      message,
      action_url: owner ? '/owner/account' : '/profile',
    });
    if (notificationError) {
      console.error('Account status notification failed:', notificationError);
      return NextResponse.json({ error: 'The status was changed, but the account holder could not be notified. Refresh before retrying.' }, { status: 500, headers: noStoreHeaders() });
    }

    return NextResponse.json({
      success: true,
      account_status: to,
      status_reason: to === 'suspended' || to === 'under_review' ? reasonText : null,
      status_reason_type: to === 'suspended' ? body.reason_type : null,
      suspended_until: suspendedUntil,
      status_changed_by: auth.user.id,
      status_changed_by_name: adminName,
      status_changed_at: now,
    }, { headers: noStoreHeaders() });
  } catch (error: unknown) {
    console.error('Failed to change account status:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: noStoreHeaders() });
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}
