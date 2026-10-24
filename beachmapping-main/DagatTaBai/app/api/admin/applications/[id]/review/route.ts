import { NextResponse } from 'next/server';
import { provisionBeachOwner } from '@/lib/services/ownerProvisioning';
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
    const { action, applicant_email, applicant_name, rejection_reason } = body;

    if (!applicant_email) {
      return NextResponse.json({ error: 'Applicant email is required' }, { status: 400 });
    }

    if (action === 'approve') {
      const result = await provisionBeachOwner(
        applicant_email.trim().toLowerCase(),
        applicant_name || 'Beach Owner',
        resolvedParams.id
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to provision beach owner' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Application approved! A randomized 6-digit PIN has been generated and dispatched via email to ${applicant_email}.`,
      });
    }

    if (action === 'reject') {
      const adminSupabase = createAdminClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        resolvedParams.id
      );

      if (isUuid) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminSupabase.from('owner_applications') as any)
          .update({
            status: 'rejected',
            rejection_reason: rejection_reason || 'Incomplete business documents or permit mismatch.',
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', resolvedParams.id);
      }

      return NextResponse.json({
        success: true,
        message: `Application marked as rejected.`,
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (err: any) {
    console.error('Failed to review application:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
