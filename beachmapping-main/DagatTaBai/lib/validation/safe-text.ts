import { ADMIN_MESSAGES } from '@/lib/validation/admin-messages';
import { z } from 'zod';

export const SAFE_TEXT_MESSAGES = {
  invalid: ADMIN_MESSAGES.invalidCharacters,
  tooShort: ADMIN_MESSAGES.reasonTooShort,
  tooLong: ADMIN_MESSAGES.reasonTooLong,
};

export interface SafeTextOptions {
  min?: number;
  max?: number;
  maxLines?: number;
  invalidMessage?: string;
  tooShortMessage?: string;
  tooLongMessage?: string;
  tooManyLinesMessage?: string;
}

export type SafeTextResult =
  | { ok: true; value: string; error: null }
  | { ok: false; value: null; error: string };

const forbiddenCharacters = /[=<>;`\\{}[\]$|^~*%]/u;
const invisibleOrControlCharacters = /[\p{Cc}\p{Cf}\p{Cs}\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFE00-\uFE0F\uFEFF\uFFF9-\uFFFB]/u;
const allowedCharacters = /^[\p{L}\p{M}\p{N}\s.,:!?'()"()+@#&/-]*$/u;
const ADMIN_SEARCH_PATTERN = /^[\p{L}\p{N} @.\-_+]*$/u;
const safeTextInputSchema = z.string();
const adminSearchSchema = z.string().transform((input) => input.normalize('NFKC')).pipe(
  z.string().max(60).regex(ADMIN_SEARCH_PATTERN)
);

export function validateSafeText(
  input: unknown,
  {
    min = 0,
    max = 500,
    maxLines,
    invalidMessage = SAFE_TEXT_MESSAGES.invalid,
    tooShortMessage = SAFE_TEXT_MESSAGES.tooShort,
    tooLongMessage = SAFE_TEXT_MESSAGES.tooLong,
    tooManyLinesMessage = invalidMessage,
  }: SafeTextOptions = {}
): SafeTextResult {
  const parsed = safeTextInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, value: null, error: invalidMessage };
  }

  const nfkc = parsed.data.normalize('NFKC');
  const lineCount = (nfkc.match(/\r\n|\r|\n|\u2028|\u2029/gu) || []).length + 1;
  if (maxLines !== undefined && lineCount > maxLines) {
    return { ok: false, value: null, error: tooManyLinesMessage };
  }
  if (invisibleOrControlCharacters.test(nfkc.replace(/\r\n|\r|\n|\u2028|\u2029/gu, ''))) {
    return { ok: false, value: null, error: invalidMessage };
  }
  const normalized = nfkc.trim().replace(/\s+/gu, ' ');
  if (
    forbiddenCharacters.test(normalized) ||
    normalized.includes('--') ||
    normalized.includes('/*') ||
    normalized.includes('*/') ||
    normalized.includes('${') ||
    !allowedCharacters.test(normalized)
  ) {
    return { ok: false, value: null, error: invalidMessage };
  }
  if ([...normalized].length < min) {
    return { ok: false, value: null, error: tooShortMessage };
  }
  if ([...normalized].length > max) {
    return { ok: false, value: null, error: tooLongMessage };
  }

  return { ok: true, value: normalized, error: null };
}

export function validateAdminSearch(input: unknown): SafeTextResult {
  const parsed = adminSearchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, value: null, error: SAFE_TEXT_MESSAGES.invalid };
  }
  return { ok: true, value: parsed.data.trim().replace(/\s+/gu, ' '), error: null };
}

export function filterAdminSearchInput(input: string): { value: string; rejected: boolean } {
  const normalized = input.normalize('NFKC');
  const value = [...normalized].filter((character) => ADMIN_SEARCH_PATTERN.test(character)).join('').slice(0, 60);
  return { value, rejected: value !== input };
}
