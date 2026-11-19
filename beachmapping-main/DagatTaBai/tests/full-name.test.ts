import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FULL_NAME_MESSAGES,
  validateFullName,
} from '../lib/validation/fullName.ts';

test('accepts and normalizes valid full names', () => {
  const acceptedNames = [
    'Juan Dela Cruz',
    'Ma. Cristina Santos',
    'José Ñoño',
    'Anne-Marie',
    'Jr. Santos',
  ];

  for (const name of acceptedNames) {
    assert.equal(validateFullName(name).ok, true, name);
  }

  assert.equal(validateFullName('  Juan   Dela Cruz  ').value, 'Juan Dela Cruz');
  assert.equal(validateFullName('Jose\u0301 Ñoño').value, 'José Ñoño');
});

test('rejects disallowed, malformed, too-short, and too-long names', () => {
  const rejectedNames = [
    'Juan123',
    "Robert'); DROP TABLE users;--",
    "' OR '1'='1",
    '<script>alert(1)</script>',
    'Juan;',
    'Juan@Cruz',
    'John\u200BDoe',
    '😀 Juan',
    '..',
    '---',
    'A',
    'A'.repeat(81),
    '',
  ];

  for (const name of rejectedNames) {
    assert.equal(validateFullName(name).ok, false, JSON.stringify(name));
  }

  assert.equal(validateFullName('').error, FULL_NAME_MESSAGES.required);
  assert.equal(validateFullName('A').error, FULL_NAME_MESSAGES.tooShort);
  assert.equal(validateFullName('A'.repeat(81)).error, FULL_NAME_MESSAGES.tooLong);
  assert.equal(validateFullName('Juan;').error, FULL_NAME_MESSAGES.invalidCharacters);
});
