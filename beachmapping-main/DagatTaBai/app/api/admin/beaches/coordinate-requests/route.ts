import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import {
  getAllCoordinateRequests,
  approveCoordinateRequest,
  rejectCoordinateRequest,
} from '@/lib/services/coordinateRequests';

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET() {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }

    const requests = await getAllCoordinateRequests();

    return NextResponse.json(
      {
        success: true,
        requests,
        pendingCount: requests.filter((r) => r.status === 'pending').length,
      },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load coordinate requests.';
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
      const result = await approveCoordinateRequest({
        beachId: beach_id,
        reviewerId: auth.user.id,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Beach coordinates approved and updated on the interactive map!',
          coordinates: {
            latitude: result.latitude,
            longitude: result.longitude,
            location: result.location,
          },
        },
        { headers: noStoreHeaders }
      );
    } else if (action === 'reject') {
      await rejectCoordinateRequest({
        beachId: beach_id,
        rejectionReason: rejection_reason || 'Coordinates could not be verified by Admin.',
        reviewerId: auth.user.id,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Coordinates request rejected.',
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
    const message = error instanceof Error ? error.message : 'Failed to process coordinate request.';
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}
