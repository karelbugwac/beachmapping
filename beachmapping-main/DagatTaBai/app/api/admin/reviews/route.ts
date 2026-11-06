import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';

export async function GET() {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const adminClient = auth.adminClient;

    // Fetch reviews, profiles, beaches in parallel safely
    const [
      beachReviewsRes,
      platformReviewsRes,
      reportsRes,
      profilesRes,
      beachesRes,
    ] = await Promise.all([
      (adminClient.from('beach_reviews') as any)
        .select('id, beach_id, user_id, rating, comment, created_at, updated_at')
        .order('created_at', { ascending: false }),
      (adminClient.from('platform_reviews') as any)
        .select('id, user_id, rating, comment, created_at, updated_at')
        .order('created_at', { ascending: false }),
      (adminClient.from('beach_review_reports') as any)
        .select('id, review_id, beach_id, reporter_user_id, reason, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      (adminClient.from('profiles') as any).select('id, full_name'),
      (adminClient.from('beaches') as any).select('id, name'),
    ]);

    const beachReviews = beachReviewsRes?.data || [];
    const platformReviews = platformReviewsRes?.data || [];
    const reports = reportsRes?.data || [];
    const profiles = profilesRes?.data || [];
    const beaches = beachesRes?.data || [];

    const profileMap = new Map<string, string>();
    profiles.forEach((p: any) => {
      if (p.id && p.full_name) profileMap.set(p.id, p.full_name);
    });

    const beachMap = new Map<string, string>();
    beaches.forEach((b: any) => {
      if (b.id && b.name) beachMap.set(b.id, b.name);
    });

    const reviews = beachReviews.map((review: any) => ({
      id: review.id,
      beach_id: review.beach_id,
      user_id: review.user_id,
      user_name: profileMap.get(review.user_id) || 'Verified Visitor',
      beach_name: beachMap.get(review.beach_id) || 'Beach',
      review_type: 'beach',
      rating: Number(review.rating) || 5,
      comment: review.comment || '',
      created_at: review.created_at || new Date().toISOString(),
      updated_at: review.updated_at || review.created_at,
    }));

    platformReviews.forEach((review: any) => {
      reviews.push({
        id: review.id,
        beach_id: null,
        user_id: review.user_id,
        user_name: profileMap.get(review.user_id) || 'Dagat Ta Bai user',
        beach_name: 'Platform feedback',
        review_type: 'platform',
        rating: Number(review.rating) || 5,
        comment: review.comment || '',
        created_at: review.created_at || new Date().toISOString(),
        updated_at: review.updated_at || review.created_at,
      });
    });

    reviews.sort((left: any, right: any) => Date.parse(right.created_at) - Date.parse(left.created_at));

    const formattedReports = reports.map((report: any) => ({
      id: report.id,
      reason: report.reason,
      status: report.status,
      created_at: report.created_at,
      reporter: profileMap.get(report.reporter_user_id) || 'Beach owner',
      beach: beachMap.get(report.beach_id) || 'Beach',
      review: null,
    }));

    return NextResponse.json(
      { reviews, reports: formattedReports },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load reviews.';
    console.error('Admin reviews GET error:', message);
    return NextResponse.json({ error: message, reviews: [], reports: [] }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }
    const reviewId = request.nextUrl.searchParams.get('id');
    if (!reviewId) return NextResponse.json({ error: 'Review ID is required.' }, { status: 400 });

    const reviewType = request.nextUrl.searchParams.get('type') === 'platform' ? 'platform_reviews' : 'beach_reviews';
    const { data, error } = await (auth.adminClient.from(reviewType) as any)
      .delete()
      .eq('id', reviewId)
      .select('id');
    if (error) throw error;
    if (!data?.length) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete review.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
