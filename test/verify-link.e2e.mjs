// ─────────────────────────────────────────────
// frea — verification links vs mail scanners
// ─────────────────────────────────────────────
//
//   npm run test:verifylink       # needs the API running on :3001
//
// Mail providers fetch the links inside a message before the recipient sees
// it. Microsoft Defender Safe Links does this, and Outlook is where most
// .ac.uk addresses live. A strictly single-use link is therefore already spent
// by the time the student clicks it, and they are told it is invalid — on a
// link they never used.

import fs from 'node:fs';
import { seedIdentity } from './_identity.mjs';
import { DB_FILE } from '../server/paths.js';

const API = (process.argv[2] || 'http://localhost:3001') + '/api';

let pass = 0, fail = 0;
const ok = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`   ✓ ${label}`); }
  else { fail++; console.log(`   ✗ ${label}${detail ? '  — ' + detail : ''}`); }
};
const group = (n) => console.log(`\n${n}`);

async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

async function issueToken(email) {
  seedIdentity(email);
  await call('POST', '/auth/send-verification', { email });
  await new Promise(r => setTimeout(r, 300));
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const rec = (db.verificationTokens || []).find(t => t.email === email.toLowerCase());
  if (!rec) throw new Error(`no token issued for ${email}`);
  return rec;
}

// The token is read straight out of the database, so this only runs against a
// local server. Against production the volume lives on the host and tokens are
// not reachable from here — clicking a real link is the test there.
if (!/localhost|127\.0\.0\.1/.test(API)) {
  console.log('');
  console.log('This suite reads tokens from the local database, so it only runs locally.');
  console.log(`Asked for: ${API}`);
  console.log('To check production, click a real verification link from an Outlook inbox.');
  console.log('');
  process.exit(0);
}

console.log(`\nfrea verification links → ${API}`);

group('A SCANNER FETCHING THE LINK FIRST');
{
  const email = `scan${Date.now()}@ed.ac.uk`;
  const rec = await issueToken(email);

  // Stand in for Safe Links: an unattended GET, seconds before the student.
  const scanner = await call('GET', `/auth/verify?token=${rec.token}`);
  ok('the scanner’s fetch succeeds', scanner.status === 200, `status ${scanner.status}`);

  const student = await call('GET', `/auth/verify?token=${rec.token}`);
  ok('the student’s click still works', student.status === 200,
    `status ${student.status} — ${student.json?.error || ''}`);
  ok('and it opens a real session', Boolean(student.json?.sessionToken));
  ok('for the right address', student.json?.email === email.toLowerCase());
}

group('THE SESSION IS USABLE')
{
  const email = `usable${Date.now()}@ed.ac.uk`;
  const rec = await issueToken(email);
  await call('GET', `/auth/verify?token=${rec.token}`);        // scanner
  const student = await call('GET', `/auth/verify?token=${rec.token}`);

  const me = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${student.json.sessionToken}` }
  }).then(r => r.json());
  ok('the token from the second hit authenticates', me.success === true || Boolean(me.email || me.data),
    JSON.stringify(me).slice(0, 80));
}

group('IT IS NOT A STANDING KEY');
{
  const email = `expiry${Date.now()}@ed.ac.uk`;
  const rec = await issueToken(email);
  await call('GET', `/auth/verify?token=${rec.token}`);

  // Age the first use past the grace window, as a forwarded email would.
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const stored = db.verificationTokens.find(t => t.token === rec.token);
  ok('first use is recorded', Boolean(stored && stored.usedAt));

  if (stored) {
    stored.usedAt = Date.now() - (16 * 60 * 1000);   // 16 minutes ago
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');

    const late = await call('GET', `/auth/verify?token=${rec.token}`);
    ok('a stale link is refused', late.status >= 400, `status ${late.status}`);
    ok('and says why', /already been used/i.test(late.json?.error || ''),
      late.json?.error || '(no message)');
  }
}

group('ORDINARY FAILURES STILL FAIL');
{
  const bad = await call('GET', '/auth/verify?token=deadbeefdeadbeef');
  ok('an unknown token is refused', bad.status >= 400, `status ${bad.status}`);

  const none = await call('GET', '/auth/verify');
  ok('a missing token is refused', none.status >= 400, `status ${none.status}`);
}

console.log(`\n${'─'.repeat(52)}`);
console.log(`═══ ${pass} passed, ${fail} failed ═══\n`);
process.exit(fail ? 1 : 0);
