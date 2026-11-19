import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { getAllTourRequests, getTourRequestForAdmin, transitionTourRequest } from '@/lib/services/tourRequests';
import { TourWorkflowError } from '@/lib/services/tourTransitions';

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET() {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }
    const requests = await getAllTourRequests();
    return NextResponse.json(
      { success: true, requests, reviewCount: requests.filter((tour) => tour.status === 'review').length },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    console.error('Failed to load admin tour requests:', error);
    return NextResponse.json({ error: 'Failed to load tour requests.' }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }

    const body = await request.json();
    const action = body?.action;
    let requestId = typeof body?.request_id === 'string' ? body.request_id : '';
    const note = typeof body?.note === 'string'
      ? body.note.trim()
      : typeof body?.rejection_reason === 'string'
      ? body.rejection_reason.trim()
      : '';

    if (!requestId && typeof body?.beach_id === 'string') {
      const allReqs = await getAllTourRequests();
      const matched = allReqs.find((r) => r.beach_id === body.beach_id);
      if (matched?.id) {
        requestId = matched.id;
      }
    }

    if (!requestId || !['approve', 'request_changes', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Choose a valid tour review action.' }, { status: 400, headers: noStoreHeaders });
    }
    if ((action === 'request_changes' || action === 'reject') && !note) {
      return NextResponse.json({ error: 'Add a note describing the changes requested.' }, { status: 400, headers: noStoreHeaders });
    }

    const currentTour = await getTourRequestForAdmin(requestId);
    if (!currentTour) {
      return NextResponse.json({ error: 'Tour request not found.' }, { status: 404, headers: noStoreHeaders });
    }

    const tour = await transitionTourRequest({
      requestId,
      toStatus: action === 'approve' ? 'approved' : 'in_progress',
      actor: 'admin',
      actorId: auth.user.id,
      note: action !== 'approve' ? note : null,
    });
    revalidatePath('/beaches/[slug]', 'page');
    revalidatePath('/map');
    return NextResponse.json({
      success: true,
      message: action === 'approve' ? '360° Virtual Tour request approved!' : '360° Virtual Tour request rejected / changes requested.',
      tourUrl: tour.requested_tour_url,
      request: { ...tour, beach: currentTour.beach, owner: currentTour.owner }
    }, { headers: noStoreHeaders });
  } catch (error) {
    if (!(error instanceof TourWorkflowError)) console.error('Failed to process admin tour review:', error);
    const message = error instanceof TourWorkflowError ? error.message : 'Failed to process tour review.';
    return NextResponse.json(
      { error: message },
      { status: error instanceof TourWorkflowError ? 400 : 500, headers: noStoreHeaders }
    );
  }
}
