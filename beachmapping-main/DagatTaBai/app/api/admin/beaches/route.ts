import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { authorizeRoles } from '@/lib/supabase/authorization';

export async function GET() {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });
    const { data, error } = await (auth.adminClient.from('beaches') as any)
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return NextResponse.json(data || [], { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load beach listings.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });
    const body = await request.json();
    const {
      id,
      name,
      description,
      status,
      virtual_tour_url,
      latitude,
      longitude,
      location,
      contact_phone,
      contact_email,
      cover_image_url,
      profile_image_url,
      opening_hours,
      entrance_fee,
      cottage_fee,
      rules,
      images,
    } = body;

    if (typeof id !== 'string') {
      return NextResponse.json({ error: 'A beach ID is required.' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = String(name).trim();
    if (description !== undefined) updates.description = String(description).trim();

    if (status !== undefined) {
      if (!['active', 'suspended'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status. Expected "active" or "suspended".' }, { status: 400 });
      }
      updates.status = status;
    }

    if (virtual_tour_url !== undefined) {
      updates.virtual_tour_url = virtual_tour_url ? String(virtual_tour_url).trim() : null;
    }

    if (latitude !== undefined) {
      const parsedLat = parseFloat(String(latitude));
      if (!Number.isFinite(parsedLat)) {
        return NextResponse.json({ error: 'Latitude must be a valid number.' }, { status: 400 });
      }
      updates.latitude = parsedLat;
    }

    if (longitude !== undefined) {
      const parsedLng = parseFloat(String(longitude));
      if (!Number.isFinite(parsedLng)) {
        return NextResponse.json({ error: 'Longitude must be a valid number.' }, { status: 400 });
      }
      updates.longitude = parsedLng;
    }

    if (location !== undefined && typeof location === 'string') {
      updates.location = location.trim();
    }

    if (contact_phone !== undefined) updates.contact_phone = contact_phone ? String(contact_phone).trim() : null;
    if (contact_email !== undefined) updates.contact_email = contact_email ? String(contact_email).trim() : null;
    if (cover_image_url !== undefined) updates.cover_image_url = cover_image_url ? String(cover_image_url).trim() : null;
    if (profile_image_url !== undefined) updates.profile_image_url = profile_image_url ? String(profile_image_url).trim() : null;
    if (opening_hours !== undefined) updates.opening_hours = opening_hours;
    if (entrance_fee !== undefined) updates.entrance_fee = entrance_fee;
    if (cottage_fee !== undefined) updates.cottage_fee = cottage_fee;
    if (rules !== undefined) updates.rules = rules;
    if (images !== undefined) updates.images = images;

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ error: 'No valid fields provided to update.' }, { status: 400 });
    }

    const { data, error } = await (auth.adminClient.from('beaches') as any)
      .update(updates)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Beach listing not found.' }, { status: 404 });
    return NextResponse.json({ success: true, beach: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update beach listing.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });
    const { id } = await request.json();
    if (typeof id !== 'string') {
      return NextResponse.json({ error: 'A beach ID is required.' }, { status: 400 });
    }
    const { error } = await (auth.adminClient.from('beaches') as any).delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Beach listing deleted successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete beach listing.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
