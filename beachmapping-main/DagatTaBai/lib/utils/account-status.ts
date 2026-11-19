export const ACCOUNT_STATUSES = ['active', 'under_review', 'suspended'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

const transitions: Record<AccountStatus, readonly AccountStatus[]> = {
  active: ['under_review', 'suspended'],
  under_review: ['active', 'suspended'],
  suspended: ['active'],
};

export function isAccountStatus(value: unknown): value is AccountStatus {
  return typeof value === 'string' && ACCOUNT_STATUSES.includes(value as AccountStatus);
}

export function canTransitionAccountStatus(from: AccountStatus, to: AccountStatus): boolean {
  return transitions[from].includes(to);
}

export function isSuspensionActive(
  status: AccountStatus,
  suspendedUntil: string | null,
  now = Date.now()
): boolean {
  if (status !== 'suspended') return false;
  if (!suspendedUntil) return true;
  const end = Date.parse(suspendedUntil);
  return Number.isNaN(end) || end > now;
}
