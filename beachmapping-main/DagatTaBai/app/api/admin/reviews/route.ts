import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';

async function authorizeAdmin() {
  const sessionClient = await createServerSupabaseClient();
  const { data, error } = await sessionClient.auth.getUser();
  if (error || !data.user) return { response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await (adminClient.from('profiles') as any)
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (profile?.role !== 'admin') return { response: NextResponse.json({ error: 'Administrator access required.' }, { status: 403 }) };

  return { adminClient };
}

export async function GET() {
  try {
    const auth = await authorizeAdmin();
    if (auth.response) return auth.response;

    const [{ data: beachReviews, error: beachError }, { data: platformReviews, error: platformError }, { data: reports, error: reportsError }] = await Promise.all([
      (auth.adminClient!.from('beach_reviews') as any)
      .select('id, beach_id, user_id, rating, comment, created_at, updated_at, profiles:user_id(full_name), beaches:beach_id(name)')
      .order('created_at', { ascending: false }),
      (auth.adminClient!.from('platform_reviews') as any)
        .select('id, user_id, rating, comment, created_at, updated_at, profiles:user_id(full_name)')
        .order('created_at', { ascending: false }),
      (auth.adminClient!.from('beach_review_reports') as any)
        .select('id, review_id, beach_id, reporter_user_id, reason, status, created_at, profiles:reporter_user_id(full_name), beaches:beach_id(name), beach_reviews:review_id(comment, rating)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ]);
    if (beachError) throw beachError;
    if (platformError) throw platformError;
    if (reportsError) throw reportsError;

    const reviews = (beachReviews || []).map((review: any) => ({
      id: review.id,
      beach_id: review.beach_id,
      user_id: review.user_id,
      user_name: review.profiles?.full_name || 'Verified Visitor',
      beach_name: review.beaches?.name || 'Beach',
      review_type: 'beach',
      rating: Number(review.rating),
      comment: review.comment,
      created_at: review.created_at,
      updated_at: review.updated_at,
    }));
    reviews.push(...(platformReviews || []).map((review: any) => ({
      id: review.id,
      beach_id: null,
      user_id: review.user_id,
      user_name: review.profiles?.full_name || 'Dagat Ta Bai user',
      beach_name: 'Platform feedback',
      review_type: 'platform',
      rating: Number(review.rating),
      comment: review.comment,
      created_at: review.created_at,
      updated_at: review.updated_at,
    })));
    reviews.sort((left: any, right: any) => Date.parse(right.created_at) - Date.parse(left.created_at));

    const formattedReports = (reports || []).map((report: any) => ({
      id: report.id,
      reason: report.reason,
      status: report.status,
      created_at: report.created_at,
      reporter: report.profiles?.full_name || 'Beach owner',
      beach: report.beaches?.name || 'Beach',
      review: report.beach_reviews || null,
    }));

    return NextResponse.json({ reviews, reports: formattedReports }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load reviews.';
    console.error('Admin reviews GET error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorizeAdmin();
    if (auth.response) return auth.response;
    const reviewId = request.nextUrl.searchParams.get('id');
    if (!reviewId) return NextResponse.json({ error: 'Review ID is required.' }, { status: 400 });

    const reviewType = request.nextUrl.searchParams.get('type') === 'platform' ? 'platform_reviews' : 'beach_reviews';
    const { data, error } = await (auth.adminClient!.from(reviewType) as any)
      .delete()
      .eq('id', reviewId)
      .select('id');
    if (error) throw error;
    if (!data?.length) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete review.';
    console.error('Admin reviews DELETE error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authorizeAdmin();
    if (auth.response) return auth.response;
    const { id, decision } = await request.json();
    if (typeof id !== 'string' || !['remove', 'dismiss'].includes(decision)) {
      return NextResponse.json({ error: 'A report ID and valid decision are required.' }, { status: 400 });
    }

    const { data: report, error: readError } = await (auth.adminClient!.from('beach_review_reports') as any)
      .select('id, review_id, status')
      .eq('id', id)
      .eq('status', 'pending')
      .maybeSingle();
    if (readError) throw readError;
    if (!report) return NextResponse.json({ error: 'Pending report not found.' }, { status: 404 });

    if (decision === 'remove') {
      const { error: deleteError } = await (auth.adminClient!.from('beach_reviews') as any)
        .delete()
        .eq('id', report.review_id);
      if (deleteError) throw deleteError;
    }

    const { error: updateError } = await (auth.adminClient!.from('beach_review_reports') as any)
      .update({ status: decision === 'remove' ? 'removed' : 'dismissed', reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (updateError) throw updateError;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to review report.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}