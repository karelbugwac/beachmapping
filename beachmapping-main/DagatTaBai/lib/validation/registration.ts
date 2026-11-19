export const EMAIL_TAKEN_MESSAGE = 'This email is taken.';

export function isDuplicateAuthEmailError(error: {
  code?: unknown;
  message?: unknown;
}): boolean {
  if (typeof error.code === 'string' && ['email_exists', 'user_already_exists', 'duplicate_email'].includes(error.code.toLowerCase())) {
    return true;
  }
  return typeof error.message === 'string'
    && /(already registered|already exists|email.{0,30}(taken|exists|registered)|already.{0,30}email)/i.test(error.message);
}
