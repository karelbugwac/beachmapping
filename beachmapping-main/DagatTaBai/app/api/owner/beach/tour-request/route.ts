import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import {
  getTourRequestForBeach,
  getTourBeachOwnerId,
  saveTourDraft,
  transitionTourRequest,
} from '@/lib/services/tourrequests';
import { TourWorkflowError } from '@/lib/services/tourtransitions';

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };

async function authorizeBeach(auth: Extract<Awaited<ReturnType<typeof authorizeRoles>>, { authorized: true }>, beachId: string) {
  if (auth.role === 'admin') return true;
  return await getTourBeachOwnerId(beachId) === auth.user.id;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }

    const beachId = new URL(request.url).searchParams.get('beachid');
    if (!beachId) {
      return NextResponse.json({ error: 'A beachid query parameter is required.' }, { status: 400, headers: noStoreHeaders });
    }
    if (!await authorizeBeach(auth, beachId)) {
      return NextResponse.json({ error: 'You are not authorized to view this tour.' }, { status: 403, headers: noStoreHeaders });
    }

    const tour = await getTourRequestForBeach(beachId);
    return NextResponse.json({ success: true, request: tour }, { headers: noStoreHeaders });
  } catch (error) {
    console.error('Failed to load owner tour status:', error);
    return NextResponse.json({ error: 'Failed to load tour status.' }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }

    const body = await request.json();
    const beachId = typeof body.beachid === 'string' ? body.beachid : '';
    const action = body.action || 'submit_for_review';
    if (!beachId || (action !== 'save' && action !== 'submit_for_review')) {
      return NextResponse.json({ error: 'Choose a valid tour action and beach.' }, { status: 400, headers: noStoreHeaders });
    }
    if (!await authorizeBeach(auth, beachId)) {
      return NextResponse.json({ error: 'You are not authorized to update this tour.' }, { status: 403, headers: noStoreHeaders });
    }

    const tourUrl = (typeof body.requestedtoururl === 'string' && body.requestedtoururl.trim())
      ? body.requestedtoururl.trim()
      : (body.is_recapture ? 'Recapture Request' : '');

    if (!tourUrl) {
      return NextResponse.json({ error: 'Add a 360° tour link before submitting for review.' }, { status: 400, headers: noStoreHeaders });
    }

    const combinedNote =
      typeof body.requesternote === 'string' && body.requesternote.trim()
        ? body.requesternote.trim()
        : [body.reason, body.notes]
            .map((part) => (typeof part === 'string' ? part.trim() : ''))
            .filter(Boolean)
            .join(' — ') || null;

    const draft = await saveTourDraft({
      beachId,
      ownerId: auth.user.id,
      requestedUrl: tourUrl,
      requesterNote: combinedNote,
    });

    const tour = action === 'submit_for_review'
      ? await transitionTourRequest({
          requestId: draft.id,
          toStatus: 'review',
          actor: 'owner',
          actorId: auth.user.id,
        })
      : draft;

    return NextResponse.json({ success: true, request: tour }, { headers: noStoreHeaders });
  } catch (error) {
    if (!(error instanceof TourWorkflowError)) console.error('Failed to save owner tour:', error);
    const message = error instanceof TourWorkflowError ? error.message : 'We could not save the tour. Please try again.';
    return NextResponse.json(
      { error: message },
      { status: error instanceof TourWorkflowError ? 400 : 500, headers: noStoreHeaders }
    );
  }
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Tour requests cannot be deleted.' },
    { status: 405, headers: noStoreHeaders }
  );
}
