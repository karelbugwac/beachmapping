import { NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { noStoreHeaders } from '@/lib/server/adminrequest';

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
    const { data, error } = await (auth.adminClient.from('appstatushistory') as any)
      .select('id, fromstatus, tostatus, note, changedby, createdat')
      .eq('applicationid', id)
      .order('createdat', { ascending: true });
    if (error) throw error;
    const changedByIds = [...new Set((data || [])
      .map((item: { changedby: string | null }) => item.changedby)
      .filter((id: string | null): id is string => id !== null))];
    let profileNames = new Map<string, string>();
    if (changedByIds.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profiles, error: profilesError } = await (auth.adminClient.from('profiles') as any)
        .select('id, fullname')
        .in('id', changedByIds);
      if (profilesError) throw profilesError;
      profileNames = new Map((profiles || []).map((profile: { id: string; fullname: string | null }) => [
        profile.id,
        profile.fullname || 'Account holder',
      ]));
    }
    const history = (data || []).map((item: {
      id: string;
      fromstatus: string | null;
      tostatus: string;
      note: string | null;
      changedby: string | null;
      createdat: string;
    }) => ({
      id: item.id,
      fromstatus: item.fromstatus,
      tostatus: item.tostatus,
      note: item.note,
      changed_by_name: item.changedby ? profileNames.get(item.changedby) || 'Account holder' : 'System',
      createdat: item.createdat,
    }));
    return NextResponse.json({ history }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error('Failed to load application history:', error);
    return NextResponse.json({ error: 'Could not load application history.' }, { status: 500, headers: noStoreHeaders() });
  }
}
