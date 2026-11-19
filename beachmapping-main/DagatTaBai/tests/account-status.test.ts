import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionAccountStatus, isSuspensionActive } from '../lib/utils/account-status';

test('only the requested account status transitions are allowed', () => {
  assert.equal(canTransitionAccountStatus('active', 'under_review'), true);
  assert.equal(canTransitionAccountStatus('active', 'suspended'), true);
  assert.equal(canTransitionAccountStatus('under_review', 'active'), true);
  assert.equal(canTransitionAccountStatus('under_review', 'suspended'), true);
  assert.equal(canTransitionAccountStatus('suspended', 'active'), true);
  assert.equal(canTransitionAccountStatus('suspended', 'under_review'), false);
  assert.equal(canTransitionAccountStatus('active', 'active'), false);
});

test('expired suspensions are inactive', () => {
  assert.equal(isSuspensionActive('suspended', '2020-01-01T00:00:00.000Z'), false);
  assert.equal(isSuspensionActive('suspended', null), true);
  assert.equal(isSuspensionActive('under_review', null), false);
});
