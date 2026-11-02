import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { authorizeRoles } from '@/lib/supabase/authorization';

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };

async function getAuthorizedBeach(
  auth: Awaited<ReturnType<typeof authorizeRoles>>,
  beachId: string | null
) {
  if (!auth.authorized) {
    return { response: NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders }) };
  }

  let query = (auth.adminClient.from('beaches') as any).select('id, name, owner_id');
  if (beachId) query = query.eq('id', beachId);
  else if (auth.role !== 'admin') query = query.eq('owner_id', auth.user.id);
  const { data: beach, error } = await query.order('name').limit(1).maybeSingle();
  if (error) throw error;
  if (!beach || (auth.role !== 'admin' && beach.owner_id !== auth.user.id)) {
    return { response: NextResponse.json({ error: 'Beach not found or unauthorized.' }, { status: 404, headers: noStoreHeaders }) };
  }
  return { beach, auth };
}

function toCaretaker(row: Record<string, any>) {
  return {
    id: row.id,
    name: row.full_name,
    contact: row.email,
    role: row.role_title,
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    added_at: row.created_at,
    status: row.status,
  };
}

export async function GET(request: Request) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    const url = new URL(request.url);
    const beachResult = await getAuthorizedBeach(auth, url.searchParams.get('beach_id'));
    if ('response' in beachResult) return beachResult.response;

    const { data, error } = await (beachResult.auth.adminClient.from('beach_caretaker_invitations') as any)
      .select('id, full_name, email, role_title, permissions, created_at, status')
      .eq('beach_id', beachResult.beach.id)
      .neq('status', 'revoked')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json({ items: (data || []).map(toCaretaker) }, { headers: noStoreHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load caretaker invitations.';
    console.error('Caretaker invitation GET error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const role = typeof body.role === 'string' ? body.role.trim() : '';
    const permissions = Array.isArray(body.permissions)
      ? body.permissions.filter((permission: unknown): permission is string => typeof permission === 'string')
      : [];
    if (!name || !email || !email.includes('@') || !role) {
      return NextResponse.json(
        { error: 'Caretaker name, valid email, and role are required.' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const beachResult = await getAuthorizedBeach(auth, typeof body.beach_id === 'string' ? body.beach_id : null);
    if ('response' in beachResult) return beachResult.response;
    const { data, error } = await (beachResult.auth.adminClient.from('beach_caretaker_invitations') as any)
      .insert({
        beach_id: beachResult.beach.id,
        invited_by: beachResult.auth.user.id,
        full_name: name,
        email,
        role_title: role,
        permissions,
      })
      .select('id, full_name, email, role_title, permissions, created_at, status')
      .single();
    if (error) throw error;

    let emailSent = false;
    const mailUser = process.env.MAIL_USERNAME;
    const mailPass = process.env.MAIL_PASSWORD;
    if (mailUser && mailPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: mailUser, pass: mailPass },
        });
        await transporter.sendMail({
          from: `"Dagat Ta Bai Portal" <${mailUser}>`,
          to: email,
          subject: `Caretaker invitation for ${beachResult.beach.name}`,
          text: `Maayong adlaw, ${name}!\n\n${beachResult.beach.name} has recorded you as a caretaker invitee. This invitation does not create an account or grant access to the owner portal. Please contact the beach owner to arrange access.\n\nRole: ${role}\nPermissions requested: ${permissions.join(', ') || 'None specified'}`,
        });
        emailSent = true;
      } catch (error) {
        console.error('Caretaker invitation email failed:', error);
      }
    }

    return NextResponse.json({
      success: true,
      item: toCaretaker(data),
      email_sent: emailSent,
      message: emailSent
        ? 'Invitation recorded and email sent. Portal access has not been granted.'
        : 'Invitation recorded, but email was not sent. Portal access has not been granted.',
    }, { status: 201, headers: noStoreHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to record caretaker invitation.';
    console.error('Caretaker invitation POST error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Invitation ID is required.' }, { status: 400, headers: noStoreHeaders });
    }
    const beachResult = await getAuthorizedBeach(auth, url.searchParams.get('beach_id'));
    if ('response' in beachResult) return beachResult.response;

    const { data, error } = await (beachResult.auth.adminClient.from('beach_caretaker_invitations') as any)
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('beach_id', beachResult.beach.id)
      .neq('status', 'revoked')
      .select('id');
    if (error) throw error;
    if (!data?.length) {
      return NextResponse.json({ error: 'Caretaker invitation not found.' }, { status: 404, headers: noStoreHeaders });
    }

    return NextResponse.json({ success: true }, { headers: noStoreHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to revoke caretaker invitation.';
    console.error('Caretaker invitation DELETE error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}
