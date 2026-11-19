import { NextResponse } from 'next/server';
import { getAllBeaches } from '@/lib/db/beaches';

export async function GET() {
  try {
    const beaches = await getAllBeaches();
    const data = beaches.map(({ id, name, location, latitude, longitude }) => ({
      id,
      name,
      location,
      latitude,
      longitude,
    }));

    return NextResponse.json(data || [], {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not load beach locations.';
    console.error('Weather beach locations error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
