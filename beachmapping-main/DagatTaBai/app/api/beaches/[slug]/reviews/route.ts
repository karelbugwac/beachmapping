import { NextRequest, NextResponse } from 'next/server';
import { getBeachBySlug } from '@/lib/db/beaches';
import { getReviewsForBeach, createReview } from '@/lib/db/reviews';
import { getCurrentSession } from '@/lib/db/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const beach = await getBeachBySlug(slug);
    if (!beach) {
      return NextResponse.json({ error: 'Beach not found.' }, { status: 404 });
    }

    const reviews = await getReviewsForBeach(beach.id);
    return NextResponse.json(reviews);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve reviews';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to submit a review.' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const beach = await getBeachBySlug(slug);
    if (!beach) {
      return NextResponse.json({ error: 'Beach not found.' }, { status: 404 });
    }

    const body = await request.json();
    const rating = Number(body.rating);
    const comment = String(body.comment || '').trim();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5.' },
        { status: 400 }
      );
    }
    if (!comment || comment.length < 5) {
      return NextResponse.json(
        { error: 'Review comment must be at least 5 characters long.' },
        { status: 400 }
      );
    }

    const newReview = await createReview({
      beachId: beach.id,
      userId: session.id,
      userName: session.full_name,
      beachName: beach.name,
      rating,
      comment,
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save review';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
