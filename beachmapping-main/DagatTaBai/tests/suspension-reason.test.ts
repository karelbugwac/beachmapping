import test from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_MESSAGES, SUSPENSION_REASON_TYPES } from '../lib/validation/admin-messages';
import { validateSafeText } from '../lib/validation/safe-text';

const validateSuspensionReason = (input: unknown) => validateSafeText(input, {
  min: 10,
  max: 500,
  maxLines: 5,
  invalidMessage: ADMIN_MESSAGES.suspensionReasonInvalid,
  tooShortMessage: ADMIN_MESSAGES.reasonTooShort,
  tooLongMessage: ADMIN_MESSAGES.reasonTooLong,
  tooManyLinesMessage: ADMIN_MESSAGES.reasonTooManyLines,
});

test('suspension reason accepts plain-language reasons and normalizes whitespace', () => {
  for (const reason of ["Posted fake photos of another resort.", "User's repeated spam (3 reports).", 'First line\nSecond line']) {
    assert.equal(validateSuspensionReason(reason).ok, true);
  }
  assert.equal(validateSuspensionReason(' First line\nSecond line ').value, 'First line Second line');
});

test('suspension reason rejects forbidden characters, sequences, and excessive lines', () => {
  const rejected = [
    'a=b',
    '1=1',
    "x' OR '1'='1",
    'reason; DROP TABLE profiles',
    '<script>alert(1)</script>',
    '＝',
    '`',
    '${7*7}',
    '--',
    '/* */',
    '\u200B',
    '\u034F',
    '\u061C',
    undefined,
    '',
    '123456789',
    'R'.repeat(501),
    'line one\nline two\nline three\nline four\nline five\nline six',
    'line one\u2028line two\u2028line three\u2028line four\u2028line five\u2028line six',
  ];
  for (const reason of rejected) {
    const result = validateSuspensionReason(reason);
    assert.equal(result.ok, false, 'Expected input to be rejected');
    if (reason) assert.equal(result.error?.includes(reason), false, 'Error must not echo the input');
  }
  assert.deepEqual(SUSPENSION_REASON_TYPES, [
    'Violation of community guidelines',
    'Fake or misleading information',
    'Spam or abuse',
    'Suspected fraud',
    'Owner request',
    'Other',
  ]);
});