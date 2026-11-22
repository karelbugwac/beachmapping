import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const noStore = { 'Cache-Control': 'private, no-store, max-age=0' };

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Please sign in to view your application history.' }, { status: 401, headers: noStore });
    }
    const applicationId = request.nextUrl.searchParams.get('applicationId');
    if (!applicationId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicationId)) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404, headers: noStore });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('appstatushistory') as any)
      .select('id, fromstatus, tostatus, note, createdat')
      .eq('applicationid', applicationId)
      .order('createdat', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ history: data || [] }, { headers: noStore });
  } catch (error) {
    console.error('Failed to load applicant application history:', error);
    return NextResponse.json({ error: 'Could not load your application history.' }, { status: 500, headers: noStore });
  }
}
