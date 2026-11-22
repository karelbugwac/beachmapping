import { NextResponse } from 'next/server';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { hashPin } from '@/lib/services/pin';
import { isAccountStatus, isSuspensionActive } from '@/lib/utils/account-status';
import { persistExpiredSuspension } from '@/lib/server/accountstatus';
import { ADMIN_MESSAGES } from '@/lib/validation/admin-messages';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, pin, portal } = body;

    if (!pin || typeof pin !== 'string' || !/^\d{6}$/.test(pin.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit numeric PIN.' },
        { status: 400 }
      );
    }

    const cleanPin = pin.trim();
    const pinHash = hashPin(cleanPin);
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const adminSupabase = createAdminClient();

    // =========================================================================
    // 1. MUNICIPAL ADMIN LOGIN (/admin/login)
    // =========================================================================
    if (portal === 'admin') {
      // The admin username is fixed in the UI and should align with the stored profile.
      if (normalizedUsername && normalizedUsername !== 'Administrator') {
        return NextResponse.json(
          { error: 'Invalid username. Please use "Administrator".' },
          { status: 401 }
        );
      }

      // Whitelist of allowed admin emails - only these 3 users can access admin portal
      const allowedAdminEmails = process.env.ADMIN_ALLOWED_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [
        'official.dagattabai@gmail.com',
        'admin@dagattabai.ph'
      ];

      const adminEmail = 'official.dagattabai@gmail.com';
      const previousAdminEmail = 'admin@dagattabai.ph';

      const [emailLookup, nameLookup] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adminSupabase.from('profiles') as any)
          .select('id, email, fullname, role, pin')
          .in('email', [adminEmail, previousAdminEmail])
          .in('role', ['admin', 'beach_manager']),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adminSupabase.from('profiles') as any)
          .select('id, email, fullname, role, pin')
          .in('fullname', ['Administrator', 'administrator'])
          .in('role', ['admin', 'beach_manager']),
      ]);

      if (emailLookup.error || nameLookup.error) {
        console.error('Admin lookup error:', emailLookup.error || nameLookup.error);
        throw emailLookup.error || nameLookup.error;
      }

      const matchedProfiles = Array.from(
        new Map(
          [...(emailLookup.data || []), ...(nameLookup.data || [])].map((profile) => [profile.id, profile])
        ).values()
      );
      let adminProfile =
        matchedProfiles.find((profile: { email?: string }) => (profile.email || '').toLowerCase() === adminEmail) ||
        matchedProfiles.find((profile: { role?: string }) => profile.role === 'admin') ||
        matchedProfiles[0] ||
        null;

      // Ensure auth user exists and has correct password
      let authUser = null;
      try {
        const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
        authUser = existingUsers?.users?.find(
          (user) => [adminEmail, previousAdminEmail].includes(user.email?.toLowerCase() || '')
        );
      } catch (e) {
        console.error('Auth list users error:', e);
      }

      if (!adminProfile || !adminProfile.id) {
        const initialAdminPin = process.env.ADMIN_INITIAL_PIN;
        if (!initialAdminPin || !/^\d{6}$/.test(initialAdminPin)) {
          return NextResponse.json(
            { error: 'Admin setup is incomplete. Configure ADMIN_INITIAL_PIN and run the Supabase migration.' },
            { status: 503 }
          );
        }
        if (cleanPin !== initialAdminPin) {
          return NextResponse.json({ error: 'Invalid 6-digit Admin PIN. Access denied.' }, { status: 401 });
        }

        if (authUser) {
          adminProfile = {
            id: authUser.id,
            email: adminEmail,
            fullname: 'Administrator',
            role: 'admin',
            pin: pinHash,
          };
        } else {
          const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
            email: adminEmail,
            password: cleanPin,
            email_confirm: true,
            user_metadata: { name: 'Administrator', role: 'admin' },
          });

          if (authError || !authData?.user) {
            throw new Error(authError?.message || 'Failed to initialize admin account.');
          }

          adminProfile = {
            id: authData.user.id,
            email: adminEmail,
            fullname: 'Administrator',
            role: 'admin',
            pin: pinHash,
          };
        }

        const { error: profileUpsertError } = await (adminSupabase.from('profiles') as any).upsert({
          id: adminProfile.id,
          fullname: 'Administrator',
          email: adminEmail,
          role: 'admin',
          pin: pinHash,
          updatedat: new Date().toISOString(),
        });
        if (profileUpsertError) throw profileUpsertError;
      } else if (authUser) {
        // Update auth user password to match the PIN
        const { error: passwordUpdateError } = await adminSupabase.auth.admin.updateUserById(
          authUser.id,
          { password: cleanPin }
        );
        if (passwordUpdateError) {
          console.error('Failed to update auth user password:', passwordUpdateError);
        }
      }

      const storedPin = adminProfile.pin || '';
      const initialAdminPin = process.env.ADMIN_INITIAL_PIN;
      
      // Allow login if PIN matches stored hash, or if stored PIN is empty and matches initial PIN
      if (storedPin !== pinHash && storedPin !== cleanPin) {
        if (!storedPin && initialAdminPin && cleanPin === initialAdminPin) {
          // Allow login if no PIN is set and the entered PIN matches the initial PIN
        } else {
          return NextResponse.json(
            { error: 'Invalid 6-digit Admin PIN. Access denied.' },
            { status: 401 }
          );
        }
      }

      // Always update the PIN in database to ensure consistency
      const { error: pinUpdateError } = await (adminSupabase.from('profiles') as any)
        .update({ pin: pinHash, updatedat: new Date().toISOString() })
        .eq('id', adminProfile.id);
      if (pinUpdateError) throw pinUpdateError;

      // Always update the password in Supabase auth (and strip any oversized base64 avatar from user_metadata to prevent Set-Cookie header overflow)
      const existingMeta = (authUser?.user_metadata || {}) as Record<string, unknown>;
      const cleanedMeta =
        typeof existingMeta.profileimageurl === 'string' && existingMeta.profileimageurl.startsWith('data:')
          ? { ...existingMeta, profileimageurl: null }
          : undefined;

      const { error: passwordSyncError } = await adminSupabase.auth.admin.updateUserById(
        adminProfile.id,
        {
          email: adminEmail,
          email_confirm: true,
          password: cleanPin,
          ...(cleanedMeta ? { user_metadata: cleanedMeta } : {}),
        }
      );
      if (passwordSyncError) {
        throw new Error(passwordSyncError.message || 'Failed to sync admin sign-in.');
      }

      const { error: adminEmailSyncError } = await (adminSupabase.from('profiles') as any)
        .update({
          email: adminEmail,
          role: 'admin',
          fullname: 'Administrator',
          updatedat: new Date().toISOString(),
        })
        .eq('id', adminProfile.id);
      if (adminEmailSyncError) throw adminEmailSyncError;

      const email = adminEmail;

      // Verify the admin email is in the allowed whitelist
      if (!allowedAdminEmails.includes(email.toLowerCase())) {
        return NextResponse.json(
          { error: 'Access denied. Your email is not authorized for admin access.' },
          { status: 403 }
        );
      }

      // Sign in with Supabase auth to create a session using server client to set cookies
      const supabase = await createServerSupabaseClient();
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: cleanPin,
      });

      if (signInError || !signInData.session) {
        console.error('Supabase sign in error:', signInError);
        return NextResponse.json(
          { error: 'Failed to establish admin session. Please try again.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        email,
        role: 'admin',
        redirect: '/admin/dashboard',
      });
    }

    // =========================================================================
    // 2. BEACH OWNER & RESORT STAFF LOGIN (/owner/login)
    // =========================================================================
    if (portal === 'owner') {
      const ownerEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (!ownerEmail || !/^\S+@\S+\.\S+$/.test(ownerEmail)) {
        return NextResponse.json({ error: 'Enter the email address used in your owner application.' }, { status: 400 });
      }

      const ownerProfileColumnSets = [
        'id, email, fullname, role, pin, accountstatus, statusreason, statusreasontype, suspendeduntil, pinresetrequired, status, suspensionreason, suspendedat, suspensionendsat',
        'id, email, fullname, role, pin, status, suspensionreason, suspendedat, suspensionendsat',
        'id, email, fullname, role, pin',
      ] as const;
      let ownerProfile: {
        id: string;
        email: string | null;
        fullname: string | null;
        role: string;
        pin: string | null;
        accountstatus?: string | null;
        statusreason?: string | null;
        statusreasontype?: string | null;
        suspendeduntil?: string | null;
        pinresetrequired?: boolean;
        status?: string | null;
        suspensionreason?: string | null;
        suspendedat?: string | null;
        suspensionendsat?: string | null;
      } | null = null;
      let ownerLookupError: { code?: string } | null = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profiles = adminSupabase.from('profiles') as any;
      for (const columns of ownerProfileColumnSets) {
        const result = await profiles
          .select(columns)
          .in('role', ['beach_owner', 'beach_manager'])
          .eq('email', ownerEmail)
          .maybeSingle();
        ownerProfile = result.data;
        ownerLookupError = result.error;
        if (!ownerLookupError) break;
        if (ownerLookupError.code !== '42703' && ownerLookupError.code !== 'PGRST204') break;
      }
      if (ownerLookupError) throw ownerLookupError;

      if (!ownerProfile) {
        return NextResponse.json(
          { error: 'Invalid 6-digit PIN. Please check the PIN sent to your email.' },
          { status: 401 }
        );
      }

      const ownerStatus = ownerProfile.accountstatus || ownerProfile.status || 'active';
      const suspendedUntil = ownerProfile.suspendeduntil || ownerProfile.suspensionendsat || null;
      if (ownerStatus === 'suspended' && !isSuspensionActive('suspended', suspendedUntil)) {
        await persistExpiredSuspension(adminSupabase, ownerProfile.id);
        ownerProfile.accountstatus = 'active';
      } else if (isAccountStatus(ownerStatus) && isSuspensionActive(ownerStatus, suspendedUntil)) {
        const sessionClient = await createServerSupabaseClient();
        await sessionClient.auth.signOut();
        return NextResponse.json({
          error: ADMIN_MESSAGES.suspended,
          code: 'ACCOUNT_SUSPENDED',
          reasontype: ownerProfile.statusreasontype || null,
          reason: ownerProfile.statusreason || ownerProfile.suspensionreason || null,
          suspendeduntil: suspendedUntil,
        }, { status: 403 });
      }

      const { data: authUser } = await adminSupabase.auth.admin.getUserById(ownerProfile.id);
      const email = authUser?.user?.email || ownerProfile.email;

      if (!email) {
        return NextResponse.json(
          { error: 'Owner account not found. Please contact support.' },
          { status: 404 }
        );
      }

      if (ownerProfile.pinresetrequired) {
        const sessionClient = await createServerSupabaseClient();
        const { error: passwordError } = await sessionClient.auth.signInWithPassword({
          email,
          password: cleanPin,
        });
        if (passwordError) {
          return NextResponse.json(
            { error: 'Invalid 6-digit PIN. Please check the PIN sent to your email.' },
            { status: 401 }
          );
        }
        return NextResponse.json({
          success: true,
          email,
          role: ownerProfile.role,
          resetPinRequired: true,
          redirect: '/owner/reset-pin',
        });
      }

      if (ownerProfile.pin !== pinHash && ownerProfile.pin !== cleanPin) {
        return NextResponse.json(
          { error: 'Invalid 6-digit PIN. Please check the PIN sent to your email.' },
          { status: 401 }
        );
      }
      if (ownerProfile.pin === cleanPin) {
        const { error: pinUpdateError } = await (adminSupabase.from('profiles') as any)
          .update({ pin: pinHash, updatedat: new Date().toISOString() })
          .eq('id', ownerProfile.id);
        if (pinUpdateError) throw pinUpdateError;
      }

      const ownerMetadata = (authUser?.user?.user_metadata || {}) as Record<string, unknown>;

      return NextResponse.json({
        success: true,
        email,
        role: ownerProfile.role,
        status: 'active',
        suspensionreason: ownerProfile.statusreason || ownerProfile.suspensionreason || ownerMetadata.statusreason || null,
        suspendedat: ownerProfile.suspendedat || ownerMetadata.statusupdatedat || null,
        suspensionendsat: suspendedUntil,
        redirect: '/owner/dashboard',
      });
    }

    return NextResponse.json({ error: 'Invalid portal specified.' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error during PIN verification';
    console.error('PIN login error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
