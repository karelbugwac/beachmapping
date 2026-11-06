import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('beaches')
      .select('id, name, location, latitude, longitude')
      .eq('status', 'active');

    if (error) throw new Error(error.message);

    return NextResponse.json(data || [], {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not load beach locations.';
    console.error('Weather beach locations error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
