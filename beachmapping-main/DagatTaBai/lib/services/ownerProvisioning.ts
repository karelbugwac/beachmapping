import crypto from 'crypto';
import { createAdminClient } from '../supabase/server';
import { hashPin } from './pin';
import { getValidBeachCoordinates } from '../utils/beach-coordinates';
import { sendOwnerApplicationStatusEmail } from './ownerApplicationEmails';

export interface ProvisionResult {
  userId: string;
  email: string;
  success: boolean;
  error?: string;
}

/**
 * Generates a cryptographically secure, randomized 6-digit numeric PIN.
 * Even administrators do not know this in advance — it is generated automatically upon approval.
 */
export function generateSecurePin(): string {
  // Generates integer from 100000 to 999999 inclusive
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Provisions a new Beach Owner user account upon application approval.
 * 1. Generates a randomized 6-digit PIN.
 * 2. Creates/updates Supabase Auth User with 6-digit PIN as password.
 * 3. Sets profile record with role='beach_owner'.
 * 4. Automatically sends approval email containing the 6-digit PIN to the applicant.
 */
export async function provisionBeachOwner(applicationId: string): Promise<ProvisionResult> {
  const adminSupabase = createAdminClient();
  const randomizedPin = generateSecurePin();
  let email = '';

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      applicationId
    );
    if (!isUuid) throw new Error('Owner application not found');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error: fetchApplicationError } = await (adminSupabase
      .from('owner_applications') as any)
      .select('applicant_full_name, applicant_email, business_name, beach_name, beach_description, beach_location, latitude, longitude, contact_phone, cover_image_path, profile_image_path, virtual_tour_url')
      .eq('id', applicationId)
      .single();
    if (fetchApplicationError || !application) {
      throw new Error(fetchApplicationError?.message || 'Owner application not found');
    }

    email = application.applicant_email.trim().toLowerCase();
    const name = application.applicant_full_name.trim();
    const beachName = application.beach_name.trim() || application.business_name.trim();
    if (!email || !name || !beachName) {
      throw new Error('Owner application is missing the applicant name, email, or beach name');
    }

    let userId: string;

    // 1. Create or update Supabase Auth User with the randomized 6-digit PIN
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password: randomizedPin,
      email_confirm: true,
      user_metadata: { name, role: 'beach_owner' },
    });

    if (authError || !authData?.user) {
      // If user already exists, update their password with the new 6-digit PIN
      const { data: existingUser } = await adminSupabase.auth.admin.listUsers();
      const matched = existingUser?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

      if (matched) {
        userId = matched.id;
        const { error: updateError } = await adminSupabase.auth.admin.updateUserById(userId, {
          password: randomizedPin,
          user_metadata: { name, role: 'beach_owner' },
        });
        if (updateError) throw updateError;
      } else {
        throw new Error(authError?.message || 'Failed to create owner user');
      }
    } else {
      userId = authData.user.id;
    }

    // 2. Insert or update public.profiles with role = 'beach_owner' and pin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (adminSupabase.from('profiles') as any).upsert({
      id: userId,
      full_name: name,
      email: email.toLowerCase(),
      role: 'beach_owner',
      pin: hashPin(randomizedPin),
      updated_at: new Date().toISOString(),
    });
    if (profileError) throw profileError;

    // 3. Link application to created user and mark as approved
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: applicationError } = await (adminSupabase.from('owner_applications') as any)
      .update({
        applicant_user_id: userId,
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);
    if (applicationError) throw applicationError;

    const { data: existingBeach, error: existingBeachError } = await (adminSupabase
      .from('beaches') as any)
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();
    if (existingBeachError) throw existingBeachError;

    if (!existingBeach) {
      const baseSlug = beachName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const coordinates = getValidBeachCoordinates(application.latitude, application.longitude);
      const { error: beachError } = await (adminSupabase.from('beaches') as any).insert({
        owner_id: userId,
        name: beachName,
        slug: `${baseSlug}-${userId.slice(0, 8)}`,
        description: application.beach_description || '',
        location: application.beach_location || 'Catmon, Cebu',
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
        contact_phone: application.contact_phone || null,
        contact_email: application.applicant_email || email,
        cover_image_url: application.cover_image_path || null,
        profile_image_url: application.profile_image_path || null,
        virtual_tour_url: application.virtual_tour_url || null,
        status: 'active',
      });
      if (beachError) throw beachError;
    }

    // 4. Send the approval email with the PIN and application details
    await sendOwnerApplicationStatusEmail({
      status: 'approved',
      recipientEmail: email,
      applicantName: name,
      beachName,
      pin: randomizedPin,
    });

    return {
      userId,
      email,
      success: true,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error during provisioning';
    console.error('Owner provisioning failed:', message);
    return {
      userId: '',
      email,
      success: false,
      error: message,
    };
  }
}
