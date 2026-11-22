import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { validateAdminMutationRequest, noStoreHeaders } from '@/lib/server/adminrequest';
import { ADMIN_MESSAGES } from '@/lib/validation/admin-messages';
import { syncBeachAverageRating } from '@/lib/db/reviews';

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
      (adminClient.from('beachreviews') as any)
        .select('id, beachid, userid, rating, comment, createdat, updatedat')
        .order('createdat', { ascending: false }),
      (adminClient.from('platformreviews') as any)
        .select('id, userid, rating, comment, createdat, updatedat')
        .order('createdat', { ascending: false }),
      (adminClient.from('reviewreports') as any)
        .select('id, reviewid, beachid, reporteruserid, reason, status, createdat')
        .eq('status', 'pending')
        .order('createdat', { ascending: false }),
      (adminClient.from('profiles') as any).select('id, fullname'),
      (adminClient.from('beaches') as any).select('id, name'),
    ]);

    const beachReviews = beachReviewsRes?.data || [];
    const platformReviews = platformReviewsRes?.data || [];
    const reports = reportsRes?.data || [];
    const profiles = profilesRes?.data || [];
    const beaches = beachesRes?.data || [];

    const profileMap = new Map<string, string>();
    profiles.forEach((p: any) => {
      if (p.id && p.fullname) profileMap.set(p.id, p.fullname);
    });

    const beachMap = new Map<string, string>();
    beaches.forEach((b: any) => {
      if (b.id && b.name) beachMap.set(b.id, b.name);
    });

    const reviews = beachReviews.map((review: any) => ({
      id: review.id,
      beachid: review.beachid,
      userid: review.userid,
      user_name: profileMap.get(review.userid) || 'Verified Visitor',
      beachname: beachMap.get(review.beachid) || 'Beach',
      review_type: 'beach',
      rating: Number(review.rating) || 5,
      comment: review.comment || '',
      createdat: review.createdat || new Date().toISOString(),
      updatedat: review.updatedat || review.createdat,
    }));

    platformReviews.forEach((review: any) => {
      reviews.push({
        id: review.id,
        beachid: null,
        userid: review.userid,
        user_name: profileMap.get(review.userid) || 'Dagat Ta Bai user',
        beachname: 'Platform feedback',
        review_type: 'platform',
        rating: Number(review.rating) || 5,
        comment: review.comment || '',
        createdat: review.createdat || new Date().toISOString(),
        updatedat: review.updatedat || review.createdat,
      });
    });

    reviews.sort((left: any, right: any) => Date.parse(right.createdat) - Date.parse(left.createdat));

    const reviewById = new Map<string, any>();
    reviews.forEach((r: any) => {
      if (r.id) reviewById.set(r.id, r);
    });

    const formattedReports = reports.map((report: any) => {
      const matchedReview = reviewById.get(report.reviewid);
      return {
        id: report.id,
        reviewid: report.reviewid,
        beachid: report.beachid,
        reason: report.reason,
        status: report.status,
        createdat: report.createdat,
        reporter: profileMap.get(report.reporteruserid) || 'Beach owner',
        beach: beachMap.get(report.beachid) || 'Beach',
        review: matchedReview
          ? {
              id: matchedReview.id,
              rating: matchedReview.rating,
              comment: matchedReview.comment,
              createdat: matchedReview.createdat,
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

    const reviewType = (reviewTypeValue || (request.nextUrl.searchParams.get('type') === 'platform' ? 'platform' : 'beach')) === 'platform'
      ? 'platformreviews'
      : 'beachreviews';
    if (reviewType === 'beachreviews') {
      await (auth.adminClient.from('reviewreports') as any).delete().eq('reviewid', reviewId);
    }
    const { data, error } = await (auth.adminClient.from(reviewType) as any)
      .delete()
      .eq('id', reviewId)
      .select(reviewType === 'beachreviews' ? 'id, beachid' : 'id');
    if (error) throw error;
    if (!data?.length) return NextResponse.json({ error: 'Review not found.' }, { status: 404, headers: noStoreHeaders() });

    if (reviewType === 'beachreviews' && data[0]?.beachid) {
      await syncBeachAverageRating(data[0].beachid);
    }

    return NextResponse.json({ success: true }, { headers: noStoreHeaders() });
  } catch (error: unknown) {
    console.error('Admin review delete error:', error);
    return NextResponse.json({ error: ADMIN_MESSAGES.serverError }, { status: 500, headers: noStoreHeaders() });
  }
}
