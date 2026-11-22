import { isAdministratorAccount } from '@/lib/server/adminrequest';

const SUSPENDABLE_ROLES = new Set(['user', 'beach_owner', 'beach_manager']);

export { validateSuspensionEndDate } from '@/lib/validation/suspension-date';

export function isForbiddenSuspensionTarget(
  target: { id: string; role?: string | null; email?: string | null },
  adminId: string
): boolean {
  return target.id === adminId || isAdministratorAccount(target) || !SUSPENDABLE_ROLES.has(target.role || '');
}

export function isCurrentStatusVersion(current: string | null, expected: unknown): boolean {
  return current === (typeof expected === 'string' ? expected : null);
}
