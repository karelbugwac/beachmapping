import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
    const path = typeof body.path === 'string' ? body.path : '';
    if (!SESSION_ID_PATTERN.test(sessionId) || !path.startsWith('/') || path.length > 300) {
      return NextResponse.json({ error: 'Invalid visitor event.' }, { status: 400 });
    }

    if (/^\/(admin|owner|staff|profile|login|register|forgot-password|reset-password)(\/|$)/.test(path)) {
      return NextResponse.json({ tracked: false });
    }

    const adminSupabase = createAdminClient();
    const beachMatch = path.match(/^\/beaches\/([^/]+)\/?$/);
    let beachId: string | null = null;
    let pageKey = 'platform';
    let eventType: 'platform_visit' | 'beach_profile_view' = 'platform_visit';

    if (beachMatch) {
      const identifier = decodeURIComponent(beachMatch[1]);
      const query = (adminSupabase.from('beaches') as any)
        .select('id')
        .eq('status', 'active');
      const { data: beach, error } = UUID_PATTERN.test(identifier)
        ? await query.eq('id', identifier).maybeSingle()
        : await query.eq('slug', identifier).maybeSingle();
      if (error) throw error;
      if (!beach) return NextResponse.json({ tracked: false });

      beachId = beach.id;
      pageKey = `beach:${beach.id}`;
      eventType = 'beach_profile_view';
    }

    const { error } = await (adminSupabase.from('visitor_events') as any).upsert(
      {
        session_id: sessionId,
        page_key: pageKey,
        event_type: eventType,
        beach_id: beachId,
      },
      { onConflict: 'session_id,page_key,visit_date', ignoreDuplicates: true }
    );
    if (error) throw error;

    return NextResponse.json({ tracked: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not record visit.';
    console.error('Visitor tracking failed:', message);
    return NextResponse.json({ error: 'Could not record visit.' }, { status: 500 });
  }
}