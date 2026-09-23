import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// ─── Nominating an address must never grant anything ────
//
// Registration used to open a session the moment someone typed a contact
// address, and session.email is the authorization key for entitlements,
// bookings and cancellation — while createSession derived isAdmin from it.
// So anyone holding an account at any of the thousands of institutions the
// federation covers could complete an honest university login, nominate the
// administrator's address, and be handed an admin session. /api/admin/backup
// then returns the whole database, every live session token included.
//
// These read the source rather than driving a server, so they run in the unit
// suite and fail loudly if the shape of the fix is undone.

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');

test('createSession only grants admin on a proven address', () => {
  const src = read('../server/auth.js');

  assert.match(src, /createSession\(\{[^}]*emailProven/,
    'createSession must take an explicit emailProven flag');

  assert.match(src, /isAdmin:\s*Boolean\(emailProven\)\s*&&\s*isAdminEmail\(clean\)/,
    'isAdmin must require emailProven, never the address alone');
});

test('getSession does not promote a session whose address was never proven', () => {
  const src = read('../server/auth.js');
  // isAdmin is re-derived on every request because ADMIN_EMAILS is env-driven;
  // that re-derivation must carry the same condition or it reinstates the hole.
  assert.match(src, /isAdmin:\s*Boolean\(session\.emailProven\)\s*&&\s*isAdminEmail\(session\.email\)/,
    'the per-request re-derivation must also require emailProven');
});

test('the registration endpoint issues no session', () => {
  const src = read('../server/index.js');
  const start = src.indexOf("app.post('/api/auth/studid/complete'");
  assert.ok(start > -1, 'the complete route should exist');
  const body = src.slice(start, src.indexOf('}));', start));

  assert.ok(!/createSession\(/.test(body),
    'nominating a contact address must not open a session — the code proves it');
  assert.ok(!/sessionToken/.test(body),
    'no session token may be returned before the address is proven');
  assert.match(body, /savePendingBinding\(/,
    'the binding should be held aside until the code comes back');
});

test('the identity is written only once the code is proven', () => {
  const src = read('../server/index.js');
  const start = src.indexOf("app.post('/api/auth/verify-code'");
  const body = src.slice(start, src.indexOf('}));', start));

  assert.match(body, /consumePendingBinding\(/,
    'verify-code is where a first registration is committed');
  assert.match(body, /upsertStudentIdentity\(/,
    'the identity must be written here, not before the proof');
});

// ─── The institution is not the mentor's to choose ──────

test('a mentor cannot set their own university', () => {
  const src = read('../server/db.js');
  const start = src.indexOf('export function updateMentorProfile');
  const body = src.slice(start, src.indexOf('\n}', start));

  assert.ok(!/updates\.university/.test(body),
    'updateMentorProfile must not accept a university from the request body — '
    + 'it is derived from whoever vouched for them at sign-in');
});
