import { createAdminClient } from '@/lib/supabase/server';

interface FailedLivenessSession {
  nonce_hash: string;
  status: string;
  attempts: number;
  user_id: string | null;
}

export async function recordFailedLiveness(
  adminClient: ReturnType<typeof createAdminClient>,
  session: FailedLivenessSession,
  completedAt: string,
  checkedAt: string,
  reasons: string[]
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: failedSession, error: sessionError } = await (adminClient.from('owner_liveness_sessions') as any)
    .update({
      status: 'failed',
      attempts: session.attempts + 1,
      flagged_reasons: reasons,
    })
    .eq('nonce_hash', session.nonce_hash)
    .eq('status', session.status)
    .eq('completed_at', completedAt)
    .is('consumed_at', null)
    .select('nonce_hash')
    .maybeSingle();
  if (sessionError || !failedSession) {
    console.error('Unable to record failed owner verification:', sessionError?.code || 'stale session');
    return false;
  }

  if (!session.user_id) return true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: application, error: applicationLookupError } = await (adminClient.from('owner_applications') as any)
    .select('id,liveness_attempts')
    .eq('applicant_user_id', session.user_id)
    .eq('status', 'needs_changes')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (applicationLookupError) {
    console.error('Unable to load application after failed live verification:', applicationLookupError.code);
    return false;
  }
  if (!application) return true;

  const attempts = Number.isInteger(application.liveness_attempts) ? application.liveness_attempts : 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updatedApplication, error: applicationUpdateError } = await (adminClient.from('owner_applications') as any)
    .update({
      liveness_status: 'failed',
      liveness_attempts: attempts + 1,
      liveness_checked_at: checkedAt,
      liveness_flagged_reasons: reasons,
    })
    .eq('id', application.id)
    .eq('liveness_attempts', attempts)
    .select('id')
    .maybeSingle();
  if (applicationUpdateError || !updatedApplication) {
    console.error('Unable to update application live verification:', applicationUpdateError?.code || 'stale application');
    return false;
  }
  return true;
}
