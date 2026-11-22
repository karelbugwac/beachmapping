import { NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';

export async function POST(request: Request) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });
    const { reviewId, reason } = await request.json();
    const cleanReason = typeof reason === 'string' ? reason.trim() : '';
    if (typeof reviewId !== 'string' || cleanReason.length < 10 || cleanReason.length > 1000) {
      return NextResponse.json({ error: 'Choose a review and provide a report reason of 10 to 1,000 characters.' }, { status: 400 });
    }

    const { data: beach, error: beachError } = await (auth.adminClient.from('beaches') as any)
      .select('id')
      .eq('ownerid', auth.user.id)
      .maybeSingle();
    if (beachError) throw beachError;
    if (!beach) return NextResponse.json({ error: 'No beach listing is linked to this owner account.' }, { status: 404 });

    const { data: review, error: reviewError } = await (auth.adminClient.from('beachreviews') as any)
      .select('id')
      .eq('id', reviewId)
      .eq('beachid', beach.id)
      .maybeSingle();
    if (reviewError) throw reviewError;
    if (!review) return NextResponse.json({ error: 'That review does not belong to your beach.' }, { status: 404 });

    const { error } = await (auth.adminClient.from('reviewreports') as any).insert({
      reviewid: review.id,
      beachid: beach.id,
      reporteruserid: auth.user.id,
      reason: cleanReason,
    });
    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not report this review.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}