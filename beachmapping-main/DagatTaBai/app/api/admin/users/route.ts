import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { hashPin } from '@/lib/services/pin';

export async function GET() {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const adminClient = auth.adminClient;

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
        .select('id, full_name, email, role, location, pin, profile_image_url, created_at, updated_at'),
      (adminClient.from('beaches') as any)
        .select('id, name, owner_id'),
      (adminClient.from('beach_reviews') as any)
        .select('id, beach_id, user_id, rating, comment, created_at, beaches:beach_id(name)'),
      (adminClient.from('platform_reviews') as any)
        .select('id, user_id, rating, comment, created_at'),
    ]);

    if (authUsersError) throw authUsersError;
    if (profilesError) throw profilesError;

    const profileMap = new Map<string, any>();
    (profilesData || []).forEach((p: any) => {
      profileMap.set(p.id, p);
    });

    const beachesByOwner = new Map<string, Array<{ id: string; name: string }>>();
    (beachesData || []).forEach((b: any) => {
      if (b.owner_id) {
        const list = beachesByOwner.get(b.owner_id) || [];
        list.push({ id: b.id, name: b.name });
        beachesByOwner.set(b.owner_id, list);
      }
    });

    const reviewsByUser = new Map<string, any[]>();
    (beachReviewsData || []).forEach((r: any) => {
      if (r.user_id) {
        const list = reviewsByUser.get(r.user_id) || [];
        list.push({
          id: r.id,
          beach_id: r.beach_id,
          beach_name: r.beaches?.name || 'Beach',
          rating: Number(r.rating),
          comment: r.comment,
          created_at: r.created_at,
          review_type: 'beach',
        });
        reviewsByUser.set(r.user_id, list);
      }
    });

    (platformReviewsData || []).forEach((r: any) => {
      if (r.user_id) {
        const list = reviewsByUser.get(r.user_id) || [];
        list.push({
          id: r.id,
          beach_id: null,
          beach_name: 'Platform feedback',
          rating: Number(r.rating),
          comment: r.comment,
          created_at: r.created_at,
          review_type: 'platform',
        });
        reviewsByUser.set(r.user_id, list);
      }
    });

    const users = (authUsersData?.users || []).map((u: any) => {
      const profile = profileMap.get(u.id);
      const metadata = u.user_metadata || {};
      const userReviews = reviewsByUser.get(u.id) || [];

      // Determine precise account status: active, deactivated, suspended
      let status: 'active' | 'deactivated' | 'suspended' = 'active';
      if (metadata.status === 'deactivated') {
        status = 'deactivated';
      } else if (metadata.status === 'suspended') {
        status = 'suspended';
      } else if (u.banned_until && Date.parse(u.banned_until) > Date.now()) {
        status = metadata.status === 'deactivated' ? 'deactivated' : 'suspended';
      }

      return {
        id: u.id,
        name: profile?.full_name || metadata.name || metadata.full_name || u.email?.split('@')[0] || 'User',
        email: profile?.email || u.email || 'No email',
        role: profile?.role || metadata.role || 'user',
        status,
        status_reason: metadata.status_reason || null,
        status_updated_at: metadata.status_updated_at || null,
        location: profile?.location || null,
        profile_image_url: profile?.profile_image_url || null,
        joined: profile?.created_at || u.created_at,
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
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const adminClient = auth.adminClient;
    const body = await request.json();
    const { id, action } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'A valid User ID is required.' }, { status: 400 });
    }

    // Fetch existing user in Supabase auth to preserve metadata
    const { data: userRecord, error: fetchUserError } = await adminClient.auth.admin.getUserById(id);
    if (fetchUserError || !userRecord?.user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    const existingMeta = userRecord.user.user_metadata || {};

    // 1. EDIT USER INFORMATION
    if (action === 'edit' || (body.name !== undefined && body.email !== undefined && body.role !== undefined)) {
      const { name, email, role, location } = body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'User full name is required.' }, { status: 400 });
      }

      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
      }

      const validRoles = ['user', 'beach_owner', 'beach_manager', 'admin'];
      if (!role || !validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid user role selected.' }, { status: 400 });
      }

      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanLocation = typeof location === 'string' ? location.trim() : null;

      // Update auth user credentials and metadata
      const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(id, {
        email: cleanEmail,
        email_confirm: true,
        user_metadata: {
          ...existingMeta,
          name: cleanName,
          full_name: cleanName,
          role,
        },
      });

      if (updateAuthError) {
        return NextResponse.json({ error: updateAuthError.message }, { status: 400 });
      }

      // Update public.profiles row
      const { error: profileUpdateError } = await (adminClient.from('profiles') as any)
        .update({
          full_name: cleanName,
          email: cleanEmail,
          role,
          location: cleanLocation,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (profileUpdateError) {
        return NextResponse.json({ error: profileUpdateError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'User information updated successfully.',
        user: { id, name: cleanName, email: cleanEmail, role, location: cleanLocation },
      });
    }

    // 2. RESET 6-DIGIT PIN
    if (action === 'reset_pin' || body.pin !== undefined) {
      const pin = body.pin || body.newPin;
      if (typeof pin !== 'string' || !/^\d{6}$/.test(pin)) {
        return NextResponse.json({ error: 'Please enter a valid 6-digit numerical PIN.' }, { status: 400 });
      }

      const { error: profilePinError } = await (adminClient.from('profiles') as any)
        .update({
          pin: hashPin(pin),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (profilePinError) throw profilePinError;

      // Also set auth password so user can sign in with this PIN
      await adminClient.auth.admin.updateUserById(id, { password: pin });

      return NextResponse.json({
        success: true,
        message: 'User PIN has been reset successfully.',
      });
    }

    // 3. ACTIVATE / DEACTIVATE / SUSPEND STATUS CHANGE
    const targetStatus = body.status || (body.suspended === true ? 'suspended' : body.suspended === false ? 'active' : null);

    if (targetStatus && ['active', 'deactivated', 'suspended'].includes(targetStatus)) {
      const reason = typeof body.reason === 'string' ? body.reason.trim() : null;

      let banDuration = '0s';
      let statusReason = null;

      if (targetStatus === 'suspended') {
        banDuration = '87600h'; // 10 years ban
        statusReason = reason || 'Account suspended for policy violation';
      } else if (targetStatus === 'deactivated') {
        banDuration = '87600h'; // Cannot sign in while deactivated
        statusReason = reason || 'Account deactivated by administrator';
      } else {
        banDuration = '0s'; // Unbanned, active
        statusReason = null;
      }

      const { error: statusUpdateError } = await adminClient.auth.admin.updateUserById(id, {
        ban_duration: banDuration,
        user_metadata: {
          ...existingMeta,
          status: targetStatus,
          status_reason: statusReason,
          status_updated_at: new Date().toISOString(),
        },
      });

      if (statusUpdateError) {
        return NextResponse.json({ error: statusUpdateError.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        status: targetStatus,
        status_reason: statusReason,
        message: `Account status updated to ${targetStatus}.`,
      });
    }

    return NextResponse.json({ error: 'Invalid update request action or parameters.' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update user account.';
    console.error('Admin users PATCH error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const adminClient = auth.adminClient;
    const { id } = await request.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'A valid User ID is required.' }, { status: 400 });
    }

    // Prevent administrator self-deletion
    if (auth.user.id === id) {
      return NextResponse.json(
        { error: 'You cannot delete your own active administrator account for safety reasons.' },
        { status: 400 }
      );
    }

    // Municipal Policy: Safeguard beach listings by safely unassigning the owner rather than corrupting beaches
    await (adminClient.from('beaches') as any)
      .update({ owner_id: null })
      .eq('owner_id', id);

    // Delete user from Supabase Auth (this cascades to profiles via foreign key)
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(id);
    if (deleteAuthError) {
      return NextResponse.json({ error: deleteAuthError.message }, { status: 400 });
    }

    // Ensure profiles record is completely removed if not already cascaded
    await (adminClient.from('profiles') as any)
      .delete()
      .eq('id', id);

    return NextResponse.json({
      success: true,
      message: 'User account and profile permanently deleted in accordance with municipal data policy.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete user account.';
    console.error('Admin users DELETE error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}