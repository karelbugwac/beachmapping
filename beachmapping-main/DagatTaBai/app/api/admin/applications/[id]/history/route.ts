import { NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { noStoreHeaders } from '@/lib/server/admin-request';

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders() });
    }
    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404, headers: noStoreHeaders() });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (auth.adminClient.from('application_status_history') as any)
      .select('id, from_status, to_status, note, changed_by, created_at')
      .eq('application_id', id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    const changedByIds = [...new Set((data || [])
      .map((item: { changed_by: string | null }) => item.changed_by)
      .filter((id: string | null): id is string => id !== null))];
    let profileNames = new Map<string, string>();
    if (changedByIds.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profiles, error: profilesError } = await (auth.adminClient.from('profiles') as any)
        .select('id, full_name')
        .in('id', changedByIds);
      if (profilesError) throw profilesError;
      profileNames = new Map((profiles || []).map((profile: { id: string; full_name: string | null }) => [
        profile.id,
        profile.full_name || 'Account holder',
      ]));
    }
    const history = (data || []).map((item: {
      id: string;
      from_status: string | null;
      to_status: string;
      note: string | null;
      changed_by: string | null;
      created_at: string;
    }) => ({
      id: item.id,
      from_status: item.from_status,
      to_status: item.to_status,
      note: item.note,
      changed_by_name: item.changed_by ? profileNames.get(item.changed_by) || 'Account holder' : 'System',
      created_at: item.created_at,
    }));
    return NextResponse.json({ history }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error('Failed to load application history:', error);
    return NextResponse.json({ error: 'Could not load application history.' }, { status: 500, headers: noStoreHeaders() });
  }
}
