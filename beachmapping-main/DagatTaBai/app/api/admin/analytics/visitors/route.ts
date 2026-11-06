import { NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { buildVisitorSeries, countVisitorsByDate } from '@/lib/utils/visitorAnalytics';

const noStore = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET() {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStore });
    }

    const adminClient = auth.adminClient;
    const series = buildVisitorSeries();

    let events: any[] = [];
    try {
      const { data, error } = await (adminClient.from('visitor_events') as any)
        .select('visit_date')
        .eq('event_type', 'platform_visit')
        .gte('visit_date', series.startDate);
      if (!error && Array.isArray(data)) {
        events = data;
      }
    } catch {
      // If table does not exist or fails, fall back to empty events safely
      events = [];
    }

    const points = countVisitorsByDate(series.points, events);
    const totalVisitors = points.reduce((total, point) => total + point.visitors, 0);
    return NextResponse.json({ points, totalVisitors }, { headers: noStore });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load visitor analytics.';
    console.error('Admin visitor analytics error:', message);
    return NextResponse.json({ error: message, points: [], totalVisitors: 0 }, { status: 500, headers: noStore });
  }
}
