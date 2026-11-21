import crypto from 'crypto';
import { createAdminClient } from '../supabase/server';
import { hashPin } from './pin';
import { getValidBeachCoordinates } from '../utils/beach-coordinates';
import { FULL_NAME_MESSAGES, validateFullName } from '../validation/fullName';
import { sendOwnerApplicationStatusEmail } from './ownerApplicationEmails';

export type ProvisionResult =
  | { userId: string; email: string; success: true }
  | { email: string; success: false; error: string; invalidName?: boolean; conflict?: boolean };

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
export async function provisionBeachOwner(
  emailOrApplicationId: string,
  nameOrMetadata?: string | { expectedStatusUpdatedAt?: string; reviewedBy?: string; note?: string | null },
  applicationIdParam?: string,
  reviewMetadataParam?: { expectedStatusUpdatedAt?: string; reviewedBy?: string; note?: string | null }
): Promise<ProvisionResult> {
  const adminSupabase = createAdminClient();
  const randomizedPin = generateSecurePin();

  let email = '';
  let name = '';
  let applicationId = '';
  let reviewMetadata: { expectedStatusUpdatedAt?: string; reviewedBy?: string; note?: string | null } | undefined;

  if (typeof nameOrMetadata === 'string') {
    email = emailOrApplicationId;
    name = nameOrMetadata;
    applicationId = applicationIdParam || '';
    reviewMetadata = reviewMetadataParam;
  } else {
    applicationId = emailOrApplicationId;
    reviewMetadata = nameOrMetadata;
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      applicationId
    );
    if (!isUuid && !email) throw new Error('Owner application not found');

    let application: Record<string, any> | null = null;
    if (isUuid) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchApplicationError } = await (adminSupabase
        .from('owner_applications') as any)
        .select('applicant_full_name, applicant_email, business_name, beach_name, beach_description, beach_location, latitude, longitude, contact_phone, cover_image_path, profile_image_path, virtual_tour_url')
        .eq('id', applicationId)
        .maybeSingle();
      if (fetchApplicationError) {
        throw new Error(fetchApplicationError?.message || 'Owner application not found');
      }
      application = data;
    }

    if (application) {
      if (!email && application.applicant_email) {
        email = application.applicant_email.trim().toLowerCase();
      }
      if (!name && application.applicant_full_name) {
        name = application.applicant_full_name.trim();
      }
    }

    if (!email || !name) {
      throw new Error('Owner application is missing the applicant name or email');
    }

    const nameValidation = validateFullName(name);
    if (!nameValidation.ok) {
      return {
        email,
        success: false,
        error: FULL_NAME_MESSAGES.serverRejected,
        invalidName: true,
      };
    }
    name = nameValidation.value;

    const beachName = (
      application?.beach_name ||
      application?.business_name ||
      name
    ).trim();

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

    // 3. Link application to created user and mark as approved (if valid UUID)
    if (isUuid) {
      const reviewedAt = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let applicationUpdate = (adminSupabase.from('owner_applications') as any)
        .update({
          applicant_user_id: userId,
          status: 'approved',
          ...(reviewMetadata?.note !== undefined ? { status_note: reviewMetadata.note ?? null } : {}),
          status_updated_at: reviewedAt,
          decided_at: reviewedAt,
          reviewed_at: reviewedAt,
          ...(reviewMetadata?.reviewedBy ? { reviewed_by: reviewMetadata.reviewedBy } : {}),
          updated_at: reviewedAt,
        })
        .eq('id', applicationId);
      if (reviewMetadata?.expectedStatusUpdatedAt) {
        applicationUpdate = applicationUpdate
          .eq('status', 'under_review')
          .eq('status_updated_at', reviewMetadata.expectedStatusUpdatedAt);
      }
      const { data: updatedApplication, error: applicationError } = await applicationUpdate
        .select('id')
        .maybeSingle();
      if (applicationError) throw applicationError;
      if (reviewMetadata?.expectedStatusUpdatedAt && !updatedApplication) {
        return {
          email,
          success: false,
          error: 'Someone else already changed this application. Refresh and try again.',
          conflict: true,
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingBeachQuery = (adminSupabase.from('beaches') as any).select('id');
      const { data: existingBeach, error: existingBeachError } = await existingBeachQuery
        .eq('owner_id', userId)
        .maybeSingle();
      if (existingBeachError) throw existingBeachError;

      if (!existingBeach && application) {
        const baseSlug = beachName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const coordinates = getValidBeachCoordinates(application.latitude, application.longitude);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    console.error('Owner provisioning failed:', error);
    return {
      email,
      success: false,
      error: 'Could not complete owner provisioning. Please try again.',
    };
  }
}
