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

export interface EffectiveAccountStatus {
  accountstatus: AccountStatus;
  status: 'active' | 'suspended';
  statusreason: string | null;
  statusreasontype: string | null;
  suspendeduntil: string | null;
  statuschangedby: string | null;
  statuschangedat: string | null;
}

export function resolveEffectiveAccountStatus(
  profile?: {
    accountstatus?: string | null;
    status?: string | null;
    statusreason?: string | null;
    suspensionreason?: string | null;
    statusreasontype?: string | null;
    suspendeduntil?: string | null;
    suspensionendsat?: string | null;
    statuschangedby?: string | null;
    statuschangedat?: string | null;
    suspendedat?: string | null;
  } | null,
  authUser?: {
    app_metadata?: Record<string, any> | null;
    user_metadata?: Record<string, any> | null;
    banned_until?: string | null;
  } | null
): EffectiveAccountStatus {
  const appMeta = (authUser?.app_metadata || {}) as Record<string, any>;
  const userMeta = (authUser?.user_metadata || {}) as Record<string, any>;

  const profileChangedAt = profile?.statuschangedat || profile?.suspendedat || null;
  const appChangedAt =
    (typeof appMeta.statuschangedat === 'string' ? appMeta.statuschangedat : null) ||
    (typeof appMeta.status_updated_at === 'string' ? appMeta.status_updated_at : null);

  const useAppMeta = Boolean(
    appMeta.accountstatus &&
      (!profileChangedAt || (appChangedAt && Date.parse(appChangedAt) >= Date.parse(profileChangedAt)))
  );

  const rawStatus = useAppMeta
    ? appMeta.accountstatus
    : profile?.accountstatus ||
      profile?.status ||
      appMeta.accountstatus ||
      appMeta.status ||
      userMeta.status ||
      'active';

  const normalizedStatus: AccountStatus = isAccountStatus(rawStatus)
    ? rawStatus
    : rawStatus === 'disabled'
    ? 'suspended'
    : 'active';

  const rawUntil = useAppMeta
    ? (typeof appMeta.suspendeduntil === 'string' ? appMeta.suspendeduntil : null)
    : profile?.suspendeduntil ??
      profile?.suspensionendsat ??
      (typeof appMeta.suspendeduntil === 'string' ? appMeta.suspendeduntil : null) ??
      (typeof userMeta.suspension_ends_at === 'string' ? userMeta.suspension_ends_at : null) ??
      null;

  const activeSuspension = isSuspensionActive(normalizedStatus, rawUntil);
  const effectiveStatus: AccountStatus =
    normalizedStatus === 'suspended' && !activeSuspension ? 'active' : normalizedStatus;

  const reason =
    effectiveStatus === 'active'
      ? null
      : (useAppMeta ? appMeta.statusreason : null) ??
        profile?.statusreason ??
        profile?.suspensionreason ??
        (typeof appMeta.statusreason === 'string' ? appMeta.statusreason : null) ??
        (typeof appMeta.status_reason === 'string' ? appMeta.status_reason : null) ??
        (typeof userMeta.status_reason === 'string' ? userMeta.status_reason : null) ??
        null;

  const reasonType =
    effectiveStatus === 'suspended'
      ? (useAppMeta ? appMeta.statusreasontype : null) ??
        profile?.statusreasontype ??
        (typeof appMeta.statusreasontype === 'string' ? appMeta.statusreasontype : null) ??
        null
      : null;

  const changedBy =
    (useAppMeta ? appMeta.statuschangedby : null) ??
    profile?.statuschangedby ??
    (typeof appMeta.statuschangedby === 'string' ? appMeta.statuschangedby : null) ??
    null;

  const changedAt =
    (useAppMeta ? appChangedAt : null) ??
    profileChangedAt ??
    appChangedAt ??
    (typeof userMeta.status_updated_at === 'string' ? userMeta.status_updated_at : null) ??
    null;

  return {
    accountstatus: effectiveStatus,
    status: effectiveStatus === 'suspended' ? 'suspended' : 'active',
    statusreason: reason,
    statusreasontype: reasonType,
    suspendeduntil: effectiveStatus === 'suspended' ? rawUntil : null,
    statuschangedby: changedBy,
    statuschangedat: changedAt,
  };
}
