// ─────────────────────────────────────────────
// frea — RFC 5545 iCalendar (.ics) Generator
// ─────────────────────────────────────────────

/**
 * Parses user-friendly date string like "Mon 21 Sep" or "2026-09-21" and time like "2:30 PM"
 * and returns UTC ISO formatted start and end strings for calendar events.
 */
export function formatCalendarDates(dateStr, timeStr) {
  const currentYear = new Date().getFullYear();
  let targetDate = new Date();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    targetDate = new Date(Date.UTC(y, m - 1, d));
  } else {
    // Parse "Mon 21 Sep" or "21 Sep"
    const match = dateStr.match(/(\d{1,2})\s+([A-Za-z]{3})/);
    if (match) {
      const day = parseInt(match[1], 10);
      const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      const monthIdx = monthNames.indexOf(match[2].toLowerCase());
      if (monthIdx !== -1) {
        targetDate = new Date(Date.UTC(currentYear, monthIdx, day));
      }
    }
  }

  // Parse time "2:30 PM" or "10:00 AM"
  let hours = 14;
  let minutes = 0;
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
    const meridiem = (timeMatch[3] || '').toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  // Set time (treating BST as UTC+1 roughly, or keep UK local time)
  // For UK summer (BST), UTC is London time minus 1 hour
  const startYear = targetDate.getUTCFullYear();
  const startMonth = targetDate.getUTCMonth();
  const startDay = targetDate.getUTCDate();

  // Create date object
  const startEvent = new Date(Date.UTC(startYear, startMonth, startDay, hours - 1, minutes)); // Adjusted for BST
  const endEvent = new Date(startEvent.getTime() + 20 * 60 * 1000); // 20 minutes duration

  const toIcsString = (d) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return {
    startIcs: toIcsString(startEvent),
    endIcs: toIcsString(endEvent),
    startDateObj: startEvent,
    endDateObj: endEvent
  };
}

/**
 * Generate standard RFC 5545 .ics calendar content
 */
export function generateICSContent({ booking, mentor }) {
  const { startIcs, endIcs } = formatCalendarDates(booking.date, booking.time);
  const nowIcs = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = booking.id || `frea-${Date.now()}@frea.ac.uk`;

  const summary = `Peer Mentoring with ${mentor.name} (frea)`;
  const description = `20-minute 1-on-1 peer mentoring session with ${mentor.name} (${mentor.major}, ${mentor.university}).\\n\\nJoin Google Meet: ${booking.googleMeetUrl}\\n\\nSenior tip from ${mentor.name}: ${mentor.topTip || 'Bring 2-3 specific questions!'}\\n\\nOrganized via frea — 100% free UK student mentoring.`;
  const location = booking.googleMeetUrl || 'Google Meet';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//frea//UK Peer Mentoring Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowIcs}`,
    `DTSTART:${startIcs}`,
    `DTEND:${endIcs}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `ORGANIZER;CN="frea UK Mentoring":mailto:sessions@frea.ac.uk`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN="${booking.studentEmail}":mailto:${booking.studentEmail}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: frea mentoring session starts in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}
