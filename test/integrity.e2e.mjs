// ─────────────────────────────────────────────
// frea — records, meetings, profiles and the things that must stay consistent
// ─────────────────────────────────────────────
//
// Requires:  npm run server   (and a current `npm run build`)
//
//   npm run test:integrity
//
// One block per defect found in the production-readiness pass:
//
//   1. A resource froze its mentor's name, university and degree at publish
//      time, so editing a profile left stale attribution on every document.
//   2. callsCompleted counted bookings, not completed calls, so a session
//      booked for next month advertised itself as a chat already had.
//   3. Meeting rooms were named after the booking id — a timestamp plus three
//      random bytes — on a service where knowing the room name is the whole of
//      the access control.
//   4. helpsWith drove the search box and the goal filter but had no field
//      anywhere, so every mentor carried the same derived tags for ever.
//   5. The publish form existed twice and the copies had already diverged: the
//      signup one had no "What's Inside" fields at all.
//   6. Uploads were in no backup, so restoring after losing the volume gave
//      you every paid order with nothing to download.
//   7. Assorted: emoji in the UI, a hardcoded mentor count, links to a route
//      that only redirects, and CORS open to every origin.

// The archive block needs an admin session, and ADMIN_EMAILS lives in .env —
// which the server loads for itself but a test process does not.
import 'dotenv/config';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedIdentity } from './_identity.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = 'http://localhost:3001/api';

import { localOnly } from './_local-only.mjs';
localOnly(API, { suite: 'integrity.e2e.mjs' });

const ORIGIN = 'http://localhost:3001';
const DB = path.join(__dirname, '..', 'server', 'data.json');

let pass = 0, fail = 0;
const ok = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`   ✓ ${label}`); }
  else { fail++; console.log(`   ✗ ${label}  ${detail}`); }
};
const group = (n) => console.log(`\n${n}`);

const readDb = () => JSON.parse(fs.readFileSync(DB, 'utf8'));
const codeFor = (e) => readDb().verificationTokens.find(t => t.email === e.toLowerCase())?.code || null;

async function call(method, p, { body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${p}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch (_) { /* not every response is JSON */ }
  return { status: res.status, json };
}

async function verify(email) {
  seedIdentity(email);
  await call('POST', '/auth/send-verification', { body: { email } });
  const r = await call('POST', '/auth/verify-code', { body: { email, code: codeFor(email) } });
  return r.json.sessionToken;
}

async function uploadDoc(token, name = 'notes.md', body = '# notes\n') {
  const form = new FormData();
  form.append('document', new Blob([body], { type: 'text/markdown' }), name);
  const res = await fetch(`${API}/upload/document`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form
  });
  return res.json();
}

const source = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const bundle = () => {
  const dir = path.join(__dirname, '..', 'dist', 'assets');
  const js = fs.readdirSync(dir).filter(f => f.endsWith('.js'))
    .map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0];
  return fs.readFileSync(path.join(dir, js.f), 'utf8');
};

const stamp = Date.now();
console.log('\nINTEGRITY');

const token = await verify(`integrity.${stamp}@ed.ac.uk`);
const applied = await call('POST', '/mentors/apply', {
  token,
  body: {
    name: 'Integrity Mentor',
    university: 'University of Leeds',
    major: 'BSc Chemistry',
    year: '3rd year',
    helpsWith: ['lab reports', 'titration technique', '  ', 'spectroscopy']
  }
});
const mentorToken = applied.json.sessionToken;
const mentorId = applied.json.mentor.id;
ok('test mentor created', applied.status === 201, JSON.stringify(applied.json).slice(0, 140));

// ── 1. Attribution must follow the profile ───────────────────────────────
group('DEFECT 1 — a document froze its author\'s details at publish time');
{
  const uploaded = await uploadDoc(mentorToken, 'attribution.md');
  const created = await call('POST', '/resources', {
    token: mentorToken,
    body: { title: 'Attribution test', type: 'free', fileName: uploaded.fileName, format: 'Markdown' }
  });
  ok('resource published', created.status === 201, JSON.stringify(created.json).slice(0, 140));
  const resourceId = created.json.data.id;

  const before = (await call('GET', '/resources')).json.data.find(r => r.id === resourceId);
  ok('published under the mentor\'s current name', before.mentorName === 'Integrity Mentor', before.mentorName);

  // The mentor corrects their degree and name — exactly what the edit form is for.
  await call('PUT', `/mentors/${mentorId}`, {
    token: mentorToken, body: { name: 'Integrity Mentor-Smith', major: 'MSci Chemistry' }
  });

  const after = (await call('GET', '/resources')).json.data.find(r => r.id === resourceId);
  ok('the listing follows the corrected name', after.mentorName === 'Integrity Mentor-Smith', after.mentorName);
  ok('and the corrected degree', after.mentorMajor === 'MSci Chemistry', after.mentorMajor);

  const onProfile = (await call('GET', `/mentors/${mentorId}`)).json.data.docs.find(d => d.id === resourceId);
  ok('the mentor\'s own profile agrees', onProfile.mentorName === 'Integrity Mentor-Smith', onProfile.mentorName);

  await call('DELETE', `/resources/${resourceId}`, { token: mentorToken });
}

// ── 2. Completed calls are calls that happened ───────────────────────────
group('DEFECT 2 — a booking counted as a completed chat the moment it was made');
{
  const before = (await call('GET', `/mentors/${mentorId}`)).json.data.callsCompleted;
  ok('a new mentor has completed no chats', before === 0, String(before));

  // Give them a slot far enough ahead to be bookable, then book it.
  const day = new Date(Date.now() + 5 * 86400000);
  const iso = day.toISOString().slice(0, 10);
  const weekday = day.getUTCDay();
  await call('PUT', `/mentors/${mentorId}/schedule`, {
    token: mentorToken, body: { weeklySchedule: { [weekday]: ['14:00'] } }
  });

  const studentToken = await verify(`integrity.student.${stamp}@ed.ac.uk`);
  const booked = await call('POST', '/bookings', {
    token: studentToken, body: { mentorId, date: iso, time: '14:00' }
  });
  ok('the student can book', booked.status === 201, JSON.stringify(booked.json).slice(0, 140));

  const after = (await call('GET', `/mentors/${mentorId}`)).json.data.callsCompleted;
  ok('an upcoming booking is NOT a completed chat', after === 0, String(after));

  const stored = readDb().mentors.find(m => m.id === mentorId);
  ok('no stored counter to drift out of step', stored.callsCompleted === undefined,
    String(stored.callsCompleted));

  // 3. and the meeting room, while a booking exists to inspect.
  const booking = readDb().bookings.find(b => b.id === booked.json.data.id);
  ok('the meeting room is not derived from the booking id',
    booking.meetingUrl && !booking.meetingUrl.includes(booking.id.replace(/[^a-zA-Z0-9]/g, '')),
    booking.meetingUrl);
  ok('the room name carries 16 random bytes',
    /^https:\/\/meet\.jit\.si\/frea-[0-9a-f]{32}$/.test(booking.meetingUrl), booking.meetingUrl);

  await call('POST', `/bookings/${booked.json.data.id}/cancel`, { token: studentToken });
}

// ── 4. helpsWith is the mentor's to write ────────────────────────────────
group('DEFECT 4 — "what you can ask me about" could never be edited');
{
  const at = (await call('GET', `/mentors/${mentorId}`)).json.data;
  ok('the signup form\'s answer is kept, not overwritten by a derived list',
    at.helpsWith.includes('titration technique'), JSON.stringify(at.helpsWith));
  ok('blank entries are dropped', !at.helpsWith.some(h => !h.trim()), JSON.stringify(at.helpsWith));

  const edited = await call('PUT', `/mentors/${mentorId}`, {
    token: mentorToken, body: { helpsWith: ['nmr interpretation', 'phd applications'] }
  });
  ok('it can be changed later', edited.json.data.helpsWith.join(',') === 'nmr interpretation,phd applications',
    JSON.stringify(edited.json.data.helpsWith));

  const capped = await call('PUT', `/mentors/${mentorId}`, {
    token: mentorToken, body: { helpsWith: Array.from({ length: 30 }, (_, i) => `tag ${i}`) }
  });
  ok('capped at 12, the same as the form offers', capped.json.data.helpsWith.length === 12,
    String(capped.json.data.helpsWith.length));

  ok('the form has a field for it', bundle().includes('bm-helps-with'));
}

// ── 5. One publish form ──────────────────────────────────────────────────
group('DEFECT 5 — the publish form existed twice and had already diverged');
{
  const src = source('src/main.js');
  ok('there is one definition', (src.match(/function resourceFormFields/g) || []).length === 1);
  ok('the signup page uses it', src.includes("resourceFormFields({ prefix: 'bm-doc'"));
  ok('the dashboard uses it', src.includes("resourceFormFields({ prefix: 'pr'"));

  const b = bundle();
  ok('both instances get the What\'s Inside fields',
    b.includes('bullet-1') && b.includes("What's Inside"));
  ok('the category list is not written out twice',
    (b.match(/Exam Bibles & Revision/g) || []).length === 1,
    String((b.match(/Exam Bibles & Revision/g) || []).length));

  // The bullets must survive the round trip, which is what the signup copy
  // could not do at all.
  const uploaded = await uploadDoc(mentorToken, 'bullets.md');
  const withBullets = await call('POST', '/resources', {
    token: mentorToken,
    body: {
      title: 'Bullets test', type: 'free', fileName: uploaded.fileName, format: 'Markdown',
      previewBullets: ['first line', 'second line', 'third line']
    }
  });
  ok('preview bullets are stored', withBullets.json.data.previewBullets.length === 3,
    JSON.stringify(withBullets.json.data.previewBullets));
  await call('DELETE', `/resources/${withBullets.json.data.id}`, { token: mentorToken });
}

// ── 6. A backup that could actually rebuild the platform ─────────────────
group('DEFECT 6 — uploads were in no backup');
{
  const admins = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!admins.length) {
    console.log('   – skipped: ADMIN_EMAILS is not set, so no admin session can be made');
  } else {
    const adminToken = await verify(admins[0]);
    const res = await fetch(`${API}/admin/archive`, { headers: { Authorization: `Bearer ${adminToken}` } });
    ok('the archive route answers', res.status === 200, String(res.status));
    ok('it is a zip', (res.headers.get('content-type') || '').includes('zip'),
      res.headers.get('content-type'));

    const buf = Buffer.from(await res.arrayBuffer());
    ok('and a non-trivial one', buf.length > 1000, String(buf.length));
    ok('starting with the zip magic bytes', buf.slice(0, 2).toString() === 'PK', buf.slice(0, 2).toString());

    // Names are stored uncompressed in the local file headers, so they are
    // findable without unzipping.
    const asText = buf.toString('latin1');
    ok('it contains the database', asText.includes('data.json'));
    ok('it contains the uploaded documents', asText.includes('uploads/digital_products/'));
    ok('it carries a manifest', asText.includes('MANIFEST.txt'));

    const plain = await fetch(`${API}/admin/backup`, { headers: { Authorization: `Bearer ${adminToken}` } });
    ok('the database-only route still works for inspection', plain.status === 200, String(plain.status));
    await plain.arrayBuffer();
  }

  const anon = await fetch(`${API}/admin/archive`);
  ok('the archive is admin-only', anon.status === 401 || anon.status === 403, String(anon.status));
}

// ── 7. Consistency across the site ───────────────────────────────────────
group('DEFECT 7 — emoji, invented counts, redundant routes, open CORS');
{
  const emoji = /\p{Extended_Pictographic}/u;
  for (const f of ['src/main.js', 'index.html', 'src/icons.js']) {
    // ↗ and © are typographic marks, not pictographs anyone would call emoji.
    const offending = source(f).split('\n')
      .map((l, i) => ({ l, i: i + 1 }))
      .filter(({ l }) => emoji.test(l.replace(/[↗©]/g, '')));
    ok(`no emoji in ${f}`, offending.length === 0,
      offending.slice(0, 2).map(o => `${o.i}: ${o.l.trim().slice(0, 50)}`).join(' | '));
  }

  const src = source('src/main.js');
  ok('the landing page counts mentors rather than naming a number',
    !src.includes('explore all 12 seniors') && src.includes('explore all ${MENTORS.length} seniors'));
  // Against the bundle, not the source: the source carries a comment saying
  // what the old copy was, and that comment is not shipped.
  ok('the hero card does not advertise an invented rating', !bundle().includes('4.9 (47 chats)'));

  ok('internal navigation does not route through the redirect',
    !/data-href="\/mentor-dashboard"/.test(src));
  ok('but the route still resolves for bookmarks', src.includes("path === '/mentor-dashboard'"));

  ok('the mentor space is called one thing',
    !src.includes('open my mentor dashboard') && source('src/seo.js').includes('Mentor space'));

  // CORS: a browser page on another origin must not be told it may read us.
  const evil = await fetch(`${API}/mentors`, { headers: { Origin: 'https://evil.example' } });
  ok('CORS refuses an unknown origin',
    !evil.headers.get('access-control-allow-origin'),
    String(evil.headers.get('access-control-allow-origin')));
  await evil.arrayBuffer();

  const same = await fetch(`${API}/mentors`, { headers: { Origin: ORIGIN } });
  ok('a request with no Origin (curl, webhooks) is unaffected', same.status === 200, String(same.status));
  await same.arrayBuffer();
}

console.log(`\n═══ ${pass} passed, ${fail} failed ═══\n`);
process.exit(fail > 0 ? 1 : 0);
