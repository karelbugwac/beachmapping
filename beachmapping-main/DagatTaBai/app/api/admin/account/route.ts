import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const { data: admins, error } = await (auth.adminClient.from('profiles') as any)
      .select('id, full_name, email, role, created_at, updated_at')
      .in('role', ['admin', 'beach_manager'])
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, admins: admins || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch administrator accounts.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const body = await request.json();
    const { action, name, email, role } = body;

    // Add another admin
    if (action === 'add-admin') {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Administrator full name is required.' }, { status: 400 });
      }
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return NextResponse.json({ error: 'Valid administrator email address is required.' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();
      const adminRole = role === 'beach_manager' ? 'beach_manager' : 'admin';

      // Check if user already exists in profiles
      const { data: existingProfile } = await (auth.adminClient.from('profiles') as any)
        .select('id, email, role')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        // Upgrade existing profile to admin
        await (auth.adminClient.from('profiles') as any)
          .update({
            full_name: cleanName,
            role: adminRole,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProfile.id);
      } else {
        // Create user in auth and profile
        const initialPin = '123456';
        const { data: authUser, error: authError } = await auth.adminClient.auth.admin.createUser({
          email: cleanEmail,
          password: initialPin,
          email_confirm: true,
          user_metadata: { name: cleanName, role: adminRole },
        });

        if (authError && !authUser?.user) {
          console.warn('Could not create auth user, checking fallback:', authError.message);
        }

        const userId = authUser?.user?.id || crypto.randomUUID();

        await (auth.adminClient.from('profiles') as any).upsert({
          id: userId,
          full_name: cleanName,
          email: cleanEmail,
          role: adminRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Try sending Gmail notification via nodemailer if configured
      try {
        const gmailUser = process.env.GMAIL_USER || 'official.dagattabai@gmail.com';
        const gmailPass = process.env.GMAIL_APP_PASSWORD;

        if (gmailPass) {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: gmailUser,
              pass: gmailPass,
            },
          });

          await transporter.sendMail({
            from: `"Dagat Ta Bai Administrator" <${gmailUser}>`,
            to: cleanEmail,
            subject: 'Administrator Access Granted - Dagat Ta Bai Barangay Portal',
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                <h2 style="color: #1F3F74; margin-top: 0;">Barangay Admin Portal Invitation</h2>
                <p>Hello <strong>${cleanName}</strong>,</p>
                <p>You have been assigned as a <strong>${adminRole === 'beach_manager' ? 'Municipal Coordinator' : 'Barangay Administrator'}</strong> for <strong>Dagat Ta Bai</strong> (Barangay Binongkalan, Catmon).</p>
                <p>You can access the management console to review resort applications, manage beaches, inspect 360° virtual tours, and monitor coastal listings.</p>
                <div style="margin: 24px 0; padding: 16px; background: #f0f7ff; border-left: 4px solid #1F3F74; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #1F3F74;"><strong>Portal Link:</strong> <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/login" style="color: #1F3F74;">Open Admin Portal</a></p>
                </div>
                <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Barangay Binongkalan Coastal Administration • Dagat Ta Bai</p>
              </div>
            `,
          });
        }
      } catch (mailErr) {
        console.warn('Admin notification email warning:', mailErr);
      }

      return NextResponse.json({
        success: true,
        message: `Administrator ${cleanName} (${cleanEmail}) added successfully.`,
      });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process request.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
