import assert from 'node:assert/strict';
import test from 'node:test';
import { roleAuthorizationFailureStatus } from '../lib/supabase/authorization';
import { getSafeInternalRedirect } from '../lib/utils/safe-redirect';

test('role authorization requires an exact role match', () => {
  assert.equal(roleAuthorizationFailureStatus('admin', ['admin']), null);
  assert.equal(roleAuthorizationFailureStatus('user', ['admin']), 403);
  assert.equal(roleAuthorizationFailureStatus(null, ['admin']), 403);
});

test('post-login redirects are restricted to safe same-origin paths', () => {
  assert.equal(getSafeInternalRedirect('/profile/reviews?sort=new'), '/profile/reviews?sort=new');
  assert.equal(getSafeInternalRedirect('https://example.com/private', '/login'), '/login');
  assert.equal(getSafeInternalRedirect('//example.com/private', '/login'), '/login');
  assert.equal(getSafeInternalRedirect('/\\example.com/private', '/login'), '/login');
});
