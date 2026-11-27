import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { resolveEffectiveAccountStatus } from '@/lib/server/accountstatus';
import { validateAdminMutationRequest } from '@/lib/server/adminrequest';

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const adminClient = auth.adminClient;
    const isSummaryOnly = request.nextUrl.searchParams.get('summary') === 'true';

    if (isSummaryOnly) {
      const { data: authUsersData, error: authUsersError } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (authUsersError) throw authUsersError;
      const total = authUsersData?.users?.length || 0;
      return NextResponse.json(
        { users: [], stats: { total }, currentAdminId: auth.user.id },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    // Fetch auth users, profiles, beaches, and reviews in parallel
    const [
      { data: authUsersData, error: authUsersError },
      { data: profilesData, error: profilesError },
      { data: beachesData, error: beachesError },
      { data: beachReviewsData, error: beachReviewsError },
      { data: platformReviewsData, error: platformReviewsError },
    ] = await Promise.all([
      adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      (adminClient.from('profiles') as any)
        .select('id, fullname, email, role, location, pin, profileimageurl, status, suspensionreason, suspendedat, suspensionendsat, accountstatus, statusreason, statusreasontype, suspendeduntil, statuschangedat, createdat, updatedat'),
      (adminClient.from('beaches') as any)
        .select('id, name, ownerid'),
      (adminClient.from('beachreviews') as any)
        .select('id, beachid, userid, rating, comment, createdat'),
      (adminClient.from('platformreviews') as any)
        .select('id, userid, rating, comment, createdat'),
    ]);

    if (authUsersError) throw authUsersError;
    if (profilesError) throw profilesError;

    const profileMap = new Map<string, any>();
    (profilesData || []).forEach((p: any) => {
      profileMap.set(p.id, p);
    });

    const beachNameMap = new Map<string, string>();
    (beachesData || []).forEach((b: any) => {
      if (b.id && b.name) beachNameMap.set(b.id, b.name);
    });

    const beachesByOwner = new Map<string, Array<{ id: string; name: string }>>();
    (beachesData || []).forEach((b: any) => {
      if (b.ownerid) {
        const list = beachesByOwner.get(b.ownerid) || [];
        list.push({ id: b.id, name: b.name });
        beachesByOwner.set(b.ownerid, list);
      }
    });

    const reviewsByUser = new Map<string, any[]>();
    (beachReviewsData || []).forEach((r: any) => {
      if (r.userid) {
        const list = reviewsByUser.get(r.userid) || [];
        list.push({
          id: r.id,
          beachid: r.beachid,
          beachname: beachNameMap.get(r.beachid) || 'Beach',
          rating: Number(r.rating),
          comment: r.comment,
          createdat: r.createdat,
          review_type: 'beach',
        });
        reviewsByUser.set(r.userid, list);
      }
    });

    (platformReviewsData || []).forEach((r: any) => {
      if (r.userid) {
        const list = reviewsByUser.get(r.userid) || [];
        list.push({
          id: r.id,
          beachid: null,
          beachname: 'Platform feedback',
          rating: Number(r.rating),
          comment: r.comment,
          createdat: r.createdat,
          review_type: 'platform',
        });
        reviewsByUser.set(r.userid, list);
      }
    });

    const users = (authUsersData?.users || []).map((u: any) => {
      const profile = profileMap.get(u.id);
      const metadata = u.user_metadata || {};
      const userReviews = reviewsByUser.get(u.id) || [];
      const effective = resolveEffectiveAccountStatus(profile, u);
      const currentSuspension = effective.accountstatus === 'suspended';

      // Determine precise account status: active, deactivated, suspended
      let status: 'active' | 'deactivated' | 'suspended' = 'active';
      if (metadata.status === 'deactivated') {
        status = 'deactivated';
      } else if (currentSuspension) {
        status = 'suspended';
      } else if (u.banned_until && Date.parse(u.banned_until) > Date.now()) {
        status = 'suspended';
      }

      return {
        id: u.id,
        name: profile?.fullname || metadata.name || metadata.full_name || u.email?.split('@')[0] || 'User',
        email: profile?.email || u.email || 'No email',
        role: profile?.role || metadata.role || 'user',
        status,
        accountstatus: effective.accountstatus,
        statusreason: effective.statusreason,
        statusreasontype: effective.statusreasontype,
        statusupdatedat: effective.statuschangedat,
        statuschangedat: effective.statuschangedat,
        suspendeduntil: effective.suspendeduntil,
        suspensionendsat: effective.suspendeduntil,
        location: profile?.location || null,
        profileimageurl: profile?.profileimageurl || null,
        joined: profile?.createdat || u.created_at,
        last_sign_in_at: u.last_sign_in_at || null,
        has_pin: Boolean(profile?.pin),
        beaches: beachesByOwner.get(u.id) || [],
        reviews_count: userReviews.length,
        recent_reviews: userReviews.slice(0, 5),
      };
    });

    // Compute stats
    const stats = {
      total: users.length,
      active: users.filter((u) => u.status === 'active').length,
      deactivated: users.filter((u) => u.status === 'deactivated').length,
      suspended: users.filter((u) => u.status === 'suspended').length,
      owners: users.filter((u) => u.role === 'beach_owner' || u.role === 'beach_manager').length,
      regular: users.filter((u) => u.role === 'user').length,
      admins: users.filter((u) => u.role === 'admin').length,
    };

    return NextResponse.json(
      { users, stats, currentAdminId: auth.user.id },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load users.';
    console.error('Admin users GET error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const originError = validateAdminMutationRequest(request);
  if (originError) return originError;
  const auth = await authorizeRoles(['admin']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  return NextResponse.json({ error: "You don't have permission to do that." }, { status: 405 });
}

export async function DELETE(request: NextRequest) {
  const originError = validateAdminMutationRequest(request);
  if (originError) return originError;
  const auth = await authorizeRoles(['admin']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  return NextResponse.json({ error: "You don't have permission to do that." }, { status: 405 });
}
