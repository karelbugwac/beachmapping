import { NextRequest, NextResponse } from 'next/server';
import { provisionBeachOwner } from '@/lib/services/ownerProvisioning';

/**
 * Supabase Database Webhook Target.
 * Fired when an `owner_applications` record status is updated to 'approved'.
 */
export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const authHeader = req.headers.get('x-webhook-secret');

    if (webhookSecret && authHeader !== webhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 });
      }
    }

    const payload = await req.json();
    const { record, old_record } = payload;

    // Only process newly approved applications that are not linked to a profile yet.
    if (
      record &&
      record.status === 'approved' &&
      (!old_record || old_record.status !== 'approved') &&
      !record.applicant_user_id
    ) {
      const result = await provisionBeachOwner(
        record.applicant_email,
        record.applicant_full_name || record.applicant_name || 'Beach Owner',
        record.id
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Beach owner account provisioned and PIN sent successfully.',
        userId: result.userId,
      });
    }

    return NextResponse.json({ message: 'No action required for this event.' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Webhook error';
    console.error('Webhook error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
