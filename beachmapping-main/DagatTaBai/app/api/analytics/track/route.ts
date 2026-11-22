import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// In-memory deduplication cache with periodic auto-flush
const trackedCache = new Set<string>();
let lastCacheReset = Date.now();

function isRecentlyTracked(key: string): boolean {
  if (Date.now() - lastCacheReset > 86_400_000 || trackedCache.size > 10_000) {
    trackedCache.clear();
    lastCacheReset = Date.now();
  }
  return trackedCache.has(key);
}

function markTracked(key: string): void {
  trackedCache.add(key);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
    const path = typeof body?.path === 'string' ? body.path : '';
    if (!SESSION_ID_PATTERN.test(sessionId) || !path.startsWith('/') || path.length > 300) {
      return NextResponse.json({ error: 'Invalid visitor event.' }, { status: 400 });
    }

    if (/^\/(admin|owner|staff|profile|login|register|forgot-password|reset-password)(\/|$)/.test(path)) {
      return NextResponse.json({ tracked: false });
    }

    const today = new Date().toISOString().slice(0, 10);
    const beachMatch = path.match(/^\/beaches\/([^/]+)\/?$/);
    let beachId: string | null = null;
    let pageKey = 'platform';
    let eventType: 'platform_visit' | 'beach_profile_view' = 'platform_visit';

    // Fast memory dedup: if session already visited this path today, return immediately in <1ms
    const dedupKey = `${sessionId}:${path}:${today}`;
    if (isRecentlyTracked(dedupKey)) {
      return NextResponse.json({ tracked: true, deduplicated: true });
    }

    const adminSupabase = createAdminClient();

    if (beachMatch) {
      const identifier = decodeURIComponent(beachMatch[1]);
      try {
        const query = (adminSupabase.from('beaches') as any)
          .select('id')
          .eq('status', 'active');

        const beachQueryPromise = UUID_PATTERN.test(identifier)
          ? query.eq('id', identifier).maybeSingle()
          : query.eq('slug', identifier).maybeSingle();

        const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('Beach lookup timed out')), 2500)
        );

        const { data: beach, error } = await Promise.race([beachQueryPromise, timeoutPromise]);
        if (error || !beach) {
          return NextResponse.json({ tracked: false });
        }

        beachId = beach.id;
        pageKey = `beach:${beach.id}`;
        eventType = 'beach_profile_view';
      } catch (lookupErr) {
        console.warn('[Analytics] Beach lookup fallback:', lookupErr);
        return NextResponse.json({ tracked: false });
      }
    }

    // Upsert with explicit visitdate and strict 3s timeout
    const upsertPromise = (adminSupabase.from('visitorevents') as any).upsert(
      {
        sessionid: sessionId,
        pagekey: pageKey,
        eventtype: eventType,
        beachid: beachId,
        visitdate: today,
      },
      { onConflict: 'sessionid,pagekey,visitdate', ignoreDuplicates: true }
    );

    const upsertTimeoutPromise = new Promise<{ error: Error }>((_, reject) =>
      setTimeout(() => reject(new Error('Visitor tracking DB timeout')), 3000)
    );

    const { error } = await Promise.race([upsertPromise, upsertTimeoutPromise]);
    if (error) {
      const errMsg = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error);
      console.warn('[Analytics] visitorevents upsert notice:', errMsg);
      markTracked(dedupKey);
      // Fail-safe: Always return HTTP 200 for non-critical telemetry to prevent browser console errors
      return NextResponse.json({ tracked: false, status: 'skipped' }, { status: 200 });
    }

    markTracked(dedupKey);
    return NextResponse.json({ tracked: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : typeof error === 'object' ? JSON.stringify(error) : 'Internal error';
    console.warn('[Analytics] Visitor tracking non-fatal error:', message);
    // CRITICAL: Return status 200 so background telemetry never pollutes browser console with 500 errors
    return NextResponse.json({ tracked: false, status: 'error' }, { status: 200 });
  }
}