export type ApplicationReviewStatus = 'pending' | 'approved' | 'rejected';

export type ApplicationNotesDisplay =
  | { kind: 'input' }
  | { kind: 'reason'; reason: string }
  | { kind: 'hidden' };

export function getApplicationNotesDisplay(
  status: ApplicationReviewStatus,
  rejectionReason?: string | null
): ApplicationNotesDisplay {
  if (status === 'pending') return { kind: 'input' };
  if (status === 'rejected' && rejectionReason?.trim()) {
    return { kind: 'reason', reason: rejectionReason.trim() };
  }
  return { kind: 'hidden' };
}
