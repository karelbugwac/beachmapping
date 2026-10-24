import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { authorizeRoles } from '@/lib/supabase/authorization';

export async function GET() {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }
    const userId = auth.user.id;

    const adminSupabase = createAdminClient();
    const { data: beach, error: beachError } = await (adminSupabase.from('beaches') as any)
      .select('id, name, slug, status, average_rating')
      .eq('owner_id', userId)
      .maybeSingle();
    if (beachError) throw beachError;

    if (!beach) {
      return NextResponse.json({
        beach: null,
        totalReviews: 0,
        averageRating: 0,
        recommendationRate: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        reviews: [],
      }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    // 2. Fetch live reviews for this beach
    const { data: dbReviews, error: reviewsError } = await (adminSupabase.from('beach_reviews') as any)
      .select('id, rating, comment, created_at, user_id, profiles:user_id(full_name)')
      .eq('beach_id', beach.id)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Error fetching beach reviews for owner:', reviewsError);
      return NextResponse.json({ error: reviewsError.message }, { status: 500 });
    }

    const reviews = Array.isArray(dbReviews) ? dbReviews : [];
    const totalReviews = reviews.length;

    // 3. Compute live analytics dynamically
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let ratingSum = 0;
    let positiveCount = 0;

    reviews.forEach((r: any) => {
      const score = Math.round(Number(r.rating) || 0);
      if (score >= 1 && score <= 5) {
        dist[score as keyof typeof dist] = (dist[score as keyof typeof dist] || 0) + 1;
      }
      ratingSum += Number(r.rating) || 0;
      if (Number(r.rating) >= 4) {
        positiveCount += 1;
      }
    });

    const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 0;
    const recommendationRate = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0;

    const percentages = {
      5: totalReviews > 0 ? Math.round((dist[5] / totalReviews) * 100) : 0,
      4: totalReviews > 0 ? Math.round((dist[4] / totalReviews) * 100) : 0,
      3: totalReviews > 0 ? Math.round((dist[3] / totalReviews) * 100) : 0,
      2: totalReviews > 0 ? Math.round((dist[2] / totalReviews) * 100) : 0,
      1: totalReviews > 0 ? Math.round((dist[1] / totalReviews) * 100) : 0,
    };

    const formattedReviews = reviews.map((r: any) => ({
      id: r.id,
      rating: Number(r.rating),
      comment: r.comment,
      created_at: r.created_at,
      user_name: (r.profiles as any)?.full_name || 'Verified Tourist',
    }));

    return NextResponse.json({
      beach: {
        id: beach.id,
        name: beach.name,
        slug: beach.slug,
      },
      totalReviews,
      averageRating,
      recommendationRate,
      distribution: dist,
      percentages,
      reviews: formattedReviews,
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (err: any) {
    console.error('Owner reviews API error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch owner review analytics' },
      { status: 500 }
    );
  }
}
