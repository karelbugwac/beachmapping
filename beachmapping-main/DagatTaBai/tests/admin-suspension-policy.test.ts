import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isCurrentStatusVersion,
  isForbiddenSuspensionTarget,
  validateSuspensionEndDate,
} from '../lib/server/suspension-policy';
import { roleAuthorizationFailureStatus } from '../lib/supabase/authorization';

const adminId = 'c0a80101-0000-4000-8000-000000000001';
const now = Date.parse('2026-01-01T00:00:00.000Z');

test('suspension targets exclude admins and the acting admin', () => {
  assert.equal(isForbiddenSuspensionTarget({ id: adminId, role: 'user' }, adminId), true);
  assert.equal(isForbiddenSuspensionTarget({ id: 'c0a80101-0000-4000-8000-000000000002', role: 'admin' }, adminId), true);
  assert.equal(isForbiddenSuspensionTarget({ id: 'c0a80101-0000-4000-8000-000000000003', role: 'user' }, adminId), false);
  assert.equal(isForbiddenSuspensionTarget({ id: 'c0a80101-0000-4000-8000-000000000004', role: 'beach_owner' }, adminId), false);
  assert.equal(isForbiddenSuspensionTarget({ id: 'c0a80101-0000-4000-8000-000000000005', role: 'guest' }, adminId), true);
});

test('suspension end dates must be valid ISO dates in the future and within one year', () => {
  assert.equal(validateSuspensionEndDate(null, now).ok, true);
  assert.equal(validateSuspensionEndDate('2026-01-01', now).ok, false);
  assert.equal(validateSuspensionEndDate('2025-12-31', now).ok, false);
  assert.equal(validateSuspensionEndDate('2026-02-31', now).ok, false);
  assert.equal(validateSuspensionEndDate('2027-01-02', now).ok, false);
  assert.deepEqual(validateSuspensionEndDate('2026-12-31', now), {
    ok: true,
    value: '2026-12-31T23:59:59.999Z',
  });
  assert.equal(validateSuspensionEndDate('2026-12-31T23:59:59Z', now).ok, false);
});

test('status changes reject stale versions', () => {
  assert.equal(isCurrentStatusVersion('2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'), true);
  assert.equal(isCurrentStatusVersion('2026-01-01T00:00:00.000Z', '2025-12-31T00:00:00.000Z'), false);
  assert.equal(isCurrentStatusVersion(null, undefined), true);
});

test('authenticated non-admin roles receive a 403 for admin-only actions', () => {
  assert.equal(roleAuthorizationFailureStatus('user', ['admin']), 403);
  assert.equal(roleAuthorizationFailureStatus('beach_owner', ['admin']), 403);
  assert.equal(roleAuthorizationFailureStatus('admin', ['admin']), null);
});