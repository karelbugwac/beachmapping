import { createAdminClient } from '@/lib/supabase/server';

interface FailedLivenessSession {
  noncehash: string;
  status: string;
  attempts: number;
  userid: string | null;
}

export async function recordFailedLiveness(
  adminClient: ReturnType<typeof createAdminClient>,
  session: FailedLivenessSession,
  completedAt: string,
  checkedAt: string,
  reasons: string[]
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: failedSession, error: sessionError } = await (adminClient.from('livenesssessions') as any)
    .update({
      status: 'failed',
      attempts: session.attempts + 1,
      flaggedreasons: reasons,
    })
    .eq('noncehash', session.noncehash)
    .eq('status', session.status)
    .eq('completedat', completedAt)
    .is('consumedat', null)
    .select('noncehash')
    .maybeSingle();
  if (sessionError || !failedSession) {
    console.error('Unable to record failed owner verification:', sessionError?.code || 'stale session');
    return false;
  }

  if (!session.userid) return true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: application, error: applicationLookupError } = await (adminClient.from('ownerapplications') as any)
    .select('id,livenessattempts')
    .eq('applicantuserid', session.userid)
    .eq('status', 'needs_changes')
    .order('createdat', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (applicationLookupError) {
    console.error('Unable to load application after failed live verification:', applicationLookupError.code);
    return false;
  }
  if (!application) return true;

  const attempts = Number.isInteger(application.livenessattempts) ? application.livenessattempts : 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updatedApplication, error: applicationUpdateError } = await (adminClient.from('ownerapplications') as any)
    .update({
      livenessstatus: 'failed',
      livenessattempts: attempts + 1,
      livenesscheckedat: checkedAt,
      livenessflaggedreasons: reasons,
    })
    .eq('id', application.id)
    .eq('livenessattempts', attempts)
    .select('id')
    .maybeSingle();
  if (applicationUpdateError || !updatedApplication) {
    console.error('Unable to update application live verification:', applicationUpdateError?.code || 'stale application');
    return false;
  }
  return true;
}
