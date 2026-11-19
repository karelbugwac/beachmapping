import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { validateAdminMutationRequest, noStoreHeaders } from '@/lib/server/admin-request';
import { ADMIN_MESSAGES } from '@/lib/validation/admin-messages';

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

    const reviewById = new Map<string, any>();
    reviews.forEach((r: any) => {
      if (r.id) reviewById.set(r.id, r);
    });

    const formattedReports = reports.map((report: any) => {
      const matchedReview = reviewById.get(report.review_id);
      return {
        id: report.id,
        review_id: report.review_id,
        beach_id: report.beach_id,
        reason: report.reason,
        status: report.status,
        created_at: report.created_at,
        reporter: profileMap.get(report.reporter_user_id) || 'Beach owner',
        beach: beachMap.get(report.beach_id) || 'Beach',
        review: matchedReview
          ? {
              id: matchedReview.id,
              rating: matchedReview.rating,
              comment: matchedReview.comment,
              created_at: matchedReview.created_at,
              reviewer: matchedReview.user_name,
            }
          : null,
      };
    });

    return NextResponse.json(
      { reviews, reports: formattedReports },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: unknown) {
    console.error('Admin reviews GET error:', error);
    return NextResponse.json({ error: ADMIN_MESSAGES.serverError, reviews: [], reports: [] }, { status: 500, headers: noStoreHeaders() });
  }
}

export async function DELETE(request: NextRequest) {
  const originError = validateAdminMutationRequest(request);
  if (originError) return originError;

  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders() });
    }
    const body = await request.json();
    const reviewId = body?.id;
    const reviewTypeValue = body?.type;
    if (typeof reviewId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reviewId)) {
      return NextResponse.json({ error: 'Review ID is required.' }, { status: 400, headers: noStoreHeaders() });
    }
    if (reviewTypeValue !== 'platform' && reviewTypeValue !== 'beach') {
      return NextResponse.json({ error: 'Choose a valid review type.' }, { status: 400, headers: noStoreHeaders() });
    }

    const reviewType = reviewTypeValue === 'platform' ? 'platform_reviews' : 'beach_reviews';
    const { data, error } = await (auth.adminClient.from(reviewType) as any)
      .delete()
      .eq('id', reviewId)
      .select('id');
    if (error) throw error;
    if (!data?.length) return NextResponse.json({ error: 'Review not found.' }, { status: 404, headers: noStoreHeaders() });

    return NextResponse.json({ success: true }, { headers: noStoreHeaders() });
  } catch (error: unknown) {
    console.error('Admin review delete error:', error);
    return NextResponse.json({ error: ADMIN_MESSAGES.serverError }, { status: 500, headers: noStoreHeaders() });
  }
}
