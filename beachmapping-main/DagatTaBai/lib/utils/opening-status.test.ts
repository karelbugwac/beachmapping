import assert from 'node:assert/strict';
import test from 'node:test';
import { getOpeningStatus, type OpeningHours } from './opening-status.ts';

const weekdayHours: OpeningHours = {
  Mon: '9:00 AM - 5:00 PM',
  Tue: '9:00 AM - 5:00 PM',
  Wed: '9:00 AM - 5:00 PM',
  Thu: '9:00 AM - 5:00 PM',
  Fri: '9:00 AM - 5:00 PM',
  Sat: 'Closed',
  Sun: 'Closed',
};

const manilaTime = (iso: string) => new Date(iso);

test('returns closed before the saved opening time', () => {
  assert.deepEqual(getOpeningStatus(weekdayHours, manilaTime('2024-06-03T00:59:00Z')), {
    state: 'closed', label: 'Closed', detail: 'Opens today at 9:00 AM',
  });
});

test('opens at the exact opening minute and stays open during the range', () => {
  assert.equal(getOpeningStatus(weekdayHours, manilaTime('2024-06-03T01:00:00Z')).state, 'open');
  assert.equal(getOpeningStatus(weekdayHours, manilaTime('2024-06-03T05:00:00Z')).state, 'open');
});

test('marks a range closing within 60 minutes as closing soon', () => {
  assert.deepEqual(getOpeningStatus(weekdayHours, manilaTime('2024-06-03T08:30:00Z')), {
    state: 'closing_soon', label: 'Closing soon', detail: 'Closes at 5:00 PM',
  });
});

test('closes at the exact closing minute and after closing', () => {
  assert.equal(getOpeningStatus(weekdayHours, manilaTime('2024-06-03T09:00:00Z')).state, 'closed');
  assert.equal(getOpeningStatus(weekdayHours, manilaTime('2024-06-03T09:01:00Z')).state, 'closed');
  assert.equal(getOpeningStatus(weekdayHours, manilaTime('2024-06-03T09:00:00Z')).detail, 'Opens tomorrow at 9:00 AM');
});

test('uses the previous day range for an overnight opening', () => {
  const overnightHours: OpeningHours = { Mon: '10:00 PM - 4:00 AM' };
  assert.equal(getOpeningStatus(overnightHours, manilaTime('2024-06-03T17:00:00Z')).state, 'open');
});

test('finds the next opening after a closed day', () => {
  const closedDayHours: OpeningHours = { Mon: 'Closed', Tue: '7:30 AM - 4:00 PM' };
  assert.deepEqual(getOpeningStatus(closedDayHours, manilaTime('2024-06-03T01:00:00Z')), {
    state: 'closed', label: 'Closed', detail: 'Opens tomorrow at 7:30 AM',
  });
});

test('checks multiple ranges in the same day', () => {
  const splitHours: OpeningHours = { Mon: '9:00 AM - 12:00 PM, 1:00 PM - 5:00 PM' };
  assert.equal(getOpeningStatus(splitHours, manilaTime('2024-06-03T06:00:00Z')).state, 'open');
});

test('treats a full-day range as open at its final saved minute', () => {
  const fullDayHours: OpeningHours = { Mon: '12:00 AM - 11:59 PM' };
  assert.equal(getOpeningStatus(fullDayHours, manilaTime('2024-06-03T15:59:00Z')).state, 'open');
});

test('returns unknown for missing or empty hours', () => {
  assert.equal(getOpeningStatus(null, manilaTime('2024-06-03T01:00:00Z')).state, 'unknown');
  assert.equal(getOpeningStatus({ Mon: '', Tue: '' }, manilaTime('2024-06-03T01:00:00Z')).state, 'unknown');
});
