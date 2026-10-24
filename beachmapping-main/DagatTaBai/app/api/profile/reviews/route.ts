import { NextRequest, NextResponse } from 'next/server';
import { getReviewsByUserId, deleteReview } from '@/lib/db/reviews';
import { getCurrentSession } from '@/lib/db/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = request.nextUrl.searchParams.get('userId') || session?.id;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const reviews = await getReviewsByUserId(userId);
    return NextResponse.json(reviews);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch reviews';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
    }

    const success = await deleteReview(id, session.id);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
