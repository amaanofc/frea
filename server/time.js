// ─────────────────────────────────────────────
// frea — Canonical date, time & schedule formats
// ─────────────────────────────────────────────
//
// One format, used everywhere, so the booking engine and the schedule editor
// can never drift apart again:
//
//   date           "YYYY-MM-DD"                     (ISO, always)
//   time           "HH:MM"                          (24-hour, always)
//   weeklySchedule { "0".."6": ["17:00", ...] }     (0 = Sunday … 6 = Saturday)
//
// Anything shown to a human is derived at the edge with toDisplayTime /
// toDisplayDate. Anything stored or compared uses the canonical form.

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SESSION_MINUTES = 20;

/** "2:30 PM" | "14:30" | "2.30pm" -> "14:30". Returns null if unparseable. */
export function toCanonicalTime(input) {
  if (input == null) return null;
  const raw = String(input).trim().toLowerCase();
  if (!raw) return null;

  const m = raw.match(/^(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?$/);
  if (!m) return null;

  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  const meridiem = m[3];

  if (Number.isNaN(hour) || Number.isNaN(minute) || minute > 59) return null;

  if (meridiem === 'am') {
    if (hour === 12) hour = 0;
  } else if (meridiem === 'pm') {
    if (hour !== 12) hour += 12;
  }

  if (hour > 23) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** "14:30" -> "2:30 PM" */
export function toDisplayTime(canonical) {
  const t = toCanonicalTime(canonical);
  if (!t) return String(canonical || '');
  const [h, min] = t.split(':').map(Number);
  const meridiem = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(min).padStart(2, '0')} ${meridiem}`;
}

/** True for a well-formed "YYYY-MM-DD" that is a real calendar date. */
export function isCanonicalDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
}

/**
 * Accepts "2026-09-21" or a legacy display string like "Mon 21 Sep" and
 * returns canonical ISO. `referenceYear` disambiguates legacy strings.
 */
export function toCanonicalDate(input, referenceYear = new Date().getFullYear()) {
  if (input == null) return null;
  const raw = String(input).trim();
  if (isCanonicalDate(raw)) return raw;

  // Legacy display form: "Mon 21 Sep" / "21 Sep"
  const m = raw.match(/(\d{1,2})\s+([A-Za-z]{3})/);
  if (m) {
    const day = parseInt(m[1], 10);
    const monthIdx = MONTH_SHORT.findIndex(x => x.toLowerCase() === m[2].toLowerCase());
    if (monthIdx !== -1 && day >= 1 && day <= 31) {
      return `${referenceYear}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  return null;
}

/** "2026-09-21" -> "Mon 21 Sep" */
export function toDisplayDate(canonicalDate) {
  if (!isCanonicalDate(canonicalDate)) return String(canonicalDate || '');
  const [y, m, d] = canonicalDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${DAY_SHORT[dt.getUTCDay()]} ${d} ${MONTH_SHORT[m - 1]}`;
}

/** "2026-09-21" -> "Monday 21 September 2026" */
export function toLongDisplayDate(canonicalDate) {
  if (!isCanonicalDate(canonicalDate)) return String(canonicalDate || '');
  const [y, m, d] = canonicalDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const longMonths = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${DAY_NAMES[dt.getUTCDay()]} ${d} ${longMonths[m - 1]} ${y}`;
}

/** Day-of-week index (0 = Sun) for a canonical date. */
export function dayIndexFor(canonicalDate) {
  const [y, m, d] = canonicalDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Today in London, as a canonical date string. */
export function todayCanonical() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const get = t => parts.find(p => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Is this canonical date strictly before today (London)? */
export function isPastDate(canonicalDate) {
  return canonicalDate < todayCanonical();
}

/**
 * Normalises any schedule shape we have ever written into the canonical one.
 * Handles: day names ("Monday"), short names ("Mon"), numeric indices,
 * 12-hour times, and 24-hour times. Invalid entries are dropped, not kept.
 */
export function normaliseSchedule(schedule) {
  const out = {};
  if (!schedule || typeof schedule !== 'object') return out;

  for (const [key, value] of Object.entries(schedule)) {
    if (!Array.isArray(value)) continue;

    let idx = null;
    const k = String(key).trim();

    if (/^[0-6]$/.test(k)) {
      idx = parseInt(k, 10);
    } else {
      const lower = k.toLowerCase();
      const full = DAY_NAMES.findIndex(d => d.toLowerCase() === lower);
      if (full !== -1) idx = full;
      else {
        const short = DAY_SHORT.findIndex(d => d.toLowerCase() === lower);
        if (short !== -1) idx = short;
      }
    }
    if (idx === null) continue;

    const times = value
      .map(toCanonicalTime)
      .filter(Boolean)
      .filter((t, i, arr) => arr.indexOf(t) === i)
      .sort();

    if (times.length) out[String(idx)] = times;
  }
  return out;
}

/** Slot start/end as real UTC Date objects. UK local time in, UTC out. */
export function slotToUtcRange(canonicalDate, canonicalTime, durationMinutes = SESSION_MINUTES) {
  const [y, m, d] = canonicalDate.split('-').map(Number);
  const [hh, mm] = canonicalTime.split(':').map(Number);

  // Resolve the UTC offset London is on for that calendar day, then apply it.
  const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const londonNoon = new Date(probe.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  const utcNoon = new Date(probe.toLocaleString('en-US', { timeZone: 'UTC' }));
  const offsetMinutes = Math.round((londonNoon - utcNoon) / 60000);

  const start = new Date(Date.UTC(y, m - 1, d, hh, mm) - offsetMinutes * 60000);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return { start, end, offsetMinutes };
}

/**
 * How close to a slot's start we stop letting it be booked.
 *
 * Zero would technically work, but a student booking a call that begins in
 * ninety seconds gets a mentor who has had no notice and an invite that lands
 * after the call should have started. Ten minutes is short enough to still
 * feel same-day and long enough for both sides to see the email.
 */
export const BOOKING_LEAD_MINUTES = 10;

/**
 * Has this slot's start already gone by — or is it too soon to book?
 *
 * `isPastDate` only ever compared calendar days, so every slot on the current
 * day stayed open no matter what the clock said: at 5pm the 2pm slot was
 * still offered, still bookable, and produced a confirmed booking for a call
 * three hours in the past. This compares the actual instant, resolved through
 * London's offset, so BST and GMT both behave.
 */
export function isSlotPast(canonicalDate, canonicalTime, leadMinutes = BOOKING_LEAD_MINUTES) {
  if (!isCanonicalDate(canonicalDate)) return true;
  const time = toCanonicalTime(canonicalTime);
  if (!time) return true;
  const { start } = slotToUtcRange(canonicalDate, time);
  return start.getTime() <= Date.now() + leadMinutes * 60_000;
}

/**
 * "14:00" -> "2:00 – 2:20 PM".
 *
 * Sessions are twenty minutes but only the start was ever shown, so a rota of
 * hourly starts read as "2 PM" and left the student guessing whether they had
 * booked the hour, the half hour, or something else. Showing the span is the
 * difference between knowing what you booked and assuming.
 */
export function toDisplayTimeRange(canonicalTime, durationMinutes = SESSION_MINUTES) {
  const start = toCanonicalTime(canonicalTime);
  if (!start) return String(canonicalTime || '');

  const [h, m] = start.split(':').map(Number);
  const endTotal = h * 60 + m + durationMinutes;
  const end = `${String(Math.floor(endTotal / 60) % 24).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;

  const startLabel = toDisplayTime(start);
  const endLabel = toDisplayTime(end);
  // "2:00 – 2:20 PM" rather than "2:00 PM – 2:20 PM" when both sit in the
  // same half of the day; the repeated meridiem is just noise.
  const startMeridiem = startLabel.slice(-2);
  const endMeridiem = endLabel.slice(-2);
  return startMeridiem === endMeridiem
    ? `${startLabel.slice(0, -3)} – ${endLabel}`
    : `${startLabel} – ${endLabel}`;
}

/** Human timezone label for a given date (BST in summer, GMT in winter). */
export function ukTimezoneLabel(canonicalDate) {
  const { offsetMinutes } = slotToUtcRange(canonicalDate, '12:00');
  return offsetMinutes === 0 ? 'GMT (UK time)' : 'BST (UK time)';
}

export { SESSION_MINUTES };
