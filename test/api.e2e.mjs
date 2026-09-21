// End-to-end exercise of the frea API against a running server.
// Reads OTP codes straight out of the server's own data.json, the way an
// operator would, since the API no longer returns them.

import fs from 'fs';

const API = 'http://localhost:3001/api';

import { localOnly } from './_local-only.mjs';
localOnly(API, { suite: 'api.e2e.mjs' });
const DB = new URL('../server/data.json', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

let pass = 0, fail = 0;
const ok = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${detail}`); }
};

const readDb = () => JSON.parse(fs.readFileSync(DB, 'utf8'));
const codeFor = (email) => {
  const t = readDb().verificationTokens.find(t => t.email === email.toLowerCase());
  return t ? t.code : null;
};

async function call(method, path, { body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch (_) { json = { raw: true }; }
  return { status: res.status, json };
}

/** Verify an email and return its session token. */
async function signIn(email) {
  await call('POST', '/auth/send-verification', { body: { email } });
  const code = codeFor(email);
  const r = await call('POST', '/auth/verify-code', { body: { email, code } });
  return r.json.sessionToken;
}

console.log('\n─── 1. Verification & sessions ───');
{
  const email = 'e2e.student@ed.ac.uk';
  const send = await call('POST', '/auth/send-verification', { body: { email } });
  ok('send-verification succeeds', send.json.success);
  ok('response does NOT contain the code', !JSON.stringify(send.json).match(/\b\d{6}\b/), JSON.stringify(send.json));

  const bad = await call('POST', '/auth/verify-code', { body: { email, code: '000000' } });
  ok('wrong code rejected', bad.status === 400, JSON.stringify(bad.json));

  const master = await call('POST', '/auth/verify-code', { body: { email, code: '123456' } });
  ok('master code 123456 no longer works', master.status === 400, JSON.stringify(master.json));

  const code = codeFor(email);
  const good = await call('POST', '/auth/verify-code', { body: { email, code } });
  ok('correct code accepted', good.json.success === true, JSON.stringify(good.json));
  ok('session token issued', typeof good.json.sessionToken === 'string');

  const replay = await call('POST', '/auth/verify-code', { body: { email, code } });
  ok('code is single-use', replay.status === 400, JSON.stringify(replay.json));

  const me = await call('GET', '/auth/me', { token: good.json.sessionToken });
  ok('/auth/me resolves the session', me.json.session?.email === email);
}

console.log('\n─── 2. Booking: validation ───');
const studentEmail = 'e2e.booker@ed.ac.uk';
const studentToken = await signIn(studentEmail);
{
  const anon = await call('POST', '/bookings', { body: { mentorId: 1, date: '2026-09-21', time: '10:00' } });
  ok('booking requires verification', anon.status === 401, JSON.stringify(anon.json));

  const past = await call('POST', '/bookings', {
    token: studentToken, body: { mentorId: 1, date: '2020-01-06', time: '10:00' }
  });
  ok('past date rejected', past.status === 400 && /passed/i.test(past.json.error), JSON.stringify(past.json));

  const offRota = await call('POST', '/bookings', {
    token: studentToken, body: { mentorId: 1, date: '2026-09-21', time: '03:33' }
  });
  ok('off-rota time rejected', offRota.status === 400 && /not available/i.test(offRota.json.error), JSON.stringify(offRota.json));

  const junk = await call('POST', '/bookings', {
    token: studentToken, body: { mentorId: 1, date: 'not-a-date', time: '10:00' }
  });
  ok('unparseable date rejected', junk.status === 400, JSON.stringify(junk.json));
}

console.log('\n─── 3. Booking: the happy path & double-booking ───');
let bookingId = null, cancelToken = null;
{
  const slots = await call('GET', '/mentors/1/slots?year=2026&month=10');
  const open = slots.json.data.allOpenSlots[0];
  ok('mentor has open slots in Oct 2026', Boolean(open), JSON.stringify(slots.json.data.totalOpenSlots));

  const booked = await call('POST', '/bookings', {
    token: studentToken, body: { mentorId: 1, date: open.date, time: open.time }
  });
  ok('booking created', booked.status === 201, JSON.stringify(booked.json));
  bookingId = booked.json.data?.id;
  cancelToken = booked.json.data?.cancelToken;

  ok('booking stored with ISO date', /^\d{4}-\d{2}-\d{2}$/.test(booked.json.data.date), booked.json.data.date);
  ok('booking stored with 24h time', /^\d{2}:\d{2}$/.test(booked.json.data.time), booked.json.data.time);
  ok('meeting URL is a real joinable room', /^https:\/\/meet\.jit\.si\//.test(booked.json.data.meetingUrl), booked.json.data.meetingUrl);
  ok('calendar links returned', Boolean(booked.json.data.calendarLinks?.google));

  // THE headline bug: the slot must now disappear from availability.
  const after = await call('GET', '/mentors/1/slots?year=2026&month=10');
  const stillThere = after.json.data.allOpenSlots.some(s => s.date === open.date && s.time === open.time);
  ok('booked slot removed from availability', !stillThere, `${open.date} ${open.time}`);

  // A different student must not be able to take the same slot.
  const other = await signIn('e2e.rival@ed.ac.uk');
  const clash = await call('POST', '/bookings', {
    token: other, body: { mentorId: 1, date: open.date, time: open.time }
  });
  ok('double-booking refused', clash.status === 400 && /just been booked/i.test(clash.json.error), JSON.stringify(clash.json));
}

console.log('\n─── 4. Cancellation frees the slot ───');
{
  const before = await call('GET', '/bookings/mine', { token: studentToken });
  ok('student sees their booking', before.json.data.upcoming.length >= 1);

  const booking = readDb().bookings.find(b => b.id === bookingId);
  const cancel = await call('POST', `/bookings/${bookingId}/cancel`, {
    token: studentToken, body: { cancelToken }
  });
  ok('cancellation accepted', cancel.json.success === true, JSON.stringify(cancel.json));

  const slots = await call('GET', `/mentors/1/slots?year=${booking.date.slice(0, 4)}&month=${parseInt(booking.date.slice(5, 7))}`);
  const freed = slots.json.data.allOpenSlots.some(s => s.date === booking.date && s.time === booking.time);
  ok('cancelled slot is bookable again', freed, `${booking.date} ${booking.time}`);
}

console.log('\n─── 5. Mentor auth & the schedule round-trip ───');
{
  const mentorEmail = readDb().mentors.find(m => m.email)?.email;
  const login = await call('POST', '/auth/mentor-login', { body: { email: mentorEmail } });
  ok('mentor login sends a code', login.json.success === true, JSON.stringify(login.json));
  ok('mentor login does not leak the code', !JSON.stringify(login.json).match(/\b\d{6}\b/));

  const mentorToken = (await call('POST', '/auth/mentor-verify', {
    body: { email: mentorEmail, code: codeFor(mentorEmail) }
  })).json.sessionToken;
  ok('mentor session issued', typeof mentorToken === 'string');

  const mentorId = readDb().mentors.find(m => m.email === mentorEmail).id;

  // Another mentor's record must be off limits.
  const otherId = readDb().mentors.find(m => m.id !== mentorId).id;
  const trespass = await call('PUT', `/mentors/${otherId}`, { token: mentorToken, body: { bio: 'nope' } });
  ok("cannot edit another mentor's profile", trespass.status === 403, JSON.stringify(trespass.json));

  // Save a schedule the way the portal does (day names, 24h) and confirm the
  // booking engine still produces slots — the bug that silently broke mentors.
  const saved = await call('PUT', `/mentors/${mentorId}/schedule`, {
    token: mentorToken,
    body: { weeklySchedule: { Monday: ['17:00', '18:30'], Thursday: ['09:00'] } }
  });
  ok('schedule saved', saved.json.success === true, JSON.stringify(saved.json));
  ok('schedule normalised to day indices', JSON.stringify(saved.json.data.weeklySchedule) === JSON.stringify({ '1': ['17:00', '18:30'], '4': ['09:00'] }), JSON.stringify(saved.json.data.weeklySchedule));

  const slots = await call('GET', `/mentors/${mentorId}/slots?year=2026&month=11`);
  ok('mentor still bookable after saving schedule', slots.json.data.totalOpenSlots > 0, `slots=${slots.json.data.totalOpenSlots}`);

  const mondays = slots.json.data.days.filter(d => d.dayOfWeek === 'Mon' && d.hasSlots);
  ok('Monday slots land on Mondays', mondays.length > 0 && mondays[0].slots.includes('17:00'), JSON.stringify(mondays[0]?.slots));

  // 12-hour input must normalise identically.
  const twelve = await call('PUT', `/mentors/${mentorId}/schedule`, {
    token: mentorToken, body: { weeklySchedule: { '1': ['5:00 PM', '6:30 PM'], '4': ['9:00 AM'] } }
  });
  ok('12-hour input normalises to the same rota', JSON.stringify(twelve.json.data.weeklySchedule) === JSON.stringify({ '1': ['17:00', '18:30'], '4': ['09:00'] }), JSON.stringify(twelve.json.data.weeklySchedule));

  // Unlimited links.
  const links = await call('PUT', `/mentors/${mentorId}`, {
    token: mentorToken,
    body: {
      links: [
        { label: '', url: 'linkedin.com/in/someone' },
        { label: 'My GitHub', url: 'https://github.com/someone' },
        { url: 'https://someone.substack.com' },
        { url: 'not a url at all' },
        { url: 'javascript:alert(1)' }
      ]
    }
  });
  const stored = links.json.data.links;
  ok('links kept, unlimited count', stored.length === 3, JSON.stringify(stored));
  ok('bare host gains https://', stored[0].url.startsWith('https://'), stored[0].url);
  ok('label auto-derived', stored[0].label === 'LinkedIn', stored[0].label);
  ok('custom label preserved', stored[1].label === 'My GitHub');
  ok('javascript: URL rejected', !stored.some(l => l.url.startsWith('javascript:')), JSON.stringify(stored));

  globalThis.__mentorToken = mentorToken;
  globalThis.__mentorId = mentorId;
}

console.log('\n─── 6. Resources, entitlement & downloads ───');
{
  const mentorToken = globalThis.__mentorToken;

  // Publish a free freabie with a real uploaded file.
  const form = new FormData();
  form.append('document', new Blob(['# E2E freabie\n\nReal file contents.'], { type: 'text/markdown' }), 'e2e-guide.md');
  const up = await fetch(`${API}/upload/document`, {
    method: 'POST', headers: { Authorization: `Bearer ${mentorToken}` }, body: form
  });
  const upJson = await up.json();
  ok('mentor can upload a document', upJson.success === true, JSON.stringify(upJson));
  ok('upload returns no public URL', !upJson.fileUrl, JSON.stringify(upJson));

  const anonUp = await fetch(`${API}/upload/document`, { method: 'POST', body: new FormData() });
  ok('anonymous upload refused', anonUp.status === 401);

  const free = await call('POST', '/resources', {
    token: mentorToken,
    body: { title: 'E2E Free Guide', type: 'free', fileName: upJson.fileName, format: upJson.format, category: 'Tech & Coding' }
  });
  ok('free resource published', free.status === 201, JSON.stringify(free.json));
  ok('listing hides the on-disk filename', !free.json.data.fileName, JSON.stringify(free.json.data));

  // Pricing requires payout onboarding, so a mentor who has not done it is
  // refused — we must never take money we cannot forward.
  const paid = await call('POST', '/resources', {
    token: mentorToken,
    body: { title: 'E2E Paid Playbook', type: 'paid', price: 10, fileName: upJson.fileName, format: upJson.format }
  });
  ok('pricing refused before payout setup', paid.status === 409 && paid.json.payoutsRequired === true,
    JSON.stringify(paid.json).slice(0, 140));

  // With payouts enabled, price validation applies as normal.
  const db0 = readDb();
  const me = db0.mentors.find(m => m.id === globalThis.__mentorId);
  me.stripeAccountId = 'acct_test_fixture';
  me.payoutsEnabled = true;
  fs.writeFileSync(DB, JSON.stringify(db0, null, 2));

  const paidOk = await call('POST', '/resources', {
    token: mentorToken,
    body: { title: 'E2E Paid Playbook', type: 'paid', price: 10, fileName: upJson.fileName, format: upJson.format }
  });
  ok('paid resource published once payouts are ready', paidOk.status === 201, JSON.stringify(paidOk.json).slice(0, 140));

  const badPrice = await call('POST', '/resources', {
    token: mentorToken, body: { title: 'Too dear', type: 'paid', price: 500, fileName: upJson.fileName }
  });
  ok('absurd price rejected', badPrice.status === 400, JSON.stringify(badPrice.json));

  const freeId = free.json.data.id;
  const paidId = paidOk.json.data.id;

  // Downloads.
  const anonDl = await fetch(`${API}/resources/${freeId}/download`);
  ok('anonymous download refused', anonDl.status === 401);

  const buyerToken = await signIn('e2e.buyer@ed.ac.uk');

  const freeDl = await fetch(`${API}/resources/${freeId}/download`, {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  const freeBody = await freeDl.text();
  ok('verified student downloads a freabie', freeDl.status === 200, String(freeDl.status));
  ok('freabie streams the REAL uploaded file', freeBody.includes('Real file contents.'), freeBody.slice(0, 60));

  const paidDl = await fetch(`${API}/resources/${paidId}/download`, {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  const paidJson = await paidDl.json();
  ok('paid download blocked without purchase', paidDl.status === 402 && paidJson.requiresPurchase === true, JSON.stringify(paidJson));

  // No public static path to the file any more.
  const hotlink = await fetch(`http://localhost:3001/uploads/digital_products/${upJson.fileName}`);
  ok('uploads are not publicly hotlinkable', hotlink.status === 404, String(hotlink.status));

  // Ownership.
  const rivalMentor = readDb().mentors.find(m => m.email && m.id !== globalThis.__mentorId);
  if (rivalMentor) {
    const rivalToken = await (async () => {
      await call('POST', '/auth/mentor-login', { body: { email: rivalMentor.email } });
      const r = await call('POST', '/auth/mentor-verify', { body: { email: rivalMentor.email, code: codeFor(rivalMentor.email) } });
      return r.json.sessionToken;
    })();
    const steal = await call('DELETE', `/resources/${freeId}`, { token: rivalToken });
    ok("cannot delete another mentor's resource", steal.status === 403, JSON.stringify(steal.json));
  }

  globalThis.__paidId = paidId;
  globalThis.__freeId = freeId;
  globalThis.__buyerToken = buyerToken;
}

console.log('\n─── 7. Payments ───');
{
  const cfg = await call('GET', '/payments/config');
  ok('fee rate is 5%', cfg.json.data.feeRatePercent === 5, JSON.stringify(cfg.json.data));

  // Behaviour depends on whether this server has Stripe keys. Either way the
  // response must be a clean, explained refusal or a real checkout URL — never
  // a 500 or a silent unlock.
  const checkout = await call('POST', '/checkout', {
    token: globalThis.__buyerToken, body: { resourceId: globalThis.__paidId }
  });

  if (!cfg.json.data.enabled) {
    ok('checkout refused cleanly when Stripe is unconfigured',
      checkout.status === 503, JSON.stringify(checkout.json));
  } else {
    const acceptable = checkout.status === 200
      || checkout.status === 409   // mentor has not finished payout onboarding
      || checkout.status === 400;  // Stripe rejected a fixture account id
    ok('checkout responds cleanly with Stripe configured', acceptable, `${checkout.status} ${JSON.stringify(checkout.json).slice(0, 120)}`);
    ok('checkout never unlocks without payment',
      !(checkout.json && checkout.json.unlocked), JSON.stringify(checkout.json).slice(0, 120));
  }

  // The split itself, independent of Stripe.
  const { splitPrice } = await import('../server/db.js');
  const s = splitPrice(10);
  ok('£10 -> student pays £10.00', s.total === 10, JSON.stringify(s));
  ok('£10 -> frea fee £0.50 (5%)', s.freaFee === 0.5, JSON.stringify(s));
  ok('£10 -> mentor keeps £9.50', s.mentorPayout === 9.5, JSON.stringify(s));
  const s2 = splitPrice(4.99);
  ok('£4.99 splits without rounding drift', Math.round((s2.freaFee + s2.mentorPayout) * 100) === 499, JSON.stringify(s2));
}

console.log('\n─── 8. Stats & suggestions ───');
{
  const stats = await call('GET', '/stats');
  const db = readDb();
  ok('stats report the real mentor count', stats.json.data.verifiedMentors === db.mentors.length, JSON.stringify(stats.json.data));
  ok('stats report real bookings only', typeof stats.json.data.totalBookings === 'number' && stats.json.data.totalBookings < 100, JSON.stringify(stats.json.data.totalBookings));

  const sug = await call('POST', '/suggestions', {
    body: { type: 'resource', university: 'Manchester', course: 'CS', text: 'E2E: please add past papers' }
  });
  ok('suggestion persisted server-side', sug.status === 201, JSON.stringify(sug.json));
  ok('suggestion is in the database', readDb().suggestions.some(s => s.text.includes('E2E:')));
}

console.log(`\n═══ ${pass} passed, ${fail} failed ═══\n`);
process.exit(fail > 0 ? 1 : 0);
