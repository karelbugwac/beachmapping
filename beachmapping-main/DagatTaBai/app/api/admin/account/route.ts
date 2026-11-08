import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const { data: admins, error } = await (auth.adminClient.from('profiles') as any)
      .select('id, full_name, email, role, created_at, updated_at')
      .in('role', ['admin', 'beach_manager'])
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, admins: admins || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch administrator accounts.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const body = await request.json().catch(() => ({}));
    if (body?.action === 'add-admin') {
      return NextResponse.json(
        { error: 'Adding another administrator is disabled.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process request.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
