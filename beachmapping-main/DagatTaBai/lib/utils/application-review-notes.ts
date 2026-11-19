export type ApplicationReviewStatus =
  | 'draft'
  | 'pending'
  | 'under_review'
  | 'needs_changes'
  | 'approved'
  | 'rejected'
  | string;

export type ApplicationNotesDisplay =
  | { kind: 'input' }
  | { kind: 'reason'; reason: string }
  | { kind: 'hidden' };

export function getApplicationNotesDisplay(
  status: ApplicationReviewStatus,
  rejectionReason?: string | null
): ApplicationNotesDisplay {
  if (status === 'pending' || status === 'under_review') return { kind: 'input' };
  if (status === 'rejected' && rejectionReason?.trim()) {
    return { kind: 'reason', reason: rejectionReason.trim() };
  }
  return { kind: 'hidden' };
}
