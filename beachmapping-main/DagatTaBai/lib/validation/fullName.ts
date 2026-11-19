import { z } from 'zod';

export const FULL_NAME_MESSAGES = {
  invalidCharacters: 'Full legal name can only contain letters, spaces, periods (.) and hyphens (-).',
  tooShort: 'Please enter your full legal name (at least 2 letters).',
  tooLong: 'Full legal name must be 80 characters or fewer.',
  required: 'Full legal name is required.',
  serverRejected: "We couldn't accept that name. Please use only letters, spaces, periods and hyphens.",
} as const;

export interface FullNameValidationResult {
  ok: boolean;
  value: string;
  error: string | null;
}

const allowedNameCharacter = /^[\p{L}\p{M} .-]$/u;
const allowedFullName =
  /^[\p{L}\p{M}]+(?:\.[\p{L}\p{M}]+)*\.?(?:[ -][\p{L}\p{M}]+(?:\.[\p{L}\p{M}]+)*\.?)*$/u;
const invisibleOrControlCharacter =
  /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}\p{Default_Ignorable_Code_Point}]/u;

export function filterFullNameInput(input: string): string {
  return Array.from(input.normalize('NFKC'))
    .filter(
      (character) =>
        allowedNameCharacter.test(character) && !invisibleOrControlCharacter.test(character)
    )
    .join('')
    .replace(/ {2,}/g, ' ');
}

export function validateFullName(input: unknown): FullNameValidationResult {
  if (typeof input !== 'string') {
    return { ok: false, value: '', error: FULL_NAME_MESSAGES.required };
  }
  if (Array.from(input).some((character) => invisibleOrControlCharacter.test(character))) {
    return { ok: false, value: '', error: FULL_NAME_MESSAGES.invalidCharacters };
  }

  const normalized = input.normalize('NFKC');
  if (Array.from(normalized).some((character) => invisibleOrControlCharacter.test(character))) {
    return { ok: false, value: '', error: FULL_NAME_MESSAGES.invalidCharacters };
  }
  const value = normalized.trim().replace(/\s+/gu, ' ');
  if (!value) {
    return { ok: false, value: '', error: FULL_NAME_MESSAGES.required };
  }

  const length = Array.from(value).length;
  if (length > 80) {
    return { ok: false, value: '', error: FULL_NAME_MESSAGES.tooLong };
  }
  if (!allowedFullName.test(value)) {
    return { ok: false, value: '', error: FULL_NAME_MESSAGES.invalidCharacters };
  }

  const parts = value.replace(/\./g, '').split(/[ -]/);
  const letterCount = Array.from(value.matchAll(/\p{L}/gu)).length;
  if (letterCount < 2 || parts.some((part) => !/\p{L}/u.test(part))) {
    return { ok: false, value: '', error: FULL_NAME_MESSAGES.tooShort };
  }

  return { ok: true, value, error: null };
}

export const fullNameSchema = z.string().transform((input, context) => {
  const result = validateFullName(input);
  if (!result.ok) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: result.error || FULL_NAME_MESSAGES.serverRejected,
    });
    return z.NEVER;
  }
  return result.value;
});
