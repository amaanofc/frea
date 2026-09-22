// ─────────────────────────────────────────────
// frea — the four journeys, end to end
// ─────────────────────────────────────────────
//
// Walks the complete product as described, against a running API:
//
//   1. mentee finds a mentor and books a chat, with email + calendar
//   2. mentee finds, unlocks and downloads resources
//   3. mentee applies to become a mentor
//   4. mentor signs in, builds a profile, sets availability, publishes and prices
//
// Requires:  npm run server

import fs from 'fs';
import { seedIdentity } from './_identity.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = 'http://localhost:3001/api';

import { localOnly } from './_local-only.mjs';
localOnly(API, { suite: 'journeys.e2e.mjs' });
const DB = path.join(__dirname, '..', 'server', 'data.json');

let pass = 0, fail = 0;
const ok = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`   ✓ ${label}`); }
  else { fail++; console.log(`   ✗ ${label}  ${detail}`); }
};
const step = (n) => console.log(`\n${n}`);

const readDb = () => JSON.parse(fs.readFileSync(DB, 'utf8'));
const codeFor = (email) =>
  readDb().verificationTokens.find(t => t.email === email.toLowerCase())?.code || null;

async function call(method, p, { body, token, formData } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${p}`, {
    method, headers, body: formData || (body ? JSON.stringify(body) : undefined)
  });
  let json = null;
  try { json = await res.json(); } catch (_) { json = null; }
  return { status: res.status, json, res };
}

async function verify(email) {
  seedIdentity(email);
  await call('POST', '/auth/send-verification', { body: { email } });
  const r = await call('POST', '/auth/verify-code', { body: { email, code: codeFor(email) } });
  return r.json.sessionToken;
}

const stamp = Date.now();

// ── Journey 1: a mentee books a chat ─────────────────────────────────────
step('JOURNEY 1 — mentee finds a mentor and books a chat');
{
  const email = `journey.student.${stamp}@ed.ac.uk`;

  const browse = await call('GET', '/mentors?search=computer');
  ok('can search mentors without signing in', browse.json.success && browse.json.count > 0,
    `found ${browse.json.count}`);
  ok('public listings do not expose mentor emails',
    !browse.json.data.some(m => m.email), 'an email leaked into the public listing');

  const mentor = (await call('GET', '/mentors')).json.data.find(m => m.weeklySchedule && Object.keys(m.weeklySchedule).length);
  ok('a mentor has bookable availability', Boolean(mentor));

  const now = new Date();
  const slots = await call('GET', `/mentors/${mentor.id}/slots?year=${now.getFullYear()}&month=${now.getMonth() + 2}`);
  const slot = slots.json.data.allOpenSlots[0];
  ok('next month shows open slots', Boolean(slot), JSON.stringify(slots.json.data.totalOpenSlots));
  ok('slots carry both canonical and display times',
    /^\d{2}:\d{2}$/.test(slot.time) && /(AM|PM)$/.test(slot.timeDisplay),
    `${slot.time} / ${slot.timeDisplay}`);

  const blocked = await call('POST', '/bookings', { body: { mentorId: mentor.id, date: slot.date, time: slot.time } });
  ok('booking without verification is refused', blocked.status === 401);

  const token = await verify(email);
  const booked = await call('POST', '/bookings', {
    token, body: { mentorId: mentor.id, date: slot.date, time: slot.time }
  });
  ok('verified mentee can book', booked.status === 201, JSON.stringify(booked.json));

  const b = booked.json.data;
  ok('booking returns a joinable video link', /^https:\/\/meet\.jit\.si\//.test(b.meetingUrl), b.meetingUrl);
  ok('booking returns Google + Outlook calendar links',
    Boolean(b.calendarLinks?.google && b.calendarLinks?.outlook));
  ok('Google link carries the real booked time, not "now + 24h"',
    b.calendarLinks.google.includes(b.date.replace(/-/g, '')), b.calendarLinks.google.slice(0, 120));

  const ics = await call('GET', `/bookings/${b.id}/ics`, { token });
  const icsText = await (await fetch(`${API}/bookings/${b.id}/ics`, {
    headers: { Authorization: `Bearer ${token}` }
  })).text();
  ok('mentee can download the .ics invite', icsText.startsWith('BEGIN:VCALENDAR'), icsText.slice(0, 40));
  ok('.ics contains both parties as attendees',
    (icsText.match(/ATTENDEE/g) || []).length >= 2,
    `${(icsText.match(/ATTENDEE/g) || []).length} attendee line(s)`);
  ok('.ics start time matches the booked slot',
    icsText.includes(`DTSTART:${b.date.replace(/-/g, '')}`), icsText.match(/DTSTART:[^\r\n]*/)?.[0]);

  const anonIcs = await fetch(`${API}/bookings/${b.id}/ics`);
  ok('a stranger cannot fetch the invite', anonIcs.status === 403, String(anonIcs.status));

  const mine = await call('GET', '/bookings/mine', { token });
  ok('mentee sees the session in "my sessions"',
    mine.json.data.upcoming.some(x => x.id === b.id));

  const emailsSent = readDb().bookings.find(x => x.id === b.id);
  ok('booking records the mentor email for notification', Boolean(emailsSent.mentorEmail), emailsSent.mentorEmail);

  globalThis.J1 = { token, email, bookingId: b.id, mentorId: mentor.id };
}

// ── Journey 2: a mentee gets resources ───────────────────────────────────
step('JOURNEY 2 — mentee finds, unlocks and downloads resources');
{
  const { token } = globalThis.J1;

  const list = await call('GET', '/resources', { token });
  ok('resources are browsable', list.json.count > 0, `${list.json.count} resources`);
  ok('listings never expose the on-disk filename',
    !list.json.data.some(r => r.fileName), 'a fileName leaked');

  const free = list.json.data.find(r => r.type !== 'paid');
  const paid = list.json.data.find(r => r.type === 'paid');

  const claim = await call('POST', `/resources/${free.id}/claim`, { token });
  ok('mentee can claim a freabie', claim.json.success);

  const after = await call('GET', '/resources', { token });
  ok('claimed freabie appears in entitlements', after.json.entitlements.includes(free.id));

  const dl = await fetch(`${API}/resources/${free.id}/download`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  ok('freabie downloads', dl.status === 200, String(dl.status));
  ok('download is served as an attachment',
    (dl.headers.get('content-disposition') || '').includes('attachment'),
    dl.headers.get('content-disposition'));

  if (paid) {
    const blocked = await fetch(`${API}/resources/${paid.id}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('playbook download requires purchase', blocked.status === 402, String(blocked.status));

    const claimPaid = await call('POST', `/resources/${paid.id}/claim`, { token });
    ok('a playbook cannot be claimed for free', claimPaid.status === 402, JSON.stringify(claimPaid.json));
  }

  // Entitlements follow the email, not the browser.
  const secondDevice = await verify(globalThis.J1.email);
  const onSecond = await call('GET', '/resources', { token: secondDevice });
  ok('entitlements follow the student to a new device/browser',
    onSecond.json.entitlements.includes(free.id));
}

// ── Journey 3: a mentee becomes a mentor ─────────────────────────────────
step('JOURNEY 3 — mentee applies to become a mentor');
{
  const email = `journey.newmentor.${stamp}@manchester.ac.uk`;
  const token = await verify(email);

  const anon = await call('POST', '/mentors/apply', { body: { name: 'X', university: 'Y' } });
  ok('application requires a verified email', anon.status === 401);

  const applied = await call('POST', '/mentors/apply', {
    token,
    body: {
      name: 'Journey Test Mentor',
      university: 'University of Manchester',
      major: 'BSc Computer Science',
      year: '3rd year',
      bio: 'Testing the full mentor onboarding journey.',
      topTip: 'Start your applications in September, not January.',
      achievements: ['First Class Honours'],
      links: [
        { label: '', url: 'linkedin.com/in/journeytest' },
        { url: 'https://github.com/journeytest' },
        { url: 'https://journeytest.substack.com' }
      ]
    }
  });
  ok('mentor profile is created', applied.status === 201, JSON.stringify(applied.json).slice(0, 160));
  ok('a mentor session is returned immediately', Boolean(applied.json.sessionToken));

  const m = applied.json.mentor;
  ok('all three links are stored', m.links.length === 3, JSON.stringify(m.links));
  ok('bare host was normalised to https', m.links[0].url.startsWith('https://'), m.links[0].url);
  ok('LinkedIn label auto-derived', m.links[0].label === 'LinkedIn', m.links[0].label);
  ok('new mentor gets a default bookable rota',
    Object.keys(m.weeklySchedule).length > 0, JSON.stringify(m.weeklySchedule));
  ok('rota is in canonical form',
    Object.entries(m.weeklySchedule).every(([k, v]) =>
      /^[0-6]$/.test(k) && v.every(t => /^\d{2}:\d{2}$/.test(t))),
    JSON.stringify(m.weeklySchedule));

  // The new mentor is immediately bookable by a student.
  const now = new Date();
  const slots = await call('GET', `/mentors/${m.id}/slots?year=${now.getFullYear()}&month=${now.getMonth() + 2}`);
  ok('new mentor is immediately bookable', slots.json.data.totalOpenSlots > 0,
    `${slots.json.data.totalOpenSlots} slots`);

  globalThis.J3 = { token: applied.json.sessionToken, mentorId: m.id, email };
}

// ── Journey 4: a mentor runs their account ───────────────────────────────
step('JOURNEY 4 — mentor signs in, builds profile, sets availability, publishes');
{
  const { email } = globalThis.J3;

  // Sign out and back in through the real mentor login.
  const login = await call('POST', '/auth/mentor-login', { body: { email } });
  ok('mentor login recognises the account', login.json.success, JSON.stringify(login.json));

  const verified = await call('POST', '/auth/mentor-verify', {
    body: { email, code: codeFor(email) }
  });
  ok('mentor signs in with the emailed code', verified.json.success);
  const token = verified.json.sessionToken;
  const mentorId = verified.json.mentor.id;

  // Profile editing, including adding more links.
  const profile = await call('PUT', `/mentors/${mentorId}`, {
    token,
    body: {
      bio: 'Updated bio from the mentor portal.',
      topTip: 'Email junior registrars, not department heads.',
      topTipColor: 'mint',
      achievements: ['First Class Honours', 'Dean\'s List', 'Hackathon winner'],
      pitchVideoUrl: 'https://youtube.com/watch?v=abc123',
      links: [
        { label: 'LinkedIn', url: 'https://linkedin.com/in/journeytest' },
        { label: 'GitHub', url: 'https://github.com/journeytest' },
        { label: 'Substack', url: 'https://journeytest.substack.com' },
        { label: 'Portfolio', url: 'https://journeytest.dev' },
        { label: 'Scholar', url: 'https://scholar.google.com/citations?user=x' }
      ]
    }
  });
  ok('mentor can edit their own profile', profile.json.success);
  ok('five links persist — no arbitrary cap', profile.json.data.links.length === 5,
    String(profile.json.data.links.length));
  ok('pitch video saved', profile.json.data.pitchVideoUrl.includes('youtube'));

  // Availability: save as day names + 12-hour, the shape the editor produces.
  const sched = await call('PUT', `/mentors/${mentorId}/schedule`, {
    token,
    body: { weeklySchedule: { Tuesday: ['6:00 PM', '7:30 PM'], Saturday: ['11:00', '14:30'] } }
  });
  ok('availability saves', sched.json.success);
  ok('availability normalises to canonical form',
    JSON.stringify(sched.json.data.weeklySchedule) ===
    JSON.stringify({ '2': ['18:00', '19:30'], '6': ['11:00', '14:30'] }),
    JSON.stringify(sched.json.data.weeklySchedule));

  // THE regression that used to wipe a mentor's calendar on save.
  const now = new Date();
  const after = await call('GET', `/mentors/${mentorId}/slots?year=${now.getFullYear()}&month=${now.getMonth() + 2}`);
  ok('mentor is STILL bookable after saving availability',
    after.json.data.totalOpenSlots > 0, `${after.json.data.totalOpenSlots} slots`);
  const tuesdays = after.json.data.days.filter(d => d.dayOfWeek === 'Tue' && d.hasSlots);
  ok('Tuesday slots land on Tuesdays', tuesdays.length > 0 && tuesdays[0].slots.includes('18:00'),
    JSON.stringify(tuesdays[0]?.slots));

  // Publishing a freabie and a playbook.
  const form = new FormData();
  form.append('document', new Blob(['# Journey guide\n\nReal content.'], { type: 'text/markdown' }), 'journey.md');
  const up = await (await fetch(`${API}/upload/document`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form
  })).json();
  ok('mentor uploads a document', up.success, JSON.stringify(up));

  const freabie = await call('POST', '/resources', {
    token, body: { title: 'Journey Freabie', type: 'free', fileName: up.fileName, format: up.format }
  });
  ok('mentor publishes a freabie', freabie.status === 201);

  // Pricing is gated on payout readiness, so this is refused first...
  const gated = await call('POST', '/resources', {
    token,
    body: { title: 'Journey Playbook', type: 'paid', price: 8.99, fileName: up.fileName, format: up.format }
  });
  ok('pricing refused until payouts are set up',
    gated.status === 409 && gated.json.payoutsRequired === true, JSON.stringify(gated.json).slice(0, 120));

  // ...then succeeds once the mentor can actually be paid.
  const dbNow = readDb();
  const meNow = dbNow.mentors.find(m => m.id === mentorId);
  meNow.stripeAccountId = 'acct_journey_fixture';
  meNow.payoutsEnabled = true;
  fs.writeFileSync(DB, JSON.stringify(dbNow, null, 2));

  const playbook = await call('POST', '/resources', {
    token,
    body: { title: 'Journey Playbook', type: 'paid', price: 8.99, fileName: up.fileName, format: up.format }
  });
  ok('mentor publishes a priced playbook', playbook.status === 201, JSON.stringify(playbook.json).slice(0, 120));
  ok('price stored correctly', playbook.json.data.price === 8.99, String(playbook.json.data.price));

  // Re-pricing, both directions.
  const repriced = await call('PUT', `/resources/${freabie.json.data.id}`, {
    token, body: { type: 'paid', price: 3.5 }
  });
  ok('a freabie can be given a price', repriced.json.data.type === 'paid' && repriced.json.data.price === 3.5,
    JSON.stringify(repriced.json.data));

  const freed = await call('PUT', `/resources/${repriced.json.data.id}`, { token, body: { type: 'free' } });
  ok('a playbook can be made free again', freed.json.data.type === 'free' && freed.json.data.price === 0);

  // Earnings view.
  const orders = await call('GET', `/mentors/${mentorId}/orders`, { token });
  ok('mentor can see their earnings panel', orders.json.success);
  ok('fee rate shown as 5%', orders.json.data.feeRatePercent === 5, String(orders.json.data.feeRatePercent));

  // Booking diary.
  const diary = await call('GET', `/mentors/${mentorId}/bookings`, { token });
  ok('mentor can see their booking diary', diary.json.success);

  // Nobody else can.
  const otherToken = globalThis.J1.token;
  const snoop = await call('GET', `/mentors/${mentorId}/bookings`, { token: otherToken });
  ok('another user cannot read the diary', snoop.status === 403, String(snoop.status));
  const snoopOrders = await call('GET', `/mentors/${mentorId}/orders`, { token: otherToken });
  ok('another user cannot read earnings', snoopOrders.status === 403, String(snoopOrders.status));
}

console.log(`\n═══ ${pass} passed, ${fail} failed ═══\n`);
process.exit(fail > 0 ? 1 : 0);
