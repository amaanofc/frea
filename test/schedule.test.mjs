import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION_MINUTES,
  slotsToWindows,
  windowsToSlots,
  isBookableWindow,
  nextWindowAfter
} from '../src/schedule.js';

// ─── Windows in the editor, slots in the store ──────────
//
// The mentor sets "Monday 5 to 7"; the booking engine, the month a student
// sees and createBooking all still read individual starts. These two
// conversions are the whole of that bargain, so the round trip has to be
// exact — a mentor reopening the editor must see the window they set, not a
// smeared version of it.

test('a window becomes every whole session inside it', () => {
  assert.deepEqual(
    windowsToSlots([{ start: '17:00', end: '19:00' }]),
    ['17:00', '17:20', '17:40', '18:00', '18:20', '18:40']
  );
});

test('a trailing part-session is not offered', () => {
  // 17:00–17:50 holds two whole chats; the last ten minutes are not a third.
  assert.deepEqual(windowsToSlots([{ start: '17:00', end: '17:50' }]), ['17:00', '17:20']);
});

test('a window too short for one session offers nothing', () => {
  assert.deepEqual(windowsToSlots([{ start: '17:00', end: '17:10' }]), []);
});

test('slots rebuild into the window they came from', () => {
  const windows = [{ start: '17:00', end: '19:00' }];
  assert.deepEqual(slotsToWindows(windowsToSlots(windows)), windows);
});

test('a gap splits one window into two', () => {
  assert.deepEqual(
    slotsToWindows(['09:00', '09:20', '14:00']),
    [{ start: '09:00', end: '09:40' }, { start: '14:00', end: '14:20' }]
  );
});

test('slots set before this editor existed come back as single-chat windows', () => {
  // The old editor wrote isolated starts. Each is a window of one session,
  // which is what it meant, and can then be widened rather than retyped.
  assert.deepEqual(
    slotsToWindows(['17:00', '18:30']),
    [{ start: '17:00', end: '17:20' }, { start: '18:30', end: '18:50' }]
  );
});

test('overlapping windows do not offer the same time twice', () => {
  assert.deepEqual(
    windowsToSlots([{ start: '17:00', end: '18:00' }, { start: '17:40', end: '18:20' }]),
    ['17:00', '17:20', '17:40', '18:00']
  );
});

test('windows are expanded in time order however they were listed', () => {
  assert.deepEqual(
    windowsToSlots([{ start: '18:00', end: '18:20' }, { start: '09:00', end: '09:20' }]),
    ['09:00', '18:00']
  );
});

test('an end before its start is refused rather than silently emptying the day', () => {
  assert.equal(isBookableWindow({ start: '19:00', end: '17:00' }), false);
  assert.equal(isBookableWindow({ start: '17:00', end: '17:10' }), false);
  assert.equal(isBookableWindow({ start: '17:00', end: '17:20' }), true);
});

test('nonsense in never becomes a bookable slot', () => {
  assert.deepEqual(windowsToSlots([{ start: 'later', end: 'whenever' }]), []);
  assert.deepEqual(windowsToSlots([null, undefined]), []);
  assert.deepEqual(slotsToWindows(['not-a-time']), []);
  assert.deepEqual(slotsToWindows(null), []);
});

test('a first window is a weekday evening, and the next follows the last', () => {
  assert.deepEqual(nextWindowAfter([]), { start: '17:00', end: '19:00' });
  assert.deepEqual(nextWindowAfter([{ start: '09:00', end: '11:00' }]), { start: '12:00', end: '14:00' });
});

test('a day of windows survives a full round trip unchanged', () => {
  const windows = [{ start: '09:00', end: '11:00' }, { start: '17:00', end: '19:30' }];
  const slots = windowsToSlots(windows);
  assert.equal(slots.length, 6 + 7);
  assert.deepEqual(slotsToWindows(slots), [
    { start: '09:00', end: '11:00' },
    // 17:00–19:30 holds seven whole chats; the last ends at 19:20.
    { start: '17:00', end: '19:20' }
  ]);
});

test('the session length the editor promises is the one it divides by', () => {
  assert.equal(SESSION_MINUTES, 20);
});
