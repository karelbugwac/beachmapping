import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import {
  getAllTourRequests,
  approveTourRequest,
  rejectTourRequest,
} from '@/lib/services/tourRequests';

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET() {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }

    const requests = await getAllTourRequests();

    return NextResponse.json(
      {
        success: true,
        requests,
        pendingCount: requests.filter((r) => r.status === 'pending').length,
      },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load tour requests.';
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }

    const body = await request.json();
    const { action, beach_id, rejection_reason } = body;

    if (!beach_id || typeof beach_id !== 'string') {
      return NextResponse.json(
        { error: 'beach_id is required.' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    if (action === 'approve') {
      const result = await approveTourRequest({
        beachId: beach_id,
        reviewerId: auth.user.id,
      });

      return NextResponse.json(
        {
          success: true,
          message: '360° Virtual Tour approved and published to the beach listing!',
          tourUrl: result.tourUrl,
        },
        { headers: noStoreHeaders }
      );
    } else if (action === 'reject') {
      await rejectTourRequest({
        beachId: beach_id,
        rejectionReason: rejection_reason || 'Tour submission did not meet listing guidelines.',
        reviewerId: auth.user.id,
      });

      return NextResponse.json(
        {
          success: true,
          message: '360° Virtual Tour request rejected.',
        },
        { headers: noStoreHeaders }
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Expected "approve" or "reject".' },
        { status: 400, headers: noStoreHeaders }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process tour request.';
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}
