import assert from 'node:assert/strict';
import test from 'node:test';
import { getApplicationNamePrefill } from '../lib/utils/application-name-prefill';
import {
  canTransitionApplication,
  getApplicationStep,
  isCurrentApplicationVersion,
} from '../lib/utils/application-progress';

test('account name prefill prioritizes profile then auth metadata and never email', () => {
  assert.equal(getApplicationNamePrefill({ profileName: '  Juan   Dela Cruz ' }), 'Juan Dela Cruz');
  assert.equal(getApplicationNamePrefill({ metadataName: ' Maria Santos ' }), 'Maria Santos');
  assert.equal(getApplicationNamePrefill({}), null);
});

test('account name prefill never overwrites a draft or typed value', () => {
  assert.equal(getApplicationNamePrefill({ profileName: 'Juan Dela Cruz', currentValue: 'Existing Draft' }), null);
  assert.equal(getApplicationNamePrefill({ profileName: 'Juan Dela Cruz', dirty: true }), null);
  assert.equal(getApplicationNamePrefill({ profileName: 'Juan Dela Cruz', hasSavedDraft: true }), null);
  assert.equal(getApplicationNamePrefill({ profileName: 'Juan Dela Cruz', dirty: true, currentValue: 'Typed Name' }), null);
});

test('application statuses map to the progress tracker', () => {
  assert.equal(getApplicationStep('draft'), 'in_progress');
  assert.equal(getApplicationStep('needs_changes'), 'in_progress');
  assert.equal(getApplicationStep('pending'), 'review');
  assert.equal(getApplicationStep('under_review'), 'review');
  assert.equal(getApplicationStep('approved'), 'approved');
  assert.equal(getApplicationStep('rejected'), 'rejected');
  assert.equal(getApplicationStep('unknown'), 'in_progress');
});

test('application transition policy allows only the intended actor transitions', () => {
  assert.equal(canTransitionApplication('draft', 'pending', 'applicant'), true);
  assert.equal(canTransitionApplication('needs_changes', 'pending', 'applicant'), true);
  assert.equal(canTransitionApplication('pending', 'under_review', 'admin'), true);
  assert.equal(canTransitionApplication('under_review', 'approved', 'admin'), true);
  assert.equal(canTransitionApplication('under_review', 'needs_changes', 'admin', 'Please update your documents.'), true);
  assert.equal(canTransitionApplication('under_review', 'rejected', 'admin', 'Documents do not match.'), true);
  assert.equal(canTransitionApplication('draft', 'approved', 'applicant'), false);
  assert.equal(canTransitionApplication('pending', 'approved', 'admin'), false);
  assert.equal(canTransitionApplication('under_review', 'needs_changes', 'admin'), false);
  assert.equal(canTransitionApplication('under_review', 'rejected', 'admin', '  '), false);
  assert.equal(canTransitionApplication('unknown', 'approved', 'admin'), false);
});

test('application status version check rejects missing and stale versions', () => {
  assert.equal(isCurrentApplicationVersion('2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'), true);
  assert.equal(isCurrentApplicationVersion('2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z'), false);
  assert.equal(isCurrentApplicationVersion(null, undefined), false);
});
