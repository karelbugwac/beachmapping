import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';

async function getAuthorizedAdmin() {
  const sessionClient = await createServerSupabaseClient();
  const { data: authData, error: authError } = await sessionClient.auth.getUser();
  if (authError || !authData.user) return { response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };

  const adminClient = createAdminClient();
  const { data: profile, error } = await (adminClient.from('profiles') as any)
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (error) throw error;
  if (profile?.role !== 'admin') return { response: NextResponse.json({ error: 'Administrator access required.' }, { status: 403 }) };

  return { adminClient };
}

export async function GET() {
  try {
    const auth = await getAuthorizedAdmin();
    if (auth.response) return auth.response;

    const { data: authData, error: usersError } = await auth.adminClient!.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const users = (authData?.users || []).map((u: any) => ({
      id: u.id,
      name: u.user_metadata?.name || u.email?.split('@')[0],
      email: u.email,
      role: u.user_metadata?.role || 'user',
      status: u.banned_until && Date.parse(u.banned_until) > Date.now() ? 'suspended' : 'active',
      joined: u.created_at,
    }));
    return NextResponse.json({ users }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load users.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthorizedAdmin();
    if (auth.response) return auth.response;
    const { id, suspended } = await request.json();
    if (typeof id !== 'string' || typeof suspended !== 'boolean') {
      return NextResponse.json({ error: 'User ID and suspended status are required.' }, { status: 400 });
    }
    const banned_until = suspended ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null;
    const { data, error } = await auth.adminClient!.auth.admin.updateUserById(id, { ban_duration: suspended ? '365d' : '0s' });
    if (error) throw error;
    return NextResponse.json({ success: true, status: suspended ? 'suspended' : 'active' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update user status.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthorizedAdmin();
    if (auth.response) return auth.response;
    const { id } = await request.json();
    if (typeof id !== 'string') {
      return NextResponse.json({ error: 'A user ID is required.' }, { status: 400 });
    }
    const { error } = await auth.adminClient!.auth.admin.deleteUser(id);
    if (error) throw error;
    return NextResponse.json({ success: true, message: 'User account deleted successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete user account.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}