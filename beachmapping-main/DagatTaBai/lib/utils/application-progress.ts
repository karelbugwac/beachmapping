export type ApplicationStatus =
  | 'draft'
  | 'pending'
  | 'under_review'
  | 'needs_changes'
  | 'approved'
  | 'rejected';

export type ApplicationStep = 'in_progress' | 'review' | 'approved' | 'rejected';
export type ApplicationActor = 'applicant' | 'admin';

export function getApplicationStep(status: string): ApplicationStep {
  if (status === 'pending' || status === 'under_review') return 'review';
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return 'in_progress';
}

export function canTransitionApplication(
  from: string,
  to: string,
  actor: ApplicationActor,
  note?: string | null
) {
  if (actor === 'applicant') {
    return (from === 'draft' || from === 'needs_changes') && to === 'pending';
  }
  if (from === 'pending' && to === 'under_review') return true;
  return (
    from === 'under_review' &&
    ['approved', 'rejected', 'needs_changes'].includes(to) &&
    (to === 'approved' || Boolean(note?.trim()))
  );
}

export function isCurrentApplicationVersion(current: string | null, expected: unknown) {
  return typeof expected === 'string' && current === expected;
}
