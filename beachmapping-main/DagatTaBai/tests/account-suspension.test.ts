import assert from 'node:assert/strict';
import test from 'node:test';
import { isAccountSuspended } from '../lib/utils/account-suspension';

test('active accounts and expired suspensions are treated as active', () => {
  const now = Date.parse('2026-11-14T12:00:00.000Z');
  assert.equal(isAccountSuspended({ status: 'active', suspension_ends_at: null }, now), false);
  assert.equal(isAccountSuspended({ status: 'suspended', suspension_ends_at: '2026-11-14T11:59:59.000Z' }, now), false);
});

test('indefinite and future suspensions remain active', () => {
  const now = Date.parse('2026-11-14T12:00:00.000Z');
  assert.equal(isAccountSuspended({ status: 'suspended', suspension_ends_at: null }, now), true);
  assert.equal(isAccountSuspended({ status: 'suspended', suspension_ends_at: '2026-11-15T00:00:00.000Z' }, now), true);
});
