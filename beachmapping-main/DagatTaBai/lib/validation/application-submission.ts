export const PENDING_APPLICATION_MESSAGE = 'You already have a pending application with this email.';

export function isPendingApplicationConflict(error: {
  code?: unknown;
  message?: unknown;
  constraint?: unknown;
}): boolean {
  return error.code === '23505' && (
    error.constraint === 'owner_applications_one_pending_per_applicant'
    || error.constraint === 'idx_owner_applications_pending_email'
    || (typeof error.message === 'string' && error.message.includes('owner_applications_one_pending_per_applicant'))
    || (typeof error.message === 'string' && error.message.includes('idx_owner_applications_pending_email'))
  );
}
