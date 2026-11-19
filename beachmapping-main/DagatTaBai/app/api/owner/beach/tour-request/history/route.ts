import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { getTourBeachOwnerId, getTourHistory, getTourRequestForBeach } from '@/lib/services/tourRequests';

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }
    const beachId = new URL(request.url).searchParams.get('beach_id');
    if (!beachId) return NextResponse.json({ error: 'A beach_id is required.' }, { status: 400 });

    if (auth.role !== 'admin') {
      if (await getTourBeachOwnerId(beachId) !== auth.user.id) {
        return NextResponse.json({ error: 'You are not authorized to view this history.' }, { status: 403 });
      }
    }

    const tour = await getTourRequestForBeach(beachId);
    const history = tour ? await getTourHistory(tour.id) : [];
    return NextResponse.json({ history }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('Failed to load tour history:', error);
    return NextResponse.json({ error: 'Failed to load tour history.' }, { status: 500 });
  }
}
