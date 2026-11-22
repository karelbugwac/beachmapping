import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import {
  getCoordinateRequestForBeach,
  submitCoordinateRequest,
  cancelCoordinateRequest,
} from '@/lib/services/coordinates';

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }

    const { searchParams } = new URL(request.url);
    const beachId = searchParams.get('beachid');

    if (!beachId) {
      return NextResponse.json(
        { error: 'A beachid query parameter is required.' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    // Verify ownership if not admin
    if (auth.role !== 'admin') {
      const { data: beach } = await (auth.adminClient.from('beaches') as any)
        .select('id, ownerid')
        .eq('id', beachId)
        .maybeSingle();

      if (!beach || beach.ownerid !== auth.user.id) {
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
    const { beachid, requestedlatitude, requestedlongitude, requestedlocation, requesternote } = body;

    if (!beachid || typeof beachid !== 'string') {
      return NextResponse.json(
        { error: 'beachid is required.' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    if (requestedlatitude === undefined || requestedlongitude === undefined) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude coordinates are required.' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    // Verify ownership if not admin
    if (auth.role !== 'admin') {
      const { data: beach } = await (auth.adminClient.from('beaches') as any)
        .select('id, ownerid')
        .eq('id', beachid)
        .maybeSingle();

      if (!beach || beach.ownerid !== auth.user.id) {
        return NextResponse.json(
          { error: 'You are not authorized to submit requests for this beach.' },
          { status: 403, headers: noStoreHeaders }
        );
      }
    }

    const savedRequest = await submitCoordinateRequest({
      beachId: beachid,
      ownerId: auth.user.id,
      requestedLatitude: requestedlatitude,
      requestedLongitude: requestedlongitude,
      requestedLocation: requestedlocation,
      requesterNote: requesternote,
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
    const beachId = searchParams.get('beachid');

    if (!beachId) {
      return NextResponse.json(
        { error: 'A beachid query parameter is required.' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    // Verify ownership if not admin
    if (auth.role !== 'admin') {
      const { data: beach } = await (auth.adminClient.from('beaches') as any)
        .select('id, ownerid')
        .eq('id', beachId)
        .maybeSingle();

      if (!beach || beach.ownerid !== auth.user.id) {
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
