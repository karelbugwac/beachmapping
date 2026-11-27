/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { validateAdminMutationRequest, noStoreHeaders } from '@/lib/server/adminrequest';
import { isCurrentStatusVersion, isForbiddenSuspensionTarget, validateSuspensionEndDate } from '@/lib/server/suspension';
import { insertAccountNotification, persistExpiredSuspension } from '@/lib/server/accountstatus';
import { canTransitionAccountStatus, isSuspensionActive, resolveEffectiveAccountStatus, type AccountStatus } from '@/lib/utils/account-status';
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
  fullname: string;
  email: string | null;
  role: string;
  accountstatus: AccountStatus;
  statusreason: string | null;
  statusreasontype: string | null;
  suspendeduntil: string | null;
  statuschangedby: string | null;
  statuschangedat: string | null;
  pinresetrequired: boolean;
  createdat: string;
}

interface AccountListRow {
  id: string;
  name: string;
  email: string;
  role: string;
  accountstatus: AccountStatus;
  statusreason: string | null;
  statusreasontype: string | null;
  suspendeduntil: string | null;
  statuschangedby: string | null;
  status_changed_by_name: string | null;
  statuschangedat: string | null;
  pinresetrequired: boolean;
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
    const [
      { data: allProfiles, error: profilesError },
      { data: authUsersData, error: authUsersError },
      { data: allBeaches, error: beachesError },
    ] = await Promise.all([
      (admin.from('profiles') as any)
        .select('id, fullname, email, role, accountstatus, statusreason, statusreasontype, suspendeduntil, statuschangedby, statuschangedat, pinresetrequired, createdat')
        .order('createdat', { ascending: false }),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      (admin.from('beaches') as any).select('ownerid, name').not('ownerid', 'is', null),
    ]);
    if (profilesError) throw profilesError;
    if (authUsersError) throw authUsersError;
    if (beachesError) throw beachesError;

    const authUserById = new Map<string, any>();
    for (const u of authUsersData?.users || []) {
      authUserById.set(u.id, u);
    }

    const changerById = new Map<string, string>();
    for (const p of (allProfiles || []) as Array<{ id: string; fullname: string | null; email: string | null }>) {
      changerById.set(p.id, p.fullname || p.email || 'Administrator');
    }

    const beachesByOwner = new Map<string, string[]>();
    for (const beach of allBeaches || []) {
      if (!beach.ownerid) continue;
      beachesByOwner.set(beach.ownerid, [...(beachesByOwner.get(beach.ownerid) || []), beach.name]);
    }

    // Merge profiles with effective status from auth.users app_metadata (and normalize expired suspensions)
    const normalizedProfiles: ProfileRow[] = [];
    for (const rawProfile of (allProfiles || []) as ProfileRow[]) {
      const authUser = authUserById.get(rawProfile.id);
      const effective = resolveEffectiveAccountStatus(rawProfile, authUser);
      const wasSuspended = rawProfile.accountstatus === 'suspended' || authUser?.app_metadata?.accountstatus === 'suspended';
      if (wasSuspended && effective.accountstatus === 'active') {
        await persistExpiredSuspension(admin, rawProfile.id).catch(() => {});
      }
      normalizedProfiles.push({
        ...rawProfile,
        accountstatus: effective.accountstatus,
        statusreason: effective.statusreason,
        statusreasontype: effective.statusreasontype,
        suspendeduntil: effective.suspendeduntil,
        statuschangedby: effective.statuschangedby,
        statuschangedat: effective.statuschangedat,
      });
    }

    const roleCounts = {
      users: normalizedProfiles.filter((p) => p.role !== 'beach_owner').length,
      beach_owner: normalizedProfiles.filter((p) => p.role === 'beach_owner').length,
    };

    const roleFiltered = normalizedProfiles.filter((p) =>
      role === 'beach_owner' ? p.role === 'beach_owner' : p.role !== 'beach_owner'
    );

    const searchLower = query.value ? query.value.toLowerCase() : '';
    const searchFiltered = searchLower
      ? roleFiltered.filter((p) => {
          const nameMatch = (p.fullname || '').toLowerCase().includes(searchLower);
          const emailMatch = (p.email || '').toLowerCase().includes(searchLower);
          const beachMatch =
            role === 'beach_owner' &&
            (beachesByOwner.get(p.id) || []).some((b) => b.toLowerCase().includes(searchLower));
          return nameMatch || emailMatch || beachMatch;
        })
      : roleFiltered;

    const counts = {
      all: searchFiltered.length,
      active: searchFiltered.filter((p) => p.accountstatus === 'active').length,
      under_review: searchFiltered.filter((p) => p.accountstatus === 'under_review').length,
      suspended: searchFiltered.filter((p) => p.accountstatus === 'suspended').length,
    };

    const statusFiltered =
      status === 'all' ? searchFiltered : searchFiltered.filter((p) => p.accountstatus === status);

    const pageSize = Number(pageSizeRaw);
    const page = Number(pageRaw);
    const start = (page - 1) * pageSize;
    const pagedRecords = statusFiltered.slice(start, start + pageSize);

    const accounts: AccountListRow[] = pagedRecords.map((profile) => ({
      id: profile.id,
      name: profile.fullname || 'User',
      email: profile.email || '',
      role: profile.role || 'unknown',
      accountstatus: profile.accountstatus,
      statusreason: profile.statusreason,
      statusreasontype: profile.statusreasontype,
      suspendeduntil: profile.suspendeduntil,
      statuschangedby: profile.statuschangedby,
      status_changed_by_name: profile.statuschangedby ? changerById.get(profile.statuschangedby) || 'Administrator' : null,
      statuschangedat: profile.statuschangedat,
      pinresetrequired: Boolean(profile.pinresetrequired),
      joined: profile.createdat,
      beach_names: beachesByOwner.get(profile.id) || [],
    }));

    return NextResponse.json({
      accounts,
      counts,
      roleCounts,
      page,
      pageSize,
      total: statusFiltered.length,
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
    if ((!isReasonEdit && action !== 'status_change') || !['active', 'under_review', 'suspended'].includes(body?.tostatus)) {
      return NextResponse.json({ error: ADMIN_MESSAGES.notAllowed }, { status: 403, headers: noStoreHeaders() });
    }

    const [{ data: target, error: targetError }, { data: authTargetData }] = await Promise.all([
      (auth.adminClient.from('profiles') as any)
        .select('id, email, role, accountstatus, statuschangedat, suspendeduntil, statusreason, statusreasontype, statuschangedby')
        .eq('id', id)
        .maybeSingle(),
      auth.adminClient.auth.admin.getUserById(id),
    ]);
    if (targetError) throw targetError;
    if (!target || isForbiddenSuspensionTarget(target, auth.user.id)) {
      return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403, headers: noStoreHeaders() });
    }
    if (!['user', 'beach_owner', 'beach_manager'].includes(target.role)) {
      return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403, headers: noStoreHeaders() });
    }

    const effectiveTarget = resolveEffectiveAccountStatus(target, authTargetData?.user);
    const wasSuspended = target.accountstatus === 'suspended' || authTargetData?.user?.app_metadata?.accountstatus === 'suspended';
    if (wasSuspended && effectiveTarget.accountstatus === 'active') {
      await persistExpiredSuspension(auth.adminClient, id);
      return NextResponse.json({ error: ADMIN_MESSAGES.staleChange }, { status: 409, headers: noStoreHeaders() });
    }

    const expected = body?.expected_status_changed_at;
    if (!isCurrentStatusVersion(effectiveTarget.statuschangedat || null, expected)) {
      return NextResponse.json({ error: ADMIN_MESSAGES.staleChange }, { status: 409, headers: noStoreHeaders() });
    }

    const from = effectiveTarget.accountstatus;
    const to = body.tostatus as AccountStatus;
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
    if (suspending && !SUSPENSION_REASON_TYPES.includes(body.reasontype)) {
      return NextResponse.json({ error: ADMIN_MESSAGES.reasonTypeRequired }, { status: 400, headers: noStoreHeaders() });
    }
    const reasonText = validation.value || null;

    let suspendedUntil: string | null = null;
    if (to === 'suspended') {
      const dateValidation = validateSuspensionEndDate(body.suspendeduntil);
      if (!dateValidation.ok) {
        return NextResponse.json({ error: ADMIN_MESSAGES.suspensionDateInvalid }, { status: 400, headers: noStoreHeaders() });
      }
      suspendedUntil = dateValidation.value;
    }

    const { data: retryAfter, error: rateLimitError } = await (auth.adminClient as any).rpc('reserve_admin_status_change', {
      p_admin_id: auth.user.id,
    });
    if (rateLimitError) {
      if (rateLimitError.code !== '42P01' && rateLimitError.code !== '42883' && rateLimitError.code !== 'PGRST202') {
        throw rateLimitError;
      }
      console.warn('Admin status change rate limit RPC unavailable, continuing:', rateLimitError.message);
    } else if (Number(retryAfter) > 0) {
      return NextResponse.json({ error: ADMIN_MESSAGES.rateLimited }, {
        status: 429,
        headers: { ...noStoreHeaders(), 'Retry-After': String(retryAfter) },
      });
    }

    const now = new Date().toISOString();
    const nextReason = to === 'suspended' ? reasonText : to === 'under_review' ? reasonText : null;
    const nextReasonType = to === 'suspended' ? body.reasontype : null;
    const nextSuspendedUntil = to === 'suspended' ? suspendedUntil : null;

    let profileUpdated = false;
    try {
      let update = (auth.adminClient.from('profiles') as any)
        .update({
          accountstatus: to,
          statusreason: nextReason,
          statusreasontype: nextReasonType,
          suspendeduntil: nextSuspendedUntil,
          status: to === 'suspended' ? 'suspended' : 'active',
          suspensionreason: to === 'suspended' ? reasonText : null,
          suspendedat: to === 'suspended' ? now : null,
          suspensionendsat: nextSuspendedUntil,
          statuschangedby: auth.user.id,
          statuschangedat: now,
          updatedat: now,
        })
        .eq('id', id);
      const { data: changed, error: updateError } = await update.select('id').maybeSingle();
      if (updateError) {
        if (updateError.code !== '42883') throw updateError;
        console.warn('Profiles table update blocked by missing DB function, syncing via auth.users app_metadata:', updateError.message);
      } else if (changed) {
        profileUpdated = true;
      }
    } catch (profErr: any) {
      if (profErr?.code !== '42883') throw profErr;
    }

    // Always sync status to auth.users app_metadata so status persists even when public.is_admin() trigger function is missing
    const existingAppMeta = (authTargetData?.user?.app_metadata || {}) as Record<string, any>;
    const { error: authUpdateError } = await auth.adminClient.auth.admin.updateUserById(id, {
      ban_duration: 'none',
      app_metadata: {
        ...existingAppMeta,
        accountstatus: to,
        status: to === 'suspended' ? 'suspended' : 'active',
        statusreason: nextReason,
        statusreasontype: nextReasonType,
        suspendeduntil: nextSuspendedUntil,
        statuschangedby: auth.user.id,
        statuschangedat: now,
      },
    });
    if (authUpdateError && !profileUpdated) {
      throw authUpdateError;
    }

    const { data: adminProfile } = await (auth.adminClient.from('profiles') as any)
      .select('fullname, email')
      .eq('id', auth.user.id)
      .maybeSingle();
    const adminName = adminProfile?.fullname || adminProfile?.email || auth.user.email || 'Administrator';

    const { error: auditError } = await (auth.adminClient.from('adminlog') as any).insert({
      adminid: auth.user.id,
      targetuserid: id,
      action: isReasonEdit ? 'reason_edit' : 'status_change',
      fromstatus: from,
      tostatus: to,
      reason: reasonText,
      reasontype: nextReasonType,
    });
    if (auditError) {
      console.warn('Could not write to adminlog:', auditError);
    }

    const owner = target.role === 'beach_owner' || target.role === 'beach_manager';
    if (owner) {
      invalidateBeachesCache();
      revalidatePath('/', 'layout');
      revalidatePath('/map');
    }
    const title = to === 'suspended' ? 'Account disabled' : to === 'under_review' ? 'Account under review' : 'Account enabled';
    const message = to === 'suspended'
      ? `Your account has been disabled. Reason: ${body.reasontype}: ${reasonText}${suspendedUntil ? ` Until ${new Date(suspendedUntil).toLocaleDateString()}.` : ' Until further notice.'}`
      : to === 'under_review'
        ? 'Your account is under review. You can continue to use your account.'
        : 'Your account has been re-enabled and is active again.';
    const { error: notificationError } = await insertAccountNotification(auth.adminClient, {
      userid: id,
      type: 'accountstatus',
      title,
      message,
      actionurl: owner ? '/owner/account' : '/profile',
    });
    if (notificationError) {
      console.warn('Account status notification warning:', notificationError);
    }

    return NextResponse.json({
      success: true,
      accountstatus: to,
      statusreason: to === 'suspended' || to === 'under_review' ? reasonText : null,
      statusreasontype: to === 'suspended' ? body.reasontype : null,
      suspendeduntil: suspendedUntil,
      statuschangedby: auth.user.id,
      status_changed_by_name: adminName,
      statuschangedat: now,
    }, { headers: noStoreHeaders() });
  } catch (error: unknown) {
    console.error('Failed to change account status:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: noStoreHeaders() });
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}
