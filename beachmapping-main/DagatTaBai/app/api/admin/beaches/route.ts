import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { invalidateBeachesCache } from '@/lib/db/beaches';
import { insertAccountNotification } from '@/lib/server/accountstatus';
import { getTourRequestForBeach, approveTourRequest } from '@/lib/services/tourrequests';
import { getCoordinateRequestForBeach, approveCoordinateRequest } from '@/lib/services/coordinates';

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
      virtualtoururl,
      latitude,
      longitude,
      location,
      contactphone,
      contactemail,
      coverimageurl,
      profileimageurl,
      openinghours,
      entrancefee,
      cottagefee,
      rules,
      images,
      suspensionreason,
      reasontype,
      suspendeduntil,
    } = body;

    if (typeof id !== 'string') {
      return NextResponse.json({ error: 'A beach ID is required.' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updatedat: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = String(name).trim();
    if (description !== undefined) updates.description = String(description).trim();

    if (status !== undefined) {
      if (!['active', 'suspended'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status. Expected "active" or "suspended".' }, { status: 400 });
      }
      updates.status = status;
    }

    if (virtualtoururl !== undefined) {
      updates.virtualtoururl = virtualtoururl ? String(virtualtoururl).trim() : null;
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

    if (contactphone !== undefined) updates.contactphone = contactphone ? String(contactphone).trim() : null;
    if (contactemail !== undefined) updates.contactemail = contactemail ? String(contactemail).trim() : null;
    if (coverimageurl !== undefined) updates.coverimageurl = coverimageurl ? String(coverimageurl).trim() : null;
    if (profileimageurl !== undefined) updates.profileimageurl = profileimageurl ? String(profileimageurl).trim() : null;
    if (openinghours !== undefined) updates.openinghours = openinghours;
    if (entrancefee !== undefined) updates.entrancefee = entrancefee;
    if (cottagefee !== undefined) updates.cottagefee = cottagefee;
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

    // If status was changed (suspended or activated), also suspend/activate the beach owner's account
    if (status !== undefined) {
      let ownerId: string | null = data.ownerid || null;
      if (!ownerId && data.contactemail) {
        const { data: ownerProfile } = await (auth.adminClient.from('profiles') as any)
          .select('id, role')
          .ilike('email', String(data.contactemail).trim())
          .maybeSingle();
        if (ownerProfile?.id && ['beach_owner', 'beach_manager'].includes(ownerProfile.role)) {
          ownerId = ownerProfile.id;
        }
      }
      if (!ownerId && data.name) {
        const { data: appMatch } = await (auth.adminClient.from('ownerapplications') as any)
          .select('applicantuserid, applicantemail')
          .ilike('beachname', String(data.name).trim())
          .maybeSingle();
        if (appMatch?.applicantuserid) {
          ownerId = appMatch.applicantuserid;
        } else if (appMatch?.applicantemail) {
          const { data: ownerProfile } = await (auth.adminClient.from('profiles') as any)
            .select('id, role')
            .ilike('email', String(appMatch.applicantemail).trim())
            .maybeSingle();
          if (ownerProfile?.id && ['beach_owner', 'beach_manager'].includes(ownerProfile.role)) {
            ownerId = ownerProfile.id;
          }
        }
      }

      if (ownerId && ownerId !== auth.user.id) {
        const nowIso = new Date().toISOString();
        const isSuspending = status === 'suspended';
        const cleanReason =
          isSuspending
            ? (typeof suspensionreason === 'string' && suspensionreason.trim()
                ? suspensionreason.trim()
                : `Your beach listing "${data.name}" has been suspended by the administrator.`)
            : null;
        const cleanReasonType =
          isSuspending
            ? (typeof reasontype === 'string' && reasontype.trim()
                ? reasontype.trim()
                : 'Beach listing suspended')
            : null;
        const cleanSuspendedUntil =
          isSuspending && typeof suspendeduntil === 'string' && suspendeduntil.trim()
            ? suspendeduntil.trim()
            : null;

        try {
          await (auth.adminClient.from('profiles') as any)
            .update({
              accountstatus: isSuspending ? 'suspended' : 'active',
              status: isSuspending ? 'suspended' : 'active',
              statusreason: cleanReason,
              suspensionreason: cleanReason,
              statusreasontype: cleanReasonType,
              suspendeduntil: cleanSuspendedUntil,
              suspensionendsat: cleanSuspendedUntil,
              suspendedat: isSuspending ? nowIso : null,
              statuschangedby: auth.user.id,
              statuschangedat: nowIso,
              updatedat: nowIso,
            })
            .eq('id', ownerId);
        } catch {
          // Best-effort if DB trigger blocks profile write
        }

        try {
          const { data: authTargetData } = await auth.adminClient.auth.admin.getUserById(ownerId);
          const existingAppMeta = (authTargetData?.user?.app_metadata || {}) as Record<string, any>;
          await auth.adminClient.auth.admin.updateUserById(ownerId, {
            ban_duration: 'none',
            app_metadata: {
              ...existingAppMeta,
              accountstatus: isSuspending ? 'suspended' : 'active',
              status: isSuspending ? 'suspended' : 'active',
              statusreason: cleanReason,
              statusreasontype: cleanReasonType,
              suspendeduntil: cleanSuspendedUntil,
              statuschangedby: auth.user.id,
              statuschangedat: nowIso,
            },
          });
        } catch (err) {
          console.warn('Could not sync owner auth app_metadata on beach status change:', err);
        }

        try {
          await (auth.adminClient.from('adminlog') as any).insert({
            adminid: auth.user.id,
            targetuserid: ownerId,
            action: 'status_change',
            fromstatus: isSuspending ? 'active' : 'suspended',
            tostatus: isSuspending ? 'suspended' : 'active',
            reason: cleanReason || `Beach "${data.name}" activated`,
            reasontype: cleanReasonType,
          });
        } catch {
          // Non-fatal
        }

        try {
          await insertAccountNotification(auth.adminClient, {
            userid: ownerId,
            type: 'accountstatus',
            title: isSuspending ? 'Beach & account suspended' : 'Beach & account activated',
            message: isSuspending
              ? `Your beach "${data.name}" and owner account have been suspended. Reason: ${cleanReason}`
              : `Your beach "${data.name}" and owner account have been re-activated.`,
            actionurl: '/owner/account',
          });
        } catch {
          // Non-fatal
        }
      }
    }

    // Sync any pending tour or coordinate requests if admin directly updated those fields
    try {
      if (virtualtoururl !== undefined && updates.virtualtoururl) {
        const pendingTour = await getTourRequestForBeach(id);
        if (pendingTour && pendingTour.status === 'review') {
          await approveTourRequest({
            beachId: id,
            reviewerId: auth.user.id,
            overrideTourUrl: updates.virtualtoururl,
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
    revalidatePath('/', 'layout');
    revalidatePath('/map');
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
      .select('id, name, ownerid, contactemail')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!beach) {
      return NextResponse.json({ error: 'Beach listing not found.' }, { status: 404 });
    }

    let ownerId: string | null = beach.ownerid || null;

    // Fallback: look up owner via ownerapplications or profiles if ownerid was not set directly
    if (!ownerId && beach.contactemail) {
      const { data: ownerProfile } = await (adminClient.from('profiles') as any)
        .select('id, role')
        .ilike('email', beach.contactemail.trim())
        .maybeSingle();
      if (
        ownerProfile?.id &&
        (ownerProfile.role === 'beach_owner' || ownerProfile.role === 'beach_manager')
      ) {
        ownerId = ownerProfile.id;
      }
    }

    if (!ownerId && beach.name) {
      const { data: appMatch } = await (adminClient.from('ownerapplications') as any)
        .select('applicantuserid, applicantemail')
        .ilike('beachname', beach.name.trim())
        .maybeSingle();
      if (appMatch?.applicantuserid) {
        ownerId = appMatch.applicantuserid;
      } else if (appMatch?.applicantemail) {
        const { data: ownerProfile } = await (adminClient.from('profiles') as any)
          .select('id, role')
          .ilike('email', appMatch.applicantemail.trim())
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
      'reviewreports',
      'beachreviews',
      'beachactivities',
      'facilities',
      'externallinks',
      'cottages',
      'beachposts',
      'tourrequests',
      'coordinaterequests',
    ] as const;
    await Promise.allSettled(
      childTables.map((table) =>
        (adminClient.from(table) as any).delete().eq('beachid', id)
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
          .update({ ownerid: null })
          .eq('ownerid', ownerId),
        (adminClient.from('ownerapplications') as any)
          .delete()
          .eq('applicantuserid', ownerId),
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
      await (adminClient.from('ownerapplications') as any)
        .delete()
        .ilike('beachname', beach.name.trim());
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
