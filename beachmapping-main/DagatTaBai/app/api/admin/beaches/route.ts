import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { authorizeRoles } from '@/lib/supabase/authorization';

export async function GET() {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });
    const { data, error } = await (auth.adminClient.from('beaches') as any)
      .select('id, name, slug, location, status, average_rating, opening_hours')
      .order('name', { ascending: true });
    if (error) throw error;
    return NextResponse.json(data || [], { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load beach listings.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });
    const { id, status } = await request.json();
    if (typeof id !== 'string' || !['active', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'A beach ID and valid status are required.' }, { status: 400 });
    }
    const { data, error } = await (auth.adminClient.from('beaches') as any)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Beach listing not found.' }, { status: 404 });
    return NextResponse.json({ success: true, beach: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update beach status.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });
    const { id } = await request.json();
    if (typeof id !== 'string') {
      return NextResponse.json({ error: 'A beach ID is required.' }, { status: 400 });
    }
    const { error } = await (auth.adminClient.from('beaches') as any).delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Beach listing deleted successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete beach listing.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}