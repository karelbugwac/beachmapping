import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchStormglassTides } from '@/lib/services/tides';
import type { Beach } from '@/lib/supabase/types';

/**
 * Scheduled Cron Job to fetch and cache tide extremes for active beaches.
 * Runs once daily via Vercel Cron or Supabase pg_cron.
 */
export async function GET(req: NextRequest) {
  try {
    // Optional secret verification for cron security
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const adminClient = createAdminClient();

    // 1. Fetch active beaches
    const { data: beachesData, error: beachError } = await adminClient
      .from('beaches')
      .select('id, name, latitude, longitude')
      .eq('status', 'active');

    if (beachError) {
      throw new Error(beachError.message);
    }

    const beaches = (beachesData as unknown as Beach[]) || [];

    if (beaches.length === 0) {
      return NextResponse.json({ message: 'No active beaches found to refresh.' });
    }

    const results = [];

    // 2. Fetch & Cache tides per beach
    for (const beach of beaches) {
      const tideExtremes = await fetchStormglassTides(
        Number(beach.latitude),
        Number(beach.longitude)
      );

      // Upsert into beach_weather_snapshots
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: upsertError } = await (adminClient.from('beach_weather_snapshots') as any)
        .upsert(
          {
            beach_id: beach.id,
            tide_extremes: tideExtremes,
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'beach_id' }
        );

      results.push({
        beachId: beach.id,
        beachName: beach.name,
        cachedCount: tideExtremes.length,
        status: upsertError ? `Error: ${upsertError.message}` : 'Synced',
      });
    }

    return NextResponse.json({
      message: 'Tide cache refreshed successfully.',
      timestamp: new Date().toISOString(),
      syncedBeaches: results,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Cron execution failed';
    console.error('Cron refresh-tides error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
