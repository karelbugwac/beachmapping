import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';

export async function GET() {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const { data: beach, error: beachError } = await (auth.adminClient.from('beaches') as any)
      .select('id')
      .eq('owner_id', auth.user.id)
      .maybeSingle();
    if (beachError) throw beachError;
    if (!beach) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store, max-age=0' } });

    const { data, error } = await (auth.adminClient.from('beach_external_links') as any)
      .select('id, label, url')
      .eq('beach_id', beach.id)
      .order('created_at', { ascending: true });
    if (error) throw error;

    return NextResponse.json(data || [], { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load beach links.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });
    const body = await request.json();
    const label = typeof body.label === 'string' ? body.label.trim() : '';
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    if (!label || label.length > 100 || !url || url.length > 2048) {
      return NextResponse.json({ error: 'Enter a link label and a valid URL.' }, { status: 400 });
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Enter a valid URL.' }, { status: 400 });
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Only HTTP and HTTPS links are allowed.' }, { status: 400 });
    }

    const { data: beach, error: beachError } = await (auth.adminClient.from('beaches') as any)
      .select('id')
      .eq('owner_id', auth.user.id)
      .maybeSingle();
    if (beachError) throw beachError;
    if (!beach) return NextResponse.json({ error: 'Create your beach listing before adding links.' }, { status: 409 });

    const { data, error } = await (auth.adminClient.from('beach_external_links') as any)
      .insert({ beach_id: beach.id, label, url: parsedUrl.toString() })
      .select('id, label, url')
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save beach link.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Link ID is required.' }, { status: 400 });

    const { data: beach, error: beachError } = await (auth.adminClient.from('beaches') as any)
      .select('id')
      .eq('owner_id', auth.user.id)
      .maybeSingle();
    if (beachError) throw beachError;
    if (!beach) return NextResponse.json({ error: 'Owner beach not found.' }, { status: 404 });

    const { data, error } = await (auth.adminClient.from('beach_external_links') as any)
      .delete()
      .eq('id', id)
      .eq('beach_id', beach.id)
      .select('id');
    if (error) throw error;
    if (!data?.length) return NextResponse.json({ error: 'Link not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete beach link.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}