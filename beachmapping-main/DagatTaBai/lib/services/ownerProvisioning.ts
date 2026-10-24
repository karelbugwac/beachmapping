import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createAdminClient } from '../supabase/server';
import { hashPin } from './pin';

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
export async function provisionBeachOwner(
  email: string,
  name: string,
  applicationId: string
): Promise<ProvisionResult> {
  const adminSupabase = createAdminClient();
  const randomizedPin = generateSecurePin();

  try {
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicationId);
    if (isUuid) {
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

      const { data: application, error: fetchApplicationError } = await (adminSupabase
        .from('owner_applications') as any)
        .select('business_name, beach_name, beach_description, beach_location, latitude, longitude, contact_phone, applicant_email, cover_image_path, profile_image_path, virtual_tour_url')
        .eq('id', applicationId)
        .single();
      if (fetchApplicationError) throw fetchApplicationError;

      const { data: existingBeach, error: existingBeachError } = await (adminSupabase
        .from('beaches') as any)
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();
      if (existingBeachError) throw existingBeachError;

      if (!existingBeach && application) {
        const beachName = application.beach_name || application.business_name || name;
        const baseSlug = beachName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const { error: beachError } = await (adminSupabase.from('beaches') as any).insert({
          owner_id: userId,
          name: beachName,
          slug: `${baseSlug}-${userId.slice(0, 8)}`,
          description: application.beach_description || '',
          location: application.beach_location || 'Catmon, Cebu',
          latitude: Number(application.latitude) || 10.6348,
          longitude: Number(application.longitude) || 124.0275,
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

    // 4. Send Welcome Email with 6-digit PIN via Gmail SMTP (or fallback log)
    await sendOwnerWelcomeEmail({
      recipientEmail: email,
      recipientName: name,
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

/**
 * Dispatches approval notification email containing the randomized 6-digit PIN.
 */
async function sendOwnerWelcomeEmail({
  recipientEmail,
  recipientName,
  pin,
}: {
  recipientEmail: string;
  recipientName: string;
  pin: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const loginUrl = `${siteUrl}/owner/login`;

  // Attempt sending via real Gmail SMTP if configured
  const mailUser = process.env.MAIL_USERNAME;
  const mailPass = process.env.MAIL_PASSWORD;

  if (!mailUser || !mailPass) {
    throw new Error('Email delivery is not configured. Set MAIL_USERNAME and MAIL_PASSWORD before approving an owner.');
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: {
        user: mailUser,
        pass: mailPass,
      },
    });

    await transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME || 'Dagat Ta Bai'}" <${process.env.MAIL_FROM_ADDRESS || mailUser}>`,
        to: recipientEmail,
        subject: 'Your Dagat Ta Bai Owner PIN',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 18px;">Application Approved</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
              Your beach owner application has been approved. Use this PIN to log in:
            </p>

            <div style="background-color: #f1f5f9; border: 2px solid #0284c7; padding: 24px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <div style="font-size: 10px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                Your 6-Digit PIN
              </div>
              <div style="font-size: 40px; font-weight: 900; letter-spacing: 6px; color: #0f172a; font-family: monospace;">
                ${pin}
              </div>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${loginUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">
                Log In to Owner Portal
              </a>
            </div>

            <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
              <a href="${loginUrl}" style="color: #0284c7;">${loginUrl}</a>
            </p>
          </div>
        `,
    });
  } catch (error) {
    console.error('Owner approval email delivery failed.');
    throw new Error('PIN was generated but could not be emailed. Verify the mail settings, then regenerate the PIN.');
  }
}
