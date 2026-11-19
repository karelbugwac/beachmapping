export interface SuspensionDetails {
  status: 'active' | 'suspended';
  suspension_reason: string | null;
  suspended_at: string | null;
  suspension_ends_at: string | null;
}

export function isAccountSuspended(
  account: Pick<SuspensionDetails, 'status' | 'suspension_ends_at'> | null | undefined,
  now = Date.now()
): boolean {
  if (!account || account.status !== 'suspended') return false;
  if (!account.suspension_ends_at) return true;
  const end = Date.parse(account.suspension_ends_at);
  return Number.isNaN(end) || end > now;
}
