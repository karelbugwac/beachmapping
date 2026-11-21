export type AdminAccountResetAction = 'reset_password' | 'reset_pin';

export function isAllowedAdminResetTarget(action: AdminAccountResetAction, role: string | null | undefined): boolean {
  return action === 'reset_password' ? role === 'user' : role === 'beach_owner';
}
