import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import {
  getCoordinateRequestForBeach,
  submitCoordinateRequest,
  cancelCoordinateRequest,
} from '@/lib/services/coordinateRequests';

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }

    const { searchParams } = new URL(request.url);
    const beachId = searchParams.get('beach_id');

    if (!beachId) {
      return NextResponse.json(
        { error: 'A beach_id query parameter is required.' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    // Verify ownership if not admin
    if (auth.role !== 'admin') {
      const { data: beach } = await (auth.adminClient.from('beaches') as any)
        .select('id, owner_id')
        .eq('id', beachId)
        .maybeSingle();

      if (!beach || beach.owner_id !== auth.user.id) {
        return NextResponse.json(
          { error: 'You are not authorized to view requests for this beach.' },
          { status: 403, headers: noStoreHeaders }
        );
      }
    }

    const requestData = await getCoordinateRequestForBeach(beachId);

    return NextResponse.json({ success: true, request: requestData }, { headers: noStoreHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch coordinate request.';
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }

    const body = await request.json();
    const { beach_id, requested_latitude, requested_longitude, requested_location, requester_note } = body;

    if (!beach_id || typeof beach_id !== 'string') {
      return NextResponse.json(
        { error: 'beach_id is required.' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    if (requested_latitude === undefined || requested_longitude === undefined) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude coordinates are required.' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    // Verify ownership if not admin
    if (auth.role !== 'admin') {
      const { data: beach } = await (auth.adminClient.from('beaches') as any)
        .select('id, owner_id')
        .eq('id', beach_id)
        .maybeSingle();

      if (!beach || beach.owner_id !== auth.user.id) {
        return NextResponse.json(
          { error: 'You are not authorized to submit requests for this beach.' },
          { status: 403, headers: noStoreHeaders }
        );
      }
    }

    const savedRequest = await submitCoordinateRequest({
      beachId: beach_id,
      ownerId: auth.user.id,
      requestedLatitude: requested_latitude,
      requestedLongitude: requested_longitude,
      requestedLocation: requested_location,
      requesterNote: requester_note,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Coordinates & map location request submitted to Admin for approval.',
        request: savedRequest,
      },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit coordinate request.';
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }

    const { searchParams } = new URL(request.url);
    const beachId = searchParams.get('beach_id');

    if (!beachId) {
      return NextResponse.json(
        { error: 'A beach_id query parameter is required.' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    // Verify ownership if not admin
    if (auth.role !== 'admin') {
      const { data: beach } = await (auth.adminClient.from('beaches') as any)
        .select('id, owner_id')
        .eq('id', beachId)
        .maybeSingle();

      if (!beach || beach.owner_id !== auth.user.id) {
        return NextResponse.json(
          { error: 'You are not authorized to cancel requests for this beach.' },
          { status: 403, headers: noStoreHeaders }
        );
      }
    }

    await cancelCoordinateRequest({ beachId, ownerId: auth.user.id });

    return NextResponse.json(
      { success: true, message: 'Coordinates request cancelled.' },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to cancel coordinate request.';
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}
