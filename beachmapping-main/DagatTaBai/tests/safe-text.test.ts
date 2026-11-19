import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSafeText } from '../lib/validation/safe-text';

test('safe text accepts ordinary reasons', () => {
  assert.deepEqual(validateSafeText('Posted fake photos of another resort.', { min: 10 }), {
    ok: true,
    value: 'Posted fake photos of another resort.',
    error: null,
  });
  assert.equal(validateSafeText("User's repeated spam (3 reports).", { min: 10 }).ok, true);
});

test('safe text rejects SQL, markup, shell, wildcard, and invisible characters', () => {
  const rejected = [
    'a=b',
    '1=1',
    "x' OR '1'='1",
    '＝',
    '<script>alert(1)</script>',
    'reason; DROP TABLE profiles',
    '`',
    '${7*7}',
    '%27',
    '--',
    '/* */',
    '\u200B',
    '\u0000',
    '\u202E',
    '\t',
  ];
  for (const value of rejected) {
    assert.equal(validateSafeText(value).ok, false, `Expected input to be rejected`);
  }
});

test('safe text enforces the requested length bounds', () => {
  assert.equal(validateSafeText('123456789', { min: 10 }).ok, false);
  assert.equal(validateSafeText('x'.repeat(501), { max: 500 }).ok, false);
});

test('safe text normalizes and collapses whitespace', () => {
  assert.equal(validateSafeText('  Some   valid reason  ', { min: 10 }).value, 'Some valid reason');
});
