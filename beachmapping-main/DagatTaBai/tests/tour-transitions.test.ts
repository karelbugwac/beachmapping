import assert from 'node:assert/strict';
import test from 'node:test';
import { canTransitionTour } from '../lib/services/tourTransitions';

const requestId = 'tour-request-1';

test('allows owner submission and admin review outcomes', () => {
  assert.equal(canTransitionTour({
    actor: 'owner', fromStatus: 'in_progress', toStatus: 'review',
    requestId, currentRequestId: requestId,
  }), true);
  assert.equal(canTransitionTour({
    actor: 'admin', fromStatus: 'review', toStatus: 'approved',
    requestId, currentRequestId: requestId,
  }), true);
  assert.equal(canTransitionTour({
    actor: 'admin', fromStatus: 'review', toStatus: 'in_progress',
    requestId, currentRequestId: requestId, note: 'Changes requested',
  }), true);
});

test('rejects unauthorized, skipped, stale, and unknown transitions', () => {
  const invalidCases = [
    { actor: 'owner', fromStatus: 'review', toStatus: 'approved' },
    { actor: 'owner', fromStatus: 'in_progress', toStatus: 'approved' },
    { actor: 'admin', fromStatus: 'approved', toStatus: 'in_progress' },
    { actor: 'admin', fromStatus: 'review', toStatus: 'in_progress', note: '' },
    { actor: 'admin', fromStatus: 'unknown', toStatus: 'approved' },
  ];

  for (const transition of invalidCases) {
    assert.equal(canTransitionTour({
      ...transition,
      requestId,
      currentRequestId: requestId,
    }), false);
  }

  assert.equal(canTransitionTour({
    actor: 'owner', fromStatus: 'in_progress', toStatus: 'review',
    requestId, currentRequestId: 'stale-request',
  }), false);
});
