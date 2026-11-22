/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { isAdministratorAccount, noStoreHeaders } from '@/lib/server/adminrequest';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders() });
    }
    const { id } = await params;
    const { data: account, error } = await (auth.adminClient.from('profiles') as any)
      .select('id, fullname, email, role, accountstatus, statusreason, statusreasontype, suspendeduntil, statuschangedby, statuschangedat')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!account || isAdministratorAccount(account)) {
      return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403, headers: noStoreHeaders() });
    }

    const [{ data: history, error: historyError }, changedByResult] = await Promise.all([
      (auth.adminClient.from('adminlog') as any)
        .select('id, action, fromstatus, tostatus, reason, reasontype, createdat, adminid')
        .eq('targetuserid', id)
        .order('createdat', { ascending: false })
        .limit(50),
      account.statuschangedby
        ? (auth.adminClient.from('profiles') as any).select('fullname, email').eq('id', account.statuschangedby).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (historyError) throw historyError;
    if (changedByResult.error) throw changedByResult.error;
    return NextResponse.json({
      account,
      changedby: changedByResult.data,
      history: history || [],
    }, { headers: noStoreHeaders() });
  } catch (error: unknown) {
    console.error('Failed to load account details:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: noStoreHeaders() });
  }
}
