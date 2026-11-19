/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { isAdministratorAccount, noStoreHeaders } from '@/lib/server/admin-request';

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
      .select('id, full_name, email, role, account_status, status_reason, status_reason_type, suspended_until, status_changed_by, status_changed_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!account || isAdministratorAccount(account)) {
      return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403, headers: noStoreHeaders() });
    }

    const [{ data: history, error: historyError }, changedByResult] = await Promise.all([
      (auth.adminClient.from('admin_audit_log') as any)
        .select('id, action, from_status, to_status, reason, reason_type, created_at, admin_id')
        .eq('target_user_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      account.status_changed_by
        ? (auth.adminClient.from('profiles') as any).select('full_name, email').eq('id', account.status_changed_by).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (historyError) throw historyError;
    if (changedByResult.error) throw changedByResult.error;
    return NextResponse.json({
      account,
      changed_by: changedByResult.data,
      history: history || [],
    }, { headers: noStoreHeaders() });
  } catch (error: unknown) {
    console.error('Failed to load account details:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: noStoreHeaders() });
  }
}
