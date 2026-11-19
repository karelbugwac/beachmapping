import { BEACH_ADDRESS_MESSAGES } from '@/lib/constants/location';

const CONTROL_OR_FORMAT_CHARACTER = /[\p{Cc}\p{Cf}]/u;
const DISALLOWED_SEQUENCE = /--|\/\*|\*\/|\$\{/u;
const ALLOWED_ADDRESS_CHARACTERS = /^[\p{L}\p{M}\p{N} .,/#&()'-]+$/u;

export type BeachAddressValidation =
  | { ok: true; value: string; error: null; warning: string | null }
  | { ok: false; value: null; error: string; warning: null };

function invalid(error: string): BeachAddressValidation {
  return { ok: false, value: null, error, warning: null };
}

export function validateBeachAddress(input: string): BeachAddressValidation {
  if (CONTROL_OR_FORMAT_CHARACTER.test(input)) {
    return invalid(BEACH_ADDRESS_MESSAGES.invalidCharacters);
  }

  const value = input.normalize('NFKC').trim().replace(/\s+/gu, ' ');
  if (CONTROL_OR_FORMAT_CHARACTER.test(value)) {
    return invalid(BEACH_ADDRESS_MESSAGES.invalidCharacters);
  }
  if (!value) return invalid(BEACH_ADDRESS_MESSAGES.required);
  if ([...value].length > 150) return invalid(BEACH_ADDRESS_MESSAGES.tooLong);
  if (DISALLOWED_SEQUENCE.test(value) || !ALLOWED_ADDRESS_CHARACTERS.test(value)) {
    return invalid(BEACH_ADDRESS_MESSAGES.invalidCharacters);
  }
  if ([...value].length < 5 || !/\p{L}/u.test(value)) {
    return invalid(BEACH_ADDRESS_MESSAGES.required);
  }

  return {
    ok: true,
    value,
    error: null,
    warning: /binongkalan/iu.test(value) ? null : BEACH_ADDRESS_MESSAGES.binongkalanWarning,
  };
}