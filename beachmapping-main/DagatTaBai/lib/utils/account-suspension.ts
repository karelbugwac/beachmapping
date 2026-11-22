export interface SuspensionDetails {
  status: 'active' | 'suspended';
  suspensionreason: string | null;
  suspendedat: string | null;
  suspensionendsat: string | null;
}

export function isAccountSuspended(
  account: Pick<SuspensionDetails, 'status' | 'suspensionendsat'> | null | undefined,
  now = Date.now()
): boolean {
  if (!account || account.status !== 'suspended') return false;
  if (!account.suspensionendsat) return true;
  const end = Date.parse(account.suspensionendsat);
  return Number.isNaN(end) || end > now;
}
