import { NextResponse } from 'next/server';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { buildVisitorSeries, countVisitorsByDate } from '@/lib/utils/visitorAnalytics';

const noStore = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET() {
  try {
    const sessionClient = await createServerSupabaseClient();
    const { data: authData, error: authError } = await sessionClient.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401, headers: noStore });
    }

    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await (adminClient.from('profiles') as any)
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Administrator access required.' }, { status: 403, headers: noStore });
    }

    const series = buildVisitorSeries();
    const { data: events, error } = await (adminClient.from('visitor_events') as any)
      .select('visit_date')
      .eq('event_type', 'platform_visit')
      .gte('visit_date', series.startDate);
    if (error) throw error;

    const points = countVisitorsByDate(series.points, events);
    const totalVisitors = points.reduce((total, point) => total + point.visitors, 0);
    return NextResponse.json({ points, totalVisitors }, { headers: noStore });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load visitor analytics.';
    console.error('Admin visitor analytics error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStore });
  }
}