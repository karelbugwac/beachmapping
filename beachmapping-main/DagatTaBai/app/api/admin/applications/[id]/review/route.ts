import { NextResponse } from 'next/server';
import { provisionBeachOwner } from '@/lib/services/ownerProvisioning';
import { sendOwnerApplicationStatusEmail } from '@/lib/services/ownerApplicationEmails';
import { createAdminClient } from '@/lib/supabase/server';
import { authorizeRoles } from '@/lib/supabase/authorization';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }
    const resolvedParams = await params;
    const body = await request.json();
    const { action, rejection_reason } = body;

    if (action === 'approve') {
      const result = await provisionBeachOwner(resolvedParams.id);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to provision beach owner' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Application approved! A randomized 6-digit PIN has been generated and dispatched via email to ${result.email}.`,
      });
    }

    if (action === 'reject') {
      const reason = typeof rejection_reason === 'string' ? rejection_reason.trim() : '';
      if (!reason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      const adminSupabase = createAdminClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        resolvedParams.id
      );

      if (!isUuid) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: application, error: applicationError } = await (adminSupabase
        .from('owner_applications') as any)
        .select('applicant_full_name, applicant_email, business_name, beach_name')
        .eq('id', resolvedParams.id)
        .single();

      if (applicationError || !application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      const applicantName = application.applicant_full_name?.trim();
      const applicantEmail = application.applicant_email?.trim().toLowerCase();
      const beachName = application.beach_name?.trim() || application.business_name?.trim();
      if (!applicantName || !applicantEmail || !beachName) {
        return NextResponse.json(
          { error: 'Application is missing the applicant name, email, or beach name' },
          { status: 422 }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (adminSupabase.from('owner_applications') as any)
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', resolvedParams.id);
      if (updateError) throw updateError;

      await sendOwnerApplicationStatusEmail({
        status: 'rejected',
        recipientEmail: applicantEmail,
        applicantName,
        beachName,
        rejectionReason: reason,
      });

      return NextResponse.json({
        success: true,
        message: `Application rejected and email sent to ${applicantEmail}.`,
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (err: any) {
    console.error('Failed to review application:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
