import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { invalidateBeachesCache } from '@/lib/db/beaches';
import { getTourRequestForBeach, approveTourRequest } from '@/lib/services/tourRequests';
import { getCoordinateRequestForBeach, approveCoordinateRequest } from '@/lib/services/coordinateRequests';

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
      if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        return NextResponse.json({ error: 'Latitude must be between -90 and 90.' }, { status: 400 });
      }
      updates.latitude = parsedLat;
    }

    if (longitude !== undefined) {
      const parsedLng = parseFloat(String(longitude));
      if (!Number.isFinite(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        return NextResponse.json({ error: 'Longitude must be between -180 and 180.' }, { status: 400 });
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

    // Sync any pending tour or coordinate requests if admin directly updated those fields
    try {
      if (virtual_tour_url !== undefined && updates.virtual_tour_url) {
        const pendingTour = await getTourRequestForBeach(id);
        if (pendingTour && pendingTour.status === 'pending') {
          await approveTourRequest({
            beachId: id,
            reviewerId: auth.user.id,
            overrideTourUrl: updates.virtual_tour_url,
          });
        }
      }
      if (latitude !== undefined && longitude !== undefined) {
        const pendingCoord = await getCoordinateRequestForBeach(id);
        if (pendingCoord && pendingCoord.status === 'pending') {
          await approveCoordinateRequest({
            beachId: id,
            reviewerId: auth.user.id,
          });
          // Re-apply the admin's exact coordinates in case they differed from the request
          await (auth.adminClient.from('beaches') as any)
            .update({
              latitude: updates.latitude,
              longitude: updates.longitude,
              ...(updates.location ? { location: updates.location } : {}),
            })
            .eq('id', id);
        }
      }
    } catch {
      // Non-fatal if request sync fails
    }

    invalidateBeachesCache();
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

    const body = await request.json().catch(() => ({}));
    const id = body?.id || request.nextUrl.searchParams.get('id');
    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'A beach ID is required.' }, { status: 400 });
    }

    const adminClient = auth.adminClient;

    // 1. Fetch beach details to identify associated beach owner
    const { data: beach, error: fetchError } = await (adminClient.from('beaches') as any)
      .select('id, name, owner_id, contact_email')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!beach) {
      return NextResponse.json({ error: 'Beach listing not found.' }, { status: 404 });
    }

    let ownerId: string | null = beach.owner_id || null;

    // Fallback: look up owner via owner_applications or profiles if owner_id was not set directly
    if (!ownerId && beach.contact_email) {
      const { data: ownerProfile } = await (adminClient.from('profiles') as any)
        .select('id, role')
        .ilike('email', beach.contact_email.trim())
        .maybeSingle();
      if (
        ownerProfile?.id &&
        (ownerProfile.role === 'beach_owner' || ownerProfile.role === 'beach_manager')
      ) {
        ownerId = ownerProfile.id;
      }
    }

    if (!ownerId && beach.name) {
      const { data: appMatch } = await (adminClient.from('owner_applications') as any)
        .select('applicant_user_id, applicant_email')
        .ilike('beach_name', beach.name.trim())
        .maybeSingle();
      if (appMatch?.applicant_user_id) {
        ownerId = appMatch.applicant_user_id;
      } else if (appMatch?.applicant_email) {
        const { data: ownerProfile } = await (adminClient.from('profiles') as any)
          .select('id, role')
          .ilike('email', appMatch.applicant_email.trim())
          .maybeSingle();
        if (
          ownerProfile?.id &&
          (ownerProfile.role === 'beach_owner' || ownerProfile.role === 'beach_manager')
        ) {
          ownerId = ownerProfile.id;
        }
      }
    }

    // 2. Clean up child records referencing this beach so foreign keys do not block deletion
    const childTables = [
      'beach_review_reports',
      'beach_reviews',
      'beach_activities',
      'beach_facilities',
      'beach_external_links',
      'beach_cottages',
      'beach_posts',
      'beach_tour_requests',
      'beach_coordinate_requests',
    ];
    await Promise.allSettled(
      childTables.map((table) =>
        (adminClient.from(table) as any).delete().eq('beach_id', id)
      )
    );

    // 3. Delete the beach record itself
    const { error: deleteBeachError } = await (adminClient.from('beaches') as any)
      .delete()
      .eq('id', id);
    if (deleteBeachError) throw deleteBeachError;

    // 4. Delete the associated beach owner account & application (unless it is the current admin)
    let ownerDeleted = false;
    if (ownerId && ownerId !== auth.user.id) {
      // Unlink any other beaches or applications before deleting user
      await Promise.allSettled([
        (adminClient.from('beaches') as any)
          .update({ owner_id: null })
          .eq('owner_id', ownerId),
        (adminClient.from('owner_applications') as any)
          .delete()
          .eq('applicant_user_id', ownerId),
      ]);

      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(ownerId);
      if (!deleteAuthError) {
        ownerDeleted = true;
      }

      await (adminClient.from('profiles') as any)
        .delete()
        .eq('id', ownerId);
    }

    if (beach.name) {
      await (adminClient.from('owner_applications') as any)
        .delete()
        .ilike('beach_name', beach.name.trim());
    }

    invalidateBeachesCache();
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      ownerDeleted,
      message: ownerDeleted
        ? 'Beach listing and beach owner account deleted.'
        : 'Beach listing deleted.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete beach listing.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
