import { NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { buildVisitorSeries, countVisitorsByDate } from '@/lib/utils/visitorAnalytics';

const noStore = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET() {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStore });
    }

    const { data: beach, error: beachError } = await (auth.adminClient.from('beaches') as any)
      .select('id')
      .eq('owner_id', auth.user.id)
      .maybeSingle();
    if (beachError) throw beachError;

    const series = buildVisitorSeries();
    if (!beach) {
      return NextResponse.json({ beachVisitors: 0, points: series.points }, { headers: noStore });
    }

    const { data: events, error } = await (auth.adminClient.from('visitor_events') as any)
      .select('visit_date')
      .eq('event_type', 'beach_profile_view')
      .eq('beach_id', beach.id)
      .gte('visit_date', series.startDate);
    if (error) throw error;

    const points = countVisitorsByDate(series.points, events);
    return NextResponse.json({
      beachVisitors: points.reduce((total, point) => total + point.visitors, 0),
      points,
    }, { headers: noStore });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load owner analytics.';
    console.error('Owner visitor analytics error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStore });
  }
}
