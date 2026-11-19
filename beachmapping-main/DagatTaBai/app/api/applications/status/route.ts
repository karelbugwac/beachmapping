import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';

const noStore = { 'Cache-Control': 'private, no-store, max-age=0' };

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Please sign in to view your application.' }, { status: 401, headers: noStore });
    }

    const applicationId = request.nextUrl.searchParams.get('applicationId');
    const edit = request.nextUrl.searchParams.get('edit') === 'true';
    const pendingOnly = request.nextUrl.searchParams.get('pending') === 'true';
    if (edit && (!applicationId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicationId))) {
      return NextResponse.json({ error: 'This application is not available to continue.' }, { status: 404, headers: noStore });
    }
    const adminClient = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (adminClient.from('owner_applications') as any)
      .select('id, applicant_full_name, applicant_email, business_name, beach_name, beach_location, contact_phone, status, status_note, status_updated_at, rejection_reason, created_at, reviewed_at, liveness_status')
      .eq('applicant_user_id', user.id)
      .order('created_at', { ascending: false });
    if (edit && applicationId) query = query.eq('id', applicationId);
    else if (pendingOnly) query = query.eq('status', 'pending').limit(1);
    else query = query.limit(1);
    const { data: application, error } = await query.maybeSingle();
    if (error) throw error;

    if (edit && (!application || application.status !== 'needs_changes')) {
      return NextResponse.json({ error: 'This application is not available to continue.' }, { status: 404, headers: noStore });
    }

    return NextResponse.json({ application }, { headers: noStore });
  } catch (error) {
    console.error('Failed to load applicant application status:', error);
    return NextResponse.json({ error: 'Could not load your application status.' }, { status: 500, headers: noStore });
  }
}
