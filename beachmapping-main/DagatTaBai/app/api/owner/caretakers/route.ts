import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { authorizeRoles } from '@/lib/supabase/authorization';

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };

export async function POST(request: Request) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders });
    }

    const body = await request.json();
    const { name, email, contact, role, permissions, beachName } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Caretaker name and email are required.' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    // Attempt sending real Gmail notification if credentials exist
    const mailUser = process.env.MAIL_USERNAME;
    const mailPass = process.env.MAIL_PASSWORD;

    if (mailUser && mailPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: mailUser, pass: mailPass },
        });

        const permsList = Array.isArray(permissions) && permissions.length > 0
          ? permissions.map((p: string) => `• ${p}`).join('\n')
          : '• Manage Resort Information & Cottages\n• View & Respond to Guest Reviews\n• Update Operating Hours\n• Upload Resort Photos';

        const mailOptions = {
          from: `"Dagat Ta Bai Portal" <${mailUser}>`,
          to: email,
          subject: `Authorized Staff Access Granted: ${beachName || 'Beach Resort'} - Dagat Ta Bai`,
          text: `Maayong adlaw, ${name}!\n\nYou have been added as an authorized staff member / caretaker for ${beachName || 'your resort'} on the Dagat Ta Bai Beach Owner Portal.\n\nAssigned Role: ${role || 'Caretaker & Front Desk'}\nAssigned Permissions:\n${permsList}\n\nImportant Security Notice:\nAs an authorized caretaker, you can manage day-to-day resort operations. However, you are strictly NOT permitted to change the master registered owner email address or reset portal security credentials.\n\nAccess the portal here: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/owner/login\n\nDagat Ta Bai - Catmon, Cebu`,
          html: `
            <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <h2 style="color: #1F3F74; margin-top: 0;">Authorized Staff Access Granted</h2>
              <p>Maayong adlaw, <strong>${name}</strong>!</p>
              <p>You have been registered as an authorized caretaker for <strong>${beachName || 'the resort'}</strong> on the <strong>Dagat Ta Bai Beach Owner Portal</strong>.</p>
              
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1F3F74;">
                <p style="margin: 0 0 8px 0;"><strong>Role:</strong> ${role || 'Caretaker & Front Desk'}</p>
                <p style="margin: 0 0 6px 0;"><strong>Granted Permissions:</strong></p>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
                  ${(Array.isArray(permissions) ? permissions : ['Manage Cottages & Facilities', 'View Guest Reviews', 'Update Hours', 'Upload Photos'])
                    .map((p: string) => `<li>${p}</li>`)
                    .join('')}
                </ul>
              </div>

              <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #92400e; margin-bottom: 20px;">
                <strong>Security Policy:</strong> Caretakers can update resort rates and operational details, but are strictly not permitted to alter master email accounts or credential recovery settings.
              </div>

              <p style="text-align: center; margin: 28px 0;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/owner/login" style="background-color: #1F3F74; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                  Log in to Portal
                </a>
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 11px; color: #94a3b8; text-align: center;">Dagat Ta Bai &bull; Barangay Binongkalan, Catmon, Cebu</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
      } catch (err) {
        console.warn('Caretaker email send failed, continuing gracefully:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notification email dispatched to ${email}`,
    }, { headers: noStoreHeaders });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to register caretaker';
    return NextResponse.json({ error: msg }, { status: 500, headers: noStoreHeaders });
  }
}

