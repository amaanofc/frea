// ─────────────────────────────────────────────
// frea — RFC 5545 iCalendar (.ics) generator
// ─────────────────────────────────────────────
//
// Works from canonical booking fields (ISO date + 24-hour time), resolves the
// real UK offset for that date, and emits UTC stamps. The same file is attached
// to both the student's and the mentor's confirmation email, so a single invite
// lands in whichever calendar each of them actually uses.

import { slotToUtcRange, toLongDisplayDate, toDisplayTime, SESSION_MINUTES } from './time.js';

function stampUtc(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** RFC 5545 §3.3.11: escape , ; \ and newlines in TEXT values. */
function escapeText(value) {
  return String(value == null ? '' : value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** RFC 5545 §3.1: fold lines at 75 octets. */
function fold(line) {
  if (Buffer.byteLength(line, 'utf8') <= 75) return line;
  const out = [];
  let current = '';
  for (const char of line) {
    const candidate = current + char;
    const limit = out.length === 0 ? 75 : 74; // continuation lines carry a leading space
    if (Buffer.byteLength(candidate, 'utf8') > limit) {
      out.push(current);
      current = char;
    } else {
      current = candidate;
    }
  }
  if (current) out.push(current);
  return out.map((l, i) => (i === 0 ? l : ` ${l}`)).join('\r\n');
}

/**
 * @param {object} booking canonical booking record
 * @param {object} mentor  mentor record
 * @param {'REQUEST'|'CANCEL'} method
 */
export function generateICSContent({ booking, mentor, method = 'REQUEST' }) {
  const { start, end } = slotToUtcRange(booking.date, booking.time, SESSION_MINUTES);
  const now = new Date();

  const meetingUrl = booking.meetingUrl || booking.googleMeetUrl || '';
  const mentorName = mentor?.name || booking.mentorName || 'frea mentor';
  const mentorEmail = mentor?.email || booking.mentorEmail || '';

  const summary = `frea: 20-min mentoring with ${mentorName}`;
  const description = [
    `Your 20-minute 1-on-1 peer mentoring session with ${mentorName}`,
    mentor?.major && mentor?.university ? `${mentor.major} · ${mentor.university}` : '',
    '',
    meetingUrl ? `Join the call: ${meetingUrl}` : '',
    '',
    mentor?.topTip ? `${mentorName}'s top tip: ${mentor.topTip}` : '',
    '',
    `Booking reference: ${booking.id}`,
    `${toLongDisplayDate(booking.date)} at ${toDisplayTime(booking.time)} (${booking.timezone || 'UK time'})`
  ].filter(Boolean).join('\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//frea//UK Peer Mentoring//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${booking.id}@joinfrea.com`,
    `DTSTAMP:${stampUtc(now)}`,
    `DTSTART:${stampUtc(start)}`,
    `DTEND:${stampUtc(end)}`,
    `SEQUENCE:${method === 'CANCEL' ? 1 : 0}`,
    `STATUS:${method === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED'}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    meetingUrl ? `LOCATION:${escapeText(meetingUrl)}` : 'LOCATION:Online',
    meetingUrl ? `URL:${escapeText(meetingUrl)}` : '',
    'ORGANIZER;CN=frea:mailto:sessions@joinfrea.com',
    `ATTENDEE;CN=${escapeText(booking.studentEmail)};ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:${booking.studentEmail}`,
    mentorEmail
      ? `ATTENDEE;CN=${escapeText(mentorName)};ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:${mentorEmail}`
      : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(`Your frea call with ${mentorName} starts in 15 minutes`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean);

  return lines.map(fold).join('\r\n') + '\r\n';
}

/**
 * "Add to calendar" links for people who would rather click than open a file.
 * Both accept UTC stamps directly.
 */
export function calendarLinks({ booking, mentor }) {
  const { start, end } = slotToUtcRange(booking.date, booking.time, SESSION_MINUTES);
  const mentorName = mentor?.name || booking.mentorName || 'frea mentor';
  const meetingUrl = booking.meetingUrl || booking.googleMeetUrl || '';

  const title = `frea: 20-min mentoring with ${mentorName}`;
  const details = `Join the call: ${meetingUrl}\n\nBooking reference: ${booking.id}`;

  const google = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${stampUtc(start)}/${stampUtc(end)}`,
    details,
    location: meetingUrl || 'Online'
  }).toString();

  const outlook = 'https://outlook.live.com/calendar/0/deeplink/compose?' + new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: details,
    location: meetingUrl || 'Online'
  }).toString();

  return { google, outlook };
}

export { SESSION_MINUTES };
