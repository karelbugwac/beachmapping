import { NextResponse } from 'next/server';
import { provisionBeachOwner } from '@/lib/services/ownerProvisioning';
import { sendOwnerApplicationStatusEmail } from '@/lib/services/ownerApplicationEmails';
import { createAdminClient } from '@/lib/supabase/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { validateAdminMutationRequest, noStoreHeaders } from '@/lib/server/admin-request';
import { validateSafeText } from '@/lib/validation/safe-text';
import { ADMIN_MESSAGES } from '@/lib/validation/admin-messages';
import { canTransitionApplication, isCurrentApplicationVersion } from '@/lib/utils/application-progress';

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = validateAdminMutationRequest(request);
  if (originError) return originError;

  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders() });
    }

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404, headers: noStoreHeaders() });
    }
    const body = await request.json();
    const action = body?.action;
    if (!['start_review', 'request_changes', 'approve', 'reject', 'resend_pin'].includes(action)) {
      return NextResponse.json({ error: 'Choose a valid application action.' }, { status: 400, headers: noStoreHeaders() });
    }

    const adminSupabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error: applicationError } = await (adminSupabase.from('owner_applications') as any)
      .select('id, status, status_updated_at, liveness_status, applicant_email, applicant_full_name, beach_name, business_name')
      .eq('id', id)
      .maybeSingle();
    if (applicationError) throw applicationError;
    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404, headers: noStoreHeaders() });
    }

    if (action === 'resend_pin') {
      if (application.status !== 'approved') {
        return NextResponse.json({ error: 'Only an approved application can have its PIN resent.' }, { status: 409, headers: noStoreHeaders() });
      }
      const result = await provisionBeachOwner(
        application.applicant_email,
        application.applicant_full_name || 'Beach Owner',
        id
      );
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Could not resend the owner PIN.' },
          { status: result.invalidName ? 400 : 500, headers: noStoreHeaders() }
        );
      }
      return NextResponse.json({ success: true, message: 'A new PIN was sent to the applicant.' }, { headers: noStoreHeaders() });
    }

    if (typeof body.expected_status_updated_at !== 'string' ||
      !isCurrentApplicationVersion(application.status_updated_at, body.expected_status_updated_at)) {
      return NextResponse.json(
        { error: 'Someone else already changed this application. Refresh and try again.' },
        { status: 409, headers: noStoreHeaders() }
      );
    }

    const transition = {
      start_review: { to: 'under_review', requiresNote: false },
      request_changes: { to: 'needs_changes', requiresNote: true },
      approve: { to: 'approved', requiresNote: false },
      reject: { to: 'rejected', requiresNote: true },
    }[action as 'start_review' | 'request_changes' | 'approve' | 'reject'];
    const noteInput = body.note ?? body.rejection_reason ?? '';
    let note: string | null = null;
    if (transition.requiresNote) {
      if (typeof noteInput !== 'string' || !noteInput.trim()) {
        return NextResponse.json({ error: 'Add a note before submitting this decision.' }, { status: 400, headers: noStoreHeaders() });
      }
      const noteValidation = validateSafeText(noteInput, { min: 1, max: 500 });
      if (!noteValidation.ok) {
        return NextResponse.json({ error: noteValidation.error }, { status: 400, headers: noStoreHeaders() });
      }
      note = noteValidation.value;
    } else if (typeof noteInput === 'string' && noteInput.trim()) {
      const noteValidation = validateSafeText(noteInput, { max: 500 });
      if (!noteValidation.ok) {
        return NextResponse.json({ error: noteValidation.error }, { status: 400, headers: noStoreHeaders() });
      }
      note = noteValidation.value;
    }

    if (!canTransitionApplication(application.status, transition.to, 'admin', note)) {
      return NextResponse.json({ error: 'This application can no longer be changed in that way.' }, { status: 409, headers: noStoreHeaders() });
    }
    if (action === 'approve' && application.liveness_status !== 'passed') {
      return NextResponse.json({ error: 'Live verification must pass before this application can be approved.' }, { status: 400, headers: noStoreHeaders() });
    }

    const now = new Date().toISOString();
    if (action === 'approve') {
      // Claim the reviewed version before provisioning so parallel admin actions become stale.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: claimed, error: claimError } = await (adminSupabase.from('owner_applications') as any)
        .update({ status_updated_at: now, reviewed_by: auth.user.id, updated_at: now })
        .eq('id', id)
        .eq('status', 'under_review')
        .eq('status_updated_at', body.expected_status_updated_at)
        .select('id')
        .maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) {
        return NextResponse.json(
          { error: 'Someone else already changed this application. Refresh and try again.' },
          { status: 409, headers: noStoreHeaders() }
        );
      }
      const result = await provisionBeachOwner(
        application.applicant_email,
        application.applicant_full_name || 'Beach Owner',
        id,
        { expectedStatusUpdatedAt: now, reviewedBy: auth.user.id, note }
      );
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Could not approve this application.' },
          { status: result.conflict ? 409 : result.invalidName ? 400 : 500, headers: noStoreHeaders() }
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const approvedApplicationQuery = (adminSupabase.from('owner_applications') as any)
        .select('id, status, status_updated_at, status_note, rejection_reason');
      const { data: approvedApplication, error: approvedApplicationError } = await approvedApplicationQuery
        .eq('id', id)
        .single();
      if (approvedApplicationError) throw approvedApplicationError;
      return NextResponse.json({ success: true, application: approvedApplication }, { headers: noStoreHeaders() });
    }

    const updateValues = {
      status: transition.to,
      status_note: note,
      rejection_reason: action === 'reject' ? note : null,
      status_updated_at: now,
      reviewed_at: now,
      reviewed_by: auth.user.id,
      decided_at: action === 'reject' ? now : null,
      updated_at: now,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedApplication, error: updateError } = await (adminSupabase.from('owner_applications') as any)
      .update(updateValues)
      .eq('id', id)
      .eq('status', application.status)
      .eq('status_updated_at', body.expected_status_updated_at)
      .select('id, status, status_updated_at, status_note, rejection_reason')
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updatedApplication) {
      return NextResponse.json(
        { error: 'Someone else already changed this application. Refresh and try again.' },
        { status: 409, headers: noStoreHeaders() }
      );
    }

    if (action === 'reject' && note) {
      const beachName = application.beach_name || application.business_name || application.applicant_full_name || 'Beach Resort';
      await sendOwnerApplicationStatusEmail({
        status: 'rejected',
        recipientEmail: application.applicant_email,
        applicantName: application.applicant_full_name || 'Applicant',
        beachName,
        rejectionReason: note,
      }).catch((emailErr) => console.warn('Failed to send rejection email:', emailErr));
    }

    return NextResponse.json({ success: true, application: updatedApplication }, { headers: noStoreHeaders() });
  } catch (error: unknown) {
    console.error('Failed to review application:', error);
    return NextResponse.json({ error: ADMIN_MESSAGES.serverError }, { status: 500, headers: noStoreHeaders() });
  }
}
