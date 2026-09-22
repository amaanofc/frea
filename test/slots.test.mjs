import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSlotPast,
  toDisplayTimeRange,
  todayCanonical,
  BOOKING_LEAD_MINUTES
} from '../server/time.js';

// ─── A slot earlier today is not bookable ───────────────
//
// The original check was isPastDate, which compares calendar days only. Every
// slot on the current day therefore stayed open however late it got: at 5pm
// the 2pm slot was still offered, still passed validation, and produced a
// confirmed booking for a call three hours in the past.

test('a slot earlier today has passed', () => {
  const today = todayCanonical();
  // Far enough back that this holds whatever time the suite runs at, except
  // in the first minutes after midnight — hence the guard below.
  const nowHour = Number(new Date().toLocaleString('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', hour12: false
  }));
  if (nowHour < 1) return; // just after midnight, nothing today has passed yet
  assert.equal(isSlotPast(today, '00:00'), true);
});

test('a slot later today has not passed', () => {
  const today = todayCanonical();
  const nowHour = Number(new Date().toLocaleString('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', hour12: false
  }));
  if (nowHour >= 23) return; // too late in the day for a "later today" slot
  assert.equal(isSlotPast(today, '23:59'), false);
});

test('a slot on a past date has passed', () => {
  assert.equal(isSlotPast('2020-01-06', '10:00'), true);
});

test('a slot starting within the lead time cannot be booked', () => {
  // Booking a call that begins in ninety seconds gives the mentor no notice
  // and an invite that arrives after it should have started.
  const soon = new Date(Date.now() + (BOOKING_LEAD_MINUTES - 2) * 60_000);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(soon);
  const get = t => parts.find(p => p.type === t).value;
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(soon);
  assert.equal(isSlotPast(date, `${get('hour')}:${get('minute')}`), true);
});

test('malformed input is treated as past rather than bookable', () => {
  // Failing open here would mean an unparseable time skipping the check.
  assert.equal(isSlotPast('not-a-date', '10:00'), true);
  assert.equal(isSlotPast(todayCanonical(), 'nonsense'), true);
});

// ─── Slots show their span, not just their start ────────
//
// Sessions are 20 minutes but only the start was displayed, so an hourly rota
// read as "2 PM" and left the student guessing what they had actually booked.

test('a slot renders as a start and end time', () => {
  assert.equal(toDisplayTimeRange('14:00'), '2:00 – 2:20 PM');
  assert.equal(toDisplayTimeRange('09:00'), '9:00 – 9:20 AM');
});

test('the meridiem is repeated only when the slot crosses it', () => {
  assert.equal(toDisplayTimeRange('11:45'), '11:45 AM – 12:05 PM');
  assert.equal(toDisplayTimeRange('23:50'), '11:50 PM – 12:10 AM');
});

test('an unparseable time renders as itself rather than throwing', () => {
  assert.equal(toDisplayTimeRange('nonsense'), 'nonsense');
});
