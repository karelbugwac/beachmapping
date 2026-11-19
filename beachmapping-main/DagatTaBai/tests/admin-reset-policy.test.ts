import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedAdminResetTarget } from '../lib/server/admin-reset-policy';

test('password reset is limited to regular users', () => {
  assert.equal(isAllowedAdminResetTarget('reset_password', 'user'), true);
  assert.equal(isAllowedAdminResetTarget('reset_password', 'beach_owner'), false);
  assert.equal(isAllowedAdminResetTarget('reset_password', 'admin'), false);
});

test('PIN reset is limited to beach owners', () => {
  assert.equal(isAllowedAdminResetTarget('reset_pin', 'beach_owner'), true);
  assert.equal(isAllowedAdminResetTarget('reset_pin', 'user'), false);
  assert.equal(isAllowedAdminResetTarget('reset_pin', 'beach_manager'), false);
});
