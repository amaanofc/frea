// ─────────────────────────────────────────────
// frea — windows in the editor, slots in the store
// ─────────────────────────────────────────────
//
// A mentor thinks "I'm free Monday evening", not "I offer 17:00, 17:20, 17:40,
// 18:00, 18:20 and 18:40" — which is what the editor used to make them type,
// one time at a time. Every scheduling tool worth copying takes a start and an
// end and works the rest out.
//
// The stored shape does not change. The booking engine, the month a student
// sees and `slotsForDate` on the server all speak individual starts, so a
// window is expanded on the way in and rebuilt on the way out. Rebuilding is
// exact for anything this editor wrote, because a run of consecutive starts one
// session apart is precisely what a window expands to.
//
// Pure on purpose: no DOM, so the rules can be tested directly rather than
// through a rendered page.

export const SESSION_MINUTES = 20;

export function minutesOfTime(t) {
  const [h, m] = String(t).split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return (h * 60) + m;
}

export function timeOfMinutes(total) {
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
}

/**
 * Consecutive starts one session apart are one window; a gap starts another.
 *
 * Slots a mentor set before this editor existed are usually isolated, so they
 * come back as a run of single-session windows — which is exactly what they
 * mean, and they can then be widened by dragging an end time rather than by
 * adding five more.
 */
export function slotsToWindows(slots) {
  const sorted = [...(slots || [])].filter(Boolean).sort();
  const windows = [];
  for (const slot of sorted) {
    const start = minutesOfTime(slot);
    if (!Number.isFinite(start)) continue;
    const last = windows[windows.length - 1];
    if (last && minutesOfTime(last.end) === start) {
      last.end = timeOfMinutes(start + SESSION_MINUTES);
    } else {
      windows.push({ start: slot, end: timeOfMinutes(start + SESSION_MINUTES) });
    }
  }
  return windows;
}

/**
 * Every whole session that fits, de-duplicated.
 *
 * A window too short to hold one session yields nothing, which is what stops
 * 17:00–17:10 from quietly becoming a bookable twenty minutes. Overlapping
 * windows collapse into one set of starts rather than offering the same time
 * twice.
 */
export function windowsToSlots(windows) {
  const out = [];
  for (const w of windows || []) {
    const start = minutesOfTime(w?.start);
    const end = minutesOfTime(w?.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    for (let t = start; t + SESSION_MINUTES <= end; t += SESSION_MINUTES) out.push(timeOfMinutes(t));
  }
  return [...new Set(out)].sort();
}

/** Long enough to hold at least one chat. */
export function isBookableWindow(w) {
  const start = minutesOfTime(w?.start);
  const end = minutesOfTime(w?.end);
  return Number.isFinite(start) && Number.isFinite(end) && end - start >= SESSION_MINUTES;
}

/** A sensible next window: after the last one, or a weekday evening. */
export function nextWindowAfter(windows) {
  const last = (windows || [])[windows.length - 1];
  if (!last) return { start: '17:00', end: '19:00' };
  const start = minutesOfTime(last.end) + 60;
  return { start: timeOfMinutes(start), end: timeOfMinutes(start + 120) };
}
